import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { packages } from '#/shared/db/schema/packages.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { members } from '#/shared/db/schema/members.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, moneyString, optionalString, paymentMethodEnum, uuidField } from '#/shared/lib/schemas.ts'
import { chargePaymentMethod } from '#/features/payments/stripe-server.ts'

const getExpiringSubscriptionsSchema = z.object({
  days: z.number().optional().default(7),
  branchId: branchIdField,
})

export const getExpiringSubscriptions = createServerFn({ method: 'GET' })
  .validator((data) => getExpiringSubscriptionsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + data.days)

    const memberIds = data.branchId
      ? (await db.select({ id: members.id }).from(members).where(eq(members.branchId, data.branchId))).map((m) => m.id)
      : undefined

    return await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, now),
        lte(subscriptions.endDate, future),
        memberIds ? inArray(subscriptions.memberId, memberIds) : undefined,
      ),
      orderBy: [desc(subscriptions.endDate)],
      with: {
        member: true,
        package: true,
      },
    })
  })

const getExpiredSubscriptionsSchema = z.object({
  branchId: branchIdField,
})

export const getExpiredSubscriptions = createServerFn({
  method: 'GET',
})
  .validator((data) => getExpiredSubscriptionsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const memberIds = data.branchId
      ? (await db.select({ id: members.id }).from(members).where(eq(members.branchId, data.branchId))).map((m) => m.id)
      : undefined

    return await db.query.subscriptions.findMany({
      where: memberIds
        ? and(eq(subscriptions.status, 'EXPIRED'), inArray(subscriptions.memberId, memberIds))
        : eq(subscriptions.status, 'EXPIRED'),
      orderBy: [desc(subscriptions.endDate)],
      with: {
        member: true,
        package: true,
      },
    })
  })

const renewSubscriptionSchema = z.object({
  memberId: uuidField,
  packageId: uuidField,
  paymentMethod: paymentMethodEnum,
  amount: moneyString,
  notes: optionalString,
  branchId: branchIdField,
})

export type RenewSubscriptionData = z.infer<typeof renewSubscriptionSchema>

export const renewSubscription = createServerFn({ method: 'POST' })
  .validator((data) => renewSubscriptionSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const userId = session.user.id

    const subscription = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: data.branchId
          ? and(
              eq(cashRegisterSessions.status, 'OPEN'),
              eq(cashRegisterSessions.branchId, data.branchId),
            )
          : eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error(
          'Debe abrir la caja antes de renovar una suscripción.',
        )
      }

      const pkg = await tx.query.packages.findFirst({
        where: eq(packages.id, data.packageId),
      })

      if (!pkg) {
        throw new Error('Paquete no encontrado.')
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + pkg.durationDays)

      const [newSubscription] = await tx
        .insert(subscriptions)
        .values({
          memberId: data.memberId,
          packageId: data.packageId,
          totalAmount: pkg?.price ?? data.amount,
          startDate,
          endDate,
          status: 'ACTIVE',
          notes: data.notes,
        })
        .returning()

      const [payment] = await tx
        .insert(membershipPayments)
        .values({
          subscriptionId: newSubscription.id,
          memberId: data.memberId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentDate: new Date(),
          notes: `Renovación de membresía`,
          createdByUserId: userId,
          cashSessionId: openSession.id,
        })
        .returning()

      const member = await tx.query.members.findFirst({
        where: eq(members.id, data.memberId),
      })
      const memberName = member ? member.fullName : `ID ${data.memberId}`

      await tx.insert(cashMovements).values({
        cashSessionId: openSession.id,
        movementType: 'INCOME',
        sourceType: 'MEMBERSHIP_PAYMENT',
        sourceId: payment.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        description: `Renovación de membresía - Socio: ${memberName} (Sub: #${newSubscription.id})`,
      })

      return newSubscription
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'RENEW',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      description: `Renovó suscripción #${subscription.id} para socio #${data.memberId}`,
    })

    return subscription
  })

// ── Core logic (no auth, no audit) for reuse by server fn and cron endpoint ──
export async function runAutoRenewalsCore(
  userId: string,
): Promise<{ renewed: number; message: string }> {
  const settingsRows = await db.select().from(settings).limit(1)
  if (!settingsRows[0]?.enableAutoRenew) {
    return {
      renewed: 0,
      message: 'Renovación automática desactivada en configuración',
    }
  }

  const now = new Date()
  const oneDayFromNow = new Date(now)
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

  const toRenew = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.status, 'ACTIVE'),
      lte(subscriptions.endDate, oneDayFromNow),
    ),
    with: { member: true, package: true },
  })

  if (toRenew.length === 0) {
    return { renewed: 0, message: 'No hay suscripciones para renovar' }
  }

  let renewedCount = 0

  for (const sub of toRenew) {
    try {
      const durationDays = sub.package?.durationDays || 30
      const amount = sub.package?.price || '0'
      const memberId = sub.memberId

      // Try to charge via Stripe if auto-pay is enabled
      let paymentMethod: 'CARD' | 'CASH' = 'CASH'
      let stripePaymentId: string | undefined

      const chargeResult = await chargePaymentMethod(
        memberId,
        amount,
        `Renovación automática - ${sub.member.fullName}`,
      )

      if (chargeResult.success) {
        paymentMethod = 'CARD'
        stripePaymentId = chargeResult.paymentIntentId
      }

      await db.transaction(async (tx) => {
        const openSession = await tx.query.cashRegisterSessions.findFirst({
          where: eq(cashRegisterSessions.status, 'OPEN'),
        })

        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + durationDays)

        const [newSubscription] = await tx
          .insert(subscriptions)
          .values({
            memberId,
            packageId: sub.packageId,
            totalAmount: amount,
            startDate,
            endDate,
            status: 'ACTIVE',
            notes: chargeResult.success
              ? 'Renovación automática (pagada con Stripe)'
              : 'Renovación automática (pago pendiente)',
          })
          .returning()

        const [payment] = await tx
          .insert(membershipPayments)
          .values({
            subscriptionId: newSubscription.id,
            memberId,
            amount: amount,
            paymentMethod: paymentMethod,
            paymentDate: new Date(),
            notes: stripePaymentId
              ? `Pagado con Stripe (${stripePaymentId})`
              : 'Renovación automática (sin tarjeta)',
            createdByUserId: userId,
            cashSessionId: openSession?.id ?? null,
          })
          .returning()

        if (openSession) {
          await tx.insert(cashMovements).values({
            cashSessionId: openSession.id,
            movementType: 'INCOME',
            sourceType: 'MEMBERSHIP_PAYMENT',
            sourceId: payment.id,
            amount: amount,
            paymentMethod: paymentMethod,
            description: `Renovación automática - Socio: ${sub.member.fullName} (Sub: #${newSubscription.id})${stripePaymentId ? ` - Stripe: ${stripePaymentId}` : ''}`,
          })
        }
      })
      renewedCount++
    } catch {
      // skip individual failures, continue with rest
    }
  }

  return {
    renewed: renewedCount,
    message: `Se renovaron ${renewedCount} suscripciones`,
  }
}

// Server function with auth (for manual trigger from UI / notifications)
export const processAutoRenewals = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const result = await runAutoRenewalsCore(session.user.id)

    createAuditLog({
      ...getAuditContext(session),
      action: 'RENEW',
      entityType: 'SUBSCRIPTION',
      description: `Procesó renovaciones automáticas: ${result.renewed} suscripciones renovadas`,
    })

    return result
  },
)

export const getMemberRenewalHistory = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ memberId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    return await db.query.subscriptions.findMany({
      where: eq(subscriptions.memberId, data.memberId),
      orderBy: [desc(subscriptions.startDate)],
      with: {
        package: true,
        payments: {
          orderBy: [desc(membershipPayments.paymentDate)],
        },
      },
    })
  })

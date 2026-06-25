import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPlans } from '#/shared/db/schema/membership-plans.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { members } from '#/shared/db/schema/members.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getExpiringSubscriptions = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().optional().default(7) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + data.days)

    return await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, now),
        lte(subscriptions.endDate, future),
      ),
      orderBy: [desc(subscriptions.endDate)],
      with: {
        member: true,
        plan: true,
      },
    })
  })

export const getExpiredSubscriptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

  return await db.query.subscriptions.findMany({
    where: eq(subscriptions.status, 'EXPIRED'),
    orderBy: [desc(subscriptions.endDate)],
    with: {
      member: true,
      plan: true,
    },
  })
})

const renewSubscriptionSchema = z.object({
  memberId: z.number(),
  planId: z.number(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'QR']),
  amount: z.string(),
  notes: z.string().optional(),
})

export type RenewSubscriptionData = z.infer<typeof renewSubscriptionSchema>

export const renewSubscription = createServerFn({ method: 'POST' })
  .inputValidator((data) => renewSubscriptionSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const userId = session.user.id

    const subscription = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error('Debe abrir la caja antes de renovar una suscripción.')
      }

      const plan = await tx.query.membershipPlans.findFirst({
        where: eq(membershipPlans.id, data.planId),
      })

      if (!plan) {
        throw new Error('Plan no encontrado.')
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.durationDays)

      const [newSubscription] = await tx
        .insert(subscriptions)
        .values({
          memberId: data.memberId,
          planId: data.planId,
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

export const processAutoRenewals = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const userId = session.user.id

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
      with: { member: true, plan: true },
    })

    if (toRenew.length === 0) {
      return { renewed: 0, message: 'No hay suscripciones para renovar' }
    }

    let renewedCount = 0

    for (const sub of toRenew) {
      try {
        await db.transaction(async (tx) => {
          const openSession = await tx.query.cashRegisterSessions.findFirst({
            where: eq(cashRegisterSessions.status, 'OPEN'),
          })

          const startDate = new Date()
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + sub.plan.durationDays)

          const [newSubscription] = await tx
            .insert(subscriptions)
            .values({
              memberId: sub.memberId,
              planId: sub.planId,
              startDate,
              endDate,
              status: 'ACTIVE',
              notes: 'Renovación automática',
            })
            .returning()

          const [payment] = await tx
            .insert(membershipPayments)
            .values({
              subscriptionId: newSubscription.id,
              memberId: sub.memberId,
              amount: sub.plan.price,
              paymentMethod: 'CASH',
              paymentDate: new Date(),
              notes: 'Renovación automática',
              createdByUserId: userId,
              cashSessionId: openSession?.id ?? 0,
            })
            .returning()

          if (openSession) {
            await tx.insert(cashMovements).values({
              cashSessionId: openSession.id,
              movementType: 'INCOME',
              sourceType: 'MEMBERSHIP_PAYMENT',
              sourceId: payment.id,
              amount: sub.plan.price,
              paymentMethod: 'CASH',
              description: `Renovación automática - Socio: ${sub.member.fullName} (Sub: #${newSubscription.id})`,
            })
          }
        })
        renewedCount++
      } catch {
        // skip individual failures, continue with rest
      }
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'RENEW',
      entityType: 'SUBSCRIPTION',
      description: `Procesó renovaciones automáticas: ${renewedCount} suscripciones renovadas`,
    })

    return {
      renewed: renewedCount,
      message: `Se renovaron ${renewedCount} suscripciones`,
    }
  },
)

export const getMemberRenewalHistory = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z.object({ memberId: z.number() }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    return await db.query.subscriptions.findMany({
      where: eq(subscriptions.memberId, data.memberId),
      orderBy: [desc(subscriptions.startDate)],
      with: {
        plan: true,
        payments: {
          orderBy: [desc(membershipPayments.paymentDate)],
        },
      },
    })
  })

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { members } from '#/shared/db/schema/members.ts'
import { packages } from '#/shared/db/schema/packages.ts'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, dateString, moneyString, optionalString, paymentMethodEnum, uuidField } from '#/shared/lib/schemas.ts'

const getSubscriptionsSchema = z.object({
  branchId: branchIdField,
})

export const getSubscriptions = createServerFn({ method: 'GET' })
  .inputValidator((data) => getSubscriptionsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const memberIds = data.branchId
      ? (await db.select({ id: members.id }).from(members).where(eq(members.branchId, data.branchId))).map((m) => m.id)
      : undefined
    return await db.query.subscriptions.findMany({
      where: memberIds ? inArray(subscriptions.memberId, memberIds) : undefined,
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        member: {
          with: {
            branch: true,
          },
        },
        package: true,
      },
    })
  })

const createSubscriptionSchema = z.object({
  memberId: uuidField,
  packageId: uuidField,
  startDate: dateString,
  endDate: dateString,
  amountPaid: moneyString,
  paymentMethod: paymentMethodEnum,
  branchId: branchIdField,
})

export type CreateSubscriptionData = z.infer<typeof createSubscriptionSchema>

export const createSubscription = createServerFn({ method: 'POST' })
  .inputValidator((data) => createSubscriptionSchema.parse(data))
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
          'Debe abrir la caja antes de registrar una suscripción.',
        )
      }

      const pkg = await tx.query.packages.findFirst({
        where: eq(packages.id, data.packageId),
      })

      const [newSubscription] = await tx
        .insert(subscriptions)
        .values({
          memberId: data.memberId,
          packageId: data.packageId,
          totalAmount: pkg?.price ?? data.amountPaid,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: 'ACTIVE',
        })
        .returning()

      const [payment] = await tx
        .insert(membershipPayments)
        .values({
          subscriptionId: newSubscription.id,
          memberId: data.memberId,
          amount: data.amountPaid,
          paymentMethod: data.paymentMethod,
          paymentDate: new Date(),
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
        amount: data.amountPaid,
        paymentMethod: data.paymentMethod,
        description: `Pago de membresía - Socio: ${memberName} (Sub: #${newSubscription.id})`,
      })

      return newSubscription
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      description: `Creó suscripción #${subscription.id} para socio ${data.memberId}`,
    })

    return subscription
  })

export const cancelSubscription = createServerFn({ method: 'POST' })
  .inputValidator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [subscription] = await db
      .update(subscriptions)
      .set({
        status: 'CANCELED',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      description: `Canceló suscripción #${subscription.id}`,
    })

    return subscription
  })

export const getSubscriptionBalance = createServerFn({ method: 'GET' })
  .inputValidator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
      with: { package: true, member: true, payments: true },
    })

    if (!sub) return null

    const totalPaid = sub.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    )
    const totalAmount = sub.totalAmount
      ? Number(sub.totalAmount)
      : totalPaid

    return {
      ...sub,
      totalPaid,
      totalAmount,
      remainingBalance: Math.max(0, totalAmount - totalPaid),
      paymentCount: sub.payments.length,
    }
  })

const getSubscriptionsWithBalanceSchema = z.object({
  branchId: branchIdField,
})

export const getSubscriptionsWithBalance = createServerFn({
  method: 'GET',
})
  .inputValidator((data) => getSubscriptionsWithBalanceSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const memberIds = data.branchId
      ? (
          await db
            .select({ id: members.id })
            .from(members)
            .where(eq(members.branchId, data.branchId))
        ).map((m) => m.id)
      : undefined

    const subs = await db.query.subscriptions.findMany({
      where: memberIds
        ? inArray(subscriptions.memberId, memberIds)
        : undefined,
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        member: { with: { branch: true } },
        package: true,
        payments: true,
      },
    })

    return subs.map((sub) => {
      const totalPaid = sub.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      )
      const totalAmount = sub.totalAmount
        ? Number(sub.totalAmount)
        : totalPaid
      return {
        ...sub,
        totalPaid,
        totalAmount,
        remainingBalance: Math.max(0, totalAmount - totalPaid),
        paymentCount: sub.payments.length,
      }
    })
  })

export const recordAdditionalPayment = createServerFn({ method: 'POST' })
  .inputValidator((data) =>
    z
      .object({
        subscriptionId: uuidField,
        memberId: uuidField,
        amount: moneyString,
        paymentMethod: paymentMethodEnum,
        notes: optionalString,
        branchId: branchIdField,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const payment = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: data.branchId
          ? and(
              eq(cashRegisterSessions.status, 'OPEN'),
              eq(cashRegisterSessions.branchId, data.branchId),
            )
          : eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error('Debe abrir la caja antes de registrar un pago.')
      }

      const [newPayment] = await tx
        .insert(membershipPayments)
        .values({
          memberId: data.memberId,
          subscriptionId: data.subscriptionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          createdByUserId: session.user.id,
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
        sourceId: newPayment.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        description: `Pago parcial de membresía - Socio: ${memberName} (Sub: #${data.subscriptionId})`,
      })

      return newPayment
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Registró pago adicional para suscripción #${data.subscriptionId}`,
    })

    return payment
  })

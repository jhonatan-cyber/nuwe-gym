import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getSubscriptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.subscriptions.findMany({
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        member: true,
        plan: true,
      },
    })
  },
)

const createSubscriptionSchema = z.object({
  memberId: z.number(),
  planId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  amountPaid: z.string(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'QR']),
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
        where: eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error(
          'Debe abrir la caja antes de registrar una suscripción.',
        )
      }

      const [newSubscription] = await tx
        .insert(subscriptions)
        .values({
          memberId: data.memberId,
          planId: data.planId,
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
  .inputValidator((id) => z.number().parse(id))
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

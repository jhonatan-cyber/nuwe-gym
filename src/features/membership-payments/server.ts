import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

const getMembershipPaymentsSchema = z.object({
  branchId: z.string().optional(),
})

export const getMembershipPayments = createServerFn({ method: 'GET' })
  .inputValidator((data) => getMembershipPaymentsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const memberIds = data.branchId
      ? (await db.select({ id: members.id }).from(members).where(eq(members.branchId, data.branchId))).map((m) => m.id)
      : undefined
    return await db.query.membershipPayments.findMany({
      where: memberIds ? inArray(membershipPayments.memberId, memberIds) : undefined,
      orderBy: [desc(membershipPayments.paymentDate)],
      with: {
        member: true,
        subscription: {
          with: {
            plan: true,
            package: true,
          },
        },
        createdBy: true,
      },
    })
  })

const createDirectPaymentSchema = z.object({
  memberId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  amount: z.string(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'QR']),
  notes: z.string().optional(),
  branchId: z.string().optional(),
})

export const createDirectPayment = createServerFn({ method: 'POST' })
  .inputValidator((data) => createDirectPaymentSchema.parse(data))
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
        description: `Pago directo de membresía - Socio: ${memberName} (Sub: #${data.subscriptionId})`,
      })

      return newPayment
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Registró pago de membresía #${payment.id}`,
    })

    return payment
  })

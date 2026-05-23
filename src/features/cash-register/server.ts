import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { cashRegisterSessions, cashMovements } from '#/shared/db/schema/cash-register.ts'
import { eq, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getCurrentCashSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const session = await db.query.cashRegisterSessions.findFirst({
      where: eq(cashRegisterSessions.status, 'OPEN'),
      with: {
        openedBy: true,
      },
    })
    return session || null
  },
)

const openCashSessionSchema = z.object({
  openingAmount: z.string(),
  notes: z.string().optional(),
})

export const openCashSession = createServerFn({ method: 'POST' })
  .inputValidator((data) => openCashSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const openSession = await db.query.cashRegisterSessions.findFirst({
      where: eq(cashRegisterSessions.status, 'OPEN'),
    })

    if (openSession) {
      throw new Error('Ya existe una sesión de caja abierta.')
    }

    const [newSession] = await db
      .insert(cashRegisterSessions)
      .values({
        openedByUserId: session.user.id,
        openingAmount: data.openingAmount,
        expectedClosingAmount: data.openingAmount,
        status: 'OPEN',
        notes: data.notes || null,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CASH_REGISTER',
      entityId: newSession.id,
      description: 'Abrió sesión de caja',
      details: { openingAmount: data.openingAmount },
    })

    return newSession
  })

const closeCashSessionSchema = z.object({
  actualClosingAmount: z.string(),
  notes: z.string().optional(),
})

export const closeCashSession = createServerFn({ method: 'POST' })
  .inputValidator((data) => closeCashSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const userSession = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const closedSession = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error('No hay ninguna sesión de caja abierta.')
      }

      const movements = await tx
        .select()
        .from(cashMovements)
        .where(eq(cashMovements.cashSessionId, openSession.id))

      let cashBalance = Number(openSession.openingAmount)
      for (const m of movements) {
        if (m.paymentMethod === 'CASH') {
          if (m.movementType === 'INCOME') {
            cashBalance += Number(m.amount)
          } else {
            cashBalance -= Number(m.amount)
          }
        }
      }

      const expectedClosingAmount = cashBalance.toFixed(2)
      const actualClosingAmount = Number(data.actualClosingAmount)
      const difference = (actualClosingAmount - cashBalance).toFixed(2)

      const [closedSession] = await tx
        .update(cashRegisterSessions)
        .set({
          closedByUserId: userSession.user.id,
          expectedClosingAmount,
          actualClosingAmount: data.actualClosingAmount,
          difference,
          closedAt: new Date(),
          status: 'CLOSED',
          notes: data.notes || null,
        })
        .where(eq(cashRegisterSessions.id, openSession.id))
        .returning()

      return closedSession
    })

    createAuditLog({
      ...getAuditContext(userSession),
      action: 'UPDATE',
      entityType: 'CASH_REGISTER',
      entityId: closedSession.id,
      description: 'Cerró sesión de caja',
      details: { expectedClosingAmount: closedSession.expectedClosingAmount, difference: closedSession.difference },
    })

    return closedSession
  })

const createManualMovementSchema = z.object({
  amount: z.string(),
  movementType: z.enum(['INCOME', 'EXPENSE']),
  description: z.string(),
})

export const createManualMovement = createServerFn({ method: 'POST' })
  .inputValidator((data) => createManualMovementSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const movement = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error('Debe abrir la caja antes de registrar un movimiento.')
      }

      const [movement] = await tx
        .insert(cashMovements)
        .values({
          cashSessionId: openSession.id,
          movementType: data.movementType,
          sourceType: 'MANUAL',
          amount: data.amount,
          paymentMethod: 'CASH',
          description: data.description,
        })
        .returning()

      return movement
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CASH_REGISTER',
      entityId: movement.id,
      description: `Registró movimiento manual de caja: ${data.description}`,
      details: { amount: data.amount, movementType: data.movementType },
    })

    return movement
  })

const getCashSessionDetailsSchema = z.object({
  sessionId: z.number(),
})

export const getCashSessionDetails = createServerFn({ method: 'GET' })
  .inputValidator((data) => getCashSessionDetailsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const session = await db.query.cashRegisterSessions.findFirst({
      where: eq(cashRegisterSessions.id, data.sessionId),
      with: {
        openedBy: true,
      },
    })

    const movements = await db.query.cashMovements.findMany({
      where: eq(cashMovements.cashSessionId, data.sessionId),
      orderBy: [desc(cashMovements.createdAt)],
    })

    return {
      session,
      movements,
    }
  })

export const getCashSessionsList = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.query.cashRegisterSessions.findMany({
      orderBy: [desc(cashRegisterSessions.openedAt)],
      with: {
        openedBy: true,
      },
    })
  },
)

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { cashMovements, cashRegisterSessions } from '#/shared/db/schema/cash-register.ts'
import { eq, and } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import {
  getCurrentCashSessionSchema,
  openCashSessionSchema,
  closeCashSessionSchema,
  createManualMovementSchema,
  getCashSessionDetailsSchema,
  getCashSessionsListSchema,
  deleteCashSessionSchema,
} from './cash-register.schema.ts'
import * as repo from './cash-register.repository.ts'

export const getCurrentCashSession = createServerFn({ method: 'GET' })
  .validator((data) => getCurrentCashSessionSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'cash:read' } })
    return (await repo.findOpenSession(data.branchId)) || null
  })

export const getAllOpenCashSessions = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requirePermission({ data: { permission: 'cash:read' } })
    return await repo.findAllOpenSessions()
  })

export const openCashSession = createServerFn({ method: 'POST' })
  .validator((data) => openCashSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'cash:write' },
    })

    const existing = await repo.findOpenSession(data.branchId)
    if (existing) {
      throw new Error('Ya existe una sesión de caja abierta.')
    }

    const [newSession] = await repo.insertSession({
      ...data,
      openedByUserId: session.user.id,
    })

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

export const closeCashSession = createServerFn({ method: 'POST' })
  .validator((data) => closeCashSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const userSession = await requirePermission({
      data: { permission: 'cash:write' },
    })

    const closedSession = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: data.branchId
          ? and(eq(cashRegisterSessions.status, 'OPEN'), eq(cashRegisterSessions.branchId, data.branchId))
          : eq(cashRegisterSessions.status, 'OPEN'),
        with: { openedBy: true },
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
          cashBalance += m.movementType === 'INCOME' ? Number(m.amount) : -Number(m.amount)
        }
      }

      const expectedClosingAmount = cashBalance.toFixed(2)
      const difference = (Number(data.actualClosingAmount) - cashBalance).toFixed(2)

      const [closed] = await tx
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
      return closed
    })

    createAuditLog({
      ...getAuditContext(userSession),
      action: 'UPDATE',
      entityType: 'CASH_REGISTER',
      entityId: closedSession.id,
      description: 'Cerró sesión de caja',
      details: {
        expectedClosingAmount: closedSession.expectedClosingAmount,
        difference: closedSession.difference,
      },
    })

    return closedSession
  })

export const createManualMovement = createServerFn({ method: 'POST' })
  .validator((data) => createManualMovementSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'cash:write' },
    })

    const movement = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: data.branchId
          ? and(eq(cashRegisterSessions.status, 'OPEN'), eq(cashRegisterSessions.branchId, data.branchId))
          : eq(cashRegisterSessions.status, 'OPEN'),
      })
      if (!openSession) {
        throw new Error('Debe abrir la caja antes de registrar un movimiento.')
      }

      const [m] = await tx
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
      return m
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

export const getCashSessionDetails = createServerFn({ method: 'GET' })
  .validator((data) => getCashSessionDetailsSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'cash:read' } })
    const [session, movements] = await Promise.all([
      repo.findSessionById(data.sessionId),
      repo.findMovementsBySession(data.sessionId),
    ])
    return { session, movements }
  })

export const getCashSessionsList = createServerFn({ method: 'GET' })
  .validator((data) => getCashSessionsListSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'cash:read' } })
    return repo.findAllSessions(data.branchId)
  })

export const deleteCashSession = createServerFn({ method: 'POST' })
  .validator((data) => deleteCashSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requirePermission({ data: { permission: 'cash:write' } })

    const session = await repo.findSessionById(data.sessionId)
    if (!session) throw new Error('Sesión no encontrada')

    await repo.deleteCashSession(data.sessionId)

    createAuditLog({
      ...getAuditContext(user),
      action: 'DELETE',
      entityType: 'CASH_REGISTER',
      entityId: data.sessionId,
      description: `Eliminó sesión de caja (${session.branchId || 'sin sucursal'})`,
      details: { openingAmount: session.openingAmount, status: session.status },
    })
  })

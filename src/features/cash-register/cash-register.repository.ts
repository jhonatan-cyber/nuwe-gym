import { db } from '#/shared/db/index.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { eq, and, desc } from 'drizzle-orm'
import type { OpenCashSessionInput } from './cash-register.schema.ts'

// --- Sessions ---

export function findOpenSession(branchId?: string) {
  return db.query.cashRegisterSessions.findFirst({
    where: branchId
      ? and(
          eq(cashRegisterSessions.status, 'OPEN'),
          eq(cashRegisterSessions.branchId, branchId),
        )
      : eq(cashRegisterSessions.status, 'OPEN'),
    with: { openedBy: true },
  })
}

export function findAllOpenSessions() {
  return db.query.cashRegisterSessions.findMany({
    where: eq(cashRegisterSessions.status, 'OPEN'),
    orderBy: [desc(cashRegisterSessions.openedAt)],
    with: { openedBy: true, branch: true },
  })
}

export function deleteCashSession(id: string) {
  return db.delete(cashRegisterSessions).where(eq(cashRegisterSessions.id, id))
}

export function insertSession(data: OpenCashSessionInput & { openedByUserId: string }) {
  return db
    .insert(cashRegisterSessions)
    .values({
      openedByUserId: data.openedByUserId,
      openingAmount: data.openingAmount,
      expectedClosingAmount: data.openingAmount,
      status: 'OPEN',
      notes: data.notes || null,
      branchId: data.branchId ?? null,
    })
    .returning()
}

export function findSessionById(id: string) {
  return db.query.cashRegisterSessions.findFirst({
    where: eq(cashRegisterSessions.id, id),
    with: { openedBy: true },
  })
}

export function findAllSessions(branchId?: string) {
  return db.query.cashRegisterSessions.findMany({
    where: branchId
      ? eq(cashRegisterSessions.branchId, branchId)
      : undefined,
    orderBy: [desc(cashRegisterSessions.openedAt)],
    with: { openedBy: true },
  })
}

// --- Movements ---

export function findMovementsBySession(sessionId: string) {
  return db.query.cashMovements.findMany({
    where: eq(cashMovements.cashSessionId, sessionId),
    orderBy: [desc(cashMovements.createdAt)],
  })
}



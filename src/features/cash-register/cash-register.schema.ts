import { z } from 'zod'
import { branchIdField, moneyString, optionalString, uuidField } from '#/shared/lib/schemas.ts'

export const getCurrentCashSessionSchema = z.object({
  branchId: branchIdField,
})

export const openCashSessionSchema = z.object({
  openingAmount: moneyString,
  notes: optionalString,
  branchId: branchIdField,
})

export const closeCashSessionSchema = z.object({
  actualClosingAmount: moneyString,
  notes: z.string().optional(),
  branchId: branchIdField,
})

export const createManualMovementSchema = z.object({
  amount: moneyString,
  movementType: z.enum(['INCOME', 'EXPENSE']),
  description: z.string(),
  branchId: branchIdField,
})

export const getCashSessionDetailsSchema = z.object({
  sessionId: uuidField,
})

export const getCashSessionsListSchema = z.object({
  branchId: branchIdField,
})

export const deleteCashSessionSchema = z.object({
  sessionId: uuidField,
})

export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>
export type CloseCashSessionInput = z.infer<typeof closeCashSessionSchema>
export type CreateManualMovementInput = z.infer<typeof createManualMovementSchema>

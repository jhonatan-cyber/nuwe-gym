import { z } from 'zod'

/** Verifica que una fecha YYYY-MM-DD sea real (Feb 29 solo en bisiesto, etc.). */
function isValidDate(fecha: string): boolean {
  const [y, m, d] = fecha.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

// ── UUID ──────────────────────────────────────────────────────────

/** Required UUID – entity IDs, relation fields, etc. */
export const uuidField = z.string().uuid()

/** Optional UUID – branch IDs, optional relations. */
export const branchIdField = z.string().uuid().optional()

// ── Strings ───────────────────────────────────────────────────────

/** Required non-empty string – names, document numbers, etc. */
export const requiredString = z.string().min(1)

/** Required date string (ISO 8601: YYYY-MM-DD) – startDate, endDate, etc. */
export const dateString = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    'Formato ISO 8601: YYYY-MM-DD',
  )
  .refine(isValidDate, 'Fecha inválida (ej. Feb 29 solo en año bisiesto)')

/** Optional date string (ISO 8601: YYYY-MM-DD) – birthDate, dateFrom, dateTo, etc. */
export const optionalDateString = dateString.optional()

/** Generic optional string – search, address, color, etc. */
export const optionalString = z.string().optional()

/** Time string (HH:mm) – startTime, endTime, openingTime, closingTime, etc. */
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:mm')

// ── Numbers ───────────────────────────────────────────────────────

/** String-encoded positive money amount (ej. "15000.00") – prices, payments, etc. */
export const moneyString = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido')

/** Non-negative number (>= 0) – stock, days, counts, etc. */
export const positiveNumber = z.number().min(0)

/** Non-negative integer (>= 0) – counts, limits, etc. */
export const positiveInt = z.number().int().min(0)

/** Positive integer (>= 1) – durationDays, capacity, etc. */
export const positiveIntMin1 = z.number().int().min(1)

/** Day of week (0-6, Sun-Sat) – schedules, allowed days, etc. */
export const dayOfWeek = z.number().int().min(0).max(6)

// ── Enums ─────────────────────────────────────────────────────────

/** Payment methods used across subscriptions, renewals, sales, payments. */
export const paymentMethodEnum = z.enum(['CASH', 'CARD', 'TRANSFER', 'QR'])

export type PaymentMethod = z.infer<typeof paymentMethodEnum>

/** Member statuses for member CRUD, filtering, and display. */
export const memberStatusValues = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELED'] as const
export const memberStatusEnum = z.enum(memberStatusValues)

export type MemberStatus = z.infer<typeof memberStatusEnum>

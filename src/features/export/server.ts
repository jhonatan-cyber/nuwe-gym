import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { formatDate } from '#/shared/lib/formatters.ts'
import { z } from 'zod'
import { optionalDateString } from '#/shared/lib/schemas.ts'
import * as XLSX from 'xlsx'

// ── CSV helpers ────────────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) => row.map(csvEscape).join(','))
  return [headerLine, ...dataLines].join('\n')
}

// ponytail: xlsx helper — same data, different format
function toXLSX(headers: string[], rows: string[][]): string {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  const buf = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
  return buf
}

// ── Schemas ────────────────────────────────────────────────────────

const exportMembersSchema = z.object({
  format: z.enum(['csv']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional(),
})

const exportMembersExcelSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional(),
})

const dateRangeSchema = z.object({
  format: z.enum(['csv']),
  startDate: optionalDateString,
  endDate: optionalDateString,
})

const dateRangeExcelSchema = z.object({
  startDate: optionalDateString,
  endDate: optionalDateString,
})

// ── Members ────────────────────────────────────────────────────────

export const exportMembers = createServerFn({ method: 'GET' })
  .inputValidator((data) => exportMembersSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const whereClause =
      data.status && data.status !== 'ALL'
        ? eq(members.status, data.status)
        : undefined

    const result = await db.query.members.findMany({
      where: whereClause,
      orderBy: [desc(members.createdAt)],
    })

    const rows = result.map((m) => [
      m.fullName,
      m.email ?? '',
      m.phone ?? '',
      m.documentNumber ?? '',
      formatDate(m.birthDate),
      m.emergencyContactName ?? '',
      m.emergencyContactPhone ?? '',
      formatDate(m.createdAt),
    ])

    return toCSV(
      [
        'Name',
        'Email',
        'Phone',
        'Document',
        'Date of Birth',
        'Emergency Contact',
        'Emergency Phone',
        'Created At',
      ],
      rows,
    )
  })

export const exportMembersExcel = createServerFn({ method: 'GET' })
  .inputValidator((data) => exportMembersExcelSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const whereClause =
      data.status && data.status !== 'ALL'
        ? eq(members.status, data.status)
        : undefined

    const result = await db.query.members.findMany({
      where: whereClause,
      orderBy: [desc(members.createdAt)],
    })

    const headers = ['Nombre', 'Email', 'Teléfono', 'Documento', 'Fecha Nac.', 'Contacto Emerg.', 'Tel. Emerg.', 'Creado']
    const rows = result.map((m) => [
      m.fullName,
      m.email ?? '',
      m.phone ?? '',
      m.documentNumber ?? '',
      formatDate(m.birthDate),
      m.emergencyContactName ?? '',
      m.emergencyContactPhone ?? '',
      formatDate(m.createdAt),
    ])

    return toXLSX(headers, rows)
  })

// ── Sales ──────────────────────────────────────────────────────────

export const exportSales = createServerFn({ method: 'GET' })
  .inputValidator((data) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const start = data.startDate ? new Date(data.startDate) : undefined
    const end = data.endDate ? new Date(data.endDate + 'T23:59:59') : undefined

    const result = await db.query.sales.findMany({
      where: and(
        eq(sales.status, 'COMPLETED'),
        start ? gte(sales.soldAt, start) : undefined,
        end ? lte(sales.soldAt, end) : undefined,
      ),
      with: {
        items: { with: { product: true } },
      },
      orderBy: [desc(sales.soldAt)],
    })

    const paymentLabels: Record<string, string> = {
      CASH: 'Cash', QR: 'QR', TRANSFER: 'Transfer', CARD: 'Card',
    }
    const statusLabels: Record<string, string> = {
      COMPLETED: 'Completed', CANCELED: 'Canceled',
    }

    const rows = result.map((sale) => {
      const itemNames = sale.items
        .map((item) => `${item.product.name} (x${item.quantity})`)
        .join('; ')
      return [
        sale.id.toString(),
        formatDate(sale.soldAt),
        itemNames,
        sale.total,
        sale.paymentMethod
          ? (paymentLabels[sale.paymentMethod] ?? sale.paymentMethod)
          : '-',
        statusLabels[sale.status] ?? sale.status,
      ]
    })

    return toCSV(
      ['Sale ID', 'Date', 'Items', 'Total', 'Payment Method', 'Status'],
      rows,
    )
  })

export const exportSalesExcel = createServerFn({ method: 'GET' })
  .inputValidator((data) => dateRangeExcelSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const start = data.startDate ? new Date(data.startDate) : undefined
    const end = data.endDate ? new Date(data.endDate + 'T23:59:59') : undefined

    const result = await db.query.sales.findMany({
      where: and(
        eq(sales.status, 'COMPLETED'),
        start ? gte(sales.soldAt, start) : undefined,
        end ? lte(sales.soldAt, end) : undefined,
      ),
      with: {
        items: { with: { product: true } },
      },
      orderBy: [desc(sales.soldAt)],
    })

    const paymentLabels: Record<string, string> = {
      CASH: 'Efectivo', QR: 'QR', TRANSFER: 'Transferencia', CARD: 'Tarjeta',
    }
    const statusLabels: Record<string, string> = {
      COMPLETED: 'Completada', CANCELED: 'Cancelada',
    }

    const headers = ['ID', 'Fecha', 'Items', 'Total', 'Método', 'Estado']
    const rows = result.map((sale) => {
      const itemNames = sale.items
        .map((item) => `${item.product.name} (x${item.quantity})`)
        .join('; ')
      return [
        sale.id.toString(),
        formatDate(sale.soldAt),
        itemNames,
        sale.total,
        sale.paymentMethod
          ? (paymentLabels[sale.paymentMethod] ?? sale.paymentMethod)
          : '-',
        statusLabels[sale.status] ?? sale.status,
      ]
    })

    return toXLSX(headers, rows)
  })

// ── Payments ───────────────────────────────────────────────────────

export const exportPayments = createServerFn({ method: 'GET' })
  .inputValidator((data) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const start = data.startDate ? new Date(data.startDate) : undefined
    const end = data.endDate ? new Date(data.endDate + 'T23:59:59') : undefined

    const result = await db.query.membershipPayments.findMany({
      where: and(
        start ? gte(membershipPayments.paymentDate, start) : undefined,
        end ? lte(membershipPayments.paymentDate, end) : undefined,
      ),
      with: { member: true },
      orderBy: [desc(membershipPayments.paymentDate)],
    })

    const paymentLabels: Record<string, string> = {
      CASH: 'Cash', QR: 'QR', TRANSFER: 'Transfer', CARD: 'Card',
    }

    const rows = result.map((p) => [
      p.id.toString(),
      formatDate(p.paymentDate),
      p.member.fullName,
      p.amount,
      paymentLabels[p.paymentMethod] ?? p.paymentMethod,
      p.subscriptionId.toString(),
    ])

    return toCSV(
      ['Payment ID', 'Date', 'Member Name', 'Amount', 'Method', 'Subscription ID'],
      rows,
    )
  })

export const exportPaymentsExcel = createServerFn({ method: 'GET' })
  .inputValidator((data) => dateRangeExcelSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const start = data.startDate ? new Date(data.startDate) : undefined
    const end = data.endDate ? new Date(data.endDate + 'T23:59:59') : undefined

    const result = await db.query.membershipPayments.findMany({
      where: and(
        start ? gte(membershipPayments.paymentDate, start) : undefined,
        end ? lte(membershipPayments.paymentDate, end) : undefined,
      ),
      with: { member: true },
      orderBy: [desc(membershipPayments.paymentDate)],
    })

    const paymentLabels: Record<string, string> = {
      CASH: 'Efectivo', QR: 'QR', TRANSFER: 'Transferencia', CARD: 'Tarjeta',
    }

    const headers = ['ID', 'Fecha', 'Socio', 'Monto', 'Método', 'Suscripción']
    const rows = result.map((p) => [
      p.id.toString(),
      formatDate(p.paymentDate),
      p.member.fullName,
      p.amount,
      paymentLabels[p.paymentMethod] ?? p.paymentMethod,
      p.subscriptionId.toString(),
    ])

    return toXLSX(headers, rows)
  })

// ── Check-ins ──────────────────────────────────────────────────────

export const exportCheckIns = createServerFn({ method: 'GET' })
  .inputValidator((data) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    const start = data.startDate ? new Date(data.startDate) : undefined
    const end = data.endDate ? new Date(data.endDate + 'T23:59:59') : undefined

    const result = await db.query.checkIns.findMany({
      where: and(
        start ? gte(checkIns.checkedInAt, start) : undefined,
        end ? lte(checkIns.checkedInAt, end) : undefined,
      ),
      with: { member: true },
      orderBy: [desc(checkIns.checkedInAt)],
    })

    const resultLabels: Record<string, string> = {
      ALLOWED: 'Allowed',
      DENIED_EXPIRED: 'Denied - Expired',
      DENIED_INACTIVE: 'Denied - Inactive',
      DENIED_SUSPENDED: 'Denied - Suspended',
    }

    const rows = result.map((c) => [
      c.id.toString(),
      formatDate(c.checkedInAt),
      c.member.fullName,
      resultLabels[c.resultStatus] ?? c.resultStatus,
    ])

    return toCSV(['Check-in ID', 'Date', 'Member Name', 'Result Status'], rows)
  })

export const exportCheckInsExcel = createServerFn({ method: 'GET' })
  .inputValidator((data) => dateRangeExcelSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    const start = data.startDate ? new Date(data.startDate) : undefined
    const end = data.endDate ? new Date(data.endDate + 'T23:59:59') : undefined

    const result = await db.query.checkIns.findMany({
      where: and(
        start ? gte(checkIns.checkedInAt, start) : undefined,
        end ? lte(checkIns.checkedInAt, end) : undefined,
      ),
      with: { member: true },
      orderBy: [desc(checkIns.checkedInAt)],
    })

    const resultLabels: Record<string, string> = {
      ALLOWED: 'Permitido',
      DENIED_EXPIRED: 'Denegado - Vencido',
      DENIED_INACTIVE: 'Denegado - Inactivo',
      DENIED_SUSPENDED: 'Denegado - Suspendido',
    }

    const headers = ['ID', 'Fecha', 'Socio', 'Resultado']
    const rows = result.map((c) => [
      c.id.toString(),
      formatDate(c.checkedInAt),
      c.member.fullName,
      resultLabels[c.resultStatus] ?? c.resultStatus,
    ])

    return toXLSX(headers, rows)
  })

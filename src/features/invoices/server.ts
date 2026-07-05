import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { invoices, invoiceSequences } from '#/shared/db/schema/invoices.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { eq, desc, and, isNull } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, uuidField } from '#/shared/lib/schemas.ts'

// ── Helpers ──

/**
 * Atomically get the next invoice number for a branch/year.
 * Format: F-{year}-{padded 4-digit number}
 */
async function getNextInvoiceNumber(branchId?: string | null): Promise<string> {
  const year = new Date().getFullYear()

  // Use a transaction to atomically increment the counter
  const result = await db.transaction(async (tx) => {
    const seq = await tx.query.invoiceSequences.findFirst({
      where: and(
        branchId
          ? eq(invoiceSequences.branchId, branchId)
          : isNull(invoiceSequences.branchId),
        eq(invoiceSequences.year, year),
      ),
    })

    let nextNumber = 1
    if (seq) {
      nextNumber = seq.lastNumber + 1
      await tx
        .update(invoiceSequences)
        .set({ lastNumber: nextNumber, updatedAt: new Date() })
        .where(eq(invoiceSequences.id, seq.id))
    } else {
      await tx.insert(invoiceSequences).values({
        branchId: branchId ?? null,
        year,
        lastNumber: 1,
      })
    }

    return nextNumber
  })

  return `F-${year}-${String(result).padStart(4, '0')}`
}

/**
 * Get the applicable tax rate from settings.
 */
async function getTaxRate(): Promise<number> {
  const [setting] = await db.select({ taxRate: settings.taxRate }).from(settings).limit(1)
  return Number(setting?.taxRate ?? 0)
}

// ── Issue Invoice ──

const issueInvoiceSchema = z.object({
  sourceType: z.enum(['MEMBERSHIP_PAYMENT', 'SALE']),
  sourceId: uuidField,
  branchId: branchIdField,
  notes: z.string().optional(),
})

export const issueInvoice = createServerFn({ method: 'POST' })
  .validator((data) => issueInvoiceSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'payments:write' } })

    // Check not already invoiced
    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.sourceType, data.sourceType),
        eq(invoices.sourceId, data.sourceId),
      ),
    })
    if (existing) throw new Error('Esta transacción ya tiene una factura emitida')

    let subtotal = 0
    let discount = 0
    let total = 0
    let memberId: string | null = null
    let customerName = ''
    let customerDocNumber = ''

    if (data.sourceType === 'SALE') {
      const sale = await db.query.sales.findFirst({
        where: eq(sales.id, data.sourceId),
        with: { member: true },
      })
      if (!sale) throw new Error('Venta no encontrada')

      subtotal = Number(sale.subtotal)
      discount = Number(sale.discount)
      total = Number(sale.total)
      memberId = sale.memberId
      customerName = sale.customerName ?? sale.member?.fullName ?? 'Cliente'
      customerDocNumber = sale.member?.documentNumber ?? ''
    } else {
      const payment = await db.query.membershipPayments.findFirst({
        where: eq(membershipPayments.id, data.sourceId),
        with: {
          member: true,
          subscription: { with: { package: true } },
        },
      })
      if (!payment) throw new Error('Pago no encontrado')

      subtotal = Number(payment.amount)
      total = Number(payment.amount)
      memberId = payment.memberId
      customerName = payment.member?.fullName ?? 'Socio'
      customerDocNumber = payment.member?.documentNumber ?? ''
    }

    const taxRate = await getTaxRate()
    const taxAmount = parseFloat((subtotal * taxRate / 100).toFixed(2))

    const invoiceNumber = await getNextInvoiceNumber(data.branchId)

    const [invoice] = await db.insert(invoices).values({
      invoiceNumber,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      memberId,
      customerName,
      customerDocNumber,
      subtotal: String(subtotal),
      taxRate: String(taxRate),
      taxAmount: String(taxAmount),
      discount: String(discount),
      total: String(total),
      notes: data.notes ?? null,
      branchId: data.branchId ?? null,
      createdByUserId: session.user.id,
      issuedAt: new Date(),
    }).returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoice.id,
      description: `Emitió factura ${invoiceNumber} por ${data.sourceType}`,
    })

    return invoice
  })

// ── List Invoices ──

const getInvoicesSchema = z.object({
  branchId: branchIdField,
})

export const getInvoices = createServerFn({ method: 'GET' })
  .validator((data) => getInvoicesSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'payments:read' } })
    return await db.query.invoices.findMany({
      where: data.branchId ? eq(invoices.branchId, data.branchId) : undefined,
      orderBy: [desc(invoices.issuedAt)],
      with: {
        member: { columns: { id: true, fullName: true, documentNumber: true } },
        createdBy: { columns: { id: true, name: true } },
        branch: { columns: { id: true, name: true } },
      },
    })
  })

// ── Get Single Invoice ──

export const getInvoiceById = createServerFn({ method: 'GET' })
  .validator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requirePermission({ data: { permission: 'payments:read' } })
    const [inv] = await db.query.invoices.findMany({
      where: eq(invoices.id, id),
      with: {
        member: { columns: { id: true, fullName: true, documentNumber: true, phone: true, email: true, address: true } },
        createdBy: { columns: { id: true, name: true } },
        branch: { columns: { id: true, name: true } },
      },
      limit: 1,
    })
    if (!inv) return null

    // Get source details
    let sourceDetail = null
    if (inv.sourceType === 'SALE') {
      const sale = await db.query.sales.findFirst({
        where: eq(sales.id, inv.sourceId),
        with: {
          items: {
            with: { product: true },
          },
        },
      })
      sourceDetail = sale
    } else {
      const payment = await db.query.membershipPayments.findFirst({
        where: eq(membershipPayments.id, inv.sourceId),
        with: {
          subscription: { with: { package: true } },
        },
      })
      sourceDetail = payment
    }

    return { ...inv, sourceDetail }
  })

// ── Cancel Invoice ──

export const cancelInvoice = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'payments:write' } })
    const [inv] = await db.update(invoices).set({
      status: 'CANCELED',
      updatedAt: new Date(),
    }).where(eq(invoices.id, data.id)).returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'INVOICE',
      entityId: data.id,
      description: `Anuló factura ${inv.invoiceNumber}`,
    })
    return inv
  })

// ── Auto-issue: hook to call after payment/sale creation ──

export async function autoIssueInvoice(
  sourceType: 'MEMBERSHIP_PAYMENT' | 'SALE',
  sourceId: string,
  branchId?: string | null,
): Promise<void> {
  try {
    // Check if already exists
    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.sourceType, sourceType),
        eq(invoices.sourceId, sourceId),
      ),
    })
    if (existing) return

    const taxRate = await getTaxRate()

    let subtotal = 0
    let discount = 0
    let total = 0
    let memberId: string | null = null
    let customerName = ''
    let customerDocNumber = ''

    if (sourceType === 'SALE') {
      const sale = await db.query.sales.findFirst({
        where: eq(sales.id, sourceId),
        with: { member: true },
      })
      if (!sale) return
      subtotal = Number(sale.subtotal)
      discount = Number(sale.discount)
      total = Number(sale.total)
      memberId = sale.memberId
      customerName = sale.customerName ?? sale.member?.fullName ?? 'Cliente'
      customerDocNumber = sale.member?.documentNumber ?? ''
    } else {
      const payment = await db.query.membershipPayments.findFirst({
        where: eq(membershipPayments.id, sourceId),
        with: { member: true, subscription: { with: { package: true } } },
      })
      if (!payment) return
      subtotal = Number(payment.amount)
      total = Number(payment.amount)
      memberId = payment.memberId
      customerName = payment.member?.fullName ?? 'Socio'
      customerDocNumber = payment.member?.documentNumber ?? ''
    }

    const taxAmount = parseFloat((subtotal * taxRate / 100).toFixed(2))
    const invoiceNumber = await getNextInvoiceNumber(branchId)

    await db.insert(invoices).values({
      invoiceNumber,
      sourceType,
      sourceId,
      memberId,
      customerName,
      customerDocNumber,
      subtotal: String(subtotal),
      taxRate: String(taxRate),
      taxAmount: String(taxAmount),
      discount: String(discount),
      total: String(total),
      branchId: branchId ?? null,
      createdByUserId: null,
      issuedAt: new Date(),
    })
  } catch (err) {
    console.error('[autoIssueInvoice] Error:', err)
  }
}

// ── Invoice Stats ──

export const getInvoiceStats = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requirePermission({ data: { permission: 'payments:read' } })
    const all = await db.select().from(invoices)
    const issued = all.filter((i) => i.status === 'ISSUED').length
    const canceled = all.filter((i) => i.status === 'CANCELED').length
    const totalAmount = all
      .filter((i) => i.status === 'ISSUED')
      .reduce((s, i) => s + Number(i.total), 0)
    return { total: all.length, issued, canceled, totalAmount }
  })

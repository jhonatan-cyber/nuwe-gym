import type { getInvoices, getInvoiceById, getInvoiceStats } from './server.ts'

export type Invoice = Awaited<ReturnType<typeof getInvoices>>[number]

export type InvoiceDetail = Awaited<ReturnType<typeof getInvoiceById>>

export type InvoiceStats = Awaited<ReturnType<typeof getInvoiceStats>>

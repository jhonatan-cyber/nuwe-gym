import type { getSuppliers, getSupplierById } from '#/features/suppliers/server.ts'

export type Supplier = Awaited<ReturnType<typeof getSuppliers>>[number]

export type SupplierDetail = Awaited<ReturnType<typeof getSupplierById>>

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { suppliers } from '#/shared/db/schema/suppliers.ts'
import { eq, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getSuppliers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
  return await db.query.suppliers.findMany({
    orderBy: [desc(suppliers.createdAt)],
  })
})

const createSupplierSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const createSupplier = createServerFn({ method: 'POST' })
  .inputValidator((data) => createSupplierSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [supplier] = await db
      .insert(suppliers)
      .values({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      })
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      description: `Creó proveedor ${supplier.name}`,
    })
    return supplier
  })

const updateSupplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateSupplier = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateSupplierSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [supplier] = await db
      .update(suppliers)
      .set({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      description: `Actualizó proveedor ${supplier.name}`,
    })
    return supplier
  })

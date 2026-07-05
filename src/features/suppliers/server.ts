import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { suppliers } from '#/shared/db/schema/suppliers.ts'
import { purchases } from '#/shared/db/schema/purchases.ts'
import { eq, desc } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { uuidField, requiredString, optionalString } from '#/shared/lib/schemas.ts'

export const getSuppliers = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'suppliers:read' } })
    return await db
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.createdAt))
  },
)

export const getSupplierById = createServerFn({ method: 'GET' })
  .validator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requirePermission({ data: { permission: 'suppliers:read' } })
    const result = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1)
    return result.length > 0 ? result[0] : null
  })

const createSupplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  phone: optionalString.default(''),
  email: optionalString.default(''),
  address: optionalString.default(''),
  notes: optionalString.default(''),
})

export const createSupplier = createServerFn({ method: 'POST' })
  .validator((data) => createSupplierSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'suppliers:write' } })
    const [supplier] = await db.insert(suppliers).values(data).returning()
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
  id: uuidField,
  name: requiredString,
  phone: optionalString,
  email: optionalString,
  address: optionalString,
  notes: optionalString,
  isActive: z.boolean().optional(),
})

export const updateSupplier = createServerFn({ method: 'POST' })
  .validator((data) => updateSupplierSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'suppliers:write' } })
    const [supplier] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
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

export const deleteSupplier = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField, name: requiredString }).parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'suppliers:write' } })

    const [deleted] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'SUPPLIER',
      entityId: data.id,
      description: `Eliminó proveedor ${data.name}`,
    })

    return deleted
  })

export const getSupplierPurchases = createServerFn({ method: 'GET' })
  .validator((id) => uuidField.parse(id))
  .handler(async ({ data: supplierId }) => {
    await requirePermission({ data: { permission: 'suppliers:read' } })

    const purchaseList = await db.query.purchases.findMany({
      where: eq(purchases.supplierId, supplierId),
      orderBy: [desc(purchases.purchasedAt)],
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    })

    const totalSpend = purchaseList.reduce(
      (sum, p) => sum + parseFloat(p.total),
      0,
    )
    const totalOrders = purchaseList.length
    const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0

    return {
      purchases: purchaseList,
      stats: {
        totalSpend,
        totalOrders,
        avgOrderValue,
        lastPurchaseDate: purchaseList[0]?.purchasedAt ?? null,
      },
    }
  })

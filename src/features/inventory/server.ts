import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { desc, eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { branchIdField, uuidField, optionalString } from '#/shared/lib/schemas.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

export const getInventoryMovements = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ branchId: branchIdField }).optional(),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const branchId = data?.branchId
    if (!branchId) {
      return await db.query.inventoryMovements.findMany({
        orderBy: [desc(inventoryMovements.createdAt)],
        with: { product: true, createdBy: true },
      })
    }

    // Filtrar movimientos por productos que tienen stock en la sucursal
    const stocks = await db
      .select({ productId: productStock.productId })
      .from(productStock)
      .where(eq(productStock.branchId, branchId))
    const ids = [...new Set(stocks.map((s) => s.productId))]
    if (ids.length === 0) return []

    return await db.query.inventoryMovements.findMany({
      where: sql`${inventoryMovements.productId} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}]::uuid[])`,
      orderBy: [desc(inventoryMovements.createdAt)],
      with: { product: true, createdBy: true },
    })
  })

interface StockSnapshot {
  productId: string
  productName: string
  categoryId: string
  categoryName: string
  currentStock: number
  previousStock: number
  change: number
  changePercent: number
}

export const getStockSnapshots = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    daysBack: z.number().default(30),
    branchId: branchIdField,
  }))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - data.daysBack)

    if (!data.branchId) return []

    // Get current stock per product from product_stock for this branch
    const stockRows = await db
      .select({
        productId: productStock.productId,
        currentStock: productStock.stockCurrent,
        productName: products.name,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
      })
      .from(productStock)
      .innerJoin(products, eq(productStock.productId, products.id))
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(eq(productStock.branchId, data.branchId))

    // Get last movement before cutoff for each product
    const lastMovements = await db
      .select({
        productId: inventoryMovements.productId,
        lastStock: sql<number>`MAX(${inventoryMovements.newStock})`,
      })
      .from(inventoryMovements)
      .where(
        and(
          sql`${inventoryMovements.createdAt} <= ${cutoffDate}`,
          sql`${inventoryMovements.productId} IN (${sql.join(stockRows.map((r) => sql`${r.productId}`), sql`, `)})`,
        ),
      )
      .groupBy(inventoryMovements.productId)

    const lastStockMap = new Map(
      lastMovements.map((m) => [m.productId, m.lastStock]),
    )

    const snapshots: StockSnapshot[] = []

    for (const item of stockRows) {
      const prevStock = lastStockMap.get(item.productId) ?? item.currentStock
      const change = item.currentStock - prevStock
      const changePercent =
        prevStock > 0 ? Math.round((change / prevStock) * 100) : 0

      snapshots.push({
        productId: item.productId,
        productName: item.productName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        currentStock: item.currentStock,
        previousStock: prevStock,
        change,
        changePercent,
      })
    }

    return snapshots
  })

export const generateCategoryDescription = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const { generateDescriptionForCategory } = await import('#/shared/lib/ai.ts')
    return await generateDescriptionForCategory(data.name)
  })

const transferStockSchema = z.object({
  productId: uuidField,
  sourceBranchId: z.string().uuid('Sucursal de origen requerida'),
  destBranchId: z.string().uuid('Sucursal de destino requerida'),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  notes: optionalString,
})

export const transferStock = createServerFn({ method: 'POST' })
  .inputValidator((data) => transferStockSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    if (data.sourceBranchId === data.destBranchId) {
      throw new Error('Las sucursales de origen y destino deben ser diferentes.')
    }

    const result = await db.transaction(async (tx) => {
      const sourceStock = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, data.productId),
          eq(productStock.branchId, data.sourceBranchId),
        ),
      })

      const currentStock = sourceStock?.stockCurrent ?? 0
      if (currentStock < data.quantity) {
        throw new Error(
          `Stock insuficiente en origen. Disponible: ${currentStock}, solicitado: ${data.quantity}`,
        )
      }

      const destStock = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, data.productId),
          eq(productStock.branchId, data.destBranchId),
        ),
      })

      const newSourceStock = currentStock - data.quantity
      const newDestStock = (destStock?.stockCurrent ?? 0) + data.quantity

      await tx
        .update(productStock)
        .set({ stockCurrent: newSourceStock, updatedAt: new Date() })
        .where(eq(productStock.id, sourceStock!.id))

      if (destStock) {
        await tx
          .update(productStock)
          .set({ stockCurrent: newDestStock, updatedAt: new Date() })
          .where(eq(productStock.id, destStock.id))
      } else {
        await tx.insert(productStock).values({
          productId: data.productId,
          branchId: data.destBranchId,
          stockCurrent: newDestStock,
          stockMinimum: 0,
        })
      }

      await tx.insert(inventoryMovements).values({
        productId: data.productId,
        movementType: 'TRANSFER',
        quantity: -data.quantity,
        previousStock: currentStock,
        newStock: newSourceStock,
        referenceType: 'TRANSFER',
        referenceId: data.destBranchId,
        notes: data.notes || `Transferencia a sucursal destino`,
        createdByUserId: session.user.id,
      })

      return { newSourceStock, newDestStock }
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'INVENTORY_MOVEMENT',
      entityId: data.productId,
      description: `Transferencia de ${data.quantity} unidades del producto ${data.productId} a sucursal ${data.destBranchId}`,
    })

    return result
  })

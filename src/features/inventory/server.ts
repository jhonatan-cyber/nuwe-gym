import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { desc, eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { branchIdField } from '#/shared/lib/schemas.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'

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

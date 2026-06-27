import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { requireRole } from '#/shared/lib/server-utils.ts'

export const getInventoryMovements = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.inventoryMovements.findMany({
      orderBy: [desc(inventoryMovements.createdAt)],
      with: {
        product: true,
        createdBy: true,
      },
    })
  },
)

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
  .inputValidator(z.object({ daysBack: z.number().default(30) }))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - data.daysBack)

    // Get current stock per product directly from products table
    const productsList = await db
      .select({
        id: inventoryMovements.productId,
        productName: sql<string>`"products"."name"`,
        categoryId: sql<string>`"products"."category_id"`,
        categoryName: sql<string>`"product_categories"."name"`,
        currentStock: sql<number>`"products"."stock_current"`,
      })
      .from(inventoryMovements)
      .innerJoin(
        sql`"products"`,
        sql`"products"."id" = ${inventoryMovements.productId}`
      )
      .innerJoin(
        sql`"product_categories"`,
        sql`"product_categories"."id" = "products"."category_id"`
      )
      .groupBy(
        inventoryMovements.productId,
        sql`"products"."name"`,
        sql`"products"."category_id"`,
        sql`"product_categories"."name"`,
        sql`"products"."stock_current"`,
      )

    // Get last movement before cutoff for each product in a single query
    const lastMovements = await db
      .select({
        productId: inventoryMovements.productId,
        lastStock: sql<number>`MAX(${inventoryMovements.newStock})`,
      })
      .from(inventoryMovements)
      .where(sql`${inventoryMovements.createdAt} <= ${cutoffDate}`)
      .groupBy(inventoryMovements.productId)

    const lastStockMap = new Map(lastMovements.map((m) => [m.productId, m.lastStock]))

    const snapshots: StockSnapshot[] = []

    for (const item of productsList) {
      const prevStock = lastStockMap.get(item.id) ?? item.currentStock
      const change = item.currentStock - prevStock
      const changePercent = prevStock > 0 ? Math.round((change / prevStock) * 100) : 0

      snapshots.push({
        productId: item.id,
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

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { eq, desc, ilike, or, and, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { branchIdField, moneyString, optionalString, uuidField } from '#/shared/lib/schemas.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

export const getCategories = createServerFn({ method: 'GET' })
  .validator((data: { branchId?: string }) => data)
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'products:read' } })
    const categories = await db.query.productCategories.findMany({
      orderBy: [desc(productCategories.createdAt)],
    })

    // Get product stats per category
    const productStats = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)::int`,
        avgSalePrice: sql<string>`coalesce(avg(${products.salePrice}::numeric), 0)::text`,
      })
      .from(products)
      .groupBy(products.categoryId)

    const statsMap = new Map(
      productStats.map((s) => [s.categoryId, s]),
    )

    // Get stock per branch if branchId provided
    let stockMap = new Map<string, { total: number; outOfStock: number }>()
    if (data.branchId) {
      const stockData = await db
        .select({
          productId: productStock.productId,
          stockCurrent: productStock.stockCurrent,
        })
        .from(productStock)
        .where(eq(productStock.branchId, data.branchId))

      // Get category mapping for stock
      const productCategories2 = await db
        .select({
          id: products.id,
          categoryId: products.categoryId,
        })
        .from(products)

      const productToCategory = new Map(
        productCategories2.map((p) => [p.id, p.categoryId]),
      )

      for (const s of stockData) {
        const catId = productToCategory.get(s.productId)
        if (!catId) continue
        const existing = stockMap.get(catId) || { total: 0, outOfStock: 0 }
        existing.total += s.stockCurrent
        if (s.stockCurrent <= 0) existing.outOfStock += 1
        stockMap.set(catId, existing)
      }
    }

    return categories.map((cat) => {
      const stats = statsMap.get(cat.id)
      const stock = stockMap.get(cat.id)
      return {
        ...cat,
        productCount: stats?.count ?? 0,
        avgSalePrice: stats?.avgSalePrice ?? '0',
        totalStock: stock?.total ?? 0,
        outOfStock: stock?.outOfStock ?? 0,
      }
    })
  })

const createCategorySchema = z.object({
  name: z.string(),
  description: optionalString,
})

export const createCategory = createServerFn({ method: 'POST' })
  .validator((data) => createCategorySchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'products:write' },
    })
    const [category] = await db
      .insert(productCategories)
      .values({
        name: data.name,
        description: data.description || null,
      })
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CATEGORY',
      entityId: category.id,
      description: `Creó categoría ${category.name}`,
    })
    return category
  })

const updateCategorySchema = z.object({
  id: uuidField,
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateCategory = createServerFn({ method: 'POST' })
  .validator((data) => updateCategorySchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'products:write' },
    })
    const [category] = await db
      .update(productCategories)
      .set({
        name: data.name,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'CATEGORY',
      entityId: category.id,
      description: `Actualizó categoría ${category.name}`,
    })
    return category
  })

const getProductsSchema = z.object({
  search: optionalString,
  categoryId: z.string().uuid().optional(),
  branchId: branchIdField,
})

export const getProducts = createServerFn({ method: 'GET' })
  .validator((data) => getProductsSchema.parse(data))
  .handler(async ({ data }) => {
    const filters: (ReturnType<typeof eq> | ReturnType<typeof or>)[] = []

    if (data.search) {
      filters.push(
        or(
          ilike(products.name, `%${data.search}%`),
          ilike(products.sku, `%${data.search}%`),
          ilike(products.barcode, `%${data.search}%`),
        ),
      )
    }

    if (data.categoryId) {
      filters.push(eq(products.categoryId, data.categoryId))
    }

    const productList = await db.query.products.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: [desc(products.createdAt)],
      with: {
        category: true,
      },
    })

    if (!data.branchId || productList.length === 0) {
      // Sin sucursal o sin productos: devolver sin datos de stock
      return productList.map((p) => ({
        ...p,
        stockCurrent: 0,
        stockMinimum: 0,
      }))
    }

    // Con sucursal: obtener stock de product_stock
    const productIds = productList.map((p) => p.id)
    const stockEntries = await db
      .select()
      .from(productStock)
      .where(
        and(
          eq(productStock.branchId, data.branchId),
          inArray(productStock.productId, productIds),
        ),
      )

    const stockMap = new Map(
      stockEntries.map((s) => [s.productId, s]),
    )

    return productList.map((p) => {
      const stock = stockMap.get(p.id)
      return {
        ...p,
        stockCurrent: stock?.stockCurrent ?? 0,
        stockMinimum: stock?.stockMinimum ?? 0,
      }
    })
  })

const createProductSchema = z.object({
  sku: z.string(),
  barcode: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: uuidField,
  purchasePrice: moneyString,
  salePrice: moneyString,
  imageUrl: optionalString,
})

export const createProduct = createServerFn({ method: 'POST' })
  .validator((data) => createProductSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'products:write' } })
    const [product] = await db
      .insert(products)
      .values({
        sku: data.sku,
        barcode: data.barcode || null,
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        imageUrl: data.imageUrl || null,
      })
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PRODUCT',
      entityId: product.id,
      description: `Creó producto ${product.name}`,
    })
    return product
  })

const updateProductSchema = z.object({
  id: uuidField,
  sku: z.string(),
  barcode: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: uuidField,
  purchasePrice: moneyString,
  salePrice: moneyString,
  imageUrl: optionalString,
  isActive: z.boolean().optional(),
})

export const updateProduct = createServerFn({ method: 'POST' })
  .validator((data) => updateProductSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'products:write' } })
    const [product] = await db
      .update(products)
      .set({
        sku: data.sku,
        barcode: data.barcode || null,
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'PRODUCT',
      entityId: product.id,
      description: `Actualizó producto ${product.name}`,
    })
    return product
  })

const adjustStockSchema = z.object({
  productId: uuidField,
  quantity: z.number(),
  movementType: z.enum(['MANUAL_ADJUSTMENT', 'LOSS', 'RETURN']),
  branchId: branchIdField,
  notes: optionalString,
  expiryDate: z.string().optional(),
})

export const adjustStock = createServerFn({ method: 'POST' })
  .validator((data) => adjustStockSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'products:write' },
    })

    const branchId = data.branchId
    if (!branchId) {
      throw new Error('Se requiere una sucursal para ajustar stock.')
    }

    const newStock = await db.transaction(async (tx) => {
      // Buscar o crear entry en product_stock
      const stockEntry = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, data.productId),
          eq(productStock.branchId, branchId),
        ),
      })

      const previousStock = stockEntry?.stockCurrent ?? 0
      const calculatedNewStock = previousStock + data.quantity

      const updateData: Record<string, any> = {
        stockCurrent: calculatedNewStock,
        updatedAt: new Date(),
      }
      if (data.expiryDate) {
        updateData.expiryDate = new Date(data.expiryDate)
      }

      if (stockEntry) {
        await tx
          .update(productStock)
          .set(updateData)
          .where(eq(productStock.id, stockEntry.id))
      } else {
        await tx.insert(productStock).values({
          productId: data.productId,
          branchId,
          stockCurrent: calculatedNewStock,
          stockMinimum: 0,
          ...(data.expiryDate ? { expiryDate: new Date(data.expiryDate) } : {}),
        })
      }

      await tx.insert(inventoryMovements).values({
        productId: data.productId,
        movementType: data.movementType,
        quantity: data.quantity,
        previousStock,
        newStock: calculatedNewStock,
        notes: data.notes || null,
        createdByUserId: session.user.id,
      })

      return calculatedNewStock
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'INVENTORY',
      entityId: data.productId,
      description: `Ajustó stock del producto #${data.productId}: ${data.quantity} unidades`,
      details: {
        movementType: data.movementType,
        quantity: data.quantity,
        newStock,
      },
    })

    return newStock
  })

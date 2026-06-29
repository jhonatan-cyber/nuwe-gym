import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { products } from '#/shared/db/schema/products.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { eq, desc, ilike, or, and } from 'drizzle-orm'
import { z } from 'zod'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

export const getCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.productCategories.findMany({
      orderBy: [desc(productCategories.createdAt)],
    })
  },
)

const createCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((data) => createCategorySchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
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
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateCategory = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateCategorySchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
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
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  branchId: z.string().optional(),
})

export const getProducts = createServerFn({ method: 'GET' })
  .inputValidator((data) => getProductsSchema.parse(data))
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

    if (data.branchId) {
      filters.push(eq(products.branchId, data.branchId))
    }

    return await db.query.products.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: [desc(products.createdAt)],
      with: {
        category: true,
      },
    })
  })

const createProductSchema = z.object({
  sku: z.string(),
  barcode: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  purchasePrice: z.string(),
  salePrice: z.string(),
  stockCurrent: z.number(),
  stockMinimum: z.number(),
  imageUrl: z.string().optional(),
  branchId: z.string().optional(),
})

export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator((data) => createProductSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
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
        stockCurrent: data.stockCurrent,
        stockMinimum: data.stockMinimum,
        imageUrl: data.imageUrl || null,
        branchId: data.branchId ?? null,
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
  id: z.string().uuid(),
  sku: z.string(),
  barcode: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  purchasePrice: z.string(),
  salePrice: z.string(),
  stockCurrent: z.number(),
  stockMinimum: z.number(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateProductSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
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
        stockCurrent: data.stockCurrent,
        stockMinimum: data.stockMinimum,
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
  productId: z.string().uuid(),
  quantity: z.number(),
  movementType: z.enum(['MANUAL_ADJUSTMENT', 'LOSS', 'RETURN']),
  notes: z.string().optional(),
})

export const adjustStock = createServerFn({ method: 'POST' })
  .inputValidator((data) => adjustStockSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const newStock = await db.transaction(async (tx) => {
      const results = await tx
        .select()
        .from(products)
        .where(eq(products.id, data.productId))
        .limit(1)

      if (results.length === 0) throw new Error('Product not found')
      const product = results[0]

      const previousStock = product.stockCurrent
      const calculatedNewStock = previousStock + data.quantity

      await tx
        .update(products)
        .set({ stockCurrent: calculatedNewStock, updatedAt: new Date() })
        .where(eq(products.id, data.productId))

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

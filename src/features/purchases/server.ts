import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { purchases, purchaseItems } from '#/shared/db/schema/purchases.ts'
import { products } from '#/shared/db/schema/products.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { eq, desc, inArray } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getPurchases = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
  return await db.query.purchases.findMany({
    orderBy: [desc(purchases.purchasedAt)],
    with: {
      supplier: true,
      createdBy: true,
      items: {
        with: {
          product: true,
        },
      },
    },
  })
})

const createPurchaseSchema = z.object({
  supplierId: z.number(),
  purchaseNumber: z.string(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number(),
      unitCost: z.string(),
    })
  ),
})

export const createPurchase = createServerFn({ method: 'POST' })
  .inputValidator((data) => createPurchaseSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const purchase = await db.transaction(async (tx) => {
      let subtotalSum = 0
      for (const item of data.items) {
        subtotalSum += Number(item.unitCost) * item.quantity
      }

      const subtotal = subtotalSum.toFixed(2)
      const total = subtotal

      const [purchase] = await tx
        .insert(purchases)
        .values({
          supplierId: data.supplierId,
          purchaseNumber: data.purchaseNumber,
          subtotal,
          total,
          notes: data.notes || null,
          createdByUserId: session.user.id,
        })
        .returning()

      const productIds = Array.from(new Set(data.items.map(item => item.productId)))
      const productsFound = productIds.length > 0
        ? await tx.select().from(products).where(inArray(products.id, productIds))
        : []
      const productMap = new Map(productsFound.map(p => [p.id, p]))

      for (const item of data.items) {
        const itemSubtotal = (Number(item.unitCost) * item.quantity).toFixed(2)

        await tx.insert(purchaseItems).values({
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: itemSubtotal,
        })

        const product = productMap.get(item.productId)

        if (!product) {
          throw new Error(`Producto no encontrado (ID: ${item.productId})`)
        }

        const newStock = product.stockCurrent + item.quantity

        await tx
          .update(products)
          .set({
            stockCurrent: newStock,
            purchasePrice: item.unitCost,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId))

        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          movementType: 'PURCHASE',
          quantity: item.quantity,
          previousStock: product.stockCurrent,
          newStock,
          referenceType: 'PURCHASE',
          referenceId: purchase.id,
          createdByUserId: session.user.id,
        })

        product.stockCurrent = newStock
      }

      return purchase
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PURCHASE',
      entityId: purchase.id,
      description: `Creó compra #${purchase.purchaseNumber}`,
    })

    return purchase
  })

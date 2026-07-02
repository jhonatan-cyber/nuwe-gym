import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { purchases, purchaseItems } from '#/shared/db/schema/purchases.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { eq, desc, inArray, and } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, moneyString, optionalString, positiveNumber, uuidField } from '#/shared/lib/schemas.ts'

export const getPurchases = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ branchId: branchIdField }).optional(),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.purchases.findMany({
      where: data?.branchId
        ? eq(purchases.branchId, data.branchId)
        : undefined,
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
  supplierId: uuidField,
  branchId: branchIdField,
  purchaseNumber: z.string(),
  notes: optionalString,
  items: z.array(
    z.object({
      productId: uuidField,
      quantity: positiveNumber,
      unitCost: moneyString,
      batchNumber: z.string().optional(),
    }),
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

      const [newPurchase] = await tx
        .insert(purchases)
        .values({
          supplierId: data.supplierId,
          branchId: data.branchId ?? null,
          purchaseNumber: data.purchaseNumber,
          subtotal,
          total,
          notes: data.notes || null,
          createdByUserId: session.user.id,
        })
        .returning()

      const branchId = data.branchId

      const productIds = Array.from(
        new Set(data.items.map((item) => item.productId)),
      )
      const productsFound =
        productIds.length > 0
          ? await tx
              .select()
              .from(products)
              .where(inArray(products.id, productIds as string[]))
          : []
      const productMap = new Map(productsFound.map((p) => [p.id, p]))

      // Cargar stock actual de la sucursal
      let stockCache = new Map<string, typeof productStock.$inferSelect>()
      if (branchId && productIds.length > 0) {
        const existingStocks = await tx
          .select()
          .from(productStock)
          .where(
            and(
              eq(productStock.branchId, branchId),
              inArray(productStock.productId, productIds as string[]),
            ),
          )
        stockCache = new Map(existingStocks.map((s) => [s.productId, s]))
      }

      for (const item of data.items) {
        const itemSubtotal = (Number(item.unitCost) * item.quantity).toFixed(2)

        await tx.insert(purchaseItems).values({
          purchaseId: newPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: itemSubtotal,
        })

        const product = productMap.get(item.productId)

        if (!product) {
          throw new Error(`Producto no encontrado (ID: ${item.productId})`)
        }

        // Actualizar precio de compra global del producto
        await tx
          .update(products)
          .set({
            purchasePrice: item.unitCost,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId))

        // Actualizar stock por sucursal
        if (branchId) {
          const existingStock = stockCache.get(item.productId)
          const prevStock = existingStock?.stockCurrent ?? 0
          const newStock = prevStock + item.quantity

          if (existingStock) {
            await tx
              .update(productStock)
              .set({ stockCurrent: newStock, updatedAt: new Date() })
              .where(eq(productStock.id, existingStock.id))
          } else {
            await tx.insert(productStock).values({
              productId: item.productId,
              branchId,
              stockCurrent: newStock,
              stockMinimum: 0,
            })
          }

          await tx.insert(inventoryMovements).values({
            productId: item.productId,
            movementType: 'PURCHASE',
            quantity: item.quantity,
            previousStock: prevStock,
            newStock,
            referenceType: 'PURCHASE',
            referenceId: newPurchase.id,
            createdByUserId: session.user.id,
            batchNumber: item.batchNumber || null,
          })
        }
      }

      return newPurchase
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

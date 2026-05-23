import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { products } from '#/shared/db/schema/products.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { cashRegisterSessions, cashMovements } from '#/shared/db/schema/cash-register.ts'
import { eq, desc, inArray } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getRecentSales = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.sales.findMany({
      orderBy: [desc(sales.soldAt)],
      limit: 100,
      with: {
        user: true,
        member: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    })
  },
)

const createSaleSchema = z.object({
  memberId: z.number().optional(),
  customerName: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'QR', 'TRANSFER', 'CARD']),
  discount: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number(),
      unitPrice: z.string(),
    })
  ),
})

export const createSale = createServerFn({ method: 'POST' })
  .inputValidator((data) => createSaleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const sale = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error('Debe abrir la caja antes de registrar una venta.')
      }

      const saleNumber = `V-${Date.now()}`

      let subtotalSum = 0
      for (const item of data.items) {
        subtotalSum += Number(item.unitPrice) * item.quantity
      }

      const subtotal = subtotalSum.toFixed(2)
      const discount = (Number(data.discount) || 0).toFixed(2)
      const total = (subtotalSum - (Number(data.discount) || 0)).toFixed(2)

      const [sale] = await tx
        .insert(sales)
        .values({
          saleNumber,
          memberId: data.memberId || null,
          customerName: data.customerName || null,
          userId: session.user.id,
          subtotal,
          discount,
          total,
          paymentMethod: data.paymentMethod,
          status: 'COMPLETED',
          cashSessionId: openSession.id,
        })
        .returning()

      const productIds = Array.from(new Set(data.items.map(item => item.productId)))
      const productsFound = productIds.length > 0
        ? await tx.select().from(products).where(inArray(products.id, productIds))
        : []
      const productMap = new Map(productsFound.map(p => [p.id, p]))

      for (const item of data.items) {
        const itemSubtotal = (Number(item.unitPrice) * item.quantity).toFixed(2)
        
        await tx.insert(saleItems).values({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
        })

        const product = productMap.get(item.productId)

        if (!product) {
          throw new Error(`Producto no encontrado (ID: ${item.productId})`)
        }

        const newStock = product.stockCurrent - item.quantity
        if (newStock < 0) {
          throw new Error(`Stock insuficiente para el producto "${product.name}". Stock actual: ${product.stockCurrent}`)
        }

        await tx
          .update(products)
          .set({ stockCurrent: newStock, updatedAt: new Date() })
          .where(eq(products.id, item.productId))

        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          movementType: 'SALE',
          quantity: -item.quantity,
          previousStock: product.stockCurrent,
          newStock,
          referenceType: 'SALE',
          referenceId: sale.id,
          createdByUserId: session.user.id,
        })

        product.stockCurrent = newStock
      }

      await tx.insert(cashMovements).values({
        cashSessionId: openSession.id,
        movementType: 'INCOME',
        sourceType: 'SALE',
        sourceId: sale.id,
        amount: total,
        paymentMethod: data.paymentMethod,
        description: `Venta registrada N° ${saleNumber}`,
      })

      return sale
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'SALE',
      entityId: sale.id,
      description: `Registró venta ${sale.saleNumber}`,
    })

    return sale
  })

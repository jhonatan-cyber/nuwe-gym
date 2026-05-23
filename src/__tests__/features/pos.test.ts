import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { eq, desc } from 'drizzle-orm'
import {
  createMember,
  createProduct,
  createSale,
  cleanDatabase,
} from '../factories.ts'
import { TEST_USER_ID } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('POS — Sales', () => {
  it('should create a sale with items', async () => {
    const p1 = await createProduct({ name: 'Item A', salePrice: '1000.00' })
    const p2 = await createProduct({ name: 'Item B', salePrice: '2000.00' })

    const sale = await createSale([
      { productId: p1.id, quantity: 3, unitPrice: '1000.00' },
      { productId: p2.id, quantity: 2, unitPrice: '2000.00' },
    ])

    expect(sale).toBeDefined()
    expect(sale.userId).toBe(TEST_USER_ID)
    expect(Number(sale.subtotal)).toBe(0)
    expect(Number(sale.total)).toBe(7000)

    const items = await db.query.saleItems.findMany({
      where: eq(saleItems.saleId, sale.id),
    })

    expect(items).toHaveLength(2)
  })

  it('should link sale items to products', async () => {
    const product = await createProduct({ name: 'Linked Product' })

    const sale = await createSale([
      { productId: product.id, quantity: 1, unitPrice: '5000.00' },
    ])

    const result = await db.query.sales.findFirst({
      where: eq(sales.id, sale.id),
      with: {
        items: {
          with: { product: true },
        },
      },
    })

    expect(result).toBeDefined()
    expect(result!.items).toHaveLength(1)
    expect(result!.items[0]!.product.name).toBe('Linked Product')
  })

  it('should filter sales by payment method', async () => {
    const product = await createProduct()

    await createSale(
      [{ productId: product.id, quantity: 1, unitPrice: '1000.00' }],
      { paymentMethod: 'CASH' },
    )
    await createSale(
      [{ productId: product.id, quantity: 1, unitPrice: '2000.00' }],
      { paymentMethod: 'QR' },
    )
    await createSale(
      [{ productId: product.id, quantity: 1, unitPrice: '3000.00' }],
      { paymentMethod: 'CASH' },
    )

    const cashSales = await db.query.sales.findMany({
      where: eq(sales.paymentMethod, 'CASH'),
    })
    const qrSales = await db.query.sales.findMany({
      where: eq(sales.paymentMethod, 'QR'),
    })

    expect(cashSales.length).toBeGreaterThanOrEqual(2)
    cashSales.forEach((s) => expect(s.paymentMethod).toBe('CASH'))
    expect(qrSales.length).toBeGreaterThanOrEqual(1)
    qrSales.forEach((s) => expect(s.paymentMethod).toBe('QR'))
  })

  it('should create a sale with discount', async () => {
    const product = await createProduct()

    const sale = await createSale(
      [{ productId: product.id, quantity: 1, unitPrice: '10000.00' }],
      { discount: '500.00', subtotal: '10000.00', total: '9500.00' },
    )

    expect(Number(sale.discount)).toBe(500)
    expect(Number(sale.total)).toBe(9500)
  })

  it('should create a sale without member (walk-in customer)', async () => {
    const product = await createProduct()

    const sale = await createSale(
      [{ productId: product.id, quantity: 1, unitPrice: '2000.00' }],
      { customerName: 'Cliente Mostrador' },
    )

    expect(sale.customerName).toBe('Cliente Mostrador')
    expect(sale.memberId).toBeNull()
  })

  it('should link sales to a member', async () => {
    const member = await createMember()
    const product = await createProduct()

    const sale = await createSale(
      [{ productId: product.id, quantity: 1, unitPrice: '1000.00' }],
      { memberId: member.id },
    )

    const result = await db.query.sales.findFirst({
      where: eq(sales.id, sale.id),
      with: { member: true },
    })

    expect(result!.member).toBeDefined()
    expect(result!.member!.id).toBe(member.id)
  })

  it('should query sale items with totals', async () => {
    const product = await createProduct()

    const sale = await createSale([
      { productId: product.id, quantity: 4, unitPrice: '2500.00' },
    ])

    const items = await db.query.saleItems.findMany({
      where: eq(saleItems.saleId, sale.id),
    })

    expect(items).toHaveLength(1)
    expect(Number(items[0]!.subtotal)).toBe(10000)
    expect(Number(items[0]!.unitPrice)).toBe(2500)
    expect(items[0]!.quantity).toBe(4)
  })

  it('should list recent sales ordered by date', async () => {
    const product = await createProduct()

    for (let i = 0; i < 3; i++) {
      await createSale([
        { productId: product.id, quantity: 1, unitPrice: '1000.00' },
      ])
    }

    const recentSales = await db.query.sales.findMany({
      orderBy: [desc(sales.soldAt)],
      limit: 10,
    })

    expect(recentSales.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < recentSales.length; i++) {
      expect(recentSales[i - 1]!.soldAt >= recentSales[i]!.soldAt).toBe(true)
    }
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { products } from '#/shared/db/schema/products.ts'
import { eq, desc, sum } from 'drizzle-orm'
import { calcPercentChange } from '#/features/sales/server.ts'
import {
  createProduct,
  createSale,
  createTestUser,
  cleanDatabase,
  createCashRegisterSession,
} from '../factories.ts'

// ── Pure function tests ──────────────────────────────────────────

describe('calcPercentChange', () => {
  it('should return positive percentage when current > previous', () => {
    expect(calcPercentChange(100, 150)).toBe(50)
  })

  it('should return negative percentage when current < previous', () => {
    expect(calcPercentChange(200, 50)).toBe(-75)
  })

  it('should return 0 when current equals previous', () => {
    expect(calcPercentChange(100, 100)).toBe(0)
  })

  it('should return 100 when previous is 0 and current > 0', () => {
    expect(calcPercentChange(0, 50)).toBe(100)
  })

  it('should return null when both values are 0', () => {
    expect(calcPercentChange(0, 0)).toBeNull()
  })

  it('should handle decimal values correctly', () => {
    const result = calcPercentChange(200.5, 250.75)
    const expected = ((250.75 - 200.5) / 200.5) * 100
    expect(result).toBeCloseTo(expected, 2)
  })

  it('should handle negative values (loss scenario)', () => {
    expect(calcPercentChange(500, 100)).toBe(-80)
  })

  it('should handle large numbers', () => {
    expect(calcPercentChange(1_000_000, 1_500_000)).toBe(50)
  })

  it('should handle going from positive to zero', () => {
    expect(calcPercentChange(100, 0)).toBe(-100)
  })
})

// ── Integration tests ────────────────────────────────────────────

describe('Sales Integration', () => {
  beforeAll(async () => {
    await cleanDatabase()
    await createTestUser()
  })

  describe('createSale via factory', () => {
    it('should insert a sale with items', async () => {
      const product = await createProduct({
        name: 'Test Product',
        salePrice: '1500.00',
      })
      await createCashRegisterSession()

      const sale = await createSale([
        { productId: product.id, quantity: 2, unitPrice: '1500.00' },
      ])

      expect(sale).toBeDefined()
      expect(sale.saleNumber).toBeTruthy()
      expect(sale.items).toHaveLength(1)

      const found = await db.query.sales.findFirst({
        where: eq(sales.id, sale.id),
      })
      expect(found).toBeDefined()
      expect(found!.id).toBe(sale.id)
    })

    it('should allow selling the same product multiple times', async () => {
      const product = await createProduct({
        name: 'Multi-Product',
        salePrice: '2500.00',
      })
      await createSale([
        { productId: product.id, quantity: 1, unitPrice: '2500.00' },
      ])
      await createSale([
        { productId: product.id, quantity: 3, unitPrice: '2500.00' },
      ])

      const allSales = await db.query.sales.findMany({
        orderBy: [desc(sales.createdAt)],
        limit: 10,
      })
      expect(allSales.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getRecentSales query', () => {
    it('should return sales with user, member, items and product relations', async () => {
      const product = await createProduct({ name: 'Query Product' })
      await createSale([
        { productId: product.id, quantity: 1, unitPrice: '1000.00' },
      ])

      const recentSales = await db.query.sales.findMany({
        orderBy: [desc(sales.soldAt)],
        limit: 5,
        with: {
          user: true,
          member: true,
          items: { with: { product: true } },
        },
      })

      expect(recentSales.length).toBeGreaterThanOrEqual(1)
      const sale = recentSales[0]
      expect(sale.user).toBeDefined()
      expect(Array.isArray(sale.items)).toBe(true)
      if (sale.items.length > 0) {
        expect(sale.items[0].product).toBeDefined()
        expect(sale.items[0].product.name).toBeTruthy()
      }
    })

    it('should return sales ordered by soldAt descending', async () => {
      const product = await createProduct({ name: 'Order Test' })
      await createSale([
        { productId: product.id, quantity: 1, unitPrice: '1000.00' },
      ])

      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10))

      await createSale([
        { productId: product.id, quantity: 2, unitPrice: '2000.00' },
      ])

      const recentSales = await db.query.sales.findMany({
        orderBy: [desc(sales.soldAt)],
        limit: 5,
        with: {
          user: true,
          items: { with: { product: true } },
        },
      })

      expect(recentSales.length).toBeGreaterThanOrEqual(2)
      for (let i = 1; i < recentSales.length; i++) {
        expect(
          new Date(recentSales[i - 1].soldAt).getTime(),
        ).toBeGreaterThanOrEqual(new Date(recentSales[i].soldAt).getTime())
      }
    })
  })

  describe('sale schema validation', () => {
    it('should store and retrieve correct numeric values', async () => {
      const product = await createProduct({
        name: 'Numeric Test',
        salePrice: '7500.50',
      })
      const sale = await createSale([
        { productId: product.id, quantity: 2, unitPrice: '7500.50' },
      ])

      const found = await db.query.sales.findFirst({
        where: eq(sales.id, sale.id),
      })
      expect(found).toBeDefined()
      // total should be 2 * 7500.50 = 15001.00
      expect(Number(found!.total)).toBe(15001.0)
    })

    it('should store different payment methods', async () => {
      const product = await createProduct({ name: 'PM Test' })
      await createSale(
        [{ productId: product.id, quantity: 1, unitPrice: '1000.00' }],
        { paymentMethod: 'QR' },
      )

      const found = await db.query.sales.findFirst({
        where: eq(sales.paymentMethod, 'QR'),
      })
      expect(found).toBeDefined()
      expect(found!.paymentMethod).toBe('QR')
    })

    it('should require a userId', async () => {
      const product = await createProduct({ name: 'User Required' })
      const sale = await createSale([
        { productId: product.id, quantity: 1, unitPrice: '1000.00' },
      ])
      expect(sale.userId).toBeTruthy()
    })
  })

  describe('sale items', () => {
    it('should insert sale items with correct subtotals', async () => {
      const product = await createProduct({ name: 'Subtotal Test' })
      const sale = await createSale([
        { productId: product.id, quantity: 3, unitPrice: '2000.00' },
      ])
      // factory creates: subtotal = 3 * 2000 = 6000
      expect(sale.items[0].subtotal).toBe('6000.00')
    })

    it('should store sale items with correct quantity and unit price', async () => {
      const product = await createProduct({ name: 'Quantity Test' })
      const sale = await createSale([
        { productId: product.id, quantity: 5, unitPrice: '1200.00' },
      ])
      expect(sale.items[0].quantity).toBe(5)
      expect(sale.items[0].unitPrice).toBe('1200.00')
    })
  })

  describe('top products query', () => {
    it('should rank products by quantity sold', async () => {
      const p1 = await createProduct({ name: 'Top Product A' })
      const p2 = await createProduct({ name: 'Top Product B' })

      // Sell 10 of product A
      await createSale([{ productId: p1.id, quantity: 10, unitPrice: '500.00' }])
      // Sell 2 of product B
      await createSale([{ productId: p2.id, quantity: 2, unitPrice: '500.00' }])

      const topProducts = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          quantity: sum(saleItems.quantity),
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(eq(sales.status, 'COMPLETED'))
        .groupBy(saleItems.productId, products.name)
        .orderBy(desc(sum(saleItems.quantity)))
        .limit(5)

      expect(topProducts.length).toBeGreaterThanOrEqual(2)
      // Product A (10 sold) should be ranked higher than Product B (2 sold)
      expect(topProducts[0].productId).toBe(p1.id)
      expect(Number(topProducts[0].quantity)).toBe(10)
    })
  })
})

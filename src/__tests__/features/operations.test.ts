import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { products } from '#/shared/db/schema/products.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import { eq, desc, ilike, sql } from 'drizzle-orm'
import {
  createProduct,
  createCategory,
  createSale,
  createInventoryMovement,
  createCashRegisterSession as openCashSession,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Products', () => {
  it('should create a product and verify it exists', async () => {
    const product = await createProduct({
      name: 'Whey Protein',
      salePrice: '2500.00',
    })
    const found = await db.query.products.findFirst({
      where: eq(products.id, product.id),
    })
    expect(found).toBeDefined()
    expect(found!.name).toBe('Whey Protein')
    expect(found!.salePrice).toBe('2500.00')
  })

  it('should search products by name', async () => {
    await createProduct({ name: 'Creatina Monohidrato' })
    await createProduct({ name: 'Barrita Proteica' })

    const results = await db.query.products.findMany({
      where: ilike(products.name, '%Creatina%'),
    })
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].name).toContain('Creatina')
  })

  it('should filter products by category', async () => {
    const cat = await createCategory()
    const p1 = await createProduct({ name: 'Prod Cat', categoryId: cat.id })
    await createProduct({ name: 'Prod Sin Cat', categoryId: cat.id })

    const filtered = await db.query.products.findMany({
      where: eq(products.categoryId, cat.id),
    })
    expect(filtered.length).toBeGreaterThanOrEqual(1)
    expect(filtered.some((p) => p.id === p1.id)).toBe(true)
  })

  it('should update product stock', async () => {
    const product = await createProduct({ stockCurrent: 10 })
    await db
      .update(products)
      .set({ stockCurrent: 25 })
      .where(eq(products.id, product.id))

    const updated = await db.query.products.findFirst({
      where: eq(products.id, product.id),
    })
    expect(updated!.stockCurrent).toBe(25)
  })

  it('should find low-stock products', async () => {
    await createProduct({ name: 'Low Stock', stockCurrent: 3 })
    await createProduct({ name: 'Enough Stock', stockCurrent: 50 })

    const lowStock = await db.query.products.findMany({
      where: (fields, { lte }) => lte(fields.stockCurrent, 5),
    })
    expect(lowStock.length).toBeGreaterThanOrEqual(1)
    expect(lowStock.some((p) => p.name === 'Low Stock')).toBe(true)
  })

  it('should get products with category relation', async () => {
    const cat = await createCategory({ name: 'Suplementos' })
    await createProduct({ name: 'Producto Relacionado', categoryId: cat.id })

    const all = await db.query.products.findMany({
      with: { category: true },
    })
    const found = all.find((p) => p.name === 'Producto Relacionado')
    expect(found).toBeDefined()
    expect(found!.category).toBeDefined()
    expect(found!.category.name).toBe('Suplementos')
  })
})

describe('Sales / POS', () => {
  it('should create a sale with items', async () => {
    const p1 = await createProduct({ salePrice: '1000.00' })
    const p2 = await createProduct({ salePrice: '2000.00' })

    const sale = await createSale([
      { productId: p1.id, quantity: 2, unitPrice: '1000.00' },
      { productId: p2.id, quantity: 1, unitPrice: '2000.00' },
    ])

    expect(sale.total).toBe('4000.00')
    expect(sale.status).toBe('COMPLETED')
  })

  it('should verify sale items are linked correctly', async () => {
    const p = await createProduct()
    const sale = await createSale([
      { productId: p.id, quantity: 3, unitPrice: '500.00' },
    ])

    const items = await db.query.saleItems.findMany({
      where: eq(saleItems.saleId, sale.id),
    })
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe(p.id)
    expect(items[0].quantity).toBe(3)
  })

  it('should cancel a sale', async () => {
    const p = await createProduct()
    const sale = await createSale([
      { productId: p.id, quantity: 1, unitPrice: '100.00' },
    ])

    await db
      .update(sales)
      .set({ status: 'CANCELED' })
      .where(eq(sales.id, sale.id))

    const canceled = await db.query.sales.findFirst({
      where: eq(sales.id, sale.id),
    })
    expect(canceled!.status).toBe('CANCELED')
  })

  it('should list sales with items', async () => {
    const p = await createProduct({ name: 'Item de Venta' })
    const sale = await createSale([
      { productId: p.id, quantity: 1, unitPrice: '999.00' },
    ])

    const found = await db.query.sales.findFirst({
      where: eq(sales.id, sale.id),
      with: { items: { with: { product: true } } },
    })
    expect(found!.items).toHaveLength(1)
    expect(found!.items[0].product.name).toBe('Item de Venta')
  })
})

describe('Inventory', () => {
  it('should record a purchase movement', async () => {
    const p = await createProduct({ stockCurrent: 0 })
    const movement = await createInventoryMovement(p.id, {
      movementType: 'PURCHASE',
      quantity: 10,
    })
    expect(movement.productId).toBe(p.id)
    expect(movement.movementType).toBe('PURCHASE')
    expect(movement.quantity).toBe(10)
  })

  it('should record a sale movement (negative)', async () => {
    const p = await createProduct({ stockCurrent: 10 })
    const movement = await createInventoryMovement(p.id, {
      movementType: 'SALE',
      quantity: -2,
    })
    expect(movement.movementType).toBe('SALE')
    expect(movement.quantity).toBe(-2)
  })

  it('should get movements for a specific product', async () => {
    const p = await createProduct()
    await createInventoryMovement(p.id, {
      movementType: 'PURCHASE',
      quantity: 10,
    })
    await createInventoryMovement(p.id, { movementType: 'SALE', quantity: -3 })

    const movements = await db.query.inventoryMovements.findMany({
      where: eq(inventoryMovements.productId, p.id),
      orderBy: [desc(inventoryMovements.createdAt)],
    })
    expect(movements.length).toBeGreaterThanOrEqual(2)
  })

  it('should count total movements', async () => {
    const p = await createProduct()
    await createInventoryMovement(p.id)
    await createInventoryMovement(p.id)

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, p.id))
    expect(Number(result[0].count)).toBe(2)
  })
})

describe('Cash Register', () => {
  it('should open a cash session', async () => {
    const session = await openCashSession({ openingAmount: '5000.00' })
    expect(session.openingAmount).toBe('5000.00')
    expect(session.status).toBe('OPEN')
  })

  it('should record movements in a session', async () => {
    const session = await openCashSession()
    await db.insert(cashMovements).values({
      cashSessionId: session.id,
      movementType: 'INCOME',
      amount: '1000.00',
      paymentMethod: 'CASH',
      description: 'Venta de prueba',
      sourceType: 'SALE',
    })
    const movements = await db.query.cashMovements.findMany({
      where: eq(cashMovements.cashSessionId, session.id),
    })
    expect(movements).toHaveLength(1)
    expect(movements[0].movementType).toBe('INCOME')
    expect(movements[0].amount).toBe('1000.00')
  })

  it('should record both income and expense', async () => {
    const session = await openCashSession()
    await db.insert(cashMovements).values([
      {
        cashSessionId: session.id,
        movementType: 'INCOME',
        amount: '5000.00',
        paymentMethod: 'CASH',
        description: 'Pago membresía',
        sourceType: 'MEMBERSHIP_PAYMENT',
      },
      {
        cashSessionId: session.id,
        movementType: 'EXPENSE',
        amount: '500.00',
        paymentMethod: 'CASH',
        description: 'Compra de agua',
        sourceType: 'OTHER',
      },
    ])

    const movements = await db.query.cashMovements.findMany({
      where: eq(cashMovements.cashSessionId, session.id),
    })
    expect(movements).toHaveLength(2)
    expect(movements.filter((m) => m.movementType === 'INCOME')).toHaveLength(1)
    expect(movements.filter((m) => m.movementType === 'EXPENSE')).toHaveLength(
      1,
    )
  })

  it('should close a cash session', async () => {
    const session = await openCashSession()
    const closingAmount = '8500.00'
    await db
      .update(cashRegisterSessions)
      .set({
        status: 'CLOSED',
        actualClosingAmount: closingAmount,
        closedAt: new Date(),
      })
      .where(eq(cashRegisterSessions.id, session.id))

    const closed = await db.query.cashRegisterSessions.findFirst({
      where: eq(cashRegisterSessions.id, session.id),
    })
    expect(closed!.status).toBe('CLOSED')
    expect(closed!.actualClosingAmount).toBe(closingAmount)
  })
})

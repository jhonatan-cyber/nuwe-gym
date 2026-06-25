import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { suppliers } from '#/shared/db/schema/suppliers.ts'
import { purchaseItems } from '#/shared/db/schema/purchases.ts'
import { eq, desc, like } from 'drizzle-orm'
import {
  createSupplier,
  createProduct,
  createPurchase,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Suppliers', () => {
  it('should create a supplier and verify it exists', async () => {
    const supplier = await createSupplier({
      name: 'Proveedor Test',
      email: 'test@proveedor.com',
      phone: '123456789',
    })

    const found = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplier.id),
    })

    expect(found).toBeDefined()
    expect(found!.name).toBe('Proveedor Test')
    expect(found!.email).toBe('test@proveedor.com')
  })

  it('should search suppliers by name', async () => {
    await createSupplier({ name: 'Distribuidora ABC' })
    await createSupplier({ name: 'Distribuidora XYZ' })

    const results = await db.query.suppliers.findMany({
      where: like(suppliers.name, '%Distribuidora%'),
    })

    expect(results.length).toBeGreaterThanOrEqual(2)
    results.forEach((s) => expect(s.name).toContain('Distribuidora'))
  })

  it('should update supplier data', async () => {
    const supplier = await createSupplier({ name: 'Viejo Nombre' })

    const [updated] = await db
      .update(suppliers)
      .set({ name: 'Nuevo Nombre', phone: '999999999' })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(updated.name).toBe('Nuevo Nombre')
    expect(updated.phone).toBe('999999999')
  })

  it('should list all suppliers ordered by creation date', async () => {
    await createSupplier({ name: 'Supplier A' })
    await createSupplier({ name: 'Supplier B' })

    const all = await db.query.suppliers.findMany({
      orderBy: [desc(suppliers.createdAt)],
    })

    expect(all.length).toBeGreaterThanOrEqual(2)
    for (const s of all) {
      expect(s.name).toBeTruthy()
    }
  })
})

describe('Purchases', () => {
  it('should create a purchase with items', async () => {
    const supplier = await createSupplier()
    const product = await createProduct()
    const items = [{ productId: product.id, quantity: 5, unitCost: '1000.00' }]

    const purchase = await createPurchase(items, { supplierId: supplier.id })

    expect(purchase).toBeDefined()
    expect(purchase.supplierId).toBe(supplier.id)
    expect(Number(purchase.total)).toBe(5000)
  })

  it('should verify purchase items are linked correctly', async () => {
    const supplier = await createSupplier()
    const p1 = await createProduct()
    const p2 = await createProduct()
    const items = [
      { productId: p1.id, quantity: 3, unitCost: '500.00' },
      { productId: p2.id, quantity: 2, unitCost: '1500.00' },
    ]

    const purchase = await createPurchase(items, { supplierId: supplier.id })

    const foundItems = await db.query.purchaseItems.findMany({
      where: eq(purchaseItems.purchaseId, purchase.id),
    })

    expect(foundItems).toHaveLength(2)
    const total = foundItems.reduce(
      (sum, item) => sum + Number(item.unitCost) * item.quantity,
      0,
    )
    expect(total).toBe(4500)
  })

  it('should get purchases with supplier relation', async () => {
    const supplier = await createSupplier({ name: 'Relación Test' })
    const product = await createProduct()
    const items = [{ productId: product.id, quantity: 1, unitCost: '2000.00' }]

    await createPurchase(items, { supplierId: supplier.id })

    const result = await db.query.purchases.findMany({
      with: { supplier: true, items: { with: { product: true } } },
    })

    expect(result.length).toBeGreaterThanOrEqual(1)
    for (const p of result) {
      expect(p.supplier).toBeDefined()
      expect(p.supplier.name).toBeTruthy()
      expect(p.items.length).toBeGreaterThanOrEqual(1)
      for (const item of p.items) {
        expect(item.product).toBeDefined()
        expect(item.product.name).toBeTruthy()
      }
    }
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { suppliers } from '#/shared/db/schema/suppliers.ts'
import { purchases, purchaseItems } from '#/shared/db/schema/purchases.ts'
import { eq, desc, like, count } from 'drizzle-orm'
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

  it('should create supplier with all optional fields', async () => {
    const supplier = await createSupplier({
      name: 'Proveedor Completo',
      email: 'completo@test.com',
      phone: '1122334455',
      address: 'Calle Mayor 123',
      notes: 'Condiciones de pago: 30 días',
    })

    const found = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplier.id),
    })

    expect(found).toBeDefined()
    expect(found!.name).toBe('Proveedor Completo')
    expect(found!.email).toBe('completo@test.com')
    expect(found!.phone).toBe('1122334455')
    expect(found!.address).toBe('Calle Mayor 123')
    expect(found!.notes).toBe('Condiciones de pago: 30 días')
  })

  it('should create supplier with default values', async () => {
    const supplier = await createSupplier({ name: 'Defaults Test' })

    expect(supplier.isActive).toBe(true)
    expect(supplier.createdAt).toBeDefined()
    expect(supplier.updatedAt).toBeDefined()
    expect(supplier.email).toBeTruthy()
    expect(supplier.phone).toBeTruthy()
    expect(supplier.address).toBeTruthy()
  })

  it('should create supplier with minimal fields (name only)', async () => {
    const [minimal] = await db
      .insert(suppliers)
      .values({ name: 'Solo Nombre' })
      .returning()

    expect(minimal.name).toBe('Solo Nombre')
    expect(minimal.email).toBeNull()
    expect(minimal.phone).toBeNull()
    expect(minimal.address).toBeNull()
    expect(minimal.notes).toBeNull()
    expect(minimal.isActive).toBe(true)
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

  it('should search suppliers by email', async () => {
    await createSupplier({ name: 'Busqueda Email', email: 'unique@busqueda.com' })

    const results = await db.query.suppliers.findMany({
      where: like(suppliers.email, '%busqueda.com%'),
    })

    expect(results.length).toBeGreaterThanOrEqual(1)
    results.forEach((s) => expect(s.email).toContain('busqueda.com'))
  })

  it('should search suppliers by phone', async () => {
    await createSupplier({ name: 'Busqueda Telefono', phone: '5551234567' })

    const results = await db.query.suppliers.findMany({
      where: like(suppliers.phone, '%5551234567%'),
    })

    expect(results.length).toBeGreaterThanOrEqual(1)
    results.forEach((s) => expect(s.phone).toContain('5551234567'))
  })

  it('should get supplier by id', async () => {
    const supplier = await createSupplier({ name: 'Buscar Por ID' })

    const found = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplier.id),
    })

    expect(found).toBeDefined()
    expect(found!.id).toBe(supplier.id)
    expect(found!.name).toBe('Buscar Por ID')
  })

  it('should return null for non-existent supplier id', async () => {
    const found = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, '00000000-0000-0000-0000-000000000000'),
    })

    expect(found).toBeUndefined()
  })

  it('should update supplier name and phone', async () => {
    const supplier = await createSupplier({ name: 'Viejo Nombre' })

    const [updated] = await db
      .update(suppliers)
      .set({ name: 'Nuevo Nombre', phone: '999999999', updatedAt: new Date() })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(updated.name).toBe('Nuevo Nombre')
    expect(updated.phone).toBe('999999999')
  })

  it('should update supplier email and address', async () => {
    const supplier = await createSupplier({
      name: 'Actualizar Contacto',
      email: 'old@test.com',
    })

    const [updated] = await db
      .update(suppliers)
      .set({
        email: 'new@test.com',
        address: 'Nueva dirección 456',
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(updated.email).toBe('new@test.com')
    expect(updated.address).toBe('Nueva dirección 456')
  })

  it('should toggle supplier active status', async () => {
    const supplier = await createSupplier({ name: 'Toggle Test' })
    expect(supplier.isActive).toBe(true)

    const [deactivated] = await db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(deactivated.isActive).toBe(false)

    const [reactivated] = await db
      .update(suppliers)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(reactivated.isActive).toBe(true)
  })

  it('should update supplier notes', async () => {
    const supplier = await createSupplier({ name: 'Notas Test' })

    const [updated] = await db
      .update(suppliers)
      .set({ notes: 'Nuevas notas de observación', updatedAt: new Date() })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(updated.notes).toBe('Nuevas notas de observación')
  })

  it('should delete a supplier', async () => {
    const supplier = await createSupplier({ name: 'Para Eliminar' })

    const [deleted] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(deleted.id).toBe(supplier.id)

    const found = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplier.id),
    })
    expect(found).toBeUndefined()
  })

  it('should filter suppliers by active status', async () => {
    await createSupplier({ name: 'Activo 1', isActive: true })
    await createSupplier({ name: 'Activo 2', isActive: true })
    await createSupplier({ name: 'Inactivo 1', isActive: false })

    const active = await db.query.suppliers.findMany({
      where: eq(suppliers.isActive, true),
    })
    const inactive = await db.query.suppliers.findMany({
      where: eq(suppliers.isActive, false),
    })

    expect(active.length).toBeGreaterThanOrEqual(2)
    active.forEach((s) => expect(s.isActive).toBe(true))
    expect(inactive.length).toBeGreaterThanOrEqual(1)
    inactive.forEach((s) => expect(s.isActive).toBe(false))
  })

  it('should list all suppliers ordered by creation date desc', async () => {
    await createSupplier({ name: 'Supplier A' })
    await createSupplier({ name: 'Supplier B' })

    const all = await db.query.suppliers.findMany({
      orderBy: [desc(suppliers.createdAt)],
    })

    expect(all.length).toBeGreaterThanOrEqual(2)
    for (const s of all) {
      expect(s.name).toBeTruthy()
    }
    // Verify ordering: newer suppliers first
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
        all[i].createdAt.getTime(),
      )
    }
  })

  it('should count suppliers by status', async () => {
    const beforeActive = await db
      .select({ count: count() })
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
    const beforeCount = beforeActive[0].count

    await createSupplier({ name: 'Count Active', isActive: true })
    await createSupplier({ name: 'Count Inactive', isActive: false })

    const afterActive = await db
      .select({ count: count() })
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
    const afterInactive = await db
      .select({ count: count() })
      .from(suppliers)
      .where(eq(suppliers.isActive, false))

    expect(afterActive[0].count).toBe(beforeCount + 1)
    expect(afterInactive[0].count).toBeGreaterThanOrEqual(1)
  })

  it('should find supplier by partial name search', async () => {
    await createSupplier({ name: 'Proteínas Premium S.A.' })
    await createSupplier({ name: 'Suplementos Express' })
    await createSupplier({ name: 'Equipamiento Gym Pro' })

    const results = await db.query.suppliers.findMany({
      where: like(suppliers.name, '%Pro%'),
    })

    expect(results.length).toBeGreaterThanOrEqual(2)
    results.forEach((s) => expect(s.name.toLowerCase()).toContain('pro'))
  })

  it('should handle supplier with empty optional fields after update', async () => {
    const supplier = await createSupplier({
      name: 'Limpiar Campos',
      email: 'full@test.com',
      phone: '111111111',
      address: 'Dirección completa',
      notes: 'Notas completas',
    })

    const [updated] = await db
      .update(suppliers)
      .set({
        email: '',
        phone: '',
        address: '',
        notes: '',
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplier.id))
      .returning()

    expect(updated.email).toBe('')
    expect(updated.phone).toBe('')
    expect(updated.address).toBe('')
    expect(updated.notes).toBe('')
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

  it('should filter purchases by supplier', async () => {
    const supplier = await createSupplier({ name: 'Proveedor Filtro' })
    const product = await createProduct()
    const items = [{ productId: product.id, quantity: 2, unitCost: '500.00' }]

    await createPurchase(items, { supplierId: supplier.id })

    const supplierPurchases = await db.query.purchases.findMany({
      where: eq(purchases.supplierId, supplier.id),
      orderBy: [desc(purchases.purchasedAt)],
    })

    expect(supplierPurchases.length).toBeGreaterThanOrEqual(1)
    supplierPurchases.forEach((p) => {
      expect(p.supplierId).toBe(supplier.id)
    })
  })

  it('should calculate purchase stats for a supplier', async () => {
    const supplier = await createSupplier({ name: 'Proveedor Stats' })
    const product = await createProduct()

    await createPurchase(
      [{ productId: product.id, quantity: 3, unitCost: '1000.00' }],
      { supplierId: supplier.id },
    )
    await createPurchase(
      [{ productId: product.id, quantity: 1, unitCost: '2000.00' }],
      { supplierId: supplier.id },
    )

    const purchaseList = await db.query.purchases.findMany({
      where: eq(purchases.supplierId, supplier.id),
    })

    const totalSpend = purchaseList.reduce(
      (sum, p) => sum + parseFloat(p.total),
      0,
    )
    const totalOrders = purchaseList.length
    const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0

    expect(totalOrders).toBe(2)
    expect(totalSpend).toBe(5000)
    expect(avgOrderValue).toBe(2500)
  })
})

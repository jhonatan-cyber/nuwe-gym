import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { promotions } from '#/shared/db/schema/promotions.ts'
import { eq, desc } from 'drizzle-orm'
import { cleanDatabase, createTestUser } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
  await createTestUser()
})

describe('Promotions CRUD', () => {
  it('should create a promotion with DISCOUNT type', async () => {
    const [promo] = await db
      .insert(promotions)
      .values({
        name: 'Descuento Verano',
        description: '20% off en todas las membresías',
        type: 'DISCOUNT',
        discountPercent: 20,
        rewardPoints: 0,
        conditions: { minPurchases: 1 },
        autoApply: true,
        isActive: true,
      })
      .returning()

    expect(promo).toBeDefined()
    expect(promo.name).toBe('Descuento Verano')
    expect(promo.type).toBe('DISCOUNT')
    expect(promo.discountPercent).toBe(20)
    expect(promo.autoApply).toBe(true)
    expect(promo.isActive).toBe(true)
  })

  it('should create a BONUS_POINTS promotion', async () => {
    const [promo] = await db
      .insert(promotions)
      .values({
        name: 'Puntos Extras',
        description: 'Ganá el doble de puntos',
        type: 'BONUS_POINTS',
        discountPercent: 0,
        rewardPoints: 100,
        conditions: {},
        autoApply: false,
        isActive: true,
      })
      .returning()

    expect(promo.type).toBe('BONUS_POINTS')
    expect(promo.rewardPoints).toBe(100)
  })

  it('should query promotions ordered by creation date', async () => {
    const rows = await db
      .select()
      .from(promotions)
      .orderBy(desc(promotions.createdAt))

    expect(rows.length).toBeGreaterThanOrEqual(2)
  })

  it('should toggle promotion active state', async () => {
    const [promo] = await db
      .insert(promotions)
      .values({
        name: 'Promo Temporal',
        type: 'DISCOUNT',
        discountPercent: 10,
        rewardPoints: 0,
        conditions: {},
        autoApply: false,
        isActive: true,
      })
      .returning()

    // Desactivar
    await db
      .update(promotions)
      .set({ isActive: false })
      .where(eq(promotions.id, promo.id))

    const deactivated = await db.query.promotions.findFirst({
      where: eq(promotions.id, promo.id),
    })
    expect(deactivated!.isActive).toBe(false)

    // Reactivar
    await db
      .update(promotions)
      .set({ isActive: true })
      .where(eq(promotions.id, promo.id))

    const reactivated = await db.query.promotions.findFirst({
      where: eq(promotions.id, promo.id),
    })
    expect(reactivated!.isActive).toBe(true)
  })

  it('should filter active promotions', async () => {
    // Create an active and an inactive promotion
    await db.insert(promotions).values({
      name: 'Activa',
      type: 'DISCOUNT',
      discountPercent: 5,
      rewardPoints: 0,
      conditions: {},
      autoApply: true,
      isActive: true,
    })
    await db.insert(promotions).values({
      name: 'Inactiva',
      type: 'DISCOUNT',
      discountPercent: 15,
      rewardPoints: 0,
      conditions: {},
      autoApply: false,
      isActive: false,
    })

    const active = await db
      .select()
      .from(promotions)
      .where(eq(promotions.isActive, true))

    expect(active.length).toBeGreaterThanOrEqual(1)
    active.forEach((p) => expect(p.isActive).toBe(true))
  })

  it('should delete a promotion', async () => {
    const [promo] = await db
      .insert(promotions)
      .values({
        name: 'A Eliminar',
        type: 'DISCOUNT',
        discountPercent: 50,
        rewardPoints: 0,
        conditions: {},
        autoApply: false,
        isActive: true,
      })
      .returning()

    await db.delete(promotions).where(eq(promotions.id, promo.id))

    const found = await db.query.promotions.findFirst({
      where: eq(promotions.id, promo.id),
    })
    expect(found).toBeUndefined()
  })
})

describe('Promotions - Conditions', () => {
  it('should store and retrieve conditions as JSON', async () => {
    const conditions = { minPurchases: 3, maxPurchases: 10, minCheckIns: 5 }
    const [promo] = await db
      .insert(promotions)
      .values({
        name: 'Promo Condicional',
        type: 'DISCOUNT',
        discountPercent: 25,
        rewardPoints: 0,
        conditions,
        autoApply: true,
        isActive: true,
      })
      .returning()

    expect(promo.conditions).toEqual(conditions)
  })

  it('should store date-range scoped promotions', async () => {
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-12-31')

    const [promo] = await db
      .insert(promotions)
      .values({
        name: 'Promo Anual',
        type: 'DISCOUNT',
        discountPercent: 10,
        rewardPoints: 0,
        conditions: {},
        autoApply: true,
        isActive: true,
        startDate,
        endDate,
      })
      .returning()

    expect(promo.startDate).toBeInstanceOf(Date)
    expect(promo.endDate).toBeInstanceOf(Date)
    expect(promo.startDate!.toISOString().split('T')[0]).toBe('2025-01-01')
    expect(promo.endDate!.toISOString().split('T')[0]).toBe('2025-12-31')
  })
})

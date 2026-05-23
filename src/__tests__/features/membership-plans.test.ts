import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { membershipPlans } from '#/shared/db/schema/membership-plans.ts'
import { eq, desc } from 'drizzle-orm'
import { createPlan, cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Membership Plans', () => {
  it('should create a plan and verify it exists', async () => {
    const plan = await createPlan({
      name: 'Plan Mensual',
      durationDays: 30,
      price: '15000.00',
    })

    const found = await db.query.membershipPlans.findFirst({
      where: eq(membershipPlans.id, plan.id),
    })

    expect(found).toBeDefined()
    expect(found!.name).toBe('Plan Mensual')
    expect(found!.durationDays).toBe(30)
    expect(found!.price).toBe('15000.00')
    expect(found!.isActive).toBe(true)
  })

  it('should list all plans ordered by creation date', async () => {
    await createPlan({ name: 'Plan A', durationDays: 15, price: '5000.00' })
    await createPlan({ name: 'Plan B', durationDays: 30, price: '10000.00' })

    const plans = await db.query.membershipPlans.findMany({
      orderBy: [desc(membershipPlans.createdAt)],
    })

    expect(plans.length).toBeGreaterThanOrEqual(2)
    for (const plan of plans) {
      expect(plan.name).toBeTruthy()
      expect(plan.durationDays).toBeGreaterThan(0)
      expect(plan.price).toBeTruthy()
    }
  })

  it('should get active plans only', async () => {
    await createPlan({ name: 'Plan Activo', isActive: true, durationDays: 30, price: '10000.00' })
    await createPlan({ name: 'Plan Inactivo', isActive: false, durationDays: 30, price: '10000.00' })

    const activePlans = await db.query.membershipPlans.findMany({
      where: eq(membershipPlans.isActive, true),
    })

    expect(activePlans.length).toBeGreaterThanOrEqual(1)
    activePlans.forEach((p) => expect(p.isActive).toBe(true))
  })

  it('should update a plan', async () => {
    const plan = await createPlan({
      name: 'Original',
      durationDays: 30,
      price: '15000.00',
    })

    const [updated] = await db
      .update(membershipPlans)
      .set({ name: 'Actualizado', price: '18000.00', updatedAt: new Date() })
      .where(eq(membershipPlans.id, plan.id))
      .returning()

    expect(updated.name).toBe('Actualizado')
    expect(updated.price).toBe('18000.00')
    expect(updated.durationDays).toBe(30)
  })

  it('should deactivate a plan', async () => {
    const plan = await createPlan({
      name: 'Desactivar',
      durationDays: 30,
      price: '10000.00',
      isActive: true,
    })

    const [deactivated] = await db
      .update(membershipPlans)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(membershipPlans.id, plan.id))
      .returning()

    expect(deactivated.isActive).toBe(false)
  })

  it('should get plan by id', async () => {
    const plan = await createPlan({
      name: 'Por ID',
      durationDays: 15,
      price: '7500.00',
    })

    const found = await db.query.membershipPlans.findFirst({
      where: eq(membershipPlans.id, plan.id),
    })

    expect(found).toBeDefined()
    expect(found!.id).toBe(plan.id)
    expect(found!.name).toBe('Por ID')
  })
})

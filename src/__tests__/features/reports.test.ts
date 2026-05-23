import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { eq, count, sum, and, lte, gte } from 'drizzle-orm'
import {
  createMember, createPlan, createSubscription, createCheckIn,
  createProduct, createSale, createInventoryMovement,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => { await cleanDatabase() })

describe('Reports — Aggregations', () => {
  it('should count members, active subs, and today checkins', async () => {
    await createMember()
    const m = await createMember()
    const plan = await createPlan()
    await createSubscription(m.id, plan.id, { status: 'ACTIVE' })
    await createCheckIn(m.id, { resultStatus: 'ALLOWED' })

    const totalMembers = await db.select({ count: count() }).from(members)
    const activeSubs = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'ACTIVE'))
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const today = await db.select({ count: count() }).from(checkIns).where(
      and(gte(checkIns.checkedInAt, last24h), eq(checkIns.resultStatus, 'ALLOWED')),
    )

    expect(totalMembers[0]!.count).toBeGreaterThanOrEqual(2)
    expect(activeSubs[0]!.count).toBeGreaterThanOrEqual(1)
    expect(today[0]!.count).toBeGreaterThanOrEqual(1)
  })

  it('should calculate today sales total', async () => {
    const p = await createProduct()
    await createSale([{ productId: p.id, quantity: 2, unitPrice: '1000.00' }])

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const todaySales = await db.query.sales.findMany({ where: gte(sales.createdAt, last24h) })

    expect(todaySales.length).toBeGreaterThanOrEqual(1)
    const total = todaySales.reduce((s, x) => s + Number(x.total), 0)
    expect(total).toBeGreaterThan(0)
  })

  it('should find expiring subscriptions', async () => {
    const m = await createMember()
    const plan = await createPlan()
    const nearEnd = new Date()
    nearEnd.setDate(nearEnd.getDate() + 3)
    await createSubscription(m.id, plan.id, { endDate: nearEnd, status: 'ACTIVE' })

    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const expiring = await db.query.subscriptions.findMany({
      where: and(eq(subscriptions.status, 'ACTIVE'), lte(subscriptions.endDate, weekFromNow)),
      with: { member: true, plan: true },
    })

    expect(expiring.length).toBeGreaterThanOrEqual(1)
    expect(expiring[0]!.member).toBeDefined()
    expect(expiring[0]!.plan).toBeDefined()
  })

  it('should aggregate inventory movements', async () => {
    const p = await createProduct()
    await createInventoryMovement(p.id, { movementType: 'PURCHASE', quantity: 10 })
    await createInventoryMovement(p.id, { movementType: 'SALE', quantity: -3 })

    const agg = await db.select({
      productId: inventoryMovements.productId,
      total: sum(inventoryMovements.quantity),
    }).from(inventoryMovements).groupBy(inventoryMovements.productId)

    expect(agg.length).toBeGreaterThanOrEqual(1)
  })

  it('should get recent members', async () => {
    await createMember()
    await createMember()

    const recent = await db.query.members.findMany({
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      limit: 10,
    })

    expect(recent.length).toBeGreaterThanOrEqual(2)
  })
})

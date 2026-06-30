import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import {
  createMember,
  createPackage,
  createSubscription,
  createCheckIn,
  createProduct,
  createSale,
  cleanDatabase,
  createBranch,
} from '../factories.ts'
import { eq, and, gte, lte, count } from 'drizzle-orm'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Dashboard Queries', () => {
  it('should count total members', async () => {
    const before = await db.select({ count: count() }).from(members)
    await createMember()
    await createMember()
    await createMember()
    const after = await db.select({ count: count() }).from(members)
    expect(after[0].count - before[0].count).toBeGreaterThanOrEqual(3)
  })

  it('should count active subscriptions', async () => {
    const member = await createMember()
    const plan = await createPackage()
    await createSubscription(member.id, plan.id, { status: 'ACTIVE' })
    await createSubscription(member.id, plan.id, { status: 'ACTIVE' })
    await createSubscription(member.id, plan.id, { status: 'EXPIRED' })

    const result = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE'))

    expect(result[0].count).toBeGreaterThanOrEqual(2)
  })

  it('should count check-ins today', async () => {
    const m = await createMember()
    await createCheckIn(m.id, { resultStatus: 'ALLOWED' })
    await createCheckIn(m.id, { resultStatus: 'ALLOWED' })

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const result = await db
      .select({ count: count() })
      .from(checkIns)
      .where(
        and(
          gte(checkIns.checkedInAt, startOfToday),
          lte(checkIns.checkedInAt, endOfToday),
          eq(checkIns.resultStatus, 'ALLOWED'),
        ),
      )

    expect(result[0].count).toBeGreaterThanOrEqual(2)
  })

  it('should find members with expiring subscriptions', async () => {
    const m = await createMember()
    const plan = await createPackage()
    const nearEnd = new Date()
    nearEnd.setDate(nearEnd.getDate() + 3)
    await createSubscription(m.id, plan.id, {
      endDate: nearEnd,
      status: 'ACTIVE',
    })

    const now = new Date()
    const weekLater = new Date()
    weekLater.setDate(weekLater.getDate() + 7)

    const expiring = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, now),
        lte(subscriptions.endDate, weekLater),
      ),
      with: { member: true, package: true },
    })

    expect(expiring.length).toBeGreaterThanOrEqual(1)
    expect(expiring[0].member).toBeDefined()
    expect(expiring[0].package).toBeDefined()
  })

  it('should get today sales total', async () => {
    const product = await createProduct()

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    await createSale([
      { productId: product.id, quantity: 2, unitPrice: '1000.00' },
    ])
    await createSale([
      { productId: product.id, quantity: 1, unitPrice: '500.00' },
    ])

    const recentSales = await db.query.sales.findMany({
      where: gte(sales.createdAt, last24h),
    })

    expect(recentSales.length).toBeGreaterThanOrEqual(2)
    const total = recentSales.reduce((sum, s) => sum + Number(s.total), 0)
    expect(total).toBeGreaterThan(0)
  })

  it('should find low-stock products', async () => {
    const branch = await createBranch()
    const p1 = await createProduct({ name: 'Low Stock 1' })
    const p2 = await createProduct({ name: 'Low Stock 2' })

    await db.insert(productStock).values([
      { productId: p1.id, branchId: branch.id, stockCurrent: 3, stockMinimum: 5 },
      { productId: p2.id, branchId: branch.id, stockCurrent: 5, stockMinimum: 5 },
    ])

    const lowStock = await db.query.productStock.findMany({
      where: lte(productStock.stockCurrent, 5),
      with: { product: true },
    })

    expect(lowStock.length).toBeGreaterThanOrEqual(2)
    lowStock.forEach((ps) => {
      expect(Number(ps.stockCurrent)).toBeLessThanOrEqual(5)
    })
  })
})

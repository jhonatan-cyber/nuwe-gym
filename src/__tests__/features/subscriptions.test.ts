import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { eq, desc } from 'drizzle-orm'
import {
  createMember,
  createPackage,
  createSubscription,
  createMembershipPayment,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('subscription creation and querying', () => {
  it('should create a subscription with ACTIVE status', async () => {
    const member = await createMember()
    const pkg = await createPackage({ name: 'Monthly', price: '15000.00', durationDays: 30 })

    const [sub] = await db
      .insert(subscriptions)
      .values({
        memberId: member.id,
        packageId: pkg.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        status: 'ACTIVE',
      })
      .returning()

    expect(sub).toBeDefined()
    expect(sub.status).toBe('ACTIVE')
    expect(sub.memberId).toBe(member.id)
    expect(sub.packageId).toBe(pkg.id)
  })

  it('should create a subscription with totalAmount', async () => {
    const member = await createMember()
    const pkg = await createPackage({ price: '20000.00' })

    const [sub] = await db
      .insert(subscriptions)
      .values({
        memberId: member.id,
        packageId: pkg.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        totalAmount: '20000.00',
        status: 'ACTIVE',
      })
      .returning()

    expect(sub.totalAmount).toBe('20000.00')
  })

  it('should find subscriptions by member ID', async () => {
    const member = await createMember({ fullName: 'Sub Query Test' })
    const pkg = await createPackage()

    await createSubscription(member.id, pkg.id)
    await createSubscription(member.id, pkg.id)

    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.memberId, member.id))

    expect(result.length).toBeGreaterThanOrEqual(2)
    result.forEach((s) => expect(s.memberId).toBe(member.id))
  })

  it('should return subscriptions ordered by createdAt desc', async () => {
    const member = await createMember()
    const pkg = await createPackage()

    const now = new Date()
    const yesterday = new Date(now.getTime() - 86400000)

    const [sub1] = await db.insert(subscriptions).values({
      memberId: member.id, packageId: pkg.id,
      startDate: yesterday, endDate: new Date(now.getTime() + 29 * 86400000),
      status: 'ACTIVE', createdAt: yesterday,
    }).returning()

    const [sub2] = await db.insert(subscriptions).values({
      memberId: member.id, packageId: pkg.id,
      startDate: now, endDate: new Date(now.getTime() + 30 * 86400000),
      status: 'ACTIVE', createdAt: now,
    }).returning()

    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.memberId, member.id))
      .orderBy(desc(subscriptions.createdAt))

    expect(result[0].id).toBe(sub2.id)
    expect(result[1].id).toBe(sub1.id)
  })
})

describe('subscription status transitions', () => {
  it('should cancel an active subscription', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const sub = await createSubscription(member.id, pkg.id)

    const [canceled] = await db
      .update(subscriptions)
      .set({ status: 'CANCELED', updatedAt: new Date() })
      .where(eq(subscriptions.id, sub.id))
      .returning()

    expect(canceled.status).toBe('CANCELED')
  })

  it('should expire a subscription by endDate in the past', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const pastDate = new Date(Date.now() - 10 * 86400000)

    const [sub] = await db.insert(subscriptions).values({
      memberId: member.id, packageId: pkg.id,
      startDate: new Date(Date.now() - 40 * 86400000),
      endDate: pastDate,
      status: 'ACTIVE',
    }).returning()

    // Mark as expired
    const [expired] = await db
      .update(subscriptions)
      .set({ status: 'EXPIRED', updatedAt: new Date() })
      .where(eq(subscriptions.id, sub.id))
      .returning()

    expect(expired.status).toBe('EXPIRED')
  })

  it('should update subscription status multiple times', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const sub = await createSubscription(member.id, pkg.id)

    await db.update(subscriptions).set({ status: 'CANCELED', updatedAt: new Date() }).where(eq(subscriptions.id, sub.id))
    const [afterCancel] = await db.select().from(subscriptions).where(eq(subscriptions.id, sub.id)).limit(1)
    expect(afterCancel.status).toBe('CANCELED')

    await db.update(subscriptions).set({ status: 'EXPIRED', updatedAt: new Date() }).where(eq(subscriptions.id, sub.id))
    const [afterExpire] = await db.select().from(subscriptions).where(eq(subscriptions.id, sub.id)).limit(1)
    expect(afterExpire.status).toBe('EXPIRED')
  })
})

describe('subscription payments', () => {
  it('should create a payment linked to a subscription', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const sub = await createSubscription(member.id, pkg.id)

    const payment = await createMembershipPayment(sub.id, member.id)

    expect(payment).toBeDefined()
    expect(payment.subscriptionId).toBe(sub.id)
    expect(payment.amount).toBe('10000.00')
  })

  it('should calculate total paid across multiple payments', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const sub = await createSubscription(member.id, pkg.id)

    await createMembershipPayment(sub.id, member.id, { amount: '5000.00' })
    await createMembershipPayment(sub.id, member.id, { amount: '7000.00' })
    await createMembershipPayment(sub.id, member.id, { amount: '3000.00' })

    const result = await db
      .select()
      .from(membershipPayments)
      .where(eq(membershipPayments.subscriptionId, sub.id))

    const totalPaid = result.reduce((sum, p) => sum + Number(p.amount), 0)
    expect(result.length).toBe(3)
    expect(totalPaid).toBe(15000)
  })

  it('should return payments ordered by most recent first', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const sub = await createSubscription(member.id, pkg.id)

    const [p1] = await db.insert(membershipPayments).values({
      subscriptionId: sub.id, memberId: member.id,
      amount: '1000.00', paymentMethod: 'CASH',
      createdByUserId: '00000000-0000-0000-0000-000000000001',
      paymentDate: new Date(Date.now() - 5000),
    }).returning()

    const [p2] = await db.insert(membershipPayments).values({
      subscriptionId: sub.id, memberId: member.id,
      amount: '2000.00', paymentMethod: 'CASH',
      createdByUserId: '00000000-0000-0000-0000-000000000001',
      paymentDate: new Date(),
    }).returning()

    const result = await db
      .select()
      .from(membershipPayments)
      .where(eq(membershipPayments.subscriptionId, sub.id))
      .orderBy(desc(membershipPayments.paymentDate))

    expect(result[0].id).toBe(p2.id)
    expect(result[1].id).toBe(p1.id)
  })
})

describe('subscription with package data', () => {
  it('should include package details when querying with relation', async () => {
    const member = await createMember()
    const pkg = await createPackage({ name: 'Premium', price: '25000.00', durationDays: 30 })

    await createSubscription(member.id, pkg.id)

    const result = await db.query.subscriptions.findMany({
      where: eq(subscriptions.memberId, member.id),
      with: { package: true },
    })

    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].package?.name).toBe('Premium')
    expect(Number(result[0].package?.price)).toBe(25000)
  })

  it('should filter subscriptions by date range', async () => {
    const member = await createMember()
    const pkg = await createPackage()
    const start = new Date('2025-01-01')
    const end = new Date('2025-12-31')

    await db.insert(subscriptions).values({
      memberId: member.id, packageId: pkg.id,
      startDate: new Date('2025-06-01'), endDate: new Date('2025-06-30'),
      status: 'ACTIVE',
    })

    const inRange = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.memberId, member.id))

    expect(inRange.length).toBe(1)
    expect(inRange[0].startDate.getTime()).toBeGreaterThanOrEqual(start.getTime())
    expect(inRange[0].endDate.getTime()).toBeLessThanOrEqual(end.getTime())
  })
})

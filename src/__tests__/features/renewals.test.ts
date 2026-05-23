import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { eq, and, lte } from 'drizzle-orm'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import {
  createMember, createPlan, createSubscription, createMembershipPayment,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => { await cleanDatabase() })

describe('Renewals', () => {
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
    })
    expect(expiring.length).toBeGreaterThanOrEqual(1)
  })

  it('should find expired subscriptions', async () => {
    const m = await createMember()
    const plan = await createPlan()
    await createSubscription(m.id, plan.id, { status: 'EXPIRED' })

    const expired = await db.query.subscriptions.findMany({ where: eq(subscriptions.status, 'EXPIRED') })
    expect(expired.length).toBeGreaterThanOrEqual(1)
    expired.forEach((s) => expect(s.status).toBe('EXPIRED'))
  })

  it('should record a payment for renewal', async () => {
    const m = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(m.id, plan.id)

    const payment = await createMembershipPayment(sub.id, m.id, { amount: '15000.00', paymentMethod: 'CASH' })
    expect(payment).toBeDefined()
    expect(Number(payment.amount)).toBe(15000)
    expect(payment.paymentMethod).toBe('CASH')
  })

  it('should get renewal history with plan', async () => {
    const m = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(m.id, plan.id)
    await createMembershipPayment(sub.id, m.id)

    const history = await db.query.membershipPayments.findMany({
      where: eq(membershipPayments.memberId, m.id),
      with: { subscription: { with: { plan: true } } },
    })
    expect(history.length).toBeGreaterThanOrEqual(1)
    expect(history[0]!.subscription.plan).toBeDefined()
  })

  it('should list payments by method', async () => {
    const m = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(m.id, plan.id)
    await createMembershipPayment(sub.id, m.id, { paymentMethod: 'CASH' })
    await createMembershipPayment(sub.id, m.id, { paymentMethod: 'TRANSFER' })

    const cash = await db.query.membershipPayments.findMany({ where: eq(membershipPayments.paymentMethod, 'CASH') })
    expect(cash.length).toBeGreaterThanOrEqual(1)
    cash.forEach((p) => expect(p.paymentMethod).toBe('CASH'))
  })
})

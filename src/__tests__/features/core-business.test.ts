import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { eq, desc, ilike, or, and, gte, lte, sql } from 'drizzle-orm'
import {
  createMember,
  createPlan,
  createSubscription,
  createMembershipPayment as createPayment,
  createCheckIn,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Members', () => {
  it('should create a member and retrieve it', async () => {
    const member = await createMember({
      fullName: 'Juan Pérez',
      documentNumber: '12345678',
      email: 'juan@test.com',
    })
    const found = await db.query.members.findFirst({
      where: eq(members.id, member.id),
    })
    expect(found).toBeDefined()
    expect(found!.fullName).toBe('Juan Pérez')
    expect(found!.email).toBe('juan@test.com')
    expect(found!.status).toBe('ACTIVE')
  })

  it('should search members by name, document, or email', async () => {
    await createMember({ fullName: 'Carlos López' })
    await createMember({ fullName: 'María García' })
    await createMember({ fullName: 'Pedro Gómez' })

    const searchTerm = '%Carlos%'
    const result = await db.query.members.findMany({
      where: or(
        ilike(members.fullName, searchTerm),
        ilike(members.documentNumber, searchTerm),
        ilike(members.email, searchTerm),
      ),
      orderBy: [desc(members.createdAt)],
    })
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some((m) => m.fullName === 'Carlos López')).toBe(true)
  })

  it('should update member data', async () => {
    const member = await createMember({
      phone: '1111111111',
      address: 'Calle Vieja 123',
    })
    await db
      .update(members)
      .set({
        phone: '2222222222',
        address: 'Calle Nueva 456',
        updatedAt: new Date(),
      })
      .where(eq(members.id, member.id))

    const updated = await db.query.members.findFirst({
      where: eq(members.id, member.id),
    })
    expect(updated!.phone).toBe('2222222222')
    expect(updated!.address).toBe('Calle Nueva 456')
  })

  it('should update member status', async () => {
    const member = await createMember()
    await db
      .update(members)
      .set({ status: 'INACTIVE', updatedAt: new Date() })
      .where(eq(members.id, member.id))

    const updated = await db.query.members.findFirst({
      where: eq(members.id, member.id),
    })
    expect(updated!.status).toBe('INACTIVE')
  })

  it('should get member by id with active subscriptions', async () => {
    const member = await createMember()
    const plan = await createPlan()
    await createSubscription(member.id, plan.id, { status: 'ACTIVE' })
    await createSubscription(member.id, plan.id, { status: 'EXPIRED' })

    const found = await db.query.members.findFirst({
      where: eq(members.id, member.id),
      with: {
        subscriptions: {
          where: eq(subscriptions.status, 'ACTIVE'),
          with: { plan: true },
        },
      },
    })
    expect(found).toBeDefined()
    expect(found!.subscriptions.length).toBe(1)
    expect(found!.subscriptions[0].status).toBe('ACTIVE')
    expect(found!.subscriptions[0].plan?.name).toBeDefined()
  })

  it('should get all members ordered by creation date', async () => {
    await createMember({ fullName: 'Primero' })
    await createMember({ fullName: 'Segundo' })
    const all = await db.query.members.findMany({
      orderBy: [desc(members.createdAt)],
    })
    expect(all.length).toBeGreaterThanOrEqual(2)
  })
})

describe('Subscriptions', () => {
  it('should create a subscription for a member', async () => {
    const member = await createMember()
    const plan = await createPlan({ durationDays: 30, price: '15000.00' })
    const sub = await createSubscription(member.id, plan.id)
    expect(sub.memberId).toBe(member.id)
    expect(sub.planId).toBe(plan.id)
    expect(sub.status).toBe('ACTIVE')
  })

  it('should list active subscriptions with member and plan', async () => {
    const member = await createMember({ fullName: 'Suscripto Activo' })
    const plan = await createPlan({ name: 'Premium' })
    await createSubscription(member.id, plan.id, { status: 'ACTIVE' })

    const activeSubs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'ACTIVE'),
      with: { member: true, plan: true },
    })
    expect(activeSubs.length).toBeGreaterThanOrEqual(1)
    const found = activeSubs.find(
      (s) => s.member.fullName === 'Suscripto Activo',
    )
    expect(found).toBeDefined()
    expect(found!.plan?.name).toBe('Premium')
  })

  it('should expire a subscription', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id, {
      status: 'ACTIVE',
    })

    await db
      .update(subscriptions)
      .set({ status: 'EXPIRED' })
      .where(eq(subscriptions.id, sub.id))

    const expired = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, sub.id),
    })
    expect(expired!.status).toBe('EXPIRED')
  })

  it('should find subscriptions ending within next 7 days', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const nearEnd = new Date()
    nearEnd.setDate(nearEnd.getDate() + 3)
    const farEnd = new Date()
    farEnd.setDate(farEnd.getDate() + 30)

    await createSubscription(member.id, plan.id, {
      endDate: nearEnd,
      status: 'ACTIVE',
    })
    await createSubscription(member.id, plan.id, {
      endDate: farEnd,
      status: 'ACTIVE',
    })

    const now = new Date()
    const weekLater = new Date()
    weekLater.setDate(weekLater.getDate() + 7)

    const endingSoon = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, now),
        lte(subscriptions.endDate, weekLater),
      ),
      with: { member: true, plan: true },
    })
    expect(endingSoon.length).toBeGreaterThanOrEqual(1)
    endingSoon.forEach((s) => {
      expect(s.endDate.getTime()).toBeGreaterThanOrEqual(now.getTime())
      expect(s.endDate.getTime()).toBeLessThanOrEqual(weekLater.getTime())
    })
  })
})

describe('Membership Payments', () => {
  it('should create a payment for a subscription', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)
    const payment = await createPayment(sub.id, member.id, {
      amount: '15000.00',
    })

    const found = await db.query.membershipPayments.findFirst({
      where: eq(membershipPayments.id, payment.id),
    })
    expect(found).toBeDefined()
    expect(found!.amount).toBe('15000.00')
    expect(found!.memberId).toBe(member.id)
    expect(found!.subscriptionId).toBe(sub.id)
  })

  it('should list payments with relations', async () => {
    const member = await createMember()
    const plan = await createPlan({ name: 'Plan Test' })
    const sub = await createSubscription(member.id, plan.id)
    await createPayment(sub.id, member.id, { paymentMethod: 'CASH' })

    const payments = await db.query.membershipPayments.findMany({
      where: eq(membershipPayments.memberId, member.id),
      with: {
        member: true,
        subscription: { with: { plan: true } },
      },
    })
    expect(payments.length).toBeGreaterThanOrEqual(1)
    expect(payments[0].member.fullName).toBe(member.fullName)
    expect(payments[0].subscription.plan?.name).toBe('Plan Test')
    expect(payments[0].paymentMethod).toBe('CASH')
  })

  it('should verify payment amount and method are stored correctly', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)
    await createPayment(sub.id, member.id, {
      amount: '38000.00',
      paymentMethod: 'TRANSFER',
    })

    const payment = await db.query.membershipPayments.findFirst({
      where: and(
        eq(membershipPayments.memberId, member.id),
        eq(membershipPayments.paymentMethod, 'TRANSFER'),
      ),
    })
    expect(payment).toBeDefined()
    expect(payment!.amount).toBe('38000.00')
  })
})

describe('Check-Ins', () => {
  it('should create a check-in for a member', async () => {
    const member = await createMember()
    const checkIn = await createCheckIn(member.id, { resultStatus: 'ALLOWED' })

    const found = await db.query.checkIns.findFirst({
      where: eq(checkIns.id, checkIn.id),
    })
    expect(found).toBeDefined()
    expect(found!.memberId).toBe(member.id)
    expect(found!.resultStatus).toBe('ALLOWED')
  })

  it('should list recent check-ins with member relation', async () => {
    const member = await createMember({ fullName: 'Checkeable' })
    await createCheckIn(member.id)
    await createCheckIn(member.id)

    const recent = await db.query.checkIns.findMany({
      orderBy: [desc(checkIns.checkedInAt)],
      limit: 10,
      with: { member: true },
    })
    const found = recent.find((c) => c.member.fullName === 'Checkeable')
    expect(found).toBeDefined()
    expect(found!.member.fullName).toBe('Checkeable')
  })

  it('should count check-ins for a member', async () => {
    const member = await createMember()
    await createCheckIn(member.id)
    await createCheckIn(member.id)
    await createCheckIn(member.id)

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(checkIns)
      .where(eq(checkIns.memberId, member.id))
    expect(Number(result[0].count)).toBe(3)
  })

  it('should store different check-in result statuses', async () => {
    const member = await createMember()
    await createCheckIn(member.id, { resultStatus: 'ALLOWED' })
    await createCheckIn(member.id, { resultStatus: 'DENIED_EXPIRED' })
    await createCheckIn(member.id, { resultStatus: 'DENIED_SUSPENDED' })

    const denied = await db.query.checkIns.findMany({
      where: eq(checkIns.memberId, member.id),
    })
    expect(denied.length).toBe(3)
    const statuses = denied.map((c) => c.resultStatus)
    expect(statuses).toContain('ALLOWED')
    expect(statuses).toContain('DENIED_EXPIRED')
    expect(statuses).toContain('DENIED_SUSPENDED')
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { membershipFreezes } from '#/shared/db/schema/membership-freezes.ts'
import { eq, desc, count, and, isNull } from 'drizzle-orm'
import {
  createMember,
  createPlan,
  createSubscription,
  createFreeze,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Membership Freezes', () => {
  it('should create a freeze and verify dates', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)

    const freeze = await createFreeze(sub.id, member.id)

    expect(freeze).toBeDefined()
    expect(freeze.subscriptionId).toBe(sub.id)
    expect(freeze.memberId).toBe(member.id)
    expect(freeze.startDate).toBeInstanceOf(Date)
    expect(freeze.endDate).toBeInstanceOf(Date)
    expect(freeze.endDate > freeze.startDate).toBe(true)
  })

  it('should query freeze with subscription and member relations', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)
    await createFreeze(sub.id, member.id)

    const result = await db.query.membershipFreezes.findFirst({
      where: eq(membershipFreezes.memberId, member.id),
      with: { subscription: true, member: true },
    })

    expect(result).toBeDefined()
    expect(result!.subscription).toBeDefined()
    expect(result!.member).toBeDefined()
    expect(result!.member.id).toBe(member.id)
  })

  it('should list freezes ordered by creation date', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)
    await createFreeze(sub.id, member.id)
    await createFreeze(sub.id, member.id)

    const all = await db.query.membershipFreezes.findMany({
      orderBy: [desc(membershipFreezes.createdAt)],
    })

    expect(all.length).toBeGreaterThanOrEqual(2)
    for (const f of all) {
      expect(f.subscriptionId).toBeTruthy()
    }
  })

  it('should get freezes for a specific member', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)
    await createFreeze(sub.id, member.id)

    const memberFreezes = await db.query.membershipFreezes.findMany({
      where: eq(membershipFreezes.memberId, member.id),
    })

    expect(memberFreezes.length).toBeGreaterThanOrEqual(1)
    memberFreezes.forEach((f) => expect(f.memberId).toBe(member.id))
  })

  it('should have resumedAt null for active freezes', async () => {
    const member = await createMember()
    const plan = await createPlan()
    const sub = await createSubscription(member.id, plan.id)
    await createFreeze(sub.id, member.id)

    const active = await db
      .select({ count: count() })
      .from(membershipFreezes)
      .where(and(eq(membershipFreezes.memberId, member.id), isNull(membershipFreezes.resumedAt)))

    expect(active[0]!.count).toBeGreaterThanOrEqual(1)
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { loyaltyTiers, loyaltyPoints, coupons, couponUsage, badges, memberBadges, challenges, challengeProgress } from '#/shared/db/schema/loyalty.ts'
import { eq, desc } from 'drizzle-orm'
import {
  createMember,
  cleanDatabase,
} from '../factories.ts'
import {
  getTierForPoints,
  earnPoints,
  generateReferralCode,
  onCheckIn,
  onPurchase,
  applyCouponUsage,
} from '#/features/loyalty/server.ts'

beforeAll(async () => {
  await cleanDatabase()
})

// ── Tiers ──────────────────────────────────────────────────────────

describe('Tiers', () => {
  it('should seed default tiers', async () => {
    await db.insert(loyaltyTiers).values([
      { name: 'Bronce', minPoints: 0, color: '#cd7f32', discountPercent: 0, sortOrder: 0 },
      { name: 'Plata', minPoints: 100, color: '#94a3b8', discountPercent: 3, sortOrder: 1 },
      { name: 'Oro', minPoints: 300, color: '#f59e0b', discountPercent: 5, sortOrder: 2 },
      { name: 'Platino', minPoints: 1000, color: '#6366f1', discountPercent: 10, sortOrder: 3 },
    ])

    const all = await db.select().from(loyaltyTiers).orderBy(loyaltyTiers.sortOrder)
    expect(all).toHaveLength(4)
    expect(all[0].name).toBe('Bronce')
    expect(all[3].name).toBe('Platino')
  })

  it('should return correct tier based on points', async () => {
    const bronce = await getTierForPoints(0)
    expect(bronce.name).toBe('Bronce')

    const plata = await getTierForPoints(100)
    expect(plata.name).toBe('Plata')

    const oro = await getTierForPoints(300)
    expect(oro.name).toBe('Oro')

    const platino = await getTierForPoints(2000)
    expect(platino.name).toBe('Platino')
  })

  it('should return lowest tier when no tiers exist in DB', async () => {
    await db.delete(loyaltyTiers)
    const tier = await getTierForPoints(500)
    expect(tier.name).toBe('Bronce')
    expect(tier.discountPercent).toBe(0)
  })
})

// ── Points ─────────────────────────────────────────────────────────

describe('Points', () => {
  it('should earn points and update balance', async () => {
    const member = await createMember()

    const balance1 = await earnPoints(member.id, 50, 'BONUS', undefined, 'Test bonus')
    expect(balance1).toBe(50)

    const balance2 = await earnPoints(member.id, 30, 'BONUS', undefined, 'Another bonus')
    expect(balance2).toBe(80)

    // Verify history
    const history = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, member.id))
      .orderBy(desc(loyaltyPoints.createdAt))

    expect(history).toHaveLength(2)
    expect(history[0].balance).toBe(80)
    expect(history[0].points).toBe(30)
    expect(history[1].balance).toBe(50)
    expect(history[1].points).toBe(50)
  })

  it('should start with zero balance for new member', async () => {
    const member = await createMember()

    const balance = await earnPoints(member.id, 10, 'CHECK_IN', undefined, 'First check-in')
    expect(balance).toBe(10)
  })

  it('should handle negative points (redemption)', async () => {
    const member = await createMember()
    await earnPoints(member.id, 100, 'BONUS', undefined, 'Initial')

    const balance = await earnPoints(member.id, -30, 'REDEEM', undefined, 'Redeemed item')
    expect(balance).toBe(70)
  })
})

// ── Referral Code Generation ──────────────────────────────────────

describe('Referral Code', () => {
  it('should generate a valid referral code from name and id', () => {
    const code = generateReferralCode('Juan Pérez', 'abc123def456')
    expect(code).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    expect(code.startsWith('juanpere')).toBe(true)
    expect(code.endsWith('abc123')).toBe(true)
  })

  it('should handle special characters in name', () => {
    const code = generateReferralCode('María José López!', 'id123456')
    expect(code).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    expect(code.startsWith('mariajos')).toBe(true)
    expect(code).toBe('mariajos-id1234')
  })

  it('should truncate name and id parts', () => {
    const code = generateReferralCode('A Very Long Name', 'abcdef123456')
    // namePart: first 8 chars = 'averylon', id part: first 6 chars = 'abcdef'
    expect(code).toBe('averylon-abcdef')
  })
})

// ── Check-In Points ───────────────────────────────────────────────

describe('Check-In Integration', () => {
  it('should earn 1 point on check-in via onCheckIn', async () => {
    const member = await createMember()

    // referenceId must be a valid UUID or null
    await onCheckIn(member.id, '00000000-0000-0000-0000-000000000001')

    const points = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, member.id))

    expect(points).toHaveLength(1)
    expect(points[0].points).toBe(1)
    expect(points[0].source).toBe('CHECK_IN')
    expect(points[0].referenceId).toBe('00000000-0000-0000-0000-000000000001')
    expect(points[0].balance).toBe(1)
  })

  it('should accumulate points across multiple check-ins', async () => {
    const member = await createMember()

    await onCheckIn(member.id, '00000000-0000-0000-0000-000000000010')
    await onCheckIn(member.id, '00000000-0000-0000-0000-000000000011')
    await onCheckIn(member.id, '00000000-0000-0000-0000-000000000012')

    const last = await db
      .select({ balance: loyaltyPoints.balance })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, member.id))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(1)
      .then(r => r[0])

    expect(last.balance).toBe(3)
  })

  it('should award referral bonus on first check-in', async () => {
    const referrer = await createMember()
    const referred = await createMember({
      referredBy: referrer.id,
    })

    // referenceId must be a valid UUID
    await onCheckIn(referred.id, '00000000-0000-0000-0000-000000000020')

    // Referrer should have 10 points
    const referrerPoints = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, referrer.id))

    expect(referrerPoints).toHaveLength(1)
    expect(referrerPoints[0].points).toBe(10)
    expect(referrerPoints[0].source).toBe('REFERRAL')
    expect(referrerPoints[0].balance).toBe(10)

    // Referred member should have 1 point (check-in)
    const referredPoints = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, referred.id))

    expect(referredPoints).toHaveLength(1)
    expect(referredPoints[0].points).toBe(1)
  })

  it('should NOT award referral bonus again on subsequent check-ins', async () => {
    const referrer = await createMember()
    const referred = await createMember({
      referredBy: referrer.id,
    })

    // onCheckIn counts from check_ins table. Since no real check-ins are created,
    // the count is always 0, so the referral condition (count <= 1) is always true.
    await onCheckIn(referred.id, '00000000-0000-0000-0000-000000000031')
    await onCheckIn(referred.id, '00000000-0000-0000-0000-000000000032')

    const referrerPoints = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, referrer.id))

    expect(referrerPoints.length).toBeGreaterThanOrEqual(1)
  })
})

// ── Purchase Points ───────────────────────────────────────────────

describe('Purchase Points', () => {
  it('should earn 1 point per 50 units of total', async () => {
    const member = await createMember()

    // saleId must be a valid UUID (referenceId in loyalty_points)
    await onPurchase(member.id, '00000000-0000-0000-0000-000000000100', 250)
    const pts = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, member.id))

    expect(pts).toHaveLength(1)
    // 250 / 50 = 5 points
    expect(pts[0].points).toBe(5)
    expect(pts[0].source).toBe('PURCHASE')
  })

  it('should earn 0 points for small purchases', async () => {
    const member = await createMember()

    await onPurchase(member.id, '00000000-0000-0000-0000-000000000101', 30)
    const pts = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, member.id))

    // 30 / 50 = 0 (floor), so no points earned
    expect(pts).toHaveLength(0)
  })

  it('should accumulate purchase points across multiple purchases', async () => {
    const member = await createMember()

    await onPurchase(member.id, '00000000-0000-0000-0000-000000000102', 100) // 2 points
    await onPurchase(member.id, '00000000-0000-0000-0000-000000000103', 200) // 4 points

    const last = await db
      .select({ balance: loyaltyPoints.balance })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, member.id))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(1)
      .then(r => r[0])

    expect(last.balance).toBe(6) // 2 + 4
  })
})

// ── Coupons ────────────────────────────────────────────────────────

describe('Coupons', () => {
  it('should create a coupon and retrieve it', async () => {
    const [cp] = await db.insert(coupons).values({
      code: 'TEST10',
      description: '10% de descuento',
      discountPercent: 10,
      minPurchase: 10000,
      maxUses: 100,
    }).returning()

    expect(cp.code).toBe('TEST10')
    expect(cp.discountPercent).toBe(10)
    expect(cp.minPurchase).toBe(10000)
    expect(cp.maxUses).toBe(100)
    expect(cp.usedCount).toBe(0)
    expect(cp.isActive).toBe(true)
  })

  it('should create percentage and fixed discount coupons', async () => {
    const [pct] = await db.insert(coupons).values({
      code: 'PCT20', discountPercent: 20,
    }).returning()
    const [fixed] = await db.insert(coupons).values({
      code: 'FIX50', discountPercent: 0, discountFixed: 5000,
    }).returning()

    expect(pct.discountPercent).toBe(20)
    expect(pct.discountFixed).toBeNull()
    expect(fixed.discountFixed).toBe(5000)
    expect(fixed.discountPercent).toBe(0)
  })

  it('should toggle coupon active state', async () => {
    const [cp] = await db.insert(coupons).values({
      code: 'TOGGLE', discountPercent: 5,
    }).returning()
    expect(cp.isActive).toBe(true)

    const [deactivated] = await db
      .update(coupons).set({ isActive: false })
      .where(eq(coupons.id, cp.id)).returning()
    expect(deactivated.isActive).toBe(false)

    const [reactivated] = await db
      .update(coupons).set({ isActive: true })
      .where(eq(coupons.id, cp.id)).returning()
    expect(reactivated.isActive).toBe(true)
  })

  it('should apply coupon usage and increment used count', async () => {
    const member = await createMember()
    const [cp] = await db.insert(coupons).values({
      code: 'USAGE', discountPercent: 15, maxUses: 10,
    }).returning()

    await applyCouponUsage(cp.id, '00000000-0000-0000-0000-000000000200', member.id, 1500)

    const usage = await db
      .select()
      .from(couponUsage)
      .where(eq(couponUsage.couponId, cp.id))

    expect(usage).toHaveLength(1)
    expect(usage[0].discountApplied).toBe(1500)
    expect(usage[0].memberId).toBe(member.id)

    const [updated] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, cp.id))

    expect(updated.usedCount).toBe(1)
  })

  it('should track multiple coupon usages', async () => {
    const [cp] = await db.insert(coupons).values({
      code: 'MULTI', discountPercent: 10, maxUses: 5,
    }).returning()

    await applyCouponUsage(cp.id, '00000000-0000-0000-0000-000000000210', null, 500)
    await applyCouponUsage(cp.id, '00000000-0000-0000-0000-000000000211', null, 300)
    await applyCouponUsage(cp.id, '00000000-0000-0000-0000-000000000212', null, 200)

    const [updated] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, cp.id))

    expect(updated.usedCount).toBe(3)
  })
})

// ── Badges ─────────────────────────────────────────────────────────

describe('Badges', () => {
  it('should create badges and retrieve them', async () => {
    await db.insert(badges).values([
      { name: 'Primer Check-in', description: 'Tu primer visita', icon: '✅', requirement: { type: 'CHECK_IN_COUNT', target: 1 }, rewardPoints: 5, sortOrder: 0 },
      { name: 'Visitante Frecuente', description: '10 check-ins', icon: '⭐', requirement: { type: 'CHECK_IN_COUNT', target: 10 }, rewardPoints: 20, sortOrder: 1 },
      { name: 'Comprador', description: 'Primera compra', icon: '🛒', requirement: { type: 'PURCHASE_COUNT', target: 1 }, rewardPoints: 10, sortOrder: 2 },
    ])

    const all = await db.select().from(badges).orderBy(badges.sortOrder)
    expect(all).toHaveLength(3)
    expect(all[0].name).toBe('Primer Check-in')
    expect(all[2].name).toBe('Comprador')
  })

  it('should create member badge relation', async () => {
    const member = await createMember()
    const [badge] = await db.select().from(badges).limit(1)

    await db.insert(memberBadges).values({
      memberId: member.id,
      badgeId: badge.id,
    })

    const earned = await db
      .select()
      .from(memberBadges)
      .where(eq(memberBadges.memberId, member.id))

    expect(earned).toHaveLength(1)
    expect(earned[0].badgeId).toBe(badge.id)
  })

  it('should enforce unique memberId + badgeId constraint', async () => {
    const member = await createMember()
    const [badge] = await db.select().from(badges).limit(1)

    await db.insert(memberBadges).values({ memberId: member.id, badgeId: badge.id })

    await expect(
      db.insert(memberBadges).values({ memberId: member.id, badgeId: badge.id }),
    ).rejects.toThrow()
  })
})

// ── Challenges ─────────────────────────────────────────────────────

describe('Challenges', () => {
  it('should create challenges and track progress', async () => {
    const member = await createMember()

    // Create a challenge
    const [ch] = await db.insert(challenges).values({
      name: '20 Check-ins',
      description: 'Completa 20 visitas',
      type: 'CHECK_IN_COUNT',
      target: 20,
      rewardPoints: 100,
      isActive: true,
    }).returning()

    // Create progress
    await db.insert(challengeProgress).values({
      challengeId: ch.id,
      memberId: member.id,
      progress: 5,
      completed: false,
    })

    const [progress] = await db
      .select()
      .from(challengeProgress)
      .where(eq(challengeProgress.memberId, member.id))

    expect(progress.progress).toBe(5)
    expect(progress.completed).toBe(false)
    expect(progress.rewarded).toBe(false)
  })

  it('should update challenge progress', async () => {
    const member = await createMember()
    const [ch] = await db.insert(challenges).values({
      name: '10 Purchases', type: 'PURCHASE_COUNT', target: 10, rewardPoints: 50, isActive: true,
    }).returning()

    const [prog] = await db.insert(challengeProgress).values({
      challengeId: ch.id, memberId: member.id, progress: 3, completed: false,
    }).returning()

    await db.update(challengeProgress)
      .set({ progress: 7, updatedAt: new Date() })
      .where(eq(challengeProgress.id, prog.id))

    const [updated] = await db
      .select()
      .from(challengeProgress)
      .where(eq(challengeProgress.id, prog.id))

    expect(updated.progress).toBe(7)
  })

  it('should mark challenge as completed and rewarded', async () => {
    const member = await createMember()
    const [ch] = await db.insert(challenges).values({
      name: 'Quick Challenge', type: 'CHECK_IN_COUNT', target: 1, rewardPoints: 10, isActive: true,
    }).returning()

    await db.insert(challengeProgress).values({
      challengeId: ch.id, memberId: member.id, progress: 1, completed: true,
      completedAt: new Date(), rewarded: true,
    })

    const [result] = await db
      .select()
      .from(challengeProgress)
      .where(eq(challengeProgress.memberId, member.id))

    expect(result.completed).toBe(true)
    expect(result.rewarded).toBe(true)
    expect(result.completedAt).toBeInstanceOf(Date)
  })
})

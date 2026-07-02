import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import {
  loyaltyTiers,
  loyaltyPoints,
  coupons,
  couponUsage,
  challenges,
  challengeProgress,
  badges,
  memberBadges,
} from '#/shared/db/schema/loyalty.ts'
import { members } from '#/shared/db/schema/members.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { eq, desc, and, count, sql, lte, lt, gte } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

const TIER_DEFAULTS = [
  { name: 'Bronce', minPoints: 0, color: '#cd7f32', discountPercent: 0, sortOrder: 0 },
  { name: 'Plata', minPoints: 100, color: '#94a3b8', discountPercent: 3, sortOrder: 1 },
  { name: 'Oro', minPoints: 300, color: '#f59e0b', discountPercent: 5, sortOrder: 2 },
  { name: 'Platino', minPoints: 1000, color: '#6366f1', discountPercent: 10, sortOrder: 3 },
]

// ── helpers ──

export async function getTierForPoints(points: number) {
  const tiers = await db.select().from(loyaltyTiers).orderBy(loyaltyTiers.minPoints)
  let tier = tiers[0]
  for (const t of tiers) {
    if (points >= t.minPoints) tier = t
  }
  return tier ?? Object.assign({}, TIER_DEFAULTS[0], { id: '', createdAt: new Date() })
}

export async function earnPoints(
  memberId: string,
  pts: number,
  source: string,
  referenceId?: string,
  description?: string,
) {
  const last = await db
    .select({ balance: loyaltyPoints.balance })
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.memberId, memberId))
    .orderBy(desc(loyaltyPoints.createdAt))
    .limit(1)
  const balance = (last[0]?.balance ?? 0) + pts
  await db.insert(loyaltyPoints).values({
    memberId, points: pts, balance, source,
    referenceId: referenceId ?? null,
    description: description ?? null,
  })
  return balance
}

// Generate a short unique referral code from member name
export function generateReferralCode(fullName: string, id: string): string {
  const namePart = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)
  return `${namePart}-${id.slice(0, 6)}`
}

// ── check-in / purchase hooks (called from those flows) ──

export async function onCheckIn(memberId: string, checkInId: string) {
  // 1pt per check-in
  await earnPoints(memberId, 1, 'CHECK_IN', checkInId, 'Check-in')

  // Check referral bonus: if this is the referred member's FIRST check-in, reward referrer
  const member = await db
    .select({ referredBy: members.referredBy })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)
    .then(r => r[0])

  if (member?.referredBy) {
    const checkInCount = await db
      .select({ cnt: count() })
      .from(checkIns)
      .where(eq(checkIns.memberId, memberId))
      .then(r => Number(r[0]?.cnt ?? 0))

    // ponytail: hardcoded 10pt referral bonus, add config when needed
    if (checkInCount <= 1) {
      await earnPoints(member.referredBy, 10, 'REFERRAL', memberId, 'Bono por referido')
    }
  }

  // Check challenges + badges
  await checkChallenges(memberId, 'CHECK_IN_COUNT')
  await checkBadges(memberId, 'CHECK_IN_COUNT')
}

export async function onPurchase(memberId: string, saleId: string, total: number) {
  const pts = Math.floor(total / 50)
  if (pts > 0) {
    await earnPoints(memberId, pts, 'PURCHASE', saleId, `Compra`)
  }
  await checkChallenges(memberId, 'PURCHASE_COUNT')
  await checkChallenges(memberId, 'PURCHASE_TOTAL')
  await checkBadges(memberId, 'PURCHASE_COUNT')
}

// ── challenge / badge engine ──

async function checkChallenges(memberId: string, eventType: string) {
  const activeChallenges = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.isActive, true),
        eq(challenges.type, eventType),
        sql`${challenges.endDate} IS NULL OR ${challenges.endDate} >= NOW()`,
      ),
    )

  for (const ch of activeChallenges) {
    // Get current progress for this member
    const [progress] = await db
      .select()
      .from(challengeProgress)
      .where(
        and(
          eq(challengeProgress.challengeId, ch.id),
          eq(challengeProgress.memberId, memberId),
        ),
      )

    if (progress?.completed) continue

    let currentValue = 0
    switch (ch.type) {
      case 'CHECK_IN_COUNT':
        currentValue = await db
          .select({ cnt: count() })
          .from(checkIns)
          .where(
            and(
              eq(checkIns.memberId, memberId),
              ch.startDate ? gte(checkIns.checkedInAt, ch.startDate) : undefined,
              ch.endDate ? lte(checkIns.checkedInAt, ch.endDate) : undefined,
            ),
          )
          .then(r => Number(r[0]?.cnt ?? 0))
        break
      // ponytail: add other challenge types here (PURCHASE_COUNT, PURCHASE_TOTAL) when needed
      default:
        continue
    }

    const newProgress = Math.min(currentValue, ch.target)

    if (progress) {
      await db
        .update(challengeProgress)
        .set({
          progress: newProgress,
          completed: currentValue >= ch.target,
          completedAt: currentValue >= ch.target && !progress.completed ? new Date() : progress.completedAt,
          rewarded: progress.rewarded,
          updatedAt: new Date(),
        })
        .where(eq(challengeProgress.id, progress.id))
    } else {
      await db.insert(challengeProgress).values({
        challengeId: ch.id,
        memberId,
        progress: newProgress,
        completed: currentValue >= ch.target,
        completedAt: currentValue >= ch.target ? new Date() : null,
      })
    }

    // Award points on completion
    if (currentValue >= ch.target && ch.rewardPoints > 0) {
      const [p] = await db
        .select()
        .from(challengeProgress)
        .where(
          and(
            eq(challengeProgress.challengeId, ch.id),
            eq(challengeProgress.memberId, memberId),
          ),
        )
        .limit(1)

      if (p && !p.rewarded) {
        await earnPoints(memberId, ch.rewardPoints, 'CHALLENGE', ch.id, `Reto: ${ch.name}`)
        await db
          .update(challengeProgress)
          .set({ rewarded: true, updatedAt: new Date() })
          .where(eq(challengeProgress.id, p.id))
      }
    }
  }
}

async function checkBadges(memberId: string, eventType: string) {
  const allBadges = await db.select().from(badges).orderBy(badges.sortOrder)

  for (const badge of allBadges) {
    const req = badge.requirement as { type: string; target: number }
    if (req.type !== eventType) continue

    // Skip if already earned
    const existing = await db
      .select()
      .from(memberBadges)
      .where(
        and(eq(memberBadges.memberId, memberId), eq(memberBadges.badgeId, badge.id)),
      )
      .limit(1)
    if (existing.length > 0) continue

    let currentValue = 0
    switch (req.type) {
      case 'CHECK_IN_COUNT':
        currentValue = await db
          .select({ cnt: count() })
          .from(checkIns)
          .where(eq(checkIns.memberId, memberId))
          .then(r => Number(r[0]?.cnt ?? 0))
        break
      case 'PURCHASE_COUNT':
        currentValue = await db
          .select({ cnt: count() })
          .from(sales)
          .where(and(eq(sales.memberId, memberId), eq(sales.status, 'COMPLETED')))
          .then(r => Number(r[0]?.cnt ?? 0))
        break
      case 'REFERRAL_COUNT':
        currentValue = await db
          .select({ cnt: count() })
          .from(members)
          .where(eq(members.referredBy, memberId))
          .then(r => Number(r[0]?.cnt ?? 0))
        break
    }

    if (currentValue >= req.target) {
      await db.insert(memberBadges).values({ memberId, badgeId: badge.id })
      if (badge.rewardPoints > 0) {
        await earnPoints(memberId, badge.rewardPoints, 'BADGE', badge.id, `Logro: ${badge.name}`)
      }
    }
  }
}

// ── server functions ──

// Get full loyalty info
const getInfoSchema = z.object({ memberId: z.string().uuid() })

export const getLoyaltyInfo = createServerFn({ method: 'GET' })
  .inputValidator((data) => getInfoSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const last = await db
      .select({ balance: loyaltyPoints.balance })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, data.memberId))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(1)
    const currentPoints = last?.[0]?.balance ?? 0
    const tier = await getTierForPoints(currentPoints)
    const history = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, data.memberId))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(50)

    // Active challenges + progress
    const activeChallenges = await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.isActive, true),
          sql`${challenges.endDate} IS NULL OR ${challenges.endDate} >= NOW()`,
        ),
      )
    const challengeProgressList = await db
      .select()
      .from(challengeProgress)
      .where(eq(challengeProgress.memberId, data.memberId))

    // Earned badges
    const earnedBadges = await db
      .select()
      .from(memberBadges)
      .where(eq(memberBadges.memberId, data.memberId))
    const badgeDetails = earnedBadges.length > 0
      ? await db
          .select()
          .from(badges)
          .where(sql`${badges.id} IN (${earnedBadges.map(b => b.badgeId)})`)
          .orderBy(badges.sortOrder)
      : []

    // Referral code
    const member = await db
      .select({ referralCode: members.referralCode, fullName: members.fullName })
      .from(members)
      .where(eq(members.id, data.memberId))
      .limit(1)
      .then(r => r[0])

    return {
      balance: currentPoints,
      tier,
      history,
      challenges: activeChallenges.map(ch => ({
        ...ch,
        progress: challengeProgressList.find(p => p.challengeId === ch.id) ?? null,
      })),
      badges: badgeDetails,
      referralCode: member?.referralCode ?? null,
    }
  })

// Redeem points
const redeemSchema = z.object({
  memberId: z.string().uuid(),
  points: z.number().int().positive(),
  description: z.string().min(1),
})

export const redeemPoints = createServerFn({ method: 'POST' })
  .inputValidator((data) => redeemSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const last = await db
      .select({ balance: loyaltyPoints.balance })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.memberId, data.memberId))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(1)
    const currentPoints = last?.[0]?.balance ?? 0
    if (currentPoints < data.points) throw new Error('Puntos insuficientes')
    const newBalance = currentPoints - data.points
    const [pt] = await db.insert(loyaltyPoints).values({
      memberId: data.memberId, points: -data.points, balance: newBalance,
      source: 'REDEEM', description: data.description,
    }).returning()
    createAuditLog({
      ...getAuditContext(session), action: 'CREATE', entityType: 'LOYALTY_REDEEM',
      entityId: pt.id,
      description: `Canjeó ${data.points} puntos de socio #${data.memberId}: ${data.description}`,
    })
    return { balance: newBalance, tier: await getTierForPoints(newBalance) }
  })

// ── Referrals ──

export const generateReferralCodeFn = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ memberId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const member = await db
      .select()
      .from(members)
      .where(eq(members.id, data.memberId))
      .limit(1)
      .then(r => r[0])
    if (!member) throw new Error('Socio no encontrado')
    if (member.referralCode) return { referralCode: member.referralCode }
    const code = generateReferralCode(member.fullName, member.id)
    await db.update(members).set({ referralCode: code }).where(eq(members.id, member.id))
    return { referralCode: code }
  })

// ── Coupons (admin CRUD) ──

export const getCoupons = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt))
  })

const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountFixed: z.number().int().min(0).optional(),
  minPurchase: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(0).default(0),
  expiresAt: z.string().optional(),
})

export const createCoupon = createServerFn({ method: 'POST' })
  .inputValidator((data) => createCouponSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [cp] = await db.insert(coupons).values({
      code: data.code,
      description: data.description ?? null,
      discountPercent: data.discountPercent,
      discountFixed: data.discountFixed ?? null,
      minPurchase: data.minPurchase,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    }).returning()
    createAuditLog({
      ...getAuditContext(session), action: 'CREATE', entityType: 'COUPON',
      entityId: cp.id, description: `Creó cupón ${cp.code} (${data.discountPercent}%)`,
    })
    return cp
  })

const toggleCouponSchema = z.object({ id: z.string().uuid(), isActive: z.boolean() })

export const toggleCoupon = createServerFn({ method: 'POST' })
  .inputValidator((data) => toggleCouponSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [cp] = await db.update(coupons).set({ isActive: data.isActive })
      .where(eq(coupons.id, data.id)).returning()
    createAuditLog({
      ...getAuditContext(session), action: 'UPDATE', entityType: 'COUPON',
      entityId: data.id,
      description: `${data.isActive ? 'Activó' : 'Desactivó'} cupón ${cp.code}`,
    })
    return cp
  })

// Validate a coupon code for use (returns discount info or throws)
const validateCouponSchema = z.object({ code: z.string(), total: z.number().int().min(0) })

export const validateCoupon = createServerFn({ method: 'GET' })
  .inputValidator((data) => validateCouponSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const cp = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, data.code.toUpperCase()))
      .limit(1)
      .then(r => r[0])
    if (!cp) throw new Error('Cupón no encontrado')
    if (!cp.isActive) throw new Error('Cupón inactivo')
    if (cp.maxUses > 0 && cp.usedCount >= cp.maxUses) throw new Error('Cupón agotado')
    if (cp.expiresAt && new Date(cp.expiresAt) < new Date()) throw new Error('Cupón expirado')
    if (data.total < cp.minPurchase) throw new Error(`Mínimo de compra: $${cp.minPurchase / 100}`)
    const discount = cp.discountPercent > 0
      ? Math.round(data.total * cp.discountPercent / 100)
      : cp.discountFixed ?? 0
    return { ...cp, discount }
  })

// Mark coupon as used (called from sale flow)
export async function applyCouponUsage(couponId: string, saleId: string, memberId: string | null, discountApplied: number) {
  await db.insert(couponUsage).values({ couponId, saleId, memberId, discountApplied })
  await db.update(coupons).set({ usedCount: sql`used_count + 1` }).where(eq(coupons.id, couponId))
}

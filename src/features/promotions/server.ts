import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { promotions } from '#/shared/db/schema/promotions.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq, desc, and, sql, count, gte, lte } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'

// ── helpers ──

type Conditions = {
  minPurchases?: number
  maxPurchases?: number
  minCheckIns?: number
  memberTierMin?: number
  memberMonthsMin?: number
}

async function evaluateConditions(
  memberId: string,
  conditions: Conditions,
): Promise<boolean> {
  if (!conditions || Object.keys(conditions).length === 0) return true

  if (conditions.minPurchases !== undefined || conditions.maxPurchases !== undefined) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(sales)
      .where(and(eq(sales.memberId, memberId), eq(sales.status, 'COMPLETED')))
    const purchaseCount = Number(cnt)
    if (conditions.minPurchases !== undefined && purchaseCount < conditions.minPurchases) return false
    if (conditions.maxPurchases !== undefined && purchaseCount > conditions.maxPurchases) return false
  }

  if (conditions.minCheckIns !== undefined) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(checkIns)
      .where(eq(checkIns.memberId, memberId))
    if (Number(cnt) < conditions.minCheckIns) return false
  }

  return true
}

// ── server functions ──

export const getPromotions = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.select().from(promotions).orderBy(desc(promotions.createdAt))
  })

const createPromoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['DISCOUNT', 'BONUS_POINTS']).default('DISCOUNT'),
  discountPercent: z.number().int().min(0).max(100).default(0),
  rewardPoints: z.number().int().min(0).default(0),
  conditions: z.record(z.any()).default({}),
  autoApply: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const createPromotion = createServerFn({ method: 'POST' })
  .validator((data) => createPromoSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [p] = await db.insert(promotions).values({
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      discountPercent: data.discountPercent,
      rewardPoints: data.rewardPoints,
      conditions: data.conditions,
      autoApply: data.autoApply,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    }).returning()
    createAuditLog({
      ...getAuditContext(session), action: 'CREATE', entityType: 'PROMOTION',
      entityId: p.id, description: `Creó promoción ${p.name}`,
    })
    return p
  })

const togglePromoSchema = z.object({ id: z.string().uuid(), isActive: z.boolean() })

export const togglePromotion = createServerFn({ method: 'POST' })
  .validator((data) => togglePromoSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [p] = await db.update(promotions).set({ isActive: data.isActive })
      .where(eq(promotions.id, data.id)).returning()
    createAuditLog({
      ...getAuditContext(session), action: 'UPDATE', entityType: 'PROMOTION',
      entityId: data.id,
      description: `${data.isActive ? 'Activó' : 'Desactivó'} promoción ${p.name}`,
    })
    return p
  })

// Get applicable promotions for a member (called before sale)
export const getApplicablePromotions = createServerFn({ method: 'GET' })
  .validator((data) => z.object({ memberId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const now = new Date()
    const activePromos = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          eq(promotions.autoApply, true),
          sql`${promotions.startDate} IS NULL OR ${promotions.startDate} <= ${now}`,
          sql`${promotions.endDate} IS NULL OR ${promotions.endDate} >= ${now}`,
        ),
      )
    const applicable: typeof activePromos = []
    for (const promo of activePromos) {
      const conditions = (promo.conditions ?? {}) as Conditions
      if (await evaluateConditions(data.memberId, conditions)) {
        applicable.push(promo)
      }
    }
    return applicable
  })

// ── hooks ──

export async function getApplicableDiscount(memberId: string): Promise<number> {
  const now = new Date()
  const activePromos = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        eq(promotions.autoApply, true),
        sql`${promotions.startDate} IS NULL OR ${promotions.startDate} <= ${now}`,
        sql`${promotions.endDate} IS NULL OR ${promotions.endDate} >= ${now}`,
      ),
    )
  let maxDiscount = 0
  for (const promo of activePromos) {
    const conditions = (promo.conditions ?? {}) as Conditions
    if (promo.type === 'DISCOUNT' && (await evaluateConditions(memberId, conditions))) {
      maxDiscount = Math.max(maxDiscount, promo.discountPercent ?? 0)
    }
  }
  return maxDiscount
}

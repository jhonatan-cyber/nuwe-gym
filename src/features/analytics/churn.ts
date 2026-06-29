import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm'
import type { ChurnRisk } from './types.ts'

export async function computeChurnRisk(
  memberId: string,
): Promise<ChurnRisk> {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
  })
  if (!member) throw new Error('Miembro no encontrado')

  const factors: string[] = []
  let score = 0

  // 1. Days since last check-in
  const [lastCI] = await db
    .select({ checkedInAt: checkIns.checkedInAt })
    .from(checkIns)
    .where(eq(checkIns.memberId, memberId))
    .orderBy(desc(checkIns.checkedInAt))
    .limit(1)

  const daysSinceLastCheckIn = lastCI
    ? Math.floor(
        (Date.now() - new Date(lastCI.checkedInAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null

  if (daysSinceLastCheckIn === null) {
    score += 40
    factors.push('Nunca registro un check-in')
  } else if (daysSinceLastCheckIn > 60) {
    score += 40
    factors.push(`No viene hace ${daysSinceLastCheckIn} dias`)
  } else if (daysSinceLastCheckIn > 30) {
    score += 25
    factors.push(`No viene hace ${daysSinceLastCheckIn} dias`)
  } else if (daysSinceLastCheckIn > 14) {
    score += 15
    factors.push(`No viene hace ${daysSinceLastCheckIn} dias`)
  }

  // 2. Attendance frequency decline (last 30d vs previous 30d)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000)

  const [recentCount] = await db
    .select({ c: count() })
    .from(checkIns)
    .where(
      and(
        eq(checkIns.memberId, memberId),
        gte(checkIns.checkedInAt, thirtyDaysAgo),
        lte(checkIns.checkedInAt, now),
        eq(checkIns.resultStatus, 'ALLOWED'),
      ),
    )

  const [prevCount] = await db
    .select({ c: count() })
    .from(checkIns)
    .where(
      and(
        eq(checkIns.memberId, memberId),
        gte(checkIns.checkedInAt, sixtyDaysAgo),
        lte(checkIns.checkedInAt, thirtyDaysAgo),
        eq(checkIns.resultStatus, 'ALLOWED'),
      ),
    )

  if (prevCount.c > 5 && recentCount.c < prevCount.c * 0.5) {
    score += 20
    const decline = Math.round(
      ((prevCount.c - recentCount.c) / prevCount.c) * 100,
    )
    factors.push(`Reduccion del ${decline}% en frecuencia de visitas`)
  }

  // 3. Expired or no subscription
  const activeSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.memberId, memberId),
      eq(subscriptions.status, 'ACTIVE'),
      lte(subscriptions.startDate, now),
      gte(subscriptions.endDate, now),
    ),
  })

  if (!activeSub) {
    // Check if subscription exists at all
    const anySub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.memberId, memberId),
    })
    if (!anySub) {
      score += 20
      factors.push('Nunca tuvo una suscripcion')
    } else {
      score += 15
      factors.push('Suscripcion vencida o cancelada')
    }
  }

  // 4. Member status
  if (member.status === 'SUSPENDED') {
    score += 25
    factors.push('Socio suspendido')
  } else if (member.status === 'INACTIVE') {
    score += 35
    factors.push('Socio inactivo')
  }

  const clamped = Math.min(score, 100)
  const level: ChurnRisk['level'] =
    clamped >= 70 ? 'CRITICAL' : clamped >= 45 ? 'HIGH' : clamped >= 20 ? 'MEDIUM' : 'LOW'

  return {
    memberId,
    memberName: member.fullName,
    score: clamped,
    level,
    factors,
    lastCheckIn: lastCI?.checkedInAt ?? null,
    daysSinceLastCheckIn,
  }
}

export async function computeAllChurnRisks(
  limit = 20,
): Promise<ChurnRisk[]> {
  // Get members with active subscriptions ordered by risk (by lack of check-ins)
  const atRiskMembers = await db
    .select({
      id: members.id,
      fullName: members.fullName,
      status: members.status,
      lastCheckIn: sql<string>`(
        SELECT checked_in_at FROM check_ins
        WHERE member_id = members.id
        ORDER BY checked_in_at DESC LIMIT 1
      )`,
    })
    .from(members)
    .where(
      and(
        sql`members.status = 'ACTIVE'`,
        sql`EXISTS (
          SELECT 1 FROM subscriptions
          WHERE member_id = members.id
          AND status = 'ACTIVE'
          AND start_date <= NOW()
          AND end_date >= NOW()
        )`,
      ),
    )
    .limit(limit)

  const results: ChurnRisk[] = []
  for (const m of atRiskMembers) {
    results.push(await computeChurnRisk(m.id))
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)
  return results
}

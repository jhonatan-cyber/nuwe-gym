import { db } from '#/shared/db/index.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { products } from '#/shared/db/schema/products.ts'
import { eq, gte, lte, and, count, sum, sql } from 'drizzle-orm'
import type { Insight } from './types.ts'

export async function detectInsights(): Promise<Insight[]> {
  const insights: Insight[] = []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000)
  const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 86400000)

  // ── 1. Check-in trend: this week vs last week ──
  const [thisWeek] = await db
    .select({ c: count() })
    .from(checkIns)
    .where(
      and(
        gte(checkIns.checkedInAt, sevenDaysAgo),
        lte(checkIns.checkedInAt, now),
      ),
    )

  const [lastWeek] = await db
    .select({ c: count() })
    .from(checkIns)
    .where(
      and(
        gte(checkIns.checkedInAt, fourteenDaysAgo),
        lte(checkIns.checkedInAt, sevenDaysAgo),
      ),
    )

  if (lastWeek.c > 0) {
    const change = Math.round(
      ((thisWeek.c - lastWeek.c) / lastWeek.c) * 100,
    )
    if (Math.abs(change) >= 10) {
      insights.push({
        type: change > 0 ? 'trend_up' : 'trend_down',
        module: 'checkins',
        title:
          change > 0
            ? 'Aumento de asistencia'
            : 'Caida en la asistencia',
        description:
          change > 0
            ? `Esta semana hubo ${thisWeek.c} check-ins, un ${change}% mas que la semana anterior`
            : `Esta semana hubo ${thisWeek.c} check-ins, un ${Math.abs(change)}% menos que la semana anterior`,
        metric: `${thisWeek.c} check-ins`,
        change,
        actionable: change < 0,
      })
    }
  }

  // ── 2. Sales trend ──
  const [salesThisWeek] = await db
    .select({ total: sum(sales.total) })
    .from(sales)
    .where(
      and(
        gte(sales.createdAt, sevenDaysAgo),
        lte(sales.createdAt, now),
      ),
    )

  const [salesLastWeek] = await db
    .select({ total: sum(sales.total) })
    .from(sales)
    .where(
      and(
        gte(sales.createdAt, fourteenDaysAgo),
        lte(sales.createdAt, sevenDaysAgo),
      ),
    )

  const salesThis = Number(salesThisWeek.total ?? 0)
  const salesLast = Number(salesLastWeek.total ?? 0)
  if (salesLast > 0) {
    const change = Math.round(((salesThis - salesLast) / salesLast) * 100)
    if (Math.abs(change) >= 10) {
      insights.push({
        type: change > 0 ? 'trend_up' : 'trend_down',
        module: 'sales',
        title:
          change > 0 ? 'Ventas en alza' : 'Ventas en baja',
        description:
          change > 0
            ? `Las ventas de esta semana son un ${change}% mayores que la semana pasada`
            : `Las ventas de esta semana cayeron un ${Math.abs(change)}% respecto a la semana pasada`,
        metric: `Bs. ${salesThis.toFixed(2)}`,
        change,
        actionable: change < 0,
      })
    }
  }

  // ── 3. New members this month ──
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  )

  const [newMembersThis] = await db
    .select({ c: count() })
    .from(members)
    .where(
      and(
        gte(members.createdAt, monthStart),
        lte(members.createdAt, now),
      ),
    )

  const [newMembersLast] = await db
    .select({ c: count() })
    .from(members)
    .where(
      and(
        gte(members.createdAt, prevMonthStart),
        lte(members.createdAt, monthStart),
      ),
    )

  if (newMembersLast.c > 0) {
    const change = Math.round(
      ((newMembersThis.c - newMembersLast.c) / newMembersLast.c) * 100,
    )
    if (Math.abs(change) >= 15) {
      insights.push({
        type: change > 0 ? 'trend_up' : 'trend_down',
        module: 'members',
        title:
          change > 0
            ? 'Crecimiento en membresias'
            : 'Descenso en nuevas membresias',
        description:
          change > 0
            ? `Este mes se registraron ${newMembersThis.c} socios nuevos, un ${change}% mas que el mes pasado`
            : `Este mes se registraron ${newMembersThis.c} socios nuevos, un ${Math.abs(change)}% menos que el mes pasado`,
        metric: `${newMembersThis.c} nuevos`,
        change,
        actionable: change < 0,
      })
    }
  }

  // ── 4. Expiring subscriptions count ──
  const nextWeek = new Date(now.getTime() + 7 * 86400000)
  const [expiringCount] = await db
    .select({ c: count() })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, now),
        lte(subscriptions.endDate, nextWeek),
      ),
    )

  if (expiringCount.c >= 5) {
    insights.push({
      type: 'alert',
      module: 'members',
      title: 'Vencimientos proximos',
      description: `${expiringCount.c} suscripciones vencen en los proximos 7 dias`,
      metric: `${expiringCount.c} por vencer`,
      change: 0,
      actionable: true,
    })
  }

  // ── 5. Low stock alert ──
  const lowStock = await db
    .select({ c: count() })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`stock_current <= stock_minimum`,
      ),
    )

  if (lowStock[0].c > 0) {
    insights.push({
      type: 'alert',
      module: 'inventory',
      title: 'Stock bajo',
      description: `${lowStock[0].c} productos tienen stock por debajo del minimo`,
      metric: `${lowStock[0].c} productos`,
      change: 0,
      actionable: true,
    })
  }

  // ── 6. Best selling product ──
  const topResult = await db.execute(
    sql`
      SELECT p.name, COALESCE(SUM(si.quantity), 0)::int as total
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      WHERE si.created_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY p.name
      ORDER BY total DESC
      LIMIT 1
    `,
  )
  const topRow = (topResult as any).rows?.[0]
  if (topRow) {
    insights.push({
      type: 'opportunity',
      module: 'products',
      title: 'Producto estrella',
      description: `"${topRow.name}" es el producto mas vendido de la semana (${topRow.total} unidades)`,
      metric: `${topRow.total} unid.`,
      change: 0,
      actionable: false,
    })
  }

  return insights
}

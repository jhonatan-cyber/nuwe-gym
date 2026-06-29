import { db } from '#/shared/db/index.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sql, and, gte, lte } from 'drizzle-orm'
import type { AttendanceForecast, ReorderSuggestion } from './types.ts'

// ── Attendance prediction (moving average) ──

export async function predictAttendance(
  days = 7,
): Promise<AttendanceForecast[]> {
  const now = new Date()
  const forecasts: AttendanceForecast[] = []

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(now.getTime() + i * 86400000)
    const targetDayOfWeek = targetDate.getDay()

    // Look at the same day-of-week for the last 4 weeks
    const values: number[] = []
    for (let w = 1; w <= 4; w++) {
      const weekStart = new Date(
        targetDate.getTime() - w * 7 * 86400000,
      )
      const weekEnd = new Date(weekStart.getTime() + 86400000)

      const result = await db
        .select({
          c: sql<number>`COUNT(*)::int`,
        })
        .from(checkIns)
        .where(
          and(
            sql`EXTRACT(DOW FROM checked_in_at) = ${targetDayOfWeek}`,
            gte(checkIns.checkedInAt, weekStart),
            lte(checkIns.checkedInAt, weekEnd),
          ),
        )

      if (result[0]?.c) values.push(result[0].c)
    }

    if (values.length > 0) {
      const mean =
        values.reduce((a, b) => a + b, 0) / values.length
      const std = Math.sqrt(
        values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
      )

      forecasts.push({
        date: targetDate.toISOString().split('T')[0],
        predicted: Math.round(mean),
        lowerBound: Math.max(0, Math.round(mean - 1.5 * std)),
        upperBound: Math.round(mean + 1.5 * std),
      })
    } else {
      forecasts.push({
        date: targetDate.toISOString().split('T')[0],
        predicted: 0,
        lowerBound: 0,
        upperBound: 0,
      })
    }
  }

  return forecasts
}

// ── Reorder suggestions ──

export async function getReorderSuggestions(): Promise<ReorderSuggestion[]> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

  const result = await db.execute(
    sql`
      WITH product_sales AS (
        SELECT
          si.product_id,
          COALESCE(SUM(si.quantity), 0) as total_sold,
          COUNT(DISTINCT DATE(s.created_at)) as days_with_sales
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= ${thirtyDaysAgo.toISOString()}
        GROUP BY si.product_id
      )
      SELECT
        p.id,
        p.name,
        p.sku,
        p.stock_current,
        p.stock_minimum,
        COALESCE(ps.total_sold, 0) as total_sold,
        COALESCE(ps.days_with_sales, 0) as days_with_sales
      FROM products p
      LEFT JOIN product_sales ps ON ps.product_id = p.id
      WHERE p.is_active = true
      ORDER BY
        CASE
          WHEN p.stock_current <= p.stock_minimum THEN 0
          WHEN ps.total_sold > 0 THEN 1
          ELSE 2
        END,
        p.stock_current ASC
    `,
  )

  const rows: any[] = (result as any).rows ?? []
  const suggestions: ReorderSuggestion[] = []
  const leadTimeDays = 7

  for (const row of rows) {
    const avgDailySales =
      row.days_with_sales > 0
        ? Number(row.total_sold) / Math.max(row.days_with_sales, 1)
        : 0

    const reorderPoint = Math.ceil(
      avgDailySales * leadTimeDays * 1.5,
    )
    const currentStock = Number(row.stock_current)

    if (currentStock <= reorderPoint || currentStock <= Number(row.stock_minimum)) {
      const safetyStock = Math.ceil(avgDailySales * leadTimeDays * 0.5)
      const recommendedOrder = Math.max(
        reorderPoint + safetyStock - currentStock,
        Math.ceil(avgDailySales * leadTimeDays),
      )

      const stockRatio =
        currentStock / Math.max(reorderPoint, 1)
      const urgency: ReorderSuggestion['urgency'] =
        stockRatio <= 0.3
          ? 'HIGH'
          : stockRatio <= 0.7
            ? 'MEDIUM'
            : 'LOW'

      suggestions.push({
        productId: row.id,
        productName: row.name,
        sku: row.sku ?? '',
        currentStock,
        reorderPoint,
        recommendedOrder,
        averageDailySales: Math.round(avgDailySales * 10) / 10,
        leadTimeDays,
        urgency,
      })
    }
  }

  return suggestions
}

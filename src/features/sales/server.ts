import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { products } from '#/shared/db/schema/products.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import {
  cashRegisterSessions,
  cashMovements,
} from '#/shared/db/schema/cash-register.ts'
import {
  eq,
  desc,
  inArray,
  gte,
  lte,
  count,
  sum,
  sql,
  and,
} from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

// ── Date helpers ──────────────────────────────────────────────────

interface DateRanges {
  todayStart: Date
  todayEnd: Date
  thirtyDaysAgo: Date
  thisWeekStart: Date
  lastWeekStart: Date
  lastWeekEnd: Date
  daysSinceMonday: number
}

function getDateRanges(): DateRanges {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const thirtyDaysAgo = new Date(todayStart)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const dayOfWeek = now.getDay()
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const thisWeekStart = new Date(todayStart)
  thisWeekStart.setDate(thisWeekStart.getDate() - daysSinceMonday)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  lastWeekEnd.setHours(23, 59, 59, 999)

  return { todayStart, todayEnd, thirtyDaysAgo, thisWeekStart, lastWeekStart, lastWeekEnd, daysSinceMonday }
}

function completedSalesFilter(start: Date, end: Date) {
  return and(gte(sales.soldAt, start), lte(sales.soldAt, end), eq(sales.status, 'COMPLETED'))
}

// ── Aggregation helpers ───────────────────────────────────────────

interface CountRevenue { total: number; revenue: number }

async function getTodayStats(start: Date, end: Date): Promise<CountRevenue & { avgTicket: number }> {
  const [res] = await db
    .select({ total: count(), revenue: sum(sales.total) })
    .from(sales)
    .where(completedSalesFilter(start, end))

  const total = Number(res?.total ?? 0)
  const revenue = Number(res?.revenue ?? 0)
  const avgTicket = total > 0 ? revenue / total : 0

  return { total, revenue, avgTicket }
}

interface DailyRow { date: string; total: number; revenue: number }

async function getDailySales(start: Date, end: Date): Promise<DailyRow[]> {
  const res = await db
    .select({
      date: sql<string>`DATE(${sales.soldAt})`,
      total: count(),
      revenue: sum(sales.total),
    })
    .from(sales)
    .where(completedSalesFilter(start, end))
    .groupBy(sql`DATE(${sales.soldAt})`)
    .orderBy(sql`DATE(${sales.soldAt})`)

  return res.map((r) => ({
    date: r.date,
    total: Number(r.total),
    revenue: Number(r.revenue ?? 0),
  }))
}

interface PaymentMethodRow { method: string; total: number; revenue: number }

async function getPaymentMethodBreakdown(start: Date, end: Date): Promise<PaymentMethodRow[]> {
  const res = await db
    .select({ method: sales.paymentMethod, total: count(), revenue: sum(sales.total) })
    .from(sales)
    .where(completedSalesFilter(start, end))
    .groupBy(sales.paymentMethod)

  return res.map((r) => ({
    method: r.method ?? 'OTHER',
    total: Number(r.total),
    revenue: Number(r.revenue ?? 0),
  }))
}

interface ProductRow { id: string; name: string; quantity: number; revenue: number }

async function getTopProducts(start: Date, end: Date): Promise<ProductRow[]> {
  const res = await db
    .select({
      productId: saleItems.productId,
      productName: products.name,
      quantity: sum(saleItems.quantity),
      revenue: sum(saleItems.subtotal),
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(completedSalesFilter(start, end))
    .groupBy(saleItems.productId, products.name)
    .orderBy(desc(sum(saleItems.quantity)))
    .limit(5)

  return res.map((r) => ({
    id: r.productId,
    name: r.productName,
    quantity: Number(r.quantity ?? 0),
    revenue: Number(r.revenue ?? 0),
  }))
}

interface HourRow { hour: string; total: number; revenue: number }

async function getHourlySales(start: Date, end: Date): Promise<HourRow[]> {
  const res = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${sales.soldAt})`,
      total: count(),
      revenue: sum(sales.total),
    })
    .from(sales)
    .where(completedSalesFilter(start, end))
    .groupBy(sql`EXTRACT(HOUR FROM ${sales.soldAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${sales.soldAt})`)

  const hourMap = new Map<number, { total: number; revenue: number }>()
  for (const r of res) {
    hourMap.set(Number(r.hour), { total: Number(r.total), revenue: Number(r.revenue ?? 0) })
  }

  const byHour: HourRow[] = []
  for (let h = 0; h < 24; h++) {
    const data = hourMap.get(h)
    byHour.push({
      hour: String(h).padStart(2, '0') + ':00',
      total: data?.total ?? 0,
      revenue: data?.revenue ?? 0,
    })
  }
  return byHour
}

interface WeeklyDayRow {
  dayName: string
  thisWeekTotal: number
  thisWeekRevenue: number
  lastWeekTotal: number
  lastWeekRevenue: number
  changePercent: number | null
}

interface WeeklyComparisonResult {
  days: WeeklyDayRow[]
  totals: {
    thisWeek: { total: number; revenue: number }
    lastWeek: { total: number; revenue: number }
    changePercent: number | null
  }
}

async function getWeeklyComparison(ranges: DateRanges): Promise<WeeklyComparisonResult> {
  const { thisWeekStart, lastWeekStart, lastWeekEnd, todayEnd, daysSinceMonday } = ranges

  const queryWeek = async (start: Date, end: Date) => {
    const res = await db
      .select({
        date: sql<string>`DATE(${sales.soldAt})`,
        total: count(),
        revenue: sum(sales.total),
      })
      .from(sales)
      .where(completedSalesFilter(start, end))
      .groupBy(sql`DATE(${sales.soldAt})`)
      .orderBy(sql`DATE(${sales.soldAt})`)
    return res
  }

  const [thisWeekRes, lastWeekRes] = await Promise.all([
    queryWeek(thisWeekStart, todayEnd),
    queryWeek(lastWeekStart, lastWeekEnd),
  ])

  const toMap = (rows: typeof thisWeekRes) => {
    const m = new Map<string, { total: number; revenue: number }>()
    for (const r of rows) {
      m.set(r.date, { total: Number(r.total), revenue: Number(r.revenue ?? 0) })
    }
    return m
  }

  const thisWeekMap = toMap(thisWeekRes)
  const lastWeekMap = toMap(lastWeekRes)

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const days: WeeklyDayRow[] = []
  let tWTotal = 0, tWRev = 0, lWTotal = 0, lWRev = 0

  for (let d = 0; d <= daysSinceMonday; d++) {
    const cur = new Date(thisWeekStart)
    cur.setDate(cur.getDate() + d)
    const curStr = cur.toISOString().split('T')[0]

    const prev = new Date(lastWeekStart)
    prev.setDate(prev.getDate() + d)
    const prevStr = prev.toISOString().split('T')[0]

    const tw = thisWeekMap.get(curStr) ?? { total: 0, revenue: 0 }
    const lw = lastWeekMap.get(prevStr) ?? { total: 0, revenue: 0 }

    tWTotal += tw.total; tWRev += tw.revenue
    lWTotal += lw.total; lWRev += lw.revenue

    days.push({
      dayName: dayNames[cur.getDay()],
      thisWeekTotal: tw.total,
      thisWeekRevenue: tw.revenue,
      lastWeekTotal: lw.total,
      lastWeekRevenue: lw.revenue,
      changePercent: calcPercentChange(lw.revenue, tw.revenue),
    })
  }

  return {
    days,
    totals: {
      thisWeek: { total: tWTotal, revenue: tWRev },
      lastWeek: { total: lWTotal, revenue: lWRev },
      changePercent: calcPercentChange(lWRev, tWRev),
    },
  }
}

export function calcPercentChange(previous: number, current: number): number | null {
  if (previous > 0) return ((current - previous) / previous) * 100
  if (current > 0) return 100
  return null
}

// ── Public server functions ───────────────────────────────────────

export const getDailySalesSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const ranges = getDateRanges()
    const { todayStart, todayEnd, thirtyDaysAgo } = ranges

    const [todayStats, dailySales, byPaymentMethod, topProducts, byHour, weekly] =
      await Promise.all([
        getTodayStats(todayStart, todayEnd),
        getDailySales(thirtyDaysAgo, todayEnd),
        getPaymentMethodBreakdown(todayStart, todayEnd),
        getTopProducts(todayStart, todayEnd),
        getHourlySales(todayStart, todayEnd),
        getWeeklyComparison(ranges),
      ])

    return {
      todayStats,
      dailySales,
      byPaymentMethod,
      topProducts,
      byHour,
      weeklyComparison: weekly.days,
      weeklyTotals: weekly.totals,
    }
  },
)

export const getRecentSales = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.sales.findMany({
      orderBy: [desc(sales.soldAt)],
      limit: 100,
      with: {
        user: true,
        member: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    })
  },
)

export const getSaleStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalResult] = await db
      .select({ total: count(), revenue: sum(sales.total) })
      .from(sales)

    const [todayResult] = await db
      .select({ total: count(), revenue: sum(sales.total) })
      .from(sales)
      .where(gte(sales.soldAt, today))

    return {
      totalSales: Number(totalResult?.total ?? 0),
      totalRevenue: Number(totalResult?.revenue ?? 0),
      todaySales: Number(todayResult?.total ?? 0),
      todayRevenue: Number(todayResult?.revenue ?? 0),
    }
  },
)

const createSaleSchema = z.object({
  memberId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'QR', 'TRANSFER', 'CARD']),
  discount: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number(),
      unitPrice: z.string(),
    }),
  ),
})

export const createSale = createServerFn({ method: 'POST' })
  .inputValidator((data) => createSaleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const sale = await db.transaction(async (tx) => {
      const openSession = await tx.query.cashRegisterSessions.findFirst({
        where: eq(cashRegisterSessions.status, 'OPEN'),
      })

      if (!openSession) {
        throw new Error('Debe abrir la caja antes de registrar una venta.')
      }

      const saleNumber = `V-${Date.now()}`

      let subtotalSum = 0
      for (const item of data.items) {
        subtotalSum += Number(item.unitPrice) * item.quantity
      }

      const subtotal = subtotalSum.toFixed(2)
      const discount = (Number(data.discount) || 0).toFixed(2)
      const total = (subtotalSum - (Number(data.discount) || 0)).toFixed(2)

      const [newSale] = await tx
        .insert(sales)
        .values({
          saleNumber,
          memberId: data.memberId || null,
          customerName: data.customerName || null,
          userId: session.user.id,
          subtotal,
          discount,
          total,
          paymentMethod: data.paymentMethod,
          status: 'COMPLETED',
          cashSessionId: openSession.id,
        })
        .returning()

      const productIds = Array.from(
        new Set(data.items.map((item) => item.productId)),
      )
      const productsFound =
        productIds.length > 0
          ? await tx
              .select()
              .from(products)
              .where(inArray(products.id, productIds))
          : []
      const productMap = new Map(productsFound.map((p) => [p.id, p]))

      for (const item of data.items) {
        const itemSubtotal = (Number(item.unitPrice) * item.quantity).toFixed(2)

        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
        })

        const product = productMap.get(item.productId)

        if (!product) {
          throw new Error(`Producto no encontrado (ID: ${item.productId})`)
        }

        const newStock = product.stockCurrent - item.quantity
        if (newStock < 0) {
          throw new Error(
            `Stock insuficiente para el producto "${product.name}". Stock actual: ${product.stockCurrent}`,
          )
        }

        await tx
          .update(products)
          .set({ stockCurrent: newStock, updatedAt: new Date() })
          .where(eq(products.id, item.productId))

        await tx.insert(inventoryMovements).values({
          productId: item.productId,
          movementType: 'SALE',
          quantity: -item.quantity,
          previousStock: product.stockCurrent,
          newStock,
          referenceType: 'SALE',
          referenceId: newSale.id,
          createdByUserId: session.user.id,
        })

        product.stockCurrent = newStock
      }

      await tx.insert(cashMovements).values({
        cashSessionId: openSession.id,
        movementType: 'INCOME',
        sourceType: 'SALE',
        sourceId: newSale.id,
        amount: total,
        paymentMethod: data.paymentMethod,
        description: `Venta registrada Nª ${saleNumber}`,
      })

      return newSale
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'SALE',
      entityId: sale.id,
      description: `Registró venta ${sale.saleNumber}`,
    })

    return sale
  })

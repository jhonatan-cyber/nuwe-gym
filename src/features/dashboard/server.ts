import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { count, eq, gte, lte, and, sum, sql, desc, inArray } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { cashRegisterSessions } from '#/shared/db/schema/cash-register.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import { z } from 'zod'
import { branchIdField } from '#/shared/lib/schemas.ts'
import { computeAllChurnRisks } from '#/features/analytics/churn.ts'

const getDashboardDataSchema = z.object({
  branchId: branchIdField,
})

export const getDashboardData = createServerFn({ method: 'GET' })
  .validator((data) => getDashboardDataSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })
    const userRole = session.user.role
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    )
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    )

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    )
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    )

    const memberFilter = data.branchId
      ? eq(members.branchId, data.branchId)
      : undefined
    const memberIds = data.branchId
      ? (await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.branchId, data.branchId))).map((m) => m.id)
      : undefined

    const totalMembersRes = await db
      .select({ count: count() })
      .from(members)
      .where(memberFilter)
    const totalMembers = totalMembersRes[0]?.count ?? 0
    const activeMembershipsRes = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        memberIds
          ? and(eq(subscriptions.status, 'ACTIVE'), inArray(subscriptions.memberId, memberIds))
          : eq(subscriptions.status, 'ACTIVE'),
      )
    const activeMemberships = activeMembershipsRes[0]?.count ?? 0

    const checkInsTodayRes = await db
      .select({ count: count() })
      .from(checkIns)
      .where(
        data.branchId
          ? and(
              gte(checkIns.checkedInAt, startOfToday),
              lte(checkIns.checkedInAt, endOfToday),
              eq(checkIns.resultStatus, 'ALLOWED'),
              eq(checkIns.branchId, data.branchId),
            )
          : and(
              gte(checkIns.checkedInAt, startOfToday),
              lte(checkIns.checkedInAt, endOfToday),
              eq(checkIns.resultStatus, 'ALLOWED'),
            ),
      )
    const checkInsToday = checkInsTodayRes[0]?.count ?? 0

    const salesTodayRes = await db
      .select({ sum: sum(sales.total) })
      .from(sales)
      .where(
        data.branchId
          ? and(
              gte(sales.soldAt, startOfToday),
              lte(sales.soldAt, endOfToday),
              eq(sales.status, 'COMPLETED'),
              eq(sales.branchId, data.branchId),
            )
          : and(
              gte(sales.soldAt, startOfToday),
              lte(sales.soldAt, endOfToday),
              eq(sales.status, 'COMPLETED'),
            ),
      )
    const salesToday = Number(salesTodayRes[0]?.sum ?? 0)

    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999)

    const expiringSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, startOfToday),
        lte(subscriptions.endDate, sevenDaysFromNow),
        memberIds ? inArray(subscriptions.memberId, memberIds) : undefined,
      ),
      with: {
        member: true,
        package: true,
      },
      orderBy: (s, { asc }) => [asc(s.endDate)],
    })

    let lowStockProducts: any[] = []
    if (data.branchId) {
      const lowStockRows = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          stockCurrent: productStock.stockCurrent,
          stockMinimum: productStock.stockMinimum,
        })
        .from(productStock)
        .innerJoin(products, eq(productStock.productId, products.id))
        .where(
          and(
            eq(products.isActive, true),
            eq(productStock.branchId, data.branchId),
            sql`${productStock.stockCurrent} <= ${productStock.stockMinimum}`,
          ),
        )
        .orderBy(productStock.stockCurrent)
      lowStockProducts = lowStockRows
    }

    let membershipIncome = 0
    let posIncome = 0
    let cashStatus = 'Cerrada'
    let cashStatusDescription = 'Sin caja abierta'
    let activeProductsCount = 0

    if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
      const membershipIncomeRes = await db
        .select({ sum: sum(membershipPayments.amount) })
        .from(membershipPayments)
        .where(
          memberIds
            ? and(
                gte(membershipPayments.paymentDate, startOfMonth),
                lte(membershipPayments.paymentDate, endOfMonth),
                inArray(membershipPayments.memberId, memberIds),
              )
            : and(
                gte(membershipPayments.paymentDate, startOfMonth),
                lte(membershipPayments.paymentDate, endOfMonth),
              ),
        )
      membershipIncome = Number(membershipIncomeRes[0]?.sum ?? 0)

      const posIncomeRes = await db
        .select({ sum: sum(sales.total) })
        .from(sales)
        .where(
          data.branchId
            ? and(
                gte(sales.soldAt, startOfMonth),
                lte(sales.soldAt, endOfMonth),
                eq(sales.status, 'COMPLETED'),
                eq(sales.branchId, data.branchId),
              )
            : and(
                gte(sales.soldAt, startOfMonth),
                lte(sales.soldAt, endOfMonth),
                eq(sales.status, 'COMPLETED'),
              ),
        )
      posIncome = Number(posIncomeRes[0]?.sum ?? 0)

      const openSession = await db.query.cashRegisterSessions.findFirst({
        where: data.branchId
          ? and(
              eq(cashRegisterSessions.status, 'OPEN'),
              eq(cashRegisterSessions.branchId, data.branchId),
            )
          : eq(cashRegisterSessions.status, 'OPEN'),
        with: {
          movements: true,
        },
      })

      if (openSession) {
        let cashBalance = Number(openSession.openingAmount)
        for (const m of openSession.movements) {
          if (m.paymentMethod === 'CASH') {
            if (m.movementType === 'INCOME') {
              cashBalance += Number(m.amount)
            } else {
              cashBalance -= Number(m.amount)
            }
          }
        }
        cashStatus = 'Abierta'
        cashStatusDescription = `Efectivo: $${cashBalance.toFixed(2)}`
      } else {
        cashStatus = 'Cerrada'
        cashStatusDescription = 'Sin caja abierta'
      }

      const activeProductsRes = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.isActive, true))
      activeProductsCount = activeProductsRes[0]?.count ?? 0
    }

    const genderRows = await db
      .select({ gender: members.gender, count: count() })
      .from(members)
      .where(memberFilter)
      .groupBy(members.gender)

    let femaleCount = 0
    let maleCount = 0
    for (const row of genderRows) {
      if (row.gender === 'FEMALE') femaleCount = row.count
      else if (row.gender === 'MALE') maleCount = row.count
    }

    const topProductsRes = data.branchId
      ? await db
          .select({
            productId: saleItems.productId,
            totalQty: sum(saleItems.quantity),
          })
          .from(saleItems)
          .innerJoin(sales, eq(saleItems.saleId, sales.id))
          .where(eq(sales.branchId, data.branchId))
          .groupBy(saleItems.productId)
          .orderBy(desc(sum(saleItems.quantity)))
          .limit(5)
      : await db
          .select({
            productId: saleItems.productId,
            totalQty: sum(saleItems.quantity),
          })
          .from(saleItems)
          .groupBy(saleItems.productId)
          .orderBy(desc(sum(saleItems.quantity)))
          .limit(5)

    const realTopProducts = (
      await Promise.all(
        topProductsRes.map(async (item) => {
          const product = await db.query.products.findFirst({
            where: eq(products.id, item.productId),
          })
          if (!product) return null
          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            quantitySold: Number(item.totalQty),
          }
        }),
      )
    ).filter(Boolean) as {
      id: string
      name: string
      sku: string
      quantitySold: number
    }[]

    const topProducts = realTopProducts.slice(0, 5)

    const allCheckIns = await db.query.checkIns.findMany({
      where: data.branchId
        ? eq(checkIns.branchId, data.branchId)
        : undefined,
      with: {
        member: true,
      },
    })

    const timeSlots = [
      '05:00',
      '07:00',
      '09:00',
      '11:00',
      '13:00',
      '15:00',
      '17:00',
      '19:00',
      '21:00',
      '23:00',
    ]
    const createEmptySlot = (hour: string) => ({
      hour,
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46+': 0,
    })

    function getAgeRange(
      birthDate: Date | null,
    ): '18-25' | '26-35' | '36-45' | '46+' {
      if (!birthDate) return '26-35'
      const age = new Date().getFullYear() - birthDate.getFullYear()
      if (age <= 25) return '18-25'
      if (age <= 35) return '26-35'
      if (age <= 45) return '36-45'
      return '46+'
    }

    const hourlyCheckIns = timeSlots.map(createEmptySlot)
    for (const ci of allCheckIns) {
      const ciDate = new Date(ci.checkedInAt)
      const hour = ciDate.getHours()
      let nearestSlot = '13:00'
      let minDiff = 24
      for (const slot of timeSlots) {
        const slotHour = parseInt(slot.split(':')[0])
        const diff = Math.abs(hour - slotHour)
        if (diff < minDiff) {
          minDiff = diff
          nearestSlot = slot
        }
      }
      const range = getAgeRange(ci.member.birthDate)
      const slotObj = hourlyCheckIns.find((d) => d.hour === nearestSlot)
      if (slotObj) {
        slotObj[range] += 1
      }
    }

    return {
      totalMembers,
      activeMemberships,
      checkInsToday,
      salesToday,
      membershipIncome,
      posIncome,
      cashStatus,
      cashStatusDescription,
      activeProductsCount,
      expiringSubscriptions,
      lowStockProducts,
      genderStats: {
        female: femaleCount,
        male: maleCount,
      },
      topProducts,
      hourlyCheckIns,
      expiringSoonCount: expiringSubscriptions.length,
    }
  },
)

// ── Churn Rate Dashboard ──

export const getDashboardChurnData = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const risks = (await computeAllChurnRisks(50)).slice(0, 5)

    const critical = risks.filter((r) => r.level === 'CRITICAL').length
    const high = risks.filter((r) => r.level === 'HIGH').length
    const medium = risks.filter((r) => r.level === 'MEDIUM').length
    const low = risks.filter((r) => r.level === 'LOW').length
    const total = critical + high + medium + low

    // Overall churn rate: % of active members at HIGH or CRITICAL risk
    const churnRate = total > 0 ? Math.round(((critical + high) / total) * 100) : 0

    return { distribution: { critical, high, medium, low, total }, churnRate, topRisks: risks }
  })

// ── Revenue Trends (last 6 months) ──

export const getRevenueTrends = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const months: { label: string; start: Date; end: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: m.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        start: new Date(m.getFullYear(), m.getMonth(), 1),
        end: new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999),
      })
    }

    const data = await Promise.all(
      months.map(async (m) => {
        const [membership] = await db
          .select({ total: sum(membershipPayments.amount) })
          .from(membershipPayments)
          .where(
            and(gte(membershipPayments.paymentDate, m.start), lte(membershipPayments.paymentDate, m.end)),
          )

        const [pos] = await db
          .select({ total: sum(sales.total) })
          .from(sales)
          .where(
            and(gte(sales.soldAt, m.start), lte(sales.soldAt, m.end), eq(sales.status, 'COMPLETED')),
          )

        const membershipIncome = Number(membership?.total ?? 0)
        const posIncome = Number(pos?.total ?? 0)
        const total = membershipIncome + posIncome

        return {
          month: m.label,
          membershipIncome,
          posIncome,
          total,
          // Goal: +10% over the running average (calculated lazily per month)
          goal: 0, // fill after
        }
      }),
    )

    // Calculate goals: 110% of rolling 3-month average
    for (let i = 0; i < data.length; i++) {
      const slice = data.slice(Math.max(0, i - 2), i)
      const avg = slice.length > 0 ? slice.reduce((a, b) => a + b.total, 0) / slice.length : data[i].total
      data[i].goal = Math.round(avg * 1.1)
    }

    return data
  })

// ── Membership Trends (last 6 months) ──

export const getMembershipTrends = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const data: { month: string; active: number; newMembers: number; expired: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

      const label = monthStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })

      // Active subscriptions at end of month
      const [activeRes] = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, 'ACTIVE'),
            lte(subscriptions.startDate, monthEnd),
            gte(subscriptions.endDate, monthEnd),
          ),
        )

      // New subscriptions created in month
      const [newRes] = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            gte(subscriptions.createdAt, monthStart),
            lte(subscriptions.createdAt, monthEnd),
          ),
        )

      // Subscriptions that expired in month
      const [expiredRes] = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, 'EXPIRED'),
            gte(subscriptions.endDate, monthStart),
            lte(subscriptions.endDate, monthEnd),
          ),
        )

      data.push({
        month: label,
        active: activeRes?.count ?? 0,
        newMembers: newRes?.count ?? 0,
        expired: expiredRes?.count ?? 0,
      })
    }

    return data
  })

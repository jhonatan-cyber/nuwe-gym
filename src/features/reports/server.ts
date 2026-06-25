import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/shared/db/index.ts'
import { count, sum, eq, and, gte, lte, sql } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { members } from '#/shared/db/schema/members.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { cashMovements } from '#/shared/db/schema/cash-register.ts'
import { products } from '#/shared/db/schema/products.ts'

const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
})

export const getFinancialReport = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    const membershipIncomeRes = await db
      .select({
        date: sql<string>`DATE(${membershipPayments.paymentDate})`,
        amount: sum(membershipPayments.amount),
      })
      .from(membershipPayments)
      .where(
        and(
          gte(membershipPayments.paymentDate, startDate),
          lte(membershipPayments.paymentDate, endDate),
        ),
      )
      .groupBy(sql`DATE(${membershipPayments.paymentDate})`)
      .orderBy(sql`DATE(${membershipPayments.paymentDate})`)

    const posIncomeRes = await db
      .select({
        date: sql<string>`DATE(${sales.soldAt})`,
        amount: sum(sales.total),
      })
      .from(sales)
      .where(
        and(
          gte(sales.soldAt, startDate),
          lte(sales.soldAt, endDate),
          eq(sales.status, 'COMPLETED'),
        ),
      )
      .groupBy(sql`DATE(${sales.soldAt})`)
      .orderBy(sql`DATE(${sales.soldAt})`)

    const expensesRes = await db
      .select({
        date: sql<string>`DATE(${cashMovements.createdAt})`,
        amount: sum(cashMovements.amount),
      })
      .from(cashMovements)
      .where(
        and(
          gte(cashMovements.createdAt, startDate),
          lte(cashMovements.createdAt, endDate),
          eq(cashMovements.movementType, 'EXPENSE'),
        ),
      )
      .groupBy(sql`DATE(${cashMovements.createdAt})`)
      .orderBy(sql`DATE(${cashMovements.createdAt})`)

    const dateMap = new Map<
      string,
      { membershipIncome: number; posIncome: number; expenses: number }
    >()

    for (const row of membershipIncomeRes) {
      const d = row.date
      if (!dateMap.has(d))
        dateMap.set(d, { membershipIncome: 0, posIncome: 0, expenses: 0 })
      dateMap.get(d)!.membershipIncome += Number(row.amount ?? 0)
    }

    for (const row of posIncomeRes) {
      const d = row.date
      if (!dateMap.has(d))
        dateMap.set(d, { membershipIncome: 0, posIncome: 0, expenses: 0 })
      dateMap.get(d)!.posIncome += Number(row.amount ?? 0)
    }

    for (const row of expensesRes) {
      const d = row.date
      if (!dateMap.has(d))
        dateMap.set(d, { membershipIncome: 0, posIncome: 0, expenses: 0 })
      dateMap.get(d)!.expenses += Number(row.amount ?? 0)
    }

    const chartData = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }))

    const totalMembershipIncome = chartData.reduce(
      (acc, d) => acc + d.membershipIncome,
      0,
    )
    const totalPosIncome = chartData.reduce((acc, d) => acc + d.posIncome, 0)
    const totalExpenses = chartData.reduce((acc, d) => acc + d.expenses, 0)

    return {
      chartData,
      summary: {
        totalMembershipIncome,
        totalPosIncome,
        totalExpenses,
        netBalance: totalMembershipIncome + totalPosIncome - totalExpenses,
      },
    }
  })

export const getAttendanceReport = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    const rows = await db
      .select({
        date: sql<string>`DATE(${checkIns.checkedInAt})`,
        count: count(),
      })
      .from(checkIns)
      .where(
        and(
          gte(checkIns.checkedInAt, startDate),
          lte(checkIns.checkedInAt, endDate),
          eq(checkIns.resultStatus, 'ALLOWED'),
        ),
      )
      .groupBy(sql`DATE(${checkIns.checkedInAt})`)
      .orderBy(sql`DATE(${checkIns.checkedInAt})`)

    const chartData = rows.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }))
    const total = chartData.reduce((acc, d) => acc + d.count, 0)
    const dayCount = chartData.length || 1

    return {
      chartData,
      summary: { total, dailyAverage: Math.round(total / dayCount) },
    }
  })

export const getSalesReport = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    const salesSummaryRes = await db
      .select({
        totalRevenue: sum(sales.total),
        totalTransactions: count(),
      })
      .from(sales)
      .where(
        and(
          gte(sales.soldAt, startDate),
          lte(sales.soldAt, endDate),
          eq(sales.status, 'COMPLETED'),
        ),
      )

    const summary = salesSummaryRes[0] ?? {
      totalRevenue: '0',
      totalTransactions: 0,
    }

    const productSales = await db
      .select({
        productName: products.name,
        quantity: sum(saleItems.quantity),
        total: sum(saleItems.subtotal),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(
        and(
          gte(sales.soldAt, startDate),
          lte(sales.soldAt, endDate),
          eq(sales.status, 'COMPLETED'),
        ),
      )
      .groupBy(products.name)
      .orderBy(sql`SUM(${saleItems.subtotal}) DESC`)

    const chartData = productSales.map((r) => ({
      name: r.productName,
      quantity: Number(r.quantity ?? 0),
      total: Number(r.total ?? 0),
    }))

    const totalRevenue = Number(summary.totalRevenue ?? 0)
    const totalTransactions = Number(summary.totalTransactions)

    return { chartData, summary: { totalRevenue, totalTransactions } }
  })

export const getMembersReport = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    const totalRes = await db.select({ count: count() }).from(members)

    const newMembersRes = await db
      .select({ count: count() })
      .from(members)
      .where(
        and(gte(members.createdAt, startDate), lte(members.createdAt, endDate)),
      )

    const activeRes = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.status, 'ACTIVE'))

    const inactiveRes = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.status, 'INACTIVE'))

    const churnedRes = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'EXPIRED'),
          gte(subscriptions.endDate, startDate),
          lte(subscriptions.endDate, endDate),
        ),
      )

    return {
      total: totalRes[0]?.count ?? 0,
      newMembers: newMembersRes[0]?.count ?? 0,
      active: activeRes[0]?.count ?? 0,
      inactive: inactiveRes[0]?.count ?? 0,
      churned: churnedRes[0]?.count ?? 0,
    }
  })

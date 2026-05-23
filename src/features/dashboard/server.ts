import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { count, eq, gte, lte, and, sum, sql } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { cashRegisterSessions } from '#/shared/db/schema/cash-register.ts'
import { products } from '#/shared/db/schema/products.ts'
import type { UserRole } from '#/shared/lib/permissions.ts'

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const userRole = session.user.role as UserRole

    // Date calculations in local time
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // 1. Total members (Socios Registrados)
    const totalMembersRes = await db.select({ count: count() }).from(members)
    const totalMembers = totalMembersRes[0]?.count ?? 0

    // 2. Active memberships
    const activeMembershipsRes = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE'))
    const activeMemberships = activeMembershipsRes[0]?.count ?? 0

    // 3. Check-ins today
    const checkInsTodayRes = await db
      .select({ count: count() })
      .from(checkIns)
      .where(
        and(
          gte(checkIns.checkedInAt, startOfToday),
          lte(checkIns.checkedInAt, endOfToday),
          eq(checkIns.resultStatus, 'ALLOWED')
        )
      )
    const checkInsToday = checkInsTodayRes[0]?.count ?? 0

    // 4. POS Sales today
    const salesTodayRes = await db
      .select({ sum: sum(sales.total) })
      .from(sales)
      .where(
        and(
          gte(sales.soldAt, startOfToday),
          lte(sales.soldAt, endOfToday),
          eq(sales.status, 'COMPLETED')
        )
      )
    const salesToday = Number(salesTodayRes[0]?.sum ?? 0)

    // Expiring memberships in the next 7 days
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999)

    const expiringSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        gte(subscriptions.endDate, startOfToday),
        lte(subscriptions.endDate, sevenDaysFromNow)
      ),
      with: {
        member: true,
        plan: true,
      },
      orderBy: (subscriptions, { asc }) => [asc(subscriptions.endDate)],
    })

    // Low stock products (stockCurrent <= stockMinimum and isActive is true)
    const lowStockProducts = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        sql`stock_current <= stock_minimum`
      ),
      orderBy: (products, { asc }) => [asc(products.stockCurrent)],
    })

    // Financial metrics (only query for ADMIN or RECEPTIONIST)
    let membershipIncome = 0
    let posIncome = 0
    let cashStatus = 'Cerrada'
    let cashStatusDescription = 'Sin caja abierta'
    let activeProductsCount = 0

    if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
      // 5. Membership payments this month
      const membershipIncomeRes = await db
        .select({ sum: sum(membershipPayments.amount) })
        .from(membershipPayments)
        .where(
          and(
            gte(membershipPayments.paymentDate, startOfMonth),
            lte(membershipPayments.paymentDate, endOfMonth)
          )
        )
      membershipIncome = Number(membershipIncomeRes[0]?.sum ?? 0)

      // 6. POS Sales this month
      const posIncomeRes = await db
        .select({ sum: sum(sales.total) })
        .from(sales)
        .where(
          and(
            gte(sales.soldAt, startOfMonth),
            lte(sales.soldAt, endOfMonth),
            eq(sales.status, 'COMPLETED')
          )
        )
      posIncome = Number(posIncomeRes[0]?.sum ?? 0)

      // 7. Cash Register Session Status
      const openSession = await db.query.cashRegisterSessions.findFirst({
        where: eq(cashRegisterSessions.status, 'OPEN'),
        with: {
          movements: true,
        },
      })

      if (openSession) {
        let cashBalance = Number(openSession.openingAmount)
        if (openSession.movements) {
          for (const m of openSession.movements) {
            if (m.paymentMethod === 'CASH') {
              if (m.movementType === 'INCOME') {
                cashBalance += Number(m.amount)
              } else {
                cashBalance -= Number(m.amount)
              }
            }
          }
        }
        cashStatus = 'Abierta'
        cashStatusDescription = `Efectivo: $${cashBalance.toFixed(2)}`
      } else {
        cashStatus = 'Cerrada'
        cashStatusDescription = 'Sin caja abierta'
      }

      // 8. Active Products
      const activeProductsRes = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.isActive, true))
      activeProductsCount = activeProductsRes[0]?.count ?? 0
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
    }
  },
)

export const getExpiringSoonCount = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })

    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999)

    const rows = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'ACTIVE'),
          gte(subscriptions.endDate, now),
          lte(subscriptions.endDate, sevenDaysFromNow),
        ),
      )

    return rows[0]?.count ?? 0
  },
)

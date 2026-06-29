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
import { z } from 'zod'

const getDashboardDataSchema = z.object({
  branchId: z.string().optional(),
})

export const getDashboardData = createServerFn({ method: 'GET' })
  .inputValidator((data) => getDashboardDataSchema.parse(data))
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
        plan: true,
      },
      orderBy: (s, { asc }) => [asc(s.endDate)],
    })

    const lowStockProducts = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        sql`stock_current <= stock_minimum`,
        data.branchId ? eq(products.branchId, data.branchId) : undefined,
      ),
      orderBy: (p, { asc }) => [asc(p.stockCurrent)],
    })

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
        .where(
          data.branchId
            ? and(eq(products.isActive, true), eq(products.branchId, data.branchId))
            : eq(products.isActive, true),
        )
      activeProductsCount = activeProductsRes[0]?.count ?? 0
    }

    const femaleCount = 0
    const maleCount = 0

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

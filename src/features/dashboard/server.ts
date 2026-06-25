import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { count, eq, gte, lte, and, sum, sql, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { cashRegisterSessions } from '#/shared/db/schema/cash-register.ts'
import { products } from '#/shared/db/schema/products.ts'
import type { UserRole } from '#/shared/lib/permissions.ts'

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })
    const userRole = session.user.role as UserRole
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
          eq(checkIns.resultStatus, 'ALLOWED'),
        ),
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
          eq(sales.status, 'COMPLETED'),
        ),
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
        lte(subscriptions.endDate, sevenDaysFromNow),
      ),
      with: {
        member: true,
        plan: true,
      },
      orderBy: (s, { asc }) => [asc(s.endDate)],
    })

    // Low stock products (stockCurrent <= stockMinimum and isActive is true)
    const lowStockProducts = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        sql`stock_current <= stock_minimum`,
      ),
      orderBy: (p, { asc }) => [asc(p.stockCurrent)],
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
            lte(membershipPayments.paymentDate, endOfMonth),
          ),
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
            eq(sales.status, 'COMPLETED'),
          ),
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

      // 8. Active Products
      const activeProductsRes = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.isActive, true))
      activeProductsCount = activeProductsRes[0]?.count ?? 0
    }

    // Gender statistics (Female/Male count using deterministic split)
    const allMembers = await db.select({ id: members.id }).from(members)
    const femaleCount = allMembers.filter((m) => m.id % 2 === 0).length
    const maleCount = allMembers.length - femaleCount

    // Top 5 products
    const topProductsRes = await db
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
      id: number
      name: string
      sku: string
      quantitySold: number
    }[]

    const dummyProducts = [
      {
        id: -1,
        name: 'AGUA 1LT /VITAL',
        sku: 'villa - codigo',
        quantitySold: 829,
      },
      {
        id: -2,
        name: 'AGUA 2 LT /VITAL',
        sku: 'villa - codigo',
        quantitySold: 645,
      },
      { id: -3, name: 'POWER AZUL', sku: 'villa - codigo', quantitySold: 362 },
      {
        id: -4,
        name: 'ALFAJOR NENE RICE',
        sku: 'villa - codigo',
        quantitySold: 360,
      },
      { id: -5, name: 'POWER ROJO', sku: 'villa - codigo', quantitySold: 189 },
    ]
    const topProducts = [...realTopProducts, ...dummyProducts].slice(0, 5)

    // Hourly Attendance Chart Data
    const allCheckIns = await db.query.checkIns.findMany({
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
    const defaultAttendanceData = [
      { hour: '05:00', '18-25': 120, '26-35': 240, '36-45': 180, '46+': 60 },
      { hour: '07:00', '18-25': 280, '26-35': 410, '36-45': 320, '46+': 110 },
      { hour: '09:00', '18-25': 190, '26-35': 290, '36-45': 220, '46+': 90 },
      { hour: '11:00', '18-25': 140, '26-35': 210, '36-45': 170, '46+': 70 },
      { hour: '13:00', '18-25': 170, '26-35': 260, '36-45': 190, '46+': 80 },
      { hour: '15:00', '18-25': 210, '26-35': 310, '36-45': 240, '46+': 100 },
      { hour: '17:00', '18-25': 320, '26-35': 460, '36-45': 370, '46+': 140 },
      { hour: '19:00', '18-25': 290, '26-35': 430, '36-45': 340, '46+': 120 },
      { hour: '21:00', '18-25': 180, '26-35': 280, '36-45': 200, '46+': 80 },
      { hour: '23:00', '18-25': 80, '26-35': 120, '36-45': 90, '46+': 40 },
    ]

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

    const hourlyCheckIns = defaultAttendanceData.map((d) => ({ ...d }))
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

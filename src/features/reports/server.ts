import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { dateString } from '#/shared/lib/schemas.ts'
import { getGroq, GROQ_MODEL } from '#/shared/lib/ai.ts'
import { db } from '#/shared/db/index.ts'
import { count, sum, eq, and, gte, lte, sql, inArray } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { members } from '#/shared/db/schema/members.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { cashMovements, cashRegisterSessions } from '#/shared/db/schema/cash-register.ts'
import { products } from '#/shared/db/schema/products.ts'
const dateRangeSchema = z.object({
  startDate: dateString,
  endDate: dateString,
})

export const getFinancialReport = createServerFn({ method: 'GET' })
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({
      data: { permission: 'reports:read' },
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
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({
      data: { permission: 'reports:read' },
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
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({
      data: { permission: 'reports:read' },
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
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({
      data: { permission: 'reports:read' },
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

export const getAICopilotSummary = createServerFn({ method: 'GET' })
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({
      data: { permission: 'reports:read' },
    })

    // 1. Obtener todos los reportes del mismo rango de fechas
    const [financials, attendance, sales, membersData] = await Promise.all([
      getFinancialReport({ data }),
      getAttendanceReport({ data }),
      getSalesReport({ data }),
      getMembersReport({ data }),
    ])

    // 2. Consolidar métricas para la IA
    const summaryData = {
      periodo: `${data.startDate} a ${data.endDate}`,
      finanzas: financials.summary,
      asistencia: attendance.summary,
      ventasPOS: sales.summary,
      socios: membersData,
    }

    // 3. Invocar a Groq
    const groq = getGroq()
    const systemPrompt = `Eres un consultor de negocios experto para gimnasios y centros deportivos.
Tu tarea es redactar un resumen ejecutivo y de análisis financiero para la administración en base a las métricas del periodo.
REGLAS:
- Responde siempre en español de Argentina (voseo natural, cálido y profesional: "tenés", "observás", "che").
- Sé analítico pero muy directo y accionable.
- Estructura tu respuesta en 3 secciones cortas con títulos claros en negrita:
  1. 📈 **Desempeño General** (un breve párrafo del balance financiero y asistencia)
  2. ⚠️ **Alertas & Puntos Críticos** (puntos donde el negocio tiene cuellos de botella o pérdidas)
  3. 💡 **Recomendaciones Clave** (2 o 3 consejos prácticos de negocio para el dueño del gimnasio)
- Mantén la respuesta concisa y profesional (máximo 250 palabras).`

    const userPrompt = `Datos Consolidados del Gimnasio:
${JSON.stringify(summaryData, null, 2)}`

    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 800
      })

      return completion.choices?.[0]?.message?.content || 'No se pudo generar el análisis.'
    } catch (err) {
      console.error('Error al generar resumen ejecutivo financiero con IA:', err)
      return 'Ocurrió un error al intentar conectarse con la IA de Groq. Asegúrate de tener configurada la GROQ_API_KEY.'
    }
  })

// ── Reporte de Comisiones por Trainer ────────────────────────────

export const getCommissionsReport = createServerFn({ method: 'GET' })
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'reports:read' } })

    const { trainerProfiles } = await import('#/shared/db/schema/trainers.ts')
    const { users } = await import('#/shared/db/schema/auth.ts')
    const { membershipPayments: mp } = await import('#/shared/db/schema/membership-payments.ts')
    const { trainerAssignments } = await import('#/shared/db/schema/trainers.ts')

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    // Obtener todos los trainers activos con su commissionRate
    const trainers = await db
      .select({
        trainerId: trainerProfiles.id,
        commissionRate: trainerProfiles.commissionRate,
        userName: users.name,
        userEmail: users.email,
      })
      .from(trainerProfiles)
      .innerJoin(users, eq(users.id, trainerProfiles.userId))
      .where(eq(trainerProfiles.isActive, true))

    // Para cada trainer, sumar los pagos de membresías de sus socios asignados en el período
    const results = await Promise.all(
      trainers.map(async (trainer) => {
        // Obtener miembros asignados al trainer
        const assignments = await db
          .select({ memberId: trainerAssignments.memberId })
          .from(trainerAssignments)
          .where(
            and(
              eq(trainerAssignments.trainerId, trainer.trainerId),
              eq(trainerAssignments.isActive, true),
            ),
          )

        const memberIds = assignments.map((a) => a.memberId)

        if (memberIds.length === 0) {
          return {
            trainerId: trainer.trainerId,
            trainerName: trainer.userName,
            trainerEmail: trainer.userEmail,
            commissionRate: Number(trainer.commissionRate ?? 0),
            assignedMembers: 0,
            totalMembershipRevenue: 0,
            commissionAmount: 0,
          }
        }

        // Sumar pagos de membresías en el período para esos miembros
        const paymentSum = await db
          .select({ total: sum(mp.amount) })
          .from(mp)
          .where(
            and(
              inArray(mp.memberId, memberIds),
              gte(mp.paymentDate, startDate),
              lte(mp.paymentDate, endDate),
            ),
          )

        const totalRevenue = Number(paymentSum[0]?.total ?? 0)
        const rate = Number(trainer.commissionRate ?? 0)
        const commissionAmount = (totalRevenue * rate) / 100

        return {
          trainerId: trainer.trainerId,
          trainerName: trainer.userName,
          trainerEmail: trainer.userEmail,
          commissionRate: rate,
          assignedMembers: memberIds.length,
          totalMembershipRevenue: totalRevenue,
          commissionAmount,
        }
      }),
    )

    const totalCommissions = results.reduce((acc, r) => acc + r.commissionAmount, 0)
    const totalRevenue = results.reduce((acc, r) => acc + r.totalMembershipRevenue, 0)

    return {
      trainers: results.sort((a, b) => b.commissionAmount - a.commissionAmount),
      summary: { totalCommissions, totalRevenue },
    }
  })

// ── Reporte Cross-Branch Consolidado ──────────────────────────────

export const getCrossBranchReport = createServerFn({ method: 'GET' })
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'reports:read' } })

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    const { branches } = await import('#/shared/db/schema/branches.ts')

    const allBranches = await db.select().from(branches).where(eq(branches.isActive, true))

    const branchReports = await Promise.all(
      allBranches.map(async (branch) => {
        // ── Active members in this branch ──
        const activeMembersRes = await db
          .select({ count: count() })
          .from(members)
          .where(and(eq(members.branchId, branch.id), eq(members.status, 'ACTIVE')))
        const activeMembers = activeMembersRes[0]?.count ?? 0

        // ── New members this period ──
        const newMembersRes = await db
          .select({ count: count() })
          .from(members)
          .where(
            and(
              eq(members.branchId, branch.id),
              gte(members.createdAt, startDate),
              lte(members.createdAt, endDate),
            ),
          )
        const newMembers = newMembersRes[0]?.count ?? 0

        // Member IDs for this branch
        const branchMemberIds = (
          await db
            .select({ id: members.id })
            .from(members)
            .where(eq(members.branchId, branch.id))
        ).map((m) => m.id)

        // ── Active subscriptions ──
        let activeSubscriptions = 0
        let membershipIncome = 0
        if (branchMemberIds.length > 0) {
          const activeSubsRes = await db
            .select({ count: count() })
            .from(subscriptions)
            .where(
              and(
                inArray(subscriptions.memberId, branchMemberIds),
                eq(subscriptions.status, 'ACTIVE'),
              ),
            )
          activeSubscriptions = activeSubsRes[0]?.count ?? 0

          // ── Membership income this period ──
          const incomeRes = await db
            .select({ total: sum(membershipPayments.amount) })
            .from(membershipPayments)
            .where(
              and(
                inArray(membershipPayments.memberId, branchMemberIds),
                gte(membershipPayments.paymentDate, startDate),
                lte(membershipPayments.paymentDate, endDate),
              ),
            )
          membershipIncome = Number(incomeRes[0]?.total ?? 0)
        }

        // ── Check-ins this period (ALLOWED) ──
        const checkInsRes = await db
          .select({ count: count() })
          .from(checkIns)
          .where(
            and(
              eq(checkIns.branchId, branch.id),
              eq(checkIns.resultStatus, 'ALLOWED'),
              gte(checkIns.checkedInAt, startDate),
              lte(checkIns.checkedInAt, endDate),
            ),
          )
        const checkInCount = checkInsRes[0]?.count ?? 0

        // ── POS income this period ──
        const posIncomeRes = await db
          .select({ total: sum(sales.total) })
          .from(sales)
          .where(
            and(
              eq(sales.branchId, branch.id),
              eq(sales.status, 'COMPLETED'),
              gte(sales.soldAt, startDate),
              lte(sales.soldAt, endDate),
            ),
          )
        const posIncome = Number(posIncomeRes[0]?.total ?? 0)

        // ── Expenses this period (via cash sessions) ──
        // cashMovements → cashRegisterSessions → branchId
        const expensesRes = await db
          .select({ total: sum(cashMovements.amount) })
          .from(cashMovements)
          .innerJoin(cashRegisterSessions, eq(cashMovements.cashSessionId, cashRegisterSessions.id))
          .where(
            and(
              eq(cashRegisterSessions.branchId, branch.id),
              eq(cashMovements.movementType, 'EXPENSE'),
              gte(cashMovements.createdAt, startDate),
              lte(cashMovements.createdAt, endDate),
            ),
          )
        const expenses = Number(expensesRes[0]?.total ?? 0)

        const totalIncome = membershipIncome + posIncome
        const netBalance = totalIncome - expenses

        return {
          branchId: branch.id,
          branchName: branch.name,
          activeMembers,
          newMembers,
          activeSubscriptions,
          checkIns: checkInCount,
          membershipIncome,
          posIncome,
          totalIncome,
          expenses,
          netBalance,
        }
      }),
    )

    // ── Consolidated totals ──
    const consolidated = branchReports.reduce(
      (acc, b) => ({
        activeMembers: acc.activeMembers + b.activeMembers,
        newMembers: acc.newMembers + b.newMembers,
        activeSubscriptions: acc.activeSubscriptions + b.activeSubscriptions,
        checkIns: acc.checkIns + b.checkIns,
        membershipIncome: acc.membershipIncome + b.membershipIncome,
        posIncome: acc.posIncome + b.posIncome,
        totalIncome: acc.totalIncome + b.totalIncome,
        expenses: acc.expenses + b.expenses,
        netBalance: acc.netBalance + b.netBalance,
      }),
      {
        activeMembers: 0,
        newMembers: 0,
        activeSubscriptions: 0,
        checkIns: 0,
        membershipIncome: 0,
        posIncome: 0,
        totalIncome: 0,
        expenses: 0,
        netBalance: 0,
      },
    )

    return {
      branches: branchReports.sort((a, b) => b.totalIncome - a.totalIncome),
      consolidated,
    }
  })

// ── Reporte de Utilidades ─────────────────────────────────────────

export const getProfitabilityReport = createServerFn({ method: 'GET' })
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'reports:read' } })

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    // Ingresos por membresías
    const membershipIncomeRes = await db
      .select({ total: sum(membershipPayments.amount) })
      .from(membershipPayments)
      .where(
        and(
          gte(membershipPayments.paymentDate, startDate),
          lte(membershipPayments.paymentDate, endDate),
        ),
      )

    // Ingresos POS
    const posIncomeRes = await db
      .select({ total: sum(sales.total) })
      .from(sales)
      .where(
        and(
          gte(sales.soldAt, startDate),
          lte(sales.soldAt, endDate),
          eq(sales.status, 'COMPLETED'),
        ),
      )

    // Egresos de caja
    const expensesRes = await db
      .select({ total: sum(cashMovements.amount) })
      .from(cashMovements)
      .where(
        and(
          gte(cashMovements.createdAt, startDate),
          lte(cashMovements.createdAt, endDate),
          eq(cashMovements.movementType, 'EXPENSE'),
        ),
      )

    // Costo de ventas (purchasePrice * qty vendida)
    const cogsRes = await db
      .select({ total: sum(sql<number>`${saleItems.quantity} * CAST(${products.purchasePrice} AS numeric)`) })
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

    const membershipIncome = Number(membershipIncomeRes[0]?.total ?? 0)
    const posIncome = Number(posIncomeRes[0]?.total ?? 0)
    const totalIncome = membershipIncome + posIncome
    const operationalExpenses = Number(expensesRes[0]?.total ?? 0)
    const cogs = Number(cogsRes[0]?.total ?? 0)
    const totalExpenses = operationalExpenses + cogs
    const grossProfit = totalIncome - cogs
    const netProfit = totalIncome - totalExpenses
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    // Serie diaria para gráfico
    const dailyMembership = await db
      .select({
        date: sql<string>`DATE(${membershipPayments.paymentDate})`,
        amount: sum(membershipPayments.amount),
      })
      .from(membershipPayments)
      .where(and(gte(membershipPayments.paymentDate, startDate), lte(membershipPayments.paymentDate, endDate)))
      .groupBy(sql`DATE(${membershipPayments.paymentDate})`)

    const dailyPos = await db
      .select({
        date: sql<string>`DATE(${sales.soldAt})`,
        amount: sum(sales.total),
      })
      .from(sales)
      .where(and(gte(sales.soldAt, startDate), lte(sales.soldAt, endDate), eq(sales.status, 'COMPLETED')))
      .groupBy(sql`DATE(${sales.soldAt})`)

    const dailyExpenses = await db
      .select({
        date: sql<string>`DATE(${cashMovements.createdAt})`,
        amount: sum(cashMovements.amount),
      })
      .from(cashMovements)
      .where(and(gte(cashMovements.createdAt, startDate), lte(cashMovements.createdAt, endDate), eq(cashMovements.movementType, 'EXPENSE')))
      .groupBy(sql`DATE(${cashMovements.createdAt})`)

    const dateMap = new Map<string, { income: number; expenses: number; profit: number }>()
    for (const r of dailyMembership) {
      const d = r.date
      if (!dateMap.has(d)) dateMap.set(d, { income: 0, expenses: 0, profit: 0 })
      dateMap.get(d)!.income += Number(r.amount ?? 0)
    }
    for (const r of dailyPos) {
      const d = r.date
      if (!dateMap.has(d)) dateMap.set(d, { income: 0, expenses: 0, profit: 0 })
      dateMap.get(d)!.income += Number(r.amount ?? 0)
    }
    for (const r of dailyExpenses) {
      const d = r.date
      if (!dateMap.has(d)) dateMap.set(d, { income: 0, expenses: 0, profit: 0 })
      dateMap.get(d)!.expenses += Number(r.amount ?? 0)
    }
    for (const [, v] of dateMap) v.profit = v.income - v.expenses

    const chartData = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }))

    return {
      summary: {
        membershipIncome,
        posIncome,
        totalIncome,
        cogs,
        operationalExpenses,
        totalExpenses,
        grossProfit,
        netProfit,
        margin: parseFloat(margin.toFixed(2)),
      },
      chartData,
    }
  })

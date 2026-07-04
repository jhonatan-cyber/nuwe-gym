import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, gte, lte, inArray, sum } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { trainerProfiles, trainerAssignments } from '#/shared/db/schema/trainers.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { employeeBonuses } from '#/shared/db/schema/employee-bonuses.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { dateString } from '#/shared/lib/schemas.ts'

// ── Types ──

export interface EmployeeCommissionInfo {
  employeeId: string
  employeeName: string
  trainerId: string
  commissionRate: number
  assignedMembers: number
  totalMembershipRevenue: number
  commissionAmount: number
  includedInPayroll: boolean
}

export interface CommissionsDashboard {
  totalPendingCommissions: number
  totalPaidCommissions: number
  trainersWithCommissions: number
  periodSummary: {
    periodStart: string
    periodEnd: string
    totalRevenue: number
    totalCommissions: number
  } | null
}

// ── Bridge: Find employees who are also trainers ──

/**
 * Returns all employees who are also trainers (linked via userId),
 * along with their commission rate and stats.
 */
export const getEmployeeCommissionBridge = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    // Get all employees with a userId
    const allEmployees = await db
      .select()
      .from(employees)
      .where(and(eq(employees.isActive, true)))

    // Get all active trainers
    const allTrainers = await db.query.trainerProfiles.findMany({
      where: eq(trainerProfiles.isActive, true),
      with: {
        assignments: {
          where: eq(trainerAssignments.isActive, true),
        },
      },
    })

    // Build a map: userId → trainer
    const trainerByUserId = new Map<string, typeof allTrainers[0]>()
    for (const t of allTrainers) {
      if (t.userId) trainerByUserId.set(t.userId, t)
    }

    // Map employees → trainers via shared userId
    const bridge: Array<{
      employeeId: string
      employeeName: string
      employeeCode: string
      trainerId: string
      commissionRate: number
      assignedMembers: number
    }> = []

    for (const emp of allEmployees) {
      if (!emp.userId) continue
      const trainer = trainerByUserId.get(emp.userId)
      if (!trainer) continue

      bridge.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeCode: emp.employeeCode ?? '',
        trainerId: trainer.id,
        commissionRate: Number(trainer.commissionRate ?? 0),
        assignedMembers: trainer.assignments?.length ?? 0,
      })
    }

    return bridge
  })

// ── Get commissions for a period, bridged to employees ──

const dateRangeSchema = z.object({
  periodStart: dateString,
  periodEnd: dateString,
})

export const getTrainerCommissionsForPeriod = createServerFn({ method: 'GET' })
  .validator((data: unknown) => dateRangeSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)

    // 1. Get all active employees with userId
    const allEmployees = await db
      .select()
      .from(employees)
      .where(and(eq(employees.isActive, true)))

    // 2. Get all active trainers with assignments
    const allTrainers = await db.query.trainerProfiles.findMany({
      where: eq(trainerProfiles.isActive, true),
      with: {
        assignments: {
          where: eq(trainerAssignments.isActive, true),
        },
      },
    })

    // 3. Build trainer map by userId
    const trainerByUserId = new Map<string, typeof allTrainers[0]>()
    for (const t of allTrainers) {
      if (t.userId) trainerByUserId.set(t.userId, t)
    }

    // 4. For each employee-trainer, calculate commissions
    const results: EmployeeCommissionInfo[] = []

    for (const emp of allEmployees) {
      if (!emp.userId) continue
      const trainer = trainerByUserId.get(emp.userId)
      if (!trainer) continue

      const memberIds = (trainer.assignments ?? []).map((a) => a.memberId)
      const rate = Number(trainer.commissionRate ?? 0)

      let revenue = 0
      if (memberIds.length > 0) {
        const paymentSum = await db
          .select({ total: sum(membershipPayments.amount) })
          .from(membershipPayments)
          .where(
            and(
              inArray(membershipPayments.memberId, memberIds),
              gte(membershipPayments.paymentDate, periodStart),
              lte(membershipPayments.paymentDate, periodEnd),
            ),
          )
        revenue = Number(paymentSum[0]?.total ?? 0)
      }

      const commissionAmount = (revenue * rate) / 100

      // Check if this employee already has commission bonuses for this period
      const existingBonuses = await db
        .select()
        .from(employeeBonuses)
        .where(
          and(
            eq(employeeBonuses.employeeId, emp.id),
            eq(employeeBonuses.type, 'COMMISSION'),
            gte(employeeBonuses.date, periodStart),
            lte(employeeBonuses.date, periodEnd),
          ),
        )

      results.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        trainerId: trainer.id,
        commissionRate: rate,
        assignedMembers: memberIds.length,
        totalMembershipRevenue: revenue,
        commissionAmount,
        includedInPayroll: existingBonuses.length > 0,
      })
    }

    return results.sort((a, b) => b.commissionAmount - a.commissionAmount)
  })

// ── Create commission bonuses from trainer commissions ──

export const createCommissionBonuses = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({
      periodStart: dateString,
      periodEnd: dateString,
      employeeIds: z.array(z.string()).optional(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)

    // Get commissions for all employee-trainers
    const commissions = await getTrainerCommissionsForPeriod({
      data: { periodStart: data.periodStart, periodEnd: data.periodEnd },
    })

    // Filter by selected employee IDs if provided
    const toProcess = data.employeeIds
      ? commissions.filter((c) => data.employeeIds!.includes(c.employeeId))
      : commissions

    // Filter out already-included
    const toCreate = toProcess.filter((c) => !c.includedInPayroll && c.commissionAmount > 0)

    if (toCreate.length === 0) {
      return {
        created: 0,
        skipped: toProcess.filter((c) => c.includedInPayroll).length,
        message: 'No hay comisiones nuevas para generar en este período.',
      }
    }

    let createdCount = 0
    for (const item of toCreate) {
      await db.insert(employeeBonuses).values({
        employeeId: item.employeeId,
        amount: String(Math.round(item.commissionAmount * 100) / 100),
        reason: `Comisión entrenador (${item.commissionRate}%): $${item.totalMembershipRevenue.toLocaleString()} en membresías`,
        type: 'COMMISSION',
        date: periodEnd,
        status: 'APPROVED',
      })
      createdCount++
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'BONUS',
      entityId: 'bulk-commissions',
      description: `Generó ${createdCount} bonificaciones por comisiones de entrenadores (${data.periodStart} → ${data.periodEnd})`,
    })

    return {
      created: createdCount,
      skipped: toProcess.filter((c) => c.includedInPayroll).length,
      message: `Se crearon ${createdCount} bonificaciones por comisiones.`,
    }
  })

// ── Commission Dashboard ──

export const getCommissionsDashboard = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    // Get all commission bonuses
    const allCommissionBonuses = await db
      .select()
      .from(employeeBonuses)
      .where(eq(employeeBonuses.type, 'COMMISSION'))

    const totalPending = allCommissionBonuses
      .filter((b) => b.status !== 'PAID')
      .reduce((s, b) => s + Number(b.amount || 0), 0)
    const totalPaid = allCommissionBonuses
      .filter((b) => b.status === 'PAID')
      .reduce((s, b) => s + Number(b.amount || 0), 0)

    // Count employees with trainer profiles
    const allEmployees = await db.select().from(employees)
    const allTrainers = await db.query.trainerProfiles.findMany({
      where: eq(trainerProfiles.isActive, true),
    })
    const trainerUserIds = new Set(allTrainers.map((t) => t.userId).filter(Boolean))
    const trainersWithEmployee = allEmployees.filter((e) => e.userId && trainerUserIds.has(e.userId))

    return {
      totalPendingCommissions: totalPending,
      totalPaidCommissions: totalPaid,
      trainersWithCommissions: trainersWithEmployee.length,
      totalTrainers: allTrainers.length,
      totalCommissionBonuses: allCommissionBonuses.length,
    }
  })

// ── Get commission summary for a specific period (used by payroll) ──

const periodSchema = z.object({
  periodStart: dateString,
  periodEnd: dateString,
})

export const getCommissionSummary = createServerFn({ method: 'GET' })
  .validator((data: unknown) => periodSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)

    // Get commissions for period
    const commissions = await getTrainerCommissionsForPeriod({
      data: { periodStart: data.periodStart, periodEnd: data.periodEnd },
    })

    const totalRevenue = commissions.reduce((s, c) => s + c.totalMembershipRevenue, 0)
    const totalCommissions = commissions.reduce((s, c) => s + c.commissionAmount, 0)
    const totalEmployees = commissions.length
    const alreadyIncluded = commissions.filter((c) => c.includedInPayroll).length

    return {
      totalRevenue,
      totalCommissions,
      totalEmployees,
      alreadyIncluded,
      pendingEmployees: totalEmployees - alreadyIncluded,
      breakdown: commissions,
    }
  })

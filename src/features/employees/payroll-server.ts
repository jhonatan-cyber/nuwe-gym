import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { payroll } from '#/shared/db/schema/payroll.ts'
import { employeeBonuses } from '#/shared/db/schema/employee-bonuses.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'

// ── List payroll records ──

export const getPayrollRecords = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ employeeId: optionalString.default(''), status: optionalString.default('') }).parse(data),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'employees:read' } })

    const conditions = []
    if (data.employeeId) conditions.push(eq(payroll.employeeId, data.employeeId))
    if (data.status) conditions.push(eq(payroll.status, data.status))

    return await db.query.payroll.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { employee: true },
      orderBy: [desc(payroll.periodStart)],
    })
  })

// ── Generate payroll for a period ──

const generatePayrollSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  employeeIds: z.array(uuidField).optional(),
  includeCommissions: z.boolean().default(false),
})

export const generatePayroll = createServerFn({ method: 'POST' })
  .validator((data: unknown) => generatePayrollSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'employees:write' } })

    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)

    // Get employees
    let empList = await db
      .select()
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'))

    if (data.employeeIds && data.employeeIds.length > 0) {
      empList = empList.filter((e) => data.employeeIds!.includes(e.id))
    }

    // If including commissions, pre-calculate commission amounts for all trainer-employees
    let commissionMap = new Map<string, number>()
    if (data.includeCommissions) {
      const { getTrainerCommissionsForPeriod } = await import('./commission-server.ts')
      const periodCommissions = await getTrainerCommissionsForPeriod({
        data: { periodStart: data.periodStart, periodEnd: data.periodEnd },
      })
      for (const c of periodCommissions) {
        commissionMap.set(c.employeeId, c.commissionAmount)
      }
    }

    const results: { employeeId: string; fullName: string; netSalary: string; status: string }[] = []

    for (const emp of empList) {
      const baseSalary = Number(emp.baseSalary || 0)

      // Get bonuses for this period
      const bonuses = await db
        .select()
        .from(employeeBonuses)
        .where(
          and(
            eq(employeeBonuses.employeeId, emp.id),
            eq(employeeBonuses.status, 'APPROVED'),
            gte(employeeBonuses.date, periodStart),
            lte(employeeBonuses.date, periodEnd),
          ),
        )

      // Calculate bonuses total
      const bonusesTotal = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0)

      // Add commission amount if applicable
      const commissionAmount = commissionMap.get(emp.id) ?? 0
      const totalBonuses = bonusesTotal + commissionAmount

      // Deductions: 0 for now (future: social security, taxes, etc.)
      const deductionsTotal = 0
      const netSalary = baseSalary + totalBonuses - deductionsTotal

      // Check if payroll already exists for this period + employee
      const existing = await db
        .select()
        .from(payroll)
        .where(
          and(
            eq(payroll.employeeId, emp.id),
            eq(payroll.periodStart, periodStart),
          ),
        )

      if (existing.length > 0) {
        results.push({
          employeeId: emp.id,
          fullName: emp.fullName,
          netSalary: '0',
          status: 'YA_EXISTE',
        })
        continue
      }

      // If commissions are included AND there's a commission amount, also create a commission bonus
      if (data.includeCommissions && commissionAmount > 0) {
        await db.insert(employeeBonuses).values({
          employeeId: emp.id,
          amount: String(Math.round(commissionAmount * 100) / 100),
          reason: `Comisión entrenador (período ${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]})`,
          type: 'COMMISSION',
          date: periodEnd,
          status: 'APPROVED',
        })
      }

      // Build bonuses breakdown for the payroll record
      const allBonusItems = [
        ...bonuses.map((b) => ({ reason: b.reason, amount: b.amount, type: b.type })),
      ]
      if (commissionAmount > 0) {
        allBonusItems.push({
          reason: 'Comisión entrenador',
          amount: String(Math.round(commissionAmount * 100) / 100),
          type: 'COMMISSION',
        })
      }

      await db.insert(payroll).values({
        employeeId: emp.id,
        periodStart,
        periodEnd,
        baseSalary: String(baseSalary),
        bonusesTotal: String(totalBonuses),
        deductionsTotal: String(deductionsTotal),
        netSalary: String(netSalary),
        bonuses: allBonusItems,
        deductions: [],
        status: 'PENDING',
      })

      results.push({
        employeeId: emp.id,
        fullName: emp.fullName,
        netSalary: String(netSalary),
        status: 'CREATED',
      })
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PAYROLL',
      entityId: 'bulk',
      description: `Generó nómina para ${results.filter((r) => r.status === 'CREATED').length} empleados (${periodStart.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]})${data.includeCommissions ? ' + comisiones de entrenadores' : ''}`,
    })

    return results
  })

// ── Mark payroll as paid ──

const markPayrollPaidSchema = z.object({
  id: uuidField,
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHECK']).default('BANK_TRANSFER'),
  notes: optionalString.default(''),
})

export const markPayrollPaid = createServerFn({ method: 'POST' })
  .validator((data: unknown) => markPayrollPaidSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'employees:write' } })

    const [record] = await db
      .update(payroll)
      .set({
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(payroll.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'PAYROLL',
      entityId: record.id,
      description: `Marcó como pagada nómina de $${record.netSalary}`,
    })

    return record
  })

// ── Get payroll stats ──

export const getPayrollStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requirePermission({ data: { permission: 'employees:read' } })

  const all = await db.select().from(payroll)
  const pending = all.filter((r) => r.status === 'PENDING')
  const paid = all.filter((r) => r.status === 'PAID')

  return {
    total: all.length,
    pending: pending.length,
    paid: paid.length,
    pendingAmount: pending.reduce((s, r) => s + Number(r.netSalary || 0), 0),
    paidAmount: paid.reduce((s, r) => s + Number(r.netSalary || 0), 0),
  }
})

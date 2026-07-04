import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc, and, sql, count as drizzleCount } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { employeeVacations } from '#/shared/db/schema/employee-vacations.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'

// ── List vacations ──

export const getVacations = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ employeeId: optionalString.default('') }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const conditions = []
    if (data.employeeId) {
      conditions.push(eq(employeeVacations.employeeId, data.employeeId))
    }

    return await db.query.employeeVacations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { employee: true },
      orderBy: [desc(employeeVacations.createdAt)],
    })
  })

// ── Get available vacation days for an employee ──

export const getAvailableVacationDays = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ employeeId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    })
    if (!emp) return { total: 0, used: 0, available: 0, year: new Date().getFullYear() }

    const year = new Date().getFullYear()

    // Calculate total days: 15 base + 1 per year of service (max 30)
    const hireYear = new Date(emp.hireDate).getFullYear()
    const yearsOfService = Math.min(year - hireYear, 15) // max 15 years counted
    const total = Math.min(15 + yearsOfService, 30)

    // Calculate used days
    const [{ used }] = await db
      .select({ used: sql<number>`COALESCE(SUM(${employeeVacations.daysCount}), 0)` })
      .from(employeeVacations)
      .where(
        and(
          eq(employeeVacations.employeeId, data.employeeId),
          eq(employeeVacations.year, year),
          sql`${employeeVacations.status} IN ('APPROVED', 'PENDING')`,
        ),
      )

    return { total, used: Number(used), available: total - Number(used), year }
  })

// ── Request vacation ──

const requestVacationSchema = z.object({
  employeeId: uuidField,
  startDate: z.string(),
  endDate: z.string(),
  reason: optionalString.default(''),
})

export const requestVacation = createServerFn({ method: 'POST' })
  .validator((data: unknown) => requestVacationSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (daysCount <= 0) throw new Error('La fecha de fin debe ser posterior a la de inicio')

    // Check availability
    const available = await getAvailableVacationDays({
      data: { employeeId: data.employeeId },
    })
    if (daysCount > available.available) {
      throw new Error(
        `Días insuficientes: solicitó ${daysCount}, tiene ${available.available} disponibles`,
      )
    }

    const [vacation] = await db
      .insert(employeeVacations)
      .values({
        employeeId: data.employeeId,
        startDate: start,
        endDate: end,
        daysCount,
        year: start.getFullYear(),
        reason: data.reason,
        status: 'PENDING',
      })
      .returning()

    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'VACATION',
      entityId: vacation.id,
      description: `Solicitó vacaciones para ${emp?.fullName ?? data.employeeId}: ${daysCount} días desde ${data.startDate}`,
    })

    return vacation
  })

// ── Approve / Reject vacation ──

const approveRejectSchema = z.object({
  id: uuidField,
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: optionalString.default(''),
})

export const approveRejectVacation = createServerFn({ method: 'POST' })
  .validator((data: unknown) => approveRejectSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [vacation] = await db
      .update(employeeVacations)
      .set({
        status: data.status,
        approvedBy: session.user.id,
        approvedAt: data.status === 'APPROVED' ? new Date() : undefined,
        rejectionReason: data.status === 'REJECTED' ? data.rejectionReason : undefined,
        updatedAt: new Date(),
      })
      .where(eq(employeeVacations.id, data.id))
      .returning()

    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, vacation.employeeId),
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'VACATION',
      entityId: vacation.id,
      description: `${data.status === 'APPROVED' ? 'Aprobó' : 'Rechazó'} vacaciones de ${emp?.fullName ?? vacation.employeeId}`,
    })

    return vacation
  })

// ── Cancel vacation ──

export const cancelVacation = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [vacation] = await db
      .update(employeeVacations)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(employeeVacations.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'VACATION',
      entityId: vacation.id,
      description: `Canceló solicitud de vacaciones #${vacation.id}`,
    })

    return vacation
  })

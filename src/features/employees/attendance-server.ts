import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc, and, sql } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { employeeAttendance } from '#/shared/db/schema/employee-attendance.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'
import type { TodayAttendanceRow, AttendanceSummary } from './attendance-types.ts'

// ── Clock In ──

export const clockIn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ employeeId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Check if already clocked in today
    const existing = await db.query.employeeAttendance.findFirst({
      where: and(
        eq(employeeAttendance.employeeId, data.employeeId),
        eq(employeeAttendance.date, today),
      ),
    })

    if (existing) {
      if (!existing.clockOut) {
        throw new Error('El empleado ya marcó entrada hoy. Marcá salida primero.')
      }
      throw new Error('El empleado ya completó su registro de hoy.')
    }

    // Determine status based on time (after 9:15 AM = late)
    const hour = now.getHours()
    const minutes = now.getMinutes()
    const isLate = hour > 9 || (hour === 9 && minutes > 15)

    const [record] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: data.employeeId,
        date: today,
        clockIn: now,
        status: isLate ? 'LATE' : 'PRESENT',
      })
      .returning()

    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'ATTENDANCE',
      entityId: record.id,
      description: `Marcó entrada de empleado ${emp?.fullName ?? data.employeeId} (${isLate ? 'tardanza' : 'a tiempo'})`,
    })

    return record
  })

// ── Clock Out ──

export const clockOut = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({
      employeeId: uuidField,
      notes: optionalString.default(''),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const existing = await db.query.employeeAttendance.findFirst({
      where: and(
        eq(employeeAttendance.employeeId, data.employeeId),
        eq(employeeAttendance.date, today),
      ),
    })

    if (!existing) {
      throw new Error('El empleado no marcó entrada hoy.')
    }
    if (existing.clockOut) {
      throw new Error('El empleado ya marcó salida hoy.')
    }

    // Auto-detect early leave (before 18:00)
    const hour = now.getHours()
    const isEarlyLeave = hour < 18 && existing.status !== 'ABSENT_WITH_NOTICE'
    const status = isEarlyLeave ? 'EARLY_LEAVE' : existing.status

    const [record] = await db
      .update(employeeAttendance)
      .set({
        clockOut: now,
        status,
        notes: data.notes || existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(employeeAttendance.id, existing.id))
      .returning()

    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'ATTENDANCE',
      entityId: record.id,
      description: `Marcó salida de empleado ${emp?.fullName ?? data.employeeId}`,
    })

    return record
  })

// ── Force Clock Out (for admin) ──

export const forceClockOut = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({
      attendanceId: uuidField,
      notes: optionalString.default(''),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [record] = await db
      .update(employeeAttendance)
      .set({
        clockOut: new Date(),
        status: 'EARLY_LEAVE',
        notes: data.notes || 'Forzado por administrador',
        updatedAt: new Date(),
      })
      .where(eq(employeeAttendance.id, data.attendanceId))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'ATTENDANCE',
      entityId: record.id,
      description: `Forzó salida de registro #${record.id}`,
    })

    return record
  })

// ── Mark Absent ──

export const markAbsent = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({ employeeId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const existing = await db.query.employeeAttendance.findFirst({
      where: and(
        eq(employeeAttendance.employeeId, data.employeeId),
        eq(employeeAttendance.date, today),
      ),
    })

    if (existing) {
      throw new Error('El empleado ya tiene un registro hoy.')
    }

    const [record] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: data.employeeId,
        date: today,
        clockIn: now,
        status: 'ABSENT',
        notes: 'Ausente sin registro',
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'ATTENDANCE',
      entityId: record.id,
      description: `Marcó ausencia para empleado #${data.employeeId}`,
    })

    return record
  })

// ── Get Today's Attendance ──

export const getTodayAttendance = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const activeEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'))
      .orderBy(employees.fullName)

    const todayRecords = await db.query.employeeAttendance.findMany({
      where: and(
        eq(employeeAttendance.date, today),
      ),
    })

    const rows: TodayAttendanceRow[] = activeEmployees.map((emp) => {
      const record = todayRecords.find((r) => r.employeeId === emp.id)
      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        position: emp.position,
        department: emp.department,
        status: emp.status,
        clockIn: record?.clockIn?.toISOString() ?? null,
        clockOut: record?.clockOut?.toISOString() ?? null,
        attendanceId: record?.id ?? null,
        attendanceStatus: record?.status ?? null,
      }
    })

    // Calculate summary
    const summary: AttendanceSummary = {
      total: rows.length,
      present: rows.filter((r) => r.attendanceStatus === 'PRESENT').length,
      late: rows.filter((r) => r.attendanceStatus === 'LATE').length,
      absent: rows.filter(
        (r) => r.attendanceStatus === 'ABSENT' || r.attendanceStatus === 'ABSENT_WITH_NOTICE',
      ).length,
      notMarked: rows.filter((r) => !r.attendanceStatus).length,
    }

    return { rows, summary }
  },
)

// ── Get Employee Attendance History ──

export const getEmployeeAttendance = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({
      employeeId: uuidField,
      days: z.number().optional().default(30),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const since = new Date()
    since.setDate(since.getDate() - data.days)

    return await db.query.employeeAttendance.findMany({
      where: and(
        eq(employeeAttendance.employeeId, data.employeeId),
        sql`${employeeAttendance.date} >= ${since}`,
      ),
      orderBy: [desc(employeeAttendance.date)],
    })
  })

// ── Get Attendance Report ──

export const getAttendanceReport = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({
      days: z.number().optional().default(30),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const since = new Date()
    since.setDate(since.getDate() - data.days)

    const records = await db.query.employeeAttendance.findMany({
      where: sql`${employeeAttendance.date} >= ${since}`,
      orderBy: [desc(employeeAttendance.date)],
    })

    // Group by date
    const byDate = new Map<string, { present: number; late: number; absent: number; total: number }>()
    for (const r of records) {
      const dateKey = r.date.toISOString().split('T')[0]
      const entry = byDate.get(dateKey) ?? { present: 0, late: 0, absent: 0, total: 0 }
      entry.total++
      if (r.status === 'PRESENT') entry.present++
      else if (r.status === 'LATE') entry.late++
      else entry.absent++
      byDate.set(dateKey, entry)
    }

    const totalActive = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'))
      .then((r) => r[0]?.count ?? 0)

    return {
      daily: Array.from(byDate.entries()).map(([date, stats]) => ({
        date,
        ...stats,
        notMarked: totalActive - stats.total,
      })),
      totals: {
        present: records.filter((r) => r.status === 'PRESENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        absent: records.filter((r) => r.status === 'ABSENT' || r.status === 'ABSENT_WITH_NOTICE').length,
        earlyLeave: records.filter((r) => r.status === 'EARLY_LEAVE').length,
        total: records.length,
      },
    }
  })

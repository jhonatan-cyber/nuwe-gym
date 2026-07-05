import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, asc, and } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { employeeSchedules } from '#/shared/db/schema/employee-schedules.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { uuidField } from '#/shared/lib/schemas.ts'
import type { EmployeeWithSchedule, ScheduleSlot } from './schedule-types.ts'

// ── Get all active employees with their schedules ──

export const getWeeklySchedule = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'employees:read' } })

    const activeEmployees = await db.query.employees.findMany({
      where: eq(employees.status, 'ACTIVE'),
      orderBy: [asc(employees.fullName)],
      with: { department: true },
    })

    const allSchedules = await db.query.employeeSchedules.findMany({
      where: eq(employeeSchedules.isActive, true),
    })

    return activeEmployees.map((emp) => {
      const schedules = allSchedules
        .filter((s) => s.employeeId === emp.id)
        .map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          scheduleType: s.scheduleType as ScheduleSlot['scheduleType'],
        }))

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        position: emp.position,
        department: emp.department?.name ?? null,
        schedules,
      } satisfies EmployeeWithSchedule
    })
  },
)

// ── Get schedules for a single employee ──

export const getEmployeeSchedules = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ employeeId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'employees:read' } })
    return await db.query.employeeSchedules.findMany({
      where: and(
        eq(employeeSchedules.employeeId, data.employeeId),
        eq(employeeSchedules.isActive, true),
      ),
      orderBy: [asc(employeeSchedules.dayOfWeek), asc(employeeSchedules.startTime)],
    })
  })

// ── Set schedules for an employee (replaces all) ──

const slotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:mm'),
  scheduleType: z.enum(['REGULAR', 'ROTATING']).default('REGULAR'),
})

const setEmployeeSchedulesSchema = z.object({
  employeeId: uuidField,
  slots: z.array(slotSchema),
})

export const setEmployeeSchedules = createServerFn({ method: 'POST' })
  .validator((data: unknown) => setEmployeeSchedulesSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'employees:write' } })

    // Detect conflicts
    const conflicts: string[] = []
    for (let i = 0; i < data.slots.length; i++) {
      for (let j = i + 1; j < data.slots.length; j++) {
        const a = data.slots[i]
        const b = data.slots[j]
        if (a.dayOfWeek !== b.dayOfWeek) continue
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
          conflicts.push(
            `Conflicto en ${dayNames[a.dayOfWeek]}: ${a.startTime}-${a.endTime} con ${b.startTime}-${b.endTime}`,
          )
        }
      }
    }

    // Replace all schedules (transactional)
    await db.transaction(async (tx) => {
      await tx
        .delete(employeeSchedules)
        .where(eq(employeeSchedules.employeeId, data.employeeId))

      if (data.slots.length > 0) {
        await tx.insert(employeeSchedules).values(
          data.slots.map((s) => ({
            employeeId: data.employeeId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            scheduleType: s.scheduleType,
          })),
        )
      }
    })

    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'SCHEDULE',
      entityId: data.employeeId,
      description: `Actualizó horarios de empleado ${emp?.fullName ?? data.employeeId}${conflicts.length > 0 ? ` (⚠️ ${conflicts.length} conflicto(s))` : ''}`,
    })

    return {
      saved: data.slots.length,
      conflicts,
    }
  })

// ── Get conflict report across all employees ──

export const getScheduleConflicts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'employees:read' } })

    const all = await db.query.employeeSchedules.findMany({
      where: eq(employeeSchedules.isActive, true),
      with: { employee: true },
    })

    // Group by day and time, find overlaps
    const byDay = new Map<number, typeof all>()
    for (const s of all) {
      const day = s.dayOfWeek
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(s)
    }

    const conflicts: { dayOfWeek: number; employee1: string; employee2: string; startTime: string; endTime: string }[] = []
    for (const [day, schedules] of byDay) {
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const a = schedules[i]
          const b = schedules[j]
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            conflicts.push({
              dayOfWeek: day,
              employee1: a.employee?.fullName ?? '?',
              employee2: b.employee?.fullName ?? '?',
              startTime: a.startTime < b.startTime ? a.startTime : b.startTime,
              endTime: a.endTime > b.endTime ? a.endTime : b.endTime,
            })
          }
        }
      }
    }

    return conflicts
  },
)

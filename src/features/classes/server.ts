import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import {
  classes,
  classSchedules,
  classBookings,
} from '#/shared/db/schema/classes.ts'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getClasses = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return await db.query.classes.findMany({
      with: { schedules: true },
      orderBy: [desc(classes.createdAt)],
    })
  },
)

export const getClass = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return await db.query.classes.findFirst({
      where: eq(classes.id, data.id),
      with: { schedules: true },
    })
  })

const createClassSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  capacity: z.number().min(1),
})

export const createClass = createServerFn({ method: 'POST' })
  .inputValidator((data) => createClassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const [classItem] = await db
      .insert(classes)
      .values({
        name: data.name,
        description: data.description,
        color: data.color,
        capacity: data.capacity,
      })
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CLASS',
      entityId: classItem.id,
      description: `Creó clase ${classItem.name}`,
    })
    return classItem
  })

const updateClassSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  capacity: z.number().min(1),
})

export const updateClass = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateClassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const [classItem] = await db
      .update(classes)
      .set({
        name: data.name,
        description: data.description,
        color: data.color,
        capacity: data.capacity,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'CLASS',
      entityId: classItem.id,
      description: `Actualizó clase ${classItem.name}`,
    })
    return classItem
  })

const deleteClassSchema = z.object({ id: z.number() })

export const deleteClass = createServerFn({ method: 'POST' })
  .inputValidator((data) => deleteClassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    await db.delete(classes).where(eq(classes.id, data.id))
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'CLASS',
      entityId: data.id,
      description: `Eliminó clase #${data.id}`,
    })
    return { success: true }
  })

const addScheduleSchema = z.object({
  classId: z.number(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
})

export const addSchedule = createServerFn({ method: 'POST' })
  .inputValidator((data) => addScheduleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const [schedule] = await db
      .insert(classSchedules)
      .values({
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      })
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'SCHEDULE',
      entityId: schedule.id,
      description: `Agregó horario a clase #${data.classId}`,
    })
    return schedule
  })

const removeScheduleSchema = z.object({ id: z.number() })

export const removeSchedule = createServerFn({ method: 'POST' })
  .inputValidator((data) => removeScheduleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    await db.delete(classSchedules).where(eq(classSchedules.id, data.id))
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'SCHEDULE',
      entityId: data.id,
      description: `Eliminó horario #${data.id}`,
    })
    return { success: true }
  })

const getBookingsSchema = z.object({
  classId: z.number().optional(),
  status: z.string().optional(),
})

export const getBookings = createServerFn({ method: 'GET' })
  .inputValidator((data) => getBookingsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const conditions = []

    if (data.classId) {
      const scheduleRows = await db
        .select({ id: classSchedules.id })
        .from(classSchedules)
        .where(eq(classSchedules.classId, data.classId))
      if (scheduleRows.length > 0) {
        conditions.push(
          inArray(
            classBookings.classScheduleId,
            scheduleRows.map((r) => r.id),
          ),
        )
      }
    }
    if (data.status) {
      conditions.push(
        eq(
          classBookings.status,
          data.status as (typeof classBookings.status.enumValues)[number],
        ),
      )
    }

    return await db.query.classBookings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        schedule: {
          with: { class: true },
        },
        member: true,
      },
      orderBy: [desc(classBookings.bookedAt)],
    })
  })

const createBookingSchema = z.object({
  classScheduleId: z.number(),
  memberId: z.number(),
})

export const createBooking = createServerFn({ method: 'POST' })
  .inputValidator((data) => createBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const schedule = await db.query.classSchedules.findFirst({
      where: eq(classSchedules.id, data.classScheduleId),
      with: { class: true },
    })
    if (!schedule) throw new Error('Horario no encontrado')

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(classBookings)
      .where(
        and(
          eq(classBookings.classScheduleId, data.classScheduleId),
          eq(classBookings.status, 'CONFIRMED'),
        ),
      )

    if (Number(count) >= schedule.class.capacity) {
      throw new Error('La clase está llena')
    }

    const [booking] = await db
      .insert(classBookings)
      .values({
        classScheduleId: data.classScheduleId,
        memberId: data.memberId,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Reservó clase para socio #${data.memberId}`,
    })

    return booking
  })

const cancelBookingSchema = z.object({ id: z.number() })

export const cancelBooking = createServerFn({ method: 'POST' })
  .inputValidator((data) => cancelBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const [booking] = await db
      .update(classBookings)
      .set({ status: 'CANCELLED' })
      .where(eq(classBookings.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Canceló reserva #${booking.id}`,
    })
    return booking
  })

const markAttendanceSchema = z.object({ id: z.number() })

export const markAttendance = createServerFn({ method: 'POST' })
  .inputValidator((data) => markAttendanceSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })
    const [booking] = await db
      .update(classBookings)
      .set({ status: 'ATTENDED' })
      .where(eq(classBookings.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Marcó asistencia a reserva #${booking.id}`,
    })
    return booking
  })

export const getWeeklySchedule = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return await db.query.classSchedules.findMany({
      where: eq(classSchedules.isActive, true),
      with: { class: true },
      orderBy: [classSchedules.dayOfWeek, classSchedules.startTime],
    })
  },
)

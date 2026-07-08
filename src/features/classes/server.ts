import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import {
  classes,
  classSchedules,
  classBookings,
} from '#/shared/db/schema/classes.ts'
import { classWaitlist } from '#/shared/db/schema/class-waitlist.ts'
import { eq, desc, and, inArray, sql, SQL, asc } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, dayOfWeek, optionalString, positiveIntMin1, requiredString, timeString, uuidField } from '#/shared/lib/schemas.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { packageBenefits } from '#/shared/db/schema/packages.ts'

export const getClasses = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      branchId: z.string().uuid().optional(),
      trainerId: z.string().uuid().optional(),
    }).optional(),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'classes:read' } })

    // Si se filtra por trainerId, buscar clases que tengan horarios con ese trainer
    if (data?.trainerId) {
      const scheduleRows = await db
        .select({ classId: classSchedules.classId })
        .from(classSchedules)
        .where(
          and(
            eq(classSchedules.trainerId, data.trainerId),
            eq(classSchedules.isActive, true),
          ),
        )
      const classIds = [...new Set(scheduleRows.map((r) => r.classId))]
      if (classIds.length === 0) return []
      return await db.query.classes.findMany({
        where: and(
          data?.branchId ? eq(classes.branchId, data.branchId) : undefined,
          inArray(classes.id, classIds),
        ),
        with: {
          schedules: {
            with: {
              trainer: { with: { user: true } },
            },
          },
        },
        orderBy: [desc(classes.createdAt)],
      })
    }

    return await db.query.classes.findMany({
      where: data?.branchId ? eq(classes.branchId, data.branchId) : undefined,
      with: {
        schedules: {
          with: {
            trainer: { with: { user: true } },
          },
        },
      },
      orderBy: [desc(classes.createdAt)],
    })
  })

export const getClass = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'classes:read' } })
    return await db.query.classes.findFirst({
      where: eq(classes.id, data.id),
      with: {
        schedules: {
          with: {
            trainer: {
              with: { user: true },
            },
          },
        },
      },
    })
  })

const createClassSchema = z.object({
  name: requiredString,
  description: optionalString,
  category: optionalString,
  color: optionalString,
  capacity: positiveIntMin1,
  branchId: branchIdField,
})

export const createClass = createServerFn({ method: 'POST' })
  .validator((data) => createClassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
    })
    const [classItem] = await db
      .insert(classes)
      .values({
        name: data.name,
        description: data.description,
        category: data.category,
        color: data.color,
        capacity: data.capacity,
        branchId: data.branchId ?? null,
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
  id: uuidField,
  name: requiredString,
  description: optionalString,
  category: optionalString,
  color: optionalString,
  capacity: positiveIntMin1,
})

export const updateClass = createServerFn({ method: 'POST' })
  .validator((data) => updateClassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
    })
    const [classItem] = await db
      .update(classes)
      .set({
        name: data.name,
        description: data.description,
        category: data.category,
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

const deleteClassSchema = z.object({ id: uuidField })

export const deleteClass = createServerFn({ method: 'POST' })
  .validator((data) => deleteClassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'classes:write' } })
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
  classId: uuidField,
  dayOfWeek: dayOfWeek,
  startTime: timeString,
  endTime: timeString,
  room: optionalString,
  trainerId: z.string().uuid().optional(),
})

export const addSchedule = createServerFn({ method: 'POST' })
  .validator((data) => addScheduleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
    })
    const [schedule] = await db
      .insert(classSchedules)
      .values({
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        trainerId: data.trainerId ?? null,
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

const removeScheduleSchema = z.object({ id: uuidField })

export const removeSchedule = createServerFn({ method: 'POST' })
  .validator((data) => removeScheduleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
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
  classId: z.string().uuid().optional(),
  status: optionalString,
})

export const getBookings = createServerFn({ method: 'GET' })
  .validator((data) => getBookingsSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'classes:read' } })
    const conditions: SQL[] = []

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
          with: {
            class: true,
            trainer: {
              with: { user: true },
            },
          },
        },
        member: true,
      },
      orderBy: [desc(classBookings.bookedAt)],
    })
  })

const createBookingSchema = z.object({
  classScheduleId: uuidField,
  memberId: uuidField,
})

export const createBooking = createServerFn({ method: 'POST' })
  .validator((data) => createBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
    })

    const schedule = await db.query.classSchedules.findFirst({
      where: eq(classSchedules.id, data.classScheduleId),
      with: { class: true },
    })
    if (!schedule) throw new Error('Horario no encontrado')

    // Validar que el socio tenga un paquete activo con beneficio 'classes'
    const activeSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.memberId, data.memberId),
        eq(subscriptions.status, 'ACTIVE'),
      ),
    })
    if (!activeSubscription) {
      throw new Error('El socio no tiene una suscripción activa')
    }
    if (activeSubscription.packageId) {
      const hasClassesBenefit = await db.query.packageBenefits.findFirst({
        where: and(
          eq(packageBenefits.packageId, activeSubscription.packageId),
          eq(packageBenefits.benefitKey, 'classes'),
          eq(packageBenefits.enabled, true),
        ),
      })
      if (!hasClassesBenefit) {
        throw new Error(
          'Tu paquete no incluye clases grupales. Actualizá tu plan para acceder.',
        )
      }
    }

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

const cancelBookingSchema = z.object({ id: uuidField })

export const cancelBooking = createServerFn({ method: 'POST' })
  .validator((data) => cancelBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
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

    // Intentar promover al primero de la lista de espera
    await promoteFromWaitlist({
      data: { classScheduleId: booking.classScheduleId },
    }).catch(() => {/* no-op si falla la promoción */})

    return booking
  })

const markAttendanceSchema = z.object({ id: uuidField })

export const markAttendance = createServerFn({ method: 'POST' })
  .validator((data) => markAttendanceSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'classes:write' },
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

export const getWeeklySchedule = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      branchId: z.string().uuid().optional(),
      trainerId: z.string().uuid().optional(),
    }).optional(),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'classes:read' } })

    const whereConditions = [eq(classSchedules.isActive, true)]
    if (data?.trainerId) {
      whereConditions.push(eq(classSchedules.trainerId, data.trainerId))
    }

    const schedules = await db.query.classSchedules.findMany({
      where: and(...whereConditions),
      with: {
        class: true,
        trainer: {
          with: { user: true },
        },
      },
      orderBy: [classSchedules.dayOfWeek, classSchedules.startTime],
    })

    return data?.branchId
      ? schedules.filter((s) => s.class.branchId === data.branchId)
      : schedules
  })

// ── Lista de espera ───────────────────────────────────────────────

export const getWaitlist = createServerFn({ method: 'GET' })
  .validator(z.object({ classScheduleId: uuidField }))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'classes:read' } })
    return await db.query.classWaitlist.findMany({
      where: eq(classWaitlist.classScheduleId, data.classScheduleId),
      orderBy: [asc(classWaitlist.addedAt)],
      with: { member: true },
    })
  })

const addToWaitlistSchema = z.object({
  classScheduleId: uuidField,
  memberId: uuidField,
})

export const addToWaitlist = createServerFn({ method: 'POST' })
  .validator((data) => addToWaitlistSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'classes:write' } })

    // Verificar que la clase esté llena (sólo se puede agregar a lista de espera si está llena)
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

    if (Number(count) < schedule.class.capacity) {
      throw new Error(
        'La clase tiene cupos disponibles. Podés reservar directamente.',
      )
    }

    const [entry] = await db
      .insert(classWaitlist)
      .values({
        classScheduleId: data.classScheduleId,
        memberId: data.memberId,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'WAITLIST',
      entityId: entry.id,
      description: `Agregó socio ${data.memberId} a lista de espera del horario ${data.classScheduleId}`,
    })

    return entry
  })

const removeFromWaitlistSchema = z.object({ id: uuidField })

export const removeFromWaitlist = createServerFn({ method: 'POST' })
  .validator((data) => removeFromWaitlistSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'classes:write' } })
    const [entry] = await db
      .delete(classWaitlist)
      .where(eq(classWaitlist.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'WAITLIST',
      entityId: data.id,
      description: `Eliminó socio de lista de espera #${data.id}`,
    })
    return entry
  })

/**
 * Cuando se cancela una reserva, promueve automáticamente al primero
 * de la lista de espera (si existe) creando una nueva reserva CONFIRMED.
 * Retorna el nuevo booking o null si la lista estaba vacía.
 */
export const promoteFromWaitlist = createServerFn({ method: 'POST' })
  .validator(z.object({ classScheduleId: uuidField }))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'classes:write' } })

    const next = await db.query.classWaitlist.findFirst({
      where: eq(classWaitlist.classScheduleId, data.classScheduleId),
      orderBy: [asc(classWaitlist.addedAt)],
    })

    if (!next) return null

    // Verificar que aún haya cupo (pueden haber cancelado sin llamar a este fn)
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

    if (Number(count) >= schedule.class.capacity) return null

    // Crear reserva para el primero de la lista
    const [booking] = await db
      .insert(classBookings)
      .values({ classScheduleId: data.classScheduleId, memberId: next.memberId })
      .returning()

    // Eliminar de la lista de espera
    await db.delete(classWaitlist).where(eq(classWaitlist.id, next.id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'BOOKING',
      entityId: booking.id,
      description: `Promovió socio ${next.memberId} de lista de espera a reserva confirmada`,
    })

    return booking
  })

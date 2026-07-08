import { type InferSelectModel } from 'drizzle-orm'
import { classes, classSchedules, classBookings } from '#/shared/db/schema/classes.ts'
import { classWaitlist } from '#/shared/db/schema/class-waitlist.ts'
import { type bookingStatusEnum } from '#/shared/db/schema/enums.ts'

// ── DB entity types ────────────────────────────────────────────
export type Class = InferSelectModel<typeof classes>
export type ClassSchedule = InferSelectModel<typeof classSchedules>
export type ClassBooking = InferSelectModel<typeof classBookings>
export type ClassWaitlist = InferSelectModel<typeof classWaitlist>

// ── Enums ──────────────────────────────────────────────────────
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number]

// ── Joined types (for queries with relations) ──────────────────
export type ClassWithSchedules = Class & {
  schedules: ClassSchedule[]
}

export type ClassScheduleWithClass = ClassSchedule & {
  class: Class
}

export type ClassScheduleWithDetails = ClassSchedule & {
  class: Class
  trainer?: {
    id: string
    userId: string
    specialty: string | null
    user: { name: string; email: string }
  } | null
}

export type ClassBookingWithDetails = ClassBooking & {
  schedule: ClassScheduleWithClass
  member: {
    id: string
    firstName: string
    lastName: string
    dni: string | null
  }
}

export type ClassWaitlistWithMember = ClassWaitlist & {
  member: {
    id: string
    firstName: string
    lastName: string
    dni: string | null
  }
}

// ── Form types ─────────────────────────────────────────────────
export type CreateClassInput = {
  name: string
  description?: string
  category?: string
  color?: string
  capacity: number
  branchId?: string
}

export type UpdateClassInput = {
  id: string
  name: string
  description?: string
  category?: string
  color?: string
  capacity: number
}

export type AddScheduleInput = {
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
  trainerId?: string
}

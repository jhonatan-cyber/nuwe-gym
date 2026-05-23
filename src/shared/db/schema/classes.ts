import { pgTable, serial, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { bookingStatusEnum } from './enums.ts'
import { members } from './members.ts'

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#3b82f6'),
  capacity: integer('capacity').notNull().default(20),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
})

export const classSchedules = pgTable('class_schedules', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  room: text('room'),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => [
  index('class_schedules_class_id_idx').on(table.classId),
])

export const classBookings = pgTable('class_bookings', {
  id: serial('id').primaryKey(),
  classScheduleId: integer('class_schedule_id').notNull().references(() => classSchedules.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').notNull().references(() => members.id),
  bookedAt: timestamp('booked_at').notNull().defaultNow(),
  status: bookingStatusEnum('status').notNull().default('CONFIRMED'),
}, (table) => [
  index('class_bookings_class_schedule_id_idx').on(table.classScheduleId),
  index('class_bookings_member_id_idx').on(table.memberId),
])

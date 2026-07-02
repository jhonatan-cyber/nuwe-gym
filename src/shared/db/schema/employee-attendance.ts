import {
  uuid,
  pgTable,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'

export const employeeAttendance = pgTable(
  'employee_attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    date: timestamp('date', { mode: 'date' }).notNull(),
    clockIn: timestamp('clock_in', { mode: 'date' }).notNull(),
    clockOut: timestamp('clock_out', { mode: 'date' }),
    status: text('status').notNull().default('PRESENT'),
    notes: text('notes').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('attendance_employee_date_idx').on(table.employeeId, table.date),
    index('attendance_date_idx').on(table.date),
  ],
)

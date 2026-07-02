import {
  uuid,
  pgTable,
  integer,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'

export const employeeSchedules = pgTable(
  'employee_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    scheduleType: text('schedule_type').notNull().default('REGULAR'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('emp_schedules_employee_id_idx').on(table.employeeId),
    index('emp_schedules_day_idx').on(table.dayOfWeek),
  ],
)

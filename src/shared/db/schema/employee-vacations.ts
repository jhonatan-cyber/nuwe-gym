import {
  uuid,
  pgTable,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'

export const employeeVacations = pgTable(
  'employee_vacations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    daysCount: integer('days_count').notNull(),
    year: integer('year').notNull(),
    reason: text('reason').default(''),
    status: text('status').notNull().default('PENDING'),
    approvedBy: text('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('vacations_employee_id_idx').on(table.employeeId),
    index('vacations_year_idx').on(table.year),
    index('vacations_status_idx').on(table.status),
  ],
)

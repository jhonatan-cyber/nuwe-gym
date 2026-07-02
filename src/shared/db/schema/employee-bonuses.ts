import {
  uuid,
  pgTable,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'

export const employeeBonuses = pgTable(
  'employee_bonuses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    amount: text('amount').notNull().default('0'),
    reason: text('reason').notNull().default(''),
    type: text('type').notNull().default('OTHER'),
    date: timestamp('date').notNull().defaultNow(),
    status: text('status').notNull().default('APPROVED'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('bonuses_employee_id_idx').on(table.employeeId),
    index('bonuses_status_idx').on(table.status),
    index('bonuses_date_idx').on(table.date),
  ],
)

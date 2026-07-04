import {
  uuid,
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'

export type PayrollItem = {
  reason: string
  amount: string
  type: string
}

export const payroll = pgTable(
  'payroll',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    baseSalary: text('base_salary').notNull().default('0'),
    bonusesTotal: text('bonuses_total').notNull().default('0'),
    deductionsTotal: text('deductions_total').notNull().default('0'),
    netSalary: text('net_salary').notNull().default('0'),
    bonuses: jsonb('bonuses').$type<PayrollItem[]>().default([]),
    deductions: jsonb('deductions').$type<PayrollItem[]>().default([]),
    status: text('status').notNull().default('PENDING'),
    paymentDate: timestamp('payment_date'),
    paymentMethod: text('payment_method').default('BANK_TRANSFER'),
    notes: text('notes').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('payroll_employee_id_idx').on(table.employeeId),
    index('payroll_status_idx').on(table.status),
    index('payroll_period_idx').on(table.periodStart, table.periodEnd),
  ],
)

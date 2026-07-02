import {
  uuid,
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'

export const employeeContracts = pgTable(
  'employee_contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    contractType: text('contract_type').notNull().default('INDEFINITE'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    position: text('position').notNull().default(''),
    salary: text('salary').default('0'),
    workingHours: text('working_hours').default(''),
    benefits: text('benefits').default(''),
    terms: text('terms').default(''),
    fileUrl: text('file_url').default(''),
    fileName: text('file_name').default(''),
    isActive: boolean('is_active').default(true),
    signedByEmployee: boolean('signed_by_employee').default(false),
    signedByEmployer: boolean('signed_by_employer').default(false),
    notes: text('notes').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('employee_contracts_employee_id_idx').on(table.employeeId),
  ],
)

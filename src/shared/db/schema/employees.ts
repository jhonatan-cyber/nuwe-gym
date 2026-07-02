import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './auth.ts'
import { branches } from './branches.ts'

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references(() => branches.id),
    employeeCode: text('employee_code').notNull().unique(),
    fullName: text('full_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    documentNumber: text('document_number'),
    position: text('position').notNull(),
    department: text('department').default(''),
    status: text('status').notNull().default('ACTIVE'),
    hireDate: timestamp('hire_date').notNull(),
    terminationDate: timestamp('termination_date'),
    baseSalary: text('base_salary').default('0'),
    paymentFrequency: text('payment_frequency').default('MONTHLY'),
    bankName: text('bank_name').default(''),
    bankAccountNumber: text('bank_account_number').default(''),
    emergencyContactName: text('emergency_contact_name').default(''),
    emergencyContactPhone: text('emergency_contact_phone').default(''),
    emergencyContactRelation: text('emergency_contact_relation').default(''),
    notes: text('notes').default(''),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('employees_branch_id_idx').on(table.branchId),
    index('employees_status_idx').on(table.status),
  ],
)

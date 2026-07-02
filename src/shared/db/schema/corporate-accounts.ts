import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { branches } from './branches.ts'

export const corporateAccounts = pgTable('corporate_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: text('company_name').notNull(),
  taxId: text('tax_id'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  contactPerson: text('contact_person'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  branchId: uuid('branch_id').references(() => branches.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

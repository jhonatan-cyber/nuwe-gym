import {
  uuid,
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { users } from './auth.ts'
import { branches } from './branches.ts'

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceNumber: text('invoice_number').notNull(),
    sourceType: text('source_type', { enum: ['MEMBERSHIP_PAYMENT', 'SALE'] }).notNull(),
    sourceId: uuid('source_id').notNull(),
    memberId: uuid('member_id').references(() => members.id),
    customerName: text('customer_name'),
    customerDocNumber: text('customer_doc_number'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
    status: text('status', { enum: ['ISSUED', 'CANCELED'] }).notNull().default('ISSUED'),
    branchId: uuid('branch_id').references(() => branches.id),
    createdByUserId: text('created_by_user_id'),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('invoices_invoice_number_idx').on(table.invoiceNumber),
    index('invoices_source_idx').on(table.sourceType, table.sourceId),
    index('invoices_member_id_idx').on(table.memberId),
    index('invoices_branch_id_idx').on(table.branchId),
    index('invoices_issued_at_idx').on(table.issuedAt),
    index('invoices_created_at_idx').on(table.createdAt),
  ],
)

/**
 * Counter table to track sequential invoice numbers per branch.
 * The counter is incremented atomically in a transaction.
 */
export const invoiceSequences = pgTable('invoice_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id')
    .references(() => branches.id),
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

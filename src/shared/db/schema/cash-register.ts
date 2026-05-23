import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
} from 'drizzle-orm/pg-core'
import {
  cashSessionStatusEnum,
  cashMovementTypeEnum,
  cashSourceTypeEnum,
  paymentMethodEnum,
} from './enums.ts'
import { users } from './auth.ts'

export const cashRegisterSessions = pgTable('cash_register_sessions', {
  id: serial('id').primaryKey(),
  openedByUserId: text('opened_by_user_id')
    .notNull()
    .references(() => users.id),
  closedByUserId: text('closed_by_user_id').references(() => users.id),
  openingAmount: numeric('opening_amount', {
    precision: 10,
    scale: 2,
  }).notNull(),
  expectedClosingAmount: numeric('expected_closing_amount', {
    precision: 10,
    scale: 2,
  }),
  actualClosingAmount: numeric('actual_closing_amount', {
    precision: 10,
    scale: 2,
  }),
  difference: numeric('difference', { precision: 10, scale: 2 }),
  openedAt: timestamp('opened_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
  status: cashSessionStatusEnum('status').notNull().default('OPEN'),
  notes: text('notes'),
  branchId: integer('branch_id'),
})

export const cashMovements = pgTable('cash_movements', {
  id: serial('id').primaryKey(),
  cashSessionId: integer('cash_session_id')
    .notNull()
    .references(() => cashRegisterSessions.id, { onDelete: 'cascade' }),
  movementType: cashMovementTypeEnum('movement_type').notNull(),
  sourceType: cashSourceTypeEnum('source_type').notNull(),
  sourceId: integer('source_id'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

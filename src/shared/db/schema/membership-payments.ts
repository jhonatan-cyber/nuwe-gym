import {
  uuid,
  pgTable,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { paymentMethodEnum } from './enums.ts'
import { members } from './members.ts'
import { subscriptions } from './subscriptions.ts'
import { users } from './auth.ts'

export const membershipPayments = pgTable(
  'membership_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentDate: timestamp('payment_date').notNull().defaultNow(),
    notes: text('notes'),
    cashSessionId: uuid('cash_session_id'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('membership_payments_member_id_idx').on(table.memberId),
    index('membership_payments_subscription_id_idx').on(table.subscriptionId),
    index('membership_payments_cash_session_id_idx').on(table.cashSessionId),
    index('membership_payments_created_by_user_id_idx').on(
      table.createdByUserId,
    ),
    index('membership_payments_payment_date_idx').on(table.paymentDate),
    index('membership_payments_created_at_idx').on(table.createdAt),
  ],
)

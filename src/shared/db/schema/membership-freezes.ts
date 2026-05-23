import { pgTable, serial, integer, text, timestamp, index } from 'drizzle-orm/pg-core'
import { subscriptions } from './subscriptions.ts'
import { members } from './members.ts'

export const membershipFreezes = pgTable('membership_freezes', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id')
    .notNull()
    .references(() => subscriptions.id),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason').default(''),
  resumedAt: timestamp('resumed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by'),
}, (table) => [
  index('membership_freezes_subscription_id_idx').on(table.subscriptionId),
  index('membership_freezes_member_id_idx').on(table.memberId),
])

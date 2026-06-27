import { uuid, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { subscriptions } from './subscriptions.ts'
import { members } from './members.ts'

export const membershipFreezes = pgTable(
  'membership_freezes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    reason: text('reason').default(''),
    resumedAt: timestamp('resumed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    createdBy: text('created_by'),
  },
  (table) => [
    index('membership_freezes_subscription_id_idx').on(table.subscriptionId),
    index('membership_freezes_member_id_idx').on(table.memberId),
  ],
)

import { uuid, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth.ts'

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    deviceInfo: text('device_info').default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('push_subscriptions_user_id_idx').on(table.userId),
    index('push_subscriptions_token_idx').on(table.token),
  ],
)

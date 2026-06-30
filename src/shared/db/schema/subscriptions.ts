import { uuid, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { subscriptionStatusEnum } from './enums.ts'
import { members } from './members.ts'
import { packages } from './packages.ts'

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    packageId: uuid('package_id').references(() => packages.id),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('ACTIVE'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('subscriptions_member_id_idx').on(table.memberId),
    index('subscriptions_package_id_idx').on(table.packageId),
    index('subscriptions_start_date_idx').on(table.startDate),
    index('subscriptions_end_date_idx').on(table.endDate),
    index('subscriptions_created_at_idx').on(table.createdAt),
    index('subscriptions_updated_at_idx').on(table.updatedAt),
  ],
)

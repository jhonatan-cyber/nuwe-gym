import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './auth.ts'

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    address: text('address').default(''),
    phone: text('phone').default(''),
    email: text('email').default(''),
    isActive: boolean('is_active').default(true),
    openingTime: text('opening_time').default('08:00'),
    closingTime: text('closing_time').default('22:00'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('branches_is_active_idx').on(table.isActive)],
)

export const userBranches = pgTable('user_branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),
  isDefault: boolean('is_default').default(false),
})

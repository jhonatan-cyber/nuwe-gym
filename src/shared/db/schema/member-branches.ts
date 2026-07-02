import { uuid, pgTable, timestamp, unique } from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { branches } from './branches.ts'

export const memberBranches = pgTable(
  'member_branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.memberId, table.branchId)],
)

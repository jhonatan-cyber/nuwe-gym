import { uuid, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { checkInResultEnum } from './enums.ts'
import { members } from './members.ts'
import { users } from './auth.ts'

export const checkIns = pgTable(
  'check_ins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    checkedInAt: timestamp('checked_in_at').notNull().defaultNow(),
    registeredByUserId: text('registered_by_user_id')
      .notNull()
      .references(() => users.id),
    resultStatus: checkInResultEnum('result_status').notNull(),
    notes: text('notes'),
    branchId: uuid('branch_id'),
  },
  (table) => [
    index('check_ins_member_id_idx').on(table.memberId),
    index('check_ins_registered_by_user_id_idx').on(table.registeredByUserId),
    index('check_ins_checked_in_at_idx').on(table.checkedInAt),
  ],
)

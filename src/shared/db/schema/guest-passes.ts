import {
  uuid,
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { users } from './auth.ts'

export const guestPassStatusEnum = pgEnum('guest_pass_status', [
  'ACTIVE',
  'USED',
  'EXPIRED',
  'CANCELLED',
])

export const guestPasses = pgTable(
  'guest_passes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    guestName: text('guest_name').notNull(),
    guestPhone: text('guest_phone'),
    guestDocument: text('guest_document'),
    status: guestPassStatusEnum('status').notNull().default('ACTIVE'),
    usedAt: timestamp('used_at'),
    usedByUserId: text('used_by_user_id').references(() => users.id),
    expiresAt: timestamp('expires_at'),
    notes: text('notes'),
    branchId: uuid('branch_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('guest_passes_member_id_idx').on(table.memberId),
    index('guest_passes_status_idx').on(table.status),
  ],
)

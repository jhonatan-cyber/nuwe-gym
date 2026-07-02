import {
  uuid,
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { branches } from './branches.ts'

export const familyGroups = pgTable('family_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  primaryMemberId: uuid('primary_member_id')
    .notNull()
    .references(() => members.id),
  discountPercent: integer('discount_percent').notNull().default(10),
  branchId: uuid('branch_id').references(() => branches.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const familyMembers = pgTable('family_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyGroupId: uuid('family_group_id')
    .notNull()
    .references(() => familyGroups.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id),
  relationship: text('relationship'), // e.g. "Spouse", "Child", "Parent", "Sibling"
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

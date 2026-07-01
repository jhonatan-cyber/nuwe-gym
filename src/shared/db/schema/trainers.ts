import {
  uuid,
  pgTable,
  integer,
  text,
  boolean,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './auth.ts'
import { members } from './members.ts'

export const trainerProfiles = pgTable(
  'trainer_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    branchId: uuid('branch_id'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    specialty: text('specialty').default(''),
    bio: text('bio').default(''),
    commissionRate: numeric('commission_rate', {
      precision: 5,
      scale: 2,
    }).default('0'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('trainer_profiles_user_id_idx').on(table.userId)],
)

export const trainerAssignments = pgTable(
  'trainer_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trainerId: uuid('trainer_id')
      .notNull()
      .references(() => trainerProfiles.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    isActive: boolean('is_active').default(true),
  },
  (table) => [
    index('trainer_assignments_trainer_id_idx').on(table.trainerId),
    index('trainer_assignments_member_id_idx').on(table.memberId),
  ],
)

export const trainerObservations = pgTable(
  'trainer_observations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trainerId: uuid('trainer_id')
      .notNull()
      .references(() => trainerProfiles.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    note: text('note').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('trainer_observations_trainer_id_idx').on(table.trainerId),
    index('trainer_observations_member_id_idx').on(table.memberId),
  ],
)

export const trainerAvailability = pgTable(
  'trainer_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trainerId: uuid('trainer_id')
      .notNull()
      .references(() => trainerProfiles.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
  },
  (table) => [index('trainer_availability_trainer_id_idx').on(table.trainerId)],
)

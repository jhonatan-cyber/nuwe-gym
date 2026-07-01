import {
  uuid,
  pgTable,
  numeric,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { users } from './auth.ts'

export const memberEvaluations = pgTable(
  'member_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    evaluatedById: text('evaluated_by_id')
      .notNull()
      .references(() => users.id),
    evaluationDate: timestamp('evaluation_date').notNull().defaultNow(),

    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
    chestCm: numeric('chest_cm', { precision: 5, scale: 1 }),
    waistCm: numeric('waist_cm', { precision: 5, scale: 1 }),
    hipsCm: numeric('hips_cm', { precision: 5, scale: 1 }),
    leftArmCm: numeric('left_arm_cm', { precision: 5, scale: 1 }),
    rightArmCm: numeric('right_arm_cm', { precision: 5, scale: 1 }),
    leftThighCm: numeric('left_thigh_cm', { precision: 5, scale: 1 }),
    rightThighCm: numeric('right_thigh_cm', { precision: 5, scale: 1 }),

    pushUps: numeric('push_ups', { precision: 5, scale: 0 }),
    sitUps: numeric('sit_ups', { precision: 5, scale: 0 }),
    pullUps: numeric('pull_ups', { precision: 5, scale: 0 }),
    runMinutes: numeric('run_minutes', { precision: 5, scale: 2 }),
    flexibilityCm: numeric('flexibility_cm', { precision: 5, scale: 1 }),
    plankSeconds: numeric('plank_seconds', { precision: 5, scale: 0 }),

    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('member_evaluations_member_id_idx').on(table.memberId),
    index('member_evaluations_date_idx').on(table.evaluationDate),
  ],
)

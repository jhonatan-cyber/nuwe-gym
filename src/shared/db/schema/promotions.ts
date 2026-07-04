import {
  uuid,
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core'

export type PromoConditions = {
  minPurchases?: number
  maxPurchases?: number
  minCheckIns?: number
  memberTierMin?: number
  memberMonthsMin?: number
}

export const promotions = pgTable('promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull().default('DISCOUNT'), // DISCOUNT, BONUS_POINTS
  discountPercent: integer('discount_percent').default(0),
  rewardPoints: integer('reward_points').default(0),
  conditions: jsonb('conditions').$type<PromoConditions>().default({}),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  autoApply: boolean('auto_apply').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

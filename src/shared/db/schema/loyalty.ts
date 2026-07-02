import {
  uuid,
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'

// ── Tiers ──

export const loyaltyTiers = pgTable('loyalty_tiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  minPoints: integer('min_points').notNull().default(0),
  color: text('color').notNull().default('#94a3b8'),
  discountPercent: integer('discount_percent').notNull().default(0),
  benefits: jsonb('benefits').default('[]'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ── Points ──

export const loyaltyPoints = pgTable(
  'loyalty_points',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id),
    points: integer('points').notNull(),
    balance: integer('balance').notNull(),
    source: text('source').notNull(), // CHECK_IN, PURCHASE, REFERRAL, REDEEM, BONUS, CHALLENGE, BADGE
    referenceId: uuid('reference_id'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('loyalty_points_member_id_idx').on(table.memberId),
    index('loyalty_points_created_at_idx').on(table.createdAt),
  ],
)

// ── Coupons ──

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description'),
  discountPercent: integer('discount_percent').notNull().default(0),
  discountFixed: integer('discount_fixed'),
  minPurchase: integer('min_purchase').notNull().default(0),
  maxUses: integer('max_uses').notNull().default(0), // 0 = unlimited
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const couponUsage = pgTable(
  'coupon_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    couponId: uuid('coupon_id').notNull().references(() => coupons.id),
    saleId: uuid('sale_id'),
    memberId: uuid('member_id').references(() => members.id),
    discountApplied: integer('discount_applied').notNull(),
    usedAt: timestamp('used_at').notNull().defaultNow(),
  },
  (table) => [index('coupon_usage_coupon_id_idx').on(table.couponId)],
)

// ── Challenges ──

export const challenges = pgTable('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // CHECK_IN_COUNT, PURCHASE_COUNT, PURCHASE_TOTAL, REFERRAL_COUNT
  target: integer('target').notNull(), // e.g. 20 check-ins
  rewardPoints: integer('reward_points').notNull().default(0),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const challengeProgress = pgTable(
  'challenge_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
    memberId: uuid('member_id').notNull().references(() => members.id),
    progress: integer('progress').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    rewarded: boolean('rewarded').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('challenge_progress_unique').on(table.challengeId, table.memberId),
  ],
)

// ── Badges ──

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('🏆'),
  requirement: jsonb('requirement').notNull().default({ type: 'CHECK_IN_COUNT', target: 1 }),
  rewardPoints: integer('reward_points').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const memberBadges = pgTable(
  'member_badges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id').notNull().references(() => members.id),
    badgeId: uuid('badge_id').notNull().references(() => badges.id),
    earnedAt: timestamp('earned_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('member_badges_unique').on(table.memberId, table.badgeId),
  ],
)

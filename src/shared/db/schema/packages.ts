import {
  uuid,
  pgTable,
  integer,
  text,
  numeric,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { packageTypeEnum, renewalTypeEnum } from './enums.ts'

export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageBase64: text('image_base64'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  type: packageTypeEnum('type').notNull().default('PACKAGE'),
  renewalType: renewalTypeEnum('renewal_type').default('MANUAL'),
  graceDays: integer('grace_days').default(0).notNull(),
  maxFreezes: integer('max_freezes').default(0).notNull(),
  maxFreezeDays: integer('max_freeze_days').default(0).notNull(),
  allowedStartTime: text('allowed_start_time'),
  allowedEndTime: text('allowed_end_time'),
  dailyAccessLimit: integer('daily_access_limit'),
  color: text('color'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const packageItems = pgTable('package_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  packageId: uuid('package_id')
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const packageAllowedDays = pgTable('package_allowed_days', {
  id: uuid('id').defaultRandom().primaryKey(),
  packageId: uuid('package_id')
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
})

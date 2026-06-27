import { uuid, pgTable,
  integer,
  text,
  numeric,
  boolean,
  timestamp, } from 'drizzle-orm/pg-core'
import { packageTypeEnum } from './enums.ts'

export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageBase64: text('image_base64'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  type: packageTypeEnum('type').notNull().default('PACKAGE'),
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

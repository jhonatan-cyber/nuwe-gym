import { uuid, pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const tvMedia = pgTable('tv_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const tvTickerMessages = pgTable('tv_ticker_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  message: text('message').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

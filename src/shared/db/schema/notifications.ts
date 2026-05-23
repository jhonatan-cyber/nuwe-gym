import { pgTable, pgEnum, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const notificationTypeEnum = pgEnum('notification_type', ['EXPIRATION', 'LOW_STOCK', 'RENEWAL', 'PAYMENT', 'SYSTEM'])

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  referenceId: integer('reference_id'),
  referenceType: text('reference_type'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

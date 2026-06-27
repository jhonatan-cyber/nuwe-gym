import { pgTable, text } from 'drizzle-orm/pg-core'

export const roles = pgTable('roles', {
  name: text('name').primaryKey(), // 'ADMIN' | 'RECEPTIONIST' | 'TRAINER'
  label: text('label').notNull(),
  description: text('description'),
})

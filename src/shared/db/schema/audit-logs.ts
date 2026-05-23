import { pgEnum, pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const actionEnum = pgEnum('action_type', [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT', 'RENEW', 'FREEZE', 'RESUME',
])

export const entityEnum = pgEnum('entity_type', [
  'MEMBER', 'SUBSCRIPTION', 'PLAN', 'PAYMENT', 'PRODUCT', 'CATEGORY', 'SUPPLIER',
  'PURCHASE', 'SALE', 'CHECK_IN', 'CASH_REGISTER', 'INVENTORY', 'USER',
  'SETTING', 'CLASS', 'SCHEDULE', 'BOOKING', 'TRAINER', 'NOTIFICATION', 'FREEZE',
  'BRANCH',
])

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  action: actionEnum('action').notNull(),
  entityType: entityEnum('entity_type').notNull(),
  entityId: integer('entity_id'),
  description: text('description').notNull(),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

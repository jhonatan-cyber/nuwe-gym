import { uuid, pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth.ts'

export const userDevices = pgTable(
  'user_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Dispositivo desconocido'),
    browser: text('browser').default(''),
    os: text('os').default(''),
    deviceType: text('device_type').default('desktop'), // desktop, mobile, tablet
    ipAddress: text('ip_address').default(''),
    lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
    isTrusted: boolean('is_trusted').default(false),
    isCurrent: boolean('is_current').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('user_devices_user_id_idx').on(table.userId),
  ],
)

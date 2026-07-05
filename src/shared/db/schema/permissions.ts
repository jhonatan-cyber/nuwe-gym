import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core'
import { roles } from './roles.ts'

export const permissions = pgTable('permissions', {
  name: text('name').primaryKey(), // 'members:read', 'members:write', etc.
  label: text('label').notNull(),
  description: text('description'),
  module: text('module').notNull(), // 'members', 'plans', 'payments', etc.
})

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleName: text('role_name')
      .notNull()
      .references(() => roles.name, { onDelete: 'cascade' }),
    permissionName: text('permission_name')
      .notNull()
      .references(() => permissions.name, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleName, t.permissionName] })],
)

import { db } from '#/shared/db'
import { rolePermissions } from '#/shared/db/schema/permissions.ts'
import { eq, and } from 'drizzle-orm'

export type Permission =
  | 'members:read'
  | 'members:write'
  | 'plans:read'
  | 'plans:write'
  | 'subscriptions:read'
  | 'subscriptions:write'
  | 'payments:read'
  | 'payments:write'
  | 'checkins:read'
  | 'checkins:write'
  | 'classes:read'
  | 'classes:write'
  | 'products:read'
  | 'products:write'
  | 'categories:read'
  | 'categories:write'
  | 'suppliers:read'
  | 'suppliers:write'
  | 'purchases:read'
  | 'purchases:write'
  | 'sales:read'
  | 'sales:write'
  | 'pos:use'
  | 'inventory:read'
  | 'inventory:write'
  | 'cash:read'
  | 'cash:write'
  | 'dashboard:read'
  | 'users:read'
  | 'users:write'
  | 'reports:read'
  | 'settings:read'
  | 'settings:write'
  | 'renewals:read'
  | 'renewals:write'
  | 'export:read'
  | 'trainers:read'
  | 'trainers:write'
  | 'notifications:read'
  | 'notifications:write'
  | 'membership-freezes:read'
  | 'membership-freezes:write'
  | 'audit:read'
  | 'audit:export'
  | 'branches:read'
  | 'branches:write'
  | 'backup:read'
  | 'backup:write'
  | 'nutrition:read'
  | 'nutrition:write'
  | 'guest-passes:read'
  | 'guest-passes:write'
  | 'employees:read'
  | 'employees:write'

/**
 * Check if a role has a permission via DB.
 */
export async function hasPermissionFromDB(role: string, permission: Permission): Promise<boolean> {
  const result = await db
    .select()
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleName, role),
        eq(rolePermissions.permissionName, permission),
      ),
    )
    .limit(1)

  return result.length > 0
}

/**
 * Get all permissions for a role from DB.
 */
export async function getRolePermissionsFromDB(role: string): Promise<string[]> {
  const result = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.roleName, role))

  return result.map((p) => p.permissionName)
}

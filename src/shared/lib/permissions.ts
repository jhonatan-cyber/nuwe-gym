export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'TRAINER'

type Permission =
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

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'members:read',
    'members:write',
    'plans:read',
    'plans:write',
    'subscriptions:read',
    'subscriptions:write',
    'payments:read',
    'payments:write',
    'checkins:read',
    'checkins:write',
    'classes:read',
    'classes:write',
    'products:read',
    'products:write',
    'categories:read',
    'categories:write',
    'suppliers:read',
    'suppliers:write',
    'purchases:read',
    'purchases:write',
    'sales:read',
    'sales:write',
    'pos:use',
    'inventory:read',
    'inventory:write',
    'cash:read',
    'cash:write',
    'dashboard:read',
    'users:read',
    'users:write',
    'reports:read',
    'settings:read',
    'settings:write',
    'renewals:read',
    'renewals:write',
    'export:read',
    'trainers:read',
    'trainers:write',
    'notifications:read',
    'notifications:write',
    'membership-freezes:read',
    'membership-freezes:write',
    'audit:read',
    'audit:export',
    'branches:read',
    'branches:write',
    'backup:read',
    'backup:write',
  ],
  RECEPTIONIST: [
    'members:read',
    'members:write',
    'plans:read',
    'subscriptions:read',
    'subscriptions:write',
    'payments:read',
    'payments:write',
    'checkins:read',
    'checkins:write',
    'classes:read',
    'classes:write',
    'products:read',
    'sales:read',
    'sales:write',
    'pos:use',
    'cash:read',
    'cash:write',
    'dashboard:read',
    'reports:read',
    'settings:read',
    'renewals:read',
    'renewals:write',
    'notifications:read',
    'trainers:read',
    'membership-freezes:read',
    'membership-freezes:write',
  ],
  TRAINER: [
    'members:read',
    'plans:read',
    'subscriptions:read',
    'classes:read',
    'checkins:read',
    'dashboard:read',
    'notifications:read',
    'trainers:read',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

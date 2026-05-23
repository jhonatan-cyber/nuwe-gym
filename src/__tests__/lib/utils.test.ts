import { describe, it, expect } from 'vitest'
import { hasPermission, hasAnyPermission } from '#/shared/lib/permissions.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

describe('Permissions', () => {
  describe('ADMIN', () => {
    it('should have members:read and members:write', () => {
      expect(hasPermission('ADMIN', 'members:read')).toBe(true)
      expect(hasPermission('ADMIN', 'members:write')).toBe(true)
    })

    it('should have all admin permissions', () => {
      const adminPerms = [
        'members:read', 'members:write',
        'plans:read', 'plans:write',
        'subscriptions:read', 'subscriptions:write',
        'payments:read', 'payments:write',
        'checkins:read', 'checkins:write',
        'classes:read', 'classes:write',
        'products:read', 'products:write',
        'categories:read', 'categories:write',
        'suppliers:read', 'suppliers:write',
        'purchases:read', 'purchases:write',
        'sales:read', 'sales:write',
        'pos:use',
        'inventory:read', 'inventory:write',
        'cash:read', 'cash:write',
        'dashboard:read',
        'users:read', 'users:write',
        'reports:read',
        'settings:read', 'settings:write',
        'renewals:read', 'renewals:write',
        'export:read',
        'trainers:read', 'trainers:write',
        'notifications:read', 'notifications:write',
        'membership-freezes:read', 'membership-freezes:write',
        'audit:read', 'audit:export',
        'branches:read', 'branches:write',
        'backup:read', 'backup:write',
      ]
      for (const perm of adminPerms) {
        expect(hasPermission('ADMIN', perm as never)).toBe(true)
      }
    })
  })

  describe('RECEPTIONIST', () => {
    it('should have members:read and members:write', () => {
      expect(hasPermission('RECEPTIONIST', 'members:read')).toBe(true)
      expect(hasPermission('RECEPTIONIST', 'members:write')).toBe(true)
    })

    it('should NOT have users:read, settings:write, audit:read', () => {
      expect(hasPermission('RECEPTIONIST', 'users:read')).toBe(false)
      expect(hasPermission('RECEPTIONIST', 'settings:write')).toBe(false)
      expect(hasPermission('RECEPTIONIST', 'audit:read')).toBe(false)
    })

    it('should have pos:use and cash:read', () => {
      expect(hasPermission('RECEPTIONIST', 'pos:use')).toBe(true)
      expect(hasPermission('RECEPTIONIST', 'cash:read')).toBe(true)
    })

    it('should NOT have backup or branches permissions', () => {
      expect(hasPermission('RECEPTIONIST', 'backup:read')).toBe(false)
      expect(hasPermission('RECEPTIONIST', 'branches:write')).toBe(false)
    })
  })

  describe('TRAINER', () => {
    it('should have members:read but not members:write', () => {
      expect(hasPermission('TRAINER', 'members:read')).toBe(true)
      expect(hasPermission('TRAINER', 'members:write')).toBe(false)
    })

    it('should have basic read permissions', () => {
      expect(hasPermission('TRAINER', 'plans:read')).toBe(true)
      expect(hasPermission('TRAINER', 'subscriptions:read')).toBe(true)
      expect(hasPermission('TRAINER', 'classes:read')).toBe(true)
      expect(hasPermission('TRAINER', 'checkins:read')).toBe(true)
      expect(hasPermission('TRAINER', 'dashboard:read')).toBe(true)
      expect(hasPermission('TRAINER', 'notifications:read')).toBe(true)
      expect(hasPermission('TRAINER', 'trainers:read')).toBe(true)
    })

    it('should NOT have financial permissions', () => {
      expect(hasPermission('TRAINER', 'sales:read')).toBe(false)
      expect(hasPermission('TRAINER', 'cash:read')).toBe(false)
      expect(hasPermission('TRAINER', 'payments:read')).toBe(false)
    })

    it('should NOT have admin permissions', () => {
      expect(hasPermission('TRAINER', 'users:read')).toBe(false)
      expect(hasPermission('TRAINER', 'settings:read')).toBe(false)
      expect(hasPermission('TRAINER', 'audit:read')).toBe(false)
      expect(hasPermission('TRAINER', 'branches:read')).toBe(false)
      expect(hasPermission('TRAINER', 'backup:read')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      expect(hasAnyPermission('RECEPTIONIST', ['audit:read', 'members:read', 'backup:write'])).toBe(true)
    })

    it('should return false when user has none of the permissions', () => {
      expect(hasAnyPermission('TRAINER', ['sales:write', 'cash:write', 'settings:write'])).toBe(false)
    })

    it('should return true when all permissions match', () => {
      expect(hasAnyPermission('ADMIN', ['members:read', 'users:write', 'backup:read'])).toBe(true)
    })

    it('should return false for empty permissions array', () => {
      expect(hasAnyPermission('ADMIN', [])).toBe(false)
    })
  })

  describe('role permissions are mutually exclusive', () => {
    it('should have unique permission sets per role', () => {
      const adminSet = new Set(['members:write', 'users:write', 'settings:write', 'audit:read', 'branches:write', 'backup:write'])
      const receptionistSet = new Set(['members:write'])
      const trainerSet = new Set<string>()

      for (const perm of adminSet) {
        expect(hasPermission('ADMIN', perm as never)).toBe(true)
      }
      for (const perm of receptionistSet) {
        expect(hasPermission('RECEPTIONIST', perm as never)).toBe(true)
      }
      for (const perm of trainerSet) {
        expect(hasPermission('TRAINER', perm as never)).toBe(false)
      }
    })
  })
})

describe('Audit Context', () => {
  it('should extract userId, userName, userRole from session', () => {
    const session = {
      user: { id: 'u1', name: 'Admin', role: 'ADMIN' },
    }
    const ctx = getAuditContext(session as never)
    expect(ctx.userId).toBe('u1')
    expect(ctx.userName).toBe('Admin')
    expect(ctx.userRole).toBe('ADMIN')
  })

  it('should return SYSTEM defaults when session is null', () => {
    const ctx = getAuditContext(null)
    expect(ctx.userId).toBe('SYSTEM')
    expect(ctx.userName).toBe('SYSTEM')
    expect(ctx.userRole).toBe('SYSTEM')
  })

  it('should return SYSTEM defaults when session.user is undefined', () => {
    const ctx = getAuditContext({} as never)
    expect(ctx.userId).toBe('SYSTEM')
    expect(ctx.userName).toBe('SYSTEM')
    expect(ctx.userRole).toBe('SYSTEM')
  })

  it('should return SYSTEM defaults when user fields are missing', () => {
    const session = { user: {} }
    const ctx = getAuditContext(session as never)
    expect(ctx.userId).toBe('SYSTEM')
    expect(ctx.userName).toBe('SYSTEM')
    expect(ctx.userRole).toBe('SYSTEM')
  })

  it('should handle partial user data', () => {
    const session = { user: { id: 'u2', name: 'Recepcionista' } }
    const ctx = getAuditContext(session as never)
    expect(ctx.userId).toBe('u2')
    expect(ctx.userName).toBe('Recepcionista')
    expect(ctx.userRole).toBe('SYSTEM')
  })
})

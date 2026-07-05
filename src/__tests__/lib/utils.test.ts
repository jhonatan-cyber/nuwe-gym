import { describe, it, expect } from 'vitest'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

describe('Audit Context', () => {
  it('should extract userId, userName, userRole from session', () => {
    const session = {
      user: { id: 'u1', name: 'Admin', role: 'ADMIN' },
    }
    const ctx = getAuditContext(session)
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
    const ctx = getAuditContext({})
    expect(ctx.userId).toBe('SYSTEM')
    expect(ctx.userName).toBe('SYSTEM')
    expect(ctx.userRole).toBe('SYSTEM')
  })

  it('should return SYSTEM defaults when user fields are missing', () => {
    const session = { user: {} }
    const ctx = getAuditContext(session)
    expect(ctx.userId).toBe('SYSTEM')
    expect(ctx.userName).toBe('SYSTEM')
    expect(ctx.userRole).toBe('SYSTEM')
  })

  it('should handle partial user data', () => {
    const session = { user: { id: 'u2', name: 'Recepcionista' } }
    const ctx = getAuditContext(session)
    expect(ctx.userId).toBe('u2')
    expect(ctx.userName).toBe('Recepcionista')
    expect(ctx.userRole).toBe('SYSTEM')
  })
})

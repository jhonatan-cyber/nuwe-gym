import { createServerFn } from '@tanstack/react-start'
import { auth } from '#/shared/lib/auth.ts'
import type { UserRole } from '#/shared/lib/permissions.ts'
import type { Permission } from '#/shared/lib/permissions.ts'
import { hasPermission } from '#/shared/lib/permissions.ts'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    return session
  },
)

export const requireRole = createServerFn({ method: 'GET' })
  .inputValidator((data: { roles: UserRole[] }) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    const roleMap: Record<string, UserRole> = {
      admin: 'ADMIN',
      user: 'TRAINER',
    }
    const rawRole = session.user.role
    const normalizedRole: UserRole = roleMap[rawRole] ?? rawRole
    if (!data.roles.includes(normalizedRole)) {
      throw new Error('Forbidden')
    }
    return { ...session, user: { ...session.user, role: normalizedRole } }
  })

/**
 * Verify the authenticated user has a specific permission.
 * Uses the granular permissions defined in permissions.ts.
 */
export const requirePermission = createServerFn({ method: 'GET' })
  .inputValidator((data: { permission: Permission }) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    const roleMap: Record<string, UserRole> = {
      admin: 'ADMIN',
      user: 'TRAINER',
    }
    const rawRole = session.user.role
    const normalizedRole: UserRole = roleMap[rawRole] ?? rawRole
    if (!hasPermission(normalizedRole, data.permission)) {
      throw new Error('Forbidden')
    }
    return { ...session, user: { ...session.user, role: normalizedRole } }
  })

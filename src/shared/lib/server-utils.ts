import { createServerFn } from '@tanstack/react-start'
import { auth } from '#/shared/lib/auth.ts'
import type { Permission } from '#/shared/lib/permissions.ts'
import { hasPermissionFromDB, getRolePermissionsFromDB } from '#/shared/lib/permissions.ts'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    return session
  },
)

export const requireRole = createServerFn({ method: 'GET' })
  .validator((data: { roles: string[] }) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    // Role comes directly from auth — no mapping needed
    const userRole = session.user.role
    if (!data.roles.includes(userRole)) {
      throw new Error('Forbidden')
    }
    return session
  })

/**
 * Verify the authenticated user has a specific permission.
 * Uses DB-backed permissions from role_permissions table.
 */
export const requirePermission = createServerFn({ method: 'GET' })
  .validator((data: { permission: Permission }) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    const userRole = session.user.role
    if (!(await hasPermissionFromDB(userRole, data.permission))) {
      throw new Error('Forbidden')
    }
    return session
  })

/**
 * Get all permissions for the current user's role.
 */
export const getUserPermissions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    return getRolePermissionsFromDB(session.user.role)
  },
)

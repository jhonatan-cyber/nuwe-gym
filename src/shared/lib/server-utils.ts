import { createServerFn } from '@tanstack/react-start'
import { auth } from '#/shared/lib/auth.ts'
import type { UserRole } from '#/shared/lib/permissions.ts'

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
    if (!data.roles.includes(session.user.role as UserRole)) {
      throw new Error('Forbidden')
    }
    return session
  })

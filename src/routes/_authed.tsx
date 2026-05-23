import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '#/shared/components/layout/app-layout.tsx'
import { getSession } from '#/shared/lib/server-utils.ts'
import type { UserRole } from '#/shared/lib/permissions.ts'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return {
      session,
      userRole: ['ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(session.user.role)
        ? (session.user.role as UserRole)
        : 'TRAINER',
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { session, userRole } = Route.useRouteContext()

  return (
    <AppLayout
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      userRole={userRole}
      userImage={session.user.image}
    />
  )
}

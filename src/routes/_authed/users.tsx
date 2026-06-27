import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminUsersPage } from '#/features/users/users-page.tsx'

export const Route = createFileRoute('/_authed/users')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: UsersRoute,
})

function UsersRoute() {
  const { session } = Route.useRouteContext()
  return <AdminUsersPage currentUserId={session.user.id} />
}

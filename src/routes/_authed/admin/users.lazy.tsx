import { createLazyFileRoute } from '@tanstack/react-router'
import { AdminUsersPage } from '#/features/users/users-page.tsx'

function AdminUsersRoute() {
  const { session } = Route.useRouteContext()
  return <AdminUsersPage currentUserId={session.user.id} />
}

export const Route = createLazyFileRoute('/_authed/admin/users')({
  component: AdminUsersRoute,
})

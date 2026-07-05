import { createLazyFileRoute } from '@tanstack/react-router'
import { MembersPage } from '#/features/members/members-page.tsx'

function MembersRoute() {
  const { session } = Route.useRouteContext()
  return <MembersPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/members')({
  component: MembersRoute,
})

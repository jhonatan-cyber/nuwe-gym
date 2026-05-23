import { createFileRoute } from '@tanstack/react-router'
import { MembersPage } from '#/features/members/members-page.tsx'

export const Route = createFileRoute('/_authed/members')({
  component: MembersRoute,
})

function MembersRoute() {
  const { userRole } = Route.useRouteContext()
  return <MembersPage userRole={userRole} />
}

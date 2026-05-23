import { createFileRoute } from '@tanstack/react-router'
import { MembershipFreezesPage } from '#/features/membership-freezes/membership-freezes-page.tsx'

export const Route = createFileRoute('/_authed/membership-freezes')({
  component: MembershipFreezesRoute,
})

function MembershipFreezesRoute() {
  const { userRole } = Route.useRouteContext()
  return <MembershipFreezesPage userRole={userRole} />
}

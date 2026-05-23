import { createFileRoute } from '@tanstack/react-router'
import { MembershipPlansPage } from '#/features/membership-plans/membership-plans-page.tsx'

export const Route = createFileRoute('/_authed/membership-plans')({
  component: MembershipPlansRoute,
})

function MembershipPlansRoute() {
  const { userRole } = Route.useRouteContext()
  return <MembershipPlansPage userRole={userRole} />
}

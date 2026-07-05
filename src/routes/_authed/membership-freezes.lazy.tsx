import { createLazyFileRoute } from '@tanstack/react-router'
import { MembershipFreezesPage } from '#/features/membership-freezes/membership-freezes-page.tsx'

function MembershipFreezesRoute() {
  return <MembershipFreezesPage />
}

export const Route = createLazyFileRoute('/_authed/membership-freezes')({
  component: MembershipFreezesRoute,
})

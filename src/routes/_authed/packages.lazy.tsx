import { createLazyFileRoute } from '@tanstack/react-router'
import { PackagesPage } from '#/features/packages/packages-page.tsx'

function PackagesRoute() {
  const { session } = Route.useRouteContext()
  return <PackagesPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/packages')({
  component: PackagesRoute,
})

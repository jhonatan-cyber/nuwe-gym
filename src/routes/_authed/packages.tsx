import { createFileRoute } from '@tanstack/react-router'
import { PackagesPage } from '#/features/packages/packages-page.tsx'

export const Route = createFileRoute('/_authed/packages')({
  component: PackagesRoute,
})

function PackagesRoute() {
  const { userRole } = Route.useRouteContext()
  return <PackagesPage userRole={userRole} />
}

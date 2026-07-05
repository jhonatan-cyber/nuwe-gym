import { createLazyFileRoute } from '@tanstack/react-router'
import { EmployeesPage } from '#/features/employees'

export const Route = createLazyFileRoute('/_authed/employees')({
  component: EmployeesRoute,
})

function EmployeesRoute() {
  const { session } = Route.useRouteContext()
  return <EmployeesPage currentUserId={session.user.id} />
}

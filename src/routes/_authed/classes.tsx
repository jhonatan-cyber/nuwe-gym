import { createFileRoute } from '@tanstack/react-router'
import { ClassesPage } from '#/features/classes/classes-page.tsx'

export const Route = createFileRoute('/_authed/classes')({
  component: ClassesRoute,
})

function ClassesRoute() {
  const { userRole } = Route.useRouteContext()
  return <ClassesPage userRole={userRole} />
}

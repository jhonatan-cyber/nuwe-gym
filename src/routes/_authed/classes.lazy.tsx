import { createLazyFileRoute } from '@tanstack/react-router'
import { ClassesPage } from '#/features/classes/classes-page.tsx'

function ClassesRoute() {
  const { session } = Route.useRouteContext()
  return <ClassesPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/classes')({
  component: ClassesRoute,
})

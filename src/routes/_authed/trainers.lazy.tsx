import { createLazyFileRoute } from '@tanstack/react-router'
import { TrainersPage } from '#/features/trainers/trainers-page.tsx'

function TrainersRoute() {
  const { session } = Route.useRouteContext()
  return <TrainersPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/trainers')({
  component: TrainersRoute,
})

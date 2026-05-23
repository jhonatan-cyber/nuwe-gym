import { createFileRoute } from '@tanstack/react-router'
import { TrainersPage } from '#/features/trainers/trainers-page.tsx'

export const Route = createFileRoute('/_authed/trainers')({
  component: TrainersRoute,
})

function TrainersRoute() {
  const { userRole } = Route.useRouteContext()
  return <TrainersPage userRole={userRole} />
}

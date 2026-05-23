import { createFileRoute } from '@tanstack/react-router'
import { SubscriptionsPage } from '#/features/subscriptions/subscriptions-page.tsx'

export const Route = createFileRoute('/_authed/subscriptions')({
  component: SubscriptionsRoute,
})

function SubscriptionsRoute() {
  const { userRole } = Route.useRouteContext()
  return <SubscriptionsPage userRole={userRole} />
}

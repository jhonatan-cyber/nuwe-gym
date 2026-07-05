import { createLazyFileRoute } from '@tanstack/react-router'
import { SubscriptionsPage } from '#/features/subscriptions/subscriptions-page.tsx'

function SubscriptionsRoute() {
  const { session } = Route.useRouteContext()
  return <SubscriptionsPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/subscriptions')({
  component: SubscriptionsRoute,
})

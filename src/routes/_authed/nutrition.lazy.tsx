import { createLazyFileRoute } from '@tanstack/react-router'
import { NutritionPage } from '#/features/nutrition/nutrition-page.tsx'

function NutritionRoute() {
  const { session } = Route.useRouteContext()
  return <NutritionPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/nutrition')({
  component: NutritionRoute,
})

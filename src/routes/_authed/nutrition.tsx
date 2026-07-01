import { createFileRoute } from '@tanstack/react-router'
import { NutritionPage } from '#/features/nutrition/nutrition-page.tsx'

export const Route = createFileRoute('/_authed/nutrition')({
  component: NutritionRoute,
})

function NutritionRoute() {
  const { userRole } = Route.useRouteContext()
  return <NutritionPage userRole={userRole} />
}

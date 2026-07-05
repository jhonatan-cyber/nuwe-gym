import { createLazyFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '#/features/dashboard/dashboard-page.tsx'

export const Route = createLazyFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

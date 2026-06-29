import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '#/features/dashboard/dashboard-page.tsx'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

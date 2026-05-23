import { createFileRoute } from '@tanstack/react-router'
import { getDashboardData } from '#/features/dashboard/server.ts'
import { DashboardPage } from '#/features/dashboard/dashboard-page.tsx'

export const Route = createFileRoute('/_authed/dashboard')({
  loader: () => getDashboardData(),
  component: DashboardPage,
})

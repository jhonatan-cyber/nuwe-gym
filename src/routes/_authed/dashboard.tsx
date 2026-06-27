import { createFileRoute } from '@tanstack/react-router'
import {
  getDashboardData,
  getExpiringSoonCount,
} from '#/features/dashboard/server.ts'
import { DashboardPage } from '#/features/dashboard/dashboard-page.tsx'
import type { getDashboardData as GetDashboardDataFn } from '#/features/dashboard/server.ts'

type DashboardData = Awaited<ReturnType<typeof GetDashboardDataFn>>

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async () => {
    const [dashboardData, expiringSoonCount] = await Promise.all([
      getDashboardData(),
      getExpiringSoonCount(),
    ])
    return { ...dashboardData, expiringSoonCount } as DashboardData & {
      expiringSoonCount: number
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const loaderData = Route.useLoaderData()
  const data = loaderData as DashboardData & { expiringSoonCount: number }
  return <DashboardPage data={data} />
}

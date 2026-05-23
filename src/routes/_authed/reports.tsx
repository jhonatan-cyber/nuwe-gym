import { createFileRoute, redirect } from '@tanstack/react-router'
import { ReportsPage } from '#/features/reports/reports-page.tsx'

export const Route = createFileRoute('/_authed/reports')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN' && context.userRole !== 'RECEPTIONIST') {
      throw redirect({ to: '/' })
    }
  },
  component: ReportsPage,
})

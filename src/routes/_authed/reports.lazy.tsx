import { createLazyFileRoute } from '@tanstack/react-router'
import { ReportsPage } from '#/features/reports/reports-page.tsx'

export const Route = createLazyFileRoute('/_authed/reports')({
  component: ReportsPage,
})

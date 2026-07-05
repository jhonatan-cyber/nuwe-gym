import { createLazyFileRoute } from '@tanstack/react-router'
import { SchedulesPage } from '#/features/employees/schedules-page.tsx'

export const Route = createLazyFileRoute('/_authed/employee-schedules')({
  component: SchedulesPage,
})

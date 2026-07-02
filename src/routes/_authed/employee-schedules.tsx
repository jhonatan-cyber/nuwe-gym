import { createFileRoute, redirect } from '@tanstack/react-router'
import { SchedulesPage } from '#/features/employees/schedules-page.tsx'

export const Route = createFileRoute('/_authed/employee-schedules')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN' && context.userRole !== 'RECEPTIONIST') {
      throw redirect({ to: '/' })
    }
  },
  component: SchedulesPage,
})

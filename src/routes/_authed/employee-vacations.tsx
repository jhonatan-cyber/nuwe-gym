import { createFileRoute, redirect } from '@tanstack/react-router'
import { VacationsPage } from '#/features/employees/vacations-page.tsx'

export const Route = createFileRoute('/_authed/employee-vacations')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN' && context.userRole !== 'RECEPTIONIST') {
      throw redirect({ to: '/' })
    }
  },
  component: VacationsPage,
})

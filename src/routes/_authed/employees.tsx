import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmployeesPage } from '#/features/employees'

export const Route = createFileRoute('/_authed/employees')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
    return {
      session: context.session,
    }
  },
  component: EmployeesPage,
})

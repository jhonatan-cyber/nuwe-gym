import { createFileRoute, redirect } from '@tanstack/react-router'
import { AttendancePage } from '#/features/employees'

export const Route = createFileRoute('/_authed/employee-attendance')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN' && context.userRole !== 'RECEPTIONIST') {
      throw redirect({ to: '/' })
    }
  },
  component: AttendancePage,
})

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/employee-vacations')({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== 'ADMIN' && context.session.user.role !== 'RECEPTIONIST') {
      throw redirect({ to: '/' })
    }
  },
})

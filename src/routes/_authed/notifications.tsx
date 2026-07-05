import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/notifications')({
  beforeLoad: ({ context }) => {
    if (!['ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(context.session.user.role)) {
      throw redirect({ to: '/' })
    }
  },
})

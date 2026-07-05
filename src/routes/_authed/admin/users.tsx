import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/admin/users')({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
})

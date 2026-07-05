import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/corporate-accounts')({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
})

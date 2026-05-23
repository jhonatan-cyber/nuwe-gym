import { createFileRoute, redirect } from '@tanstack/react-router'
import { NotificationsPage } from '#/features/notifications/notifications-page.tsx'

export const Route = createFileRoute('/_authed/notifications')({
  beforeLoad: ({ context }) => {
    if (!['ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(context.userRole)) {
      throw redirect({ to: '/' })
    }
  },
  component: NotificationsPage,
})

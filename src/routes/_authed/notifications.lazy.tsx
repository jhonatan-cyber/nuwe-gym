import { createLazyFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '#/features/notifications/notifications-page.tsx'

export const Route = createLazyFileRoute('/_authed/notifications')({
  component: NotificationsPage,
})

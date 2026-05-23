import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsPage } from '#/features/settings/settings-page.tsx'

export const Route = createFileRoute('/_authed/settings')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: SettingsPage,
})

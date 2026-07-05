import { createLazyFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '#/features/settings/settings-page.tsx'

export const Route = createLazyFileRoute('/_authed/settings')({
  component: SettingsPage,
})

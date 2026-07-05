import { createLazyFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '#/features/profile/profile-page.tsx'

export const Route = createLazyFileRoute('/_authed/profile')({
  component: ProfilePage,
})

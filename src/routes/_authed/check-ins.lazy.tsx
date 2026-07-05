import { createLazyFileRoute } from '@tanstack/react-router'
import { CheckInsPage } from '#/features/check-ins/check-ins-page.tsx'

export const Route = createLazyFileRoute('/_authed/check-ins')({
  component: CheckInsPage,
})

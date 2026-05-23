import { createFileRoute } from '@tanstack/react-router'
import { CheckInsPage } from '#/features/check-ins/check-ins-page.tsx'

export const Route = createFileRoute('/_authed/check-ins')({
  component: CheckInsPage,
})

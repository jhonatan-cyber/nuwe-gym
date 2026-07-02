import { createFileRoute } from '@tanstack/react-router'
import { TvPage } from '#/features/tv-screen/tv-page.tsx'

export const Route = createFileRoute('/tv')({
  component: TvPage,
})

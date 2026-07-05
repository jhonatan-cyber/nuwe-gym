import { createLazyFileRoute } from '@tanstack/react-router'
import { ExportPage } from '#/features/export/export-page.tsx'

export const Route = createLazyFileRoute('/_authed/export')({
  component: ExportPage,
})

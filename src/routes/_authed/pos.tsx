import { createFileRoute } from '@tanstack/react-router'
import { POSPage } from '#/features/pos/pos-page.tsx'

export const Route = createFileRoute('/_authed/pos')({
  component: POSPage,
})

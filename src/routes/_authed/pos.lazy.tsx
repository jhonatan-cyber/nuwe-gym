import { createLazyFileRoute } from '@tanstack/react-router'
import { POSPage } from '#/features/pos/pos-page.tsx'

export const Route = createLazyFileRoute('/_authed/pos')({
  component: POSPage,
})

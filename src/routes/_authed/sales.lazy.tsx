import { createLazyFileRoute } from '@tanstack/react-router'
import { SalesPage } from '#/features/sales/sales-page.tsx'

export const Route = createLazyFileRoute('/_authed/sales')({
  component: SalesPage,
})

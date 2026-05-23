import { createFileRoute } from '@tanstack/react-router'
import { SalesPage } from '#/features/sales/sales-page.tsx'

export const Route = createFileRoute('/_authed/sales')({
  component: SalesPage,
})

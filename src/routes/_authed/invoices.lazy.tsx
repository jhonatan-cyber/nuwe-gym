import { createLazyFileRoute } from '@tanstack/react-router'
import { InvoicesPage } from '#/features/invoices/invoices-page.tsx'

export const Route = createLazyFileRoute('/_authed/invoices')({
  component: InvoicesPage,
})

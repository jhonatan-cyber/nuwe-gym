import { createFileRoute } from '@tanstack/react-router'
import { InvoicesPage } from '#/features/invoices/invoices-page.tsx'

export const Route = createFileRoute('/_authed/invoices')({
  component: InvoicesPage,
})

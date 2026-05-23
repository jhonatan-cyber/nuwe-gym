import { createFileRoute } from '@tanstack/react-router'
import { SuppliersPage } from '#/features/suppliers/suppliers-page.tsx'

export const Route = createFileRoute('/_authed/suppliers')({
  component: SuppliersPage,
})

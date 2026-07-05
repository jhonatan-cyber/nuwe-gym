import { createLazyFileRoute } from '@tanstack/react-router'
import { SuppliersPage } from '#/features/suppliers/suppliers-page.tsx'

export const Route = createLazyFileRoute('/_authed/suppliers')({
  component: SuppliersPage,
})

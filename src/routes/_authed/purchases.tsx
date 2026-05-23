import { createFileRoute } from '@tanstack/react-router'
import { PurchasesPage } from '#/features/purchases/purchases-page.tsx'

export const Route = createFileRoute('/_authed/purchases')({
  component: PurchasesPage,
})

import { createLazyFileRoute } from '@tanstack/react-router'
import { PurchasesPage } from '#/features/purchases/purchases-page.tsx'

export const Route = createLazyFileRoute('/_authed/purchases')({
  component: PurchasesPage,
})

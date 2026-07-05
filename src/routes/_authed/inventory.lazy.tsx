import { createLazyFileRoute } from '@tanstack/react-router'
import { InventoryPage } from '#/features/inventory/inventory-page.tsx'

export const Route = createLazyFileRoute('/_authed/inventory')({
  component: InventoryPage,
})

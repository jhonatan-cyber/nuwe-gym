import { createFileRoute } from '@tanstack/react-router'
import { InventoryPage } from '#/features/inventory/inventory-page.tsx'

export const Route = createFileRoute('/_authed/inventory')({
  component: InventoryPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { ProductsPage } from '#/features/products/products-page.tsx'

export const Route = createFileRoute('/_authed/products')({
  component: ProductsPage,
})

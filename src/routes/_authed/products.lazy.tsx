import { createLazyFileRoute } from '@tanstack/react-router'
import { ProductsPage } from '#/features/products/products-page.tsx'

export const Route = createLazyFileRoute('/_authed/products')({
  component: ProductsPage,
})

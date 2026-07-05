import { createLazyFileRoute } from '@tanstack/react-router'
import { ProductCategoriesPage } from '#/features/product-categories/product-categories-page.tsx'

export const Route = createLazyFileRoute('/_authed/product-categories')({
  component: ProductCategoriesPage,
})

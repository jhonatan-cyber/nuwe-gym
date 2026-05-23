import { createFileRoute } from '@tanstack/react-router'
import { ProductCategoriesPage } from '#/features/product-categories/product-categories-page.tsx'

export const Route = createFileRoute('/_authed/product-categories')({
  component: ProductCategoriesPage,
})

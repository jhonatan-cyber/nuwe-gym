import { createLazyFileRoute } from '@tanstack/react-router'
import { BranchesPage } from '#/features/branches/branches-page.tsx'

export const Route = createLazyFileRoute('/_authed/branches')({
  component: BranchesPage,
})

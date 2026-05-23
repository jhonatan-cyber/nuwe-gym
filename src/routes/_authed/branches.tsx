import { createFileRoute, redirect } from '@tanstack/react-router'
import { BranchesPage } from '#/features/branches/branches-page.tsx'

export const Route = createFileRoute('/_authed/branches')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: BranchesPage,
})

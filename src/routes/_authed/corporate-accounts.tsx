import { createFileRoute, redirect } from '@tanstack/react-router'
import { CorporateAccountsPage } from '#/features/corporate-accounts/corporate-accounts-page.tsx'

export const Route = createFileRoute('/_authed/corporate-accounts')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: CorporateAccountsPage,
})

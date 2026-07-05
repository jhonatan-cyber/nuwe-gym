import { createLazyFileRoute } from '@tanstack/react-router'
import { CorporateAccountsPage } from '#/features/corporate-accounts/corporate-accounts-page.tsx'

export const Route = createLazyFileRoute('/_authed/corporate-accounts')({
  component: CorporateAccountsPage,
})

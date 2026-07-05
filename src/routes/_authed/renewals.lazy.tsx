import { createLazyFileRoute } from '@tanstack/react-router'
import { RenewalsPage } from '#/features/renewals/renewals-page.tsx'

function RenewalsRoute() {
  return <RenewalsPage />
}

export const Route = createLazyFileRoute('/_authed/renewals')({
  component: RenewalsRoute,
})

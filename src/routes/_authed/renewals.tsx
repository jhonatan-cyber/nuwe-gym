import { createFileRoute } from '@tanstack/react-router'
import { RenewalsPage } from '#/features/renewals/renewals-page.tsx'

export const Route = createFileRoute('/_authed/renewals')({
  component: RenewalsRoute,
})

function RenewalsRoute() {
  return <RenewalsPage />
}

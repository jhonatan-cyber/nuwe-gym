import { createFileRoute } from '@tanstack/react-router'
import { MembershipPaymentsPage } from '#/features/membership-payments/membership-payments-page.tsx'

export const Route = createFileRoute('/_authed/membership-payments')({
  component: MembershipPaymentsPage,
})

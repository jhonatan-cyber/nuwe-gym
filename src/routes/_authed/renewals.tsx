import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { RenewalsPage } from '#/features/renewals/renewals-page.tsx'

const renewalsSearchSchema = z.object({
  memberId: z.string().optional(),
})

export const Route = createFileRoute('/_authed/renewals')({
  validateSearch: (search) => renewalsSearchSchema.parse(search),
  component: RenewalsRoute,
})

function RenewalsRoute() {
  return <RenewalsPage />
}

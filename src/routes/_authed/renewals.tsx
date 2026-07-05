import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const renewalsSearchSchema = z.object({
  memberId: z.string().optional(),
})

export const Route = createFileRoute('/_authed/renewals')({
  validateSearch: (search) => renewalsSearchSchema.parse(search),
})

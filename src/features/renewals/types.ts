import type { getMembers } from '#/features/members/server.ts'
import type { PaymentMethod } from '#/shared/lib/subscription-utils.ts'

export type Step = 1 | 2 | 3

export type { PaymentMethod }

export interface RenewalFormData {
  packageId: number
  paymentMethod: PaymentMethod
  amount: string
  notes: string
}

export type MemberWithSubscriptions = Awaited<
  ReturnType<typeof getMembers>
>[number] & {
  subscriptions?: Array<{
    id: number
    status: string
    endDate: Date
    packageId: number | null
    package?: { name: string; price: string } | null
  }>
}

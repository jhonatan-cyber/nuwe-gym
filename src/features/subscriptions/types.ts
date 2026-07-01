import type { getSubscriptionsWithBalance } from './server.ts'
import type { PaymentMethod } from '#/shared/lib/subscription-utils.ts'

export type Subscription = Awaited<ReturnType<typeof getSubscriptionsWithBalance>>[number]

export type { PaymentMethod }

export type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface SubscriptionFormData {
  memberId: string
  packageId: string
  startDate: string
  endDate: string
  amountPaid: string
  paymentMethod: PaymentMethod
}

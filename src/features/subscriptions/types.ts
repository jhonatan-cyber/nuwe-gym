import type { getSubscriptions } from './server.ts'

export type Subscription = Awaited<ReturnType<typeof getSubscriptions>>[number]

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'QR'

export type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface SubscriptionFormData {
  memberId: number
  packageId: number
  startDate: string
  endDate: string
  amountPaid: string
  paymentMethod: PaymentMethod
}

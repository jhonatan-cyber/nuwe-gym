import type { getMembers } from '#/features/members/server.ts'

export type MemberWithSubscriptions = Awaited<ReturnType<typeof getMembers>>[number]

export interface SubscriptionRow {
  id: number
  startDate: string
  endDate: string
  status: string
  plan: { name: string } | null
  package: { name: string } | null
  payments: Array<{ amount: string; paymentMethod: string }>
}

export type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'NO_SUBSCRIPTION'

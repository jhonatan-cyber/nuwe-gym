import type { getMembers } from '#/features/members/server.ts'

export type Step = 1 | 2 | 3

export interface FreezeFormData {
  subscriptionId: string
  startDate: string
  endDate: string
  reason: string
}

export type MemberWithSubscriptions = Awaited<
  ReturnType<typeof getMembers>
>[number] & {
  subscriptions?: Array<{
    id: string
    status: string
    endDate: Date
    packageId: string | null
    package?: { name: string; price: string; durationDays: number } | null
  }>
}

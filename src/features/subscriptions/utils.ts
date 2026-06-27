import { getInitials } from '#/shared/lib/formatters.ts'
import type { Subscription } from './types.ts'

export { getInitials }
export function getSubscriptionStatus(sub: Pick<Subscription, 'status' | 'endDate'>) {
  const end = new Date(sub.endDate)
  const isExpired = end < new Date()
  const isCanceled = sub.status === 'CANCELED'
  if (isCanceled) return 'CANCELLED'
  if (isExpired) return 'EXPIRED'
  return 'ACTIVE'
}

export function getSubscriptionProgress(sub: Pick<Subscription, 'status' | 'startDate' | 'endDate'>) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(sub.startDate)
  const end = new Date(sub.endDate)
  const isExpired = end < today
  const isCanceled = sub.status === 'CANCELED'

  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  const daysRemaining = isCanceled
    ? 0
    : Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const daysExpired = isExpired && !isCanceled
    ? Math.max(0, Math.ceil((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  const percent = isCanceled ? 0 : isExpired ? 100 : Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100))

  let progressColor = 'bg-emerald-500'
  if (isCanceled) progressColor = 'bg-muted-foreground/30'
  else if (isExpired) progressColor = 'bg-orange-500/60'
  else if (daysRemaining <= 5) progressColor = 'bg-amber-500'

  return { isExpired, isCanceled, totalDays, daysRemaining, daysExpired, percent, progressColor }
}

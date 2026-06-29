export function isExpired(dateStr: string | Date | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function isExpiringThisWeek(
  dateStr: string | Date | null | undefined,
): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(now.getDate() + 7)
  return date >= now && date <= nextWeek
}

export function getActiveSubscription<T extends { subscriptions: any[] }>(
  member: T,
): T['subscriptions'][number] | undefined {
  return member.subscriptions[0]
}

export function isSubscriptionActive(
  sub: { status: string; endDate: string | Date | null } | undefined | null,
): boolean {
  if (!sub) return false
  return sub.status === 'ACTIVE' && !isExpired(sub.endDate)
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'QR'

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  QR: 'QR',
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method
}

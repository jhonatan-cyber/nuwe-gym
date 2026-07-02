export type VacationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export const VACATION_STATUS_LABELS: Record<VacationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
}

export const VACATION_STATUS_COLORS: Record<VacationStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  CANCELLED: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
}

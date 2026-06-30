export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  QR: 'Código QR',
}

export const DAY_LABELS = [
  'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab',
]

export type MovementType = 'INCOME' | 'EXPENSE'

export const CLASS_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

export const CLASS_CATEGORIES = [
  'Cardio',
  'Fuerza',
  'Mente-Cuerpo',
  'Acuático',
  'Funcional',
  'Baile',
  'Combate',
]

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

export const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6
  return `${hour.toString().padStart(2, '0')}:00`
})

export const BOOKING_STATUS_COLORS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  CONFIRMED: 'default',
  CANCELLED: 'secondary',
  ATTENDED: 'outline',
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  ATTENDED: 'Asistió',
}

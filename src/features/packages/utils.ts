import { Package, Sparkles, Tag } from 'lucide-react'

export function getDurationLabel(days: number): string {
  if (days === 1) return '1 Dia'
  if (days < 7) return `${days} Dias`
  if (days === 7) return '1 Semana'
  if (days < 30) return `${Math.round(days / 7)} Semanas`
  if (days === 30) return '1 Mes'
  if (days < 365) return `${Math.round(days / 30)} Meses`
  if (days === 365) return '1 Anio'
  return `${days} Dias`
}

export function getTypeIcon(type: string) {
  switch (type) {
    case 'PROMOTION':
      return Tag
    case 'SPECIAL':
      return Sparkles
    default:
      return Package
  }
}

export function getTypeLabel(type: string) {
  switch (type) {
    case 'PROMOTION':
      return 'Promocion'
    case 'SPECIAL':
      return 'Especial'
    default:
      return 'Paquete'
  }
}

export function getRenewalLabel(type: string | null) {
  return type === 'AUTO' ? 'Automatica' : 'Manual'
}

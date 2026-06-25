export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function parseNumeric(value: string | null | undefined): number {
  if (!value) return 0
  return parseFloat(value)
}

export function capitalize(str: string | null | undefined): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'min' : 'min'}`
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'h' : 'h'}`
  if (diffDays < 30) return `hace ${diffDays} ${diffDays === 1 ? 'd' : 'd'}`
  return formatDate(date)
}

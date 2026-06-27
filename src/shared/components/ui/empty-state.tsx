import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Sin datos',
  description = 'No hay información disponible.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="size-16 rounded-3xl dark:bg-white/5 bg-black/5 flex items-center justify-center mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

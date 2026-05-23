import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Sin datos',
  description = 'No hay información disponible.',
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="size-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

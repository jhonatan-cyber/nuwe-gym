import { Badge } from '#/shared/components/ui/badge'
import { ROLE_COLORS, ROLE_LABELS } from '#/features/users/types.ts'
import type { UserRole } from '#/features/users/types.ts'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const colorClass =
    ROLE_COLORS[role as UserRole] || 'bg-muted text-muted-foreground border-none'
  return (
    <Badge className={`${colorClass} border-none font-bold`}>
      {ROLE_LABELS[role as UserRole] || role}
    </Badge>
  )
}

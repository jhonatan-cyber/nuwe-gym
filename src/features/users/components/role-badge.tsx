import { Badge } from '#/shared/components/ui/badge'
import { getRoleColor } from '#/features/users/types.ts'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge className={`${getRoleColor(role)} border-none font-bold`}>
      {role}
    </Badge>
  )
}

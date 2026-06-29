import { useState } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'
import { Badge } from '#/shared/components/ui/badge.tsx'
import { ROLES_INFO } from '#/features/users/types.ts'
import type { UserRole } from '#/features/users/types.ts'

interface RolesViewProps {
  adminCount: number
  receptionistCount: number
  trainerCount: number
}

export function RolesView({
  adminCount,
  receptionistCount,
  trainerCount,
}: RolesViewProps) {
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null)

  return (
    <div className="space-y-5">
      <p className="text-sm font-black tracking-tight">
        Roles y Permisos del Sistema
      </p>
      <p className="text-xs text-muted-foreground">
        Cada rol define un conjunto de permisos que determinan qué puede ver y
        hacer un usuario en el sistema.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {ROLES_INFO.map((roleInfo) => {
          const isExpanded = expandedRole === roleInfo.role
          const userCount =
            roleInfo.role === 'ADMIN'
              ? adminCount
              : roleInfo.role === 'RECEPTIONIST'
                ? receptionistCount
                : trainerCount

          const IconComponent =
            roleInfo.role === 'ADMIN'
              ? ShieldAlert
              : roleInfo.role === 'RECEPTIONIST'
                ? ShieldCheck
                : Shield

          return (
            <Card
              key={roleInfo.role}
              className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                isExpanded ? 'ring-2 ring-primary/30' : ''
              }`}
              onClick={() =>
                setExpandedRole(isExpanded ? null : roleInfo.role)
              }
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center ${
                        roleInfo.role === 'ADMIN'
                          ? 'bg-red-500/10'
                          : roleInfo.role === 'RECEPTIONIST'
                            ? 'bg-blue-500/10'
                            : 'bg-amber-500/10'
                      }`}
                    >
                      <IconComponent
                        className={`size-5 ${
                          roleInfo.role === 'ADMIN'
                            ? 'text-red-500'
                            : roleInfo.role === 'RECEPTIONIST'
                              ? 'text-blue-500'
                              : 'text-amber-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{roleInfo.label}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {userCount} usuario{userCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {roleInfo.permissions.length} permisos
                    </Badge>
                    <Info
                      className={`size-4 text-muted-foreground transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/10 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {roleInfo.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {roleInfo.permissions.map((perm, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-foreground/80"
                        >
                          <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                          <span>{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

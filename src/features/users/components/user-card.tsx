import {
  Mail,
  IdCard,
  Phone,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { RoleBadge } from '#/features/users/components/role-badge.tsx'
import type { StaffUser } from '#/features/users/types.ts'
import { cn } from '#/shared/lib/utils.ts'

// ── UserCardSkeleton ──────────────────────────────────────────────────

interface UserCardSkeletonProps {
  index: number
}

export function UserCardSkeleton({ index }: UserCardSkeletonProps) {
  return (
    <div
      key={index}
      className="flex flex-col p-6 rounded-[2rem] border border-border/10 bg-card space-y-3 shadow-md relative overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="h-6 w-24 bg-muted animate-pulse rounded" />
      <div className="space-y-2 pt-2 border-t border-border/5">
        <div className="h-3 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}

// ── UserCard ──────────────────────────────────────────────────────────

interface UserCardProps {
  user: StaffUser
  currentUserId: string
  setViewUserId: (id: string | null) => void
  setEditingUser: (user: StaffUser | null) => void
  handleDeleteUser: (id: string) => void
}

export function UserCard({
  user,
  currentUserId,
  setViewUserId,
  setEditingUser,
  handleDeleteUser,
}: UserCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-6 rounded-[2rem] border transition-all duration-200 bg-card border-border/10 shadow-md hover:shadow-xl hover:border-border/20 relative overflow-hidden',
        user.banned && 'opacity-60 bg-muted/30 border-border/5',
      )}
    >
      {/* ambient glow for premium look */}
      <div className="absolute -top-12 -left-12 size-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header: Avatar + Nombre + Email */}
      <div className="flex items-start gap-3 relative z-10">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="size-11 rounded-full object-cover shrink-0 ring-2 ring-foreground/10"
          />
        ) : (
          <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-foreground/10">
            <span className="text-sm font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-black text-sm text-foreground truncate max-w-[140px] sm:max-w-none">
              {user.name}
            </h4>
            {user.id === currentUserId && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                Vos
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <Mail className="size-3 shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
        </div>
      </div>

      {/* Badges de Rol y Estado */}
      <div className="flex gap-2 mt-3 flex-wrap relative z-10">
        <RoleBadge role={user.role} />
        <Badge
          className={cn(
            'border font-semibold text-[10px] px-2 py-0.5 shadow-none',
            user.banned
              ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
          )}
        >
          {user.banned ? 'Inactivo' : 'Activo'}
        </Badge>
      </div>

      {/* Datos Detallados */}
      <div className="mt-4 space-y-2 border-t border-border/5 pt-3 text-xs relative z-10">
        {user.documentNumber && (
          <div className="flex items-center gap-2 text-foreground/80">
            <IdCard className="size-3.5 text-muted-foreground shrink-0" />
            <span className="font-mono text-[11px]">{user.documentNumber}</span>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center gap-2 text-foreground/70">
            <Phone className="size-3.5 text-muted-foreground shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
        {user.address && (
          <div className="flex items-center gap-2 text-foreground/70">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="line-clamp-1">{user.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
          <span>
            Registrado:{' '}
            {new Date(user.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/5 relative z-10">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs font-semibold px-3"
          onClick={() => setViewUserId(user.id)}
        >
          <Eye className="size-3.5 mr-1" /> Detalle
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs font-semibold px-3"
          onClick={() => setEditingUser(user)}
        >
          <Edit2 className="size-3.5 mr-1" /> Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3"
          disabled={user.id === currentUserId}
          onClick={() => handleDeleteUser(user.id)}
        >
          <Trash2 className="size-3.5 mr-1" /> Eliminar
        </Button>
      </div>
    </div>
  )
}

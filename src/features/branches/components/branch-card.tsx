import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Pencil,
  PowerOff,
  Power,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { cn } from '#/shared/lib/utils.ts'
import type { Branch } from '#/features/branches/types.ts'

// ── BranchCardSkeleton ────────────────────────────────────────────────

interface BranchCardSkeletonProps {
  index: number
}

export function BranchCardSkeleton({ index }: BranchCardSkeletonProps) {
  return (
    <div
      key={index}
      className="flex flex-col p-6 rounded-[2rem] border border-border/10 bg-card space-y-3 shadow-md relative overflow-hidden animate-pulse"
    >
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-48 bg-muted rounded" />
        </div>
      </div>
      <div className="h-6 w-24 bg-muted rounded" />
      <div className="space-y-2 pt-2 border-t border-border/5">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    </div>
  )
}

// ── BranchCard ────────────────────────────────────────────────────────

interface BranchCardProps {
  branch: Branch
  onEdit: (branch: Branch) => void
  onToggleActive: (branch: Branch) => void
}

export function BranchCard({ branch, onEdit, onToggleActive }: BranchCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-6 rounded-[2rem] border transition-all duration-200 bg-card border-border/10 shadow-md hover:shadow-xl hover:border-border/20 relative overflow-hidden',
        !branch.isActive && 'opacity-60 bg-muted/30 border-border/5',
      )}
    >
      {/* ambient glow for premium look */}
      <div className="absolute -top-12 -left-12 size-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header: Icon + Name */}
      <div className="flex items-start gap-3 relative z-10">
        <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-foreground/10">
          <Store className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-black text-sm text-foreground truncate">
            {branch.name}
          </h4>
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{branch.address || 'Sin dirección'}</span>
          </p>
        </div>
      </div>

      {/* State Badge */}
      <div className="flex gap-2 mt-3 flex-wrap relative z-10">
        <Badge
          className={cn(
            'border font-semibold text-[10px] px-2 py-0.5 shadow-none',
            branch.isActive
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
              : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
          )}
        >
          {branch.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>

      {/* Detailed Info */}
      <div className="mt-4 space-y-2 border-t border-border/5 pt-3 text-xs relative z-10">
        {branch.phone && (
          <div className="flex items-center gap-2 text-foreground/70">
            <Phone className="size-3.5 text-muted-foreground shrink-0" />
            <span>{branch.phone}</span>
          </div>
        )}
        {branch.email && (
          <div className="flex items-center gap-2 text-foreground/70">
            <Mail className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{branch.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <span>
            Horario: {branch.openingTime || '08:00'} - {branch.closingTime || '22:00'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/5 relative z-10">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs font-semibold px-3"
          onClick={() => onEdit(branch)}
        >
          <Pencil className="size-3.5 mr-1" /> Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 rounded-full text-xs font-semibold px-3',
            branch.isActive
              ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
              : 'text-green-500 hover:text-green-600 hover:bg-green-50',
          )}
          onClick={() => onToggleActive(branch)}
        >
          {branch.isActive ? (
            <>
              <PowerOff className="size-3.5 mr-1" /> Desactivar
            </>
          ) : (
            <>
              <Power className="size-3.5 mr-1" /> Activar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

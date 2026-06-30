import { Calendar, Clock, CreditCard, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { Separator } from '#/shared/components/ui/separator'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'
import {
  getInitials,
  getSubscriptionProgress,
  getSubscriptionStatus,
} from '../utils.ts'
import type { Subscription } from '../types.ts'

interface SubscriptionDetailDialogProps {
  subscription: Subscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StatusBadge({ status, endDate }: { status: string; endDate: Date }) {
  const now = new Date()
  if (status === 'CANCELLED' || status === 'CANCELED')
    return (
      <Badge variant="destructive" className="font-bold text-[10px] uppercase tracking-wider">
        Cancelada
      </Badge>
    )
  if (new Date(endDate) < now)
    return (
      <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 font-bold text-[10px] uppercase tracking-wider border-orange-500/10">
        Vencida
      </Badge>
    )
  return (
    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 font-bold text-[10px] uppercase tracking-wider">
      Activa
    </Badge>
  )
}

export function SubscriptionDetailDialog({
  subscription: sub,
  open,
  onOpenChange,
}: SubscriptionDetailDialogProps) {
  if (!sub) return null

  const status = getSubscriptionStatus(sub)
  const { daysRemaining, daysExpired, percent, progressColor } =
    getSubscriptionProgress(sub)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[calc(100vw-2rem)] max-h-[85vh] rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-black text-lg">Detalle de Suscripción</DialogTitle>
          <DialogDescription className="text-xs">
            Información completa de la suscripción #{sub.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto overscroll-contain scrollbar-none flex-1 min-h-0">
          {/* Member Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            {sub.member.photoUrl ? (
              <img
                src={sub.member.photoUrl}
                alt={sub.member.fullName}
                className="size-12 sm:size-14 rounded-full object-cover border-2 border-primary/20 shadow-md shrink-0"
              />
            ) : (
              <div className="size-12 sm:size-14 rounded-full bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/25 dark:to-primary/5 border-2 border-primary/20 flex items-center justify-center font-bold text-sm uppercase text-primary shadow-inner shrink-0">
                {getInitials(sub.member.fullName)}
              </div>
            )}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="font-bold text-base text-foreground truncate">{sub.member.fullName}</h3>
              <p className="text-xs text-muted-foreground">CI: {sub.member.documentNumber || '—'}</p>
              {sub.member.email && (
                <p className="text-xs text-muted-foreground truncate">{sub.member.email}</p>
              )}
              {sub.member.phone && (
                <p className="text-xs text-muted-foreground">{sub.member.phone}</p>
              )}
            </div>
            <div className="shrink-0">
              <StatusBadge status={sub.status} endDate={new Date(sub.endDate)} />
            </div>
          </div>

          <Separator />

          {/* Package Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h4 className="font-bold text-sm">Paquete</h4>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate">{sub.package?.name || 'N/A'}</span>
                <span className="text-sm font-black text-primary shrink-0">{formatCurrency(sub.package?.price || 0)}</span>
              </div>
              {sub.package?.durationDays && (
                <p className="text-xs text-muted-foreground">Duración: {sub.package.durationDays} días</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <h4 className="font-bold text-sm">Período</h4>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inicio:</span>
                <span className="font-semibold">{formatDate(sub.startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Fin:</span>
                <span className="font-semibold">{formatDate(sub.endDate)}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-bold">{Math.round(percent)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {status === 'ACTIVE' ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <Clock className="size-3" />
                      Quedan {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                    </span>
                  ) : status === 'EXPIRED' ? (
                    <span className="text-xs text-orange-500 flex items-center gap-1">
                      <Clock className="size-3" />
                      Vencido hace {daysExpired} {daysExpired === 1 ? 'día' : 'días'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Cancelada</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Branch */}
          {sub.member.branch && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <h4 className="font-bold text-sm">Sucursal</h4>
                </div>
                <div className="bg-muted/50 rounded-2xl p-3 sm:p-4">
                  <p className="text-sm font-semibold">{sub.member.branch.name}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

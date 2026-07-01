import { AlertTriangle, Calendar, Clock, XCircle, Eye, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '#/shared/components/ui/alert-dialog'
import {
  getInitials,
  getSubscriptionProgress,
  getSubscriptionStatus,
} from '../utils.ts'
import type { Subscription } from '../types.ts'

interface SubscriptionCardProps {
  sub: Subscription
  isReadOnly: boolean
  onCancel: (id: string) => void
  onViewDetails?: (sub: Subscription) => void
  showBranch?: boolean
}

function StatusBadge({ status, endDate }: { status: string; endDate: Date }) {
  const now = new Date()
  if (status === 'CANCELLED' || status === 'CANCELED')
    return (
      <Badge
        variant="destructive"
        className="font-bold text-[10px] uppercase tracking-wider"
      >
        Cancelada
      </Badge>
    )
  if (new Date(endDate) < now)
    return (
      <Badge
        variant="secondary"
        className="bg-orange-500/15 text-orange-600 font-bold text-[10px] uppercase tracking-wider border-orange-500/10"
      >
        Vencida
      </Badge>
    )
  return (
    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 font-bold text-[10px] uppercase tracking-wider">
      Activa
    </Badge>
  )
}

export function SubscriptionCard({
  sub,
  isReadOnly,
  onCancel,
  onViewDetails,
  showBranch,
}: SubscriptionCardProps) {
  const status = getSubscriptionStatus(sub)
  const { daysRemaining, daysExpired, percent, progressColor } =
    getSubscriptionProgress(sub)

  return (
    <div className="group relative rounded-3xl border dark:border-white/8 border-black/8 p-5 flex flex-col justify-between gap-4.5 bg-card hover:shadow-xl hover:border-foreground/20 transition-all duration-300 min-h-[220px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {sub.member.photoUrl ? (
            <img
              src={sub.member.photoUrl}
              alt={sub.member.fullName}
              className="size-10 rounded-full object-cover shrink-0 border border-primary/10 shadow-sm"
            />
          ) : (
            <div className="size-10 rounded-full bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/25 dark:to-primary/5 border border-primary/10 flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0 shadow-inner">
              {getInitials(sub.member.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <h3
              className="font-bold text-sm leading-tight text-foreground truncate"
              title={sub.member.fullName}
            >
              {sub.member.fullName}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              CI: {sub.member.documentNumber || '—'}
            </p>
            {showBranch && sub.member.branch && (
              <p className="text-[10px] font-semibold text-primary mt-0.5">
                {sub.member.branch.name}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={sub.status} endDate={new Date(sub.endDate)} />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              Paquete de membresía
            </p>
            <p
              className="text-xs font-black text-foreground mt-0.5 truncate"
              title={sub.package?.name || 'N/A'}
            >
              {sub.package?.name || 'N/A'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-sm text-primary">
              {formatCurrency(sub.package?.price || 0)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-bold">
            {status === 'ACTIVE' ? (
              daysRemaining <= 5 ? (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="size-3 shrink-0" />
                  ¡Vence pronto! Quedan {daysRemaining}{' '}
                  {daysRemaining === 1 ? 'día' : 'días'}
                </span>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />
                  Quedan {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                </span>
              )
            ) : status === 'EXPIRED' ? (
              <span className="text-orange-500/80 flex items-center gap-1">
                <AlertTriangle className="size-3 shrink-0" />
                Vencido hace {daysExpired} {daysExpired === 1 ? 'día' : 'días'}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1">
                <XCircle className="size-3 shrink-0" />
                Suscripción cancelada
              </span>
            )}
            <span className="text-muted-foreground/60">
              {Math.round(percent)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t dark:border-white/5 border-black/5 pt-3 mt-1.5 text-[10px] text-muted-foreground font-semibold">
        <div className="flex items-center gap-1">
          <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
          <span>{formatDate(sub.startDate)}</span>
        </div>
        <span>al</span>
        <div>
          <span>{formatDate(sub.endDate)}</span>
        </div>
      </div>

      {sub.remainingBalance > 0 && status === 'ACTIVE' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-500 flex items-center gap-1 font-bold">
              <DollarSign className="size-3 shrink-0" />
              Saldo: {formatCurrency(sub.remainingBalance)}
            </span>
            <span className="text-muted-foreground/60">
              {Math.round((sub.totalPaid / sub.totalAmount) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${(sub.totalPaid / sub.totalAmount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!isReadOnly && (
        <div className="grid transition-[grid-template-rows] duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="flex flex-col gap-1.5 pt-1">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full gap-1.5 h-8 text-xs font-semibold"
                  onClick={() => onViewDetails(sub)}
                >
                  <Eye className="size-3.5" /> Ver Detalles
                </Button>
              )}
              {status === 'ACTIVE' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full rounded-full gap-1.5 h-8 text-xs font-semibold"
                    >
                      <XCircle className="size-3.5" /> Cancelar Suscripción
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black">
                        Cancelar Suscripción
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs font-semibold leading-relaxed">
                        ¿Está seguro de cancelar esta suscripción? El socio perderá el
                        acceso inmediatamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel asChild>
                        <Button className="rounded-full h-10 px-5 border">
                          Volver
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          variant="destructive"
                          onClick={() => onCancel(sub.id)}
                          className="rounded-full h-10 px-5"
                        >
                          Confirmar Cancelación
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

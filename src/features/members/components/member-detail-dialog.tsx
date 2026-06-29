import { useQuery } from '@tanstack/react-query'
import {
  RefreshCw,
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { getMemberById } from '#/features/members/server.ts'
import { getMemberRenewalHistory } from '#/features/renewals/server.ts'
import { getMemberChurnRisk } from '#/features/analytics/server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { cn } from '#/shared/lib/utils.ts'

interface MemberDetailDialogProps {
  memberId: string | null
  onOpenChange: (open: boolean) => void
}

export function MemberDetailDialog({
  memberId,
  onOpenChange,
}: MemberDetailDialogProps) {
  const { data: memberDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['member-detail', memberId],
    queryFn: () => getMemberById({ data: memberId! }),
    enabled: !!memberId,
  })

  const { data: renewalHistory = [] } = useQuery({
    queryKey: ['member-renewal-history', memberId],
    queryFn: () => getMemberRenewalHistory({ data: { memberId: memberId! } }),
    enabled: !!memberId,
  })

  return (
    <Dialog
      open={!!memberId}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-x-hidden overflow-y-auto scrollbar-none p-0 gap-0">
        {loadingDetail ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span className="text-sm">Cargando datos del socio...</span>
          </div>
        ) : memberDetail ? (
          <>
            {/* ── Hero header ── */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b dark:border-white/[0.05] border-black/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                {/* Avatar */}
                {memberDetail.photoUrl ? (
                  <div className="size-14 rounded-2xl ring-2 ring-foreground/10 overflow-hidden shrink-0 shadow">
                    <img
                      src={memberDetail.photoUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 flex items-center justify-center font-black text-base uppercase shrink-0 text-foreground tracking-wider shadow-inner select-none">
                    {memberDetail.fullName
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h2 className="text-lg font-black dark:text-white text-foreground tracking-tight leading-none truncate">
                      {memberDetail.fullName}
                    </h2>
                    <Badge
                      className={cn(
                        'font-bold text-[10px] py-0.5 px-2.5 rounded-full select-none shrink-0',
                        memberDetail.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20',
                      )}
                    >
                      {memberDetail.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Socio desde {formatDate(memberDetail.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 space-y-6">
              {/* Datos personales */}
              <section>
                <SectionTitle icon={User} label="Datos personales" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
                  <DataRow
                    icon={User}
                    label="CI / Documento"
                    value={memberDetail.documentNumber || '—'}
                  />
                  <DataRow
                    icon={Calendar}
                    label="Fecha de nac."
                    value={
                      memberDetail.birthDate
                        ? formatDate(memberDetail.birthDate)
                        : '—'
                    }
                  />
                  <DataRow
                    icon={Phone}
                    label="Teléfono"
                    value={memberDetail.phone || '—'}
                  />
                  <DataRow
                    icon={Mail}
                    label="Email"
                    value={memberDetail.email || '—'}
                  />
                  <DataRow
                    icon={Heart}
                    label="Contacto emerg."
                    value={memberDetail.emergencyContactName || '—'}
                  />
                  <DataRow
                    icon={Phone}
                    label="Tel. emergencia"
                    value={memberDetail.emergencyContactPhone || '—'}
                  />
                  {memberDetail.address && (
                    <div className="col-span-2">
                      <DataRow
                        icon={MapPin}
                        label="Dirección"
                        value={memberDetail.address}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Historial de membresías */}
              <section>
                <SectionTitle
                  icon={RefreshCw}
                  label="Historial de membresías"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {renewalHistory.length === 0 ? (
                    <div className="col-span-2 py-8 rounded-2xl border dark:border-white/[0.04] border-black/[0.04] bg-muted/40 text-center text-sm text-muted-foreground">
                      Sin membresías registradas.
                    </div>
                  ) : (
                    renewalHistory.map((sub: any) => {
                      const hasPayment = sub.payments.length > 0
                      const lastPayment = sub.payments[0]
                      const active = sub.status === 'ACTIVE'
                      const expired = sub.status === 'EXPIRED'
                      return (
                        <div
                          key={sub.id}
                          className="flex flex-col gap-2 px-4 py-3 rounded-xl border dark:border-white/[0.04] border-black/[0.04] bg-foreground/[0.015] hover:bg-foreground/[0.03] transition-colors"
                        >
                          {/* Nombre + dot */}
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'size-1.5 rounded-full shrink-0',
                                active
                                  ? 'bg-emerald-500'
                                  : expired
                                    ? 'bg-red-400'
                                    : 'bg-muted-foreground/40',
                              )}
                            />
                            <p className="font-bold text-sm truncate flex-1">
                              {sub.package?.name || sub.plan?.name || 'N/A'}
                            </p>
                          </div>

                          {/* Período */}
                          <p className="text-[11px] text-muted-foreground pl-3.5">
                            {formatDate(sub.startDate)}
                            <span className="mx-1 opacity-30">→</span>
                            {formatDate(sub.endDate)}
                          </p>

                          {/* Pago + Badge */}
                          <div className="flex items-center justify-between pl-3.5 gap-2">
                            {hasPayment ? (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                                <CreditCard className="size-3 shrink-0" />
                                <span className="font-semibold text-foreground">
                                  {formatCurrency(lastPayment.amount)}
                                </span>
                                <span className="uppercase font-bold tracking-wide opacity-60 truncate">
                                  {lastPayment.paymentMethod}
                                </span>
                              </div>
                            ) : (
                              <span />
                            )}
                            <Badge
                              className={cn(
                                'font-bold text-[9px] py-0.5 px-2 rounded-full select-none shrink-0',
                                active
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : expired
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
                              )}
                            >
                              {active
                                ? 'Activa'
                                : expired
                                  ? 'Vencida'
                                  : sub.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              {/* Riesgo de abandono */}
              <ChurnRiskSection memberId={memberDetail.id} />
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-destructive text-sm">
            Error al cargar el socio
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t dark:border-white/[0.05] border-black/[0.05]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-primary" />
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </h4>
    </div>
  )
}

function ChurnRiskSection({ memberId }: { memberId: string }) {
  const { data: risk, isLoading } = useQuery({
    queryKey: ['member-churn-risk', memberId],
    queryFn: () => getMemberChurnRisk({ data: { memberId } }),
    enabled: !!memberId,
  })

  if (isLoading || !risk) return null

  const levelConfig = {
    LOW: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Bajo' },
    MEDIUM: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Medio' },
    HIGH: { color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', label: 'Alto' },
    CRITICAL: { color: 'text-red-500 bg-red-500/10 border-red-500/20', label: 'Critico' },
  }

  const cfg = levelConfig[risk.level]

  return (
    <section>
      <SectionTitle icon={Heart} label="Riesgo de abandono" />
      <div className="mt-3 p-4 rounded-2xl border dark:border-white/[0.04] border-black/[0.04] bg-foreground/[0.015] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">Score</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {risk.score}/100 · {cfg.label}
          </span>
        </div>
        {risk.factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Factores</p>
            <ul className="space-y-0.5">
              {risk.factors.map((f, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-foreground/30 mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function DataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="size-6 rounded-md dark:bg-white/5 bg-black/5 border dark:border-white/[0.06] border-black/[0.06] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
          {label}
        </p>
        <p className="font-semibold text-sm mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

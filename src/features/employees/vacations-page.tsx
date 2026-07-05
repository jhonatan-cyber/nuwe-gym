import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  Plus,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Umbrella,
  Sun,
} from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { cn } from '#/shared/lib/utils.ts'
import { SearchInput } from '#/shared/components/search-input.tsx'
import {
  getVacations,
  approveRejectVacation,
  cancelVacation,
} from './vacation-server.ts'
import {
  VACATION_STATUS_LABELS,
  VACATION_STATUS_COLORS,
} from './vacation-types.ts'
import type { VacationStatus } from './vacation-types.ts'
import { RequestVacationDialog } from './components/request-vacation-dialog.tsx'

// ── Main Page ──

export function VacationsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: vacations, isLoading, error } = useQuery({
    queryKey: ['vacations'],
    queryFn: () => getVacations({ data: { employeeId: '' } }),
    refetchInterval: 30_000,
  })

  const approveMutation = useMutation({
    mutationFn: approveRejectVacation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
      toast.success('Vacaciones actualizadas')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelVacation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
      toast.success('Vacaciones canceladas')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const filtered = vacations?.filter(
    (v) =>
      !search ||
      v.employee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      v.status.toLowerCase().includes(search.toLowerCase()),
  )

  const pendingCount = vacations?.filter((v) => v.status === 'PENDING').length ?? 0

  if (error) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">RRHH</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Vacaciones</span>
          </div>
        }
        title="Vacaciones"
      >
        <Card className="rounded-[2rem] border-border/10 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Error al cargar vacaciones</p>
          </CardContent>
        </Card>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">RRHH</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground font-semibold">Vacaciones</span>
        </div>
      }
      title="Vacaciones"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Acciones
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-primary/10 text-primary hover:bg-primary/15"
            >
              <Plus className="size-4 shrink-0" />
              Solicitar Vacaciones
            </Button>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Resumen
            </p>
            <Card className="rounded-2xl border-border/5 bg-muted/10">
              <CardContent className="p-3 flex items-center gap-3">
                <CalendarCheck className="size-5 text-amber-500" />
                <div>
                  <p className="text-lg font-black">{pendingCount}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    Solicitudes pendientes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Info
            </p>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              Las vacaciones se calculan automáticamente: 15 días base + 1 día adicional por año de
              antigüedad (máx. 30). Las solicitudes pendientes requieren aprobación del admin.
            </p>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card p-6">
          <div className="space-y-3 animate-pulse">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </Card>
      ) : !vacations || vacations.length === 0 ? (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sun className="size-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold mb-1">Sin solicitudes de vacaciones</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              No hay solicitudes registradas. Usá el botón para solicitar vacaciones.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative">
          <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Umbrella className="size-5" />
                Solicitudes de Vacaciones
              </CardTitle>
              <CardDescription>
                {filtered?.length ?? 0} solicitud{(filtered?.length ?? 0) !== 1 ? 'es' : ''}
                {search ? ` coinciden con "${search}"` : ''}
                {pendingCount > 0 && ` · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
            <SearchInput
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="relative z-10 p-0">
            <div className="divide-y divide-border/5">
              {filtered?.map((v) => (
                <div key={v.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {v.employee?.fullName ?? '—'}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0',
                          VACATION_STATUS_COLORS[v.status as VacationStatus],
                        )}
                      >
                        {VACATION_STATUS_LABELS[v.status as VacationStatus]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.startDate).toLocaleDateString('es-AR')} →{' '}
                      {new Date(v.endDate).toLocaleDateString('es-AR')} · {v.daysCount} día{v.daysCount !== 1 ? 's' : ''} · {v.year}
                    </p>
                    {v.reason && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1 italic">
                        "{v.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {v.status === 'PENDING' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            approveMutation.mutate({ data: { id: v.id, status: 'APPROVED' } })
                          }
                          className="rounded-full h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          title="Aprobar"
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Motivo del rechazo (opcional):')
                            approveMutation.mutate({
                              data: { id: v.id, status: 'REJECTED', rejectionReason: reason ?? '' },
                            })
                          }}
                          className="rounded-full h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          title="Rechazar"
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </>
                    )}
                    {v.status === 'APPROVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate({ data: { id: v.id } })}
                        className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-amber-500"
                        title="Cancelar"
                      >
                        <Ban className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RequestVacationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </ModuleLayout>
  )
}

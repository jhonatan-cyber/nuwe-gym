import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  AlertCircle,
  Users,
  Search,
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
import { Input } from '#/shared/components/ui/input'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { Badge } from '#/shared/components/ui/badge'
import { Separator } from '#/shared/components/ui/separator'
import { cn } from '#/shared/lib/utils.ts'
import {
  getTodayAttendance,
  clockIn,
  clockOut,
  markAbsent,
} from './attendance-server.ts'
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from './attendance-types.ts'
import type { TodayAttendanceRow } from './attendance-types.ts'
import { HistoryDialog } from './components/history-dialog.tsx'

// ── Stat Card ──

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('rounded-xl px-3 py-2 flex items-center gap-2 border', color)}>
      <span className="text-lg font-black">{value}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  )
}

// ── Attendance Row ──

function EmployeeRow({
  row,
  onClockIn,
  onClockOut,
  onMarkAbsent,
  onViewHistory,
  isPending,
}: {
  row: TodayAttendanceRow
  onClockIn: (id: string) => void
  onClockOut: (id: string) => void
  onMarkAbsent: (id: string) => void
  onViewHistory: (row: TodayAttendanceRow) => void
  isPending: boolean
}) {
  const isClockedIn = !!row.clockIn && !row.clockOut
  const isComplete = !!row.clockIn && !!row.clockOut
  const isAbsent = row.attendanceStatus === 'ABSENT' || row.attendanceStatus === 'ABSENT_WITH_NOTICE'

  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors gap-3">
      <button
        className="flex items-center gap-3 min-w-0 flex-1 text-left"
        onClick={() => onViewHistory(row)}
        title="Ver historial"
      >
        <div
          className={cn(
            'size-2 shrink-0 rounded-full',
            isClockedIn ? 'bg-emerald-500 animate-pulse' : isComplete ? 'bg-emerald-500/50' : isAbsent ? 'bg-red-400' : 'bg-zinc-300',
          )}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{row.fullName}</p>
          <p className="text-[10px] text-muted-foreground">
            {row.position} · {row.employeeCode}
            {row.department ? ` · ${row.department}` : ''}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        {isClockedIn ? (
          <>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {new Date(row.clockIn!).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onClockOut(row.employeeId)}
              disabled={isPending}
              className="rounded-full h-7 text-[10px] font-semibold px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <LogOut className="size-3 mr-1" />
              Salida
            </Button>
          </>
        ) : isComplete ? (
          <Badge variant="outline" className={cn('text-[10px] font-bold', ATTENDANCE_STATUS_COLORS[row.attendanceStatus as keyof typeof ATTENDANCE_STATUS_COLORS])}>
            {ATTENDANCE_STATUS_LABELS[row.attendanceStatus as keyof typeof ATTENDANCE_STATUS_LABELS]}
          </Badge>
        ) : isAbsent ? (
          <Badge variant="outline" className="text-[10px] font-bold bg-red-500/10 text-red-600 border-red-500/20">
            Ausente
          </Badge>
        ) : (
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => onClockIn(row.employeeId)}
              disabled={isPending}
              className="rounded-full h-7 text-[10px] font-semibold px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <LogIn className="size-3 mr-1" />
              Entrada
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAbsent(row.employeeId)}
              disabled={isPending}
              className="rounded-full h-7 text-[10px] font-semibold px-2 text-muted-foreground hover:text-red-600"
            >
              Ausente
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──

export function AttendancePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [historyTarget, setHistoryTarget] = useState<TodayAttendanceRow | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: getTodayAttendance,
    refetchInterval: 30_000, // auto-refresh every 30s
  })

  const rows = data?.rows ?? []
  const summary = data?.summary

  const clockInMutation = useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] })
      toast.success('Entrada registrada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const clockOutMutation = useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] })
      toast.success('Salida registrada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const markAbsentMutation = useMutation({
    mutationFn: markAbsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] })
      toast.success('Ausencia registrada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isPending = clockInMutation.isPending || clockOutMutation.isPending || markAbsentMutation.isPending

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(search.toLowerCase()),
  )

  function handleClockIn(employeeId: string) {
    clockInMutation.mutate({ data: { employeeId } })
  }

  function handleClockOut(employeeId: string) {
    clockOutMutation.mutate({ data: { employeeId, notes: '' } })
  }

  function handleMarkAbsent(employeeId: string) {
    if (window.confirm('¿Marcar como ausente a este personal hoy?')) {
      markAbsentMutation.mutate({ data: { employeeId } })
    }
  }

  if (error) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">RRHH</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Asistencia</span>
          </div>
        }
        title="Asistencia"
      >
        <Card className="rounded-[2rem] border-border/10 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">Error al cargar asistencia</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
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
          <span className="text-foreground font-semibold">Asistencia</span>
        </div>
      }
      title="Asistencia del Personal"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Hoy
            </p>
            <div className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </>
              ) : (
                <>
                  <StatChip label="Presentes" value={summary?.present ?? 0} color="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" />
                  <StatChip label="Tardanza" value={summary?.late ?? 0} color="bg-amber-500/10 text-amber-600 border-amber-500/20" />
                  <StatChip label="Ausentes" value={summary?.absent ?? 0} color="bg-red-500/10 text-red-600 border-red-500/20" />
                  <StatChip label="Sin marcar" value={summary?.notMarked ?? 0} color="bg-zinc-500/10 text-zinc-600 border-zinc-500/20" />
                  <Separator className="border-border/5" />
                  <StatChip label="Total activos" value={summary?.total ?? 0} color="bg-blue-500/10 text-blue-600 border-blue-500/20" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Acciones
            </p>
            <div className="space-y-1 px-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hacé clic en <strong>Entrada</strong> o <strong>Salida</strong> para registrar la asistencia del personal.
                Los datos se actualizan automáticamente cada 30 segundos.
              </p>
            </div>
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
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="size-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold mb-1">No hay personal activo</h3>
              <p className="text-sm text-muted-foreground">
                Registrá personal en la sección Personal para poder controlar su asistencia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative transition-all duration-200">
          <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Clock className="size-5" />
                  Registro de Hoy
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}
                  <span className="font-semibold">{filtered.length}</span> persona{filtered.length !== 1 ? 's' : ''}
                  {search ? ` · "${search}"` : ''}
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-44 rounded-2xl border-border/10 h-8 pl-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-0 divide-y divide-border/5">
              {filtered.map((row) => (
                <EmployeeRow
                  key={row.employeeId}
                  row={row}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                  onMarkAbsent={handleMarkAbsent}
                  onViewHistory={setHistoryTarget}
                  isPending={isPending}
                />
              ))}
            </div>
            {filtered.length === 0 && search && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron personal con "{search}"
              </p>
            )}
          </CardContent>
          <div className="border-t border-border/5 px-6 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" /> En el gym
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500/50 inline-block" /> Completado
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-zinc-300 inline-block" /> Sin marcar
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-400 inline-block" /> Ausente
            </span>
            <button
              onClick={() => setHistoryTarget(null)}
              className="ml-auto text-primary hover:underline font-semibold"
            >
              {historyTarget ? 'Cerrar historial' : ''}
            </button>
          </div>
        </Card>
      )}

      {historyTarget && (
        <HistoryDialog
          employee={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </ModuleLayout>
  )
}



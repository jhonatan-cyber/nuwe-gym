import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  CalendarDays,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Clock,
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
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { Separator } from '#/shared/components/ui/separator'
import { cn } from '#/shared/lib/utils.ts'
import {
  getWeeklySchedule,
  getEmployeeSchedules,
  setEmployeeSchedules,
} from './schedule-server.ts'
import { DAY_LABELS, DAY_LABELS_SHORT } from './schedule-types.ts'
import type { EmployeeWithSchedule } from './schedule-types.ts'

// ── Editor for a single employee's schedules ──

interface SlotForm {
  dayOfWeek: number
  startTime: string
  endTime: string
}

function ScheduleEditor({
  employee,
  onClose,
}: {
  employee: EmployeeWithSchedule
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [slots, setSlots] = useState<SlotForm[]>(
    employee.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  )

  const mutation = useMutation({
    mutationFn: setEmployeeSchedules,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedule'] })
      if (result.conflicts.length > 0) {
        toast.warning(`Guardado con ${result.conflicts.length} conflicto(s) de horario`)
        result.conflicts.forEach((c) => toast.error(c))
      } else {
        toast.success(`${result.saved} horario(s) guardados`)
      }
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function addSlot() {
    setSlots([...slots, { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }])
  }

  function removeSlot(idx: number) {
    setSlots(slots.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof SlotForm, value: number | string) {
    setSlots(slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  function handleSave() {
    const valid = slots.filter((s) => s.startTime && s.endTime)
    mutation.mutate({
      data: {
        employeeId: employee.id,
        slots: valid.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          scheduleType: 'REGULAR' as const,
        })),
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border/10 max-w-xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black">{employee.fullName}</h3>
              <p className="text-xs text-muted-foreground">{employee.position} · {employee.employeeCode}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">✕</Button>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
                <Select
                  value={String(slot.dayOfWeek)}
                  onValueChange={(v) => updateSlot(idx, 'dayOfWeek', Number(v))}
                >
                  <SelectTrigger className="w-[120px] rounded-xl h-8 text-xs border-border/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((label, d) => (
                      <SelectItem key={d} value={String(d)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                  className="w-28 rounded-xl h-8 text-xs border-border/10"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                  className="w-28 rounded-xl h-8 text-xs border-border/10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlot(idx)}
                  className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            className="rounded-full mt-3 text-xs font-semibold"
          >
            <Plus className="size-3 mr-1" />
            Agregar horario
          </Button>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/5">
            <Button variant="ghost" onClick={onClose} className="rounded-full font-semibold">
              Cancelar
            </Button>
            <LoadingButton
              onClick={handleSave}
              isLoading={mutation.isPending}
              className="rounded-full font-bold"
            >
              <Save className="size-4 mr-1.5" />
              Guardar horarios
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Weekly grid cell ──

function WeekCell({ schedules }: { schedules: { startTime: string; endTime: string }[] }) {
  if (schedules.length === 0) return <div className="h-full min-h-[60px]" />
  return (
    <div className="space-y-1 h-full min-h-[60px]">
      {schedules.map((s, i) => (
        <div
          key={i}
          className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-1 rounded-lg text-center"
        >
          {s.startTime}–{s.endTime}
        </div>
      ))}
    </div>
  )
}

// ── Main Page ──

export function SchedulesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithSchedule | null>(null)
  const [search, setSearch] = useState('')

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['weeklySchedule'],
    queryFn: getWeeklySchedule,
    refetchInterval: 30_000,
  })

  const filtered = employees?.filter(
    (e) =>
      !search ||
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase()),
  )

  if (error) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">RRHH</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Horarios</span>
          </div>
        }
        title="Horarios"
      >
        <Card className="rounded-[2rem] border-border/10 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">Error al cargar horarios</p>
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
          <span className="text-foreground font-semibold">Horarios</span>
        </div>
      }
      title="Horarios de Empleados"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Semana
            </p>
            <div className="space-y-1 px-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>
                  {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Empleados
            </p>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              Hacé clic en un empleado para editar sus horarios semanales.
              El sistema detecta conflictos automáticamente.
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
      ) : !employees || employees.length === 0 ? (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="size-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold mb-1">Sin empleados activos</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              Registrá empleados activos para asignarles horarios semanales.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative transition-all duration-200">
          <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <CalendarDays className="size-5" />
                Horario Semanal
              </CardTitle>
              <CardDescription>
                {filtered?.length ?? 0} empleado{(filtered?.length ?? 0) !== 1 ? 's' : ''} con horarios
              </CardDescription>
            </div>
            <div className="relative">
              <Input
                placeholder="Buscar empleado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 rounded-2xl border-border/10 h-8 text-xs pl-3"
              />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row with days */}
              <div className="flex border-b border-border/5 pb-2 mb-2">
                <div className="w-[180px] shrink-0 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Empleado</span>
                </div>
                {DAY_LABELS_SHORT.map((day, i) => (
                  <div key={i} className="flex-1 text-center min-w-[70px] px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>

              {/* Employee rows */}
              <div className="divide-y divide-border/5">
                {filtered?.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="flex w-full text-left py-2 hover:bg-muted/20 transition-colors rounded-lg group"
                  >
                    <div className="w-[180px] shrink-0 px-2 py-1">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{emp.fullName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{emp.position}</p>
                    </div>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <div key={day} className="flex-1 min-w-[70px] px-1 py-1">
                        <WeekCell
                          schedules={emp.schedules
                            .filter((s) => s.dayOfWeek === day)
                            .map((s) => ({ startTime: s.startTime, endTime: s.endTime }))}
                        />
                      </div>
                    ))}
                  </button>
                ))}
              </div>

              {filtered?.length === 0 && search && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No se encontraron empleados con "{search}"
                </p>
              )}
            </div>
          </CardContent>
          <div className="border-t border-border/5 px-6 py-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            <span>Hacé clic en un empleado para editar sus horarios</span>
            <span className="ml-auto text-primary font-semibold">
              {employees?.reduce((sum, e) => sum + e.schedules.length, 0) ?? 0} horarios asignados
            </span>
          </div>
        </Card>
      )}

      {selectedEmployee && (
        <ScheduleEditor
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </ModuleLayout>
  )
}

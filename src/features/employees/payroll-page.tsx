import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  DollarSign,
  Plus,
  CalendarDays,
  Banknote,
  CheckCircle2,
  Trash2,
  Gift,
  Medal,
  Briefcase,
  Percent,
  TrendingUp,
  Users,
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
import { Separator } from '#/shared/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/shared/components/ui/tabs'
import { Textarea } from '#/shared/components/ui/textarea'
import { cn } from '#/shared/lib/utils.ts'
import { SearchInput } from '#/shared/components/search-input.tsx'
import { getPayrollRecords, generatePayroll, markPayrollPaid, getPayrollStats } from './payroll-server.ts'
import { getBonuses, createBonus, deleteBonus } from './bonus-server.ts'
import { getEmployees } from './server.ts'
import {
  getTrainerCommissionsForPeriod,
  getEmployeeCommissionBridge,
  createCommissionBonuses,
  getCommissionsDashboard,
} from './commission-server.ts'

// ── Generate Payroll Dialog ──

function GeneratePayrollDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [selectedAll, setSelectedAll] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [includeCommissions, setIncludeCommissions] = useState(false)

  const { data: employeesList } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const mutation = useMutation({
    mutationFn: generatePayroll,
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      const created = results.filter((r) => r.status === 'CREATED').length
      const skipped = results.filter((r) => r.status === 'YA_EXISTE').length
      toast.success(`Nómina generada: ${created} creada${skipped > 0 ? `, ${skipped} ya existían` : ''}`)
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!periodStart || !periodEnd) {
      toast.error('Seleccioná el período')
      return
    }
    mutation.mutate({
      data: {
        periodStart,
        periodEnd,
        employeeIds: selectedAll ? undefined : selectedEmployees,
        includeCommissions,
      },
    })
  }

  const activeEmployees = employeesList?.filter((e) => e.status === 'ACTIVE') ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Generar Nómina</DialogTitle>
          <DialogDescription>
            Seleccioná el período y los empleados para generar los recibos de sueldo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Período desde *</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="rounded-2xl border-border/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Período hasta *</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="rounded-2xl border-border/10" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allEmployees"
                checked={selectedAll}
                onChange={(e) => setSelectedAll(e.target.checked)}
                className="rounded border-border/10"
              />
              <Label htmlFor="allEmployees" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                Todos los empleados activos ({activeEmployees.length})
              </Label>
            </div>
            {!selectedAll && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {activeEmployees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 px-2 py-1 hover:bg-muted/20 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id])
                        else setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id))
                      }}
                      className="rounded border-border/10"
                    />
                    <span className="text-xs">{emp.fullName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Separator className="border-border/5" />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeCommissions"
              checked={includeCommissions}
              onChange={(e) => setIncludeCommissions(e.target.checked)}
              className="rounded border-border/10"
            />
            <Label htmlFor="includeCommissions" className="text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-500" />
              Incluir comisiones de entrenadores
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full font-semibold">Cancelar</Button>
            <LoadingButton type="submit" isLoading={mutation.isPending} className="rounded-full font-bold">
              <CalendarDays className="size-4 mr-1.5" />
              Generar Nómina
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Create Bonus Dialog ──

const BONUS_TYPES = [
  { value: 'PERFORMANCE', label: 'Desempeño' },
  { value: 'COMMISSION', label: 'Comisión' },
  { value: 'SPECIAL', label: 'Especial' },
  { value: 'HOLIDAY', label: 'Aguinaldo/Vacaciones' },
  { value: 'BIRTHDAY', label: 'Cumpleaños' },
  { value: 'OTHER', label: 'Otro' },
] as const

function CreateBonusDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [employeeId, setEmployeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState('OTHER')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: employeesList } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const mutation = useMutation({
    mutationFn: createBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      toast.success('Bonificación creada')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !amount || !reason) {
      toast.error('Completá todos los campos obligatorios')
      return
    }
    mutation.mutate({ data: { employeeId, amount, reason, type: type as any, date } })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Nueva Bonificación</DialogTitle>
          <DialogDescription>
            Creá una bonificación para un empleado. Se incluirá automáticamente en la próxima nómina.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Empleado *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="rounded-2xl border-border/10">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {employeesList?.filter((e) => e.status === 'ACTIVE').map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Monto *</Label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="rounded-2xl border-border/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-2xl border-border/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BONUS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Motivo *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Bono por desempeño mensual" className="rounded-2xl border-border/10" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl border-border/10" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full font-semibold">Cancelar</Button>
            <LoadingButton type="submit" isLoading={mutation.isPending} className="rounded-full font-bold">
              <Gift className="size-4 mr-1.5" />
              Crear Bonificación
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ──

export function PayrollPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('payroll')
  const [generateDialog, setGenerateDialog] = useState(false)
  const [bonusDialog, setBonusDialog] = useState(false)
  const [search, setSearch] = useState('')
  const [commissionPeriod, setCommissionPeriod] = useState(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  })

  const { data: payrollRecords, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => getPayrollRecords({ data: { employeeId: '', status: '' } }),
  })

  const { data: bonuses, isLoading: bonusesLoading } = useQuery({
    queryKey: ['bonuses'],
    queryFn: () => getBonuses({ data: { employeeId: '' } }),
  })

  const { data: stats } = useQuery({
    queryKey: ['payrollStats'],
    queryFn: getPayrollStats,
  })

  const { data: commissionData, isLoading: commissionLoading } = useQuery({
    queryKey: ['commissions-period', commissionPeriod.start, commissionPeriod.end],
    queryFn: () =>
      getTrainerCommissionsForPeriod({
        data: {
          periodStart: commissionPeriod.start,
          periodEnd: commissionPeriod.end,
        },
      }),
  })

  const { data: commissionBridge } = useQuery({
    queryKey: ['commission-bridge'],
    queryFn: getEmployeeCommissionBridge,
  })

  const { data: commissionDash } = useQuery({
    queryKey: ['commission-dashboard'],
    queryFn: getCommissionsDashboard,
  })

  const markPaidMutation = useMutation({
    mutationFn: markPayrollPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      toast.success('Nómina marcada como pagada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteBonusMutation = useMutation({
    mutationFn: deleteBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      toast.success('Bonificación eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const filteredPayroll = payrollRecords?.filter(
    (r) =>
      !search ||
      r.employee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredBonuses = bonuses?.filter(
    (b) =>
      !search ||
      b.employee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">RRHH</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground font-semibold">Sueldos</span>
        </div>
      }
      title="Sueldos y Bonificaciones"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Acciones</p>
            <Button
              onClick={() => setGenerateDialog(true)}
              className="w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-primary/10 text-primary hover:bg-primary/15"
            >
              <CalendarDays className="size-4 shrink-0" />
              Generar Nómina
            </Button>
            <Button
              onClick={() => setBonusDialog(true)}
              className="w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-amber-500/10 text-amber-600 hover:bg-amber-500/15"
            >
              <Gift className="size-4 shrink-0" />
              Nueva Bonificación
            </Button>
          </div>

          {stats && (
            <div className="space-y-3 pt-4 border-t border-border/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Resumen Financiero</p>
              <Card className="rounded-2xl border-border/5 bg-muted/10">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pendiente</span>
                    <span className="font-bold text-amber-500">${stats.pendingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="font-bold text-emerald-500">${stats.paidAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="border-border/5" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total nóminas</span>
                    <span className="font-bold">{stats.total} ({stats.pending} pend.)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {commissionDash && (
            <div className="space-y-3 pt-4 border-t border-border/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Comisiones de Entrenadores</p>
              <Card className="rounded-2xl border-border/5 bg-emerald-500/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Entrenadores vinculados</span>
                    <span className="font-bold">{commissionDash.trainersWithCommissions} / {commissionDash.totalTrainers}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Bonificaciones totales</span>
                    <span className="font-bold">{commissionDash.totalCommissionBonuses}</span>
                  </div>
                  <Separator className="border-border/5" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pendiente por comisiones</span>
                    <span className="font-bold text-amber-500">${commissionDash.totalPendingCommissions.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Info</p>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              Las bonificaciones creadas se incluyen automáticamente al generar la nómina del período. Las deducciones se calculan manualmente.
            </p>
          </div>
        </div>
      }
    >
      <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative">
        <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="rounded-2xl bg-muted/20">
                <TabsTrigger value="payroll" className="rounded-xl text-xs font-semibold">
                  <DollarSign className="size-3.5 mr-1" />
                  Nóminas
                </TabsTrigger>
                <TabsTrigger value="bonuses" className="rounded-xl text-xs font-semibold">
                  <Gift className="size-3.5 mr-1" />
                  Bonificaciones
                </TabsTrigger>
                <TabsTrigger value="commissions" className="rounded-xl text-xs font-semibold">
                  <TrendingUp className="size-3.5 mr-1" />
                  Comisiones
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <SearchInput placeholder="Buscar..." value={search} onChange={setSearch} />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsContent value="payroll">
              {payrollLoading ? (
                <div className="space-y-3 animate-pulse">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : !payrollRecords || payrollRecords.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Banknote className="size-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-bold mb-1">Sin nóminas generadas</h3>
                  <p className="text-xs text-muted-foreground">Generá la primera nómina desde el botón en el panel izquierdo.</p>
                </CardContent>
              ) : (
                <div className="divide-y divide-border/5 -mx-6">
                  {filteredPayroll?.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{r.employee?.fullName ?? '—'}</p>
                          <Badge variant="outline" className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                            r.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
                          )}>
                            {r.status === 'PAID' ? 'Pagado' : r.status === 'PENDING' ? 'Pendiente' : r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(r.periodStart).toLocaleDateString('es-AR')} → {new Date(r.periodEnd).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${Number(r.netSalary).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Base: ${Number(r.baseSalary).toLocaleString()}
                          {Number(r.bonusesTotal) > 0 && ` + $${Number(r.bonusesTotal).toLocaleString()}`}
                        </p>
                      </div>
                      {r.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const method = prompt('Método de pago (BANK_TRANSFER, CASH, CHECK):') || 'BANK_TRANSFER'
                            markPaidMutation.mutate({ data: { id: r.id, paymentMethod: method as any } })
                          }}
                          className="rounded-full h-8 px-3 text-xs font-semibold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Pagar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bonuses" className="mt-4">
              {bonusesLoading ? (
                <div className="space-y-3 animate-pulse">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : !bonuses || bonuses.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gift className="size-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-bold mb-1">Sin bonificaciones</h3>
                  <p className="text-xs text-muted-foreground">Creá bonificaciones desde el panel izquierdo.</p>
                </CardContent>
              ) : (
                <div className="divide-y divide-border/5 -mx-6">
                  {filteredBonuses?.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors group">
                      <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Medal className="size-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{b.employee?.fullName ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {BONUS_TYPES.find((t) => t.value === b.type)?.label ?? b.type} · {b.reason}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-emerald-500">+${Number(b.amount).toLocaleString()}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('¿Eliminar esta bonificación?')) {
                            deleteBonusMutation.mutate({ data: { id: b.id } })
                          }
                        }}
                        className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="commissions" className="mt-4">
              {commissionLoading ? (
                <div className="space-y-3 animate-pulse">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : !commissionData || commissionData.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="size-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-bold mb-1">Sin comisiones de entrenadores</h3>
                  <p className="text-xs text-muted-foreground">No hay empleados vinculados como entrenadores o no hay ingresos por membresías en el período.</p>
                </CardContent>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="date"
                        value={commissionPeriod.start}
                        onChange={(e) => setCommissionPeriod((p) => ({ ...p, start: e.target.value }))}
                        className="w-36 rounded-xl text-xs h-9 border-border/10"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input
                        type="date"
                        value={commissionPeriod.end}
                        onChange={(e) => setCommissionPeriod((p) => ({ ...p, end: e.target.value }))}
                        className="w-36 rounded-xl text-xs h-9 border-border/10"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-border/5 -mx-6">
                    {commissionData.map((c) => (
                      <div key={c.employeeId} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                        <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="size-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{c.employeeName}</p>
                            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5">
                              {c.commissionRate}%
                            </Badge>
                            {c.includedInPayroll && (
                              <Badge variant="outline" className="text-[10px] font-bold bg-blue-500/10 text-blue-600 border-blue-500/20 px-2 py-0.5">
                                En nómina
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.assignedMembers} socios asignados · ${c.totalMembershipRevenue.toLocaleString()} en membresías
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-500">${c.commissionAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Comisión calculada</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 border-t border-border/5 flex items-center justify-between bg-muted/10">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total empleados con comisión: </span>
                      <span className="font-bold">{commissionData.filter((c) => c.commissionAmount > 0).length}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total comisiones</p>
                      <p className="text-lg font-bold text-emerald-500">
                        ${commissionData.reduce((s, c) => s + c.commissionAmount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <GeneratePayrollDialog open={generateDialog} onClose={() => setGenerateDialog(false)} />
      <CreateBonusDialog open={bonusDialog} onClose={() => setBonusDialog(false)} />
    </ModuleLayout>
  )
}

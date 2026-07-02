import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  Plus,
  Users,
  UserCheck,
  UserX,
  TimerOff,
  Briefcase,
  Building2,
  DollarSign,
  Phone,
  Mail,
  CalendarDays,
  Banknote,
  FileText,
  AlertCircle,
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
import { cn } from '#/shared/lib/utils.ts'
import { DataTable } from '#/shared/components/data-table.tsx'
import { SearchInput } from '#/shared/components/search-input.tsx'
import { EmployeeDetailDialog } from './components/employee-detail-dialog.tsx'
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from './server.ts'
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_COLORS,
  PAYMENT_FREQUENCY_LABELS,
  POSITIONS,
  DEPARTMENTS,
} from './types.ts'
import type { Employee } from './types.ts'

// ── Stat card ──

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <Card className={cn('rounded-2xl border-border/10 shadow-sm bg-card overflow-hidden relative', color)}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-background/50 flex items-center justify-center shrink-0">
          <Icon className="size-5 text-foreground/70" />
        </div>
        <div>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Empty state ──

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Users className="size-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-bold mb-1">No hay empleados registrados</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Agregá tu primer empleado para empezar a gestionar el equipo del gimnasio.
      </p>
      <Button
        onClick={onAdd}
        className="rounded-full font-bold"
      >
        <Plus className="size-4 mr-1.5" />
        Agregar Empleado
      </Button>
    </div>
  )
}

// ── Employee form (create / edit) ──

interface EmployeeFormData {
  fullName: string
  email: string
  phone: string
  documentNumber: string
  position: string
  department: string
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'
  hireDate: string
  baseSalary: string
  paymentFrequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'
  bankName: string
  bankAccountNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  notes: string
}

const defaultForm: EmployeeFormData = {
  fullName: '',
  email: '',
  phone: '',
  documentNumber: '',
  position: '',
  department: '',
  status: 'ACTIVE',
  hireDate: new Date().toISOString().split('T')[0],
  baseSalary: '0',
  paymentFrequency: 'MONTHLY',
  bankName: '',
  bankAccountNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  notes: '',
}

function EmployeeFormDialog({
  open,
  onClose,
  employeeId,
}: {
  open: boolean
  onClose: () => void
  employeeId: string | null
}) {
  const queryClient = useQueryClient()
  const isEditing = !!employeeId
  const [form, setForm] = useState<EmployeeFormData>(defaultForm)
  const [loadingEmployee, setLoadingEmployee] = useState(false)

  // Load employee data when editing
  useEffect(() => {
    if (employeeId && open) {
      setLoadingEmployee(true)
      getEmployee({ data: { id: employeeId } })
        .then((emp) => {
          if (emp) {
            setForm({
              fullName: emp.fullName,
              email: emp.email ?? '',
              phone: emp.phone ?? '',
              documentNumber: emp.documentNumber ?? '',
              position: emp.position,
              department: emp.department ?? '',
              status: emp.status as EmployeeFormData['status'],
              hireDate: new Date(emp.hireDate).toISOString().split('T')[0],
              baseSalary: emp.baseSalary ?? '0',
              paymentFrequency: (emp.paymentFrequency as EmployeeFormData['paymentFrequency']) ?? 'MONTHLY',
              bankName: emp.bankName ?? '',
              bankAccountNumber: emp.bankAccountNumber ?? '',
              emergencyContactName: emp.emergencyContactName ?? '',
              emergencyContactPhone: emp.emergencyContactPhone ?? '',
              emergencyContactRelation: emp.emergencyContactRelation ?? '',
              notes: emp.notes ?? '',
            })
          }
        })
        .finally(() => setLoadingEmployee(false))
    } else {
      setForm(defaultForm)
    }
  }, [employeeId, open])

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Empleado creado con éxito')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Empleado actualizado con éxito')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleChange(field: keyof EmployeeFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      toast.error('El nombre completo es obligatorio')
      return
    }
    if (!form.position) {
      toast.error('El cargo es obligatorio')
      return
    }
    if (isEditing) {
      updateMutation.mutate({ data: { ...form, id: employeeId! } })
    } else {
      createMutation.mutate({ data: form })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualizá los datos del empleado'
              : 'Completá los datos para registrar un nuevo empleado'}
          </DialogDescription>
        </DialogHeader>

        {loadingEmployee ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-9 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-2xl" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información personal */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5" /> Información Personal
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre completo" required>
                  <Input
                    value={form.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Juan Pérez"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Documento">
                  <Input
                    value={form.documentNumber}
                    onChange={(e) => handleChange('documentNumber', e.target.value)}
                    placeholder="12345678"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="juan@gimnasio.com"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Teléfono">
                  <Input
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
              </div>
            </div>

            <Separator className="border-border/5" />

            {/* Datos laborales */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="size-3.5" /> Datos Laborales
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cargo" required>
                  <Select
                    value={form.position}
                    onValueChange={(v) => handleChange('position', v)}
                  >
                    <SelectTrigger className="rounded-2xl border-border/10">
                      <SelectValue placeholder="Seleccionar cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Departamento">
                  <Select
                    value={form.department}
                    onValueChange={(v) => handleChange('department', v)}
                  >
                    <SelectTrigger className="rounded-2xl border-border/10">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estado">
                  <Select
                    value={form.status}
                    onValueChange={(v) => handleChange('status', v)}
                  >
                    <SelectTrigger className="rounded-2xl border-border/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="ON_LEAVE">De licencia</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      <SelectItem value="TERMINATED">Desvinculado</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha de ingreso" required>
                  <Input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => handleChange('hireDate', e.target.value)}
                    className="rounded-2xl border-border/10"
                  />
                </Field>
              </div>
            </div>

            <Separator className="border-border/5" />

            {/* Salario */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="size-3.5" /> Salario
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Salario base">
                  <Input
                    type="number"
                    min="0"
                    value={form.baseSalary}
                    onChange={(e) => handleChange('baseSalary', e.target.value)}
                    placeholder="0"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Frecuencia de pago">
                  <Select
                    value={form.paymentFrequency}
                    onValueChange={(v) => handleChange('paymentFrequency', v)}
                  >
                    <SelectTrigger className="rounded-2xl border-border/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Mensual</SelectItem>
                      <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Banco">
                  <Input
                    value={form.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="Nombre del banco"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Cuenta bancaria">
                  <Input
                    value={form.bankAccountNumber}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    placeholder="Número de cuenta"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
              </div>
            </div>

            <Separator className="border-border/5" />

            {/* Contacto de emergencia */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" /> Contacto de Emergencia
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Nombre">
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                    placeholder="Contacto"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Teléfono">
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Parentesco">
                  <Input
                    value={form.emergencyContactRelation}
                    onChange={(e) => handleChange('emergencyContactRelation', e.target.value)}
                    placeholder="Familiar, amigo..."
                    className="rounded-2xl border-border/10"
                  />
                </Field>
              </div>
            </div>

            <Separator className="border-border/5" />

            {/* Notas */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5" /> Notas
              </span>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
                className="w-full rounded-2xl border border-border/10 bg-background/50 px-3 py-2 text-sm resize-y"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="rounded-full font-semibold"
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isPending}
                className="rounded-full font-bold px-6"
              >
                {isEditing ? 'Guardar cambios' : 'Crear empleado'}
              </LoadingButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Main page ──

export function EmployeesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['employeeStats'],
    queryFn: getEmployeeStats,
  })

  const { data: employeesList, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Empleado eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const filtered = employeesList?.filter(
    (e) =>
      !search ||
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()),
  )

  function handleAdd() {
    setEditingId(null)
    setDialogOpen(true)
  }

  function handleEdit(id: string) {
    setEditingId(id)
    setDialogOpen(true)
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate({ data: { id } })
    }
  }

  const columns = [
    {
      header: 'Código',
      accessorKey: 'employeeCode' as const,
      cell: (val: string) => (
        <span className="font-mono text-xs text-muted-foreground">{val}</span>
      ),
    },
    {
      header: 'Nombre',
      accessorKey: 'fullName' as const,
      cell: (val: string) => <span className="font-semibold">{val}</span>,
    },
    {
      header: 'Cargo',
      accessorKey: 'position' as const,
    },
    {
      header: 'Departamento',
      accessorKey: 'department' as const,
      cell: (val: string | null) => val || '—',
    },
    {
      header: 'Estado',
      accessorKey: 'status' as const,
      cell: (val: string) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
            EMPLOYEE_STATUS_COLORS[val as keyof typeof EMPLOYEE_STATUS_COLORS],
          )}
        >
          {EMPLOYEE_STATUS_LABELS[val as keyof typeof EMPLOYEE_STATUS_LABELS]}
        </Badge>
      ),
    },
    {
      header: 'Salario',
      accessorKey: 'baseSalary' as const,
      cell: (val: string | null) => (
        <span className="font-mono text-xs">
          {val && Number(val) > 0 ? `$${Number(val).toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      accessorKey: 'phone' as const,
      cell: (val: string | null) => val || '—',
    },
  ]

  if (error) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">RRHH</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Empleados</span>
          </div>
        }
        title="Empleados"
      >
        <Card className="rounded-[2rem] border-border/10 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">
              Error al cargar empleados
            </p>
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
          <span className="text-foreground font-semibold">Empleados</span>
        </div>
      }
      title="Empleados"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Personal
            </p>
            <div className="space-y-2 w-full">
              <Button
                onClick={handleAdd}
                className="w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Plus className="size-4 shrink-0" />
                Agregar Empleado
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Resumen
            </p>
            <div className="space-y-2">
              <StatCard
                icon={Users}
                label="Total"
                value={stats?.total ?? 0}
                color=""
              />
              <StatCard
                icon={UserCheck}
                label="Activos"
                value={stats?.active ?? 0}
                color=""
              />
              <StatCard
                icon={TimerOff}
                label="De licencia"
                value={stats?.onLeave ?? 0}
                color=""
              />
              <StatCard
                icon={UserX}
                label="Inactivos"
                value={(stats?.inactive ?? 0) + (stats?.terminated ?? 0)}
                color=""
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Ayuda
            </p>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              Gestioná el personal del gimnasio: altas, bajas, datos laborales y
              bancarios. Las funcionalidades de asistencia, turnos, vacaciones y
              sueldos se agregarán próximamente.
            </p>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card p-6">
          <div className="space-y-4 animate-pulse">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-9 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-2xl" />
          </div>
        </Card>
      ) : !employeesList || employeesList.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative transition-all duration-200">
          <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">
                Listado de Empleados
              </CardTitle>
              <CardDescription>
                {filtered?.length ?? 0} empleado{(filtered?.length ?? 0) !== 1 ? 's' : ''}
                {search ? ` coinciden con "${search}"` : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Buscar empleado..."
                value={search}
                onChange={setSearch}
              />
              <Button
                onClick={handleAdd}
                className="rounded-full font-bold h-9"
              >
                <Plus className="size-4 mr-1" />
                Nuevo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-0">
            <DataTable
              data={filtered ?? []}
              columns={columns}
              onEdit={(row: Employee) => handleEdit(row.id)}
              onDelete={(row: Employee) => handleDelete(row.id, row.fullName)}
              onRowClick={(row: Employee) => setDetailId(row.id)}
            />
          </CardContent>
        </Card>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingId(null)
        }}
        employeeId={editingId}
      />

      <EmployeeDetailDialog
        employeeId={detailId}
        open={detailId !== null}
        onOpenChange={(v) => { if (!v) setDetailId(null) }}
      />
    </ModuleLayout>
  )
}

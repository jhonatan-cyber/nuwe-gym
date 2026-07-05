import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Users,
  Briefcase,
  DollarSign,
  Phone,
  FileText,
  Shield,
} from 'lucide-react'
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
import { Skeleton } from '#/shared/components/ui/skeleton'
import { getEmployee, createEmployee, updateEmployee } from '../server.ts'
import { getRoles } from '#/features/roles/server.ts'
import { getDepartments } from '#/features/departments/server.ts'
import { createStaffUser } from '#/features/users/server.ts'

// ── Types ──

interface EmployeeFormData {
  fullName: string
  email: string
  phone: string
  documentNumber: string
  position: string
  roleId: string
  departmentId: string
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
  createAccess: boolean
  accessPassword: string
}

const defaultForm: EmployeeFormData = {
  fullName: '',
  email: '',
  phone: '',
  documentNumber: '',
  position: '',
  roleId: '',
  departmentId: '',
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
  createAccess: false,
  accessPassword: '',
}

// ── Field ──

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

// ── Form ──

interface EmployeeFormProps {
  onClose: () => void
  employeeId: string | null
}

export function EmployeeForm({ onClose, employeeId }: EmployeeFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!employeeId
  const [form, setForm] = useState<EmployeeFormData>(defaultForm)
  const [loadingEmployee, setLoadingEmployee] = useState(false)

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments(),
  })

  useEffect(() => {
    if (employeeId) {
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
              roleId: emp.roleId ?? '',
              departmentId: emp.departmentId ?? '',
              status: emp.status as EmployeeFormData['status'],
              hireDate: new Date(emp.hireDate).toISOString().split('T')[0],
              baseSalary: emp.baseSalary ?? '0',
              paymentFrequency:
                (emp.paymentFrequency as EmployeeFormData['paymentFrequency']) ??
                'MONTHLY',
              bankName: emp.bankName ?? '',
              bankAccountNumber: emp.bankAccountNumber ?? '',
              emergencyContactName: emp.emergencyContactName ?? '',
              emergencyContactPhone: emp.emergencyContactPhone ?? '',
              emergencyContactRelation: emp.emergencyContactRelation ?? '',
              notes: emp.notes ?? '',
              createAccess: false,
              accessPassword: '',
            })
          }
        })
        .finally(() => setLoadingEmployee(false))
    } else {
      setForm(defaultForm)
    }
  }, [employeeId])

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      // Create user access if requested (only for new employees)
      const data = (variables as { data: EmployeeFormData })?.data
      if (!isEditing && data?.createAccess && data?.email) {
        try {
          await createStaffUser({
            data: {
              email: data.email,
              password: data.accessPassword || data.documentNumber || 'changeme123',
              name: data.fullName,
              role: (data.roleId as 'ADMIN' | 'RECEPTIONIST' | 'TRAINER') || 'TRAINER',
            },
          })
          toast.success('Personal y usuario creados con éxito')
        } catch {
          toast.success('Personal creado. Error al crear usuario de acceso.')
        }
      } else {
        toast.success('Personal creado con éxito')
      }
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Personal actualizado con éxito')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleChange(field: keyof EmployeeFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      toast.error('El nombre completo es obligatorio')
      return
    }
    if (!form.roleId) {
      toast.error('El rol es obligatorio')
      return
    }
    if (isEditing) {
      updateMutation.mutate({ data: { ...form, id: employeeId } })
    } else {
      createMutation.mutate({ data: form })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative transition-all duration-200 animate-in fade-in duration-300">
      <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-black">
            {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Actualizá los datos del personal'
              : 'Completá los datos para registrar un nuevo miembro del equipo'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 p-6">
        {loadingEmployee ? (
          <div className="space-y-4">
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
                    onChange={(e) =>
                      handleChange('documentNumber', e.target.value)
                    }
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
                <Field label="Rol" required>
                  <Select
                    value={form.roleId}
                    onValueChange={(v) => {
                      const role = roles.find((r) => r.name === v)
                      handleChange('roleId', v)
                      if (role) handleChange('position', role.label)
                    }}
                  >
                    <SelectTrigger className="rounded-2xl border-border/10">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.name} value={r.name}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Departamento">
                  <Select
                    value={form.departmentId}
                    onValueChange={(v) => handleChange('departmentId', v)}
                  >
                    <SelectTrigger className="rounded-2xl border-border/10">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments
                        .filter((d) => d.isActive)
                        .map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
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

            {/* Acceso al sistema (solo para nuevo personal) */}
            {!isEditing && (
              <>
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="size-3.5" /> Acceso al Sistema
                  </span>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
                    <input
                      type="checkbox"
                      id="createAccess"
                      checked={form.createAccess}
                      onChange={(e) =>
                        handleChange('createAccess', e.target.checked)
                      }
                      className="rounded"
                    />
                    <label htmlFor="createAccess" className="text-sm cursor-pointer">
                      Dar acceso al sistema (crear usuario)
                    </label>
                  </div>
                  {form.createAccess && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Email (usuario)">
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="Se usará como email de login"
                          className="rounded-2xl border-border/10"
                          disabled
                        />
                      </Field>
                      <Field label="Contraseña inicial">
                        <Input
                          type="text"
                          value={form.accessPassword}
                          onChange={(e) =>
                            handleChange('accessPassword', e.target.value)
                          }
                          placeholder="Documento o 'changeme123'"
                          className="rounded-2xl border-border/10"
                        />
                      </Field>
                    </div>
                  )}
                </div>
                <Separator className="border-border/5" />
              </>
            )}

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
                    onChange={(e) =>
                      handleChange('bankAccountNumber', e.target.value)
                    }
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
                    onChange={(e) =>
                      handleChange('emergencyContactName', e.target.value)
                    }
                    placeholder="Contacto"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Teléfono">
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) =>
                      handleChange('emergencyContactPhone', e.target.value)
                    }
                    placeholder="+54 11 1234-5678"
                    className="rounded-2xl border-border/10"
                  />
                </Field>
                <Field label="Parentesco">
                  <Input
                    value={form.emergencyContactRelation}
                    onChange={(e) =>
                      handleChange('emergencyContactRelation', e.target.value)
                    }
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
                {isEditing ? 'Guardar cambios' : 'Crear personal'}
              </LoadingButton>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

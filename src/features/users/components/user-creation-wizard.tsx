import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, User, Mail, Shield, Key, Info, Phone, MapPin, IdCard } from 'lucide-react'
import { createStaffUser } from '#/features/users/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import type { UserRole } from '#/features/users/types.ts'

interface UserCreationWizardProps {
  onClose: () => void
}

interface StaffFormState {
  firstName: string
  lastName: string
  documentNumber: string
  phone: string
  address: string
  email: string
  role: UserRole
}

const defaultFormState: StaffFormState = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  phone: '',
  address: '',
  email: '',
  role: 'TRAINER',
}

export function UserCreationWizard({ onClose }: UserCreationWizardProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<StaffFormState>(defaultFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<{ name: string; email: string; ci: string; role: string } | null>(null)

  const createMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      const data = variables?.data
      if (!data) return
      const roleLabel =
        data.role === 'ADMIN'
          ? 'Administrador'
          : data.role === 'RECEPTIONIST'
            ? 'Recepcionista'
            : 'Entrenador'
      setCreated({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        ci: data.documentNumber,
        role: roleLabel,
      })
      toast.success('Usuario del staff creado con éxito')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear usuario'),
  })

  const updateField = <TKey extends keyof StaffFormState>(key: TKey, value: StaffFormState[TKey]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio'
    if (!form.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio'
    if (!form.documentNumber.trim()) {
      newErrors.documentNumber = 'El CI es obligatorio'
    } else if (!/^\d+$/.test(form.documentNumber.trim())) {
      newErrors.documentNumber = 'El CI debe contener solo números'
    }
    if (form.phone.trim() && !/^\+?[\d\s-]+$/.test(form.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido'
    }
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createMutation.mutate({
      data: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        documentNumber: form.documentNumber.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        email: form.email.trim(),
        role: form.role,
      },
    })
  }

  const resetAndClose = () => {
    setForm(defaultFormState)
    setErrors({})
    setCreated(null)
    onClose()
  }

  // Success screen
  if (created) {
    return (
      <div className="flex-1 flex justify-center items-start pt-0">
        <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-4xl shadow-xl overflow-hidden flex flex-col min-h-[480px]">
          <div className="flex-1 p-6 flex flex-col items-center justify-center py-8">
            <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 ring-4 ring-emerald-500/20">
              <Check className="size-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black tracking-tight dark:text-white text-foreground mb-1">
              ¡Registro Exitoso!
            </h2>
            <p className="text-xs text-muted-foreground text-center max-w-xs mb-6">
              El usuario ha sido creado correctamente y ya puede acceder al sistema.
            </p>

            <div className="w-full bg-foreground/5 rounded-2xl p-4 border border-foreground/10 space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{created.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-sm">{created.name}</p>
                  <p className="text-[10px] text-muted-foreground">{created.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-foreground/10">
                <IdCard className="size-3.5" />
                <span>
                  CI: <strong className="text-foreground">{created.ci}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="size-3.5" />
                <span>
                  Rol: <strong className="text-foreground">{created.role}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-foreground/10">
                <Key className="size-3.5" />
                <span>
                  Contraseña inicial: <strong className="text-foreground font-mono">{created.ci}</strong>
                </span>
              </div>
            </div>

            <Button onClick={resetAndClose} className="w-full">
              Volver al Listado
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex justify-center items-start pt-0">
      <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-4xl shadow-xl overflow-hidden flex flex-col min-h-[560px]">
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto text-gray-900 dark:text-gray-100">
            <div className="flex flex-col items-center mb-5">
              <div className="size-20 rounded-full bg-foreground/5 flex items-center justify-center mb-3 ring-4 ring-foreground/5">
                <span className="text-4xl font-black text-foreground tracking-tight">
                  {form.firstName ? form.firstName.charAt(0).toUpperCase() : 'S'}
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight dark:text-white text-foreground">
                Nuevo Personal
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete los datos del nuevo empleado
              </p>
            </div>

            <div className="space-y-3">
              {/* CI */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  CI / Cédula de Identidad <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Ej. 1234567"
                    value={form.documentNumber}
                    onChange={(e) => updateField('documentNumber', e.target.value)}
                    className={`pl-8 text-sm ${errors.documentNumber ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.documentNumber && <p className="text-[10px] font-semibold text-destructive">{errors.documentNumber}</p>}
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    Nombre <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Ej. Juan"
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className={`pl-8 text-sm ${errors.firstName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.firstName && <p className="text-[10px] font-semibold text-destructive">{errors.firstName}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    Apellidos <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Ej. Pérez"
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className={`pl-8 text-sm ${errors.lastName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.lastName && <p className="text-[10px] font-semibold text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              {/* Dirección y Teléfono */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    Dirección
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Ej. Av. Siempre Viva 123"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    Teléfono
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Ej. 71234567"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={`pl-8 text-sm ${errors.phone ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] font-semibold text-destructive">{errors.phone}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  Correo Electrónico <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Ej. juan@gimnasio.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={`pl-8 text-sm ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-[10px] font-semibold text-destructive">{errors.email}</p>}
              </div>

              {/* Rol */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  Rol <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
                </Label>
                <ToggleGroup
                  type="single"
                  value={form.role}
                  onValueChange={(v) => { if (v) updateField('role', v as UserRole) }}
                  className="w-full"
                >
                  <ToggleGroupItem value="TRAINER" className="flex-1 text-xs">Entrenador</ToggleGroupItem>
                  <ToggleGroupItem value="RECEPTIONIST" className="flex-1 text-xs">Recepcionista</ToggleGroupItem>
                  <ToggleGroupItem value="ADMIN" className="flex-1 text-xs">Admin</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Contraseña info */}
              <div className="bg-amber-500/10 p-3 rounded-lg flex gap-2 text-xs text-amber-800 border border-amber-500/20">
                <Key className="size-5 shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">Contraseña generada automáticamente</p>
                  <p>
                    La contraseña inicial será el <strong>número de CI</strong> del empleado.
                    Al ingresar por primera vez, el sistema le pedirá cambiarla.
                  </p>
                </div>
              </div>

              {/* Role info */}
              <div className="bg-blue-500/10 p-3 rounded-lg flex gap-2 text-xs text-blue-800 border border-blue-500/20">
                <Info className="size-5 shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">
                    {form.role === 'ADMIN' ? 'Acceso Total' : form.role === 'RECEPTIONIST' ? 'Recepción y Caja' : 'Solo Check-ins'}
                  </p>
                  <p>
                    {form.role === 'ADMIN'
                      ? 'Podrá gestionar usuarios, configuraciones y todos los módulos.'
                      : form.role === 'RECEPTIONIST'
                        ? 'Podrá registrar socios, cobros y usar el POS.'
                        : 'Solo podrá ver información de socios y registrar check-ins.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="grid grid-cols-3 items-center pt-5 border-t border-gray-200 dark:border-white/10 mt-5">
            <div className="justify-self-start" />
            <div className="justify-self-center">
              <LoadingButton
                onClick={handleSubmit}
                isLoading={createMutation.isPending}
                loadingText="Creando..."
                className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black"
              >
                Crear Usuario <Check className="size-4 ml-1" />
              </LoadingButton>
            </div>
            <div className="justify-self-end" />
          </div>
        </div>
      </div>
    </div>
  )
}

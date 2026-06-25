import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Settings,
  DollarSign,
  Bell,
  Clock,
  Upload,
  AlertCircle,
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
import { Skeleton } from '#/shared/components/ui/skeleton'
import { Separator } from '#/shared/components/ui/separator'
import { getSettings, updateSettings } from '#/features/settings/server.ts'

type TabId = 'general' | 'billing' | 'notifications' | 'hours'

const tabs: {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'billing', label: 'Facturación', icon: DollarSign },
  { id: 'hours', label: 'Horarios', icon: Clock },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
]

const DAYS = [
  { key: 'mondayOpen', label: 'Lunes' },
  { key: 'tuesdayOpen', label: 'Martes' },
  { key: 'wednesdayOpen', label: 'Miércoles' },
  { key: 'thursdayOpen', label: 'Jueves' },
  { key: 'fridayOpen', label: 'Viernes' },
  { key: 'saturdayOpen', label: 'Sábado' },
  { key: 'sundayOpen', label: 'Domingo' },
] as const

interface SettingsForm {
  gymName: string
  gymAddress: string
  gymPhone: string
  gymEmail: string
  logoBase64: string
  taxRate: string
  currencySymbol: string
  currencyCode: string
  decimalPlaces: number
  lowStockThreshold: number
  membershipReminderDays: number
  checkInWindowMinutes: number
  enableAutoRenew: boolean
  openingTime: string
  closingTime: string
  mondayOpen: boolean
  tuesdayOpen: boolean
  wednesdayOpen: boolean
  thursdayOpen: boolean
  fridayOpen: boolean
  saturdayOpen: boolean
  sundayOpen: boolean
}

function useServerData<T>(fetcher: () => Promise<T>): {
  data: T | null
  error: string | null
  loading: boolean
} {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error desconocido')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, error, loading }
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const {
    data: initialData,
    error,
    loading,
  } = useServerData(() => getSettings())

  const [form, setForm] = useState<SettingsForm>({
    gymName: '',
    gymAddress: '',
    gymPhone: '',
    gymEmail: '',
    logoBase64: '',
    taxRate: '0.00',
    currencySymbol: '$',
    currencyCode: 'ARS',
    decimalPlaces: 2,
    lowStockThreshold: 5,
    membershipReminderDays: 7,
    checkInWindowMinutes: 60,
    enableAutoRenew: false,
    openingTime: '08:00',
    closingTime: '22:00',
    mondayOpen: true,
    tuesdayOpen: true,
    wednesdayOpen: true,
    thursdayOpen: true,
    fridayOpen: true,
    saturdayOpen: false,
    sundayOpen: false,
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        gymName: initialData.gymName,
        gymAddress: initialData.gymAddress ?? '',
        gymPhone: initialData.gymPhone ?? '',
        gymEmail: initialData.gymEmail ?? '',
        logoBase64: initialData.logoBase64 ?? '',
        taxRate: initialData.taxRate ?? '0.00',
        currencySymbol: initialData.currencySymbol ?? '$',
        currencyCode: initialData.currencyCode ?? 'ARS',
        decimalPlaces: initialData.decimalPlaces ?? 2,
        lowStockThreshold: initialData.lowStockThreshold ?? 5,
        membershipReminderDays: initialData.membershipReminderDays ?? 7,
        checkInWindowMinutes: initialData.checkInWindowMinutes ?? 60,
        enableAutoRenew: initialData.enableAutoRenew ?? false,
        openingTime: initialData.openingTime ?? '08:00',
        closingTime: initialData.closingTime ?? '22:00',
        mondayOpen: initialData.mondayOpen ?? true,
        tuesdayOpen: initialData.tuesdayOpen ?? true,
        wednesdayOpen: initialData.wednesdayOpen ?? true,
        thursdayOpen: initialData.thursdayOpen ?? true,
        fridayOpen: initialData.fridayOpen ?? true,
        saturdayOpen: initialData.saturdayOpen ?? false,
        sundayOpen: initialData.sundayOpen ?? false,
      })
    }
  }, [initialData])

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success('Configuración guardada con éxito')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al guardar la configuración')
    },
  })

  function handleChange(
    field: keyof SettingsForm,
    value: string | number | boolean,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    if (!form.gymName.trim()) {
      toast.error('El nombre del gimnasio es obligatorio')
      return
    }
    updateMutation.mutate({ data: form })
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administración del gimnasio</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administración del gimnasio</p>
        </div>
        <Card className="transition-all duration-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">
              Error al cargar configuración
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administración del gimnasio</p>
      </div>

      <div className="flex gap-1 border-b pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-b-none"
            >
              <Icon className="size-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === 'general' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos principales del gimnasio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nombre del gimnasio" required>
              <Input
                value={form.gymName}
                onChange={(e) => handleChange('gymName', e.target.value)}
                placeholder="Mi Gimnasio"
              />
            </Field>
            <Field label="Dirección">
              <Input
                value={form.gymAddress}
                onChange={(e) => handleChange('gymAddress', e.target.value)}
                placeholder="Calle y número"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono">
                <Input
                  value={form.gymPhone}
                  onChange={(e) => handleChange('gymPhone', e.target.value)}
                  placeholder="+54 11 1234-5678"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.gymEmail}
                  onChange={(e) => handleChange('gymEmail', e.target.value)}
                  placeholder="info@gimnasio.com"
                />
              </Field>
            </div>
            <Separator />
            <div className="flex justify-end">
              <LoadingButton
                onClick={handleSave}
                isLoading={updateMutation.isPending}
              >
                Guardar cambios
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle>Facturación</CardTitle>
            <CardDescription>
              Configuración de moneda e impuestos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Símbolo de moneda">
                <Input
                  value={form.currencySymbol}
                  onChange={(e) =>
                    handleChange('currencySymbol', e.target.value)
                  }
                  placeholder="$"
                />
              </Field>
              <Field label="Código de moneda">
                <Input
                  value={form.currencyCode}
                  onChange={(e) => handleChange('currencyCode', e.target.value)}
                  placeholder="ARS"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tasa de impuesto (%)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.taxRate}
                  onChange={(e) => handleChange('taxRate', e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Decimales">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={form.decimalPlaces}
                  onChange={(e) =>
                    handleChange('decimalPlaces', Number(e.target.value))
                  }
                />
              </Field>
            </div>
            <Separator />
            <div className="flex justify-end">
              <LoadingButton
                onClick={handleSave}
                isLoading={updateMutation.isPending}
              >
                Guardar cambios
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'hours' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="transition-all duration-200">
            <CardHeader>
              <CardTitle>Logo del Gimnasio</CardTitle>
              <CardDescription>
                Imagen que se mostrará en los reportes y recibos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {form.logoBase64 ? (
                  <img
                    src={form.logoBase64}
                    alt="Logo preview"
                    className="size-24 rounded-lg border object-contain bg-white"
                  />
                ) : (
                  <div className="size-24 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                    <Upload className="size-8" />
                  </div>
                )}
                <div className="flex-1">
                  <Label htmlFor="logo">Seleccionar imagen</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="mt-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const result = ev.target?.result
                        if (typeof result === 'string') {
                          handleChange('logoBase64', result)
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  {form.logoBase64 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-destructive"
                      onClick={() => handleChange('logoBase64', '')}
                    >
                      Eliminar logo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200">
            <CardHeader>
              <CardTitle>Horario de Atención</CardTitle>
              <CardDescription>
                Configurá los días y horarios de apertura del gimnasio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hora de apertura">
                  <Input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) =>
                      handleChange('openingTime', e.target.value)
                    }
                  />
                </Field>
                <Field label="Hora de cierre">
                  <Input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) =>
                      handleChange('closingTime', e.target.value)
                    }
                  />
                </Field>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Días de atención</Label>
                {DAYS.map((day) => (
                  <label
                    key={day.key}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{day.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={
                        form[day.key as keyof SettingsForm] as boolean
                      }
                      onClick={() =>
                        handleChange(
                          day.key,
                          !(form[day.key as keyof SettingsForm] as boolean),
                        )
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        (form[day.key as keyof SettingsForm] as boolean)
                          ? 'bg-primary'
                          : 'bg-input'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                          (form[day.key as keyof SettingsForm] as boolean)
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-2 flex justify-end">
            <LoadingButton
              onClick={handleSave}
              isLoading={updateMutation.isPending}
            >
              Guardar cambios
            </LoadingButton>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>
              Alertas y recordatorios automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Stock mínimo (unidades)">
                <Input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    handleChange('lowStockThreshold', Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Días para recordatorio de membresía">
                <Input
                  type="number"
                  min="0"
                  value={form.membershipReminderDays}
                  onChange={(e) =>
                    handleChange(
                      'membershipReminderDays',
                      Number(e.target.value),
                    )
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ventana de check-in (minutos)">
                <Input
                  type="number"
                  min="0"
                  value={form.checkInWindowMinutes}
                  onChange={(e) =>
                    handleChange('checkInWindowMinutes', Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Renovación automática">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableAutoRenew}
                    onChange={(e) =>
                      handleChange('enableAutoRenew', e.target.checked)
                    }
                    className="size-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Activar renovación automática de membresías
                  </span>
                </label>
              </Field>
            </div>
            <Separator />
            <div className="flex justify-end">
              <LoadingButton
                onClick={handleSave}
                isLoading={updateMutation.isPending}
              >
                Guardar cambios
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

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
  ChevronRight,
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
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { cn } from '#/shared/lib/utils.ts'

type TabId = 'general' | 'billing' | 'notifications' | 'hours'

const tabs: {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'billing', label: 'Facturación', icon: DollarSign },
  { id: 'hours', label: 'Horarios y Logo', icon: Clock },
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
      <div className="w-full">
        <ModuleLayout
          breadcrumb={
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Configuración</span>
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <span className="text-foreground">General</span>
            </div>
          }
          title="Configuración"
          leftPanel={
            <div className="flex flex-col gap-6 w-full animate-pulse">
              <div className="space-y-3">
                <div className="h-3 w-16 bg-muted rounded px-1" />
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-2xl" />
                  <Skeleton className="h-9 w-full rounded-2xl" />
                  <Skeleton className="h-9 w-full rounded-2xl" />
                  <Skeleton className="h-9 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          }
        >
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card p-6 relative overflow-hidden animate-pulse">
            <div className="space-y-4">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-9 w-full rounded-2xl" />
              <Skeleton className="h-9 w-full rounded-2xl" />
              <Skeleton className="h-9 w-full rounded-2xl" />
            </div>
          </Card>
        </ModuleLayout>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full">
        <ModuleLayout
          breadcrumb={
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Configuración</span>
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <span className="text-foreground">General</span>
            </div>
          }
          title="Configuración"
          leftPanel={
            <div className="flex flex-col gap-6 w-full">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Secciones
                </p>
                <div className="space-y-1">
                  <Skeleton className="h-9 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          }
        >
          <Card className="rounded-[2rem] border-border/10 bg-card text-foreground overflow-hidden relative">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="size-12 text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">
                Error al cargar configuración
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </ModuleLayout>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Administración</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground font-semibold">Configuración</span>
          </div>
        }
        title="Configuración"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Secciones
              </p>
              <div className="space-y-1 w-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? 'secondary' : 'ghost'}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20 dark:text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {tab.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Ayuda
              </p>
              <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                Configurá los parámetros generales del sistema, la facturación por defecto de tu moneda, tus horarios comerciales, el logo corporativo y las notificaciones automáticas para tus socios.
              </p>
            </div>
          </div>
        }
      >
        {activeTab === 'general' && (
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Información General</CardTitle>
              <CardDescription>Datos principales del gimnasio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Field label="Nombre del gimnasio" required>
                <Input
                  value={form.gymName}
                  onChange={(e) => handleChange('gymName', e.target.value)}
                  placeholder="Mi Gimnasio"
                  className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                />
              </Field>
              <Field label="Dirección">
                <Input
                  value={form.gymAddress}
                  onChange={(e) => handleChange('gymAddress', e.target.value)}
                  placeholder="Calle y número"
                  className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Teléfono">
                  <Input
                    value={form.gymPhone}
                    onChange={(e) => handleChange('gymPhone', e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.gymEmail}
                    onChange={(e) => handleChange('gymEmail', e.target.value)}
                    placeholder="info@gimnasio.com"
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                  />
                </Field>
              </div>
              <Separator className="border-border/5" />
              <div className="flex justify-end pt-2">
                <LoadingButton
                  onClick={handleSave}
                  isLoading={updateMutation.isPending}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Guardar cambios
                </LoadingButton>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Facturación</CardTitle>
              <CardDescription>
                Configuración de moneda e impuestos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Símbolo de moneda">
                  <Input
                    value={form.currencySymbol}
                    onChange={(e) =>
                      handleChange('currencySymbol', e.target.value)
                    }
                    placeholder="$"
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                  />
                </Field>
                <Field label="Código de moneda">
                  <Input
                    value={form.currencyCode}
                    onChange={(e) => handleChange('currencyCode', e.target.value)}
                    placeholder="ARS"
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
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
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
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
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                  />
                </Field>
              </div>
              <Separator className="border-border/5" />
              <div className="flex justify-end pt-2">
                <LoadingButton
                  onClick={handleSave}
                  isLoading={updateMutation.isPending}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Guardar cambios
                </LoadingButton>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'hours' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
              <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-black">Logo del Gimnasio</CardTitle>
                <CardDescription>
                  Imagen que se mostrará en los reportes y recibos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-center gap-4">
                  {form.logoBase64 ? (
                    <img
                      src={form.logoBase64}
                      alt="Logo preview"
                      className="size-24 rounded-2xl border border-border/10 object-contain bg-white shadow-md"
                    />
                  ) : (
                    <div className="size-24 rounded-2xl border border-dashed border-border/20 flex items-center justify-center text-muted-foreground bg-muted/20">
                      <Upload className="size-8 text-muted-foreground/60" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seleccionar imagen</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="mt-1 rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
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
                        className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full font-semibold"
                        onClick={() => handleChange('logoBase64', '')}
                      >
                        Eliminar logo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
              <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-black">Horario de Atención</CardTitle>
                <CardDescription>
                  Configurá los días y horarios de apertura del gimnasio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Hora de apertura">
                    <Input
                      type="time"
                      value={form.openingTime}
                      onChange={(e) =>
                        handleChange('openingTime', e.target.value)
                      }
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="Hora de cierre">
                    <Input
                      type="time"
                      value={form.closingTime}
                      onChange={(e) =>
                        handleChange('closingTime', e.target.value)
                      }
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                </div>
                <Separator className="border-border/5" />
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Días de atención</Label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {DAYS.map((day) => (
                      <label
                        key={day.key}
                        className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-muted/30 transition-all duration-150"
                      >
                        <span className="text-sm font-semibold">{day.label}</span>
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
                              : 'bg-muted-foreground/30'
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
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 flex justify-end">
              <LoadingButton
                onClick={handleSave}
                isLoading={updateMutation.isPending}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Guardar cambios
              </LoadingButton>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Notificaciones</CardTitle>
              <CardDescription>
                Alertas y recordatorios automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stock mínimo (unidades)">
                  <Input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) =>
                      handleChange('lowStockThreshold', Number(e.target.value))
                    }
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
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
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
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
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                  />
                </Field>
                <Field label="Renovación automática">
                  <label className="flex items-center gap-2 cursor-pointer pt-6">
                    <input
                      type="checkbox"
                      checked={form.enableAutoRenew}
                      onChange={(e) =>
                        handleChange('enableAutoRenew', e.target.checked)
                      }
                      className="size-4 rounded border-border/20 accent-primary"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Activar renovación automática de membresías
                    </span>
                  </label>
                </Field>
              </div>
              <Separator className="border-border/5" />
              <div className="flex justify-end pt-2">
                <LoadingButton
                  onClick={handleSave}
                  isLoading={updateMutation.isPending}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Guardar cambios
                </LoadingButton>
              </div>
            </CardContent>
          </Card>
        )}
      </ModuleLayout>
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
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

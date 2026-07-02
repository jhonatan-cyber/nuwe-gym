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
  Gift,
  CreditCard,
  Monitor,
  Trash2,
  Plus,
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
import { CouponManager } from '#/features/loyalty/components/coupon-manager.tsx'
import { PromotionsManager } from '#/features/promotions/components/promotions-manager.tsx'
import { TvMediaManager } from '#/features/tv-screen/tv-media-manager.tsx'
import { getSettings, updateSettings } from '#/features/settings/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { cn } from '#/shared/lib/utils.ts'

type TabId = 'general' | 'billing' | 'notifications' | 'hours' | 'coupons' | 'promotions' | 'payments' | 'tv'

const tabs: {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'billing', label: 'Facturación', icon: DollarSign },
  { id: 'hours', label: 'Horarios y Logo', icon: Clock },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'coupons', label: 'Cupones', icon: Gift },
  { id: 'promotions', label: 'Promociones', icon: Megaphone },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'tv', label: 'Pantalla TV', icon: Monitor },
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
  resendApiKey: string
  emailFrom: string
  openingTime: string
  closingTime: string
  mondayOpen: boolean
  tuesdayOpen: boolean
  wednesdayOpen: boolean
  thursdayOpen: boolean
  fridayOpen: boolean
  saturdayOpen: boolean
  sundayOpen: boolean
  // Fiscal data for invoices
  companyTaxId: string
  companyLegalName: string
  invoiceFooter: string
  // FCM config
  firebaseApiKey: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  firebaseMessagingSenderId: string
  firebaseAppId: string
  firebaseVapidKey: string
  firebaseServiceAccount: string
  // Twilio config
  twilioAccountSid: string
  twilioAuthToken: string
  twilioWhatsAppNumber: string
  twilioSmsNumber: string
  // WhatsApp Content Template SIDs
  waTemplateExpirationSid: string
  waTemplateExpiredSid: string
  waTemplateBirthdaySid: string
  waTemplateInactiveSid: string
  waTemplateClassReminderSid: string
  // Cron API key
  autoRenewSecretKey: string
  // Stripe config
  stripeSecretKey: string
  stripePublishableKey: string
  stripeWebhookSecret: string
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
    resendApiKey: '',
    emailFrom: '',
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseProjectId: '',
    firebaseMessagingSenderId: '',
    firebaseAppId: '',
    firebaseVapidKey: '',
    firebaseServiceAccount: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsAppNumber: '',
    twilioSmsNumber: '',
    waTemplateExpirationSid: '',
    waTemplateExpiredSid: '',
    waTemplateBirthdaySid: '',
    waTemplateInactiveSid: '',
    waTemplateClassReminderSid: '',
    autoRenewSecretKey: '',
    stripeSecretKey: '',
    stripePublishableKey: '',
    stripeWebhookSecret: '',
    openingTime: '08:00',
    closingTime: '22:00',
    mondayOpen: true,
    tuesdayOpen: true,
    wednesdayOpen: true,
    thursdayOpen: true,
    fridayOpen: true,
    saturdayOpen: false,
    sundayOpen: false,
    companyTaxId: '',
    companyLegalName: '',
    invoiceFooter: '',
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
        resendApiKey: initialData.resendApiKey ?? '',
        emailFrom: initialData.emailFrom ?? '',
        firebaseApiKey: initialData.firebaseApiKey ?? '',
        firebaseAuthDomain: initialData.firebaseAuthDomain ?? '',
        firebaseProjectId: initialData.firebaseProjectId ?? '',
        firebaseMessagingSenderId: initialData.firebaseMessagingSenderId ?? '',
        firebaseAppId: initialData.firebaseAppId ?? '',
        firebaseVapidKey: initialData.firebaseVapidKey ?? '',
        firebaseServiceAccount: initialData.firebaseServiceAccount ?? '',
        twilioAccountSid: initialData.twilioAccountSid ?? '',
        twilioAuthToken: initialData.twilioAuthToken ?? '',
        twilioWhatsAppNumber: initialData.twilioWhatsAppNumber ?? '',
        twilioSmsNumber: initialData.twilioSmsNumber ?? '',
        waTemplateExpirationSid: initialData.waTemplateExpirationSid ?? '',
        waTemplateExpiredSid: initialData.waTemplateExpiredSid ?? '',
        waTemplateBirthdaySid: initialData.waTemplateBirthdaySid ?? '',
        waTemplateInactiveSid: initialData.waTemplateInactiveSid ?? '',
        waTemplateClassReminderSid: initialData.waTemplateClassReminderSid ?? '',
        autoRenewSecretKey: initialData.autoRenewSecretKey ?? '',
        stripeSecretKey: initialData.stripeSecretKey ?? '',
        stripePublishableKey: initialData.stripePublishableKey ?? '',
        stripeWebhookSecret: initialData.stripeWebhookSecret ?? '',
        openingTime: initialData.openingTime ?? '08:00',
        closingTime: initialData.closingTime ?? '22:00',
        mondayOpen: initialData.mondayOpen ?? true,
        tuesdayOpen: initialData.tuesdayOpen ?? true,
        wednesdayOpen: initialData.wednesdayOpen ?? true,
        thursdayOpen: initialData.thursdayOpen ?? true,
        fridayOpen: initialData.fridayOpen ?? true,
        saturdayOpen: initialData.saturdayOpen ?? false,
        sundayOpen: initialData.sundayOpen ?? false,
        companyTaxId: initialData.companyTaxId ?? '',
        companyLegalName: initialData.companyLegalName ?? '',
        invoiceFooter: initialData.invoiceFooter ?? '',
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
                Configuración de moneda, impuestos y datos fiscales para facturas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                Moneda
              </span>
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
              <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                Datos fiscales (Facturas)
              </span>
              <Field label="RUC / CUIT / NIT">
                <Input
                  value={form.companyTaxId}
                  onChange={(e) => handleChange('companyTaxId', e.target.value)}
                  placeholder="12345678-9"
                  className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                />
              </Field>
              <Field label="Razón social">
                <Input
                  value={form.companyLegalName}
                  onChange={(e) => handleChange('companyLegalName', e.target.value)}
                  placeholder="Mi Gimnasio S.A."
                  className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                />
              </Field>
              <Field label="Pie de factura">
                <Input
                  value={form.invoiceFooter}
                  onChange={(e) => handleChange('invoiceFooter', e.target.value)}
                  placeholder="Gracias por su compra"
                  className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                />
              </Field>
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

        {activeTab === 'payments' && (
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Pagos Automáticos (Stripe)</CardTitle>
              <CardDescription>
                Configurá Stripe para cobrar automáticamente las membresías con tarjeta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p className="text-xs text-muted-foreground">
                Necesitás una cuenta de{' '}
                <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  Stripe
                </a>{' '}
                para aceptar pagos con tarjeta. Obtené tus claves en{' '}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  Stripe Dashboard → API Keys
                </a>.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stripe Secret Key">
                  <Input
                    type="password"
                    value={form.stripeSecretKey}
                    onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                    placeholder="sk_live_..."
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                  />
                </Field>
                <Field label="Stripe Publishable Key">
                  <Input
                    value={form.stripePublishableKey}
                    onChange={(e) => handleChange('stripePublishableKey', e.target.value)}
                    placeholder="pk_live_..."
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                  />
                </Field>
              </div>
              <Field label="Stripe Webhook Secret">
                <Input
                  type="password"
                  value={form.stripeWebhookSecret}
                  onChange={(e) => handleChange('stripeWebhookSecret', e.target.value)}
                  placeholder="whsec_..."
                  className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                />
              </Field>
              <Separator className="border-border/5" />
              <p className="text-xs text-muted-foreground">
                Una vez configurado, los socios podrán guardar sus tarjetas desde el detalle de socio.
                Las renovaciones automáticas intentarán cobrar la tarjeta guardada con auto-pago activado.
                Si el cobro falla, se creará un pago pendiente.
              </p>
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

        {activeTab === 'coupons' && (
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Cupones de descuento</CardTitle>
              <CardDescription>
                Administrá códigos de descuento para ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <CouponManager />
            </CardContent>
          </Card>
        )}

        {activeTab === 'tv' && (
          <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Pantalla TV</CardTitle>
              <CardDescription>
                Configurá el contenido multimedia y mensajes de la pantalla TV pública
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <TvMediaManager />
            </CardContent>
          </Card>
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
              <div className="space-y-4">
                <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Cron API Key (Auto-Renovaciones)
                </span>
                <p className="text-xs text-muted-foreground">
                  Configurá una clave secreta para el endpoint cron que ejecuta las renovaciones automáticas.
                  El cron job externo (Vercel Cron, cron-job.org, etc.) debe llamar a{' '}
                  <code className="text-primary text-[10px]">POST /api/cron/auto-renewals</code> con el header{' '}
                  <code className="text-primary text-[10px]">x-api-key</code>.
                </p>
                <Field label="API Key para Cron">
                  <Input
                    type="password"
                    value={form.autoRenewSecretKey}
                    onChange={(e) =>
                      handleChange('autoRenewSecretKey', e.target.value)
                    }
                    placeholder="Ingresá una clave secreta..."
                    className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                  />
                </Field>
              </div>
              <Separator className="border-border/5" />
              <div className="space-y-4">
                <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Email (Resend)
                </span>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="API Key">
                    <Input
                      type="password"
                      value={form.resendApiKey}
                      onChange={(e) =>
                        handleChange('resendApiKey', e.target.value)
                      }
                      placeholder="re_..."
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="Email remitente">
                    <Input
                      type="email"
                      value={form.emailFrom}
                      onChange={(e) => handleChange('emailFrom', e.target.value)}
                      placeholder="notificaciones@tugimnasio.com"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                </div>
              </div>
              <Separator className="border-border/5" />
              <div className="space-y-4">
                <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Notificaciones Push (Firebase Cloud Messaging)
                </span>
                <p className="text-xs text-muted-foreground">
                  Configurá Firebase Cloud Messaging para enviar notificaciones push al navegador de los usuarios.
                  Creá un proyecto en{' '}
                  <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                    Firebase Console
                  </a>, activá Cloud Messaging, generá un par de llaves VAPID y descargá el Service Account JSON.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="API Key">
                    <Input
                      value={form.firebaseApiKey}
                      onChange={(e) => handleChange('firebaseApiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="Auth Domain">
                    <Input
                      value={form.firebaseAuthDomain}
                      onChange={(e) => handleChange('firebaseAuthDomain', e.target.value)}
                      placeholder="proyecto.firebaseapp.com"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="Project ID" required>
                    <Input
                      value={form.firebaseProjectId}
                      onChange={(e) => handleChange('firebaseProjectId', e.target.value)}
                      placeholder="mi-proyecto-123"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="Messaging Sender ID">
                    <Input
                      value={form.firebaseMessagingSenderId}
                      onChange={(e) => handleChange('firebaseMessagingSenderId', e.target.value)}
                      placeholder="123456789"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="App ID">
                    <Input
                      value={form.firebaseAppId}
                      onChange={(e) => handleChange('firebaseAppId', e.target.value)}
                      placeholder="1:123456789:web:abc..."
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
                    />
                  </Field>
                  <Field label="VAPID Public Key" required>
                    <Input
                      value={form.firebaseVapidKey}
                      onChange={(e) => handleChange('firebaseVapidKey', e.target.value)}
                      placeholder="BG..."
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                    />
                  </Field>
                </div>
                <Field label="Service Account JSON">
                  <textarea
                    value={form.firebaseServiceAccount}
                    onChange={(e) => handleChange('firebaseServiceAccount', e.target.value)}
                    placeholder='{ "type": "service_account", "project_id": "...", ... }'
                    rows={4}
                    className="w-full rounded-2xl border border-border/10 focus-visible:ring-primary bg-background/50 px-3 py-2 text-xs font-mono resize-y"
                  />
                </Field>
              </div>
              <Separator className="border-border/5" />
              <div className="space-y-4">
                <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  WhatsApp & SMS (Twilio)
                </span>
                <p className="text-xs text-muted-foreground">
                  Configurá Twilio para enviar notificaciones por WhatsApp y SMS.
                  Creá una cuenta en{' '}
                  <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                    Twilio.com
                  </a>, obtené un número de teléfono con capacidad WhatsApp y SMS, y copiá tus credenciales acá.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Account SID">
                    <Input
                      value={form.twilioAccountSid}
                      onChange={(e) => handleChange('twilioAccountSid', e.target.value)}
                      placeholder="AC..."
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                    />
                  </Field>
                  <Field label="Auth Token">
                    <Input
                      type="password"
                      value={form.twilioAuthToken}
                      onChange={(e) => handleChange('twilioAuthToken', e.target.value)}
                      placeholder="••••••••"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                    />
                  </Field>
                  <Field label="Número WhatsApp (con código país)">
                    <Input
                      value={form.twilioWhatsAppNumber}
                      onChange={(e) => handleChange('twilioWhatsAppNumber', e.target.value)}
                      placeholder="whatsapp:+14155238886"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                    />
                  </Field>
                  <Field label="Número SMS (con código país)">
                    <Input
                      value={form.twilioSmsNumber}
                      onChange={(e) => handleChange('twilioSmsNumber', e.target.value)}
                      placeholder="+14155238886"
                      className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
                    />
                  </Field>
                </div>
              </div>
              <Separator className="border-border/5" />
              <div className="space-y-4">
                <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  WhatsApp Templates (Twilio Content API)
                </span>
                <p className="text-xs text-muted-foreground">
                  Configurá los Content SID (<code className="text-primary text-[10px]">HX...</code>) de tus templates aprobados en Twilio Console.
                  Cuando un SID esté configurado, el sistema lo usará automáticamente en vez del mensaje de texto plano.
                  Los mensajes pueden incluir imágenes y botones interactivos.
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  Creá los templates en{' '}
                  <a href="https://console.twilio.com/us1/develop/sms/content-editor" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                    Twilio Console → Content Editor
                  </a>{' '}
                  y copiá acá el Content SID (empieza con <code className="text-primary text-[10px]">HX</code>).
                </p>
                <div className="grid gap-3">
                  <TemplateSidField
                    label="Recordatorio de vencimiento"
                    sid={form.waTemplateExpirationSid}
                    onChange={(v) => handleChange('waTemplateExpirationSid', v)}
                    variables={[
                      { key: '1', desc: 'Nombre del socio' },
                      { key: '2', desc: 'Días hasta vencer (ej: "1")' },
                      { key: '3', desc: 'Fecha de vencimiento' },
                      { key: '4', desc: 'Nombre del gimnasio' },
                    ]}
                  />
                  <TemplateSidField
                    label="Membresía expirada"
                    sid={form.waTemplateExpiredSid}
                    onChange={(v) => handleChange('waTemplateExpiredSid', v)}
                    variables={[
                      { key: '1', desc: 'Nombre del socio' },
                      { key: '2', desc: 'Días de vencido (ej: "5")' },
                      { key: '3', desc: 'Nombre del gimnasio' },
                    ]}
                  />
                  <TemplateSidField
                    label="Feliz cumpleaños"
                    sid={form.waTemplateBirthdaySid}
                    onChange={(v) => handleChange('waTemplateBirthdaySid', v)}
                    variables={[
                      { key: '1', desc: 'Nombre del socio' },
                      { key: '2', desc: 'Nombre del gimnasio' },
                    ]}
                  />
                  <TemplateSidField
                    label="Recuperación inactivos"
                    sid={form.waTemplateInactiveSid}
                    onChange={(v) => handleChange('waTemplateInactiveSid', v)}
                    variables={[
                      { key: '1', desc: 'Nombre del socio' },
                      { key: '2', desc: 'Días inactivo (ej: "30")' },
                      { key: '3', desc: 'Nombre del gimnasio' },
                    ]}
                  />
                  <TemplateSidField
                    label="Recordatorio de clase"
                    sid={form.waTemplateClassReminderSid}
                    onChange={(v) => handleChange('waTemplateClassReminderSid', v)}
                    variables={[
                      { key: '1', desc: 'Nombre del socio' },
                      { key: '2', desc: 'Nombre de la clase' },
                      { key: '3', desc: 'Horario (ej: "10:00")' },
                      { key: '4', desc: 'Sala' },
                      { key: '5', desc: 'Nombre del gimnasio' },
                    ]}
                  />
                </div>
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

function TemplateSidField({
  label,
  sid,
  onChange,
  variables,
}: {
  label: string
  sid: string
  onChange: (value: string) => void
  variables: { key: string; desc: string }[]
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-border/10 bg-background/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-bold text-muted-foreground shrink-0">{label}</Label>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Input
            value={sid}
            onChange={(e) => onChange(e.target.value)}
            placeholder="HX... (dejar vacío = texto plano)"
            className="flex-1 rounded-xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-[11px] h-8"
          />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 font-semibold underline underline-offset-2"
          >
            {expanded ? 'ocultar' : `{{}}`}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="text-[10px] text-muted-foreground bg-background/50 rounded-lg p-2 space-y-0.5">
          <p className="font-semibold mb-1">Variables del template:</p>
          {variables.map((v) => (
            <p key={v.key}>
              <code className="text-primary font-mono">{`{{${v.key}}}`}</code> = {v.desc}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

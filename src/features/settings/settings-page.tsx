import { useState, useEffect, lazy, Suspense } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Settings,
  DollarSign,
  Bell,
  Clock,
  AlertCircle,
  ChevronRight,
  Gift,
  CreditCard,
  Monitor,
  Megaphone,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { getSettings, updateSettings } from '#/features/settings/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { cn } from '#/shared/lib/utils.ts'

// ── Tab Components ──
import { GeneralTab } from '#/features/settings/components/general-tab'
import { BillingTab } from '#/features/settings/components/billing-tab'
import { HoursTab } from '#/features/settings/components/hours-tab'
import { NotificationsTab } from '#/features/settings/components/notifications-tab'
import { PaymentsTab } from '#/features/settings/components/payments-tab'

// ── Lazy-loaded tab content ──
const CouponManagerLazy = lazy(() =>
  import('#/features/loyalty/components/coupon-manager').then((m) => ({
    default: m.CouponManager,
  })),
)
const TvMediaManagerLazy = lazy(() =>
  import('#/features/tv-screen/tv-media-manager').then((m) => ({
    default: m.TvMediaManager,
  })),
)
const PromotionsManagerLazy = lazy(() =>
  import('#/features/promotions/components/promotions-manager').then((m) => ({
    default: m.PromotionsManager,
  })),
)

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

export interface SettingsForm {
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
  companyTaxId: string
  companyLegalName: string
  invoiceFooter: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioWhatsAppNumber: string
  twilioSmsNumber: string
  waTemplateExpirationSid: string
  waTemplateExpiredSid: string
  waTemplateBirthdaySid: string
  waTemplateInactiveSid: string
  waTemplateClassReminderSid: string
  autoRenewSecretKey: string
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
          <Card className="rounded-4xl border-border/10 shadow-xl bg-card p-6 relative overflow-hidden animate-pulse">
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
          <Card className="rounded-4xl border-border/10 bg-card text-foreground overflow-hidden relative">
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
          <GeneralTab
            form={form}
            onChange={handleChange}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            form={form}
            onChange={handleChange}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        )}

        {activeTab === 'hours' && (
          <HoursTab
            form={form}
            onChange={handleChange}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            form={form}
            onChange={handleChange}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        )}

        {activeTab === 'coupons' && (
          <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Cupones de descuento</CardTitle>
              <CardDescription>
                Administrá códigos de descuento para ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
                <CouponManagerLazy />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {activeTab === 'tv' && (
          <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Pantalla TV</CardTitle>
              <CardDescription>
                Configurá el contenido multimedia y mensajes de la pantalla TV pública
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
                <TvMediaManagerLazy />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {activeTab === 'promotions' && (
          <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
            <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black">Promociones y Ofertas</CardTitle>
              <CardDescription>
                Administrá las promociones vigentes del gimnasio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
                <PromotionsManagerLazy />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab
            form={form}
            onChange={handleChange}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        )}
      </ModuleLayout>
    </div>
  )
}

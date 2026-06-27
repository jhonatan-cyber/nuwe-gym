import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  ChevronRight,
  List,
  Search,
  X,
  Banknote,
  CreditCard,
  Building2,
  QrCode,
  Receipt,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { createSubscription } from '#/features/subscriptions/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { getActivePackages } from '#/features/packages/server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Badge } from '#/shared/components/ui/badge'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import type { PaymentMethod } from '../types.ts'

const paymentMethods: {
  value: PaymentMethod
  label: string
  icon: typeof Banknote
}[] = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote },
  { value: 'CARD', label: 'Tarjeta', icon: CreditCard },
  { value: 'TRANSFER', label: 'Transferencia', icon: Building2 },
  { value: 'QR', label: 'QR / Mercado Pago', icon: QrCode },
]

interface SubscriptionFormProps {
  onBack: () => void
}

export function SubscriptionForm({ onBack }: SubscriptionFormProps) {
  const queryClient = useQueryClient()

  const [memberSearch, setMemberSearch] = useState('')
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false)

  const [formData, setFormData] = useState({
    memberId: '',
    packageId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amountPaid: '',
    paymentMethod: 'CASH' as PaymentMethod,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members', ''],
    queryFn: () => getMembers({ data: { search: '' } }),
  })

  const { data: packages = [] } = useQuery({
    queryKey: ['active-packages'],
    queryFn: () => getActivePackages(),
  })

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Suscripción y pago registrados exitosamente')
      onBack()
    },
    onError: () => toast.error('Error al registrar la suscripción'),
  })

  function handlePackageSelect(packageId: string) {
    const pkg = packages.find((p) => p.id === packageId)
    if (!pkg) return
    const start = new Date(formData.startDate)
    start.setDate(start.getDate() + pkg.durationDays)
    setFormData({
      ...formData,
      packageId,
      amountPaid: pkg.price,
      endDate: start.toISOString().split('T')[0],
    })
  }

  function handleStartDateChange(date: string) {
    if (!formData.packageId) {
      setFormData({ ...formData, startDate: date })
      return
    }
    const pkg = packages.find((p) => p.id === formData.packageId)
    const start = new Date(date)
    start.setDate(start.getDate() + (pkg?.durationDays || 30))
    setFormData({
      ...formData,
      startDate: date,
      endDate: start.toISOString().split('T')[0],
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({ data: formData })
  }

  const filteredMembers = members
    .filter((m) => {
      const q = memberSearch.toLowerCase()
      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.documentNumber ?? '').toLowerCase().includes(q)
      )
    })
    .slice(0, 10)

  const selectedMember = members.find((m) => m.id === formData.memberId)

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Suscripciones</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Nueva</span>
        </div>
      }
      title="Nueva Suscripción"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <ToggleGroup
            type="single"
            value="form"
            onValueChange={(v) => {
              if (!v || v === 'list') onBack()
            }}
          >
            <ToggleGroupItem value="list">
              <List className="size-3.5" /> Listado
            </ToggleGroupItem>
            <ToggleGroupItem value="form">
              <Plus className="size-3.5" /> Nuevo
            </ToggleGroupItem>
          </ToggleGroup>
          <img
            src="/logo-ligth.png"
            alt="Logo Gym"
            className="w-full mx-auto opacity-90 dark:hidden block"
          />
          <img
            src="/logo-dark.png"
            alt="Logo Gym"
            className="w-full mx-auto opacity-90 hidden dark:block"
          />
          <div className="flex items-start gap-3 p-3 rounded-2xl dark:bg-white/2 bg-black/2 border dark:border-white/5 border-black/5">
            <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Las suscripciones vinculan a un socio con un paquete activo y
              registran el pago correspondiente.
            </p>
          </div>
        </div>
      }
    >
      <div className="bg-card p-6 rounded-4xl border border-border/10 shadow-xl overflow-y-auto max-h-full">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-sm font-black tracking-tight">
              Alta de Suscripción
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Asigná un paquete a un socio y registrá el pago correspondiente.
            </p>
          </div>

          <div className="grid gap-6 py-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="member" className="text-xs font-bold">
                Socio <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="member"
                  placeholder="Buscar socio por nombre o CI..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value)
                    setIsMemberDropdownOpen(true)
                  }}
                  onFocus={() => setIsMemberDropdownOpen(true)}
                  className="w-full pl-9 pr-10 text-sm rounded-xl"
                  autoComplete="off"
                />
                {selectedMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, memberId: '' })
                      setMemberSearch('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 p-1 rounded-full shrink-0"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {isMemberDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMemberDropdownOpen(false)}
                  />
                  <div className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-60 w-full overflow-auto rounded-2xl border dark:border-white/10 border-black/10 bg-popover p-1.5 text-popover-foreground shadow-2xl backdrop-blur-md">
                    {filteredMembers.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground font-semibold">
                        No se encontraron socios
                      </div>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, memberId: m.id })
                            setMemberSearch(m.fullName)
                            setIsMemberDropdownOpen(false)
                          }}
                        >
                          <div>
                            <p className="font-bold">{m.fullName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              CI: {m.documentNumber}
                            </p>
                          </div>
                          {formData.memberId === m.id && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-none text-[9px] font-bold uppercase">
                              Seleccionado
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-2 border-t pt-4">
              <Label className="text-xs font-bold">
                Paquete de Membresía <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {packages.map((p) => {
                  const isSelected = formData.packageId === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => handlePackageSelect(p.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between gap-3 bg-card hover:shadow-md ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 dark:bg-primary/5 bg-primary/2'
                          : 'border-border/10 dark:hover:border-white/20 hover:border-black/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs tracking-tight truncate">
                            {p.name}
                          </h4>
                          {isSelected && (
                            <Badge className="bg-primary text-primary-foreground text-[8px] font-bold uppercase shrink-0">
                              Seleccionado
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {p.description || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/5 pt-2 mt-auto">
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {p.durationDays} Días
                        </span>
                        <span className="font-extrabold text-xs text-primary">
                          {formatCurrency(p.price)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2 border-t pt-4">
              <Label className="text-xs font-bold">
                Medio de Pago <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {paymentMethods.map((pm) => {
                  const isSelected = formData.paymentMethod === pm.value
                  const Icon = pm.icon
                  return (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, paymentMethod: pm.value })
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 gap-1.5 text-[11px] font-bold ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'border-border/10 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <Icon className="size-4 shrink-0 text-primary" />
                      <span>{pm.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate" className="text-xs font-bold">
                  Fecha de Inicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate" className="text-xs font-bold">
                  Fecha de Vencimiento
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  readOnly
                  className="bg-muted"
                  value={formData.endDate}
                />
                <p className="text-[10px] text-muted-foreground">
                  Calculado automáticamente por el paquete.
                </p>
              </div>
            </div>

            {formData.memberId && formData.packageId ? (
              <div className="relative overflow-hidden bg-primary/5 border border-primary/10 rounded-[1.25rem] p-5 flex flex-col gap-3 group mt-2">
                <div className="flex items-center justify-between border-b dark:border-white/5 border-black/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-5 text-primary" />
                    <span className="font-bold text-sm text-foreground">
                      Resumen de Operación
                    </span>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                    Listo para confirmar
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Socio
                    </span>
                    <p className="font-bold text-foreground truncate mt-0.5">
                      {selectedMember?.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Paquete
                    </span>
                    <p className="font-bold text-foreground truncate mt-0.5">
                      {packages.find((p) => p.id === formData.packageId)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Medio de Pago
                    </span>
                    <p className="font-bold text-foreground mt-0.5">
                      {
                        paymentMethods.find(
                          (p) => p.value === formData.paymentMethod,
                        )?.label
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Vigencia
                    </span>
                    <p className="font-bold text-foreground mt-0.5">
                      {formatDate(new Date(formData.startDate))} hasta{' '}
                      {formatDate(new Date(formData.endDate))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t dark:border-white/5 border-black/5 pt-3 mt-1.5">
                  <span className="text-sm font-bold text-foreground">
                    Monto Total
                  </span>
                  <span className="text-3xl font-black text-primary tracking-tight">
                    {formatCurrency(formData.amountPaid || 0)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!formData.memberId || !formData.packageId}
              className="bg-foreground text-primary-foreground hover:bg-foreground/90"
            >
              Confirmar Suscripción y Pago
            </LoadingButton>
          </div>
        </form>
      </div>
    </ModuleLayout>
  )
}

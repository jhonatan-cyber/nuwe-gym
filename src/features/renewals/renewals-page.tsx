import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  User,
  RefreshCw,
  ArrowLeft,
  Plus,
  Check,
  AlertTriangle,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  renewSubscription,
  getMemberRenewalHistory,
} from '#/features/renewals/server.ts'
import { getActivePackages } from '#/features/packages/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { getCurrentCashSession } from '#/features/cash-register/server.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { WizardSidebar } from '#/features/renewals/components/wizard-sidebar.tsx'
import { WizardFooter } from '#/features/renewals/wizard-footer.tsx'
import { MemberHeaderCard } from '#/features/renewals/components/member-header-card.tsx'
import { PlanSummaryCard } from '#/features/renewals/components/plan-summary-card.tsx'
import { PAYMENT_METHODS } from '#/features/renewals/utils.ts'
import type { Step, PaymentMethod, MemberWithSubscriptions } from '#/features/renewals/types.ts'

export function RenewalsPage() {
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberWithSubscriptions | null>(null)
  const [isChangingPlan, setIsChangingPlan] = useState(false)

  const [formData, setFormData] = useState({
    packageId: 0,
    paymentMethod: 'CASH' as PaymentMethod,
    amount: '',
    notes: '',
  })

  const { data: cashSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session'],
    queryFn: () => getCurrentCashSession(),
  })
  const isCashRegisterOpen = !!cashSession

  const { data: packages = [] } = useQuery({
    queryKey: ['active-packages'],
    queryFn: () => getActivePackages(),
  })

  const { data: memberSearchResults = [], isLoading: searchingMembers } = useQuery({
    queryKey: ['member-search', searchQuery],
    queryFn: () => getMembers({ data: { search: searchQuery } }),
    enabled: searchQuery.length >= 2,
  })

  const { data: renewalHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['member-renewal-history', selectedMember?.id],
    queryFn: () => getMemberRenewalHistory({ data: { memberId: selectedMember!.id } }),
    enabled: !!selectedMember?.id,
  })

  const renewMutation = useMutation({
    mutationFn: renewSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['member-renewal-history'] })
      toast.success('Membresía renovada exitosamente')
      handleReset()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al renovar la membresía')
    },
  })

  function handleReset() {
    setStep(1)
    setSelectedMember(null)
    setSearchQuery('')
    setIsChangingPlan(false)
    setFormData({ packageId: 0, paymentMethod: 'CASH', amount: '', notes: '' })
  }

  function handleSelectMember(member: any) {
    setSelectedMember(member)
    setStep(2)
  }

  useEffect(() => {
    if (!loadingHistory && selectedMember) {
      if (renewalHistory.length > 0) {
        const lastSub = renewalHistory[0]
        if (lastSub.packageId) {
          setFormData((prev) => ({
            ...prev,
            packageId: lastSub.packageId!,
            amount: lastSub.package?.price || lastSub.plan?.price || '',
          }))
          setIsChangingPlan(false)
        } else {
          setIsChangingPlan(true)
        }
      } else {
        setIsChangingPlan(true)
      }
    }
  }, [renewalHistory, loadingHistory, selectedMember])

  const selectedPkg = packages.find((p) => p.id === formData.packageId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember || !formData.packageId || !isCashRegisterOpen) return
    renewMutation.mutate({
      data: {
        memberId: selectedMember.id,
        packageId: formData.packageId,
        paymentMethod: formData.paymentMethod,
        amount: formData.amount,
        notes: formData.notes || undefined,
      },
    })
  }

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hover:underline cursor-pointer" onClick={handleReset}>Renovación</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Asistente</span>
        </div>
      }
      title="Renovacion"
      leftPanel={
        <WizardSidebar
          step={step}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          memberSearchResults={memberSearchResults}
          searchingMembers={searchingMembers}
          selectedMember={selectedMember}
          onSelectMember={handleSelectMember}
          handleReset={handleReset}
        />
      }
    >
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px] mx-auto w-full max-w-xl animate-in fade-in duration-300">
            <div className="size-16 rounded-3xl dark:bg-white/5 bg-black/5 flex items-center justify-center mb-5 animate-pulse">
              <User className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Asistente de Renovación de Membresía</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px] text-center leading-normal">
              Por favor, busque y seleccione un socio en el panel izquierdo para comenzar con el proceso de renovación.
            </p>
          </div>
        )}

        {step === 2 && selectedMember && (
          <Step2Content
            selectedMember={selectedMember}
            isChangingPlan={isChangingPlan}
            setIsChangingPlan={setIsChangingPlan}
            formData={formData}
            setFormData={setFormData}
            packages={packages}
            renewalHistory={renewalHistory}
            loadingHistory={loadingHistory}
            selectedPkg={selectedPkg}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && selectedMember && selectedPkg && (
          <Step3Content
            selectedMember={selectedMember}
            selectedPkg={selectedPkg}
            formData={formData}
            setFormData={setFormData}
            isCashRegisterOpen={isCashRegisterOpen}
            isLoadingSession={isLoadingSession}
            isPending={renewMutation.isPending}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </ModuleLayout>
  )
}

// ── Step 2 — Plan Selection ──

interface Step2Props {
  selectedMember: MemberWithSubscriptions
  isChangingPlan: boolean
  setIsChangingPlan: (v: boolean) => void
  formData: { packageId: number; amount: string }
  setFormData: (v: any) => void
  packages: any[]
  renewalHistory: any[]
  loadingHistory: boolean
  selectedPkg: any
  onNext: () => void
  onBack: () => void
}

function Step2Content({
  selectedMember,
  isChangingPlan,
  setIsChangingPlan,
  formData,
  setFormData,
  packages,
  renewalHistory,
  loadingHistory,
  selectedPkg,
  onNext,
  onBack,
}: Step2Props) {
  return (
    <div className="p-6 flex-1 flex flex-col min-w-0 justify-between mx-auto w-full max-w-xl animate-in fade-in duration-300">
      <div className="space-y-6">
        <MemberHeaderCard member={selectedMember} />

        <div className="text-center">
          <h3 className="text-xl font-black tracking-tight text-foreground">Selecciona un Plan</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">TRAINIX</p>
        </div>

        <div className="flex items-center justify-center gap-3">
          {renewalHistory.length > 0 && (
            <Button
              onClick={() => {
                const lastSub = renewalHistory[0]
                if (lastSub.packageId) {
                  setFormData((prev: any) => ({
                    ...prev,
                    packageId: lastSub.packageId!,
                    amount: lastSub.package?.price || lastSub.plan?.price || '',
                  }))
                  setIsChangingPlan(false)
                }
              }}
              className={`h-10 px-5 rounded-full text-xs font-bold gap-1.5 transition-all duration-300 ${
                !isChangingPlan
                  ? 'bg-foreground text-primary-foreground hover:bg-foreground/90'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Check className="size-3.5" />
              Continuar con Último
            </Button>
          )}
          <Button
            onClick={() => setIsChangingPlan(true)}
            className={`h-10 px-5 rounded-full text-xs font-bold gap-1.5 transition-all duration-300 ${
              isChangingPlan
                ? 'bg-foreground text-primary-foreground hover:bg-foreground/90'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Plus className="size-3.5" />
            Cambiar
          </Button>
        </div>

        {isChangingPlan ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seleccione un Paquete</p>
              {renewalHistory.length > 0 && (
                <Button
                  onClick={() => {
                    const lastSub = renewalHistory[0]
                    if (lastSub.packageId) {
                      setFormData((prev: any) => ({
                        ...prev,
                        packageId: lastSub.packageId!,
                        amount: lastSub.package?.price || lastSub.plan?.price || '',
                      }))
                    }
                    setIsChangingPlan(false)
                  }}
                  className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  Atrás
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
              {packages.map((pkg: any) => (
                <div
                  key={pkg.id}
                  onClick={() => {
                    setFormData((prev: any) => ({ ...prev, packageId: pkg.id, amount: pkg.price }))
                    setIsChangingPlan(false)
                  }}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex justify-between items-center ${
                    formData.packageId === pkg.id
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-muted/40 border-border/10 hover:bg-muted hover:border-border/20'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{pkg.name}</p>
                    <p className="text-[9px] text-muted-foreground font-semibold mt-1">Duración: {pkg.durationDays} días</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-xs text-primary">{formatCurrency(pkg.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loadingHistory ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <RefreshCw className="size-3.5 animate-spin text-primary" />
            <span>Cargando último paquete...</span>
          </div>
        ) : renewalHistory.length > 0 && renewalHistory[0] ? (
          (() => {
            const lastSub = renewalHistory[0]
            return (
              <PlanSummaryCard
                title={`Último Paquete | ${lastSub.package?.name || lastSub.plan?.name || 'Suscripción'}`}
                price={lastSub.package?.price || lastSub.plan?.price || '0'}
                durationDays={lastSub.package?.durationDays || lastSub.plan?.durationDays || 30}
                startDate={new Date(lastSub.startDate)}
                endDate={new Date(lastSub.endDate)}
              />
            )
          })()
        ) : selectedPkg ? (
          <PlanSummaryCard
            title={`Nuevo Paquete | ${selectedPkg.name}`}
            price={selectedPkg.price}
            durationDays={selectedPkg.durationDays}
            startDate={new Date()}
            endDate={new Date(Date.now() + selectedPkg.durationDays * 24 * 60 * 60 * 1000)}
          />
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">Por favor seleccione un plan.</p>
        )}
      </div>

      <WizardFooter step={2} ready={!!formData.packageId} onBack={onBack} onNext={onNext} />
    </div>
  )
}

// ── Step 3 — Payment ──

interface Step3Props {
  selectedMember: MemberWithSubscriptions
  selectedPkg: any
  formData: { packageId: number; paymentMethod: PaymentMethod; amount: string; notes: string }
  setFormData: (v: any) => void
  isCashRegisterOpen: boolean
  isLoadingSession: boolean
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}

function Step3Content({
  selectedMember,
  selectedPkg,
  formData,
  setFormData,
  isCashRegisterOpen,
  isLoadingSession,
  isPending,
  onSubmit,
  onBack,
}: Step3Props) {
  return (
    <form onSubmit={onSubmit} className="p-6 flex-1 flex flex-col min-w-0 justify-between mx-auto w-full max-w-xl animate-in fade-in duration-300">
      <div className="space-y-6">
        <MemberHeaderCard member={selectedMember} extraInfo={`Paquete: ${selectedPkg.name}`} />

        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">Pago de Inscripción</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Seleccione un método de pago
          </p>
        </div>

        {!isLoadingSession && !isCashRegisterOpen && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-destructive">Caja Cerrada</p>
              <p className="text-[10px] text-destructive/85 font-medium leading-normal">
                Debe abrir la caja en el módulo de Caja antes de poder confirmar la renovación.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon
            const isSelected = formData.paymentMethod === pm.value
            return (
              <div
                key={pm.value}
                onClick={() => setFormData({ ...formData, paymentMethod: pm.value })}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-28 group relative ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-sm'
                    : 'bg-muted/40 border-border/10 hover:bg-muted hover:border-border/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'
                  }`}>
                    <Icon className="size-5" />
                  </div>
                  {isSelected && (
                    <div className="size-4.5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="size-2.5 text-primary-foreground stroke-[3px]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-xs leading-none">{pm.label}</p>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-1">{pm.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="amount" className="text-xs font-bold">
              Monto <span className="text-destructive">*</span>
            </Label>
            <Input id="amount" type="number" step="0.01" min="0" required value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="h-10 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-xs font-bold">Notas (opcional)</Label>
            <Input id="notes" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas de renovación..." className="h-10 rounded-xl" />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Receipt className="size-5" />
            <span className="text-sm">Total</span>
          </div>
          <div className="text-2xl font-black text-primary">{formatCurrency(formData.amount || 0)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t dark:border-white/5 border-black/5 mt-6 shrink-0">
        <Button type="button" onClick={onBack}
          className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 gap-1.5">
          <ArrowLeft className="size-3.5" />
          Atrás
        </Button>
        <LoadingButton type="submit" isLoading={isPending} disabled={!formData.amount || !isCashRegisterOpen}
          className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 disabled:opacity-50">
          Confirmar Renovación
        </LoadingButton>
      </div>
    </form>
  )
}

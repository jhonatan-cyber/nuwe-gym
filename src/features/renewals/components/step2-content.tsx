import { Check, Plus, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { MemberHeaderCard } from '#/features/renewals/components/member-header-card.tsx'
import { PlanSummaryCard } from '#/features/renewals/components/plan-summary-card.tsx'
import { WizardFooter } from '#/features/renewals/wizard-footer.tsx'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import type { MemberWithSubscriptions } from '#/features/renewals/types.ts'

interface Step2Props {
  selectedMember: MemberWithSubscriptions
  isChangingPlan: boolean
  setIsChangingPlan: (v: boolean) => void
  formData: { packageId: string; amount: string }
  setFormData: (v: any) => void
  packages: any[]
  renewalHistory: any[]
  loadingHistory: boolean
  selectedPkg: any
  onNext: () => void
  onBack: () => void
}

export function Step2Content({
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
          <h3 className="text-xl font-black tracking-tight text-foreground">
            Selecciona un Plan
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            TRAINIX
          </p>
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
                    amount: lastSub.package?.price || '',
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
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Seleccione un Paquete
              </p>
              {renewalHistory.length > 0 && (
                <Button
                  onClick={() => {
                    const lastSub = renewalHistory[0]
                    if (lastSub.packageId) {
                      setFormData((prev: any) => ({
                        ...prev,
                        packageId: lastSub.packageId!,
                        amount:
                          lastSub.package?.price || '',
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
                    setFormData((prev: any) => ({
                      ...prev,
                      packageId: pkg.id,
                      amount: pkg.price,
                    }))
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
                    <p className="text-[9px] text-muted-foreground font-semibold mt-1">
                      Duración: {pkg.durationDays} días
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-xs text-primary">
                      {formatCurrency(pkg.price)}
                    </p>
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
            const isActive = lastSub.status === 'ACTIVE' && new Date(lastSub.endDate) >= new Date()
            const titleText = isActive
              ? `Paquete Actual | ${lastSub.package?.name || 'Suscripción'}`
              : `Último Paquete | ${lastSub.package?.name || 'Suscripción'}`
            return (
              <PlanSummaryCard
                title={titleText}
                price={lastSub.package?.price || '0'}
                durationDays={
                  lastSub.package?.durationDays ||
                  30
                }
                startDate={new Date(lastSub.startDate)}
                endDate={new Date(lastSub.endDate)}
                status={isActive ? 'ACTIVE' : 'EXPIRED'}
              />
            )
          })()
        ) : selectedPkg ? (
          <PlanSummaryCard
            title={`Nuevo Paquete | ${selectedPkg.name}`}
            price={selectedPkg.price}
            durationDays={selectedPkg.durationDays}
            startDate={new Date()}
            endDate={
              new Date(
                Date.now() + selectedPkg.durationDays * 24 * 60 * 60 * 1000,
              )
            }
          />
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            Por favor seleccione un plan.
          </p>
        )}
      </div>

      <WizardFooter
        step={2}
        ready={!!formData.packageId}
        onBack={onBack}
        onNext={onNext}
      />
    </div>
  )
}

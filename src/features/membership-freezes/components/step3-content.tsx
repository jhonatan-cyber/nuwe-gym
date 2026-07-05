import { AlertTriangle, Snowflake, ArrowLeft } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { MemberHeaderCard } from '#/features/membership-freezes/components/member-header-card.tsx'
import { formatDate } from '#/shared/lib/formatters.ts'
import type { MemberWithSubscriptions, FreezeFormData } from '../types.ts'

interface Step3Props {
  selectedMember: MemberWithSubscriptions
  formData: FreezeFormData
  selectedSub: any
  calculatedEndDate: Date | null
  freezeDays: number
  isPending: boolean
  isCashRegisterOpen: boolean
  isLoadingSession: boolean
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}

export function Step3Content({
  selectedMember,
  formData,
  selectedSub,
  calculatedEndDate,
  freezeDays,
  isPending,
  isCashRegisterOpen,
  isLoadingSession,
  onSubmit,
  onBack,
}: Step3Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="p-6 flex-1 flex flex-col min-w-0 justify-between mx-auto w-full max-w-xl animate-in fade-in duration-300"
    >
      <div className="space-y-6">
        <MemberHeaderCard
          member={selectedMember}
          extraInfo={`Suscripción: ${selectedSub?.package?.name || 'N/A'}`}
        />

        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">
            Confirmar Congelamiento
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Revise los detalles antes de confirmar
          </p>
        </div>

        {!isLoadingSession && !isCashRegisterOpen && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-destructive">Caja Cerrada</p>
              <p className="text-[10px] text-destructive/85 font-medium leading-normal">
                Debe abrir la caja en el módulo de Caja antes de poder confirmar
                el congelamiento.
              </p>
            </div>
          </div>
        )}

        <div className="bg-muted/30 dark:bg-muted/10 rounded-2xl border border-border/10 p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Snowflake className="size-4 text-sky-500" />
            <span className="text-sm font-bold">Resumen del Congelamiento</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">
                Suscripción
              </span>
              <span className="text-xs font-bold text-foreground">
                {selectedSub?.package?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">
                Período de congelamiento
              </span>
              <span className="text-xs font-bold text-foreground">
                {formatDate(new Date(formData.startDate))} →{' '}
                {formatDate(new Date(formData.endDate))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">
                Días congelados
              </span>
              <span className="text-xs font-bold text-sky-600">
                {freezeDays} días
              </span>
            </div>
            {selectedSub && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">
                  Vencimiento actual
                </span>
                <span className="text-xs font-bold text-foreground">
                  {formatDate(new Date(selectedSub.endDate))}
                </span>
              </div>
            )}
            {calculatedEndDate && (
              <div className="flex justify-between items-center pt-2 border-t dark:border-white/5 border-black/5">
                <span className="text-xs text-muted-foreground font-medium">
                  Nuevo vencimiento
                </span>
                <span className="text-xs font-bold text-primary">
                  {formatDate(calculatedEndDate)}
                </span>
              </div>
            )}
            {formData.reason && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-muted-foreground font-medium shrink-0">
                  Motivo
                </span>
                <span className="text-xs text-foreground text-right">
                  {formData.reason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t dark:border-white/5 border-black/5 mt-6 shrink-0">
        <Button
          type="button"
          onClick={onBack}
          className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Atrás
        </Button>
        <LoadingButton
          type="submit"
          isLoading={isPending}
          disabled={!isCashRegisterOpen}
          className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 disabled:opacity-50"
        >
          Confirmar Congelamiento
        </LoadingButton>
      </div>
    </form>
  )
}

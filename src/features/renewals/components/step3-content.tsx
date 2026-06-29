import { AlertTriangle, Check, Receipt, ArrowLeft } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { MemberHeaderCard } from '#/features/renewals/components/member-header-card.tsx'
import { PAYMENT_METHODS } from '#/features/renewals/utils.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import type {
  MemberWithSubscriptions,
  PaymentMethod,
} from '#/features/renewals/types.ts'

interface Step3Props {
  selectedMember: MemberWithSubscriptions
  selectedPkg: any
  formData: {
    packageId: string
    paymentMethod: PaymentMethod
    amount: string
    notes: string
  }
  setFormData: (v: any) => void
  isCashRegisterOpen: boolean
  isLoadingSession: boolean
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}

export function Step3Content({
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
    <form
      onSubmit={onSubmit}
      className="p-6 flex-1 flex flex-col min-w-0 justify-between mx-auto w-full max-w-xl animate-in fade-in duration-300"
    >
      <div className="space-y-6">
        <MemberHeaderCard
          member={selectedMember}
          extraInfo={`Paquete: ${selectedPkg.name}`}
        />

        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">
            Pago de Inscripción
          </h3>
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
                Debe abrir la caja en el módulo de Caja antes de poder confirmar
                la renovación.
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
                onClick={() =>
                  setFormData({ ...formData, paymentMethod: pm.value })
                }
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-28 group relative ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-sm'
                    : 'bg-muted/40 border-border/10 hover:bg-muted hover:border-border/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'
                    }`}
                  >
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
                  <p className="text-[9px] text-muted-foreground font-semibold mt-1">
                    {pm.description}
                  </p>
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
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="h-10 rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-xs font-bold">
              Notas (opcional)
            </Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas de renovación..."
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Receipt className="size-5" />
            <span className="text-sm">Total</span>
          </div>
          <div className="text-2xl font-black text-primary">
            {formatCurrency(formData.amount || 0)}
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
          disabled={!formData.amount || !isCashRegisterOpen}
          className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 disabled:opacity-50"
        >
          Confirmar Renovación
        </LoadingButton>
      </div>
    </form>
  )
}

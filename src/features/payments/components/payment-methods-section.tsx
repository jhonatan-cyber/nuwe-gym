import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  CreditCard,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import {
  createSetupIntent,
  getMemberPaymentMethods,
  toggleAutoPay,
  removePaymentMethod,
} from '#/features/payments/stripe-server.ts'

const CARD_BRAND_LOGOS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  default: '💳',
}

interface PaymentMethodsSectionProps {
  memberId: string
}

export function PaymentMethodsSection({ memberId }: PaymentMethodsSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [pmToDelete, setPmToDelete] = useState<string | null>(null)

  const { data: methods, refetch } = useQuery({
    queryKey: ['memberPaymentMethods', memberId],
    queryFn: () => getMemberPaymentMethods({ data: { memberId } }),
  })

  const setupMutation = useMutation({
    mutationFn: () => createSetupIntent({ data: { memberId } }),
    onSuccess: () => {
      // We need to use Stripe Elements to collect card details
      // For now, show the client secret so the user can use Stripe's approach
      toast.success('Conectando con Stripe...')
      // In a real implementation, you'd redirect to a Stripe Elements form
      // or use Stripe Checkout. The clientSecret is ready.
      setIsAdding(true)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; autoPay: boolean }) =>
      toggleAutoPay({ data }),
    onSuccess: () => {
      toast.success('Preferencia de pago automático actualizada')
      refetch()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePaymentMethod({ data: { id } }),
    onSuccess: () => {
      toast.success('Método de pago eliminado')
      setPmToDelete(null)
      refetch()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <CreditCard className="size-4" />
            Métodos de Pago
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tarjetas guardadas para cobro automático de membresías.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className="text-xs"
        >
          {setupMutation.isPending ? (
            <Loader2 className="size-3.5 mr-1 animate-spin" />
          ) : (
            <Plus className="size-3.5 mr-1" />
          )}
          Agregar tarjeta
        </Button>
      </div>

      {(!methods || methods.length === 0) && !isAdding && (
        <div className="text-center py-6 rounded-xl bg-muted/20 border border-dashed border-border/20">
          <CreditCard className="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No hay tarjetas guardadas. Agregá una para activar el cobro automático.
          </p>
        </div>
      )}

      {methods?.map((pm) => (
        <div
          key={pm.id}
          className="flex items-center justify-between p-3 rounded-xl border border-border/10 bg-background/50"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
              {CARD_BRAND_LOGOS[pm.cardBrand?.toLowerCase()] ?? CARD_BRAND_LOGOS.default}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm capitalize">
                  {pm.cardBrand || 'Tarjeta'}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  **** {pm.cardLast4}
                </span>
                {pm.isDefault && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Default
                  </Badge>
                )}
              </div>
              {pm.cardExpMonth && pm.cardExpYear && (
                <p className="text-[10px] text-muted-foreground">
                  Expira {pm.cardExpMonth}/{pm.cardExpYear}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                toggleMutation.mutate({ id: pm.id, autoPay: !pm.autoPay })
              }
              disabled={toggleMutation.isPending}
              className={`p-1.5 rounded-lg transition-colors ${
                pm.autoPay
                  ? 'text-emerald-600 hover:bg-emerald-500/10'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
              title={pm.autoPay ? 'Auto-pago activado' : 'Activar auto-pago'}
            >
              {pm.autoPay ? (
                <ToggleRight className="size-4" />
              ) : (
                <ToggleLeft className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setPmToDelete(pm.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Eliminar tarjeta"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}

      {pmToDelete && (
        <ConfirmDialog
          open={!!pmToDelete}
          onOpenChange={(open) => {
            if (!open) setPmToDelete(null)
          }}
          title="Eliminar método de pago"
          description="¿Estás seguro de eliminar esta tarjeta? Se desactivará el cobro automático asociado."
          confirmText="Eliminar"
          variant="destructive"
          onConfirm={() => deleteMutation.mutate(pmToDelete)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {isAdding && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
          <Shield className="size-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold">Conectando con Stripe...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Completá el formulario seguro de Stripe para guardar tu tarjeta.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setIsAdding(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}

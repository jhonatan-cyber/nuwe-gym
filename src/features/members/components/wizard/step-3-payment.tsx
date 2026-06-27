import { Check, Banknote, WalletCards, Smartphone } from 'lucide-react'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { Label } from '#/shared/components/ui/label'

const PAYMENT_METHODS = [
  { value: 'CASH' as const, label: 'Efectivo', icon: Banknote },
  { value: 'CARD' as const, label: 'Tarjeta', icon: WalletCards },
  { value: 'TRANSFER' as const, label: 'Transferencia', icon: Smartphone },
  { value: 'QR' as const, label: 'QR', icon: Smartphone },
]

interface Step3Props {
  selectedPackage?: { name: string; price: string | number; durationDays: number } | null
  paymentMethod: string
  onMethodChange: (method: 'CASH' | 'CARD' | 'TRANSFER' | 'QR') => void
}

export function Step3Payment({ selectedPackage, paymentMethod, onMethodChange }: Step3Props) {
  const price = selectedPackage ? formatCurrency(Number(selectedPackage.price)) : '—'
  const label = selectedPackage
    ? `Paquete ${selectedPackage.name} · ${selectedPackage.durationDays} días`
    : ''

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
        Pago de Inscripción
      </h2>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6">
        Confirmá el monto y método de pago
      </p>
      <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.02] p-6 mb-5 text-center border border-gray-200 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
          Total a pagar
        </p>
        <p className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">{price}</p>
        {selectedPackage && (
          <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-2">{label}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label className="text-xs font-bold text-gray-700 dark:text-white/70">Método de Pago</Label>
        {PAYMENT_METHODS.map((method) => {
          const isSelected = paymentMethod === method.value
          const Icon = method.icon
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onMethodChange(method.value)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'bg-gray-900/5 border-gray-900 dark:bg-white/5 dark:border-white'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-white/20'
              }`}
            >
              <div
                className={`size-9 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60'
                }`}
              >
                <Icon className="size-4" />
              </div>
              <span className={`font-bold text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40'}`}>
                {method.label}
              </span>
              {isSelected && <Check className="size-4 ml-auto text-gray-900 dark:text-white" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

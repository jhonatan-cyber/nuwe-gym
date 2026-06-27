import { CheckCircle2, User, Building2, CreditCard, MessageCircle } from 'lucide-react'
import { getPaymentMethodLabel } from '#/shared/lib/subscription-utils.ts'
import { Button } from '#/shared/components/ui/button'

interface Step5Props {
  createdMemberName: string
  createdPlanName: string
  paymentMethod: string
  onSendWhatsApp: () => void
  onFinish: () => void
}

export function Step5Complete({ createdMemberName, createdPlanName, paymentMethod, onSendWhatsApp, onFinish }: Step5Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="relative mb-5">
        <div className="size-20 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="size-10 text-gray-900 dark:text-white animate-in fade-in duration-700" />
        </div>
        <div className="absolute inset-0 size-20 rounded-2xl bg-gray-200/50 dark:bg-white/10 animate-ping" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
        ¡Registro Completo!
      </h2>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6">
        Socio registrado exitosamente
      </p>
      <div className="w-full max-w-sm rounded-2xl bg-gray-50 dark:bg-white/[0.02] p-5 mb-6 text-left border border-gray-200 dark:border-white/10 space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <User className="size-4 text-gray-500 dark:text-white/60" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">Socio</p>
            <p className="font-black text-gray-900 dark:text-white">{createdMemberName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <Building2 className="size-4 text-gray-500 dark:text-white/60" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">Plan</p>
            <p className="font-black text-gray-900 dark:text-white">{createdPlanName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <CreditCard className="size-4 text-gray-500 dark:text-white/60" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">Método de Pago</p>
            <p className="font-black text-gray-900 dark:text-white capitalize">{getPaymentMethodLabel(paymentMethod)}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button
          type="button"
          onClick={onSendWhatsApp}
          className="font-black bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 min-w-[200px]"
        >
          <MessageCircle className="size-4 mr-2" /> Enviar por WhatsApp
        </Button>
        <Button
          onClick={onFinish}
          className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black min-w-[200px]"
        >
          Finalizar
        </Button>
      </div>
    </div>
  )
}

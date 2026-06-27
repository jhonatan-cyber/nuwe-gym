import { Coins, CreditCard, Building2, QrCode } from 'lucide-react'
import type { PaymentMethod } from './types.ts'

export interface PaymentMethodOption {
  value: PaymentMethod
  label: string
  icon: typeof Coins
  description: string
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'CASH', label: 'Efectivo', icon: Coins, description: 'Pago físico en efectivo' },
  { value: 'CARD', label: 'Tarjeta', icon: CreditCard, description: 'Débito o crédito' },
  { value: 'TRANSFER', label: 'Transferencia', icon: Building2, description: 'Banco o transferencia directa' },
  { value: 'QR', label: 'QR', icon: QrCode, description: 'QR / Mercado Pago' },
]

export const STEPS = [
  { id: 1 as const, label: 'Seleccion de Persona', sublabel: 'Registre los datos de la persona' },
  { id: 2 as const, label: 'Selección de Plan', sublabel: 'Elija un plan de inscripción' },
  { id: 3 as const, label: 'Pago de Inscripción', sublabel: 'Seleccione un método de pago' },
]

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

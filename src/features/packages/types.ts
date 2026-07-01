import type { getPackages } from '#/features/packages/server.ts'

export type PackageType = 'PACKAGE' | 'PROMOTION' | 'SPECIAL' | 'DAILY_PASS'
export type RenewalType = 'MANUAL' | 'AUTO'

export interface PackageItem {
  description: string
  sortOrder: number
}

export interface AllowedDay {
  dayOfWeek: number
  startTime?: string
  endTime?: string
}

export interface PackageBenefit {
  benefitKey: string
  enabled: boolean
}

export const BENEFIT_CATALOG = [
  { key: 'unlimited_access', label: 'Acceso ilimitado' },
  { key: 'scheduled_access', label: 'Acceso por horarios' },
  { key: 'group_classes', label: 'Clases grupales' },
  { key: 'custom_routine', label: 'Rutina personalizada' },
  { key: 'physical_eval', label: 'Evaluación física' },
  { key: 'nutritionist', label: 'Nutricionista' },
  { key: 'personal_trainer', label: 'Entrenador personal' },
  { key: 'freeze', label: 'Congelamiento de membresía' },
  { key: 'guests', label: 'Invitados' },
  { key: 'locker', label: 'Casillero' },
  { key: 'sauna', label: 'Sauna' },
  { key: 'pool', label: 'Piscina' },
  { key: 'parking', label: 'Estacionamiento' },
  { key: 'supplement_discount', label: 'Descuento en suplementos' },
  { key: 'store_discount', label: 'Descuento en tienda' },
  { key: 'branch_access', label: 'Acceso a sucursales' },
  { key: 'vip_access', label: 'Acceso VIP' },
  { key: 'towel', label: 'Toalla incluida' },
  { key: 'drinks', label: 'Bebidas incluidas' },
  { key: 'class_booking', label: 'Reserva de clases' },
  { key: 'access_24_7', label: 'Acceso 24/7' },
] as const

export type BenefitKey = (typeof BENEFIT_CATALOG)[number]['key']

export interface PackageFormData {
  name: string
  description: string
  imageBase64: string
  price: string
  durationDays: number
  type: PackageType
  renewalType: RenewalType
  graceDays: number
  maxFreezes: number
  maxFreezeDays: number
  allowedStartTime: string
  allowedEndTime: string
  dailyAccessLimit: number | undefined
  color: string
  isActive: boolean
  allowedDays: AllowedDay[]
  benefits: PackageBenefit[]
}

export const EMPTY_FORM: PackageFormData = {
  name: '',
  description: '',
  imageBase64: '',
  price: '',
  durationDays: 30,
  type: 'PACKAGE',
  renewalType: 'MANUAL',
  graceDays: 0,
  maxFreezes: 0,
  maxFreezeDays: 0,
  allowedStartTime: '',
  allowedEndTime: '',
  dailyAccessLimit: undefined,
  color: '',
  isActive: true,
  allowedDays: [],
  benefits: BENEFIT_CATALOG.map((b) => ({ benefitKey: b.key, enabled: false })),
}

export const TYPE_OPTIONS: { value: PackageType; label: string }[] = [
  { value: 'PACKAGE', label: 'Paquete' },
  { value: 'PROMOTION', label: 'Promocion' },
  { value: 'SPECIAL', label: 'Especial' },
]

export const RENEWAL_OPTIONS: { value: RenewalType; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTO', label: 'Automatica' },
]

export const DAY_LABELS = [
  'Dom',
  'Lun',
  'Mar',
  'Mie',
  'Jue',
  'Vie',
  'Sab',
]

export const DAY_LABELS_FULL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
]

export type Package = Awaited<ReturnType<typeof getPackages>>[number]

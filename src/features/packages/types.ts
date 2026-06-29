import type { getPackages } from '#/features/packages/server.ts'

export type PackageType = 'PACKAGE' | 'PROMOTION' | 'SPECIAL'
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
  items: PackageItem[]
  allowedDays: AllowedDay[]
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
  items: [],
  allowedDays: [],
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

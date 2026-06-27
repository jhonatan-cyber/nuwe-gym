import type { getPackages } from '#/features/packages/server.ts'

export type PackageType = 'PACKAGE' | 'PROMOTION' | 'SPECIAL'

export interface PackageItem {
  description: string
  sortOrder: number
}

export interface PackageFormData {
  name: string
  description: string
  imageBase64: string
  price: string
  durationDays: number
  type: PackageType
  isActive: boolean
  items: PackageItem[]
}

export const EMPTY_FORM: PackageFormData = {
  name: '',
  description: '',
  imageBase64: '',
  price: '',
  durationDays: 30,
  type: 'PACKAGE',
  isActive: true,
  items: [],
}

export const TYPE_OPTIONS: { value: PackageType; label: string }[] = [
  { value: 'PACKAGE', label: 'Paquete' },
  { value: 'PROMOTION', label: 'Promocion' },
  { value: 'SPECIAL', label: 'Especial' },
]

export type Package = Awaited<ReturnType<typeof getPackages>>[number]

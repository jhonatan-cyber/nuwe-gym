import type { getEmployees } from './server.ts'

export type Employee = Awaited<ReturnType<typeof getEmployees>>[number]

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'
export type PaymentFrequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ON_LEAVE: 'De licencia',
  TERMINATED: 'Desvinculado',
}

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  INACTIVE: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  ON_LEAVE: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  TERMINATED: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
  WEEKLY: 'Semanal',
}

export const POSITIONS = [
  'Recepcionista',
  'Entrenador',
  'Limpieza',
  'Administrativo',
  'Gerente',
  'Contador',
  'Marketing',
  'Mantenimiento',
  'Instructor de Clases',
  'Otro',
] as const

export const DEPARTMENTS = [
  'Administración',
  'Entrenamiento',
  'Recepcion',
  'Limpieza y Mantenimiento',
  'Marketing y Ventas',
  'Gerencia',
] as const

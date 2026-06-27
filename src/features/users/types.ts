import type { getUsers } from '#/features/users/server.ts'

export type StaffUser = Awaited<ReturnType<typeof getUsers>>[number]

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'TRAINER'

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepcionista',
  TRAINER: 'Entrenador',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15',
  RECEPTIONIST: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/15',
  TRAINER: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15',
}

export interface RoleInfo {
  role: UserRole
  label: string
  description: string
  permissions: string[]
}

export const ROLES_INFO: RoleInfo[] = [
  {
    role: 'ADMIN',
    label: 'Administrador',
    description: 'Acceso total al sistema. Puede gestionar usuarios, configuraciones, finanzas y todos los módulos.',
    permissions: [
      'Gestión de Socios (CRUD)',
      'Gestión de Usuarios y Roles',
      'Paquetes y Planes',
      'Suscripciones y Renovaciones',
      'Punto de Venta (POS)',
      'Inventario y Compras',
      'Caja y Reportes',
      'Configuración General',
      'Auditoría y Backups',
    ],
  },
  {
    role: 'RECEPTIONIST',
    label: 'Recepcionista',
    description: 'Acceso a recepción, caja y atención al socio. No puede modificar configuraciones del sistema.',
    permissions: [
      'Gestión de Socios (CRUD)',
      'Suscripciones y Renovaciones',
      'Punto de Venta (POS)',
      'Caja Diaria',
      'Check-ins y Clases',
      'Reportes Básicos',
      'Ventas',
    ],
  },
  {
    role: 'TRAINER',
    label: 'Entrenador',
    description: 'Acceso limitado solo a check-ins, clases y visualización de información de socios.',
    permissions: [
      'Ver Socios',
      'Check-ins',
      'Clases',
      'Dashboard',
      'Notificaciones',
    ],
  },
]

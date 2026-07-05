import type { getUsers } from '#/features/users/server.ts'

export type StaffUser = Awaited<ReturnType<typeof getUsers>>[number]

// Roles are now fully dynamic from DB. UserRole is just a string.
export type UserRole = string
// Color mapping by role name — add new roles in DB and they'll work automatically.
export const ROLE_COLOR_MAP: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15',
  RECEPTIONIST: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/15',
  TRAINER: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15',
}

export function getRoleColor(roleName: string): string {
  return ROLE_COLOR_MAP[roleName] ?? 'bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/15'
}

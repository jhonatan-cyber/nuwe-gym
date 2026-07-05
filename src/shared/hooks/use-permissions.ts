import { useQuery } from '@tanstack/react-query'
import { getUserPermissions } from '#/shared/lib/server-utils.ts'
import type { Permission } from '#/shared/lib/permissions.ts'

export function usePermissions() {
  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: () => getUserPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some((p) => permissions.includes(p))
  }

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every((p) => permissions.includes(p))
  }

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}

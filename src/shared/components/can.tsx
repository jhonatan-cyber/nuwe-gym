import type { ReactNode } from 'react'
import { usePermissions } from '#/shared/hooks/use-permissions.ts'
import type { Permission } from '#/shared/lib/permissions.ts'

interface CanProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return null
  if (!hasPermission(permission)) return <>{fallback}</>

  return <>{children}</>
}

interface CanAnyProps {
  permissions: Permission[]
  children: ReactNode
  fallback?: ReactNode
}

export function CanAny({ permissions, children, fallback = null }: CanAnyProps) {
  const { hasAnyPermission, isLoading } = usePermissions()

  if (isLoading) return null
  if (!hasAnyPermission(permissions)) return <>{fallback}</>

  return <>{children}</>
}

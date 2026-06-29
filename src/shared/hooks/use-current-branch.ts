import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserBranches } from '#/features/branches/server.ts'

const BRANCH_STORAGE_KEY = 'currentBranchId'

export function useCurrentBranch() {
  const [mounted, setMounted] = useState(false)
  const [branchId, setBranchIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(BRANCH_STORAGE_KEY)
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: branches = [] } = useQuery({
    queryKey: ['user-branches'],
    queryFn: () => getUserBranches(),
    enabled: mounted,
  })

  // Si el branchId guardado no está en la lista, usar el default o el primero
  const currentBranch =
    branches.find((b) => b.id === branchId) ??
    branches.find((b) => b.isDefault) ??
    branches[0]

  const setBranchId = useCallback((id: string) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, id)
    setBranchIdState(id)
  }, [])

  return {
    branchId: currentBranch?.id ?? null,
    branchName: currentBranch?.name ?? null,
    branches,
    setBranchId,
    isLoading: !mounted,
  }
}

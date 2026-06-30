import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserBranches } from '#/features/branches/server.ts'

const BRANCH_STORAGE_KEY = 'currentBranchId'

export function useCurrentBranch() {
  const [mounted, setMounted] = useState(false)
  const [branchId, setBranchIdState] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY)
    if (stored && stored !== '__ALL__') {
      return stored
    }
    return undefined // '__ALL__' or null → undefined = "Todas"
  })

  useEffect(() => {
    setMounted(true)

    const handleBranchChange = () => {
      const stored = localStorage.getItem(BRANCH_STORAGE_KEY)
      setBranchIdState(stored && stored !== '__ALL__' ? stored : undefined)
    }

    window.addEventListener('branch-changed', handleBranchChange)
    return () => {
      window.removeEventListener('branch-changed', handleBranchChange)
    }
  }, [])

  const { data: branches = [] } = useQuery({
    queryKey: ['user-branches'],
    queryFn: () => getUserBranches(),
    enabled: mounted,
  })

  const currentBranch = branchId
    ? (branches.find((b) => b.id === branchId) ??
        branches.find((b) => b.isDefault) ??
        branches[0]) as (typeof branches)[number] | undefined
    : undefined

  const setBranchId = useCallback((id: string) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, id)
    setBranchIdState(id)
  }, [])

  return {
    branchId: currentBranch?.id,
    branchName: currentBranch?.name,
    branches,
    setBranchId,
    isLoading: !mounted,
  }
}

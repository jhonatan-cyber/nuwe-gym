import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronDown } from 'lucide-react'
import { getUserBranches } from './server.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/shared/components/ui/dropdown-menu'
import { Button } from '#/shared/components/ui/button'

const BRANCH_STORAGE_KEY = 'currentBranchId'

export function BranchSelector() {
  const [mounted, setMounted] = useState(false)
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY)
    if (stored && stored !== '__ALL__') {
      setCurrentBranchId(stored)
    } else {
      setCurrentBranchId(null) // '__ALL__' → null significa "Todas"
    }
  }, [])

  const { data: branches = [] } = useQuery({
    queryKey: ['user-branches'],
    queryFn: () => getUserBranches(),
  })

  const currentBranch =
    currentBranchId
      ? branches.find((b) => b.id === currentBranchId) ??
        branches.find((b) => b.isDefault) ??
        branches[0]
      : null

  const handleSwitch = (branchId: string | null) => {
    if (branchId) {
      localStorage.setItem(BRANCH_STORAGE_KEY, branchId)
    } else {
      localStorage.setItem(BRANCH_STORAGE_KEY, '__ALL__')
    }
    setCurrentBranchId(branchId)
    window.dispatchEvent(new Event('branch-changed'))
  }

  if (!mounted || branches.length <= 1) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1.5 px-2 text-sm h-9">
          <Building2 className="size-4" />
          <span className="max-w-[120px] truncate">
            {currentBranch?.name ?? 'Todas'}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => handleSwitch(null)}
          className="flex items-center justify-between"
        >
          <span>Todas las sucursales</span>
          {!currentBranchId && (
            <span className="text-primary font-bold ml-2">✔️</span>
          )}
        </DropdownMenuItem>
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleSwitch(branch.id)}
            className="flex items-center justify-between"
          >
            <span>{branch.name}</span>
            {branch.id === currentBranchId && (
              <span className="text-primary font-bold ml-2">✔️</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

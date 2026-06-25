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
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY)
    if (stored) {
      setCurrentBranchId(Number(stored))
    }
  }, [])

  const { data: branches = [] } = useQuery({
    queryKey: ['user-branches'],
    queryFn: () => getUserBranches(),
  })

  const currentBranch =
    branches.find((b) => b.id === currentBranchId) ??
    branches.find((b) => b.isDefault) ??
    branches[0]

  const handleSwitch = (branchId: number) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, String(branchId))
    setCurrentBranchId(branchId)
  }

  if (!mounted || branches.length <= 1) return null

  const displayName = currentBranch.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1.5 px-2 text-sm h-9">
          <Building2 className="size-4" />
          <span className="max-w-[120px] truncate">{displayName}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleSwitch(branch.id)}
            className="flex items-center justify-between"
          >
            <span>{branch.name}</span>
            {branch.id === currentBranch.id && (
              <span className="text-primary font-bold ml-2">✔️</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

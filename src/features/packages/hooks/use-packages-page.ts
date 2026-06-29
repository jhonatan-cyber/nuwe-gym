import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getPackages,
  deletePackage,
  updatePackage,
} from '#/features/packages/server.ts'
import type { Package } from '#/features/packages/types.ts'

export type ViewMode = 'list' | 'form'

export function usePackagesPage(userRole: string) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  const { data: packagesList = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Paquete eliminado')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al eliminar el paquete', {
        position: 'top-center',
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: updatePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  const filtered = packagesList.filter((p) => {
    if (filterType !== 'ALL' && p.type !== filterType) return false
    if (search) return p.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const totalPackages = packagesList.length
  const activePackages = packagesList.filter((p) => p.isActive).length

  function handleToggleActive(pkg: Package) {
    toggleMutation.mutate({
      data: {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description ?? '',
        imageBase64: pkg.imageBase64 ?? '',
        price: pkg.price,
        durationDays: pkg.durationDays,
        type: pkg.type,
        renewalType: pkg.renewalType ?? 'MANUAL',
        graceDays: pkg.graceDays ?? 0,
        maxFreezes: pkg.maxFreezes ?? 0,
        maxFreezeDays: pkg.maxFreezeDays ?? 0,
        allowedStartTime: pkg.allowedStartTime ?? '',
        allowedEndTime: pkg.allowedEndTime ?? '',
        dailyAccessLimit: pkg.dailyAccessLimit ?? undefined,
        color: pkg.color ?? '',
        isActive: !pkg.isActive,
        items: pkg.items.map((i: any) => ({
          description: i.description,
          sortOrder: i.sortOrder,
        })),
        allowedDays: (pkg.allowedDays ?? []).map((d: any) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime ?? undefined,
          endTime: d.endTime ?? undefined,
        })),
      },
    })
  }

  function handleOpenForm(pkgId?: string) {
    setEditingPackageId(pkgId ?? null)
    setActiveView('form')
  }

  function handleBackToList() {
    setEditingPackageId(null)
    setActiveView('list')
    queryClient.invalidateQueries({ queryKey: ['packages'] })
  }

  function handleSearchChange(val: string) {
    setSearch(val)
  }

  function handleFilterChange(val: string) {
    setFilterType(val)
  }

  return {
    activeView,
    setActiveView,
    editingPackageId,
    search,
    setSearch: handleSearchChange,
    filterType,
    setFilterType: handleFilterChange,
    packagesList,
    isLoading,
    filtered,
    totalPackages,
    activePackages,
    isReadOnly,
    deleteMutation,
    handleToggleActive,
    handleOpenForm,
    handleBackToList,
  }
}

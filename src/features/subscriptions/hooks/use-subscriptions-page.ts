import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getSubscriptionsWithBalance,
  cancelSubscription,
} from '#/features/subscriptions/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { usePersistedState } from '#/shared/hooks/use-persisted-state.ts'
import { getSubscriptionStatus } from '#/features/subscriptions/utils.ts'
import type { StatusFilter } from '#/features/subscriptions/types.ts'

export type ViewMode = 'list' | 'form'

export function useSubscriptionsPage(userRole: string) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'
  const { branchId } = useCurrentBranch()

  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedState<number>(
    'dataTablePageSize',
    10,
    (v) => ([5, 10, 20, 50].includes(v) ? v : 10),
  )

  const { data: subsList = [], isLoading } = useQuery({
    queryKey: ['subscriptions', branchId],
    queryFn: () => getSubscriptionsWithBalance({ data: { branchId: branchId ?? undefined } }),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Suscripción cancelada')
    },
    onError: () => toast.error('Error al cancelar'),
  })

  const filtered = subsList.filter((sub) => {
    const status = getSubscriptionStatus(sub)
    if (filterStatus !== 'ALL' && status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const memberName = sub.member.fullName.toLowerCase()
      const packageName = (
        sub.package?.name ||
        ''
      ).toLowerCase()
      return memberName.includes(q) || packageName.includes(q)
    }
    return true
  })

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus])

  const totalSubscriptions = subsList.length
  const activeSubscriptions = subsList.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date(),
  ).length
  const expiredSubscriptions = subsList.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) < new Date(),
  ).length

  const statusLabel =
    filterStatus === 'ALL'
      ? 'Todos los Estados'
      : filterStatus === 'ACTIVE'
        ? 'Activas'
        : filterStatus === 'EXPIRED'
          ? 'Vencidas'
          : 'Canceladas'

  function handleOpenForm() {
    setActiveView('form')
  }

  function handleBackToList() {
    setActiveView('list')
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  }

  function handleSearchChange(val: string) {
    setSearch(val)
  }

  function handleFilterChange(val: string) {
    setFilterStatus(val as StatusFilter)
  }

  function handleCancel(subId: string) {
    cancelMutation.mutate({ data: subId })
  }

  return {
    activeView,
    setActiveView,
    search,
    setSearch: handleSearchChange,
    filterStatus,
    setFilterStatus: handleFilterChange,
    filtered: paginated,
    allFiltered: filtered,
    totalFiltered,
    subsList,
    isLoading,
    cancelMutation,
    totalSubscriptions,
    activeSubscriptions,
    expiredSubscriptions,
    statusLabel,
    isReadOnly,
    currentPage: safePage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
    handleOpenForm,
    handleBackToList,
    handleCancel,
  }
}

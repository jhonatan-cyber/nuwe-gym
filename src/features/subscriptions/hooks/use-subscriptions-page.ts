import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getSubscriptions,
  cancelSubscription,
} from '#/features/subscriptions/server.ts'
import { getSubscriptionStatus } from '#/features/subscriptions/utils.ts'
import type { StatusFilter } from '#/features/subscriptions/types.ts'

export type ViewMode = 'list' | 'form'

export function useSubscriptionsPage(userRole: string) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')

  const { data: subsList = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions(),
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
        sub.plan?.name ||
        ''
      ).toLowerCase()
      return memberName.includes(q) || packageName.includes(q)
    }
    return true
  })

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
    filtered,
    subsList,
    isLoading,
    cancelMutation,
    totalSubscriptions,
    activeSubscriptions,
    expiredSubscriptions,
    statusLabel,
    isReadOnly,
    handleOpenForm,
    handleBackToList,
    handleCancel,
  }
}

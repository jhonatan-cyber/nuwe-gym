import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getFreezes,
  createFreeze,
  resumeSubscription,
  getFrozenSubscriptions,
} from '#/features/membership-freezes/server.ts'
import { getSubscriptions } from '#/features/subscriptions/server.ts'


export function useMembershipFreezesPage(userRole: string) {
  const queryClient = useQueryClient()
  const isAdmin = userRole === 'ADMIN'
  const canWrite = userRole === 'ADMIN' || userRole === 'RECEPTIONIST'

  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    subscriptionId: '',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const { data: freezes = [], isLoading } = useQuery({
    queryKey: ['membership-freezes'],
    queryFn: () => getFreezes(),
  })

  const { data: frozenSubs = [] } = useQuery({
    queryKey: ['frozen-subscriptions'],
    queryFn: () => getFrozenSubscriptions(),
  })

  const { data: allSubs = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions(),
  })

  const activeSubs = allSubs.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date(),
  )

  const createMutation = useMutation({
    mutationFn: createFreeze,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-freezes'] })
      queryClient.invalidateQueries({ queryKey: ['frozen-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      setIsFreezeModalOpen(false)
      toast.success('Membresía congelada exitosamente')
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Error al congelar'),
  })

  const resumeMutation = useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-freezes'] })
      queryClient.invalidateQueries({ queryKey: ['frozen-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Suscripción reanudada exitosamente')
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Error al reanudar'),
  })

  const handleOpenFreezeModal = () => {
    setFormData({ subscriptionId: '', startDate: '', endDate: '', reason: '' })
    setSearchTerm('')
    setIsFreezeModalOpen(true)
  }

  const handleCreateFreeze = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      data: {
        subscriptionId: formData.subscriptionId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined,
      },
    })
  }

  const selectedSub = activeSubs.find((s) => s.id === formData.subscriptionId)

  const calculatedEndDate =
    selectedSub && formData.startDate && formData.endDate
      ? (() => {
          const freezeDays = Math.ceil(
            (new Date(formData.endDate).getTime() -
              new Date(formData.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
          const end = new Date(selectedSub.endDate)
          end.setDate(end.getDate() + freezeDays)
          return end
        })()
      : null

  const daysRemaining = (freezeEnd: Date) => {
    const diff = new Date(freezeEnd).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleFormChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return {
    isFreezeModalOpen,
    setIsFreezeModalOpen,
    searchTerm,
    setSearchTerm,
    formData,
    freezes,
    frozenSubs,
    allSubs,
    activeSubs,
    isLoading,
    createMutation,
    resumeMutation,
    selectedSub,
    calculatedEndDate,
    daysRemaining,
    isAdmin,
    canWrite,
    handleOpenFreezeModal,
    handleCreateFreeze,
    handleFormChange,
  }
}

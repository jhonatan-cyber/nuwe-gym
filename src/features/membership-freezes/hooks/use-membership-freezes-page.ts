import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createFreeze,
  resumeSubscription,
  getFreezes,
  getFrozenSubscriptions,
} from '#/features/membership-freezes/server.ts'
import { getMembers, getMemberById } from '#/features/members/server.ts'
import { getCurrentCashSession } from '#/features/cash-register/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import { useSearch } from '@tanstack/react-router'
import type {
  Step,
  FreezeFormData,
  MemberWithSubscriptions,
} from '#/features/membership-freezes/types.ts'

export function useMembershipFreezesPage() {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()
  const { session } = authedRoute.useRouteContext()
  const userRole = session.user.role
  const isAdmin = userRole === 'ADMIN'
  const canWrite = userRole === 'ADMIN' || userRole === 'RECEPTIONIST'
  const search = useSearch({ strict: false })
  const preselectedMemberId = (search as any).memberId

  const [step, setStep] = useState<Step>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] =
    useState<MemberWithSubscriptions | null>(null)
  const [searchPage, setSearchPage] = useState(1)
  const searchPageSize = 5
  const preselectedDone = useRef(false)

  const [formData, setFormData] = useState<FreezeFormData>({
    subscriptionId: '',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const { data: preselectedMember } = useQuery({
    queryKey: ['member-by-id', preselectedMemberId],
    queryFn: () => getMemberById({ data: preselectedMemberId! }),
    enabled: !!preselectedMemberId && !preselectedDone.current,
  })

  useEffect(() => {
    if (preselectedMember && !preselectedDone.current) {
      preselectedDone.current = true
      handleSelectMember(preselectedMember as any)
    }
  }, [preselectedMember])

  const { data: cashSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session', branchId],
    queryFn: () =>
      getCurrentCashSession({ data: { branchId: branchId ?? undefined } }),
    enabled: !!branchId,
  })
  const isCashRegisterOpen = !!cashSession

  const { data: allSearchResults = [], isLoading: searchingMembers } = useQuery({
    queryKey: ['member-search', searchQuery],
    queryFn: () =>
      getMembers({
        data: { search: searchQuery, branchId: branchId ?? undefined },
      }),
  })

  const filteredSearchResults = allSearchResults.filter((m) =>
    (m.subscriptions || []).some(
      (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date(),
    ),
  )

  const searchTotal = filteredSearchResults.length
  const searchTotalPages = Math.max(1, Math.ceil(searchTotal / searchPageSize))
  const safeSearchPage = Math.min(searchPage, searchTotalPages)
  const memberSearchResults = filteredSearchResults.slice(
    (safeSearchPage - 1) * searchPageSize,
    safeSearchPage * searchPageSize,
  )

  const activeSubs = selectedMember
    ? (selectedMember.subscriptions || []).filter(
        (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date(),
      )
    : []

  const { data: freezes = [], isLoading } = useQuery({
    queryKey: ['membership-freezes', branchId],
    queryFn: () => getFreezes({ data: { branchId } }),
    enabled: !!branchId,
  })

  const { data: frozenSubs = [] } = useQuery({
    queryKey: ['frozen-subscriptions', branchId],
    queryFn: () => getFrozenSubscriptions({ data: { branchId } }),
    enabled: !!branchId,
  })

  const createMutation = useMutation({
    mutationFn: createFreeze,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-freezes'] })
      queryClient.invalidateQueries({ queryKey: ['frozen-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Membresía congelada exitosamente')
      handleReset()
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

  useEffect(() => {
    setSearchPage(1)
  }, [searchQuery])

  useEffect(() => {
    if (selectedMember && activeSubs.length === 1) {
      const singleSubId = String(activeSubs[0].id)
      if (formData.subscriptionId !== singleSubId) {
        setFormData((prev) => ({
          ...prev,
          subscriptionId: singleSubId,
        }))
      }
    }
  }, [selectedMember, activeSubs, formData.subscriptionId])

  function handleReset() {
    setStep(1)
    setSelectedMember(null)
    setSearchQuery('')
    setFormData({ subscriptionId: '', startDate: '', endDate: '', reason: '' })
  }

  function handleSelectMember(member: any) {
    setSelectedMember(member)
    setSearchQuery(member.fullName)
    setStep(2)
  }

  const selectedSub = activeSubs.find((s) => s.id === formData.subscriptionId)

  const freezeDays =
    formData.startDate && formData.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(formData.endDate).getTime() -
              new Date(formData.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0

  const calculatedEndDate =
    selectedSub && freezeDays > 0
      ? (() => {
          const end = new Date(selectedSub.endDate)
          end.setDate(end.getDate() + freezeDays)
          return end
        })()
      : null

  const daysRemaining = (freezeEnd: Date) => {
    const diff = new Date(freezeEnd).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !formData.subscriptionId ||
      !formData.startDate ||
      !formData.endDate ||
      !isCashRegisterOpen
    )
      return
    createMutation.mutate({
      data: {
        subscriptionId: formData.subscriptionId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined,
      },
    })
  }

  return {
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    selectedMember,
    formData,
    setFormData,
    freezes,
    frozenSubs,
    activeSubs,
    isLoading,
    createMutation,
    resumeMutation,
    selectedSub,
    calculatedEndDate,
    freezeDays,
    daysRemaining,
    isAdmin,
    canWrite,
    isLoadingSession,
    isCashRegisterOpen,
    memberSearchResults,
    allSearchResults: filteredSearchResults,
    searchingMembers,
    searchPage,
    setSearchPage,
    searchTotalPages,
    searchTotal,
    handleReset,
    handleSelectMember,
    handleSubmit,
  }
}

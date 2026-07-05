import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  renewSubscription,
  getMemberRenewalHistory,
} from '#/features/renewals/server.ts'
import { getActivePackages } from '#/features/packages/server.ts'
import { getMembers, getMemberById } from '#/features/members/server.ts'
import { getCurrentCashSession } from '#/features/cash-register/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { useSearch } from '@tanstack/react-router'
import type {
  Step,
  PaymentMethod,
  MemberWithSubscriptions,
} from '#/features/renewals/types.ts'

export function useRenewalsPage() {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()
  const search = useSearch({ strict: false })
  const preselectedMemberId = (search as any).memberId

  const [step, setStep] = useState<Step>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] =
    useState<MemberWithSubscriptions | null>(null)
  const [searchPage, setSearchPage] = useState(1)
  const searchPageSize = 5
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const preselectedDone = useRef(false)

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

  const [formData, setFormData] = useState({
    packageId: '',
    paymentMethod: 'CASH' as PaymentMethod,
    amount: '',
    notes: '',
  })

  const { data: cashSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session', branchId],
    queryFn: () => getCurrentCashSession({ data: { branchId: branchId ?? undefined } }),
    enabled: !!branchId,
  })
  const isCashRegisterOpen = !!cashSession

  const { data: packages = [] } = useQuery({
    queryKey: ['active-packages'],
    queryFn: () => getActivePackages(),
  })

  const { data: allSearchResults = [], isLoading: searchingMembers } =
    useQuery({
      queryKey: ['member-search', searchQuery],
      queryFn: () => getMembers({ data: { search: searchQuery, branchId: branchId ?? undefined } }),
    })

  const searchTotal = allSearchResults.length
  const searchTotalPages = Math.max(
    1,
    Math.ceil(searchTotal / searchPageSize),
  )
  const safeSearchPage = Math.min(searchPage, searchTotalPages)
  const memberSearchResults = allSearchResults.slice(
    (safeSearchPage - 1) * searchPageSize,
    safeSearchPage * searchPageSize,
  )

  const { data: renewalHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['member-renewal-history', selectedMember?.id],
    queryFn: () =>
      getMemberRenewalHistory({ data: { memberId: selectedMember!.id } }),
    enabled: !!selectedMember?.id,
  })

  const renewMutation = useMutation({
    mutationFn: renewSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['member-renewal-history'] })
      toast.success('Membresía renovada exitosamente')
      handleReset()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al renovar la membresía')
    },
  })

  useEffect(() => {
    setSearchPage(1)
  }, [searchQuery])

  function handleReset() {
    setStep(1)
    setSelectedMember(null)
    setSearchQuery('')
    setIsChangingPlan(false)
    setFormData({ packageId: '', paymentMethod: 'CASH', amount: '', notes: '' })
  }

  function handleSelectMember(member: any) {
    setSelectedMember(member)
    setSearchQuery(member.fullName)
    setStep(2)
  }

  useEffect(() => {
    if (!loadingHistory && selectedMember) {
      if (renewalHistory.length > 0) {
        const lastSub = renewalHistory[0]
        if (lastSub.packageId) {
          setFormData((prev) => ({
            ...prev,
            packageId: lastSub.packageId!,
            amount: lastSub.package?.price || '',
          }))
          setIsChangingPlan(false)
        } else {
          setIsChangingPlan(true)
        }
      } else {
        setIsChangingPlan(true)
      }
    }
  }, [renewalHistory, loadingHistory, selectedMember])

  const selectedPkg = packages.find((p) => p.id === formData.packageId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember || !formData.packageId || !isCashRegisterOpen) return
    renewMutation.mutate({
      data: {
        memberId: selectedMember.id,
        packageId: formData.packageId,
        paymentMethod: formData.paymentMethod,
        amount: formData.amount,
        branchId: branchId ?? undefined,
        notes: formData.notes || undefined,
      },
    })
  }

  return {
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    selectedMember,
    setSelectedMember,
    isChangingPlan,
    setIsChangingPlan,
    formData,
    setFormData,
    cashSession,
    isLoadingSession,
    isCashRegisterOpen,
    packages,
    memberSearchResults,
    allSearchResults,
    searchingMembers,
    renewalHistory,
    loadingHistory,
    renewMutation,
    selectedPkg,
    searchPage,
    setSearchPage,
    searchTotalPages,
    searchTotal,
    handleReset,
    handleSelectMember,
    handleSubmit,
  }
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createSubscription } from '#/features/subscriptions/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { getActivePackages } from '#/features/packages/server.ts'
import type { PaymentMethod } from '#/shared/lib/subscription-utils.ts'

interface UseSubscriptionFormProps {
  onBack: () => void
}

export function useSubscriptionForm({ onBack }: UseSubscriptionFormProps) {
  const queryClient = useQueryClient()

  const [memberSearch, setMemberSearch] = useState('')
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false)

  const [formData, setFormData] = useState({
    memberId: '',
    packageId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amountPaid: '',
    paymentMethod: 'CASH' as PaymentMethod,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members', ''],
    queryFn: () => getMembers({ data: { search: '' } }),
  })

  const { data: packages = [] } = useQuery({
    queryKey: ['active-packages'],
    queryFn: () => getActivePackages(),
  })

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Suscripción y pago registrados exitosamente')
      onBack()
    },
    onError: () => toast.error('Error al registrar la suscripción'),
  })

  function handlePackageSelect(packageId: string) {
    const pkg = packages.find((p) => p.id === packageId)
    if (!pkg) return
    const start = new Date(formData.startDate)
    start.setDate(start.getDate() + pkg.durationDays)
    setFormData({
      ...formData,
      packageId,
      amountPaid: pkg.price,
      endDate: start.toISOString().split('T')[0],
    })
  }

  function handleStartDateChange(date: string) {
    if (!formData.packageId) {
      setFormData({ ...formData, startDate: date })
      return
    }
    const pkg = packages.find((p) => p.id === formData.packageId)
    const start = new Date(date)
    start.setDate(start.getDate() + (pkg?.durationDays || 30))
    setFormData({
      ...formData,
      startDate: date,
      endDate: start.toISOString().split('T')[0],
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({ data: formData })
  }

  const filteredMembers = members
    .filter((m) => {
      const q = memberSearch.toLowerCase()
      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.documentNumber ?? '').toLowerCase().includes(q)
      )
    })
    .slice(0, 10)

  const selectedMember = members.find((m) => m.id === formData.memberId)

  return {
    memberSearch,
    setMemberSearch,
    isMemberDropdownOpen,
    setIsMemberDropdownOpen,
    formData,
    setFormData,
    members,
    packages,
    createMutation,
    filteredMembers,
    selectedMember,
    handlePackageSelect,
    handleStartDateChange,
    handleSubmit,
  }
}

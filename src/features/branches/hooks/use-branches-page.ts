import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBranches,
  createBranch,
  updateBranch,
} from '#/features/branches/server.ts'
import type { Branch, BranchForm, StatusFilter } from '#/features/branches/types.ts'
import { EMPTY_BRANCH_FORM } from '#/features/branches/types.ts'
import { capitalizeWords } from '#/shared/lib/formatters.ts'

export function useBranchesPage() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BranchForm>(EMPTY_BRANCH_FORM)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const { data: branchesList = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches(),
  })

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Sucursal creada con éxito')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Sucursal actualizada con éxito')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_BRANCH_FORM)
    setIsOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditingId(branch.id)
    setForm({
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      openingTime: branch.openingTime ?? '08:00',
      closingTime: branch.closingTime ?? '22:00',
    })
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return

    const formattedForm = {
      ...form,
      name: capitalizeWords(form.name.trim()),
      address: capitalizeWords(form.address?.trim() || ''),
    }

    if (editingId !== null) {
      updateMutation.mutate({ data: { id: editingId, ...formattedForm } })
    } else {
      createMutation.mutate({ data: formattedForm })
    }
  }

  const handleToggleActive = (branch: Branch) => {
    updateMutation.mutate({
      data: {
        id: branch.id,
        name: branch.name,
        address: branch.address ?? '',
        phone: branch.phone ?? '',
        email: branch.email ?? '',
        openingTime: branch.openingTime ?? '08:00',
        closingTime: branch.closingTime ?? '22:00',
        isActive: !branch.isActive,
      },
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const totalBranches = branchesList.length
  const activeCount = branchesList.filter((b) => b.isActive).length
  const inactiveCount = branchesList.filter((b) => !b.isActive).length

  const filteredBranches = branchesList.filter((b) => {
    const searchMatch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(search.toLowerCase()))

    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && b.isActive) ||
      (statusFilter === 'INACTIVE' && !b.isActive)

    return searchMatch && statusMatch
  })

  return {
    // State
    isOpen,
    editingId,
    form,
    search,
    statusFilter,
    setForm,
    setSearch,
    setStatusFilter,
    // Data
    branchesList,
    isLoading,
    filteredBranches,
    // Metrics
    totalBranches,
    activeCount,
    inactiveCount,
    // Handlers
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleToggleActive,
    isPending,
  }
}

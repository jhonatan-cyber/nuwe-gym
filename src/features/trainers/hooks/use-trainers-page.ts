import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getTrainers,
  getMyMembers,
  createTrainer,
  updateTrainer,
  getTrainerUsers,
} from '#/features/trainers/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import type { TrainerWithDetails, ViewMode } from '#/features/trainers/types.ts'

interface UseTrainersPageProps {
  userRole: string
}

export function useTrainersPage({ userRole }: UseTrainersPageProps) {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()
  const isAdmin = userRole === 'ADMIN'
  const isTrainer = userRole === 'TRAINER'
  const canWrite = isAdmin

  const [activeView, setActiveView] = useState<ViewMode>('trainers')
  const [search, setSearch] = useState('')

  const [editingTrainer, setEditingTrainer] = useState<TrainerWithDetails | null>(null)
  const [userId, setUserId] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [commissionRate, setCommissionRate] = useState('')

  useEffect(() => {
    if (activeView === 'create' || activeView === 'edit') {
      setUserId(editingTrainer?.userId || '')
      setSpecialty(editingTrainer?.specialty || '')
      setBio(editingTrainer?.bio || '')
      setCommissionRate(editingTrainer?.commissionRate || '0')
    }
  }, [activeView, editingTrainer])

  const { data: trainers = [], isLoading } = useQuery({
    queryKey: ['trainers', branchId, search],
    queryFn: () => getTrainers({ data: { branchId } }),
    enabled: !!branchId,
  })

  const { data: myMembers = [] } = useQuery({
    queryKey: ['my-members'],
    queryFn: () => getMyMembers(),
    enabled: isTrainer,
  })

  const { data: trainerUsers = [] } = useQuery({
    queryKey: ['trainer-users'],
    queryFn: () => getTrainerUsers(),
    enabled: activeView === 'create' && canWrite,
  })

  const selectedUser = trainerUsers.find((u) => u.id === userId)

  const totalTrainers = trainers.length
  const activeTrainers = trainers.filter((t) => t.isActive).length
  const inactiveTrainers = totalTrainers - activeTrainers

  const filteredTrainers = trainers.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.user.name.toLowerCase().includes(q) ||
      (t.specialty || '').toLowerCase().includes(q)
    )
  })

  const createMutation = useMutation({
    mutationFn: createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setEditingTrainer(null)
      setActiveView('trainers')
      toast.success('Entrenador creado exitosamente')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al crear entrenador'),
  })

  const updateMutation = useMutation({
    mutationFn: updateTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setEditingTrainer(null)
      setActiveView('trainers')
      toast.success('Entrenador actualizado')
    },
    onError: () => toast.error('Error al actualizar entrenador'),
  })

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()

    const capitalizedSpecialty = specialty.trim()
      ? specialty.trim().charAt(0).toUpperCase() + specialty.trim().slice(1)
      : ''
    const capitalizedBio = bio.trim()
      ? bio.trim().charAt(0).toUpperCase() + bio.trim().slice(1)
      : ''

    if (editingTrainer) {
      updateMutation.mutate({
        data: {
          id: editingTrainer.id,
          specialty: capitalizedSpecialty,
          bio: capitalizedBio,
          commissionRate,
        },
      })
    } else {
      if (!userId) return
      createMutation.mutate({
        data: {
          userId,
          branchId,
          specialty: capitalizedSpecialty,
          bio: capitalizedBio,
          commissionRate,
        },
      })
    }
  }

  function handleEdit(trainer: TrainerWithDetails) {
    setEditingTrainer(trainer)
    setActiveView('edit')
  }

  function handleBackToList() {
    setEditingTrainer(null)
    setActiveView('trainers')
  }

  return {
    activeView,
    setActiveView,
    search,
    setSearch,
    editingTrainer,
    userId,
    setUserId,
    specialty,
    setSpecialty,
    bio,
    setBio,
    commissionRate,
    setCommissionRate,
    selectedUser,
    isAdmin,
    isTrainer,
    canWrite,
    trainers,
    isLoading,
    filteredTrainers,
    myMembers,
    trainerUsers,
    totalTrainers,
    activeTrainers,
    inactiveTrainers,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    handleFormSubmit,
    handleEdit,
    handleBackToList,
  }
}

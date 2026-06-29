import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getUsers,
  deleteUser,
} from '#/features/users/server.ts'
import type { StaffUser } from '#/features/users/types.ts'

export type ViewMode = 'list' | 'roles' | 'create'

export function useUsersPage(currentUserId: string) {
  const queryClient = useQueryClient()

  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: usersList = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsers(),
  })
  const totalUsers = usersList.length
  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length
  const receptionistCount = usersList.filter(
    (u) => u.role === 'RECEPTIONIST',
  ).length
  const trainerCount = usersList.filter((u) => u.role === 'TRAINER').length

  const filteredUsers = usersList.filter((u) => {
    const searchMatch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.documentNumber &&
        u.documentNumber.toLowerCase().includes(search.toLowerCase()))
    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter
    return searchMatch && roleMatch
  })

  const totalFiltered = filteredUsers.length
  const totalPages = Math.ceil(totalFiltered / pageSize)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario eliminado')
    },
    onError: () => toast.error('Error al eliminar usuario'),
  })

  const handleOpenCreate = () => {
    setActiveView('create')
  }

  const handleCloseCreate = () => {
    setActiveView('list')
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUserId) {
      toast.error('No podés eliminar tu propia cuenta.')
      return
    }
    setDeletingUserId(userId)
  }

  const handleConfirmDeleteUser = () => {
    if (deletingUserId !== null) {
      deleteMutation.mutate({ data: deletingUserId })
      setDeletingUserId(null)
    }
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val)
    setCurrentPage(1)
  }

  return {
    activeView,
    setActiveView,
    search,
    setSearch: handleSearchChange,
    roleFilter,
    setRoleFilter: handleRoleFilterChange,
    editingUser,
    setEditingUser,
    viewUserId,
    setViewUserId,
    deletingUserId,
    setDeletingUserId,
    usersList,
    isLoading,
    paginatedUsers,
    totalFiltered,
    totalUsers,
    adminCount,
    receptionistCount,
    trainerCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    handleOpenCreate,
    handleCloseCreate,
    handleDeleteUser,
    handleConfirmDeleteUser,
  }
}

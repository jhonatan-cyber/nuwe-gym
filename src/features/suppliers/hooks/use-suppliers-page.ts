import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '#/features/suppliers/server.ts'
import type { Supplier } from '#/features/suppliers/types.ts'

export type ViewMode = 'list' | 'create'

export function useSuppliersPage() {
  const queryClient = useQueryClient()

  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [viewSupplierId, setViewSupplierId] = useState<string | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: suppliersList = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
  })

  const totalSuppliers = suppliersList.length
  const activeCount = suppliersList.filter((s) => s.isActive).length
  const inactiveCount = suppliersList.filter((s) => !s.isActive).length

  const filteredSuppliers = suppliersList.filter((s) => {
    const searchMatch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.toLowerCase().includes(search.toLowerCase()))
    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.isActive) ||
      (statusFilter === 'INACTIVE' && !s.isActive)
    return searchMatch && statusMatch
  })

  const totalFiltered = filteredSuppliers.length
  const totalPages = Math.ceil(totalFiltered / pageSize)
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const handleOpenCreate = () => {
    setActiveView('create')
  }

  const handleCloseCreate = () => {
    setActiveView('list')
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  }

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      toast.success('Proveedor registrado con éxito')
      handleCloseCreate()
    },
    onError: () => toast.error('Error al registrar proveedor'),
  })

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Proveedor actualizado con éxito')
      setEditingSupplier(null)
    },
    onError: () => toast.error('Error al actualizar proveedor'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Proveedor eliminado')
      setDeletingSupplier(null)
    },
    onError: () => toast.error('Error al eliminar proveedor'),
  })

  const handleDeleteSupplier = (supplier: Supplier) => {
    setDeletingSupplier(supplier)
  }

  const handleConfirmDeleteSupplier = () => {
    if (deletingSupplier) {
      deleteMutation.mutate({ data: { id: deletingSupplier.id, name: deletingSupplier.name } })
    }
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val)
    setCurrentPage(1)
  }

  return {
    activeView,
    setActiveView,
    search,
    setSearch: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    editingSupplier,
    setEditingSupplier,
    viewSupplierId,
    setViewSupplierId,
    deletingSupplier,
    setDeletingSupplier,
    suppliersList,
    isLoading,
    paginatedSuppliers,
    totalFiltered,
    totalSuppliers,
    activeCount,
    inactiveCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    handleOpenCreate,
    handleCloseCreate,
    handleDeleteSupplier,
    handleConfirmDeleteSupplier,
    createMutation,
    updateMutation,
  }
}

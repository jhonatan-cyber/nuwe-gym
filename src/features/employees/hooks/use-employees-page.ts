import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getEmployees,
  deleteEmployee,
  getEmployeeStats,
} from '../server.ts'

export type EmployeeTab = 'employees' | 'users' | 'roles'
export type EmployeeSubView = 'list' | 'create' | 'edit'

export function useEmployeesPage() {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<EmployeeTab>('employees')
  const [activeSubView, setActiveSubView] = useState<EmployeeSubView>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ── Queries ──

  const { data: stats } = useQuery({
    queryKey: ['employeeStats'],
    queryFn: getEmployeeStats,
  })

  const {
    data: employeesList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  // ── Mutations ──

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Empleado eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Derived ──

  const filtered = employeesList?.filter(
    (e) =>
      // Only employees without system access
      !e.userId &&
      (!search ||
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase())),
  )

  const totalFiltered = filtered?.length ?? 0
  const totalPages = Math.ceil(totalFiltered / pageSize)

  const paginatedEmployees =
    filtered?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? []

  // ── Effects ──

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // ── Handlers ──

  function handleAdd() {
    setEditingId(null)
    setActiveSubView('create')
  }

  function handleEdit(id: string) {
    setEditingId(id)
    setActiveSubView('edit')
  }

  function handleDelete(id: string, name: string) {
    if (
      window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)
    ) {
      deleteMutation.mutate({ data: { id } })
    }
  }

  return {
    activeTab,
    setActiveTab,
    activeSubView,
    setActiveSubView,
    editingId,
    setEditingId,
    detailId,
    setDetailId,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    stats,
    employeesList,
    isLoading,
    error,
    totalFiltered,
    totalPages,
    paginatedEmployees,
    handleAdd,
    handleEdit,
    handleDelete,
  }
}

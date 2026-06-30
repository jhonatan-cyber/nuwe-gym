import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCurrentCashSession,
  getAllOpenCashSessions,
  openCashSession,
  closeCashSession,
  createManualMovement,
  getCashSessionDetails,
  getCashSessionsList,
  deleteCashSession,
} from '#/features/cash-register/server.ts'

export function useCashRegister(branchId: string | undefined, isAdmin: boolean) {
  const queryClient = useQueryClient()

  // Modal state
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string | null>(null)
  const [selectedSessionToClose, setSelectedSessionToClose] = useState<any>(null)
  const [sessionToDelete, setSessionToDelete] = useState<any>(null)
  const [selectedAllBranchSession, setSelectedAllBranchSession] = useState<any>(null)

  // Form state
  const [openingAmount, setOpeningAmount] = useState('10000.00')
  const [openingNotes, setOpeningNotes] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementType, setMovementType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [movementDescription, setMovementDescription] = useState('')

  // Queries
  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session', branchId],
    queryFn: () => getCurrentCashSession({ data: { branchId } }),
    enabled: !!branchId,
  })

  const { data: allOpenSessions = [], isLoading: isLoadingAllOpen } = useQuery({
    queryKey: ['all-open-cash-sessions'],
    queryFn: () => getAllOpenCashSessions(),
    enabled: !branchId,
  })

  const { data: sessionDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['cash-session-details', branchId, currentSession?.id],
    queryFn: () => getCashSessionDetails({ data: { sessionId: currentSession!.id } }),
    enabled: !!currentSession?.id,
  })

  const { data: historySessions = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['cash-sessions-list', branchId],
    queryFn: () => getCashSessionsList({ data: { branchId } }),
    enabled: !!branchId && isAdmin,
  })

  const { data: selectedHistoryDetails } = useQuery({
    queryKey: ['cash-session-details', branchId, selectedHistorySessionId],
    queryFn: () => getCashSessionDetails({ data: { sessionId: selectedHistorySessionId! } }),
    enabled: !!selectedHistorySessionId,
  })

  const { data: selectedAllBranchDetails, isLoading: isLoadingAllBranchDetails } = useQuery({
    queryKey: ['cash-session-details', 'all-branch', selectedAllBranchSession?.id],
    queryFn: () => getCashSessionDetails({ data: { sessionId: selectedAllBranchSession!.id } }),
    enabled: !!selectedAllBranchSession?.id,
  })

  // Mutations
  const openMutation = useMutation({
    mutationFn: openCashSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] })
      queryClient.invalidateQueries({ queryKey: ['all-open-cash-sessions'] })
      toast.success('Caja abierta correctamente')
      setIsOpenModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message || 'Error al abrir caja'),
  })

  const closeMutation = useMutation({
    mutationFn: closeCashSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] })
      queryClient.invalidateQueries({ queryKey: ['all-open-cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cash-sessions-list'] })
      toast.success('Caja cerrada con éxito')
      setIsCloseModalOpen(false)
      setSelectedSessionToClose(null)
      setClosingAmount('')
      setClosingNotes('')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al cerrar caja'),
  })

  const movementMutation = useMutation({
    mutationFn: createManualMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cash-session-details', currentSession?.id],
      })
      toast.success('Movimiento registrado con éxito')
      setIsMovementModalOpen(false)
      setMovementAmount('')
      setMovementDescription('')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al registrar movimiento'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCashSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] })
      queryClient.invalidateQueries({ queryKey: ['all-open-cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cash-sessions-list'] })
      toast.success('Sesión de caja eliminada')
      setSessionToDelete(null)
    },
    onError: (err: Error) => toast.error(err.message || 'Error al eliminar sesión'),
  })

  // Derived
  const calculateExpectedCash = () => {
    if (!currentSession || !sessionDetails) return '0.00'
    let balance = Number(currentSession.openingAmount)
    sessionDetails.movements.forEach((m) => {
      if (m.paymentMethod === 'CASH') {
        balance += m.movementType === 'INCOME' ? Number(m.amount) : -Number(m.amount)
      }
    })
    return balance.toFixed(2)
  }

  const totalIncome = sessionDetails?.movements
    .filter((m) => m.movementType === 'INCOME')
    .reduce((sum, m) => sum + Number(m.amount), 0) ?? 0

  const totalExpenses = sessionDetails?.movements
    .filter((m) => m.movementType === 'EXPENSE')
    .reduce((sum, m) => sum + Number(m.amount), 0) ?? 0

  const movementsCount = sessionDetails?.movements.length ?? 0

  return {
    // Modal state
    isOpenModalOpen, setIsOpenModalOpen,
    isCloseModalOpen, setIsCloseModalOpen,
    isMovementModalOpen, setIsMovementModalOpen,
    selectedHistorySessionId, setSelectedHistorySessionId,
    selectedSessionToClose, setSelectedSessionToClose,
    sessionToDelete, setSessionToDelete,
    selectedAllBranchSession, setSelectedAllBranchSession,

    // Form state
    openingAmount, setOpeningAmount,
    openingNotes, setOpeningNotes,
    closingAmount, setClosingAmount,
    closingNotes, setClosingNotes,
    movementAmount, setMovementAmount,
    movementType, setMovementType,
    movementDescription, setMovementDescription,

    // Query results
    currentSession,
    allOpenSessions,
    sessionDetails,
    historySessions,
    selectedHistoryDetails,
    selectedAllBranchDetails,
    isLoadingSession,
    isLoadingAllOpen,
    isLoadingDetails,
    isLoadingHistory,
    isLoadingAllBranchDetails,

    // Mutations
    openMutation,
    closeMutation,
    movementMutation,
    deleteMutation,

    // Derived
    calculateExpectedCash,
    totalIncome,
    totalExpenses,
    movementsCount,
  }
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getUserById,
  revokeSession,
  resetUserPassword,
} from '#/features/users/server.ts'

interface UseUserDetailDialogProps {
  userId: string | null
  onOpenChange: (open: boolean) => void
}

export function useUserDetailDialog({ userId }: UseUserDetailDialogProps) {
  const queryClient = useQueryClient()

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  )
  const [revokingUserName, setRevokingUserName] = useState<string>('')
  const [isResetPwOpen, setIsResetPwOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUserById({ data: userId! }),
    enabled: !!userId,
    refetchOnMount: true,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] })
      setRevokingSessionId(null)
      toast.success('Sesión cerrada correctamente')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al cerrar la sesión'),
  })

  function handleRevokeSession(sessionId: string, userName: string) {
    setRevokingSessionId(sessionId)
    setRevokingUserName(userName)
  }

  const resetPwMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      setIsResetPwOpen(false)
      setNewPassword('')
      toast.success('Contraseña reseteada correctamente')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al resetear la contraseña'),
  })

  function handleConfirmRevoke() {
    if (revokingSessionId) {
      revokeMutation.mutate({
        data: {
          sessionId: revokingSessionId,
          userName: revokingUserName,
        },
      })
    }
  }

  function handleOpenResetPw() {
    setNewPassword('')
    setIsResetPwOpen(true)
  }

  const user = data?.user
  const userSessions = data?.sessions ?? []
  const auditLogs = data?.auditLogs ?? []

  const activeSessions = userSessions.filter(
    (s) => new Date(s.expiresAt) > new Date(),
  )

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newPassword.trim()) return
    resetPwMutation.mutate({
      data: { userId: user.id, newPassword: newPassword.trim() },
    })
  }

  return {
    user,
    userSessions,
    activeSessions,
    auditLogs,
    isLoading,
    revokingSessionId,
    setRevokingSessionId,
    isResetPwOpen,
    setIsResetPwOpen,
    newPassword,
    setNewPassword,
    handleRevokeSession,
    handleConfirmRevoke,
    handleOpenResetPw,
    handleResetPassword,
    isRevoking: revokeMutation.isPending,
    isResettingPw: resetPwMutation.isPending,
  }
}

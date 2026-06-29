import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getProfileFullData,
  updateProfileInfo,
  changePassword,
  revokeMySession,
} from '#/features/profile/server.ts'

export function useProfilePage(
  userName: string,
  userPhone: string | null | undefined,
  userAddress: string | null | undefined,
  options?: { onSuccess?: () => void }
) {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'sessions' | 'activity'>('info')

  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState(userPhone ?? '')
  const [address, setAddress] = useState(userAddress ?? '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfileFullData(),
  })

  const user = data?.user
  const userSessions = data?.sessions ?? []
  const auditLogs = data?.auditLogs ?? []
  const activeSessions = userSessions.filter(
    (s) => new Date(s.expiresAt) > new Date(),
  )

  const profileMutation = useMutation({
    mutationFn: updateProfileInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Perfil actualizado')
      options?.onSuccess?.()
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al actualizar el perfil'),
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Contraseña cambiada exitosamente')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al cambiar la contraseña'),
  })

  const revokeMutation = useMutation({
    mutationFn: revokeMySession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setRevokingSessionId(null)
      toast.success('Sesión cerrada correctamente')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al cerrar la sesión'),
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    profileMutation.mutate({
      data: {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      },
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) return toast.error('Ingresá tu contraseña actual')
    if (newPassword.length < 6)
      return toast.error('La nueva contraseña debe tener al menos 6 caracteres')
    if (newPassword !== confirmPassword)
      return toast.error('Las contraseñas nuevas no coinciden')
    passwordMutation.mutate({ data: { currentPassword, newPassword } })
  }

  const handleRevokeSession = (sessionId: string) => {
    setRevokingSessionId(sessionId)
  }

  const handleConfirmRevoke = () => {
    if (revokingSessionId) {
      revokeMutation.mutate({ data: { sessionId: revokingSessionId } })
    }
  }

  return {
    activeTab,
    setActiveTab,
    user,
    userSessions,
    activeSessions,
    auditLogs,
    isLoading,
    isError,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    revokingSessionId,
    setRevokingSessionId,
    isPending: profileMutation.isPending,
    isPasswordPending: passwordMutation.isPending,
    isRevoking: revokeMutation.isPending,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleRevokeSession,
    handleConfirmRevoke,
  }
}

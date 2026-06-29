import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateUser } from '#/features/users/server.ts'
import type { StaffUser, UserRole } from '#/features/users/types.ts'

export interface StaffEditFormState {
  name: string
  email: string
  role: UserRole
  documentNumber: string
  phone: string
  address: string
}

interface UseUserEditDialogProps {
  user: StaffUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function useUserEditDialog({
  user,
  open,
  onOpenChange,
}: UseUserEditDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<StaffEditFormState>({
    name: '',
    email: '',
    role: 'TRAINER',
    documentNumber: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    if (user && open) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        documentNumber: user.documentNumber || '',
        phone: user.phone || '',
        address: user.address || '',
      })
    }
  }, [user, open])

  const updateField = <TKey extends keyof StaffEditFormState>(
    field: TKey,
    value: StaffEditFormState[TKey],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario actualizado con éxito')
      onOpenChange(false)
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al actualizar usuario'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.name || !form.email) return
    updateUserMutation.mutate({
      data: {
        userId: user.id,
        name: form.name,
        email: form.email,
        role: form.role,
        documentNumber: form.documentNumber || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      },
    })
  }

  return {
    form,
    updateField,
    handleSubmit,
    isPending: updateUserMutation.isPending,
  }
}

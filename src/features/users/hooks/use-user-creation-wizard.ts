import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { capitalizeWords } from '#/shared/lib/formatters.ts'
import { createStaffUser } from '#/features/users/server.ts'
import type { UserRole } from '#/features/users/types.ts'

export interface StaffFormState {
  firstName: string
  lastName: string
  documentNumber: string
  phone: string
  countryCode: string
  address: string
  email: string
  role: UserRole
}

export const defaultFormState: StaffFormState = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  phone: '',
  countryCode: '+591',
  address: '',
  email: '',
  role: 'TRAINER',
}

interface UseUserCreationWizardProps {
  onClose: () => void
}

export function useUserCreationWizard({ onClose }: UseUserCreationWizardProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<StaffFormState>(defaultFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<{
    name: string
    email: string
    ci: string
    role: string
  } | null>(null)

  const createMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      const data = variables?.data
      if (!data) return
      const roleLabel =
        data.role === 'ADMIN'
          ? 'Administrador'
          : data.role === 'RECEPTIONIST'
            ? 'Recepcionista'
            : 'Entrenador'
      setCreated({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        ci: data.documentNumber,
        role: roleLabel,
      })
      toast.success('Usuario del staff creado con éxito')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al crear usuario'),
  })

  const updateField = <TKey extends keyof StaffFormState>(
    key: TKey,
    value: StaffFormState[TKey],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio'
    if (!form.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio'
    if (!form.documentNumber.trim()) {
      newErrors.documentNumber = 'El CI es obligatorio'
    } else if (!/^\d+$/.test(form.documentNumber.trim())) {
      newErrors.documentNumber = 'El CI debe contener solo números'
    }
    if (form.phone.trim() && !/^\+?[\d\s-]+$/.test(form.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido'
    }
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createMutation.mutate({
      data: {
        firstName: capitalizeWords(form.firstName),
        lastName: capitalizeWords(form.lastName),
        documentNumber: form.documentNumber.trim(),
        phone: form.phone.trim() ? `${form.countryCode} ${form.phone.trim()}` : undefined,
        address: form.address.trim() ? capitalizeWords(form.address) : undefined,
        email: form.email.trim(),
        role: form.role,
      },
    })
  }

  const resetAndClose = () => {
    setForm(defaultFormState)
    setErrors({})
    setCreated(null)
    onClose()
  }

  return {
    form,
    errors,
    created,
    isPending: createMutation.isPending,
    updateField,
    handleSubmit,
    resetAndClose,
  }
}

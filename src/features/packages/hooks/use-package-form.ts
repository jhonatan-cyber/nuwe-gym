import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createPackage, updatePackage } from '#/features/packages/server.ts'
import { capitalizeWords } from '#/shared/lib/formatters.ts'
import { EMPTY_FORM } from '#/features/packages/types.ts'
import type { PackageFormData, Package } from '#/features/packages/types.ts'

interface UsePackageFormProps {
  editingPackageId: string | null
  onBack: () => void
}

export function usePackageForm({ editingPackageId, onBack }: UsePackageFormProps) {
  const queryClient = useQueryClient()
  const isEditing = editingPackageId !== null

  const [formData, setFormData] = useState<PackageFormData>(() => {
    if (editingPackageId) {
      const packages = queryClient.getQueryData<Package[]>(['packages'])
      const pkg = packages?.find((p) => p.id === editingPackageId)
      if (pkg) {
        return {
          name: pkg.name,
          description: pkg.description ?? '',
          imageBase64: pkg.imageBase64 ?? '',
          price: pkg.price,
          durationDays: pkg.durationDays,
          type: pkg.type,
          isActive: pkg.isActive,
          items: pkg.items.map((i) => ({
            description: i.description,
            sortOrder: i.sortOrder,
          })),
        }
      }
    }
    return EMPTY_FORM
  })

  const [isDragging, setIsDragging] = useState(false)

  const createMutation = useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Paquete creado exitosamente')
      onBack()
    },
    onError: () => toast.error('Error al crear el paquete'),
  })

  const updateMutation = useMutation({
    mutationFn: updatePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Paquete actualizado')
      onBack()
    },
    onError: () => toast.error('Error al actualizar el paquete'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingPackageId) {
      updateMutation.mutate({ data: { ...formData, id: editingPackageId } })
    } else {
      const { isActive: _, ...createData } = formData
      createMutation.mutate({ data: createData })
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData({ ...formData, imageBase64: event.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0] as File | undefined
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Por favor, arrastrá solo archivos de imagen.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData({ ...formData, imageBase64: event.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  function addItem() {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: '', sortOrder: formData.items.length },
      ],
    })
  }

  function removeItem(idx: number) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    })
  }

  function updateItem(idx: number, description: string) {
    const items = [...formData.items]
    items[idx] = { ...items[idx], description: capitalizeWords(description) }
    setFormData({ ...formData, items })
  }

  return {
    formData,
    setFormData,
    isDragging,
    isEditing,
    createMutation,
    updateMutation,
    handleSubmit,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addItem,
    removeItem,
    updateItem,
  }
}

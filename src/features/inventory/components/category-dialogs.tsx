import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'

interface CategoryFormData {
  name: string
  description: string
}

interface CategoryDialogsProps {
  isModalOpen: boolean
  editingCategory: {
    id: number
    name: string
    description?: string | null
  } | null
  isPendingCreate: boolean
  isPendingUpdate: boolean
  categoryToDelete: { id: number; name: string } | null
  isPendingDelete: boolean
  onSubmit: (data: CategoryFormData, editingId?: number) => void
  onConfirmDelete: (category: { id: number; name: string }) => void
  onClose: () => void
  onCloseDelete: () => void
}

export function CategoryDialogs({
  isModalOpen,
  editingCategory,
  isPendingCreate,
  isPendingUpdate,
  categoryToDelete,
  isPendingDelete,
  onSubmit,
  onConfirmDelete,
  onClose,
  onCloseDelete,
}: CategoryDialogsProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')

  useEffect(() => {
    if (isModalOpen) {
      setCategoryName(editingCategory?.name || '')
      setCategoryDescription(editingCategory?.description || '')
    }
  }, [isModalOpen, editingCategory])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryName) return
    onSubmit(
      { name: categoryName, description: categoryDescription },
      editingCategory?.id,
    )
    setCategoryName('')
    setCategoryDescription('')
  }

  return (
    <>
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold">
                Nombre de la Categoría *
              </label>
              <Input
                placeholder="Ej. Suplementos, Accesorios..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Descripción</label>
              <Textarea
                placeholder="Breve descripción de la categoría..."
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isPendingCreate || isPendingUpdate}
                className="rounded-xl font-bold"
              >
                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) onCloseDelete()
        }}
        title="Eliminar Categoría"
        description={
          <>
            ¿Estás seguro de eliminar{' '}
            <strong className="text-foreground">
              {categoryToDelete?.name}
            </strong>
            ? Los productos asociados no se eliminarán, solo la categoría
            quedará oculta.
          </>
        }
        onConfirm={() => {
          if (categoryToDelete) onConfirmDelete(categoryToDelete)
          onCloseDelete()
        }}
        isLoading={isPendingDelete}
      />
    </>
  )
}

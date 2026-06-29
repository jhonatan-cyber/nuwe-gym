import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { generateCategoryDescription } from '../server.ts'

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
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerateDescription() {
    if (!categoryName.trim()) {
      toast.error('Por favor, ingresá un nombre de categoría primero')
      return
    }

    setIsGenerating(true)
    try {
      const description = await generateCategoryDescription({
        data: { name: categoryName.trim() },
      })
      setCategoryDescription(description)
      toast.success('Descripción generada con éxito')
    } catch (err: any) {
      console.error(err)
      toast.error('Error al generar la descripción con IA')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      setCategoryName(editingCategory?.name || '')
      setCategoryDescription(editingCategory?.description || '')
    }
  }, [isModalOpen, editingCategory])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryName) return

    const capitalize = (str: string) => {
      if (!str) return str
      return str.trim().charAt(0).toUpperCase() + str.trim().slice(1)
    }

    onSubmit(
      {
        name: capitalize(categoryName),
        description: capitalize(categoryDescription),
      },
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
            <DialogDescription className="sr-only">
              Formulario para {editingCategory ? 'editar la' : 'crear una nueva'} categoría de productos de inventario.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold">
                Nombre *
              </label>
              <Input
                placeholder="Ej. Suplementos, Accesorios..."
                value={categoryName}
                onChange={(e) => {
                  const val = e.target.value
                  setCategoryName(val ? val.charAt(0).toUpperCase() + val.slice(1) : '')
                }}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">Descripción</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !categoryName.trim()}
                  className="h-7 gap-1 rounded-full text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 cursor-pointer"
                >
                  <Sparkles className={`size-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? 'Generando...' : 'Generar con IA'}
                </Button>
              </div>
              <Textarea
                placeholder="Breve descripción de la categoría..."
                value={categoryDescription}
                onChange={(e) => {
                  const val = e.target.value
                  setCategoryDescription(val ? val.charAt(0).toUpperCase() + val.slice(1) : '')
                }}
                rows={3}
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isPendingCreate || isPendingUpdate}
                className="rounded-full font-bold"
              >
                {editingCategory ? 'Actualizar' : 'Guardar'}
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

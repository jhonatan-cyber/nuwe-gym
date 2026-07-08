import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClass, updateClass } from '#/features/classes/server.ts'
import type { Class } from '../types.ts'
import { CLASS_COLORS, CLASS_CATEGORIES } from '../constants.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'

interface ClassDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingClass: Class | null
  branchId: string | undefined
}

export function ClassDialog({
  isOpen,
  onOpenChange,
  editingClass,
  branchId,
}: ClassDialogProps) {
  const queryClient = useQueryClient()
  const [classForm, setClassForm] = useState({
    name: '',
    description: '',
    category: '',
    color: '#3b82f6',
    capacity: 20,
  })

  useEffect(() => {
    if (editingClass) {
      setClassForm({
        name: editingClass.name,
        description: editingClass.description || '',
        category: editingClass.category || '',
        color: editingClass.color || '#3b82f6',
        capacity: editingClass.capacity,
      })
    } else {
      setClassForm({
        name: '',
        description: '',
        category: '',
        color: '#3b82f6',
        capacity: 20,
      })
    }
  }, [editingClass, isOpen])

  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      onOpenChange(false)
      toast.success('Clase creada exitosamente')
    },
    onError: () => toast.error('Error al crear la clase'),
  })

  const updateClassMutation = useMutation({
    mutationFn: updateClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      onOpenChange(false)
      toast.success('Clase actualizada')
    },
    onError: () => toast.error('Error al actualizar la clase'),
  })

  function handleClassSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingClass) {
      updateClassMutation.mutate({
        data: { id: editingClass.id, ...classForm },
      })
    } else {
      if (!branchId) {
        toast.error('No se ha seleccionado una sucursal activa')
        return
      }
      createClassMutation.mutate({ data: { ...classForm, branchId } })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleClassSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingClass ? 'Editar Clase' : 'Nueva Clase'}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? 'Actualizá los datos de la clase.'
                : 'Completá los datos para registrar una nueva clase.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                required
                value={classForm.name}
                onChange={(e) =>
                  setClassForm({ ...classForm, name: e.target.value })
                }
                placeholder="Ej: Spinning"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Descripción</Label>
              <Input
                id="desc"
                value={classForm.description}
                onChange={(e) =>
                  setClassForm({ ...classForm, description: e.target.value })
                }
                placeholder="Descripción opcional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select
                value={classForm.category}
                onValueChange={(v) =>
                  setClassForm({ ...classForm, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {CLASS_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-8 rounded-full border-2 transition-all ${
                      classForm.color === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setClassForm({ ...classForm, color })}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacidad Máxima</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                required
                value={classForm.capacity}
                onChange={(e) =>
                  setClassForm({
                    ...classForm,
                    capacity: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={
                createClassMutation.isPending || updateClassMutation.isPending
              }
            >
              Guardar
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

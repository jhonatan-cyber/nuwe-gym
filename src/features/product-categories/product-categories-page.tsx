import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tags, Plus, Edit2, CheckCircle2, XCircle, Tag, FileText } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'
import {
  getCategories,
  createCategory,
  updateCategory,
} from '#/features/products/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { DataTable } from '#/shared/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'

export function ProductCategoriesPage() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<
    (typeof categories)[number] | null
  >(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => getCategories(),
  })

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      toast.success('Categoría creada con éxito')
      closeModal()
    },
    onError: () => toast.error('Error al crear la categoría'),
  })

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      toast.success('Categoría actualizada con éxito')
      closeModal()
    },
    onError: () => toast.error('Error al actualizar la categoría'),
  })

  const openCreateModal = () => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setIsOpen(true)
  }

  const openEditModal = (cat: (typeof categories)[number]) => {
    setEditingCategory(cat)
    setName(cat.name)
    setDescription(cat.description || '')
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingCategory(null)
    setName('')
    setDescription('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingCategory) {
      updateMutation.mutate({
        data: {
          id: editingCategory.id,
          name,
          description,
          isActive: editingCategory.isActive,
        },
      })
    } else {
      createMutation.mutate({ data: { name, description } })
    }
  }

  const toggleStatus = (cat: (typeof categories)[number]) => {
    updateMutation.mutate({
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        isActive: !cat.isActive,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías de Productos"
        description="Administrá las categorías de productos para la venta en el buffet/tienda."
        icon={<Tags className="size-8 text-primary" />}
        action={
          <Button onClick={openCreateModal}>
            <Plus className="size-4" /> Nueva Categoría
          </Button>
        }
      />

      <TooltipProvider delayDuration={200}>
      <DataTable
        columns={[
          {
            key: 'name',
            label: <Tooltip><TooltipTrigger asChild><span className="cursor-default">Nombre</span></TooltipTrigger><TooltipContent side="bottom"><p>Nombre de la categoría de producto</p></TooltipContent></Tooltip>,
            sortable: true,
            sortValue: (cat: (typeof categories)[number]) => cat.name,
            render: (cat: (typeof categories)[number]) => (
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Tag className="size-3 text-muted-foreground" />
                {cat.name}
              </span>
            ),
          },
          {
            key: 'description',
            label: <Tooltip><TooltipTrigger asChild><span className="cursor-default">Descripción</span></TooltipTrigger><TooltipContent side="bottom"><p>Descripción detallada de la categoría</p></TooltipContent></Tooltip>,
            sortable: true,
            sortValue: (cat: (typeof categories)[number]) => cat.description || '',
            render: (cat: (typeof categories)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground max-w-xs truncate">
                <FileText className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{cat.description || '-'}</span>
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Estado',
            sortable: true,
            sortValue: (cat: (typeof categories)[number]) => cat.isActive ? 1 : 0,
            render: (cat: (typeof categories)[number]) =>
              cat.isActive ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none">
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              ),
          },
          {
            key: 'actions',
            label: 'Acciones',
            className: 'text-right',
            render: (cat: (typeof categories)[number]) => (                <div className="flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(cat)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Editar categoría</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={
                        cat.isActive
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-emerald-500 hover:text-emerald-600'
                      }
                      onClick={() => toggleStatus(cat)}
                    >
                      {cat.isActive ? (
                        <XCircle className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{cat.isActive ? 'Desactivar categoría' : 'Activar categoría'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ),
          },
        ]}
        data={categories}
        isLoading={isLoading}
        emptyMessage="No hay categorías registradas."
        keyExtractor={(cat: (typeof categories)[number]) => cat.id}
      />
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Ej. Bebidas, Suplementos, Accesorios"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="Detalle o descripción de la categoría..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  ImagePlus,
  GripVertical,
  Zap,
  List,
} from 'lucide-react'
import { toast } from 'sonner'
import { createPackage, updatePackage } from '#/features/packages/server.ts'
import { capitalize, capitalizeWords } from '#/shared/lib/formatters.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { TYPE_OPTIONS, EMPTY_FORM } from '../types.ts'
import type { PackageType, PackageFormData, Package } from '../types.ts'

interface PackageFormProps {
  editingPackageId: string | null
  onBack: () => void
}

export function PackageForm({ editingPackageId, onBack }: PackageFormProps) {
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

  const formTitle = isEditing ? 'Editar Paquete' : 'Nuevo Paquete'
  const formDesc = isEditing
    ? 'Modifica los datos del paquete.'
    : 'Completa los datos para crear un nuevo paquete.'

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Paquetes</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">
            {isEditing ? 'Editar' : 'Nuevo'}
          </span>
        </div>
      }
      title={formTitle}
      leftPanel={
        <div className="flex flex-col gap-4 z-10 w-full">
          <ToggleGroup
            type="single"
            value="form"
            onValueChange={(v) => {
              if (!v || v === 'list') onBack()
            }}
          >
            <ToggleGroupItem value="list">
              <List className="size-3.5" /> Listado
            </ToggleGroupItem>
            <ToggleGroupItem value="form">
              {isEditing ? (
                <Edit2 className="size-3.5" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {isEditing ? 'Editando' : 'Nuevo'}
            </ToggleGroupItem>
          </ToggleGroup>
          <img
            src="/logo-ligth.png"
            alt="Logo Gym"
            className="w-full mx-auto opacity-90 dark:hidden block"
          />
          <img
            src="/logo-dark.png"
            alt="Logo Gym"
            className="w-full mx-auto opacity-90 hidden dark:block"
          />
          <div className="flex items-start gap-3 p-3 rounded-2xl dark:bg-white/2 bg-black/2 border dark:border-white/5 border-black/5">
            <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Los paquetes se pueden crear a medida. Ej: Sesiones, Primavera,
              Invierno, etc.
            </p>
          </div>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto w-full space-y-6"
      >
        <div>
          <p className="text-sm font-black tracking-tight">{formTitle}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {formDesc}
          </p>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-bold">Imagen del Paquete</Label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative aspect-video max-h-[200px] rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'dark:border-white/10 border-black/10 dark:bg-white/2 bg-black/2'
            }`}
          >
            {formData.imageBase64 ? (
              <>
                <img
                  src={formData.imageBase64}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setFormData({ ...formData, imageBase64: '' })}
                  className="absolute top-2 right-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="size-3.5" />
                </Button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/4 dark:hover:bg-white/4 transition-colors">
                <ImagePlus className="size-8 text-muted-foreground mb-2" />
                <span className="text-xs font-bold text-muted-foreground">
                  Click para subir imagen
                </span>
                <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                  JPG, PNG o WebP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pkg-name" className="text-xs font-bold">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: capitalizeWords(e.target.value),
                })
              }
              placeholder="Ej: Plan Universitario"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold">Tipo</Label>
            <ToggleGroup
              type="single"
              value={formData.type}
              onValueChange={(v) => {
                if (v) setFormData({ ...formData, type: v as PackageType })
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="pkg-desc" className="text-xs font-bold">
            Descripcion
          </Label>
          <Textarea
            id="pkg-desc"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: capitalize(e.target.value),
              })
            }
            placeholder="Descripcion del paquete..."
            className="min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pkg-price" className="text-xs font-bold">
              Precio (Bs.) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-price"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pkg-duration" className="text-xs font-bold">
              Duracion (Dias) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-duration"
              type="number"
              min="1"
              required
              value={formData.durationDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationDays: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold">Beneficios / Incluye</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addItem}
              className="text-xs font-bold h-7"
            >
              <Plus className="size-3 mr-1" /> Agregar
            </Button>
          </div>
          {formData.items.length === 0 ? (
            <div className="text-center py-6 rounded-2xl border border-dashed dark:border-white/10 border-black/10">
              <p className="text-xs text-muted-foreground">
                Sin beneficios configurados
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItem}
                className="text-xs font-bold mt-2 h-7"
              >
                <Plus className="size-3 mr-1" /> Agregar beneficio
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, e.target.value)}
                    placeholder={`Beneficio ${idx + 1}`}
                    className="text-sm"
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeItem(idx)}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <LoadingButton
            type="submit"
            isLoading={createMutation.isPending || updateMutation.isPending}
            className="bg-black text-white border border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors duration-200"
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Paquete'}
          </LoadingButton>
        </div>
      </form>
    </ModuleLayout>
  )
}

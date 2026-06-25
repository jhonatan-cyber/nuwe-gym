import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Package,
  ChevronRight,
  Trash2,
  Edit2,
  X,
  ImagePlus,
  GripVertical,
  Sparkles,
  Tag,
  List,
  Filter,
  Zap,
  Power,
  PowerOff,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from '#/features/packages/server.ts'
import { formatCurrency, capitalize, capitalizeWords } from '#/shared/lib/formatters.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { useTheme } from 'next-themes'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '#/shared/components/ui/alert-dialog'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { SearchInput } from '#/shared/components/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'


type PackageType = 'PACKAGE' | 'PROMOTION' | 'SPECIAL'

interface PackageItem {
  description: string
  sortOrder: number
}

interface PackageFormData {
  name: string
  description: string
  imageBase64: string
  price: string
  durationDays: number
  type: PackageType
  isActive: boolean
  items: PackageItem[]
}

const EMPTY_FORM: PackageFormData = {
  name: '',
  description: '',
  imageBase64: '',
  price: '',
  durationDays: 30,
  type: 'PACKAGE',
  isActive: true,
  items: [],
}

const TYPE_OPTIONS: { value: PackageType; label: string; icon: typeof Package }[] = [
  { value: 'PACKAGE', label: 'Paquete', icon: Package },
  { value: 'PROMOTION', label: 'Promocion', icon: Tag },
  { value: 'SPECIAL', label: 'Especial', icon: Sparkles },
]

interface PackagesPageProps {
  userRole: string
}

export function PackagesPage({ userRole }: PackagesPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [activeView, setActiveView] = useState<'list' | 'form'>('list')
  const [editingPackage, setEditingPackage] = useState<number | null>(null)
  const [formData, setFormData] = useState<PackageFormData>(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  const { data: packagesList = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(),
  })

  const createMutation = useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setFormData(EMPTY_FORM)
      setActiveView('list')
      toast.success('Paquete creado exitosamente')
    },
    onError: () => toast.error('Error al crear el paquete'),
  })

  const updateMutation = useMutation({
    mutationFn: updatePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setFormData(EMPTY_FORM)
      setEditingPackage(null)
      setActiveView('list')
      toast.success('Paquete actualizado')
    },
    onError: () => toast.error('Error al actualizar el paquete'),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setFormData(EMPTY_FORM)
      setEditingPackage(null)
      setActiveView('list')
      toast.success('Paquete eliminado')
    },
    onError: () => toast.error('Error al eliminar el paquete'),
  })

  const filtered = packagesList.filter((p) => {
    if (filterType !== 'ALL' && p.type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q)
    }
    return true
  })

  const totalPackages = packagesList.length
  const activePackages = packagesList.filter((p) => p.isActive).length

  function handleOpenEdit(pkg: (typeof packagesList)[number]) {
    setEditingPackage(pkg.id)
    setFormData({
      name: pkg.name,
      description: pkg.description ?? '',
      imageBase64: pkg.imageBase64 ?? '',
      price: pkg.price,
      durationDays: pkg.durationDays,
      type: pkg.type as PackageType,
      isActive: pkg.isActive,
      items: (pkg.items ?? []).map((i) => ({
        description: i.description,
        sortOrder: i.sortOrder,
      })),
    })
    setActiveView('form')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingPackage) {
      updateMutation.mutate({ data: { ...formData, id: editingPackage } })
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

  function getDurationLabel(days: number): string {
    if (days === 1) return '1 Dia'
    if (days < 7) return `${days} Dias`
    if (days === 7) return '1 Semana'
    if (days < 30) return `${Math.round(days / 7)} Semanas`
    if (days === 30) return '1 Mes'
    if (days < 365) return `${Math.round(days / 30)} Meses`
    if (days === 365) return '1 Anio'
    return `${days} Dias`
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'PROMOTION': return Tag
      case 'SPECIAL': return Sparkles
      default: return Package
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'PROMOTION': return 'Promocion'
      case 'SPECIAL': return 'Especial'
      default: return 'Paquete'
    }
  }

  const isEditing = editingPackage !== null
  const formTitle = isEditing ? 'Editar Paquete' : 'Nuevo Paquete'
  const formDesc = isEditing
    ? 'Modifica los datos del paquete.'
    : 'Completa los datos para crear un nuevo paquete.'

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // ── Form view (create + edit, inline) ──
  if (activeView === 'form' && !isReadOnly) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Paquetes</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">{isEditing ? 'Editar' : 'Nuevo'}</span>
          </div>
        }
        title={formTitle}
        leftPanel={
          <div className="flex flex-col gap-4 z-10 w-full">
            {/* View Toggle */}
            <ToggleGroup
              type="single"
              value="form"
              onValueChange={(v) => {
                if (!v) return
                if (v === 'list') {
                  setFormData(EMPTY_FORM)
                  setEditingPackage(null)
                  setActiveView('list')
                }
              }}
            >
              <ToggleGroupItem value="list">
                <List className="size-3.5" /> Listado
              </ToggleGroupItem>
              <ToggleGroupItem value="form">
                {isEditing ? <Edit2 className="size-3.5" /> : <Plus className="size-3.5" />}
                {isEditing ? 'Editando' : 'Nuevo'}
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Logo */}
            <img
              src={isDark ? '/logo-dark.png' : '/logo-ligth.png'}
              alt="Logo Gym"
              className="w-full mx-auto opacity-90"
            />

            {/* Info note */}
            <div className="flex items-start gap-3 p-3 rounded-2xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/5 border-black/5">
              <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Los paquetes se pueden crear a medida. Ej: Sesiones, Primavera, Invierno, etc.
              </p>
            </div>
          </div>
        }
      >
        {/* ── Form inline ── */}
        <div className="bg-card p-6 rounded-[2rem] border border-border/10 shadow-xl overflow-y-auto max-h-full">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <p className="text-sm font-black tracking-tight">{formTitle}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {formDesc}
              </p>
            </div>

            {/* Image upload */}
            <div className="grid gap-2">
              <Label className="text-xs font-bold">Imagen del Paquete</Label>
              <div className="relative aspect-[16/9] max-h-[200px] rounded-2xl border-2 border-dashed dark:border-white/10 border-black/10 overflow-hidden dark:bg-white/[0.02] bg-black/[0.02]">
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
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
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

            {/* Name + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pkg-name" className="text-xs font-bold">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pkg-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: capitalizeWords(e.target.value) })}
                  placeholder="Ej: Plan Universitario"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold">Tipo</Label>
                <ToggleGroup
                  type="single"
                  value={formData.type}
                  onValueChange={(v) => {
                    if (v) setFormData({ ...formData, type: v as 'REGULAR' | 'PROMOTION' | 'SPECIAL' })
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

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="pkg-desc" className="text-xs font-bold">
                Descripcion
              </Label>
              <Textarea
                id="pkg-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: capitalize(e.target.value) })}
                placeholder="Descripcion del paquete..."
                className="min-h-[80px]"
              />
            </div>

            {/* Price + Duration */}
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
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                    setFormData({ ...formData, durationDays: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Benefits / Items */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">
                  Beneficios / Incluye
                </Label>
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(EMPTY_FORM)
                  setEditingPackage(null)
                  setActiveView('list')
                }}
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                className="bg-foreground text-primary-foreground hover:bg-foreground/90"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Paquete'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </ModuleLayout>
    )
  }

  // ── List view (cards) ──
  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Paquetes</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Listado</span>
        </div>
      }
      title="Paquetes"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          {/* View Toggle */}
          {!isReadOnly && (
            <ToggleGroup
              type="single"
              value="list"
              onValueChange={(v) => {
                if (!v) return
                if (v === 'form') {
                  setFormData(EMPTY_FORM)
                  setEditingPackage(null)
                  setActiveView('form')
                }
              }}
            >
              <ToggleGroupItem value="list">
                <List className="size-3.5" /> Listado
              </ToggleGroupItem>
              <ToggleGroupItem value="form">
                <Plus className="size-3.5" /> Nuevo
              </ToggleGroupItem>
            </ToggleGroup>
          )}

          {/* Metrics */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Metricas
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative overflow-hidden bg-muted/60 p-4.5 rounded-[1.25rem] border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    Total Paquetes
                  </p>
                  <p className="text-2xl font-black tracking-tight">
                    {totalPackages}
                  </p>
                </div>
                <div className="size-10 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center dark:group-hover:bg-white/10 group-hover:bg-black/10 transition-all duration-300 shrink-0">
                  <Package className="size-5 text-muted-foreground group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>

              <div className="relative overflow-hidden bg-muted/60 p-4.5 rounded-[1.25rem] border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Activos
                  </p>
                  <p className="text-2xl font-black text-emerald-500 tracking-tight">
                    {activePackages}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shrink-0">
                  <Package className="size-5 text-emerald-500 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 pt-2 border-t dark:border-white/5 border-black/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Filtros
            </p>
            <div className="space-y-2">
              <SearchInput
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
              <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
                <SelectTrigger className="w-full">
                  <Filter className="size-3 mr-1" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los Tipos</SelectItem>
                  <SelectItem value="PACKAGE">Paquete</SelectItem>
                  <SelectItem value="PROMOTION">Promocion</SelectItem>
                  <SelectItem value="SPECIAL">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      }
    >
      {/* Card grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-black tracking-tight">
            {filtered.length} paquete{filtered.length !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {getTypeLabel(filterType === 'ALL' ? 'PACKAGE' : filterType)}
          </p>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="size-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="size-16 rounded-3xl dark:bg-white/5 bg-black/5 flex items-center justify-center mb-4">
              <Package className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              No hay paquetes registrados
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Crea tu primer paquete con el boton del panel izquierdo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((pkg) => {
              const TypeIcon = getTypeIcon(pkg.type)
              return (
                <div
                  key={pkg.id}
                  className="group relative rounded-2xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.01] bg-card"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden dark:bg-white/[0.02] bg-black/[0.02]">
                    {pkg.imageBase64 ? (
                      <img
                        src={pkg.imageBase64}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="size-12 text-muted-foreground/30" strokeWidth={1} />
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-foreground/80 text-primary-foreground backdrop-blur-md border-none text-[10px] font-bold uppercase tracking-wider gap-1">
                        <TypeIcon className="size-3" />
                        {getTypeLabel(pkg.type)}
                      </Badge>
                    </div>

                    {/* Inactive overlay */}
                    {!pkg.isActive && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="secondary" className="font-bold">
                          Inactivo
                        </Badge>
                      </div>
                    )}

                    {/* Action buttons overlay */}
                    {!isReadOnly && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(pkg)}
                                className="rounded-xl bg-white/90 text-black hover:bg-white dark:bg-black/90 dark:text-white dark:hover:bg-black"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Editar paquete</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  updateMutation.mutate({
                                    data: {
                                      name: pkg.name,
                                      description: pkg.description ?? '',
                                      imageBase64: pkg.imageBase64 ?? '',
                                      price: pkg.price,
                                      durationDays: pkg.durationDays,
                                      type: pkg.type as PackageType,
                                      isActive: !pkg.isActive,
                                      items: (pkg.items ?? []).map((i) => ({
                                        description: i.description,
                                        sortOrder: i.sortOrder,
                                      })),
                                      id: pkg.id,
                                    },
                                  })
                                }}
                                className={`rounded-xl ${
                                  pkg.isActive
                                    ? 'bg-emerald-500/90 text-white hover:bg-emerald-500'
                                    : 'bg-muted/90 text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {pkg.isActive ? <Power className="size-3.5" /> : <PowerOff className="size-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>{pkg.isActive ? 'Desactivar paquete' : 'Activar paquete'}</p>
                            </TooltipContent>
                          </Tooltip>
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="destructive" className="rounded-xl">
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Eliminar paquete</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar paquete</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estas seguro de eliminar este paquete? Esta accion no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild>
                                  <Button variant="destructive" onClick={() => deleteMutation.mutate({ data: { id: pkg.id } })}>
                                    Eliminar
                                  </Button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-black text-sm tracking-tight truncate">
                        {pkg.name}
                      </h3>
                      {/* Status badge */}
                      {pkg.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold shrink-0">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-bold shrink-0">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground">
                        Precio: {formatCurrency(Number(pkg.price))}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground">
                        Tiempo: {getDurationLabel(pkg.durationDays)}
                      </p>
                    </div>
                    {pkg.items && pkg.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t dark:border-white/5 border-black/5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                          Beneficios
                        </p>
                        <ul className="space-y-1">
                          {pkg.items.slice(0, 3).map((item, idx) => (
                            <li
                              key={idx}
                              className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                            >
                              <span className="size-1 rounded-full bg-foreground/40 shrink-0" />
                              <span className="truncate">{item.description}</span>
                            </li>
                          ))}
                          {pkg.items.length > 3 && (
                            <li className="text-[10px] text-muted-foreground font-semibold">
                              +{pkg.items.length - 3} mas
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}

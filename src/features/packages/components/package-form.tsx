import {
  Plus,
  ChevronRight,
  Edit2,
  X,
  ImagePlus,
  Zap,
  List,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { capitalizeWords } from '#/shared/lib/formatters.ts'
import {
  TYPE_OPTIONS,
  RENEWAL_OPTIONS,
  DAY_LABELS,
  DAY_LABELS_FULL,
} from '#/features/packages/types.ts'
import { BENEFIT_CATALOG } from '#/features/packages/types.ts'
import type { PackageType } from '#/features/packages/types.ts'
import { usePackageForm } from '#/features/packages/hooks/use-package-form.ts'

interface PackageFormProps {
  editingPackageId: string | null
  onBack: () => void
}

export function PackageForm({ editingPackageId, onBack }: PackageFormProps) {
  const {
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
    toggleDay,
    toggleBenefit,
    updateDayTime,
  } = usePackageForm({ editingPackageId, onBack })

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
                description: e.target.value,
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

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs font-bold">Renovacion</Label>
            <ToggleGroup
              type="single"
              value={formData.renewalType}
              onValueChange={(v) => {
                if (v)
                  setFormData({
                    ...formData,
                    renewalType: v as 'MANUAL' | 'AUTO',
                  })
              }}
            >
              {RENEWAL_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color || '#000000'}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="size-9 rounded-lg border dark:border-white/10 border-black/10 cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#000000"
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pkg-grace" className="text-xs font-bold">
              Dias de Gracia
            </Label>
            <Input
              id="pkg-grace"
              type="number"
              min="0"
              value={formData.graceDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  graceDays: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pkg-freezes" className="text-xs font-bold">
              Max. Congelamientos
            </Label>
            <Input
              id="pkg-freezes"
              type="number"
              min="0"
              value={formData.maxFreezes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxFreezes: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pkg-freeze-days" className="text-xs font-bold">
              Dias x Congelamiento
            </Label>
            <Input
              id="pkg-freeze-days"
              type="number"
              min="0"
              value={formData.maxFreezeDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxFreezeDays: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pkg-start" className="text-xs font-bold">
              Hora Inicio
            </Label>
            <Input
              id="pkg-start"
              type="time"
              value={formData.allowedStartTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowedStartTime: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pkg-end" className="text-xs font-bold">
              Hora Fin
            </Label>
            <Input
              id="pkg-end"
              type="time"
              value={formData.allowedEndTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowedEndTime: e.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pkg-daily" className="text-xs font-bold">
              Accesos x Dia
            </Label>
            <Input
              id="pkg-daily"
              type="number"
              min="0"
              placeholder="Ilimitado"
              value={
                formData.dailyAccessLimit === undefined
                  ? ''
                  : formData.dailyAccessLimit
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dailyAccessLimit: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-3">
          <Label className="text-xs font-bold">Dias Permitidos</Label>
          <p className="text-[10px] text-muted-foreground -mt-2">
            Si no seleccionas ninguno, se permite acceso todos los dias.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, day) => {
                const isSelected = formData.allowedDays.some(
                  (d) => d.dayOfWeek === day,
                )
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`size-9 rounded-xl text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                        : 'dark:bg-white/5 bg-black/5 text-muted-foreground hover:dark:bg-white/10 hover:bg-black/10'
                    }`}
                    title={DAY_LABELS_FULL[day]}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {formData.allowedDays.length > 0 && (
              <div className="mt-2 space-y-2 border-t border-border/5 pt-3 animate-in fade-in duration-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Configurar Horarios por Día
                </p>
                <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {[...formData.allowedDays]
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((dayData) => {
                      const day = dayData.dayOfWeek
                      const dayName = DAY_LABELS_FULL[day]
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-between py-1.5 px-3 rounded-2xl bg-muted/20 border border-border/5"
                        >
                          <span className="text-xs font-bold text-foreground">
                            {dayName}
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={dayData.startTime ?? ''}
                              onChange={(e) =>
                                updateDayTime(day, 'startTime', e.target.value)
                              }
                              className="w-20 text-xs px-2 py-1 rounded-xl border dark:border-white/10 border-black/10 bg-background text-foreground dark:[color-scheme:dark] text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              placeholder="--:--"
                            />
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              a
                            </span>
                            <input
                              type="time"
                              value={dayData.endTime ?? ''}
                              onChange={(e) =>
                                updateDayTime(day, 'endTime', e.target.value)
                              }
                              className="w-20 text-xs px-2 py-1 rounded-xl border dark:border-white/10 border-black/10 bg-background text-foreground dark:[color-scheme:dark] text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              placeholder="--:--"
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <Label className="text-xs font-bold">Beneficios del Plan</Label>
          <p className="text-[10px] text-muted-foreground -mt-2">
            Activá los beneficios incluidos en este plan.
          </p>
          <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
            {BENEFIT_CATALOG.map((benefit) => {
              const isEnabled = formData.benefits.find(
                (b) => b.benefitKey === benefit.key,
              )?.enabled ?? false
              return (
                <button
                  key={benefit.key}
                  type="button"
                  onClick={() => toggleBenefit(benefit.key as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                    isEnabled
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'dark:bg-white/5 bg-black/5 text-muted-foreground hover:dark:bg-white/10 hover:bg-black/10'
                  }`}
                >
                  <span className={`size-2 rounded-full shrink-0 ${
                    isEnabled ? 'bg-current' : 'bg-muted-foreground/30'
                  }`} />
                  {benefit.label}
                </button>
              )
            })}
          </div>
          {formData.benefits.filter((b) => b.enabled).length === 0 && (
            <p className="text-[10px] text-destructive font-semibold">
              Seleccioná al menos un beneficio.
            </p>
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

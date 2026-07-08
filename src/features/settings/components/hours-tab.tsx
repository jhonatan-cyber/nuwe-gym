import { Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'

const DAYS = [
  { key: 'mondayOpen', label: 'Lunes' },
  { key: 'tuesdayOpen', label: 'Martes' },
  { key: 'wednesdayOpen', label: 'Miércoles' },
  { key: 'thursdayOpen', label: 'Jueves' },
  { key: 'fridayOpen', label: 'Viernes' },
  { key: 'saturdayOpen', label: 'Sábado' },
  { key: 'sundayOpen', label: 'Domingo' },
] as const

interface HoursTabProps {
  form: {
    logoBase64: string
    openingTime: string
    closingTime: string
    mondayOpen: boolean
    tuesdayOpen: boolean
    wednesdayOpen: boolean
    thursdayOpen: boolean
    fridayOpen: boolean
    saturdayOpen: boolean
    sundayOpen: boolean
  }
  onChange: (field: any, value: any) => void
  onSave: () => void
  isSaving: boolean
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export function HoursTab({
  form,
  onChange,
  onSave,
  isSaving,
}: HoursTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
        <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-black">Logo del Gimnasio</CardTitle>
          <CardDescription>
            Imagen que se mostrará en los reportes y recibos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="flex items-center gap-4">
            {form.logoBase64 ? (
              <img
                src={form.logoBase64}
                alt="Logo preview"
                className="size-24 rounded-2xl border border-border/10 object-contain bg-white shadow-md"
              />
            ) : (
              <div className="size-24 rounded-2xl border border-dashed border-border/20 flex items-center justify-center text-muted-foreground bg-muted/20">
                <Upload className="size-8 text-muted-foreground/60" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seleccionar imagen</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                className="mt-1 rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const result = ev.target?.result
                    if (typeof result === 'string') {
                      onChange('logoBase64', result)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {form.logoBase64 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full font-semibold"
                  onClick={() => onChange('logoBase64', '')}
                >
                  Eliminar logo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
        <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-black">Horario de Atención</CardTitle>
          <CardDescription>
            Configurá los días y horarios de apertura del gimnasio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hora de apertura">
              <Input
                type="time"
                value={form.openingTime}
                onChange={(e) => onChange('openingTime', e.target.value)}
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
              />
            </Field>
            <Field label="Hora de cierre">
              <Input
                type="time"
                value={form.closingTime}
                onChange={(e) => onChange('closingTime', e.target.value)}
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
              />
            </Field>
          </div>
          <Separator className="border-border/5" />
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Días de atención</Label>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {DAYS.map((day) => (
                <label
                  key={day.key}
                  className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-muted/30 transition-all duration-150"
                >
                  <span className="text-sm font-semibold">{day.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form[day.key as keyof typeof form] as boolean}
                    onClick={() =>
                      onChange(
                        day.key,
                        !(form[day.key as keyof typeof form] as boolean),
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      (form[day.key as keyof typeof form] as boolean)
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                        (form[day.key as keyof typeof form] as boolean)
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex justify-end">
        <LoadingButton
          onClick={onSave}
          isLoading={isSaving}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Guardar cambios
        </LoadingButton>
      </div>
    </div>
  )
}

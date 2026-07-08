import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Label } from '#/shared/components/ui/label'

interface GeneralTabProps {
  form: {
    gymName: string
    gymAddress: string
    gymPhone: string
    gymEmail: string
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

export function GeneralTab({
  form,
  onChange,
  onSave,
  isSaving,
}: GeneralTabProps) {
  return (
    <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
      <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-black">Información General</CardTitle>
        <CardDescription>Datos principales del gimnasio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <Field label="Nombre del gimnasio" required>
          <Input
            value={form.gymName}
            onChange={(e) => onChange('gymName', e.target.value)}
            placeholder="Mi Gimnasio"
            className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
          />
        </Field>
        <Field label="Dirección">
          <Input
            value={form.gymAddress}
            onChange={(e) => onChange('gymAddress', e.target.value)}
            placeholder="Calle y número"
            className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono">
            <Input
              value={form.gymPhone}
              onChange={(e) => onChange('gymPhone', e.target.value)}
              placeholder="+54 11 1234-5678"
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.gymEmail}
              onChange={(e) => onChange('gymEmail', e.target.value)}
              placeholder="info@gimnasio.com"
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
        </div>
        <Separator className="border-border/5" />
        <div className="flex justify-end pt-2">
          <LoadingButton
            onClick={onSave}
            isLoading={isSaving}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Guardar cambios
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Label } from '#/shared/components/ui/label'

interface PaymentsTabProps {
  form: {
    stripeSecretKey: string
    stripePublishableKey: string
    stripeWebhookSecret: string
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

export function PaymentsTab({
  form,
  onChange,
  onSave,
  isSaving,
}: PaymentsTabProps) {
  return (
    <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
      <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-black">Pagos Automáticos (Stripe)</CardTitle>
        <CardDescription>
          Configurá Stripe para cobrar automáticamente las membresías con tarjeta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <p className="text-xs text-muted-foreground">
          Necesitás una cuenta de{' '}
          <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Stripe
          </a>{' '}
          para aceptar pagos con tarjeta. Obtené tus claves en{' '}
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Stripe Dashboard → API Keys
          </a>.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stripe Secret Key">
            <Input
              type="password"
              value={form.stripeSecretKey}
              onChange={(e) => onChange('stripeSecretKey', e.target.value)}
              placeholder="sk_live_..."
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
            />
          </Field>
          <Field label="Stripe Publishable Key">
            <Input
              value={form.stripePublishableKey}
              onChange={(e) => onChange('stripePublishableKey', e.target.value)}
              placeholder="pk_live_..."
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
            />
          </Field>
        </div>
        <Field label="Stripe Webhook Secret">
          <Input
            type="password"
            value={form.stripeWebhookSecret}
            onChange={(e) => onChange('stripeWebhookSecret', e.target.value)}
            placeholder="whsec_..."
            className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
          />
        </Field>
        <Separator className="border-border/5" />
        <p className="text-xs text-muted-foreground">
          Una vez configurado, los socios podrán guardar sus tarjetas desde el detalle de socio.
          Las renovaciones automáticas intentarán cobrar la tarjeta guardada con auto-pago activado.
          Si el cobro falla, se creará un pago pendiente.
        </p>
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

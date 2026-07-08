import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Label } from '#/shared/components/ui/label'

interface BillingTabProps {
  form: {
    currencySymbol: string
    currencyCode: string
    taxRate: string
    decimalPlaces: number
    companyTaxId: string
    companyLegalName: string
    invoiceFooter: string
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

export function BillingTab({
  form,
  onChange,
  onSave,
  isSaving,
}: BillingTabProps) {
  return (
    <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
      <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-black">Facturación</CardTitle>
        <CardDescription>
          Configuración de moneda, impuestos y datos fiscales para facturas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Moneda
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Símbolo de moneda">
            <Input
              value={form.currencySymbol}
              onChange={(e) => onChange('currencySymbol', e.target.value)}
              placeholder="$"
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
          <Field label="Código de moneda">
            <Input
              value={form.currencyCode}
              onChange={(e) => onChange('currencyCode', e.target.value)}
              placeholder="ARS"
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tasa de impuesto (%)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.taxRate}
                onChange={(e) => onChange('taxRate', e.target.value)}
                placeholder="0.00"
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
              />
            </Field>
            <Field label="Decimales">
              <Input
                type="number"
                min="0"
                max="10"
                value={form.decimalPlaces}
                onChange={(e) => onChange('decimalPlaces', Number(e.target.value))}
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
              />
            </Field>
          </div>
        </div>
        <Separator className="border-border/5" />
        <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Datos fiscales (Facturas)
        </span>
        <Field label="RUC / CUIT / NIT">
          <Input
            value={form.companyTaxId}
            onChange={(e) => onChange('companyTaxId', e.target.value)}
            placeholder="12345678-9"
            className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
          />
        </Field>
        <Field label="Razón social">
          <Input
            value={form.companyLegalName}
            onChange={(e) => onChange('companyLegalName', e.target.value)}
            placeholder="Mi Gimnasio S.A."
            className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
          />
        </Field>
        <Field label="Pie de factura">
          <Input
            value={form.invoiceFooter}
            onChange={(e) => onChange('invoiceFooter', e.target.value)}
            placeholder="Gracias por su compra"
            className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
          />
        </Field>
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

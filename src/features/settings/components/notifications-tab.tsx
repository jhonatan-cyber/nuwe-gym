import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Label } from '#/shared/components/ui/label'

interface NotificationsTabProps {
  form: {
    lowStockThreshold: number
    membershipReminderDays: number
    checkInWindowMinutes: number
    enableAutoRenew: boolean
    autoRenewSecretKey: string
    resendApiKey: string
    emailFrom: string
    twilioAccountSid: string
    twilioAuthToken: string
    twilioWhatsAppNumber: string
    twilioSmsNumber: string
    waTemplateExpirationSid: string
    waTemplateExpiredSid: string
    waTemplateBirthdaySid: string
    waTemplateInactiveSid: string
    waTemplateClassReminderSid: string
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

function TemplateSidField({
  label,
  sid,
  onChange,
  variables,
}: {
  label: string
  sid: string
  onChange: (value: string) => void
  variables: { key: string; desc: string }[]
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-border/10 bg-background/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-bold text-muted-foreground shrink-0">{label}</Label>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Input
            value={sid}
            onChange={(e) => onChange(e.target.value)}
            placeholder="HX... (dejar vacío = texto plano)"
            className="flex-1 rounded-xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-[11px] h-8"
          />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 font-semibold underline underline-offset-2"
          >
            {expanded ? 'ocultar' : `{{}}`}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="text-[10px] text-muted-foreground bg-background/50 rounded-lg p-2 space-y-0.5">
          <p className="font-semibold mb-1">Variables del template:</p>
          {variables.map((v) => (
            <p key={v.key}>
              <code className="text-primary font-mono">{`{{${v.key}}}`}</code> = {v.desc}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function NotificationsTab({
  form,
  onChange,
  onSave,
  isSaving,
}: NotificationsTabProps) {
  return (
    <Card className="rounded-4xl border-border/10 shadow-xl bg-card text-foreground overflow-hidden relative transition-all duration-200">
      <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-black">Notificaciones</CardTitle>
        <CardDescription>
          Alertas y recordatorios automáticos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stock mínimo (unidades)">
            <Input
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(e) =>
                onChange('lowStockThreshold', Number(e.target.value))
              }
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
          <Field label="Días para recordatorio de membresía">
            <Input
              type="number"
              min="0"
              value={form.membershipReminderDays}
              onChange={(e) =>
                onChange(
                  'membershipReminderDays',
                  Number(e.target.value),
                )
              }
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ventana de check-in (minutos)">
            <Input
              type="number"
              min="0"
              value={form.checkInWindowMinutes}
              onChange={(e) =>
                onChange('checkInWindowMinutes', Number(e.target.value))
              }
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
            />
          </Field>
          <Field label="Renovación automática">
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input
                type="checkbox"
                checked={form.enableAutoRenew}
                onChange={(e) =>
                  onChange('enableAutoRenew', e.target.checked)
                }
                className="size-4 rounded border-border/20 accent-primary"
              />
              <span className="text-sm font-semibold text-muted-foreground">
                Activar renovación automática de membresías
              </span>
            </label>
          </Field>
        </div>
        <Separator className="border-border/5" />
        <div className="space-y-4">
          <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            Cron API Key (Auto-Renovaciones)
          </span>
          <p className="text-xs text-muted-foreground">
            Configurá una clave secreta para el endpoint cron que ejecuta las renovaciones automáticas.
            El cron job externo (Vercel Cron, cron-job.org, etc.) debe llamar a{' '}
            <code className="text-primary text-[10px]">POST /api/cron/auto-renewals</code> con el header{' '}
            <code className="text-primary text-[10px]">x-api-key</code>.
          </p>
          <Field label="API Key para Cron">
            <Input
              type="password"
              value={form.autoRenewSecretKey}
              onChange={(e) =>
                onChange('autoRenewSecretKey', e.target.value)
              }
              placeholder="Ingresá una clave secreta..."
              className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
            />
          </Field>
        </div>
        <Separator className="border-border/5" />
        <div className="space-y-4">
          <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            Email (Resend)
          </span>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="API Key">
              <Input
                type="password"
                value={form.resendApiKey}
                onChange={(e) =>
                  onChange('resendApiKey', e.target.value)
                }
                placeholder="re_..."
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
              />
            </Field>
            <Field label="Email remitente">
              <Input
                type="email"
                value={form.emailFrom}
                onChange={(e) => onChange('emailFrom', e.target.value)}
                placeholder="notificaciones@tugimnasio.com"
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50"
              />
            </Field>
          </div>
        </div>
        <Separator className="border-border/5" />
        <div className="space-y-4">
          <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            WhatsApp & SMS (Twilio)
          </span>
          <p className="text-xs text-muted-foreground">
            Configurá Twilio para enviar notificaciones por WhatsApp y SMS.
            Creá una cuenta en{' '}
            <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Twilio.com
            </a>, obtené un número de teléfono con capacidad WhatsApp y SMS, y copiá tus credenciales acá.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account SID">
              <Input
                value={form.twilioAccountSid}
                onChange={(e) => onChange('twilioAccountSid', e.target.value)}
                placeholder="AC..."
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
              />
            </Field>
            <Field label="Auth Token">
              <Input
                type="password"
                value={form.twilioAuthToken}
                onChange={(e) => onChange('twilioAuthToken', e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
              />
            </Field>
            <Field label="Número WhatsApp (con código país)">
              <Input
                value={form.twilioWhatsAppNumber}
                onChange={(e) => onChange('twilioWhatsAppNumber', e.target.value)}
                placeholder="whatsapp:+14155238886"
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
              />
            </Field>
            <Field label="Número SMS (con código país)">
              <Input
                value={form.twilioSmsNumber}
                onChange={(e) => onChange('twilioSmsNumber', e.target.value)}
                placeholder="+14155238886"
                className="rounded-2xl border-border/10 focus-visible:ring-primary bg-background/50 font-mono text-xs"
              />
            </Field>
          </div>
        </div>
        <Separator className="border-border/5" />
        <div className="space-y-4">
          <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            WhatsApp Templates (Twilio Content API)
          </span>
          <p className="text-xs text-muted-foreground">
            Configurá los Content SID (<code className="text-primary text-[10px]">HX...</code>) de tus templates aprobados en Twilio Console.
            Cuando un SID esté configurado, el sistema lo usará automáticamente en vez del mensaje de texto plano.
            Los mensajes pueden incluir imágenes y botones interactivos.
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Creá los templates en{' '}
            <a href="https://console.twilio.com/us1/develop/sms/content-editor" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Twilio Console → Content Editor
            </a>{' '}
            y copiá acá el Content SID (empieza con <code className="text-primary text-[10px]">HX</code>).
          </p>
          <div className="grid gap-3">
            <TemplateSidField
              label="Recordatorio de vencimiento"
              sid={form.waTemplateExpirationSid}
              onChange={(v) => onChange('waTemplateExpirationSid', v)}
              variables={[
                { key: '1', desc: 'Nombre del socio' },
                { key: '2', desc: 'Días hasta vencer (ej: "1")' },
                { key: '3', desc: 'Fecha de vencimiento' },
                { key: '4', desc: 'Nombre del gimnasio' },
              ]}
            />
            <TemplateSidField
              label="Membresía expirada"
              sid={form.waTemplateExpiredSid}
              onChange={(v) => onChange('waTemplateExpiredSid', v)}
              variables={[
                { key: '1', desc: 'Nombre del socio' },
                { key: '2', desc: 'Días de vencido (ej: "5")' },
                { key: '3', desc: 'Nombre del gimnasio' },
              ]}
            />
            <TemplateSidField
              label="Feliz cumpleaños"
              sid={form.waTemplateBirthdaySid}
              onChange={(v) => onChange('waTemplateBirthdaySid', v)}
              variables={[
                { key: '1', desc: 'Nombre del socio' },
                { key: '2', desc: 'Nombre del gimnasio' },
              ]}
            />
            <TemplateSidField
              label="Recuperación inactivos"
              sid={form.waTemplateInactiveSid}
              onChange={(v) => onChange('waTemplateInactiveSid', v)}
              variables={[
                { key: '1', desc: 'Nombre del socio' },
                { key: '2', desc: 'Días inactivo (ej: "30")' },
                { key: '3', desc: 'Nombre del gimnasio' },
              ]}
            />
            <TemplateSidField
              label="Recordatorio de clase"
              sid={form.waTemplateClassReminderSid}
              onChange={(v) => onChange('waTemplateClassReminderSid', v)}
              variables={[
                { key: '1', desc: 'Nombre del socio' },
                { key: '2', desc: 'Nombre de la clase' },
                { key: '3', desc: 'Horario (ej: "10:00")' },
                { key: '4', desc: 'Sala' },
                { key: '5', desc: 'Nombre del gimnasio' },
              ]}
            />
          </div>
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

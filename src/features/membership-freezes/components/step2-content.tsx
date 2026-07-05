import { Snowflake } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { MemberHeaderCard } from '#/features/membership-freezes/components/member-header-card.tsx'
import { FreezeSummaryCard } from '#/features/membership-freezes/components/freeze-summary-card.tsx'
import { WizardFooter } from '#/features/membership-freezes/wizard-footer.tsx'
import { formatDate } from '#/shared/lib/formatters.ts'
import type { MemberWithSubscriptions, FreezeFormData } from '../types.ts'

interface Step2Props {
  selectedMember: MemberWithSubscriptions
  formData: FreezeFormData
  setFormData: (v: FreezeFormData) => void
  activeSubs: any[]
  frozenSubsCount: number
  onNext: () => void
  onBack: () => void
}

export function Step2Content({
  selectedMember,
  formData,
  setFormData,
  activeSubs,
  frozenSubsCount,
  onNext,
  onBack,
}: Step2Props) {
  const selectedSub = activeSubs.find((s) => s.id === formData.subscriptionId)

  const freezeDays =
    formData.startDate && formData.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(formData.endDate).getTime() -
              new Date(formData.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0

  const calculatedEndDate =
    selectedSub && freezeDays > 0
      ? (() => {
          const end = new Date(selectedSub.endDate)
          end.setDate(end.getDate() + freezeDays)
          return end
        })()
      : null

  const ready = !!formData.subscriptionId && !!formData.startDate && !!formData.endDate

  return (
    <div className="p-6 flex-1 flex flex-col min-w-0 justify-between mx-auto w-full max-w-xl animate-in fade-in duration-300">
      <div className="space-y-6">
        <MemberHeaderCard member={selectedMember} />

        <div className="text-center">
          <h3 className="text-xl font-black tracking-tight text-foreground">
            Configurar Congelamiento
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Seleccione suscripción y fechas
          </p>
        </div>

        {activeSubs.length === 1 ? (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col gap-1 shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
              Suscripción Activa a Congelar
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">
                {activeSubs[0].package?.name || 'Suscripción activa'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Activa
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium mt-1">
              Vence el {formatDate(activeSubs[0].endDate)}
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="subscription" className="text-xs font-bold px-1">
              Suscripción activa <span className="text-destructive">*</span>
            </Label>
            <select
              id="subscription"
              required
              className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={formData.subscriptionId}
              onChange={(e) =>
                setFormData({ ...formData, subscriptionId: e.target.value })
              }
            >
              <option value="" disabled>
                Seleccioná una suscripción activa...
              </option>
              {activeSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.package?.name || 'N/A'} (vence: {formatDate(s.endDate)})
                </option>
              ))}
            </select>
          </div>
        )}

        {frozenSubsCount > 0 && (
          <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-3.5 flex items-center gap-3">
            <Snowflake className="size-4 text-sky-500 shrink-0" />
            <p className="text-xs text-muted-foreground font-medium">
              Hay <span className="font-bold text-foreground">{frozenSubsCount}</span>{' '}
              {frozenSubsCount === 1
                ? 'suscripción congelada actualmente'
                : 'suscripciones congeladas actualmente'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="startDate" className="text-xs font-bold px-1">
              Inicio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="h-10 rounded-full px-4 bg-background dark:bg-input/30 border-border/10 focus-visible:ring-ring/30 focus-visible:border-ring"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="endDate" className="text-xs font-bold px-1">
              Fin <span className="text-destructive">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="h-10 rounded-full px-4 bg-background dark:bg-input/30 border-border/10 focus-visible:ring-ring/30 focus-visible:border-ring"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="reason" className="text-xs font-bold px-1">
            Motivo (opcional)
          </Label>
          <Textarea
            id="reason"
            placeholder="Viaje al exterior, razones médicas..."
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            rows={3}
            className="rounded-2xl px-4 py-3 bg-background dark:bg-input/30 border-border/10 focus-visible:ring-ring/30 focus-visible:border-ring"
          />
        </div>

        {selectedSub && calculatedEndDate && (
          <FreezeSummaryCard
            subscriptionName={selectedSub.package?.name || 'Suscripción'}
            currentEndDate={new Date(selectedSub.endDate)}
            calculatedEndDate={calculatedEndDate}
            freezeDays={freezeDays}
          />
        )}

        {activeSubs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              Este socio no tiene suscripciones activas para congelar.
            </p>
          </div>
        )}
      </div>

      <WizardFooter step={2} ready={ready} onBack={onBack} onNext={onNext} />
    </div>
  )
}

import { useState } from 'react'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Dumbbell, Ruler, Timer } from 'lucide-react'
import type { CreateEvaluationData } from '../server.ts'

interface EvaluationFormProps {
  memberId: string
  isPending: boolean
  onSubmit: (data: CreateEvaluationData) => void
  onCancel: () => void
}

const MEASUREMENT_FIELDS = [
  { key: 'weightKg', label: 'Peso (kg)', icon: null },
  { key: 'chestCm', label: 'Pecho (cm)', icon: null },
  { key: 'waistCm', label: 'Cintura (cm)', icon: null },
  { key: 'hipsCm', label: 'Cadera (cm)', icon: null },
  { key: 'leftArmCm', label: 'Brazo Izq. (cm)', icon: null },
  { key: 'rightArmCm', label: 'Brazo Der. (cm)', icon: null },
  { key: 'leftThighCm', label: 'Pierna Izq. (cm)', icon: null },
  { key: 'rightThighCm', label: 'Pierna Der. (cm)', icon: null },
] as const

const FITNESS_FIELDS = [
  { key: 'pushUps', label: 'Flexiones (rep)', icon: null },
  { key: 'sitUps', label: 'Abdominales (rep)', icon: null },
  { key: 'pullUps', label: 'Dominadas (rep)', icon: null },
  { key: 'runMinutes', label: '1.5km (min)', icon: null },
  { key: 'flexibilityCm', label: 'Flexibilidad (cm)', icon: null },
  { key: 'plankSeconds', label: 'Plancha (seg)', icon: null },
] as const

export function EvaluationForm({
  memberId,
  isPending,
  onSubmit,
  onCancel,
}: EvaluationFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: CreateEvaluationData = {
      memberId,
      ...Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== ''),
      ),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="size-4 text-primary" />
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Medidas Corporales
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MEASUREMENT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">
                {f.label}
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={values[f.key] ?? ''}
                onChange={(e) => setValue(f.key, e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="size-4 text-primary" />
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Tests Físicos
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FITNESS_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">
                {f.label}
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={values[f.key] ?? ''}
                onChange={(e) => setValue(f.key, e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-muted-foreground">
          Notas
        </label>
        <Textarea
          value={values.notes ?? ''}
          onChange={(e) => setValue('notes', e.target.value)}
          rows={3}
          className="rounded-xl"
          placeholder="Observaciones del trainer..."
        />
      </div>

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-border/10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-full text-xs"
        >
          Cancelar
        </Button>
        <LoadingButton
          type="submit"
          isLoading={isPending}
          className="rounded-full font-bold text-xs"
        >
          <Timer className="size-3" /> Guardar Evaluación
        </LoadingButton>
      </div>
    </form>
  )
}

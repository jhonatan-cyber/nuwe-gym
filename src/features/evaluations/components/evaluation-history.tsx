import { Trash2 } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { formatDate } from '#/shared/lib/formatters.ts'

interface EvaluationRow {
  id: string
  evaluationDate: string
  weightKg: string | null
  chestCm: string | null
  waistCm: string | null
  hipsCm: string | null
  leftArmCm: string | null
  rightArmCm: string | null
  leftThighCm: string | null
  rightThighCm: string | null
  pushUps: string | null
  sitUps: string | null
  pullUps: string | null
  runMinutes: string | null
  flexibilityCm: string | null
  plankSeconds: string | null
  notes: string | null
  evaluatedBy: { name: string | null } | null
}

interface EvaluationHistoryProps {
  evaluations: EvaluationRow[]
  isAdmin: boolean
  onDelete: (id: string) => void
}

function TrendCell({ values }: { values: (string | null)[] }) {
  const nums = values.map((v) => (v ? Number(v) : null)).filter((v) => v !== null) as number[]
  if (nums.length < 2) return null
  const diff = nums[0] - nums[1]
  if (diff === 0) return <span className="text-xs text-muted-foreground">→</span>
  return (
    <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
      {diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}
    </span>
  )
}

export function EvaluationHistory({
  evaluations,
  isAdmin,
  onDelete,
}: EvaluationHistoryProps) {
  if (evaluations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay evaluaciones registradas aún.
      </p>
    )
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {evaluations.map((ev, idx) => (
        <div
          key={ev.id}
          className="rounded-2xl border border-border/10 bg-background/50 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">
                {formatDate(new Date(ev.evaluationDate))}
              </span>
              {ev.evaluatedBy?.name && (
                <span className="text-[10px] text-muted-foreground">
                  por {ev.evaluatedBy.name}
                </span>
              )}
            </div>
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 rounded-full text-rose-400 hover:text-rose-300"
                onClick={() => onDelete(ev.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
            {([
              ['weightKg', 'Peso', 'kg'] as const,
              ['chestCm', 'Pecho', 'cm'],
              ['waistCm', 'Cintura', 'cm'],
              ['hipsCm', 'Cadera', 'cm'],
              ['leftArmCm', 'Brazo Izq.', 'cm'],
              ['rightArmCm', 'Brazo Der.', 'cm'],
              ['leftThighCm', 'Pierna Izq.', 'cm'],
              ['rightThighCm', 'Pierna Der.', 'cm'],
              ['pushUps', 'Flexiones', 'rep'],
              ['sitUps', 'Abdominales', 'rep'],
              ['pullUps', 'Dominadas', 'rep'],
              ['runMinutes', '1.5km', 'min'],
              ['flexibilityCm', 'Flexibilidad', 'cm'],
              ['plankSeconds', 'Plancha', 'seg'],
            ] as const).map(([key, label, unit]) => {
              const current = ev[key]
              if (!current) return null
              const prev = idx < evaluations.length - 1 ? evaluations[idx + 1][key] : null

              return (
                <div key={key} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {label}
                  </span>
                  <span className="text-xs font-bold tabular-nums">
                    {Number(current).toFixed(1)} {unit}
                    {prev && <TrendCell values={[current, prev]} />}
                  </span>
                </div>
              )
            })}
          </div>

          {ev.notes && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/5">
              {ev.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

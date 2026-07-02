import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star, TrendingUp, Plus, X, Trash2, User } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { createPerformance, getEmployeePerformances, deletePerformance } from '#/features/employees/performance-server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'

interface PerformanceSectionProps {
  employeeId: string
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muy bajo',
  2: 'Bajo',
  3: 'Aceptable',
  4: 'Bueno',
  5: 'Excelente',
}

const FIELDS = [
  { key: 'punctuality', label: 'Puntualidad' },
  { key: 'teamwork', label: 'Trabajo en equipo' },
  { key: 'productivity', label: 'Productividad' },
  { key: 'attitude', label: 'Actitud' },
  { key: 'communication', label: 'Comunicación' },
] as const

function RatingSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`p-1 rounded-full transition-colors ${
            n <= value ? 'text-amber-400' : 'text-muted-foreground/30'
          }`}
        >
          <Star className="size-4 fill-current" />
        </button>
      ))}
    </div>
  )
}

export function PerformanceSection({ employeeId }: PerformanceSectionProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    rating: 3,
    punctuality: 3,
    teamwork: 3,
    productivity: 3,
    attitude: 3,
    communication: 3,
    strengths: '',
    improvements: '',
    comments: '',
    recommendation: '',
  })

  const { data: evaluations = [] } = useQuery({
    queryKey: ['employee-performances', employeeId],
    queryFn: () => getEmployeePerformances({ data: { employeeId } }),
  })

  const createMutation = useMutation({
    mutationFn: createPerformance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-performances', employeeId] })
      toast.success('Evaluación registrada')
      setShowForm(false)
      setForm({ rating: 3, punctuality: 3, teamwork: 3, productivity: 3, attitude: 3, communication: 3, strengths: '', improvements: '', comments: '', recommendation: '' })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePerformance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-performances', employeeId] })
      toast.success('Evaluación eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const avgRating = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.rating!, 0) / evaluations.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <h4 className="font-semibold text-sm">Evaluaciones de Desempeño</h4>
          {evaluations.length > 0 && (
            <span className="text-xs text-muted-foreground">
              (Prom. {avgRating}/5)
            </span>
          )}
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="text-xs h-7">
            <Plus className="size-3 mr-1" /> Nueva
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-xl border border-border/10 bg-background/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva Evaluación</h5>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-6 text-xs">
              <X className="size-3 mr-1" /> Cancelar
            </Button>
          </div>

          <div className="space-y-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs font-medium">{label}</span>
                <RatingSelect
                  value={form[key as keyof typeof form] as number}
                  onChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border/5">
              <span className="text-xs font-bold">Rating General</span>
              <RatingSelect
                value={form.rating}
                onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Fortalezas</label>
            <Textarea value={form.strengths} onChange={(e) => setForm((p) => ({ ...p, strengths: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="¿Qué hace bien el empleado?" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Áreas de mejora</label>
            <Textarea value={form.improvements} onChange={(e) => setForm((p) => ({ ...p, improvements: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="¿Qué puede mejorar?" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Comentarios</label>
            <Textarea value={form.comments} onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="Comentarios adicionales..." />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Recomendación</label>
            <Textarea value={form.recommendation} onChange={(e) => setForm((p) => ({ ...p, recommendation: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="Recomendación del evaluador..." />
          </div>

          <LoadingButton
            onClick={() => createMutation.mutate({ data: { ...form, employeeId } })}
            isLoading={createMutation.isPending}
            className="w-full text-xs rounded-full"
          >
            Guardar Evaluación
          </LoadingButton>
        </div>
      ) : evaluations.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No hay evaluaciones registradas.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {evaluations.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-border/10 bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold">{formatDate(new Date(ev.evaluationDate))}</span>
                  {ev.evaluatedBy?.name && (
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <User className="size-2.5" />{ev.evaluatedBy.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{ev.rating}/5</span>
                  <RatingSelect value={ev.rating!} onChange={() => {}} />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {FIELDS.map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <p className="text-[8px] text-muted-foreground uppercase">{label.slice(0, 4)}</p>
                    <p className="text-xs font-bold">{ev[key as keyof typeof ev] ?? '-'}</p>
                  </div>
                ))}
              </div>

              {ev.strengths && <p className="text-[10px]"><span className="font-semibold">Fortalezas:</span> {ev.strengths}</p>}
              {ev.improvements && <p className="text-[10px]"><span className="font-semibold">Mejora:</span> {ev.improvements}</p>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate({ data: { id: ev.id } })}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

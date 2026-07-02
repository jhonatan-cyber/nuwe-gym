import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Salad, Plus, Trash2, Weight, Brain, ChevronRight, TrendingUp,
  Activity, Target, Utensils, Scale,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  getWeightHistory, addWeightEntry, deleteWeightEntry,
  getNutritionPlans, createNutritionPlan, deleteNutritionPlan, generateAINutritionPlan,
} from './server.ts'
import { getMembers } from '#/features/members/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '#/shared/components/ui/dialog'
import { formatDate } from '#/shared/lib/formatters.ts'
import { WeightChart } from './components/weight-chart.tsx'
import { ImcBadge } from './components/imc-badge.tsx'

type Tab = 'members' | 'weight' | 'plans'

interface NutritionPageProps { userRole: string }

export function NutritionPage({ userRole: _userRole }: NutritionPageProps) {
  const { branchId } = useCurrentBranch()
  const [tab, setTab] = useState<Tab>('members')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['members', branchId, memberSearch],
    queryFn: () => getMembers({ data: { branchId, search: memberSearch || undefined } }),
  })

  const selectedMember = members.find((m) => m.id === selectedMemberId)

  function handleSelectMember(id: string) {
    setSelectedMemberId(id)
    setTab('weight')
  }

  const navBtn = (id: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(id)}
      disabled={!selectedMemberId && id !== 'members'}
      className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200 border ${
        tab === id
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${tab === id ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'}`}>
        {icon}
      </div>
      <p className="text-xs font-bold">{label}</p>
    </button>
  )

  return (
    <ModuleLayout
      breadcrumb={
        <>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="size-3 mx-1 inline" />
          <span className="text-foreground/60 dark:text-white/60">Nutrición</span>
        </>
      }
      title={selectedMember ? `Nutrición — ${selectedMember.fullName}` : 'Nutrición'}
      leftPanel={
        <div className="flex flex-col gap-4 w-full">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Sección</p>
          <div className="flex flex-col gap-1.5">
            {navBtn('members', 'Socios', <Users2Icon />)}
            {navBtn('weight', 'Historial de Peso', <Weight className="size-4" />)}
            {navBtn('plans', 'Plan Nutricional', <Utensils className="size-4" />)}
          </div>
          {selectedMember && (
            <div className="mt-2 p-3.5 rounded-2xl bg-muted border border-border/10">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Socio seleccionado</p>
              <p className="text-xs font-bold truncate">{selectedMember.fullName}</p>
              <button onClick={() => { setSelectedMemberId(null); setTab('members') }}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors mt-1">
                Cambiar socio
              </button>
            </div>
          )}
        </div>
      }
    >
      {tab === 'members' && (
        <MembersTab
          members={members}
          loading={loadingMembers}
          search={memberSearch}
          onSearch={setMemberSearch}
          onSelect={handleSelectMember}
          selectedId={selectedMemberId}
        />
      )}
      {tab === 'weight' && selectedMemberId && (
        <WeightTab memberId={selectedMemberId} />
      )}
      {tab === 'plans' && selectedMemberId && selectedMember && (
        <PlansTab member={selectedMember} />
      )}
    </ModuleLayout>
  )
}

function Users2Icon() {
  return <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 0 0-3-3.87"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

// ── MembersTab ────────────────────────────────────────────────────

function MembersTab({ members, loading, search, onSearch, onSelect, selectedId }: {
  members: any[]; loading: boolean; search: string
  onSearch: (s: string) => void; onSelect: (id: string) => void; selectedId: string | null
}) {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar socio..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="rounded-2xl"
      />
      {loading ? (
        <LoadingSpinner size="md" label="Cargando socios..." />
      ) : members.length === 0 ? (
        <EmptyState icon={Salad} title="Sin socios" description="No se encontraron socios." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`text-left p-4 rounded-2xl border transition-all hover:shadow-md ${
                selectedId === m.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-border/10 bg-card hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={m.fullName} className="size-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {m.fullName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{m.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.documentNumber || 'Sin documento'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── WeightTab ─────────────────────────────────────────────────────

function WeightTab({ memberId }: { memberId: string }) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ weightKg: '', heightCm: '', bodyFatPercent: '', muscleMassKg: '', notes: '', photoUrl: '' })

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['weight-history', memberId],
    queryFn: () => getWeightHistory({ data: { memberId } }),
    enabled: !!memberId,
  })

  const addMutation = useMutation({
    mutationFn: addWeightEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history', memberId] })
      toast.success('Registro de peso guardado')
      setDialogOpen(false)
      setForm({ weightKg: '', heightCm: '', bodyFatPercent: '', muscleMassKg: '', notes: '', photoUrl: '' })
    },
    onError: () => toast.error('Error al guardar registro'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWeightEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history', memberId] })
      toast.success('Registro eliminado')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const latestEntry = entries[0]
  const latestImc = latestEntry && latestEntry.heightCm
    ? Number(latestEntry.weightKg) / Math.pow(Number(latestEntry.heightCm) / 100, 2)
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.weightKg) return
    addMutation.mutate({ data: {
      memberId,
      weightKg: Number(form.weightKg),
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      bodyFatPercent: form.bodyFatPercent ? Number(form.bodyFatPercent) : undefined,
      muscleMassKg: form.muscleMassKg ? Number(form.muscleMassKg) : undefined,
      notes: form.notes || undefined,
      photoUrl: form.photoUrl || undefined,
    }})
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Historial de Peso</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="rounded-full gap-1.5">
          <Plus className="size-4" /> Nuevo registro
        </Button>
      </div>

      {/* Métricas actuales */}
      {latestEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Peso actual" value={`${Number(latestEntry.weightKg).toFixed(1)} kg`} icon={<Scale className="size-4" />} color="emerald" />
          {latestImc && <MetricCard label="IMC" value={latestImc.toFixed(1)} sub={<ImcBadge imc={latestImc} />} icon={<Activity className="size-4" />} color="blue" />}
          {latestEntry.bodyFatPercent && <MetricCard label="% Grasa" value={`${Number(latestEntry.bodyFatPercent).toFixed(1)}%`} icon={<TrendingUp className="size-4" />} color="orange" />}
          {latestEntry.muscleMassKg && <MetricCard label="Masa muscular" value={`${Number(latestEntry.muscleMassKg).toFixed(1)} kg`} icon={<Activity className="size-4" />} color="purple" />}
        </div>
      )}

      {/* Gráfico */}
      {entries.length > 1 && <WeightChart entries={entries} />}

      {/* Tabla */}
      {isLoading ? (
        <LoadingSpinner size="md" label="Cargando historial..." />
      ) : entries.length === 0 ? (
        <EmptyState icon={Weight} title="Sin registros" description="Registrá el primer peso del socio." />
      ) : (
        <div className="bg-card rounded-3xl border border-border/10 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/10">
              {['Fecha','Foto','Peso','Altura','% Grasa','Masa Musc.','Notas',''].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id} className="border-b border-border/5 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(e.recordedAt)}</td>
                  <td className="py-3 px-4">
                    {e.photoUrl ? (
                      <img src={e.photoUrl} alt="Progreso" className="size-10 rounded-xl object-cover border border-border/10" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold">{Number(e.weightKg).toFixed(1)} kg</td>
                  <td className="py-3 px-4 text-xs">{e.heightCm ? `${e.heightCm} cm` : '—'}</td>
                  <td className="py-3 px-4 text-xs">{e.bodyFatPercent ? `${Number(e.bodyFatPercent).toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-4 text-xs">{e.muscleMassKg ? `${Number(e.muscleMassKg).toFixed(1)} kg` : '—'}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground max-w-[160px] truncate">{e.notes || '—'}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => deleteMutation.mutate({ data: { id: e.id } })}
                      className="text-destructive hover:opacity-70 transition-opacity">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog nuevo registro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-black">Nuevo Registro de Peso</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">Peso (kg) *</label>
                <Input type="number" step="0.1" min="1" placeholder="70.5" required
                  value={form.weightKg} onChange={(e) => setForm(p => ({...p, weightKg: e.target.value}))} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Altura (cm)</label>
                <Input type="number" step="0.5" min="50" placeholder="170"
                  value={form.heightCm} onChange={(e) => setForm(p => ({...p, heightCm: e.target.value}))} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">% Grasa corporal</label>
                <Input type="number" step="0.1" min="0" max="100" placeholder="18.5"
                  value={form.bodyFatPercent} onChange={(e) => setForm(p => ({...p, bodyFatPercent: e.target.value}))} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Masa muscular (kg)</label>
                <Input type="number" step="0.1" min="0" placeholder="35"
                  value={form.muscleMassKg} onChange={(e) => setForm(p => ({...p, muscleMassKg: e.target.value}))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Notas</label>
              <Input placeholder="Observaciones del registro..."
                value={form.notes} onChange={(e) => setForm(p => ({...p, notes: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Foto de progreso</label>
              <div className="flex items-center gap-3">
                {form.photoUrl ? (
                  <div className="relative">
                    <img src={form.photoUrl} alt="Preview" className="size-16 rounded-xl object-cover border border-border/10" />
                    <button type="button" onClick={() => setForm(p => ({...p, photoUrl: ''}))}
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] font-bold shadow-md">
                      ×
                    </button>
                  </div>
                ) : null}
                <Input type="file" accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      if (typeof ev.target?.result === 'string') {
                        setForm(p => ({...p, photoUrl: ev.target!.result as string}))
                      }
                    }
                    reader.readAsDataURL(file)
                  }}
                  className="rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">Cancelar</Button>
              <LoadingButton type="submit" isLoading={addMutation.isPending} className="rounded-full font-bold">Guardar</LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: React.ReactNode; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400',
  }
  return (
    <div className="bg-card rounded-2xl border border-border/10 p-4 flex items-center gap-3">
      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-lg font-black">{value}</p>
        {sub}
      </div>
    </div>
  )
}

// ── PlansTab ──────────────────────────────────────────────────────

function PlansTab({ member }: { member: any }) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiResult, setAiResult] = useState<{ content: string; imc: number; imcStatus: string } | null>(null)
  const [aiForm, setAiForm] = useState({
    goal: 'Pérdida de peso', restrictions: '', mealsPerDay: '4', budget: '',
  })

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['nutrition-plans', member.id],
    queryFn: () => getNutritionPlans({ data: { memberId: member.id } }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNutritionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-plans', member.id] })
      toast.success('Plan eliminado')
    },
    onError: () => toast.error('Error al eliminar plan'),
  })

  const createMutation = useMutation({
    mutationFn: createNutritionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-plans', member.id] })
      toast.success('Plan guardado')
      setDialogOpen(false)
      setAiResult(null)
    },
    onError: () => toast.error('Error al guardar plan'),
  })

  const [generating, setGenerating] = useState(false)

  async function handleGenerateAI() {
    if (!member.birthDate || !member.gender) {
      toast.error('El socio necesita fecha de nacimiento y género para generar un plan con IA')
      return
    }
    const age = new Date().getFullYear() - new Date(member.birthDate).getFullYear()
    setGenerating(true)
    try {
      const result = await generateAINutritionPlan({
        data: {
          memberId: member.id,
          memberName: member.fullName,
          age,
          gender: member.gender,
          weightKg: 70, // placeholder - ideally from latest weight entry
          heightCm: 170,
          goal: aiForm.goal,
          restrictions: aiForm.restrictions || undefined,
          mealsPerDay: Number(aiForm.mealsPerDay),
          budget: aiForm.budget || undefined,
        },
      })
      setAiResult(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar plan')
    } finally {
      setGenerating(false)
    }
  }

  function handleSaveAiPlan() {
    if (!aiResult) return
    createMutation.mutate({ data: {
      memberId: member.id,
      title: `Plan IA — ${aiForm.goal}`,
      goal: aiForm.goal,
      planContent: aiResult.content,
      isAiGenerated: true,
    }})
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Planes Nutricionales</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(true)} className="rounded-full gap-1.5">
            <Brain className="size-4" /> Generar con IA
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-full gap-1.5">
            <Plus className="size-4" /> Nuevo plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="md" label="Cargando planes..." />
      ) : plans.length === 0 ? (
        <EmptyState icon={Utensils} title="Sin planes" description="Creá el primer plan nutricional para este socio." />
      ) : (
        <div className="space-y-4">
          {plans.map((plan: any) => (
            <div key={plan.id} className={`bg-card rounded-3xl border p-5 space-y-3 ${plan.isActive ? 'border-emerald-300 dark:border-emerald-700' : 'border-border/10'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm">{plan.title}</h3>
                  {plan.isActive && <Badge className="bg-emerald-500 text-white text-[10px]">Activo</Badge>}
                  {plan.isAiGenerated && <Badge variant="outline" className="text-[10px] gap-1"><Brain className="size-2.5" />IA</Badge>}
                </div>
                <button onClick={() => deleteMutation.mutate({ data: { id: plan.id } })}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="size-4" />
                </button>
              </div>
              {(plan.targetCalories || plan.proteinGrams || plan.carbsGrams || plan.fatGrams) && (
                <div className="flex flex-wrap gap-3 text-xs">
                  {plan.targetCalories && <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">{plan.targetCalories} kcal/día</span>}
                  {plan.proteinGrams && <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">P: {Number(plan.proteinGrams).toFixed(0)}g</span>}
                  {plan.carbsGrams && <span className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold">C: {Number(plan.carbsGrams).toFixed(0)}g</span>}
                  {plan.fatGrams && <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">G: {Number(plan.fatGrams).toFixed(0)}g</span>}
                </div>
              )}
              {plan.planContent && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-xl p-3 max-h-40 overflow-y-auto">
                  {plan.planContent}
                </pre>
              )}
              <p className="text-[10px] text-muted-foreground">Creado el {formatDate(plan.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dialog plan manual */}
      <ManualPlanDialog open={dialogOpen} onOpenChange={setDialogOpen} memberId={member.id} onSave={createMutation} />

      {/* Dialog IA */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black flex items-center gap-2"><Brain className="size-5 text-purple-500" />Generar Plan con IA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">Objetivo</label>
                <select value={aiForm.goal} onChange={(e) => setAiForm(p => ({...p, goal: e.target.value}))}
                  className="w-full h-10 px-3 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Pérdida de peso</option>
                  <option>Ganancia muscular</option>
                  <option>Mantenimiento</option>
                  <option>Rendimiento deportivo</option>
                  <option>Salud general</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Comidas por día</label>
                <Input type="number" min="1" max="8" value={aiForm.mealsPerDay}
                  onChange={(e) => setAiForm(p => ({...p, mealsPerDay: e.target.value}))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Restricciones / Alergias</label>
              <Input placeholder="Ej: intolerante a la lactosa, vegetariano..."
                value={aiForm.restrictions} onChange={(e) => setAiForm(p => ({...p, restrictions: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Presupuesto semanal (opcional)</label>
              <Input placeholder="Ej: bajo, $500, económico..."
                value={aiForm.budget} onChange={(e) => setAiForm(p => ({...p, budget: e.target.value}))} className="rounded-xl" />
            </div>
            {aiResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500 text-white">IMC: {aiResult.imc}</Badge>
                  <Badge variant="outline">{aiResult.imcStatus}</Badge>
                </div>
                <pre className="text-xs whitespace-pre-wrap bg-muted/40 rounded-xl p-4 max-h-64 overflow-y-auto border border-border/10">
                  {aiResult.content}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAiDialogOpen(false); setAiResult(null) }} className="rounded-full">Cerrar</Button>
            {!aiResult ? (
              <LoadingButton isLoading={generating} onClick={handleGenerateAI} className="rounded-full font-bold gap-1.5">
                <Brain className="size-4" /> Generar
              </LoadingButton>
            ) : (
              <LoadingButton isLoading={createMutation.isPending} onClick={handleSaveAiPlan} className="rounded-full font-bold gap-1.5">
                <Target className="size-4" /> Guardar plan
              </LoadingButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ManualPlanDialog({ open, onOpenChange, memberId, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; memberId: string; onSave: any
}) {
  const [form, setForm] = useState({
    title: '', goal: '', targetCalories: '', proteinGrams: '', carbsGrams: '',
    fatGrams: '', mealsPerDay: '4', planContent: '',
  })
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave.mutate({ data: {
      memberId,
      title: form.title,
      goal: form.goal || undefined,
      targetCalories: form.targetCalories ? Number(form.targetCalories) : undefined,
      proteinGrams: form.proteinGrams ? Number(form.proteinGrams) : undefined,
      carbsGrams: form.carbsGrams ? Number(form.carbsGrams) : undefined,
      fatGrams: form.fatGrams ? Number(form.fatGrams) : undefined,
      mealsPerDay: Number(form.mealsPerDay),
      planContent: form.planContent || undefined,
      isAiGenerated: false,
    }})
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader><DialogTitle className="font-black">Nuevo Plan Nutricional</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold">Título *</label>
            <Input required placeholder="Ej: Plan de definición — Julio 2026"
              value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold">Objetivo</label>
              <Input placeholder="Pérdida de peso" value={form.goal}
                onChange={(e) => setForm(p => ({...p, goal: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Calorías/día</label>
              <Input type="number" min="0" placeholder="2000" value={form.targetCalories}
                onChange={(e) => setForm(p => ({...p, targetCalories: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Proteínas (g)</label>
              <Input type="number" min="0" placeholder="150" value={form.proteinGrams}
                onChange={(e) => setForm(p => ({...p, proteinGrams: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Carbohidratos (g)</label>
              <Input type="number" min="0" placeholder="200" value={form.carbsGrams}
                onChange={(e) => setForm(p => ({...p, carbsGrams: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Grasas (g)</label>
              <Input type="number" min="0" placeholder="60" value={form.fatGrams}
                onChange={(e) => setForm(p => ({...p, fatGrams: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Comidas/día</label>
              <Input type="number" min="1" max="10" value={form.mealsPerDay}
                onChange={(e) => setForm(p => ({...p, mealsPerDay: e.target.value}))} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold">Contenido del plan</label>
            <Textarea rows={5} placeholder="Detallá las comidas, horarios y porciones..."
              value={form.planContent} onChange={(e) => setForm(p => ({...p, planContent: e.target.value}))} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancelar</Button>
            <LoadingButton type="submit" isLoading={onSave.isPending} className="rounded-full font-bold">Guardar</LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

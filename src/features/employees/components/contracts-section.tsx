import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Plus, X, Trash2, Calendar, DollarSign, Clock } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { NumericInput } from '#/shared/components/ui/numeric-input'
import { Textarea } from '#/shared/components/ui/textarea'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Badge } from '#/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { createContract, getEmployeeContracts, deleteContract } from '#/features/employees/contracts-server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'

interface ContractsSectionProps {
  employeeId: string
}

const CONTRACT_TYPES: Record<string, string> = {
  INDEFINITE: 'Indefinido',
  FIXED_TERM: 'Plazo fijo',
  TEMPORARY: 'Temporal',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Pasantía',
}

const CONTRACT_COLORS: Record<string, string> = {
  INDEFINITE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  FIXED_TERM: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  TEMPORARY: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  FREELANCE: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  INTERNSHIP: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
}

export function ContractsSection({ employeeId }: ContractsSectionProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    contractType: 'INDEFINITE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    position: '',
    salary: '0',
    workingHours: '',
    benefits: '',
    terms: '',
    notes: '',
  })

  const { data: contracts = [] } = useQuery({
    queryKey: ['employee-contracts', employeeId],
    queryFn: () => getEmployeeContracts({ data: { employeeId } }),
  })

  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts', employeeId] })
      toast.success('Contrato registrado')
      setShowForm(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts', employeeId] })
      toast.success('Contrato eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h4 className="font-semibold text-sm">Contratos</h4>
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="text-xs h-7">
            <Plus className="size-3 mr-1" /> Nuevo
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-xl border border-border/10 bg-background/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nuevo Contrato</h5>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-6 text-xs">
              <X className="size-3 mr-1" /> Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo</label>
              <Select value={form.contractType} onValueChange={(v) => setForm((p) => ({ ...p, contractType: v }))}>
                <SelectTrigger className="rounded-xl h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Cargo</label>
              <Input value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} placeholder="Cargo" className="rounded-xl h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Inicio</label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="rounded-xl h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Fin (opcional)</label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="rounded-xl h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Salario</label>
              <NumericInput value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} className="rounded-xl h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Horario laboral</label>
              <Input value={form.workingHours} onChange={(e) => setForm((p) => ({ ...p, workingHours: e.target.value }))} placeholder="Ej: Lun-Vie 9-18" className="rounded-xl h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Beneficios</label>
            <Textarea value={form.benefits} onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="Obra social, bonos, etc." />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Términos y condiciones</label>
            <Textarea value={form.terms} onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="Cláusulas del contrato..." />
          </div>

          <LoadingButton
            onClick={() => createMutation.mutate({ data: { ...form, employeeId } })}
            isLoading={createMutation.isPending}
            className="w-full text-xs rounded-full"
          >
            Registrar Contrato
          </LoadingButton>
        </div>
      ) : contracts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No hay contratos registrados.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {contracts.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/10 bg-background/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className={`text-[9px] font-bold uppercase ${CONTRACT_COLORS[c.contractType] ?? ''}`}>
                  {CONTRACT_TYPES[c.contractType] ?? c.contractType}
                </Badge>
                <div className="flex items-center gap-1">
                  {c.isActive && <span className="text-[9px] font-bold text-emerald-500">● Activo</span>}
                  <button onClick={() => deleteMutation.mutate({ data: { id: c.id } })} className="p-1 rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-semibold">{c.position}</p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="size-3" />{formatDate(new Date(c.startDate))}{c.endDate ? ` - ${formatDate(new Date(c.endDate))}` : ''}</span>
                {c.salary && Number(c.salary) > 0 && <span className="flex items-center gap-1"><DollarSign className="size-3" />${Number(c.salary).toLocaleString()}</span>}
                {c.workingHours && <span className="flex items-center gap-1"><Clock className="size-3" />{c.workingHours}</span>}
              </div>
              {c.benefits && <p className="text-[10px] text-muted-foreground mt-1"><span className="font-semibold">Beneficios:</span> {c.benefits}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

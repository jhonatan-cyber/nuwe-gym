import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardList, Plus, X } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'
import { EvaluationForm } from './evaluation-form.tsx'
import { EvaluationHistory } from './evaluation-history.tsx'
import {
  createEvaluation,
  getMemberEvaluations,
  deleteEvaluation,
} from '../server.ts'
import type { CreateEvaluationData } from '../server.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'

interface EvaluationsSectionProps {
  memberId: string
}

export function EvaluationsSection({ memberId }: EvaluationsSectionProps) {
  const { session } = authedRoute.useRouteContext()
  const userRole = session.user.role
  const isAdmin = userRole === 'ADMIN'
  const canEvaluate = userRole === 'ADMIN' || userRole === 'TRAINER'
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['member-evaluations', memberId],
    queryFn: () => getMemberEvaluations({ data: memberId }),
    enabled: !!memberId,
  })

  const createMutation = useMutation({
    mutationFn: createEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-evaluations', memberId] })
      toast.success('Evaluación registrada con éxito')
      setShowForm(false)
    },
    onError: () => toast.error('Error al registrar la evaluación'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-evaluations', memberId] })
      toast.success('Evaluación eliminada')
    },
    onError: () => toast.error('Error al eliminar la evaluación'),
  })

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="size-3.5 text-primary" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Evaluaciones Físicas
          </h4>
        </div>
        {canEvaluate && !showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-full text-[10px] gap-1 font-bold"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-3" /> Nueva
          </Button>
        )}
        {showForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-full text-[10px]"
            onClick={() => setShowForm(false)}
          >
            <X className="size-3" /> Cancelar
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-2xl border border-border/10 bg-background/50 p-4">
          <EvaluationForm
            memberId={memberId}
            isPending={createMutation.isPending}
            onSubmit={(data: CreateEvaluationData) =>
              createMutation.mutate({ data })
            }
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-4">
          Cargando evaluaciones...
        </div>
      ) : (
        <EvaluationHistory
          evaluations={evaluations as any}
          isAdmin={isAdmin}
          onDelete={(id) => deleteMutation.mutate({ data: id })}
        />
      )}
    </section>
  )
}

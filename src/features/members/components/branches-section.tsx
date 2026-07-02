import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Loader2, Check, Store } from 'lucide-react'
import { toast } from 'sonner'
import { getBranches } from '#/features/branches/server.ts'
import { getMemberBranches, setMemberBranches } from '#/features/members/branch-access-server.ts'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { cn } from '#/shared/lib/utils.ts'

interface BranchesSectionProps {
  memberId: string
}

export function BranchesSection({ memberId }: BranchesSectionProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches(),
  })

  const { data: memberBranchesData = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['member-branches', memberId],
    queryFn: () => getMemberBranches({ data: { memberId } }),
    enabled: !!memberId,
  })

  const assignedBranchIds = new Set(memberBranchesData.map((mb: any) => mb.branch.id))

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const startEditing = () => {
    setSelected(new Set(memberBranchesData.map((mb: any) => mb.branch.id)))
    setEditing(true)
  }

  const toggleBranch = (branchId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(branchId)) {
        next.delete(branchId)
      } else {
        next.add(branchId)
      }
      return next
    })
  }

  const saveMutation = useMutation({
    mutationFn: setMemberBranches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-branches', memberId] })
      setEditing(false)
      toast.success('Accesos a sucursales actualizados')
    },
    onError: () => toast.error('Error al actualizar accesos'),
  })

  const handleSave = () => {
    saveMutation.mutate({
      data: {
        memberId,
        branchIds: Array.from(selected),
      },
    })
  }

  if (loadingBranches) {
    return (
      <section>
        <SectionTitle />
        <div className="mt-3 py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span className="text-xs">Cargando accesos...</span>
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionTitle />
      <div className="mt-3 space-y-2">
        {editing ? (
          <>
            <div className="flex flex-wrap gap-2">
              {allBranches.map((branch) => {
                const isSelected = selected.has(branch.id)
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => toggleBranch(branch.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Store className="size-3" />
                    {branch.name}
                    {isSelected && <Check className="size-3" />}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="text-[10px] h-7"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-7"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            {memberBranchesData.length === 0 ? (
              <div className="flex items-center gap-4 justify-between py-2">
                <p className="text-[11px] text-muted-foreground">
                  Sin sucursales adicionales asignadas.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 gap-1"
                  onClick={startEditing}
                >
                  <Plus className="size-3" />
                  Asignar sucursales
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {memberBranchesData.map((mb: any) => (
                  <Badge
                    key={mb.id}
                    variant="outline"
                    className="flex items-center gap-1 py-1 px-2.5 text-[10px] font-semibold"
                  >
                    <Building2 className="size-3" />
                    {mb.branch.name}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={startEditing}
                >
                  Editar
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function SectionTitle() {
  return (
    <div className="flex items-center gap-1.5">
      <Building2 className="size-3.5 text-primary" />
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Acceso a sucursales
      </h4>
    </div>
  )
}

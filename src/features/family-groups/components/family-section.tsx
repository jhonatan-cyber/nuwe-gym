import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  UserPlus,
  UserMinus,
  Percent,
} from 'lucide-react'
import {
  getFamilyGroupByMember,
  addFamilyMember,
  removeFamilyMember,
  createFamilyGroup,
} from '#/features/family-groups/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { toast } from 'sonner'
import { cn } from '#/shared/lib/utils.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'

const RELATIONSHIP_OPTIONS = [
  { value: 'Conyuge', label: 'Cónyuge' },
  { value: 'Hijo', label: 'Hijo/a' },
  { value: 'Padre', label: 'Padre/Madre' },
  { value: 'Hermano', label: 'Hermano/a' },
  { value: 'Otro', label: 'Otro familiar' },
]

export function FamilySection({ memberId }: { memberId: string }) {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [relationship, setRelationship] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [discountPercent, setDiscountPercent] = useState('10')

  const { data: familyInfo, isLoading } = useQuery({
    queryKey: ['family-group-by-member', memberId],
    queryFn: () => getFamilyGroupByMember({ data: { memberId } }),
    enabled: !!memberId,
  })

  const { data: membersList } = useQuery({
    queryKey: ['members-for-family', branchId],
    queryFn: () => getMembers({ data: { search: '', branchId: branchId ?? undefined } }),
    enabled: showAddMember,
  })

  const createMutation = useMutation({
    mutationFn: createFamilyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-group-by-member', memberId] })
      setShowCreateGroup(false)
      toast.success('Grupo familiar creado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addMemberMutation = useMutation({
    mutationFn: addFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-group-by-member', memberId] })
      setShowAddMember(false)
      setSelectedMemberId('')
      setRelationship('')
      toast.success('Miembro agregado al grupo familiar')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removeMutation = useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-group-by-member', memberId] })
      toast.success('Miembro eliminado del grupo')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return null

  const availableMembers = membersList?.filter((m: any) =>
    m.id !== memberId &&
    !familyInfo?.group?.familyMembers?.some((fm: any) => fm.memberId === m.id) &&
    m.id !== familyInfo?.group?.primaryMember?.id,
  ) ?? []

  return (
    <section>
      <div className="flex items-center gap-1.5 mb-3">
        <Users className="size-3.5 text-primary" />
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Grupo Familiar
        </h4>
      </div>

      {!familyInfo ? (
        <div className="p-4 rounded-2xl border dark:border-white/[0.04] border-black/[0.04] bg-foreground/[0.015]">
          {showCreateGroup ? (
            <div className="space-y-3">
              <p className="text-xs font-bold">Crear grupo familiar</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-[10px]">Dto. %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="rounded-xl h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" className="rounded-xl text-xs"
                  onClick={() => setShowCreateGroup(false)}>
                  Cancelar
                </Button>
                <LoadingButton size="xs" className="rounded-xl text-xs gap-1"
                  isLoading={createMutation.isPending}
                  onClick={() => createMutation.mutate({
                    data: {
                      primaryMemberId: memberId,
                      discountPercent: Number(discountPercent),
                    },
                  })}>
                  <Plus className="size-3" /> Crear grupo
                </LoadingButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-2">
                Este socio no pertenece a ningún grupo familiar
              </p>
              <Button variant="outline" size="xs" className="rounded-xl text-xs gap-1"
                onClick={() => setShowCreateGroup(true)}>
                <Users className="size-3" /> Crear grupo familiar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl border dark:border-white/[0.04] border-black/[0.04] bg-foreground/[0.015] space-y-3">
          {/* Group header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px] font-bold px-2.5">
                <Percent className="size-2.5 mr-1" />
                {familyInfo.group.discountPercent}% dto.
              </Badge>
              <Badge className={cn(
                'text-[10px] font-bold',
                familyInfo.group.isActive
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
              )}>
                {familyInfo.group.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {familyInfo.role === 'primary' && (
              <Button variant="outline" size="xs" className="rounded-xl text-xs gap-1"
                onClick={() => setShowAddMember(!showAddMember)}>
                <UserPlus className="size-3" /> Agregar
              </Button>
            )}
          </div>

          {/* Primary member */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <div className="size-6 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-600 shrink-0">
              {familyInfo.group.primaryMember.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">
                {familyInfo.group.primaryMember.fullName}
                <span className="text-[9px] text-amber-600 ml-1.5 font-semibold">(Titular)</span>
              </p>
            </div>
          </div>

          {/* Family members */}
          {familyInfo.group.familyMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Miembros ({familyInfo.group.familyMembers.length})
              </p>
              {familyInfo.group.familyMembers.map((fm: any) => (
                <div key={fm.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-6 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                      {fm.member.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{fm.member.fullName}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {fm.relationship ?? 'Familiar'} · CI: {fm.member.documentNumber ?? '—'}
                      </p>
                    </div>
                  </div>
                  {familyInfo.role === 'primary' && (
                    <button
                      onClick={() => removeMutation.mutate({ data: { id: fm.id } })}
                      className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 ml-2"
                    >
                      <UserMinus className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add member form */}
          {showAddMember && familyInfo.role === 'primary' && (
            <div className="pt-2 border-t border-dashed dark:border-white/[0.06] border-black/[0.06] space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground">Agregar miembro</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px]">Socio</Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No hay socios disponibles
                        </SelectItem>
                      ) : (
                        availableMembers.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.fullName} ({m.documentNumber || '—'})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px]">Parentesco</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue placeholder="Parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button variant="ghost" size="xs" className="rounded-xl text-xs"
                  onClick={() => setShowAddMember(false)}>
                  Cancelar
                </Button>
                <LoadingButton size="xs" className="rounded-xl text-xs gap-1"
                  disabled={!selectedMemberId}
                  isLoading={addMemberMutation.isPending}
                  onClick={() => {
                    if (!selectedMemberId) return
                    addMemberMutation.mutate({
                      data: {
                        familyGroupId: familyInfo.group.id,
                        memberId: selectedMemberId,
                        relationship: relationship || undefined,
                      },
                    })
                  }}>
                  <UserPlus className="size-3" /> Agregar
                </LoadingButton>
              </div>
            </div>
          )}

          {familyInfo.role === 'member' && familyInfo.relationship && (
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Parentesco: <span className="font-bold text-foreground">{familyInfo.relationship}</span>
            </p>
          )}
        </div>
      )}
    </section>
  )
}

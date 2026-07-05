import { useState, useEffect, lazy, Suspense } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  ChevronRight,
  Edit2,
  Eye,
  List,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Package,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import {
  getMembers,
  deleteMember,
  toggleMemberStatus,
} from '#/features/members/server.ts'
import { useDebounce } from '#/shared/hooks/use-debounce.ts'
import { usePersistedState } from '#/shared/hooks/use-persisted-state.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import {
  isExpired,
  isExpiringThisWeek,
  getActiveSubscription,
  isSubscriptionActive,
} from '#/shared/lib/subscription-utils.ts'
import { Button } from '#/shared/components/ui/button'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { DataTable } from '#/shared/components/data-table'
import { Badge } from '#/shared/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'

import { cn } from '#/shared/lib/utils.ts'
import { MemberEnrollmentWizard } from '#/features/members/components/member-enrollment-wizard.tsx'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { MemberAvatar } from '#/shared/components/ui/member-avatar'
import type {
  MemberWithSubscriptions,
  StatusFilter,
} from '#/features/members/types.ts'

// ── Lazy-loaded dialogs (code-split on user click) ──
const MemberEditDialogLazy = lazy(() =>
  import('./components/member-edit-dialog').then((m) => ({
    default: m.MemberEditDialog,
  })),
)
const MemberDetailDialogLazy = lazy(() =>
  import('./components/member-detail-dialog').then((m) => ({
    default: m.MemberDetailDialog,
  })),
)

interface MembersPageProps {
  userRole: string
}

export function MembersPage({ userRole }: MembersPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [activeView, setActiveView] = useState<'enroll' | 'list'>('enroll')
  const [editingMember, setEditingMember] =
    useState<MemberWithSubscriptions | null>(null)
  const [viewMemberId, setViewMemberId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<MemberWithSubscriptions | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedState<number>(
    'dataTablePageSize',
    10,
    (v) => ([5, 10, 20, 50].includes(v) ? v : 10),
  )

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => deleteMember({ data: { memberId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setDeleteTarget(null)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string
      status: 'ACTIVE' | 'INACTIVE'
    }) => toggleMemberStatus({ data: { memberId, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Estado del socio actualizado')
    },
    onError: () => toast.error('Error al actualizar el estado'),
  })

  const debouncedSearch = useDebounce(search, 300)
  const { branchId } = useCurrentBranch()

  const { data: membersList = [], isLoading } = useQuery({
    queryKey: ['members', debouncedSearch, branchId],
    queryFn: () =>
      getMembers({
        data: { search: debouncedSearch, branchId: branchId ?? undefined },
      }),
  })

  const totalMembers = membersList.length
  const activeNow = membersList.filter((m) =>
    isSubscriptionActive(getActiveSubscription(m)),
  ).length
  const expiringThisWeek = membersList.filter((m) => {
    const sub = getActiveSubscription(m)
    return sub && sub.status === 'ACTIVE' && isExpiringThisWeek(sub.endDate)
  }).length

  const filteredMembers = membersList.filter((m) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'ACTIVE')
      return isSubscriptionActive(getActiveSubscription(m))
    if (statusFilter === 'INACTIVE') {
      const sub = getActiveSubscription(m)
      return (
        m.status !== 'ACTIVE' ||
        !sub ||
        sub.status !== 'ACTIVE' ||
        isExpired(sub.endDate)
      )
    }
    return m.subscriptions.length === 0
  })

  const totalFiltered = filteredMembers.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedMembers = filteredMembers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  if (activeView === 'enroll') {
    return (
      <div className="w-full h-full">
        <MemberEnrollmentWizard
          variant="inline"
          isOpen={true}
          onClose={() => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
            setActiveView('list')
          }}
        />
      </div>
    )
  }

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Socios</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Listado</span>
          </div>
        }
        title="Listado"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            {!isReadOnly && (
              <ToggleGroup
                type="single"
                value="list"
                onValueChange={(v) => {
                  if (v === 'enroll') setActiveView('enroll')
                }}
              >
                <ToggleGroupItem value="list">
                  <List className="size-3.5" /> Listado
                </ToggleGroupItem>
                <ToggleGroupItem value="enroll">
                  <Plus className="size-3.5" /> Inscripción
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por CI, nombre..."
              filterValue={statusFilter}
              onFilterChange={(v) => setStatusFilter(v as StatusFilter)}
              filterOptions={[
                { value: 'ALL', label: 'Todos los Estados' },
                { value: 'ACTIVE', label: 'Activos' },
                { value: 'INACTIVE', label: 'Inactivos' },
                { value: 'NO_SUBSCRIPTION', label: 'Sin plan' },
              ]}
              filterPlaceholder="Estado"
            />
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <StatCard
                    label="Total Socios"
                    value={totalMembers}
                    icon={Users}
                    variant="default"
                  />
                </div>
                <StatCard
                  label="Activos"
                  value={activeNow}
                  icon={CheckCircle2}
                  variant="emerald"
                />
                <StatCard
                  label="Vencen pronto"
                  value={expiringThisWeek}
                  icon={Clock}
                  variant="foreground"
                />
              </div>
            </div>
          </div>
        }
      >
        <TooltipProvider delayDuration={200}>
          <DataTable
            columns={[
              {
                key: 'member',
                label: 'Socio',
                render: (member: MemberWithSubscriptions) => (
                  <div className="flex items-center gap-3">
                    <div className="ring-2 ring-foreground/10 rounded-full shrink-0">
                      <MemberAvatar
                        name={member.fullName}
                        photoUrl={member.photoUrl}
                        size={9}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm dark:text-white text-foreground leading-tight truncate">
                        {member.fullName}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        CI: {member.documentNumber || '—'}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'plan',
                label: (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">Paquete</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Plan o paquete de suscripción contratado</p>
                    </TooltipContent>
                  </Tooltip>
                ),
                render: (member: MemberWithSubscriptions) => {
                  const sub = getActiveSubscription(member)
                  if (!sub)
                    return (
                      <span className="text-xs text-muted-foreground">—</span>
                    )
                  const expired = isExpired(sub.endDate)
                  return (
                    <Badge
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-bold',
                        expired
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15',
                      )}
                    >
                      <Package className="size-2.5" />
                      {sub.package?.name || 'N/A'}
                    </Badge>
                  )
                },
              },
              ...(!branchId
                ? [
                    {
                      key: 'sucursal' as string,
                      label: 'Sucursal',
                      render: (member: MemberWithSubscriptions) => (
                        <span className="text-sm text-muted-foreground">
                          {member.branch?.name ?? (
                            <span className="text-xs italic text-muted-foreground/50">
                              Sin sucursal
                            </span>
                          )}
                        </span>
                      ),
                    },
                  ]
                : []),
              {
                key: 'status',
                label: 'Estado',
                render: (member: MemberWithSubscriptions) => {
                  if (member.status === 'INACTIVE')
                    return (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold"
                      >
                        Inactivo
                      </Badge>
                    )
                  const sub = getActiveSubscription(member)
                  const expired = sub && isExpired(sub.endDate)
                  if (!sub)
                    return (
                      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-muted-foreground/20">
                        Sin plan
                      </Badge>
                    )
                  if (expired)
                    return (
                      <Badge
                        variant="destructive"
                        className="text-[10px] font-bold"
                      >
                        Vencido
                      </Badge>
                    )
                  if (sub.status === 'ACTIVE')
                    return (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">
                        Activo
                      </Badge>
                    )
                  return null
                },
              },
              ...(!isReadOnly
                ? [
                    {
                      key: 'actions' as string,
                      label: '',
                      className: 'text-right',
                      render: (member: MemberWithSubscriptions) => {
                        const isActive = member.status === 'ACTIVE'
                        return (
                          <div className="flex justify-end gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                  onClick={() => setViewMemberId(member.id)}
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Ver detalle</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                  onClick={() => setEditingMember(member)}
                                >
                                  <Edit2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className={cn(
                                    isActive
                                      ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10'
                                      : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10',
                                  )}
                                  onClick={() =>
                                    toggleStatusMutation.mutate({
                                      memberId: member.id,
                                      status: isActive ? 'INACTIVE' : 'ACTIVE',
                                    })
                                  }
                                  disabled={toggleStatusMutation.isPending}
                                >
                                  {isActive ? (
                                    <ToggleLeft className="size-3.5" />
                                  ) : (
                                    <ToggleRight className="size-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>
                                  {isActive
                                    ? 'Desactivar socio'
                                    : 'Activar socio'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  onClick={() => setDeleteTarget(member)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Eliminar</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )
                      },
                    },
                  ]
                : []),
            ]}
            data={paginatedMembers}
            isLoading={isLoading}
            loadingMessage="Cargando..."
            emptyMessage="No se encontraron socios."
            keyExtractor={(member: MemberWithSubscriptions) => member.id}
            skeletonRows={5}
            currentPage={safePage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalFiltered={totalFiltered}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </TooltipProvider>
      </ModuleLayout>

      <Suspense fallback={null}>
        {editingMember && (
          <MemberEditDialogLazy
            member={editingMember}
            open={!!editingMember}
            onOpenChange={(open) => {
              if (!open) setEditingMember(null)
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <MemberDetailDialogLazy
          memberId={viewMemberId}
          onOpenChange={(open) => {
            if (!open) setViewMemberId(null)
          }}
        />
      </Suspense>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar Socio"
        description={
          deleteTarget ? (
            <span>
              Vas a eliminar a <strong>{deleteTarget.fullName}</strong> (CI{' '}
              {deleteTarget.documentNumber || '—'}). Se desactivará su acceso al
              gimnasio. Los registros históricos se conservan. ¿Estás seguro?
            </span>
          ) : null
        }
        confirmText="Eliminar Socio"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </>
  )
}

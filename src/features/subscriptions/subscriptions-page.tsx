import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, CreditCard, List, Plus } from 'lucide-react'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { toast } from 'sonner'
import { getSubscriptions, cancelSubscription } from '#/features/subscriptions/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { SubscriptionCard } from '#/features/subscriptions/components/subscription-card.tsx'
import { SubscriptionForm } from '#/features/subscriptions/components/subscription-form.tsx'
import { getSubscriptionStatus } from '#/features/subscriptions/utils.ts'
import type { StatusFilter } from '#/features/subscriptions/types.ts'

interface SubscriptionsPageProps {
  userRole: string
}

export function SubscriptionsPage({ userRole }: SubscriptionsPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [activeView, setActiveView] = useState<'list' | 'form'>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')

  const { data: subsList = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions(),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Suscripción cancelada')
    },
    onError: () => toast.error('Error al cancelar'),
  })

  const filtered = subsList.filter((sub) => {
    const status = getSubscriptionStatus(sub)
    if (filterStatus !== 'ALL' && status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const memberName = sub.member.fullName.toLowerCase()
      const packageName = (sub.package?.name || sub.plan?.name || '').toLowerCase()
      return memberName.includes(q) || packageName.includes(q)
    }
    return true
  })

  const totalSubscriptions = subsList.length
  const activeSubscriptions = subsList.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date()
  ).length
  const expiredSubscriptions = subsList.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) < new Date()
  ).length

  const statusLabel =
    filterStatus === 'ALL' ? 'Todos los Estados'
    : filterStatus === 'ACTIVE' ? 'Activas'
    : filterStatus === 'EXPIRED' ? 'Vencidas'
    : 'Canceladas'

  if (activeView === 'form') {
    return <SubscriptionForm onBack={() => { setActiveView('list'); queryClient.invalidateQueries({ queryKey: ['subscriptions'] }) }} />
  }

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Suscripciones</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Listado</span>
        </div>
      }
      title="Suscripciones"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          {!isReadOnly && (
            <ToggleGroup type="single" value="list" onValueChange={(v) => { if (v === 'form') setActiveView('form') }}>
              <ToggleGroupItem value="list"><List className="size-3.5" /> Listado</ToggleGroupItem>
              <ToggleGroupItem value="form"><Plus className="size-3.5" /> Nuevo</ToggleGroupItem>
            </ToggleGroup>
          )}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Metricas</p>
            <div className="grid grid-cols-1 gap-3">
              <StatCard label="Total Suscripciones" value={totalSubscriptions} icon={CreditCard} variant="default" />
              <StatCard label="Activas" value={activeSubscriptions} icon={CreditCard} variant="emerald" />
              <StatCard label="Vencidas" value={expiredSubscriptions} icon={CreditCard} variant="orange" />
            </div>
          </div>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar socio o paquete..."
            filterValue={filterStatus}
            onFilterChange={(v) => setFilterStatus(v as StatusFilter)}
            filterOptions={[
              { value: 'ALL', label: 'Todos los Estados' },
              { value: 'ACTIVE', label: 'Activas' },
              { value: 'EXPIRED', label: 'Vencidas' },
              { value: 'CANCELLED', label: 'Canceladas' },
            ]}
            filterPlaceholder="Estado"
          />
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-black tracking-tight">
            {filtered.length} suscripcion{filtered.length !== 1 ? 'es' : ''}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{statusLabel}</p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No hay suscripciones registradas"
            description="Crea tu primera suscripción con el botón del panel izquierdo."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((sub) => (
              <SubscriptionCard key={sub.id} sub={sub} isReadOnly={isReadOnly} onCancel={(id) => cancelMutation.mutate({ data: id })} />
            ))}
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}

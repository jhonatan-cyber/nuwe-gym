import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronRight, ChevronLeft, CreditCard, List, Plus } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { SubscriptionCard } from '#/features/subscriptions/components/subscription-card.tsx'
import { SubscriptionForm } from '#/features/subscriptions/components/subscription-form.tsx'
import { SubscriptionDetailDialog } from '#/features/subscriptions/components/subscription-detail-dialog.tsx'
import { useSubscriptionsPage } from '#/features/subscriptions/hooks/use-subscriptions-page.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import type { Subscription } from '#/features/subscriptions/types.ts'

interface SubscriptionsPageProps {
  userRole: string
}

export function SubscriptionsPage({ userRole }: SubscriptionsPageProps) {
  const {
    activeView,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filtered,
    allFiltered,
    isLoading,
    totalSubscriptions,
    activeSubscriptions,
    expiredSubscriptions,
    statusLabel,
    isReadOnly,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
    handleOpenForm,
    handleBackToList,
    handleCancel,
  } = useSubscriptionsPage(userRole)

  const { branchId } = useCurrentBranch()
  const showBranch = !branchId
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)

  const [pageChanging, setPageChanging] = useState(false)
  const pageTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handlePageChange = useCallback(
    (page: number) => {
      setPageChanging(true)
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
      pageTimerRef.current = setTimeout(() => setPageChanging(false), 350)
      setCurrentPage(page)
    },
    [setCurrentPage],
  )

  useEffect(() => {
    return () => {
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
    }
  }, [])

  if (activeView === 'form') {
    return <SubscriptionForm onBack={handleBackToList} />
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
            <ToggleGroup
              type="single"
              value="list"
              onValueChange={(v) => {
                if (v === 'form') handleOpenForm()
              }}
            >
              <ToggleGroupItem value="list">
                <List className="size-3.5" /> Listado
              </ToggleGroupItem>
              <ToggleGroupItem value="form">
                <Plus className="size-3.5" /> Nuevo
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Metricas
            </p>
            <div className="grid grid-cols-1 gap-3">
              <StatCard
                label="Total Suscripciones"
                value={totalSubscriptions}
                icon={CreditCard}
                variant="default"
              />
              <StatCard
                label="Activas"
                value={activeSubscriptions}
                icon={CreditCard}
                variant="emerald"
              />
              <StatCard
                label="Vencidas"
                value={expiredSubscriptions}
                icon={CreditCard}
                variant="orange"
              />
            </div>
          </div>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar socio o paquete..."
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
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
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {statusLabel}
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : allFiltered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No hay suscripciones registradas"
            description="Crea tu primera suscripción con el botón del panel izquierdo."
          />
        ) : (
          <>
            {/* Page size selector at the top */}
            <div className="flex justify-end items-center mb-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Por página:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              {pageChanging && (
                <div className="absolute top-0 left-0 right-0 z-10 h-0.5 bg-muted/30">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ animation: 'pageLoadBar 0.35s ease-out' }}
                  />
                </div>
              )}
              <div
                key={currentPage}
                style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
              >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((sub, idx) => (
                  <div
                    key={sub.id}
                    style={{
                      animation: 'fadeSlideIn 0.35s ease-out both',
                      animationDelay: `${idx * 25}ms`,
                    }}
                  >
                    <SubscriptionCard
                      sub={sub}
                      isReadOnly={isReadOnly}
                      onCancel={handleCancel}
                      onViewDetails={setSelectedSub}
                      showBranch={showBranch}
                    />
                  </div>
                ))}
              </div>
            </div>
            </div>
            {/* Paginator at the bottom */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="size-8 text-xs font-bold rounded-full"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SubscriptionDetailDialog
        subscription={selectedSub}
        open={!!selectedSub}
        onOpenChange={(open) => !open && setSelectedSub(null)}
      />
    </ModuleLayout>
  )
}

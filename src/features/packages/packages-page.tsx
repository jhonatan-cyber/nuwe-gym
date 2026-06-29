import { ChevronRight, List, PackageIcon, Plus } from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { PackageCard } from '#/features/packages/components/package-card.tsx'
import { PackageForm } from '#/features/packages/components/package-form.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { getTypeLabel } from '#/features/packages/utils.ts'
import type { Package } from '#/features/packages/types.ts'
import { usePackagesPage } from '#/features/packages/hooks/use-packages-page.ts'

interface PackagesPageProps {
  userRole: string
}

export function PackagesPage({ userRole }: PackagesPageProps) {
  const {
    activeView,
    editingPackageId,
    search,
    setSearch,
    filterType,
    setFilterType,
    filtered,
    isLoading,
    totalPackages,
    activePackages,
    isReadOnly,
    deleteMutation,
    handleToggleActive,
    handleOpenForm,
    handleBackToList,
  } = usePackagesPage(userRole)

  if (activeView === 'form' && !isReadOnly) {
    return (
      <PackageForm
        editingPackageId={editingPackageId}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Paquetes</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Listado</span>
        </div>
      }
      title="Paquetes"
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
                label="Total Paquetes"
                value={totalPackages}
                icon={PackageIcon}
                variant="default"
              />
              <StatCard
                label="Activos"
                value={activePackages}
                icon={PackageIcon}
                variant="emerald"
              />
            </div>
          </div>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por nombre..."
            filterValue={filterType}
            onFilterChange={setFilterType}
            filterOptions={[
              { value: 'ALL', label: 'Todos los Tipos' },
              { value: 'PACKAGE', label: 'Paquete' },
              { value: 'PROMOTION', label: 'Promocion' },
              { value: 'SPECIAL', label: 'Especial' },
            ]}
            filterPlaceholder="Tipo"
          />
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-black tracking-tight">
            {filtered.length} paquete{filtered.length !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {getTypeLabel(filterType === 'ALL' ? 'PACKAGE' : filterType)}
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="No hay paquetes registrados"
            description="Crea tu primer paquete con el boton del panel izquierdo."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isReadOnly={isReadOnly}
                onEdit={() => handleOpenForm(pkg.id)}
                onToggleActive={handleToggleActive}
                onDelete={(id) => deleteMutation.mutate({ data: { id } })}
              />
            ))}
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, List, PackageIcon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getPackages, deletePackage, updatePackage } from '#/features/packages/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { PackageCard } from '#/features/packages/components/package-card.tsx'
import { PackageForm } from '#/features/packages/components/package-form.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { getTypeLabel } from '#/features/packages/utils.ts'
import type { Package } from '#/features/packages/types.ts'

interface PackagesPageProps {
  userRole: string
}

export function PackagesPage({ userRole }: PackagesPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [activeView, setActiveView] = useState<'list' | 'form'>('list')
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  const { data: packagesList = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Paquete eliminado')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al eliminar el paquete', { position: 'top-center' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: updatePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  const filtered = packagesList.filter((p) => {
    if (filterType !== 'ALL' && p.type !== filterType) return false
    if (search) return p.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const totalPackages = packagesList.length
  const activePackages = packagesList.filter((p) => p.isActive).length

  function handleToggleActive(pkg: Package) {
    toggleMutation.mutate({
      data: {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description ?? '',
        imageBase64: pkg.imageBase64 ?? '',
        price: pkg.price,
        durationDays: pkg.durationDays,
        type: pkg.type,
        isActive: !pkg.isActive,
        items: pkg.items.map((i) => ({ description: i.description, sortOrder: i.sortOrder })),
      },
    })
  }

  function handleOpenForm(pkgId?: number) {
    setEditingPackageId(pkgId ?? null)
    setActiveView('form')
  }

  function handleBackToList() {
    setEditingPackageId(null)
    setActiveView('list')
    queryClient.invalidateQueries({ queryKey: ['packages'] })
  }

  if (activeView === 'form' && !isReadOnly) {
    return <PackageForm editingPackageId={editingPackageId} onBack={handleBackToList} />
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
              <ToggleGroupItem value="list"><List className="size-3.5" /> Listado</ToggleGroupItem>
              <ToggleGroupItem value="form"><Plus className="size-3.5" /> Nuevo</ToggleGroupItem>
            </ToggleGroup>
          )}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Metricas</p>
            <div className="grid grid-cols-1 gap-3">
              <StatCard label="Total Paquetes" value={totalPackages} icon={PackageIcon} variant="default" />
              <StatCard label="Activos" value={activePackages} icon={PackageIcon} variant="emerald" />
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

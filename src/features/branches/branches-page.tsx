import {
  Store,
  Plus,
  Pencil,
  Power,
  PowerOff,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { DataTable } from '#/shared/components/data-table'
import { cn } from '#/shared/lib/utils.ts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { useBranchesPage } from '#/features/branches/hooks/use-branches-page.ts'
import type { Branch } from '#/features/branches/types.ts'
import {
  BranchCard,
  BranchCardSkeleton,
} from '#/features/branches/components/branch-card.tsx'
import { BranchFormDialog } from '#/features/branches/components/branch-form-dialog.tsx'

export function BranchesPage() {
  const {
    isOpen,
    editingId,
    form,
    search,
    statusFilter,
    branchToDelete,
    setForm,
    setSearch,
    setStatusFilter,
    setBranchToDelete,
    isLoading,
    filteredBranches,
    totalBranches,
    activeCount,
    inactiveCount,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleToggleActive,
    handleDelete,
    isPending,
  } = useBranchesPage()

  return (
    <div className="w-full">
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Configuración</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Sucursales</span>
          </div>
        }
        title="Sucursales"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <Button
              onClick={openCreate}
              className="flex items-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-foreground dark:hover:text-primary"
            >
              <Plus className="size-4" /> Nueva Sucursal
            </Button>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  label="Total Sucursales"
                  value={totalBranches}
                  icon={Store}
                  variant="default"
                />
                <StatCard
                  label="Activas"
                  value={activeCount}
                  icon={Power}
                  variant="emerald"
                />
                <StatCard
                  label="Inactivas"
                  value={inactiveCount}
                  icon={PowerOff}
                  variant="orange"
                />
              </div>
            </div>

            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre o dirección..."
              filterValue={statusFilter}
              onFilterChange={(v) => setStatusFilter(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              filterOptions={[
                { value: 'ALL', label: 'Todos los Estados' },
                { value: 'ACTIVE', label: 'Activas' },
                { value: 'INACTIVE', label: 'Inactivas' },
              ]}
              filterPlaceholder="Estado"
            />
          </div>
        }
      >
        <TooltipProvider delayDuration={200}>
          {/* Vista Desktop (Tabla) */}
          <div className="hidden 2xl:block">
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Nombre',
                  render: (b: Branch) => (
                    <span className="font-bold text-sm text-foreground">{b.name}</span>
                  ),
                },
                {
                  key: 'address',
                  label: 'Dirección',
                  render: (b: Branch) => (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                      {b.address || '-'}
                    </span>
                  ),
                },
                {
                  key: 'phone',
                  label: 'Teléfono',
                  render: (b: Branch) => (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="size-3.5 text-muted-foreground shrink-0" />
                      {b.phone || '-'}
                    </span>
                  ),
                },
                {
                  key: 'email',
                  label: 'Email',
                  render: (b: Branch) => (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      {b.email || '-'}
                    </span>
                  ),
                },
                {
                  key: 'hours',
                  label: (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">Horario</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Horario de atención de la sucursal</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                  render: (b: Branch) => (
                    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                      {b.openingTime} - {b.closingTime}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Estado',
                  render: (b: Branch) => (
                    <Badge
                      className={cn(
                        'border font-semibold text-[10px] px-2 py-0.5 shadow-none',
                        b.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
                      )}
                    >
                      {b.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  label: 'Acciones',
                  className: 'text-right',
                  render: (b: Branch) => (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full"
                        onClick={() => handleToggleActive(b)}
                      >
                        {b.isActive ? (
                          <PowerOff className="size-4 text-destructive" />
                        ) : (
                          <Power className="size-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setBranchToDelete(b)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredBranches}
              isLoading={isLoading}
              emptyMessage="No se encontraron sucursales."
              keyExtractor={(b: Branch) => b.id}
            />
          </div>

          {/* Vista Mobile (Cards) */}
          <div className="block 2xl:hidden space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BranchCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="rounded-[2rem] border border-border/10 bg-card p-8 text-center text-muted-foreground shadow-md animate-in fade-in">
                No se encontraron sucursales.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredBranches.map((branch: any) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={setBranchToDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </TooltipProvider>
      </ModuleLayout>

      <BranchFormDialog
        isOpen={isOpen}
        editingId={editingId}
        form={form}
        isPending={isPending}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!branchToDelete}
        onOpenChange={(open) => {
          if (!open) setBranchToDelete(null)
        }}
      >
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">Eliminar Sucursal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro que deseas eliminar la sucursal{' '}
            <span className="font-bold text-foreground">{branchToDelete?.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBranchToDelete(null)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-full"
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

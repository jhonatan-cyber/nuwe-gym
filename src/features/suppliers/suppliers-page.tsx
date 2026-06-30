import { useEffect } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  List,
  Truck,
  Plus,
} from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { DataTable } from '#/shared/components/data-table'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { Button } from '#/shared/components/ui/button'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import { TooltipProvider } from '#/shared/components/ui/tooltip'
import type { Supplier } from '#/features/suppliers/types.ts'
import { SupplierDetailDialog } from '#/features/suppliers/components/supplier-detail-dialog.tsx'
import { SupplierEditDialog } from '#/features/suppliers/components/supplier-edit-dialog.tsx'
import { SupplierCreateForm } from '#/features/suppliers/components/supplier-create-form.tsx'
import { useSuppliersPage } from '#/features/suppliers/hooks/use-suppliers-page.ts'
import type { ViewMode } from '#/features/suppliers/hooks/use-suppliers-page.ts'
import { useSupplierColumns } from '#/features/suppliers/hooks/use-supplier-columns.tsx'
import { SupplierCard, SupplierCardSkeleton } from '#/features/suppliers/components/supplier-card.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select.tsx'

export function SuppliersPage() {

  const {
    activeView,
    setActiveView,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    editingSupplier,
    setEditingSupplier,
    viewSupplierId,
    setViewSupplierId,
    deletingSupplier,
    setDeletingSupplier,
    isLoading,
    paginatedSuppliers,
    totalFiltered,
    totalSuppliers,
    activeCount,
    inactiveCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    handleDeleteSupplier,
    handleConfirmDeleteSupplier,
    updateMutation,
    createMutation,
  } = useSuppliersPage()

  // Adjust page size for mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1536
      if (isMobile && pageSize % 2 !== 0) {
        setPageSize(pageSize + 1)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pageSize, setPageSize])

  const columns = useSupplierColumns({
    handleDeleteSupplier,
    setViewSupplierId,
    setEditingSupplier,
  })

  return (
    <>
    <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Proveedores</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Listado</span>
          </div>
        }
        title="Proveedores"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <ToggleGroup
              type="single"
              value="list"
              onValueChange={(v) => {
                if (v) setActiveView(v as ViewMode)
              }}
            >
              <ToggleGroupItem value="list">
                <List className="size-3.5" /> Proveedores
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              onClick={() => setActiveView('create')}
              className="flex items-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-foreground dark:hover:text-primary"
            >
              <Plus className="size-4" /> Nuevo
            </Button>
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, email o teléfono..."
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={[
                  { value: 'ALL', label: 'Todos' },
                  { value: 'ACTIVE', label: 'Activos' },
                  { value: 'INACTIVE', label: 'Inactivos' },
                ]}
                filterPlaceholder="Estado"
              />
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  label="Total Proveedores"
                  value={totalSuppliers}
                  icon={Truck}
                  variant="default"
                />
                <StatCard
                  label="Activos"
                  value={activeCount}
                  icon={Truck}
                  variant="emerald"
                />
                <StatCard
                  label="Inactivos"
                  value={inactiveCount}
                  icon={Truck}
                  variant="orange"
                />
              </div>
            </div>
          </div>
        }
      >
        {activeView === 'create' ? (
          <SupplierCreateForm
            onSubmit={(data) => createMutation.mutate({ data })}
            onBack={() => setActiveView('list')}
            isPending={createMutation.isPending}
          />
        ) : (
        <TooltipProvider delayDuration={200}>
          {/* Vista Desktop (Tabla) */}
          <div className="hidden 2xl:block">
            <DataTable
                columns={columns}
                data={paginatedSuppliers}
                isLoading={isLoading}
                loadingMessage="Cargando proveedores..."
                emptyMessage="No se encontraron proveedores."
                keyExtractor={(sup: Supplier) => sup.id}
                skeletonRows={5}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
                totalFiltered={totalFiltered}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>

            {/* Vista Mobile (Cards) */}
            <div className="block 2xl:hidden space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SupplierCardSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : paginatedSuppliers.length === 0 ? (
                <div className="rounded-[2rem] border border-border/10 bg-card p-8 text-center text-muted-foreground shadow-md">
                  No se encontraron proveedores.
                </div>
              ) : (
                <>
                  {/* Selector de cantidad y registro de conteo */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 rounded-[2rem] border bg-card border-border/10 shadow-md relative overflow-hidden">
                    <div className="absolute -top-12 -left-12 size-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 size-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />

                    <span className="text-xs text-muted-foreground font-semibold relative z-10 text-center sm:text-left">
                      Mostrando{' '}
                      {totalFiltered === 0
                        ? 0
                        : (currentPage - 1) * pageSize + 1}{' '}
                      a {Math.min(currentPage * pageSize, totalFiltered)} de{' '}
                      {totalFiltered} proveedores
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground relative z-10">
                      <span>Por pág:</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                          setPageSize(Number(val))
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px] text-xs rounded-full bg-background border-border/10 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Grid de Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paginatedSuppliers.map((sup: Supplier) => (
                      <SupplierCard
                        key={sup.id}
                        supplier={sup}
                        setViewSupplierId={setViewSupplierId}
                        setEditingSupplier={setEditingSupplier}
                        handleDeleteSupplier={handleDeleteSupplier}
                      />
                    ))}
                  </div>

                  {/* Paginación Mobile */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 py-3 border-t dark:border-white/5 border-black/5 bg-muted/10 rounded-2xl mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-full animate-none"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? 'default' : 'outline'
                            }
                            size="sm"
                            className="size-8 text-xs font-bold rounded-full animate-none"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}

                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-full animate-none"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(totalPages, currentPage + 1)
                          )
                        }
                        disabled={
                          currentPage === totalPages || totalPages === 0
                        }
                      >
                        <ChevronLeft className="size-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipProvider>
        )}
      </ModuleLayout>

      {/* Edit Supplier Dialog */}
      <SupplierEditDialog
        supplier={editingSupplier}
        open={editingSupplier !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSupplier(null)
        }}
        onSubmit={(data) => updateMutation.mutate({ data })}
        isPending={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingSupplier !== null}
        onOpenChange={() => setDeletingSupplier(null)}
        title="Eliminar Proveedor"
        description="¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleConfirmDeleteSupplier}
      />

      {/* Supplier Detail Dialog */}
      <SupplierDetailDialog
        supplierId={viewSupplierId}
        onOpenChange={(open) => {
          if (!open) setViewSupplierId(null)
        }}
      />
    </>
  )
}

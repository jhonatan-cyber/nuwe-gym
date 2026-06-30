import { useEffect } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  List,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
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
import type { StaffUser } from '#/features/users/types.ts'
import { UserDetailDialog } from '#/features/users/components/user-detail-dialog.tsx'
import { UserCreationWizard } from '#/features/users/components/user-creation-wizard.tsx'
import { RolesView } from '#/features/users/components/roles-view.tsx'
import { UserEditDialog } from '#/features/users/components/user-edit-dialog.tsx'
import { useUsersPage } from '#/features/users/hooks/use-users-page.ts'
import type { ViewMode } from '#/features/users/hooks/use-users-page.ts'
import { useUserColumns } from '#/features/users/hooks/use-user-columns.tsx'
import { UserCard, UserCardSkeleton } from '#/features/users/components/user-card.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select.tsx'

interface AdminUsersPageProps {
  currentUserId: string
}

export function AdminUsersPage({ currentUserId }: AdminUsersPageProps) {
  const {
    activeView,
    setActiveView,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    editingUser,
    setEditingUser,
    viewUserId,
    setViewUserId,
    deletingUserId,
    setDeletingUserId,
    isLoading,
    paginatedUsers,
    totalFiltered,
    totalUsers,
    adminCount,
    receptionistCount,
    trainerCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    handleOpenCreate,
    handleCloseCreate,
    handleDeleteUser,
    handleConfirmDeleteUser,
  } = useUsersPage(currentUserId)

  // Ajustar la cantidad de registros a un número par si se pasa a vista móvil (cards)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1536
      if (isMobile && pageSize % 2 !== 0) {
        setPageSize(pageSize + 1) // Ej: si era 5, pasa a 6
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pageSize, setPageSize])

  const columns = useUserColumns({
    currentUserId,
    handleDeleteUser,
    setViewUserId,
    setEditingUser,
  })

  if (activeView === 'roles') {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Usuarios</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Roles</span>
          </div>
        }
        title="Roles y Permisos"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <ToggleGroup
              type="single"
              value="roles"
              onValueChange={(v) => {
                if (v) setActiveView(v as ViewMode)
              }}
            >
              <ToggleGroupItem value="list">
                <List className="size-3.5" /> Usuarios
              </ToggleGroupItem>
              <ToggleGroupItem value="roles">
                <Shield className="size-3.5" /> Roles
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Roles del Sistema
              </p>
              <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                El sistema cuenta con 3 roles predefinidos. Hacé clic en cada
                uno para ver sus permisos.
              </p>
            </div>
            <div className="space-y-3 pt-2 border-t dark:border-white/5 border-black/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Distribución
              </p>
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  label="Administradores"
                  value={adminCount}
                  icon={ShieldAlert}
                  variant="default"
                />
                <StatCard
                  label="Recepcionistas"
                  value={receptionistCount}
                  icon={ShieldCheck}
                  variant="default"
                />
                <StatCard
                  label="Entrenadores"
                  value={trainerCount}
                  icon={Shield}
                  variant="default"
                />
              </div>
            </div>
          </div>
        }
      >
        <RolesView
          adminCount={adminCount}
          receptionistCount={receptionistCount}
          trainerCount={trainerCount}
        />
      </ModuleLayout>
    )
  }

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Usuarios</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Staff</span>
          </div>
        }
        title={activeView === 'create' ? 'Nuevo Personal' : 'Usuarios'}
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
                <List className="size-3.5" /> Usuarios
              </ToggleGroupItem>
              <ToggleGroupItem value="roles">
                <Shield className="size-3.5" /> Roles
              </ToggleGroupItem>
            </ToggleGroup>
            {activeView !== 'create' && (
              <Button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-foreground dark:hover:text-primary"
              >
                <Plus className="size-4" /> Nuevo 
              </Button>
            )}
            {activeView !== 'create' && (
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre, email o CI..."
                filterValue={roleFilter}
                onFilterChange={setRoleFilter}
                filterOptions={[
                  { value: 'ALL', label: 'Todos los Roles' },
                  { value: 'ADMIN', label: 'Administradores' },
                  { value: 'RECEPTIONIST', label: 'Recepcionistas' },
                  { value: 'TRAINER', label: 'Entrenadores' },
                ]}
                filterPlaceholder="Rol"
              />
            )}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  label="Total Usuarios"
                  value={totalUsers}
                  icon={Users}
                  variant="default"
                />
                <StatCard
                  label="Administradores"
                  value={adminCount}
                  icon={ShieldAlert}
                  variant="default"
                />
                <StatCard
                  label="Recepcionistas"
                  value={receptionistCount}
                  icon={ShieldCheck}
                  variant="default"
                />
                <StatCard
                  label="Entrenadores"
                  value={trainerCount}
                  icon={Shield}
                  variant="default"
                />
              </div>
            </div>
          </div>
        }
      >
        {activeView === 'create' ? (
          <UserCreationWizard onClose={handleCloseCreate} />
        ) : (
          <TooltipProvider delayDuration={200}>
            {/* Vista Desktop (Tabla) */}
            <div className="hidden 2xl:block">
              <DataTable
                columns={columns}
                data={paginatedUsers}
                isLoading={isLoading}
                loadingMessage="Cargando usuarios..."
                emptyMessage="No se encontraron usuarios."
                keyExtractor={(user: StaffUser) => user.id}
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
                // Skeletons de Cards
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <UserCardSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : paginatedUsers.length === 0 ? (
                <div className="rounded-[2rem] border border-border/10 bg-card p-8 text-center text-muted-foreground shadow-md">
                  No se encontraron usuarios.
                </div>
              ) : (
                <>
                  {/* Selector de cantidad y registro de conteo */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 rounded-[2rem] border bg-card border-border/10 shadow-md relative overflow-hidden">
                    {/* ambient glow for consistency */}
                    <div className="absolute -top-12 -left-12 size-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 size-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />

                    <span className="text-xs text-muted-foreground font-semibold relative z-10 text-center sm:text-left">
                      Mostrando{' '}
                      {totalFiltered === 0
                        ? 0
                        : (currentPage - 1) * pageSize + 1}{' '}
                      a {Math.min(currentPage * pageSize, totalFiltered)} de{' '}
                      {totalFiltered} usuarios
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
                    {paginatedUsers.map((user: any) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        setViewUserId={setViewUserId}
                        setEditingUser={setEditingUser}
                        handleDeleteUser={handleDeleteUser}
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
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipProvider>
        )}
      </ModuleLayout>

      {/* Edit User Dialog */}
      <UserEditDialog
        user={editingUser}
        currentUserId={currentUserId}
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingUserId !== null}
        onOpenChange={() => setDeletingUserId(null)}
        title="Eliminar Usuario"
        description="¿Estás seguro de que deseas eliminar este usuario?"
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleConfirmDeleteUser}
      />

      {/* User Detail Dialog */}
      <UserDetailDialog
        userId={viewUserId}
        onOpenChange={(open) => {
          if (!open) setViewUserId(null)
        }}
      />
    </>
  )
}

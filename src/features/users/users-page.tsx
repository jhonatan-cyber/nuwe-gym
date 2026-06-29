import {
  ChevronRight,
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

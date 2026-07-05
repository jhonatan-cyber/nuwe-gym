import { useEffect } from 'react'
import { ChevronRight, ChevronLeft, Plus, Users, UserCheck, UserX, TimerOff, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { cn } from '#/shared/lib/utils.ts'
import { DataTable } from '#/shared/components/data-table.tsx'
import { SearchInput } from '#/shared/components/search-input.tsx'
import { EmployeeDetailDialog } from './components/employee-detail-dialog.tsx'
import { EmployeeForm } from './components/employee-form.tsx'
import { useEmployeesPage } from './hooks/use-employees-page.ts'
import { useEmployeeColumns } from './hooks/use-employee-columns.tsx'
import type { Employee } from './types.ts'
import { RolesView } from '#/features/users/components/roles-view.tsx'
import { useUserColumns } from '#/features/users/hooks/use-user-columns.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { TooltipProvider } from '#/shared/components/ui/tooltip'
import type { StaffUser } from '#/features/users/types.ts'
import { UserCard, UserCardSkeleton } from '#/features/users/components/user-card.tsx'
import { UserDetailDialog } from '#/features/users/components/user-detail-dialog.tsx'
import { UserEditDialog } from '#/features/users/components/user-edit-dialog.tsx'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import { useUsersPage } from '#/features/users/hooks/use-users-page.ts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select.tsx'

// ── Empty state ──

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Users className="size-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-bold mb-1">No hay personal registrado</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Agregá tu primer miembro del equipo para empezar a gestionar el
        personal del gimnasio.
      </p>
      <Button onClick={onAdd} className="rounded-full font-bold">
        <Plus className="size-4 mr-1.5" />
        Agregar Personal
      </Button>
    </div>
  )
}

// ── Users tab ──

interface UsersTabContentProps {
  currentUserId: string
  usersPage: ReturnType<typeof useUsersPage>
}

function UsersTabContent({ currentUserId, usersPage }: UsersTabContentProps) {
  const {
    editingUser,
    setEditingUser,
    viewUserId,
    setViewUserId,
    deletingUserId,
    setDeletingUserId,
    isLoading,
    paginatedUsers,
    totalFiltered,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    handleDeleteUser,
    handleConfirmDeleteUser,
  } = usersPage

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

  const columns = useUserColumns({
    currentUserId,
    handleDeleteUser,
    setViewUserId,
    setEditingUser,
  })

  return (
    <>
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 rounded-[2rem] border bg-card border-border/10 shadow-md relative overflow-hidden">
                <div className="absolute -top-12 -left-12 size-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 size-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-xs text-muted-foreground font-semibold relative z-10 text-center sm:text-left">
                  Mostrando{' '}
                  {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1}{' '}
                  a {Math.min(currentPage * pageSize, totalFiltered)} de{' '}
                  {totalFiltered} usuarios
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground relative z-10">
                  <span>Por pág:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => setPageSize(Number(val))}
                  >
                    <SelectTrigger className="h-8 w-[70px] text-xs rounded-full bg-background border-border/10 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 10, 20, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedUsers.map((user: StaffUser) => (
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
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 py-3 border-t dark:border-white/5 border-black/5 bg-muted/10 rounded-2xl mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full animate-none"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </TooltipProvider>

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

// ── Roles tab ──

interface RolesTabContentProps {
  usersList: StaffUser[]
}

function RolesTabContent({ usersList }: RolesTabContentProps) {
  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length
  const receptionistCount = usersList.filter((u) => u.role === 'RECEPTIONIST').length
  const trainerCount = usersList.filter((u) => u.role === 'TRAINER').length

  return (
    <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative">
      <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 p-6">
        <RolesView
          adminCount={adminCount}
          receptionistCount={receptionistCount}
          trainerCount={trainerCount}
        />
      </div>
    </Card>
  )
}

// ── Main page ──

interface EmployeesPageProps {
  currentUserId: string
}

export function EmployeesPage({ currentUserId }: EmployeesPageProps) {
  const {
    activeTab,
    setActiveTab,
    activeSubView,
    setActiveSubView,
    editingId,
    setEditingId,
    detailId,
    setDetailId,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    stats,
    employeesList,
    isLoading,
    error,
    totalFiltered,
    totalPages,
    paginatedEmployees,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useEmployeesPage()

  const columns = useEmployeeColumns({
    onDetail: setDetailId,
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  // Users page state (shared between left panel and content)
  const usersPage = useUsersPage(currentUserId)

  if (error) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">RRHH</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground font-semibold">Personal</span>
          </div>
        }
        title="Personal"
      >
        <Card className="rounded-[2rem] border-border/10 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-destructive">
              Error al cargar personal
            </p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">RRHH</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-muted-foreground">Personal</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span
            className={cn(
              'text-foreground',
              activeSubView === 'list' && activeTab === 'employees' && 'font-semibold',
            )}
          >
            {activeTab === 'employees' ? 'Personal' : activeTab === 'users' ? 'Usuarios' : 'Roles'}
          </span>
          {activeTab === 'employees' && activeSubView === 'create' && (
            <>
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <span className="text-foreground font-semibold">Nuevo</span>
            </>
          )}
          {activeTab === 'employees' && activeSubView === 'edit' && (
            <>
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <span className="text-foreground font-semibold">Editar</span>
            </>
          )}
        </div>
      }
      title={
        activeTab === 'employees'
          ? activeSubView === 'create'
            ? 'Nuevo Personal'
            : activeSubView === 'edit'
              ? 'Editar Personal'
              : 'Personal (Staff)'
          : activeTab === 'users'
            ? 'Usuarios'
            : 'Roles y Permisos'
      }
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Sección
            </p>
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(v) => {
                if (v) {
                  setActiveTab(v as 'employees' | 'users' | 'roles')
                  setActiveSubView('list')
                }
              }}
            >
              <ToggleGroupItem value="employees">
                <Users className="size-3.5" /> Personal
              </ToggleGroupItem>
              <ToggleGroupItem value="users">
                <Users className="size-3.5" /> Usuarios
              </ToggleGroupItem>
              <ToggleGroupItem value="roles">
                <Shield className="size-3.5" /> Roles
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {activeTab === 'employees' && activeSubView === 'list' && (
            <>
              <div className="space-y-3 pt-4 border-t border-border/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Acciones
                </p>
                <Button
                  onClick={handleAdd}
                  className="w-full justify-center gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  <Plus className="size-4 shrink-0" />
                  Agregar Personal
                </Button>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Buscador
                </p>
                <SearchInput
                  placeholder="Buscar personal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-3 pt-4 border-t border-border/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Resumen
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    icon={Users}
                    label="Total"
                    value={stats?.total ?? 0}
                  />
                  <StatCard
                    icon={UserCheck}
                    label="Activos"
                    value={stats?.active ?? 0}
                  />
                  <StatCard
                    icon={TimerOff}
                    label="De licencia"
                    value={stats?.onLeave ?? 0}
                  />
                  <StatCard
                    icon={UserX}
                    label="Inactivos"
                    value={(stats?.inactive ?? 0) + (stats?.terminated ?? 0)}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div className="space-y-3">
                <FilterBar
                  search={usersPage.search}
                  onSearchChange={usersPage.setSearch}
                  searchPlaceholder="Buscar por nombre, email o CI..."
                  filterValue={usersPage.roleFilter}
                  onFilterChange={usersPage.setRoleFilter}
                  filterOptions={[
                    { value: 'ALL', label: 'Todos los Roles' },
                    { value: 'ADMIN', label: 'Administradores' },
                    { value: 'RECEPTIONIST', label: 'Recepcionistas' },
                    { value: 'TRAINER', label: 'Entrenadores' },
                  ]}
                  filterPlaceholder="Rol"
                />
              </div>
              <div className="space-y-3 pt-4 border-t border-border/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Info
                </p>
                <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                  Gestión de usuarios staff: administradores, recepcionistas y entrenadores.
                </p>
              </div>
            </>
          )}

          {activeTab === 'roles' && (
            <>
              <div className="space-y-3 pt-4 border-t border-border/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Roles del Sistema
                </p>
                <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                  El sistema cuenta con 3 roles predefinidos. Hacé clic en cada
                  uno para ver sus permisos.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t border-border/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Distribución
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <StatCard
                    label="Administradores"
                    value={usersPage.usersList.filter((u) => u.role === 'ADMIN').length}
                    icon={ShieldAlert}
                    variant="default"
                  />
                  <StatCard
                    label="Recepcionistas"
                    value={usersPage.usersList.filter((u) => u.role === 'RECEPTIONIST').length}
                    icon={ShieldCheck}
                    variant="default"
                  />
                  <StatCard
                    label="Entrenadores"
                    value={usersPage.usersList.filter((u) => u.role === 'TRAINER').length}
                    icon={Shield}
                    variant="default"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Ayuda
            </p>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              Gestioná el personal del gimnasio: altas, bajas, datos laborales y
              bancarios.
            </p>
          </div>
        </div>
      }
    >
      {activeTab === 'users' ? (
        <UsersTabContent currentUserId={currentUserId} usersPage={usersPage} />
      ) : activeTab === 'roles' ? (
        <RolesTabContent usersList={usersPage.usersList} />
      ) : activeSubView === 'create' || activeSubView === 'edit' ? (
        <EmployeeForm
          employeeId={editingId}
          onClose={() => {
            setActiveSubView('list')
            setEditingId(null)
          }}
        />
      ) : isLoading ? (
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-2xl" />
          <Skeleton className="h-9 w-full rounded-2xl" />
        </div>
      ) : !employeesList || employeesList.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <DataTable
          title="Listado de Personal"
          description={`${totalFiltered} persona${totalFiltered !== 1 ? 's' : ''}`}
          data={paginatedEmployees}
          columns={columns}
          keyExtractor={(emp: Employee) => emp.id}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalFiltered={totalFiltered}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <EmployeeDetailDialog
        employeeId={detailId}
        open={detailId !== null}
        onOpenChange={(v) => {
          if (!v) setDetailId(null)
        }}
      />
    </ModuleLayout>
  )
}

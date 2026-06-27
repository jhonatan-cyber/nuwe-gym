import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  List,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Mail,
  Info,
  CheckCircle2,
  IdCard,
  Phone,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getUsers,
  updateUserRole,
  updateUser,
  deleteUser,
} from '#/features/users/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { DataTable } from '#/shared/components/data-table'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Badge } from '#/shared/components/ui/badge'
import { Card, CardContent } from '#/shared/components/ui/card'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import type { StaffUser, UserRole } from '#/features/users/types.ts'
import { ROLE_LABELS, ROLE_COLORS, ROLES_INFO } from '#/features/users/types.ts'
import { UserDetailDialog } from '#/features/users/components/user-detail-dialog.tsx'
import { UserCreationWizard } from '#/features/users/components/user-creation-wizard.tsx'

type ViewMode = 'list' | 'roles' | 'create'

interface AdminUsersPageProps {
  currentUserId: string
}

export function AdminUsersPage({ currentUserId }: AdminUsersPageProps) {
  const queryClient = useQueryClient()

  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDocumentNumber, setEditDocumentNumber] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')

  // Queries
  const { data: usersList = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsers(),
  })

  // Derived stats
  const totalUsers = usersList.length
  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length
  const receptionistCount = usersList.filter(
    (u) => u.role === 'RECEPTIONIST',
  ).length
  const trainerCount = usersList.filter((u) => u.role === 'TRAINER').length

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const searchMatch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.documentNumber &&
        u.documentNumber.toLowerCase().includes(search.toLowerCase()))
    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter
    return searchMatch && roleMatch
  })

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Rol de usuario actualizado')
    },
    onError: () => toast.error('Error al actualizar el rol'),
  })

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario actualizado con éxito')
      closeEditModal()
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al actualizar usuario'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario eliminado')
    },
    onError: () => toast.error('Error al eliminar usuario'),
  })
  // Handlers
  const handleOpenCreate = () => {
    setActiveView('create')
  }

  const handleCloseCreate = () => {
    setActiveView('list')
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      toast.error('No podés cambiar tu propio rol.')
      return
    }
    updateRoleMutation.mutate({ data: { userId, role: newRole } })
  }

  const openEditModal = (user: StaffUser) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditDocumentNumber(user.documentNumber || '')
    setEditPhone(user.phone || '')
    setEditAddress(user.address || '')
    setIsEditOpen(true)
  }

  const closeEditModal = () => {
    setIsEditOpen(false)
    setEditingUser(null)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editName || !editEmail) return
    updateUserMutation.mutate({
      data: {
        userId: editingUser.id,
        name: editName,
        email: editEmail,
        documentNumber: editDocumentNumber || undefined,
        phone: editPhone || undefined,
        address: editAddress || undefined,
      },
    })
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUserId) {
      toast.error('No podés eliminar tu propia cuenta.')
      return
    }
    setDeletingUserId(userId)
  }

  const handleConfirmDeleteUser = () => {
    if (deletingUserId !== null) {
      deleteMutation.mutate({ data: deletingUserId })
      setDeletingUserId(null)
    }
  }

  function getRoleBadge(r: string) {
    const colorClass =
      ROLE_COLORS[r as UserRole] || 'bg-muted text-muted-foreground border-none'
    return (
      <Badge className={`${colorClass} border-none font-bold`}>
        {ROLE_LABELS[r as UserRole] || r}
      </Badge>
    )
  }

  // ── Roles View ──────────────────────────────────────────────────────────
  function RolesView() {
    return (
      <div className="space-y-5">
        <p className="text-sm font-black tracking-tight">
          Roles y Permisos del Sistema
        </p>
        <p className="text-xs text-muted-foreground">
          Cada rol define un conjunto de permisos que determinan qué puede ver y
          hacer un usuario en el sistema.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {ROLES_INFO.map((roleInfo) => {
            const isExpanded = expandedRole === roleInfo.role
            const userCount =
              roleInfo.role === 'ADMIN'
                ? adminCount
                : roleInfo.role === 'RECEPTIONIST'
                  ? receptionistCount
                  : trainerCount

            const IconComponent =
              roleInfo.role === 'ADMIN'
                ? ShieldAlert
                : roleInfo.role === 'RECEPTIONIST'
                  ? ShieldCheck
                  : Shield

            return (
              <Card
                key={roleInfo.role}
                className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                  isExpanded ? 'ring-2 ring-primary/30' : ''
                }`}
                onClick={() =>
                  setExpandedRole(isExpanded ? null : roleInfo.role)
                }
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center ${
                          roleInfo.role === 'ADMIN'
                            ? 'bg-red-500/10'
                            : roleInfo.role === 'RECEPTIONIST'
                              ? 'bg-blue-500/10'
                              : 'bg-amber-500/10'
                        }`}
                      >
                        <IconComponent
                          className={`size-5 ${
                            roleInfo.role === 'ADMIN'
                              ? 'text-red-500'
                              : roleInfo.role === 'RECEPTIONIST'
                                ? 'text-blue-500'
                                : 'text-amber-500'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{roleInfo.label}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          {userCount} usuario{userCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {roleInfo.permissions.length} permisos
                      </Badge>
                      <Info
                        className={`size-4 text-muted-foreground transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/10 space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {roleInfo.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roleInfo.permissions.map((perm, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-foreground/80"
                          >
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            <span>{perm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
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
        <RolesView />
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
                className="flex items-center gap-2 w-full"
              >
                <Plus className="size-4" /> Nuevo Personal
              </Button>
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
          </div>
        }
      >
        {activeView === 'create' ? (
          <UserCreationWizard onClose={handleCloseCreate} />
        ) : (
          <TooltipProvider delayDuration={200}>
            <DataTable
              columns={[
                {
                  key: 'user',
                  label: 'Usuario',
                  render: (user: StaffUser) => (
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-foreground/10">
                        <span className="text-xs font-bold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm dark:text-white text-foreground leading-tight truncate">
                          {user.name}
                          {user.id === currentUserId && (
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              (Vos)
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Mail className="size-2.5" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'documentNumber',
                  label: (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">CI</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Cédula de Identidad</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                  sortable: true,
                  sortValue: (user: StaffUser) => user.documentNumber || '',
                  render: (user: StaffUser) => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground/80 cursor-default">
                          <IdCard className="size-3 text-muted-foreground" />
                          {user.documentNumber || '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Cédula de Identidad</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                },
                {
                  key: 'phone',
                  label: (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">Teléfono</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Número de teléfono del usuario</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                  sortable: true,
                  sortValue: (user: StaffUser) => user.phone || '',
                  render: (user: StaffUser) => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70 cursor-default">
                          <Phone className="size-3 text-muted-foreground" />
                          {user.phone || '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{user.phone || 'Sin teléfono'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                },
                {
                  key: 'address',
                  label: (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">Dirección</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Dirección del usuario</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                  sortable: true,
                  sortValue: (user: StaffUser) => user.address || '',
                  render: (user: StaffUser) => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70 max-w-[180px] truncate cursor-default">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {user.address || '-'}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px]">
                        <p>{user.address || 'Sin dirección registrada'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ),
                },
                {
                  key: 'role',
                  label: 'Rol Actual',
                  render: (user: StaffUser) => getRoleBadge(user.role),
                },
                {
                  key: 'changeRole',
                  label: 'Cambiar Rol',
                  render: (user: StaffUser) => (
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      disabled={user.id === currentUserId}
                      className="h-8 px-2 border rounded bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="RECEPTIONIST">Recepcionista</option>
                      <option value="TRAINER">Entrenador</option>
                    </select>
                  ),
                },
                {
                  key: 'created',
                  label: 'Registro',
                  render: (user: StaffUser) => (
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  label: '',
                  className: 'text-right',
                  render: (user: StaffUser) => (
                    <div className="flex justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setViewUserId(user.id)}
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
                            onClick={() => openEditModal(user)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Editar usuario</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={user.id === currentUserId}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Eliminar usuario</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ),
                },
              ]}
              data={filteredUsers}
              isLoading={isLoading}
              loadingMessage="Cargando usuarios..."
              emptyMessage="No se encontraron usuarios."
              keyExtractor={(user: StaffUser) => user.id}
              skeletonRows={5}
            />
          </TooltipProvider>
        )}
      </ModuleLayout>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) closeEditModal()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre Completo *</label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email / Acceso *</label>
              <Input
                type="email"
                placeholder="Ej. juan@gimnasio.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">CI</label>
                <Input
                  placeholder="Número de documento"
                  value={editDocumentNumber}
                  onChange={(e) => setEditDocumentNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  placeholder="Ej. +595 981 234 567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Dirección</label>
              <Input
                placeholder="Dirección completa"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>

            <div className="bg-blue-500/10 p-3 rounded-lg flex gap-2 text-xs text-blue-800 border border-blue-500/20">
              <Info className="size-5 shrink-0" />
              <span>
                Estás editando los datos de <strong>{editingUser?.name}</strong>{' '}
                (rol actual: {editingUser ? ROLE_LABELS[editingUser.role] : ''}
                ). Para cambiar el rol usá el selector en la tabla.
              </span>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeEditModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

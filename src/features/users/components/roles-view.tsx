import { useState } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Info,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'
import { Badge } from '#/shared/components/ui/badge.tsx'
import { Button } from '#/shared/components/ui/button.tsx'
import { Input } from '#/shared/components/ui/input.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog.tsx'
import {
  getRoles,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
} from '#/features/roles/server.ts'

interface RolesViewProps {
  adminCount: number
  receptionistCount: number
  trainerCount: number
}

interface RoleFormData {
  name: string
  label: string
  description: string
  permissionNames: string[]
}

export function RolesView({
  adminCount,
  receptionistCount,
  trainerCount,
}: RolesViewProps) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    label: '',
    description: '',
    permissionNames: [],
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),
  })

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => getAllPermissions(),
  })

  const createMutation = useMutation({
    mutationFn: (data: RoleFormData) => createRole({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: RoleFormData & { name: string }) =>
      updateRole({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDialogOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteRole({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteConfirm(null)
    },
  })

  const resetForm = () => {
    setFormData({ name: '', label: '', description: '', permissionNames: [] })
    setEditingRole(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleOpenEdit = (role: (typeof roles)[0]) => {
    setEditingRole(role.name)
    setFormData({
      name: role.name,
      label: role.label,
      description: role.description || '',
      permissionNames: role.rolePermissions.map((p) => p.permissionName),
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingRole) {
      updateMutation.mutate({ ...formData, name: editingRole })
    } else {
      createMutation.mutate(formData)
    }
  }

  const togglePermission = (permName: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionNames: prev.permissionNames.includes(permName)
        ? prev.permissionNames.filter((p) => p !== permName)
        : [...prev.permissionNames, permName],
    }))
  }

  const isBuiltIn = (name: string) =>
    ['ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(name)

  const getUserCount = (roleName: string) => {
    if (roleName === 'ADMIN') return adminCount
    if (roleName === 'RECEPTIONIST') return receptionistCount
    if (roleName === 'TRAINER') return trainerCount
    return 0
  }

  const getIcon = (roleName: string) => {
    if (roleName === 'ADMIN') return ShieldAlert
    if (roleName === 'RECEPTIONIST') return ShieldCheck
    return Shield
  }

  const getColor = (roleName: string) => {
    if (roleName === 'ADMIN') return 'red'
    if (roleName === 'RECEPTIONIST') return 'blue'
    return 'amber'
  }

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = []
      acc[perm.module].push(perm)
      return acc
    },
    {} as Record<string, typeof allPermissions>,
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black tracking-tight">
            Roles y Permisos del Sistema
          </p>
          <p className="text-xs text-muted-foreground">
            Cada rol define un conjunto de permisos que determinan qué puede ver
            y hacer un usuario en el sistema.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="size-4 mr-1" />
          Crear Rol
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => {
          const isExpanded = expandedRole === role.name
          const userCount = getUserCount(role.name)
          const IconComponent = getIcon(role.name)
          const color = getColor(role.name)
          const builtIn = isBuiltIn(role.name)

          return (
            <Card
              key={role.name}
              className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                isExpanded ? 'ring-2 ring-primary/30' : ''
              }`}
              onClick={() =>
                setExpandedRole(isExpanded ? null : role.name)
              }
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center bg-${color}-500/10`}
                    >
                      <IconComponent
                        className={`size-5 text-${color}-500`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{role.label}</p>
                        {builtIn && (
                          <Badge variant="secondary" className="text-[9px]">
                            Sistema
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {userCount} usuario{userCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {role.rolePermissions.length} permisos
                    </Badge>
                    {!builtIn && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleOpenEdit(role)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => setDeleteConfirm(role.name)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    )}
                    <Info
                      className={`size-4 text-muted-foreground transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/10 space-y-3">
                    {role.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {role.description}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {role.rolePermissions.map((rp) => (
                        <div
                          key={rp.permissionName}
                          className="flex items-center gap-2 text-xs text-foreground/80"
                        >
                          <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                          <span>{rp.permissionName}</span>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Crear Rol'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Nombre (ID)</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value.toUpperCase() })
                  }
                  placeholder="EJ: MANAGER"
                  disabled={!!editingRole}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Etiqueta</label>
                <Input
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="EJ: Gerente"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Descripción</label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción del rol..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium">Permisos</label>
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {module}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.name}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissionNames.includes(perm.name)}
                          onChange={() => togglePermission(perm.name)}
                          className="rounded"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.label}
            >
              {editingRole ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Rol</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que quieres eliminar el rol{' '}
            <strong>{deleteConfirm}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

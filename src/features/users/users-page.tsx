import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCog, Plus, Trash2, Key, Mail, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import {
  getUsers,
  updateUserRole,
  createStaffUser,
  deleteUser,
} from '#/features/users/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Badge } from '#/shared/components/ui/badge'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'

interface AdminUsersPageProps {
  currentUserId: string
}

export function AdminUsersPage({ currentUserId }: AdminUsersPageProps) {
  const queryClient = useQueryClient()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'RECEPTIONIST' | 'TRAINER'>(
    'TRAINER',
  )
  const [password, setPassword] = useState('')

  const { data: usersList = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsers(),
  })

  const filteredUsers = usersList.filter((u: (typeof usersList)[number]) => {
    const search = searchTerm.toLowerCase()
    return (
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    )
  })

  const createMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario del staff creado con éxito')
      closeCreateModal()
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al crear usuario'),
  })

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Rol de usuario actualizado')
    },
    onError: () => toast.error('Error al actualizar el rol'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario eliminado')
    },
    onError: () => toast.error('Error al eliminar usuario'),
  })

  const openCreateModal = () => {
    setName('')
    setEmail('')
    setRole('TRAINER')
    setPassword('Gym123456')
    setIsCreateOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateOpen(false)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return

    createMutation.mutate({
      data: {
        name,
        email,
        role,
        password,
      },
    })
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      toast.error('No podés cambiar tu propio rol.')
      return
    }
    updateRoleMutation.mutate({ data: { userId, role: newRole } })
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

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-none font-bold">
            ADMINISTRADOR
          </Badge>
        )
      case 'RECEPTIONIST':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-none font-bold">
            RECEPCIONISTA
          </Badge>
        )
      case 'TRAINER':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold">
            ENTRENADOR
          </Badge>
        )
      default:
        return <Badge variant="outline">{r}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="size-8 text-primary" />
            Gestión de Usuarios / Staff
          </h1>
          <p className="text-muted-foreground">
            Registrá, modificá roles y administrá el acceso de los empleados al
            gimnasio.
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="size-4" /> Nuevo Personal
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Nombre o Email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner label="Cargando usuarios..." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Sin resultados"
              description="No se encontraron usuarios."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Cambiar Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u: (typeof filteredUsers)[number]) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold">
                      {u.name} {u.id === currentUserId && '(Vos)'}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === currentUserId}
                        className="h-8 px-2 border rounded bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                        <option value="TRAINER">TRAINER</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={u.id === currentUserId}
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Miembro del Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre Completo *</label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email / Acceso *</label>
              <Input
                type="email"
                placeholder="Ej. juan@gimnasio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Rol *</label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value as 'ADMIN' | 'RECEPTIONIST' | 'TRAINER',
                    )
                  }
                  className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="ADMIN">ADMIN (Acceso Total)</option>
                  <option value="RECEPTIONIST">
                    RECEPTIONIST (Recepción y Caja)
                  </option>
                  <option value="TRAINER">TRAINER (Solo Check-ins)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Contraseña * <Key className="size-3.5" />
                </label>
                <Input
                  type="text"
                  placeholder="Min. 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-amber-500/10 p-3 rounded-lg flex gap-2 text-xs text-amber-800 border border-amber-500/20">
              <ShieldAlert className="size-5 shrink-0" />
              <span>
                Nota: El personal ingresará al sistema con este correo y
                contraseña. Recomendamos pedirles que cambien su clave al
                ingresar por primera vez.
              </span>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateModal}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Registrar Empleado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingUserId !== null}
        onOpenChange={() => setDeletingUserId(null)}
        title="Eliminar Usuario"
        description="¿Estás seguro de que deseas eliminar este usuario?"
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  )
}

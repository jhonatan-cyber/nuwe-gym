import {
  Mail,
  IdCard,
  Phone,
  MapPin,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#/shared/components/ui/tooltip'
import { Badge } from '#/shared/components/ui/badge'
import { RoleBadge } from '#/features/users/components/role-badge.tsx'
import type { StaffUser } from '#/features/users/types.ts'
import { cn } from '#/shared/lib/utils.ts'

interface UseUserColumnsProps {
  currentUserId: string
  handleDeleteUser: (userId: string) => void
  setViewUserId: (userId: string | null) => void
  setEditingUser: (user: StaffUser | null) => void
}

export function useUserColumns({
  currentUserId,
  handleDeleteUser,
  setViewUserId,
  setEditingUser,
}: UseUserColumnsProps) {
  return [
    {
      key: 'user',
      label: 'Usuario',
      sortable: true,
      sortValue: (user: StaffUser) => user.name,
      render: (user: StaffUser) => (
        <div className="flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="size-9 rounded-full object-cover shrink-0 ring-2 ring-foreground/10"
            />
          ) : (
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-foreground/10">
              <span className="text-xs font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
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
      className: 'hidden sm:table-cell',
      headerClassName: 'hidden sm:table-cell',
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
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
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
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
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
      label: 'Rol',
      sortable: true,
      sortValue: (user: StaffUser) => user.role,
      render: (user: StaffUser) => <RoleBadge role={user.role} />,
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      sortValue: (user: StaffUser) => (user.banned ? 'Inactivo' : 'Activo'),
      render: (user: StaffUser) => (
        <Badge
          className={cn(
            'border font-semibold',
            user.banned
              ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
          )}
        >
          {user.banned ? 'Inactivo' : 'Activo'}
        </Badge>
      ),
    },

    {
      key: 'created',
      label: 'Registro',
      sortable: true,
      sortValue: (user: StaffUser) => new Date(user.createdAt).getTime(),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
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
                onClick={() => setEditingUser(user)}
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
  ]
}

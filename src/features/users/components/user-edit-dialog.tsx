import { Info } from 'lucide-react'
import type { StaffUser, UserRole } from '#/features/users/types.ts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Button } from '#/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { useUserEditDialog } from '#/features/users/hooks/use-user-edit-dialog.ts'

interface UserEditDialogProps {
  user: StaffUser | null
  currentUserId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserEditDialog({
  user,
  currentUserId,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const { form, updateField, handleSubmit, isPending } = useUserEditDialog({
    user,
    open,
    onOpenChange,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre Completo *</label>
            <Input
              placeholder="Ej. Juan Pérez"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Email / Acceso *</label>
              <Input
                type="email"
                placeholder="Ej. juan@gimnasio.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rol *</label>
              <Select
                value={form.role}
                onValueChange={(val) => updateField('role', val as UserRole)}
                disabled={user?.id === currentUserId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                  <SelectItem value="TRAINER">Entrenador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">CI</label>
              <Input
                placeholder="Número de documento"
                value={form.documentNumber}
                onChange={(e) => updateField('documentNumber', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                placeholder="Ej. +595 981 234 567"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Dirección</label>
            <Input
              placeholder="Dirección completa"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </div>

          {user?.id === currentUserId && (
            <div className="bg-amber-500/10 p-3 rounded-lg flex gap-2 text-xs text-amber-800 border border-amber-500/20">
              <Info className="size-5 shrink-0" />
              <span>
                No podés cambiar tu propio rol para evitar perder permisos de
                administrador.
              </span>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

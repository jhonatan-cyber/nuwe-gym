import { Info } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newPassword: string
  onNewPasswordChange: (val: string) => void
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  newPassword,
  onNewPasswordChange,
  isPending,
  onSubmit,
}: ResetPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetear Contraseña</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nueva Contraseña</label>
            <Input
              type="text"
              placeholder="Mín. 6 caracteres"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg flex gap-2 text-xs text-amber-800 border border-amber-500/20">
            <Info className="size-5 shrink-0" />
            <span>
              La contraseña debe tener al menos 6 caracteres. Recomendamos
              generar una contraseña segura y compartirla de forma segura con
              el usuario. Todas las sesiones activas del usuario seguirán
              vigentes.
            </span>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || newPassword.trim().length < 6}
            >
              {isPending ? 'Reseteando...' : 'Resetear Contraseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

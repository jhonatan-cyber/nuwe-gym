import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/shared/components/ui/dialog'

interface MovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movementAmount: string
  onMovementAmountChange: (value: string) => void
  movementType: 'INCOME' | 'EXPENSE'
  onMovementTypeChange: (value: 'INCOME' | 'EXPENSE') => void
  movementDescription: string
  onMovementDescriptionChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}

export function CashRegisterMovementDialog({
  open,
  onOpenChange,
  movementAmount,
  onMovementAmountChange,
  movementType,
  onMovementTypeChange,
  movementDescription,
  onMovementDescriptionChange,
  onSubmit,
  isPending,
}: MovementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimiento Manual</DialogTitle>
          <DialogDescription>
            Registrá una entrada o salida de efectivo (ej. retiro de caja, compra de insumos, etc).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={movementType}
                onChange={(e) => onMovementTypeChange(e.target.value as 'INCOME' | 'EXPENSE')}
                className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="INCOME">Ingreso (Entrada)</option>
                <option value="EXPENSE">Egreso (Salida)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Monto ($) *</label>
              <Input
                type="number"
                step="0.01"
                value={movementAmount}
                onChange={(e) => onMovementAmountChange(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Descripción / Concepto *</label>
            <Input
              placeholder="Ej: Retiro para depósito bancario, Compra de café..."
              value={movementDescription}
              onChange={(e) => onMovementDescriptionChange(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Registrar Movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

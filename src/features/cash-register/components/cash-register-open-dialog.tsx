import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/shared/components/ui/dialog'

interface OpenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  openingAmount: string
  onOpeningAmountChange: (value: string) => void
  openingNotes: string
  onOpeningNotesChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}

export function CashRegisterOpenDialog({
  open,
  onOpenChange,
  openingAmount,
  onOpeningAmountChange,
  openingNotes,
  onOpeningNotesChange,
  onSubmit,
  isPending,
}: OpenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apertura de Caja Diaria</DialogTitle>
          <DialogDescription>
            Por favor contá el efectivo en caja para establecer el fondo inicial.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Monto Inicial en Efectivo ($) *</label>
            <Input
              type="number"
              step="0.01"
              value={openingAmount}
              onChange={(e) => onOpeningAmountChange(e.target.value)}
              required
              className="text-lg font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notas de Apertura</label>
            <Textarea
              placeholder="Observaciones de la caja..."
              value={openingNotes}
              onChange={(e) => onOpeningNotesChange(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Confirmar Apertura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

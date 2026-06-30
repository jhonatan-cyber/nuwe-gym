import { Lock } from 'lucide-react'
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

interface CloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expectedCash: string
  closingAmount: string
  onClosingAmountChange: (value: string) => void
  closingNotes: string
  onClosingNotesChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}

export function CashRegisterCloseDialog({
  open,
  onOpenChange,
  expectedCash,
  closingAmount,
  onClosingAmountChange,
  closingNotes,
  onClosingNotesChange,
  onSubmit,
  isPending,
}: CloseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Lock className="size-5" /> Arqueo y Cierre de Caja
          </DialogTitle>
          <DialogDescription>
            Realizá el conteo físico del efectivo en caja y comparalo con el sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Efectivo en Sistema:</span>
              <span className="font-semibold">${expectedCash}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Efectivo Físico Contado ($) *</label>
            <Input
              type="number"
              step="0.01"
              value={closingAmount}
              onChange={(e) => onClosingAmountChange(e.target.value)}
              placeholder="0.00"
              required
              className="text-lg font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notas del Cierre / Arqueo</label>
            <Textarea
              placeholder="Justificación en caso de sobrante o faltante..."
              value={closingNotes}
              onChange={(e) => onClosingNotesChange(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              Cerrar Caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

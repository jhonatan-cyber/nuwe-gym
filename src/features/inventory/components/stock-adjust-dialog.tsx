import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'

interface StockAdjustDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  isPending: boolean
  onSubmit: (data: {
    quantity: number
    movementType: 'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN'
    notes: string
  }) => void
}

export function StockAdjustDialog({
  isOpen,
  onOpenChange,
  productName,
  isPending,
  onSubmit,
}: StockAdjustDialogProps) {
  const [adjustQty, setAdjustQty] = useState('1')
  const [adjustType, setAdjustType] = useState<
    'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN'
  >('MANUAL_ADJUSTMENT')
  const [adjustNotes, setAdjustNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustQty) return
    onSubmit({
      quantity: Number(adjustQty),
      movementType: adjustType,
      notes: adjustNotes,
    })
    setAdjustQty('1')
    setAdjustType('MANUAL_ADJUSTMENT')
    setAdjustNotes('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">
            Ajustar Stock — {productName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold">Cantidad</label>
              <Input
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Tipo de Ajuste</label>
              <select
                value={adjustType}
                onChange={(e) =>
                  setAdjustType(
                    e.target.value as 'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN',
                  )
                }
                className="w-full h-10 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                required
              >
                <option value="MANUAL_ADJUSTMENT">Entrada Manual</option>
                <option value="LOSS">Salida / Pérdida</option>
                <option value="RETURN">Devolución</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Notas / Justificación *</label>
            <Textarea
              placeholder="Ej. Rotura, conteo mensual, vencimiento..."
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              required
              rows={3}
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isPending}
              className="rounded-xl font-bold"
            >
              Registrar Ajuste
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { getBranches } from '#/features/branches/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'

interface StockTransferDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  isPending: boolean
  onSubmit: (data: {
    destBranchId: string
    quantity: number
    notes: string
  }) => void
}

export function StockTransferDialog({
  isOpen,
  onOpenChange,
  productName,
  isPending,
  onSubmit,
}: StockTransferDialogProps) {
  const { branchId: currentBranchId } = useCurrentBranch()
  const [destBranchId, setDestBranchId] = useState('')
  const [transferQty, setTransferQty] = useState('1')
  const [transferNotes, setTransferNotes] = useState('')

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches(),
    enabled: isOpen,
  })

  const availableBranches = branches.filter((b) => b.id !== currentBranchId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!destBranchId || !transferQty) return
    onSubmit({
      destBranchId,
      quantity: Number(transferQty),
      notes: transferNotes,
    })
    setDestBranchId('')
    setTransferQty('1')
    setTransferNotes('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">
            Transferir Stock — {productName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold">Sucursal Destino</label>
            <select
              value={destBranchId}
              onChange={(e) => setDestBranchId(e.target.value)}
              className="w-full h-10 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              required
            >
              <option value="">Seleccionar sucursal...</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Cantidad a transferir</label>
            <Input
              type="number"
              min="1"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Notas</label>
            <Textarea
              placeholder="Motivo de la transferencia..."
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isPending}
              className="rounded-full font-bold"
            >
              Transferir Stock
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Badge } from '#/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { formatDateTime } from '#/shared/lib/formatters.ts'

interface HistoryDetailDialogProps {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedHistoryDetails: {
    session?: {
      openedAt: Date
      closedAt: Date | null
      openingAmount: string
      actualClosingAmount: string | null
      difference: string | null
      notes: string | null
    } | null
    movements: {
      id: string
      movementType: string
      paymentMethod: string
      amount: string
      description: string | null
      createdAt: Date
    }[]
  } | null | undefined
}

export function CashRegisterHistoryDetailDialog({
  sessionId,
  open,
  onOpenChange,
  selectedHistoryDetails,
}: HistoryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de Sesión de Caja #{sessionId}</DialogTitle>
        </DialogHeader>
        {selectedHistoryDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
              <div>
                <span className="text-muted-foreground block">Abierta:</span>
                <span className="font-semibold">
                  {selectedHistoryDetails.session?.openedAt
                    ? formatDateTime(selectedHistoryDetails.session.openedAt)
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Cerrada:</span>
                <span className="font-semibold">
                  {selectedHistoryDetails.session?.closedAt
                    ? formatDateTime(selectedHistoryDetails.session.closedAt)
                    : 'Abierta'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Monto Inicial:</span>
                <span className="font-semibold">${selectedHistoryDetails.session?.openingAmount}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Cierre Real:</span>
                <span className="font-semibold">
                  ${selectedHistoryDetails.session?.actualClosingAmount || '-'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Diferencia:</span>
                <span className="font-semibold text-primary">
                  ${selectedHistoryDetails.session?.difference || '0.00'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Notas:</span>
                <span className="font-medium text-xs block max-w-xs">
                  {selectedHistoryDetails.session?.notes || '-'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Movimientos Registrados</h4>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedHistoryDetails.movements.map((move) => {
                      const isIncome = move.movementType === 'INCOME'
                      return (
                        <TableRow key={move.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(move.createdAt).split(', ')[1]}
                          </TableCell>
                          <TableCell className="font-medium">{move.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{move.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>
                            {isIncome ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none flex w-fit items-center gap-0.5">
                                <ArrowUpRight className="size-3" /> Ingreso
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-600 border-none flex w-fit items-center gap-0.5">
                                <ArrowDownLeft className="size-3" /> Egreso
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}${move.amount}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

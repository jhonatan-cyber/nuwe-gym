import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Badge } from '#/shared/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { formatDateTime } from '#/shared/lib/formatters.ts'

interface Movement {
  id: string
  movementType: string
  paymentMethod: string
  amount: string
  description: string | null
  createdAt: Date
}

interface MovementsTableProps {
  movements: Movement[] | undefined
  isLoading: boolean
}

export function CashRegisterMovementsTable({ movements, isLoading }: MovementsTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando movimientos...
      </div>
    )
  }

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay movimientos en esta sesión.
      </div>
    )
  }

  return (
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
        {movements.map((move) => {
          const isIncome = move.movementType === 'INCOME'
          return (
            <TableRow key={move.id}>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(move.createdAt).split(', ')[1]}
              </TableCell>
              <TableCell className="font-medium">{move.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {move.paymentMethod}
                </Badge>
              </TableCell>
              <TableCell>
                {isIncome ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none flex w-fit items-center gap-0.5">
                    <ArrowUpRight className="size-3" /> Ingreso
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-none flex w-fit items-center gap-0.5">
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
  )
}

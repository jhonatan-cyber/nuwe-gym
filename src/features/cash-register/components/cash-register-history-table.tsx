import { Button } from '#/shared/components/ui/button'
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

interface HistorySession {
  id: string
  openedAt: Date
  closedAt: Date | null
  openingAmount: string
  expectedClosingAmount: string | null
  actualClosingAmount: string | null
  difference: string | null
}

interface HistoryTableProps {
  sessions: HistorySession[]
  isLoading: boolean
  onViewDetails: (id: string) => void
}

export function CashRegisterHistoryTable({ sessions, isLoading, onViewDetails }: HistoryTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-6 text-muted-foreground">Cargando historial...</div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">No hay sesiones pasadas registradas.</div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Abierta</TableHead>
          <TableHead>Cerrada</TableHead>
          <TableHead>Apertura</TableHead>
          <TableHead>Esperado</TableHead>
          <TableHead>Cierre Real</TableHead>
          <TableHead>Diferencia</TableHead>
          <TableHead className="text-right">Detalles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => {
          const diffNum = Number(session.difference) || 0
          return (
            <TableRow key={session.id}>
              <TableCell className="text-xs">{formatDateTime(session.openedAt)}</TableCell>
              <TableCell className="text-xs">
                {session.closedAt ? formatDateTime(session.closedAt) : 'Sesión Activa'}
              </TableCell>
              <TableCell>${session.openingAmount}</TableCell>
              <TableCell>${session.expectedClosingAmount || '-'}</TableCell>
              <TableCell>${session.actualClosingAmount || '-'}</TableCell>
              <TableCell>
                {session.closedAt ? (
                  diffNum === 0 ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none">Concordante</Badge>
                  ) : diffNum > 0 ? (
                    <Badge className="bg-teal-500/10 text-teal-600 border-none">+${session.difference}</Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-none">
                      -${Math.abs(diffNum).toFixed(2)}
                    </Badge>
                  )
                ) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => onViewDetails(session.id)}>
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

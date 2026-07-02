import { BarChart3, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { ResultsCount } from '#/shared/components/ui/results-count'
import { formatDateTime } from '#/shared/lib/formatters.ts'
import { getMovementBadge, getMovementIcon } from '../utils.tsx'

interface Movement {
  id: string
  createdAt: Date
  movementType: string
  quantity: number
  previousStock: number
  newStock: number
  notes?: string | null
  referenceType?: string | null
  referenceId?: string | null
  batchNumber?: string | null
  product: { name: string }
  createdBy: { name: string }
}

interface KardexTableProps {
  movements: Movement[]
  searchTerm: string
  isLoading: boolean
}

export function KardexTable({
  movements,
  searchTerm,
  isLoading,
}: KardexTableProps) {
  const filtered = movements.filter((move) =>
    move.product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="bg-card rounded-4xl border border-border/10 shadow-xl p-5 flex flex-col gap-4 min-h-[60vh]">
      <div className="flex items-center justify-between">
        <ResultsCount count={filtered.length} label="movimiento" />
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          Historial de Stock
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner size="md" label="Cargando movimientos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={
            searchTerm
              ? 'No se encontraron movimientos'
              : 'No hay movimientos registrados'
          }
          description="Los movimientos aparecen cuando se ajusta stock, se compra o se vende."
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/10">
                <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Fecha
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Producto
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Tipo
                </th>
                <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Cant.
                </th>
                <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Stock Prev.
                </th>
                <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Stock Post.
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Lote
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Operador
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((move) => {
                const qty = Number(move.quantity)
                const isPositive = qty > 0
                return (
                  <tr
                    key={move.id}
                    className="border-b border-border/5 hover:bg-background/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(move.createdAt)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs">
                      {move.product.name}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {getMovementIcon(move.movementType)}
                        {getMovementBadge(move.movementType)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownLeft className="size-3" />
                        )}
                        {isPositive ? `+${qty}` : qty}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-muted-foreground font-mono">
                      {move.previousStock}
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-mono font-semibold">
                      {move.newStock}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground font-mono">
                      {move.batchNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {move.createdBy.name}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {move.notes ||
                        (move.referenceType
                          ? `${move.referenceType} #${move.referenceId}`
                          : '-')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

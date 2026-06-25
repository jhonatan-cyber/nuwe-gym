import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Warehouse, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { getInventoryMovements } from '#/features/inventory/server.ts'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { SearchInput } from '#/shared/components/search-input'
import { DataTable } from '#/shared/components/data-table'
import { formatDateTime } from '#/shared/lib/formatters.ts'

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => getInventoryMovements(),
  })

  const filteredMovements = movements.filter(
    (move: (typeof movements)[number]) => {
      const prodName = move.product.name.toLowerCase()
      return prodName.includes(searchTerm.toLowerCase())
    },
  )

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">
            COMPRA
          </Badge>
        )
      case 'SALE':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-none font-bold">
            VENTA
          </Badge>
        )
      case 'MANUAL_ADJUSTMENT':
        return (
          <Badge variant="outline" className="text-muted-foreground font-bold">
            AJUSTE
          </Badge>
        )
      case 'LOSS':
        return (
          <Badge
            variant="destructive"
            className="bg-red-500/10 text-red-600 border-none font-bold"
          >
            PÉRDIDA
          </Badge>
        )
      case 'RETURN':
        return (
          <Badge className="bg-teal-500/10 text-teal-600 border-none font-bold">
            DEVOLUCIÓN
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kardex de Inventario"
        description="Auditoría de todos los movimientos de stock y entradas/salidas de mercadería."
        icon={<Warehouse className="size-8 text-primary" />}
      />

      <div className="flex gap-4 items-center">
        <SearchInput
          placeholder="Buscar por Nombre de Producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-sm"
        />
      </div>

      <DataTable
        columns={[
          {
            key: 'date',
            label: 'Fecha',
            render: (move: (typeof filteredMovements)[number]) => (
              <span className="text-xs">{formatDateTime(move.createdAt)}</span>
            ),
          },
          {
            key: 'product',
            label: 'Producto',
            render: (move: (typeof filteredMovements)[number]) => (
              <span className="font-semibold">{move.product.name}</span>
            ),
          },
          {
            key: 'type',
            label: 'Tipo Mov.',
            render: (move: (typeof filteredMovements)[number]) =>
              getMovementBadge(move.movementType),
          },
          {
            key: 'qty',
            label: 'Cant.',
            className: 'text-center',
            render: (move: (typeof filteredMovements)[number]) => {
              const qty = Number(move.quantity)
              const isPositive = qty > 0
              return (
                <span
                  className={`inline-flex items-center gap-0.5 font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownLeft className="size-3" />
                  )}
                  {isPositive ? `+${qty}` : qty}
                </span>
              )
            },
          },
          {
            key: 'prevStock',
            label: 'Stock Prev.',
            className: 'text-center',
            headerClassName: 'text-center',
            render: (move: (typeof filteredMovements)[number]) => (
              <span className="text-muted-foreground font-mono text-xs">
                {move.previousStock}
              </span>
            ),
          },
          {
            key: 'newStock',
            label: 'Stock Post.',
            className: 'text-center',
            headerClassName: 'text-center',
            render: (move: (typeof filteredMovements)[number]) => (
              <span className="font-mono font-semibold text-xs">
                {move.newStock}
              </span>
            ),
          },
          {
            key: 'operator',
            label: 'Operador',
            render: (move: (typeof filteredMovements)[number]) => (
              <span className="text-xs text-muted-foreground">
                {move.createdBy.name}
              </span>
            ),
          },
          {
            key: 'details',
            label: 'Detalles / Referencia',
            render: (move: (typeof filteredMovements)[number]) => (
              <span className="text-xs text-muted-foreground max-w-xs truncate">
                {move.notes ||
                  (move.referenceType
                    ? `${move.referenceType} #${move.referenceId}`
                    : '-')}
              </span>
            ),
          },
        ]}
        data={filteredMovements}
        isLoading={isLoading}
        loadingMessage="Cargando historial de inventario..."
        emptyMessage="No se registraron movimientos de inventario."
        keyExtractor={(move: (typeof filteredMovements)[number]) => move.id}
      />
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Eye } from 'lucide-react'
import { getRecentSales } from '#/features/sales/server.ts'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import { PageHeader } from '#/shared/components/page-header'
import { SearchInput } from '#/shared/components/search-input'
import { DataTable } from '#/shared/components/data-table'
import { formatDateTime } from '#/shared/lib/formatters.ts'
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

export function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSale, setSelectedSale] = useState<
    (typeof salesList)[number] | null
  >(null)

  const { data: salesList = [], isLoading } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => getRecentSales(),
  })

  const filteredSales = salesList.filter((sale: (typeof salesList)[number]) => {
    const saleNum = sale.saleNumber.toLowerCase()
    const client = (
      sale.member?.fullName ||
      sale.customerName ||
      ''
    ).toLowerCase()
    const search = searchTerm.toLowerCase()
    return saleNum.includes(search) || client.includes(search)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Ventas"
        description="Listado de tickets de buffet y punto de venta del gimnasio."
        icon={<ShoppingBag className="size-8 text-primary" />}
      />

      <div className="flex gap-4 items-center">
        <SearchInput
          placeholder="Buscar por N° Venta o Cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-sm"
        />
      </div>

      <DataTable
        columns={[
          {
            key: 'saleNumber',
            label: 'N° Venta',
            render: (sale: (typeof salesList)[number]) => (
              <span className="font-mono text-sm font-semibold">
                {sale.saleNumber}
              </span>
            ),
          },
          {
            key: 'date',
            label: 'Fecha',
            render: (sale: (typeof salesList)[number]) => (
              <span className="text-xs">{formatDateTime(sale.soldAt)}</span>
            ),
          },
          {
            key: 'client',
            label: 'Cliente / Socio',
            render: (sale: (typeof salesList)[number]) =>
              sale.member ? (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">
                    {sale.member.fullName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Socio #{sale.member.id}
                  </span>
                </div>
              ) : (
                <span>{sale.customerName || 'Cliente General'}</span>
              ),
          },
          {
            key: 'seller',
            label: 'Atendido por',
            render: (sale: (typeof salesList)[number]) => (
              <span className="text-xs text-muted-foreground">
                {sale.user.name}
              </span>
            ),
          },
          {
            key: 'method',
            label: 'Método',
            render: (sale: (typeof salesList)[number]) => (
              <Badge variant="outline">{sale.paymentMethod}</Badge>
            ),
          },
          {
            key: 'total',
            label: 'Total',
            render: (sale: (typeof salesList)[number]) => (
              <span className="font-bold text-primary">${sale.total}</span>
            ),
          },
          {
            key: 'actions',
            label: 'Detalles',
            className: 'text-right',
            render: (sale: (typeof salesList)[number]) => (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedSale(sale)}
              >
                <Eye className="size-4" />
              </Button>
            ),
          },
        ]}
        data={filteredSales}
        isLoading={isLoading}
        loadingMessage="Cargando ventas..."
        emptyMessage="No se encontraron ventas."
        keyExtractor={(sale: (typeof salesList)[number]) => sale.id}
      />

      <Dialog
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detalle de Venta {selectedSale?.saleNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3 font-mono">
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Fecha/Hora:
                  </span>
                  <span>{formatDateTime(selectedSale.soldAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Cliente:
                  </span>
                  <span>
                    {selectedSale.member?.fullName ||
                      selectedSale.customerName ||
                      'Cliente General'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Vendedor:
                  </span>
                  <span>{selectedSale.user.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Método de Pago:
                  </span>
                  <span>{selectedSale.paymentMethod}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Artículos</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="py-2">Prod</TableHead>
                        <TableHead className="py-2 text-center">Cant</TableHead>
                        <TableHead className="py-2 text-right">
                          Precio
                        </TableHead>
                        <TableHead className="py-2 text-right">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map(
                        (
                          item: NonNullable<
                            (typeof salesList)[number]['items']
                          >[number],
                        ) => (
                          <TableRow key={item.id}>
                            <TableCell className="py-2 font-medium text-xs max-w-[150px] truncate">
                              {item.product.name}
                            </TableCell>
                            <TableCell className="py-2 text-center text-xs">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="py-2 text-right text-xs">
                              ${item.unitPrice}
                            </TableCell>
                            <TableCell className="py-2 text-right text-xs font-semibold">
                              ${item.subtotal}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1.5 text-sm font-mono">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-sans">Subtotal:</span>
                  <span>${selectedSale.subtotal}</span>
                </div>
                {Number(selectedSale.discount) > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span className="font-sans">Descuento:</span>
                    <span>-${selectedSale.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1 font-sans">
                  <span>Total:</span>
                  <span className="text-primary">${selectedSale.total}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight,
  ShoppingBag,
  Eye,
  TrendingUp,
  DollarSign,
  Receipt,
  List,
  BarChart3,
  Calendar,
  Users,
  User,
} from 'lucide-react'
import { getRecentSales, getSaleStats } from '#/features/sales/server.ts'
import { useDebounce } from '#/shared/hooks/use-debounce.ts'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import { DataTable } from '#/shared/components/data-table'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { formatCurrency, formatDateTime } from '#/shared/lib/formatters.ts'
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
import { DailySummaryView } from '#/features/sales/daily-summary-view.tsx'
import type { Sale, StatusFilter } from '#/features/sales/types.ts'

export function SalesPage() {
  const [activeView, setActiveView] = useState<'history' | 'summary'>('history')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: salesList = [], isLoading } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => getRecentSales(),
  })

  const { data: stats } = useQuery({
    queryKey: ['sale-stats'],
    queryFn: () => getSaleStats(),
  })

  const filteredSales = salesList.filter((sale) => {
    if (filterStatus !== 'ALL' && sale.status !== filterStatus) return false

    const saleNum = sale.saleNumber.toLowerCase()
    const client = (
      sale.member?.fullName ||
      sale.customerName ||
      ''
    ).toLowerCase()
    const search = debouncedSearch.toLowerCase()
    if (!search) return true
    return saleNum.includes(search) || client.includes(search)
  })

  const statusLabel =
    filterStatus === 'ALL'
      ? 'Todas las Ventas'
      : filterStatus === 'COMPLETED'
        ? 'Completadas'
        : filterStatus === 'CANCELLED'
          ? 'Canceladas'
          : 'Reembolsadas'

  const statusBadge = (status: string | null) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">
            Completada
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="text-[10px] font-bold">
            Cancelada
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-bold">
            Reembolsada
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        )
    }
  }

  const paymentLabel = (method: string | null) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo'
      case 'QR':
        return 'QR'
      case 'TRANSFER':
        return 'Transferencia'
      case 'CARD':
        return 'Tarjeta'
      default:
        return method || '—'
    }
  }

  const breadcrumbLabel =
    activeView === 'history' ? 'Historial' : 'Resumen Diario'
  const titleLabel =
    activeView === 'history'
      ? 'Historial de Ventas'
      : 'Resumen Diario de Ventas'

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Ventas</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">{breadcrumbLabel}</span>
        </div>
      }
      title={titleLabel}
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <ToggleGroup
            type="single"
            value={activeView}
            onValueChange={(v) => {
              if (v === 'history' || v === 'summary') setActiveView(v)
            }}
          >
            <ToggleGroupItem value="history">
              <List className="size-3.5" /> Historial
            </ToggleGroupItem>
            <ToggleGroupItem value="summary">
              <BarChart3 className="size-3.5" /> Resumen
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Métricas
            </p>
            <div className="grid grid-cols-1 gap-3">
              <StatCard
                label="Total Ventas"
                value={stats?.totalSales ?? 0}
                icon={ShoppingBag}
                variant="default"
              />
              <StatCard
                label="Ventas Hoy"
                value={stats?.todaySales ?? 0}
                icon={TrendingUp}
                variant="emerald"
              />
              <StatCard
                label="Ingresos Hoy"
                value={formatCurrency(stats?.todayRevenue ?? 0)}
                icon={DollarSign}
                variant="foreground"
              />
              <StatCard
                label="Ingresos Totales"
                value={formatCurrency(stats?.totalRevenue ?? 0)}
                icon={Receipt}
                variant="default"
              />
            </div>
          </div>

          {activeView === 'history' && (
            <FilterBar
              search={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar por N° Venta o Cliente..."
              filterValue={filterStatus}
              onFilterChange={(v) => setFilterStatus(v as StatusFilter)}
              filterOptions={[
                { value: 'ALL', label: 'Todos los Estados' },
                { value: 'COMPLETED', label: 'Completadas' },
                { value: 'CANCELLED', label: 'Canceladas' },
                { value: 'REFUNDED', label: 'Reembolsadas' },
              ]}
              filterPlaceholder="Estado"
            />
          )}
        </div>
      }
    >
      {activeView === 'history' ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-black tracking-tight">
              {filteredSales.length} venta
              {filteredSales.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {statusLabel}
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : filteredSales.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No hay ventas registradas"
              description="Las ventas del buffet y punto de venta aparecerán aquí."
            />
          ) : (
            <TooltipProvider delayDuration={200}>
              <DataTable
                columns={[
                  {
                    key: 'saleNumber',
                    label: (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">N° Venta</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Número único de transacción</p>
                        </TooltipContent>
                      </Tooltip>
                    ),
                    render: (sale: Sale) => (
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold">
                        <Receipt className="size-3 text-muted-foreground" />
                        {sale.saleNumber}
                      </span>
                    ),
                  },
                  {
                    key: 'date',
                    label: 'Fecha',
                    render: (sale: Sale) => (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3 text-muted-foreground" />
                        {formatDateTime(sale.soldAt)}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    label: 'Estado',
                    render: (sale: Sale) => statusBadge(sale.status),
                  },
                  {
                    key: 'client',
                    label: 'Cliente / Socio',
                    render: (sale: Sale) =>
                      sale.member ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 font-medium text-primary text-sm">
                            <Users className="size-3 text-muted-foreground" />
                            {sale.member.fullName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Socio #{sale.member.id}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Users className="size-3 text-muted-foreground" />
                          {sale.customerName || 'Cliente General'}
                        </span>
                      ),
                  },
                  {
                    key: 'seller',
                    label: 'Atendido por',
                    render: (sale: Sale) => (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3 text-muted-foreground" />
                        {sale.user.name}
                      </span>
                    ),
                  },
                  {
                    key: 'method',
                    label: (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">Método</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Método de pago utilizado</p>
                        </TooltipContent>
                      </Tooltip>
                    ),
                    render: (sale: Sale) => (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold"
                      >
                        {paymentLabel(sale.paymentMethod)}
                      </Badge>
                    ),
                  },
                  {
                    key: 'total',
                    label: 'Total',
                    render: (sale: Sale) => (
                      <span className="inline-flex items-center gap-1.5 font-bold text-primary text-sm">
                        <DollarSign className="size-3 text-muted-foreground" />
                        {formatCurrency(sale.total)}
                      </span>
                    ),
                  },
                  {
                    key: 'actions',
                    label: '',
                    className: 'text-right',
                    render: (sale: Sale) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Ver detalle</p>
                        </TooltipContent>
                      </Tooltip>
                    ),
                  },
                ]}
                data={filteredSales}
                isLoading={false}
                loadingMessage="Cargando ventas..."
                emptyMessage="No se encontraron ventas."
                keyExtractor={(sale: Sale) => sale.id}
              />
            </TooltipProvider>
          )}

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
                      <span>{paymentLabel(selectedSale.paymentMethod)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-sans">
                        Estado:
                      </span>
                      <span>{statusBadge(selectedSale.status)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Artículos</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="py-2">Prod</TableHead>
                            <TableHead className="py-2 text-center">
                              Cant
                            </TableHead>
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
                            (item: NonNullable<Sale['items']>[number]) => (
                              <TableRow key={item.id}>
                                <TableCell className="py-2 font-medium text-xs max-w-[150px] truncate">
                                  {item.product.name}
                                </TableCell>
                                <TableCell className="py-2 text-center text-xs">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="py-2 text-right text-xs">
                                  {formatCurrency(item.unitPrice)}
                                </TableCell>
                                <TableCell className="py-2 text-right text-xs font-semibold">
                                  {formatCurrency(item.subtotal)}
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
                      <span>{formatCurrency(selectedSale.subtotal)}</span>
                    </div>
                    {Number(selectedSale.discount) > 0 && (
                      <div className="flex justify-between text-xs text-red-500">
                        <span className="font-sans">Descuento:</span>
                        <span>-{formatCurrency(selectedSale.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-1 font-sans">
                      <span>Total:</span>
                      <span className="text-primary">
                        {formatCurrency(selectedSale.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <DailySummaryView />
      )}
    </ModuleLayout>
  )
}

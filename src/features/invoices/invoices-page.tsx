import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  FileText,
  Eye,
  XCircle,
  FileSpreadsheet,
  DollarSign,
} from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Button } from '#/shared/components/ui/button'
import { DataTable } from '#/shared/components/data-table'
import { Badge } from '#/shared/components/ui/badge'
import { StatCard } from '#/shared/components/ui/stat-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'
import { getInvoices, getInvoiceById, cancelInvoice, getInvoiceStats } from './server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'
import { cn } from '#/shared/lib/utils.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null)

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', branchId],
    queryFn: () => getInvoices({ data: { branchId: branchId ?? null } }),
  })

  const { data: stats } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => getInvoiceStats({}),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast.success('Factura anulada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Facturación</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Facturas</span>
          </div>
        }
        title="Facturas"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  label="Total Facturas"
                  value={stats?.total ?? 0}
                  icon={FileText}
                  variant="default"
                />
                <StatCard
                  label="Emitidas"
                  value={stats?.issued ?? 0}
                  icon={FileSpreadsheet}
                  variant="emerald"
                />
                <StatCard
                  label="Anuladas"
                  value={stats?.canceled ?? 0}
                  icon={XCircle}
                  variant="orange"
                />
                <StatCard
                  label="Total Facturado"
                  value={formatCurrency(stats?.totalAmount ?? 0)}
                  icon={DollarSign}
                  variant="foreground"
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Información
              </p>
              <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                Las facturas se generan automáticamente al registrar pagos de membresía y ventas.
              </p>
            </div>
          </div>
        }
      >
        <TooltipProvider delayDuration={200}>
          <DataTable
            columns={[
              {
                key: 'number',
                label: 'N° Factura',
                render: (inv: any) => (
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <FileText className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm font-mono">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(inv.issuedAt)}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'customer',
                label: 'Cliente',
                render: (inv: any) => (
                  <div className="text-xs min-w-0">
                    <p className="font-semibold truncate">{inv.customerName ?? '—'}</p>
                    {inv.customerDocNumber && (
                      <p className="text-[10px] text-muted-foreground">CI: {inv.customerDocNumber}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'source',
                label: 'Origen',
                render: (inv: any) => (
                  <Badge className={cn(
                    'text-[10px] font-bold',
                    inv.sourceType === 'MEMBERSHIP_PAYMENT'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                  )}>
                    {inv.sourceType === 'MEMBERSHIP_PAYMENT' ? 'Membresía' : 'Venta'}
                  </Badge>
                ),
              },
              {
                key: 'total',
                label: 'Total',
                render: (inv: any) => (
                  <span className="font-bold text-sm">{formatCurrency(inv.total)}</span>
                ),
              },
              {
                key: 'status',
                label: 'Estado',
                render: (inv: any) => (
                  <Badge className={cn(
                    'text-[10px] font-bold',
                    inv.status === 'ISSUED'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20',
                  )}>
                    {inv.status === 'ISSUED' ? 'Emitida' : 'Anulada'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                label: '',
                className: 'text-right',
                render: (inv: any) => (
                  <div className="flex justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          onClick={() => setViewInvoiceId(inv.id)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Ver detalle</p></TooltipContent>
                    </Tooltip>
                    {inv.status === 'ISSUED' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm('¿Anular esta factura?')) {
                                cancelMutation.mutate({ data: { id: inv.id } })
                              }
                            }}
                          >
                            <XCircle className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p>Anular</p></TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ),
              },
            ]}
            data={invoices}
            isLoading={isLoading}
            loadingMessage="Cargando facturas..."
            emptyMessage="No hay facturas emitidas."
            keyExtractor={(inv: any) => inv.id}
            skeletonRows={5}
          />
        </TooltipProvider>
      </ModuleLayout>

      <InvoiceDetailDialog
        invoiceId={viewInvoiceId}
        onOpenChange={(o) => { if (!o) setViewInvoiceId(null) }}
      />
    </>
  )
}

function InvoiceDetailDialog({
  invoiceId,
  onOpenChange,
}: {
  invoiceId: string | null
  onOpenChange: (o: boolean) => void
}) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => getInvoiceById({ data: invoiceId! }),
    enabled: !!invoiceId,
  })

  return (
    <Dialog open={!!invoiceId} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            {isLoading ? 'Cargando...' : `Factura ${invoice?.invoiceNumber ?? ''}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : invoice ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Estado</span>
                <Badge className={cn(
                  'text-[10px] font-bold',
                  invoice.status === 'ISSUED'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20',
                )}>
                  {invoice.status === 'ISSUED' ? 'Emitida' : 'Anulada'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">N° Factura</span>
                <span className="font-mono font-bold text-sm">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fecha</span>
                <span className="font-semibold text-sm">{formatDate(invoice.issuedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Origen</span>
                <Badge className={cn(
                  'text-[10px] font-bold',
                  invoice.sourceType === 'MEMBERSHIP_PAYMENT'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                )}>
                  {invoice.sourceType === 'MEMBERSHIP_PAYMENT' ? 'Pago Membresía' : 'Venta'}
                </Badge>
              </div>
            </div>

            {/* Customer */}
            <div className="p-4 rounded-xl bg-muted/30 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Cliente</p>
              <p className="font-bold text-sm">{invoice.customerName}</p>
              {invoice.customerDocNumber && (
                <p className="text-xs text-muted-foreground">CI/Doc: {invoice.customerDocNumber}</p>
              )}
              {invoice.member?.phone && (
                <p className="text-xs text-muted-foreground">Tel: {invoice.member.phone}</p>
              )}
              {invoice.member?.email && (
                <p className="text-xs text-muted-foreground">Email: {invoice.member.email}</p>
              )}
            </div>

            {/* Amounts */}
            <div className="p-4 rounded-xl bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-sm">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {Number(invoice.taxRate) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">IVA ({invoice.taxRate}%)</span>
                  <span className="font-semibold text-sm">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {Number(invoice.discount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Descuento</span>
                  <span className="font-semibold text-sm text-red-500">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-dashed dark:border-white/[0.06] border-black/[0.06]">
                <span className="text-xs font-bold">Total</span>
                <span className="font-black text-lg">{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {/* Source details */}
            {invoice.sourceDetail && invoice.sourceType === 'SALE' && 'items' in invoice.sourceDetail && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Items</p>
                {invoice.sourceDetail.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{item.product?.name ?? 'Producto'}</p>
                      <p className="text-[10px] text-muted-foreground">x{item.quantity} @ {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <span className="font-bold text-xs">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            {invoice.notes && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Notas</p>
                <p className="text-xs text-muted-foreground mt-1">{invoice.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-destructive">Factura no encontrada</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

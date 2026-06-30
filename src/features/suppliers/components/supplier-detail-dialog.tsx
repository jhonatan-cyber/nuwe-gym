import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  Calendar,
  RefreshCw,
  CircleCheck,
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { cn } from '#/shared/lib/utils.ts'
import { formatDate, formatCurrency } from '#/shared/lib/formatters.ts'
import { useQuery } from '@tanstack/react-query'
import { getSupplierById, getSupplierPurchases } from '#/features/suppliers/server.ts'

interface SupplierDetailDialogProps {
  supplierId: string | null
  onOpenChange: (open: boolean) => void
}

export function SupplierDetailDialog({
  supplierId,
  onOpenChange,
}: SupplierDetailDialogProps) {
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['supplier-detail', supplierId],
    queryFn: () => getSupplierById({ data: supplierId! }),
    enabled: !!supplierId,
  })

  const { data: purchaseData, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['supplier-purchases', supplierId],
    queryFn: () => getSupplierPurchases({ data: supplierId! }),
    enabled: !!supplierId,
  })

  const isLoading = isLoadingSupplier || isLoadingPurchases

  return (
    <Dialog
      open={!!supplierId}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span className="text-sm">Cargando datos del proveedor...</span>
          </div>
        ) : supplier ? (
          <>
            {/* ── Hero header ── */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b dark:border-white/5 border-black/5 shrink-0">
              <div className="absolute inset-0 bg-linear-to-br from-foreground/3 to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center font-black text-xl uppercase shrink-0 text-primary tracking-wider shadow-inner select-none">
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h2 className="text-lg font-black dark:text-white text-foreground tracking-tight leading-none truncate">
                      {supplier.name}
                    </h2>
                    <Badge
                      className={cn(
                        'font-bold text-[10px] py-0.5 px-2.5 rounded-full select-none shrink-0',
                        supplier.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 border-red-500/20',
                      )}
                    >
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {supplier.email || 'Sin email'} · Registrado{' '}
                    {formatDate(supplier.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
              {/* Info del proveedor */}
              <section>
                <SectionTitle icon={Building2} label="Información del Proveedor" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-3">
                  <DataRow icon={Building2} label="Nombre" value={supplier.name} />
                  <DataRow icon={Mail} label="Email" value={supplier.email || '—'} />
                  <DataRow icon={Phone} label="Teléfono" value={supplier.phone || '—'} />
                  <DataRow icon={MapPin} label="Dirección" value={supplier.address || '—'} />
                  <DataRow icon={StickyNote} label="Notas" value={supplier.notes || '—'} />
                  <DataRow icon={CircleCheck} label="Estado" value={supplier.isActive ? 'Activo' : 'Inactivo'} />
                  <DataRow icon={Calendar} label="Registro" value={formatDate(supplier.createdAt)} />
                  <DataRow icon={RefreshCw} label="Última actualización" value={formatDate(supplier.updatedAt)} />
                </div>
              </section>

              {/* Estadísticas de compras */}
              {purchaseData && (
                <section>
                  <SectionTitle icon={TrendingUp} label="Resumen de Compras" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <StatBox
                      icon={DollarSign}
                      label="Total Gastado"
                      value={formatCurrency(purchaseData.stats.totalSpend)}
                      variant="emerald"
                    />
                    <StatBox
                      icon={ShoppingCart}
                      label="Órdenes"
                      value={String(purchaseData.stats.totalOrders)}
                      variant="default"
                    />
                    <StatBox
                      icon={TrendingUp}
                      label="Promedio/Orden"
                      value={formatCurrency(purchaseData.stats.avgOrderValue)}
                      variant="default"
                    />
                    <StatBox
                      icon={Calendar}
                      label="Última Compra"
                      value={formatDate(purchaseData.stats.lastPurchaseDate)}
                      variant="default"
                    />
                  </div>
                </section>
              )}

              {/* Historial de compras */}
              {purchaseData && purchaseData.purchases.length > 0 && (
                <section>
                  <SectionTitle icon={Package} label="Historial de Compras" />
                  <div className="mt-3 space-y-2">
                    {purchaseData.purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border dark:border-white/6 border-black/6 bg-foreground/2 hover:bg-foreground/3 transition-colors"
                      >
                        <div className="size-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0">
                          <Package className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">
                              #{purchase.purchaseNumber}
                            </p>
                            <Badge className="text-[9px] font-bold py-0 px-1.5 rounded bg-foreground/10 text-foreground border-foreground/20">
                              {purchase.items.length} {purchase.items.length === 1 ? 'artículo' : 'artículos'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            <Calendar className="size-2.5 inline mr-0.5" />
                            {formatDate(purchase.purchasedAt)}
                            {purchase.notes && (
                              <>
                                <span className="mx-1 opacity-30">·</span>
                                {purchase.notes}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(purchase.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {purchaseData && purchaseData.purchases.length === 0 && (
                <section>
                  <SectionTitle icon={Package} label="Historial de Compras" />
                  <div className="mt-3 py-8 rounded-2xl border dark:border-white/4 border-black/4 bg-muted/40 text-center text-sm text-muted-foreground">
                    Sin compras registradas para este proveedor.
                  </div>
                </section>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t dark:border-white/5 border-black/5 flex justify-center items-center shrink-0 w-full">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-destructive text-sm">
            Error al cargar el proveedor
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Shared sub-components ──────────────────────────────────────────

interface SectionTitleProps {
  icon: LucideIcon
  label: string
}

function SectionTitle({ icon: Icon, label }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-primary" />
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </h4>
    </div>
  )
}

interface DataRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function DataRow({ icon: Icon, label, value }: DataRowProps) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="size-6 rounded-md dark:bg-white/5 bg-black/5 border dark:border-white/6 border-black/6 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
          {label}
        </p>
        <p className="font-semibold text-sm mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

interface StatBoxProps {
  icon: LucideIcon
  label: string
  value: string
  variant?: 'default' | 'emerald'
}

function StatBox({ icon: Icon, label, value, variant = 'default' }: StatBoxProps) {
  return (
    <div className="relative overflow-hidden bg-muted/60 p-3.5 rounded-xl border border-border/10 shadow-sm group">
      <div className="space-y-0.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            'text-lg font-black tracking-tight',
            variant === 'emerald' ? 'text-emerald-500' : 'text-foreground',
          )}
        >
          {value}
        </p>
      </div>
      <div className="absolute -bottom-1 -right-1 size-8 rounded-lg bg-foreground/5 flex items-center justify-center opacity-30">
        <Icon className="size-4 text-muted-foreground" />
      </div>
    </div>
  )
}

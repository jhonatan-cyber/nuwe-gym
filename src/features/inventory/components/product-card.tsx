import { Package, Edit, ArrowUpDown } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#/shared/components/ui/tooltip'
import { TrendBadge } from '#/shared/components/ui/trend-badge'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { getStockBadge } from '../utils.tsx'

interface ProductCardProps {
  product: {
    id: string
    name: string
    sku: string
    barcode?: string | null
    salePrice: string
    purchasePrice: string
    imageUrl?: string | null
    isActive: boolean
    stockCurrent: number
    stockMinimum: number
    category: { name: string }
  }
  trend?: {
    change: number
    changePercent: number
    currentStock: number
    previousStock: number
  } | null
  isAdmin: boolean
  trendDays: number
  onEdit: (product: any) => void
  onAdjust: (product: any) => void
}

export function ProductCard({
  product,
  trend,
  isAdmin,
  trendDays,
  onEdit,
  onAdjust,
}: ProductCardProps) {
  return (
    <div
      className={`group flex flex-col p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
        !product.isActive
          ? 'border-border/5 bg-muted/30 opacity-60'
          : 'border-border/10 bg-background/50 hover:border-border/20'
      }`}
    >
      {product.imageUrl ? (
        <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-muted/30">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-32 rounded-xl mb-3 bg-linear-to-br from-primary/5 to-primary/10 flex items-center justify-center">
          <Package className="size-10 text-primary/20" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-black truncate">{product.name}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {getStockBadge(product)}
            {trend && trend.change !== 0 && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <TrendBadge
                    value={trend.change}
                    size="sm"
                    className="cursor-default"
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-3 py-2 max-w-[200px]"
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black">
                      Tendencia {trendDays}d
                    </p>
                    <div className="h-px bg-border/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground font-bold">
                        Stock Anterior
                      </span>
                      <span className="text-[10px] font-bold tabular-nums">
                        {trend.previousStock} uds.
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground font-bold">
                        Stock Actual
                      </span>
                      <span className="text-[10px] font-bold tabular-nums">
                        {trend.currentStock} uds.
                      </span>
                    </div>
                    <div className="h-px bg-border/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground font-bold">
                        Cambio
                      </span>
                      <TrendBadge
                        value={trend.change}
                        percent={trend.changePercent}
                        size="sm"
                        showPercent
                      />
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mb-1">
          SKU: {product.sku}
          {product.barcode && ` · UPC: ${product.barcode}`}
        </p>
        <p className="text-[10px] text-muted-foreground font-semibold mb-2">
          {product.category.name}
        </p>

        <div className="flex items-baseline gap-3">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">
              Venta
            </p>
            <p className="text-base font-black text-primary">
              {formatCurrency(Number(product.salePrice))}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">
              Compra
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              {formatCurrency(Number(product.purchasePrice))}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 rounded-full text-xs font-bold"
          onClick={() => onAdjust(product)}
        >
          <ArrowUpDown className="size-3" /> Stock
        </Button>
        {isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full"
            onClick={() => onEdit(product)}
          >
            <Edit className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

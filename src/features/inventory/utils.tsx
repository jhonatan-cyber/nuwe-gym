import {
  Package,
  ShoppingCart,
  Wrench,
  TrendingDown,
  RotateCcw,
  ArrowUpDown,
  Minus,
  AlertTriangle,
  Box,
} from 'lucide-react'
import { Badge } from '#/shared/components/ui/badge'

export function getMovementBadge(type: string) {
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
        <Badge className="bg-red-500/10 text-red-600 border-none font-bold">
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

export function getMovementIcon(type: string) {
  switch (type) {
    case 'PURCHASE':
      return <ShoppingCart className="size-3.5 text-emerald-500" />
    case 'SALE':
      return <Package className="size-3.5 text-blue-500" />
    case 'MANUAL_ADJUSTMENT':
      return <Wrench className="size-3.5 text-muted-foreground" />
    case 'LOSS':
      return <TrendingDown className="size-3.5 text-red-500" />
    case 'RETURN':
      return <RotateCcw className="size-3.5 text-teal-500" />
    default:
      return <ArrowUpDown className="size-3.5" />
  }
}

export function getStockBadge(product: {
  stockCurrent: number
  stockMinimum: number
}) {
  if (product.stockCurrent <= 0) {
    return (
      <Badge className="bg-red-500/10 text-red-600 border-none font-bold gap-0.5">
        <Minus className="size-2.5" /> Agotado
      </Badge>
    )
  }
  if (product.stockCurrent <= product.stockMinimum) {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold gap-0.5">
        <AlertTriangle className="size-2.5" /> Bajo ({product.stockCurrent})
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold gap-0.5">
      <Box className="size-2.5" /> {product.stockCurrent}
    </Badge>
  )
}

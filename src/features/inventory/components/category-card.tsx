import { Tags, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { TrendBadge } from '#/shared/components/ui/trend-badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#/shared/components/ui/tooltip'

interface CategoryCardProps {
  cat: any
  isSelected: boolean
  catTrend?: { totalChange: number; totalPrev: number }
  trendDays: number
  isAdmin: boolean
  onSelect: (id: string) => void
  onEdit: (cat: any) => void
  onDelete: (cat: any) => void
}

export function CategoryCard({
  cat,
  isSelected,
  catTrend,
  trendDays,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect(cat.id)}
          className={`group flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all duration-300 min-h-[104px] hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${isSelected ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-border/60 hover:text-foreground'}`}
        >
          <div
            className={`size-9 rounded-xl flex items-center justify-center shrink-0 mb-2 transition-all duration-300 ${isSelected ? 'bg-primary text-primary-foreground scale-105 shadow-sm' : 'bg-background/80 border border-border/10 text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:scale-105 shadow-inner'}`}
          >
            <Tags className="size-4" />
          </div>
          <p
            className="text-xs font-black truncate w-full tracking-wide"
            title={cat.name}
          >
            {cat.name}
          </p>
          <span
            className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase transition-colors duration-300 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'}`}
          >
            {cat.productCount || 0} prod
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-4 py-3 max-w-[240px]"
      >
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black">{cat.name}</p>
          <div className="h-px bg-border/10" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold">
              Precio Prom.
            </span>
            <span className="text-xs font-bold text-primary">
              {formatCurrency(cat.avgSalePrice || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold">
              Stock Total
            </span>
            <span className="text-xs font-bold">
              {cat.totalStock || 0} uds.
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold">
              Agotados
            </span>
            <span
              className={`text-xs font-bold ${(cat.outOfStock || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}
            >
              {cat.outOfStock || 0}
            </span>
          </div>
          {catTrend && catTrend.totalChange !== 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold">
                Tendencia {trendDays}d
              </span>
              <TrendBadge
                value={catTrend.totalChange}
                percent={
                  catTrend.totalPrev > 0
                    ? Math.round(
                        (catTrend.totalChange / catTrend.totalPrev) * 100,
                      )
                    : 0
                }
                size="sm"
                showPercent
              />
            </div>
          )}
        </div>
        {isAdmin && <div className="h-px bg-border/10 mt-2 mb-1" />}
        {isAdmin && (
          <div className="flex items-center gap-1 justify-end">
            <span
              role="button"
              tabIndex={0}
              onClick={() => onEdit(cat)}
              className="size-7 rounded-lg flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit className="size-3.5" />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => onDelete(cat)}
              className="size-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

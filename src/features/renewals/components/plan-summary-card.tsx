import { Clock, Calendar } from 'lucide-react'
import { Badge } from '#/shared/components/ui/badge'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'

interface PlanSummaryCardProps {
  title: string
  price: string
  durationDays: number
  startDate?: Date
  endDate?: Date
  status?: 'ACTIVE' | 'EXPIRED'
}

export function PlanSummaryCard({
  title,
  price,
  durationDays,
  startDate,
  endDate,
  status,
}: PlanSummaryCardProps) {
  return (
    <div className="bg-muted/30 dark:bg-muted/10 text-foreground rounded-2xl border border-border/10 p-5 flex items-stretch gap-4.5 shadow-sm select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col justify-center items-center px-2 border-r border-border/10 font-black tracking-widest text-muted-foreground/30 uppercase text-xs shrink-0 select-none">
        <span className="rotate-270 inline-block font-sans tracking-[0.2em] font-extrabold">
          TRAINIX
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm text-foreground truncate">{title}</p>
          {status ? (
            <Badge className={
              status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] uppercase tracking-wide hover:bg-emerald-500/10'
                : 'bg-red-500/10 text-red-500 border-red-500/20 font-bold text-[9px] uppercase tracking-wide hover:bg-red-500/10'
            }>
              {status === 'ACTIVE' ? 'Activo' : 'Vencido'}
            </Badge>
          ) : (
            <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground border-primary/20 font-bold text-[9px] uppercase tracking-wide hover:bg-primary/10">
              Normal
            </Badge>
          )}
        </div>
        <p className="text-2xl font-black tracking-tight text-foreground mt-2">
          {formatCurrency(price)}
        </p>
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span>Tiempo {durationDays} Días</span>
          </div>
          {startDate && endDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                Inicio: {formatDate(startDate)} - Fin: {formatDate(endDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

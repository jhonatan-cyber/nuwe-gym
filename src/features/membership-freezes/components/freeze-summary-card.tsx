import { Snowflake, Calendar, Clock } from 'lucide-react'
import { Badge } from '#/shared/components/ui/badge'
import { formatDate } from '#/shared/lib/formatters.ts'

interface FreezeSummaryCardProps {
  subscriptionName: string
  currentEndDate: Date
  calculatedEndDate: Date
  freezeDays: number
}

export function FreezeSummaryCard({
  subscriptionName,
  currentEndDate,
  calculatedEndDate,
  freezeDays,
}: FreezeSummaryCardProps) {
  return (
    <div className="bg-muted/30 dark:bg-muted/10 text-foreground rounded-2xl border border-border/10 p-5 flex items-stretch gap-4.5 shadow-sm select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col justify-center items-center px-2 border-r border-border/10 font-black tracking-widest text-muted-foreground/30 uppercase text-xs shrink-0 select-none">
        <Snowflake className="size-5 text-sky-500 rotate-12" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm text-foreground truncate">
            {subscriptionName}
          </p>
          <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold text-[9px] uppercase tracking-wide hover:bg-sky-500/10">
            Congelamiento
          </Badge>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
            <span>
              Vence: {formatDate(currentEndDate)} → {formatDate(calculatedEndDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span>Se extiende {freezeDays} días</span>
          </div>
        </div>
      </div>
    </div>
  )
}

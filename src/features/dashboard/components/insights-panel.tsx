import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'
import { getInsights } from '#/features/analytics/server.ts'
import { cn } from '#/shared/lib/utils.ts'
import type { Insight } from '#/features/analytics/types.ts'

const typeConfig = {
  trend_up: { icon: TrendingUp, class: 'text-emerald-500 bg-emerald-500/10' },
  trend_down: { icon: TrendingDown, class: 'text-red-500 bg-red-500/10' },
  anomaly: { icon: AlertTriangle, class: 'text-amber-500 bg-amber-500/10' },
  opportunity: { icon: Lightbulb, class: 'text-blue-500 bg-blue-500/10' },
  alert: { icon: AlertTriangle, class: 'text-red-500 bg-red-500/10' },
}

export function InsightsPanel() {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => getInsights(),
    refetchInterval: 5 * 60 * 1000, // every 5 min
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
        <RefreshCw className="size-3 animate-spin" />
        Analizando datos...
      </div>
    )
  }

  if (insights.length === 0) return null

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1.5">
        <Lightbulb className="size-3" />
        Insights
      </p>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const cfg = typeConfig[insight.type]
          const Icon = cfg.icon
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 rounded-2xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/[0.05] border-black/[0.05]"
            >
              <div
                className={cn(
                  'size-7 rounded-xl flex items-center justify-center shrink-0',
                  cfg.class,
                )}
              >
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold">{insight.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
                <span className="text-[9px] font-bold text-muted-foreground/60 mt-1 block">
                  {insight.metric}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

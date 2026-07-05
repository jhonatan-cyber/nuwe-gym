import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { getDashboardChurnData } from '#/features/dashboard/server.ts'
import { cn } from '#/shared/lib/utils.ts'

const levelColors: Record<string, { bar: string; text: string; bg: string }> = {
  CRITICAL: { bar: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10' },
  HIGH: { bar: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-500/10' },
  MEDIUM: { bar: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  LOW: { bar: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
}

export function ChurnRateWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-churn'],
    queryFn: () => getDashboardChurnData(),
    refetchInterval: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4 min-h-[200px]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded-full bg-accent/60" />
          <div className="h-12 w-28 rounded-2xl bg-accent/60" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-full rounded-full bg-accent/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.distribution.total === 0) return null

  const { distribution, churnRate, topRisks } = data

  return (
    <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black dark:text-white text-foreground">
            Riesgo de Abandono
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            Churn analytics
          </p>
        </div>
        <div
          className={cn(
            'size-8 rounded-xl flex items-center justify-center',
            churnRate >= 30
              ? 'bg-red-500/10 text-red-500'
              : churnRate >= 15
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500',
          )}
        >
          <ShieldAlert className="size-4" />
        </div>
      </div>

      {/* Gauge / big number */}
      <div className="flex items-end gap-3">
        <div className="relative">
          <span
            className={cn(
              'text-5xl font-black tracking-tight leading-none',
              churnRate >= 30
                ? 'text-red-500'
                : churnRate >= 15
                  ? 'text-amber-500'
                  : 'text-emerald-500',
            )}
          >
            {churnRate}%
          </span>
          <span className="text-[9px] text-muted-foreground block mt-1 uppercase tracking-widest">
            Tasa de churn
          </span>
        </div>
        <div className="flex-1 space-y-1.5 pb-1">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((level) => {
            const count = distribution[level.toLowerCase() as keyof typeof distribution]
            if (count === 0) return null
            const pct = distribution.total > 0 ? (count / distribution.total) * 100 : 0
            const colors = levelColors[level]
            return (
              <div key={level} className="flex items-center gap-2 text-[10px]">
                <span className={cn('w-14 font-bold', colors.text)}>{level}</span>
                <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-6 text-right font-bold tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top at-risk members */}
      {topRisks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
            <AlertTriangle className="size-2.5" />
            Mayor riesgo
          </p>
          {topRisks.slice(0, 3).map((risk) => (
            <div
              key={risk.memberId}
              className="flex items-center gap-2 py-1.5 px-2 rounded-xl bg-muted/30 border border-border/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">{risk.memberName}</p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {risk.factors.slice(0, 1).join(', ')}
                </p>
              </div>
              <span
                className={cn(
                  'text-[10px] font-black px-2 py-0.5 rounded-full',
                  levelColors[risk.level]?.bg,
                  levelColors[risk.level]?.text,
                )}
              >
                {risk.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

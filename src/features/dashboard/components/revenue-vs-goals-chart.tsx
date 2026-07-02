import { useQuery } from '@tanstack/react-query'
import { TrendingUp, DollarSign } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { getRevenueTrends } from '#/features/dashboard/server.ts'

export function RevenueVsGoalsChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-revenue-trends'],
    queryFn: () => getRevenueTrends(),
    refetchInterval: 15 * 60 * 1000,
  })

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const themeColors = useMemo(() => {
    if (!mounted) {
      return { grid: isDark ? '#2c2c35' : '#e2e8f0', text: isDark ? '#8c8c9a' : '#64748b', tooltipBg: isDark ? '#121214' : '#fff', tooltipBorder: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, tooltipLabel: isDark ? '#fff' : '#0f172a' }
    }
    const root = getComputedStyle(document.documentElement)
    return {
      grid: root.getPropertyValue('--border').trim() || (isDark ? '#2c2c35' : '#e2e8f0'),
      text: root.getPropertyValue('--muted-foreground').trim() || (isDark ? '#8c8c9a' : '#64748b'),
      tooltipBg: root.getPropertyValue('--popover').trim() || (isDark ? '#121214' : '#fff'),
      tooltipBorder: `1px solid ${root.getPropertyValue('--border').trim() || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
      tooltipLabel: root.getPropertyValue('--popover-foreground').trim() || (isDark ? '#fff' : '#0f172a'),
    }
  }, [resolvedTheme, mounted, isDark])

  const totalRevenue = data?.reduce((acc, d) => acc + d.total, 0) ?? 0
  const avgGoal = data?.reduce((acc, d) => acc + d.goal, 0) ?? 0
  const avgGoalRounded = data && data.length > 0 ? Math.round(avgGoal / data.length) : 0
  const onTrack = data ? data[data.length - 1]?.total >= data[data.length - 1]?.goal : false

  if (isLoading) {
    return (
      <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4 min-h-[260px]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 rounded-full bg-accent/60" />
          <div className="h-[200px] rounded-2xl bg-accent/60" />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) return null

  return (
    <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black dark:text-white text-foreground">
            Ingresos vs Meta
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            Últimos 6 meses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={onTrack ? 'text-emerald-500' : 'text-amber-500'}>
            <TrendingUp className="size-4" />
          </span>
          <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="size-4 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pb-1">
        <div>
          <span className="text-2xl font-black tracking-tight">
            ${totalRevenue.toLocaleString('es-BO')}
          </span>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Total período</p>
        </div>
        <div className="h-8 w-px bg-border/50" />
        <div>
          <span className="text-sm font-bold text-muted-foreground">
            Meta: ${avgGoalRounded.toLocaleString('es-BO')}
          </span>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Promedio mensual</p>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
            <XAxis dataKey="month" stroke={themeColors.text} fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke={themeColors.text} fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: themeColors.tooltipBg,
                border: themeColors.tooltipBorder,
                borderRadius: '14px',
                fontSize: 11,
              }}
              labelStyle={{ color: themeColors.tooltipLabel, fontWeight: 'bold' }}
              formatter={(value: number, name: string) => [`$${value.toLocaleString('es-BO')}`, name === 'membershipIncome' ? 'Membresías' : name === 'posIncome' ? 'POS' : name === 'goal' ? 'Meta' : name]}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 9, paddingTop: 8 }}
            />
            <ReferenceLine
              y={data[data.length - 1]?.goal ?? 0}
              stroke={isDark ? '#fbbf24' : '#f59e0b'}
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: 'Meta', position: 'right', fontSize: 9, fill: isDark ? '#fbbf24' : '#f59e0b' }}
            />
            <Bar dataKey="membershipIncome" name="Membresías" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="posIncome" name="POS" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

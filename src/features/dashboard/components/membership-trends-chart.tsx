import { useQuery } from '@tanstack/react-query'
import { Users, ArrowUp, ArrowDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getMembershipTrends } from '#/features/dashboard/server.ts'
import { cn } from '#/shared/lib/utils.ts'

export function MembershipTrendsChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-membership-trends'],
    queryFn: () => getMembershipTrends(),
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

  if (isLoading) {
    return (
      <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4 min-h-[260px]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded-full bg-accent/60" />
          <div className="h-[200px] rounded-2xl bg-accent/60" />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) return null

  const latest = data[data.length - 1]
  const previous = data.length > 1 ? data[data.length - 2] : null
  const memberChange = previous ? latest.active - previous.active : 0
  const isGrowing = memberChange >= 0

  return (
    <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black dark:text-white text-foreground">
            Membresías
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            Tendencia mensual
          </p>
        </div>
        <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Users className="size-4 text-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-4 pb-1">
        <div>
          <span className="text-2xl font-black tracking-tight">{latest.active}</span>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Activas ahora</p>
        </div>
        {previous && (
          <>
            <div className="h-8 w-px bg-border/50" />
            <div className={cn('flex items-center gap-1', isGrowing ? 'text-emerald-500' : 'text-red-500')}>
              {isGrowing ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              <span className="text-sm font-black">{Math.abs(memberChange)}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">vs mes ant.</span>
            </div>
          </>
        )}
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
            <XAxis dataKey="month" stroke={themeColors.text} fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke={themeColors.text} fontSize={9} tickLine={false} axisLine={false} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: themeColors.tooltipBg,
                border: themeColors.tooltipBorder,
                borderRadius: '14px',
                fontSize: 11,
              }}
              labelStyle={{ color: themeColors.tooltipLabel, fontWeight: 'bold' }}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 9, paddingTop: 8 }}
            />
            <Bar dataKey="newMembers" name="Nuevas" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="expired" name="Vencidas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini line chart overlay for active trend */}
      <div className="h-[60px] w-full -mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 8, left: -22, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

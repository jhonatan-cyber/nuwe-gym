import { useMemo, useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useTheme } from 'next-themes'
import { LazyRecharts } from '#/shared/components/lazy-recharts'

interface HourlyCheckIn {
  hour: string
  '18-25': number
  '26-35': number
  '36-45': number
  '46+': number
}

interface HourlyAttendanceChartProps {
  hourlyCheckIns: HourlyCheckIn[]
}

export function HourlyAttendanceChart({
  hourlyCheckIns,
}: HourlyAttendanceChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for getComputedStyle
  useEffect(() => {
    setMounted(true)
  }, [])

  const themeColors = useMemo(() => {
    if (!mounted) {
      return {
        gridColor: isDark ? '#2c2c35' : '#e2e8f0',
        textColor: isDark ? '#8c8c9a' : '#64748b',
        tooltipBg: isDark ? '#121214' : '#ffffff',
        tooltipBorder: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        tooltipLabelColor: isDark ? '#ffffff' : '#0f172a',
      }
    }
    const rootStyle = getComputedStyle(document.documentElement)
    const gridColor =
      rootStyle.getPropertyValue('--border').trim() ||
      (isDark ? '#2c2c35' : '#e2e8f0')
    const textColor =
      rootStyle.getPropertyValue('--muted-foreground').trim() ||
      (isDark ? '#8c8c9a' : '#64748b')
    const tooltipBg =
      rootStyle.getPropertyValue('--popover').trim() ||
      (isDark ? '#121214' : '#ffffff')
    const tooltipBorder = `1px solid ${rootStyle.getPropertyValue('--border').trim() || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`
    const tooltipLabelColor =
      rootStyle.getPropertyValue('--popover-foreground').trim() ||
      (isDark ? '#ffffff' : '#0f172a')

    return { gridColor, textColor, tooltipBg, tooltipBorder, tooltipLabelColor }
  }, [resolvedTheme, mounted, isDark])

  return (
    <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black dark:text-white text-foreground">
            Asistencia por franja
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            Horarios más transitados
          </p>
        </div>
        <div className="size-8 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
          <TrendingUp className="size-4 text-muted-foreground" />
        </div>
      </div>

      <LazyRecharts height={240}>
        {(R) => (
          <R.ResponsiveContainer width="100%" height="100%">
            <R.BarChart
              data={hourlyCheckIns}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <R.CartesianGrid
                strokeDasharray="3 3"
                stroke={themeColors.gridColor}
                vertical={false}
              />
              <R.XAxis
                dataKey="hour"
                stroke={themeColors.textColor}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <R.YAxis
                stroke={themeColors.textColor}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <R.Tooltip
                contentStyle={{
                  backgroundColor: themeColors.tooltipBg,
                  border: themeColors.tooltipBorder,
                  borderRadius: '14px',
                  fontSize: 11,
                }}
                labelStyle={{
                  color: themeColors.tooltipLabelColor,
                  fontWeight: 'bold',
                }}
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                }}
              />
              <R.Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: 9, paddingTop: 8 }}
              />
              <R.Bar
                dataKey="18-25"
                stackId="a"
                fill="#06b6d4"
                radius={[0, 0, 0, 0]}
              />
              <R.Bar dataKey="26-35" stackId="a" fill="#3b82f6" />
              <R.Bar dataKey="36-45" stackId="a" fill="#6366f1" />
              <R.Bar
                dataKey="46+"
                stackId="a"
                fill="#d946ef"
                radius={[4, 4, 0, 0]}
              />
            </R.BarChart>
          </R.ResponsiveContainer>
        )}
      </LazyRecharts>
    </div>
  )
}

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { useTheme } from 'next-themes'
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Receipt,
  TrendingDown,
  Minus,
  Calendar,
} from 'lucide-react'
import { getDailySalesSummary } from '#/features/sales/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { StatCard } from '#/shared/components/ui/stat-card'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import type { DailySalesSummary } from '#/features/sales/types.ts'

// ── Constants ─────────────────────────────────────────────────────

const PAYMENT_COLORS: Record<string, string> = {
  CASH: '#22c55e',
  QR: '#6366f1',
  TRANSFER: '#f59e0b',
  CARD: '#06b6d4',
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  QR: 'QR',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
}

const CHART_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#06b6d4',
  '#d946ef',
  '#f97316',
]

const formatDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

// ── Theme hook ────────────────────────────────────────────────────

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const rootStyle = useMemo(
    () =>
      typeof document !== 'undefined'
        ? getComputedStyle(document.documentElement)
        : { getPropertyValue: () => '' },
    [resolvedTheme],
  )

  const prop = (key: string, darkFallback: string, lightFallback: string) =>
    rootStyle.getPropertyValue(key).trim() ||
    (isDark ? darkFallback : lightFallback)

  return {
    isDark,
    gridColor: prop('--border', '#2c2c35', '#e2e8f0'),
    textColor: prop('--muted-foreground', '#8c8c9a', '#64748b'),
    tooltipBg: prop('--popover', '#121214', '#ffffff'),
    tooltipBorder: `1px solid ${prop('--border', 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)')}`,
    tooltipLabelColor: prop('--popover-foreground', '#ffffff', '#0f172a'),
  }
}

// ── Card wrapper ──────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="bg-card p-5 rounded-[2rem] border border-border/10 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black dark:text-white text-foreground">
            {title}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            {subtitle}
          </p>
        </div>
        {Icon && (
          <div className="size-8 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function MetricsCards({ data }: { data: DailySalesSummary }) {
  const { todayStats, byPaymentMethod } = data

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Ventas Hoy"
        value={todayStats.total}
        icon={ShoppingBag}
        variant="default"
      />
      <StatCard
        label="Ingresos Hoy"
        value={formatCurrency(todayStats.revenue)}
        icon={DollarSign}
        variant="emerald"
      />
      <StatCard
        label="Ticket Promedio"
        value={formatCurrency(todayStats.avgTicket)}
        icon={TrendingUp}
        variant="foreground"
      />
      <StatCard
        label="Métodos de Pago"
        value={byPaymentMethod.length}
        icon={Receipt}
        variant="default"
      />
    </div>
  )
}

function DailySalesChart({
  data,
  theme,
}: {
  data: DailySalesSummary['dailySales']
  theme: ReturnType<typeof useChartTheme>
}) {
  const {
    gridColor,
    textColor,
    tooltipBg,
    tooltipBorder,
    tooltipLabelColor,
    isDark,
  } = theme

  return (
    <ChartCard
      title="Ventas Diarias (30 días)"
      subtitle="Evolución de ingresos diarios"
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              stroke={textColor}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={textColor}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder,
                borderRadius: '14px',
                fontSize: 11,
              }}
              labelStyle={{ color: tooltipLabelColor, fontWeight: 'bold' }}
              labelFormatter={(l) => formatDateLabel(l)}
              formatter={(value) => formatCurrency(Number(value))}
              cursor={{
                fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Ingresos"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

function PaymentMethodChart({
  data,
  theme,
}: {
  data: DailySalesSummary['byPaymentMethod']
  theme: ReturnType<typeof useChartTheme>
}) {
  const { tooltipBg, tooltipBorder } = theme

  if (data.length === 0) {
    return (
      <ChartCard title="Ventas por Método de Pago" subtitle="Hoy">
        <div className="h-[260px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Sin ventas hoy</p>
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Ventas por Método de Pago" subtitle="Hoy">
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((p) => ({
                name: PAYMENT_LABELS[p.method] || p.method,
                value: p.revenue,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((entry) => (
                <Cell
                  key={entry.method}
                  fill={PAYMENT_COLORS[entry.method] || '#6366f1'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder,
                borderRadius: '14px',
                fontSize: 11,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

function HourlySalesChart({
  data,
  theme,
}: {
  data: DailySalesSummary['byHour']
  theme: ReturnType<typeof useChartTheme>
}) {
  const {
    gridColor,
    textColor,
    tooltipBg,
    tooltipBorder,
    tooltipLabelColor,
    isDark,
  } = theme
  const filtered = data.filter((h) => h.total > 0)

  return (
    <ChartCard title="Ventas por Hora" subtitle="Hoy">
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filtered}
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              stroke={textColor}
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={textColor}
              fontSize={9}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder,
                borderRadius: '14px',
                fontSize: 11,
              }}
              labelStyle={{ color: tooltipLabelColor, fontWeight: 'bold' }}
              formatter={(value, name) =>
                name === 'revenue' ? formatCurrency(Number(value)) : value
              }
              cursor={{
                fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 9, paddingTop: 8 }}
            />
            <Bar
              dataKey="total"
              name="Transacciones"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="revenue"
              name="Ingresos"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

function TopProductsList({ data }: { data: DailySalesSummary['topProducts'] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Productos Más Vendidos" subtitle="Top 5 de hoy">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Sin ventas hoy</p>
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Productos Más Vendidos" subtitle="Top 5 de hoy">
      <div className="flex flex-col gap-2">
        {data.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-muted border border-border/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors group"
          >
            <span className="text-[10px] font-black text-muted-foreground w-4 text-center shrink-0">
              {index + 1}
            </span>
            <div
              className="size-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs dark:text-white text-foreground truncate">
                {product.name}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-black dark:text-white text-foreground">
                {product.quantity}
              </div>
              <p className="text-[9px] text-muted-foreground">uds.</p>
            </div>
            <div className="text-right shrink-0 min-w-[70px]">
              <div className="text-xs font-bold text-primary">
                {formatCurrency(product.revenue)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

function ChangeBadge({ percent }: { percent: number | null }) {
  if (percent === null)
    return <span className="text-[10px] text-muted-foreground">—</span>

  return (
    <div
      className={`inline-flex items-center gap-1 font-bold ${
        percent > 0
          ? 'text-emerald-500'
          : percent < 0
            ? 'text-red-500'
            : 'text-muted-foreground'
      }`}
    >
      {percent > 0 ? (
        <TrendingUp className="size-3" />
      ) : percent < 0 ? (
        <TrendingDown className="size-3" />
      ) : (
        <Minus className="size-3" />
      )}
      {percent > 0 ? '+' : ''}
      {percent.toFixed(1)}%
    </div>
  )
}

function WeeklyComparisonTable({ data }: { data: DailySalesSummary }) {
  const { weeklyComparison, weeklyTotals } = data

  return (
    <ChartCard
      title="Comparativa Semanal"
      subtitle="Esta semana vs. la semana anterior"
      icon={Calendar}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b dark:border-white/10 border-black/10">
              <th className="text-left py-3 px-2 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Día
              </th>
              <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Sem. Anterior
              </th>
              <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Esta Semana
              </th>
              <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Variación
              </th>
            </tr>
          </thead>
          <tbody>
            {weeklyComparison.map((day) => (
              <tr
                key={day.dayName}
                className="border-b dark:border-white/5 border-black/5 hover:dark:bg-white/5 hover:bg-black/5 transition-colors"
              >
                <td className="py-2.5 px-2 font-bold">{day.dayName}</td>
                <td className="py-2.5 px-2 text-right text-muted-foreground">
                  <div>{formatCurrency(day.lastWeekRevenue)}</div>
                  <div className="text-[9px]">
                    {day.lastWeekTotal} venta
                    {day.lastWeekTotal !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right font-medium">
                  <div>{formatCurrency(day.thisWeekRevenue)}</div>
                  <div className="text-[9px] text-muted-foreground">
                    {day.thisWeekTotal} venta
                    {day.thisWeekTotal !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <ChangeBadge percent={day.changePercent} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 dark:border-white/20 border-black/20">
              <td className="py-3 px-2 font-black text-sm">Total</td>
              <td className="py-3 px-2 text-right font-bold">
                <div>{formatCurrency(weeklyTotals.lastWeek.revenue)}</div>
                <div className="text-[9px] text-muted-foreground font-normal">
                  {weeklyTotals.lastWeek.total} venta
                  {weeklyTotals.lastWeek.total !== 1 ? 's' : ''}
                </div>
              </td>
              <td className="py-3 px-2 text-right font-bold text-primary">
                <div>{formatCurrency(weeklyTotals.thisWeek.revenue)}</div>
                <div className="text-[9px] text-muted-foreground font-normal">
                  {weeklyTotals.thisWeek.total} venta
                  {weeklyTotals.thisWeek.total !== 1 ? 's' : ''}
                </div>
              </td>
              <td className="py-3 px-2 text-right">
                <span className="inline-flex items-center gap-1 font-black text-sm">
                  {weeklyTotals.changePercent !== null ? (
                    <ChangeBadge percent={weeklyTotals.changePercent} />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ChartCard>
  )
}

// ── Main view ─────────────────────────────────────────────────────

export function DailySummaryView() {
  const { branchId } = useCurrentBranch()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['daily-sales-summary', branchId],
    queryFn: () => getDailySalesSummary({ data: { branchId } }),
    enabled: !!branchId,
  })

  const theme = useChartTheme()

  if (isLoading)
    return <LoadingSpinner size="lg" label="Cargando resumen diario..." />
  if (isError || !data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Error al cargar resumen"
        description="No se pudieron obtener los datos del resumen diario."
      />
    )
  }

  return (
    <div className="space-y-6">
      <MetricsCards data={data} />

      <div className="grid gap-5 md:grid-cols-2">
        <DailySalesChart data={data.dailySales} theme={theme} />
        <PaymentMethodChart data={data.byPaymentMethod} theme={theme} />
      </div>

      <WeeklyComparisonTable data={data} />

      <div className="grid gap-5 md:grid-cols-2">
        <HourlySalesChart data={data.byHour} theme={theme} />
        <TopProductsList data={data.topProducts} />
      </div>
    </div>
  )
}

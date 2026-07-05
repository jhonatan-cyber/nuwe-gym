import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { ErrorState } from '#/shared/components/ui/error-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import {
  DollarSign,
  Users,
  DoorOpen,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChartIcon,
  FileBarChart,
  Printer,
  Dumbbell,
  PiggyBank,
} from 'lucide-react'
import {
  getFinancialReport,
  getAttendanceReport,
  getSalesReport,
  getMembersReport,
  getCommissionsReport,
  getProfitabilityReport,
  getCrossBranchReport,
} from '#/features/reports/server.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { CopilotSummary } from './components/copilot-summary.tsx'
import { LazyRecharts } from '#/shared/components/lazy-recharts'

type Tab = 'financial' | 'attendance' | 'sales' | 'members' | 'commissions' | 'profitability' | 'crossbranch'
type Preset = 'today' | 'week' | 'month' | 'year' | 'custom'

const tabs: {
  id: Tab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'financial', label: 'Financiero', icon: DollarSign },
  { id: 'attendance', label: 'Asistencia', icon: DoorOpen },
  { id: 'sales', label: 'Ventas', icon: ShoppingBag },
  { id: 'members', label: 'Socios', icon: Users },
  { id: 'commissions', label: 'Comisiones', icon: Dumbbell },
  { id: 'profitability', label: 'Utilidades', icon: PiggyBank },
  { id: 'crossbranch', label: 'Consolidado', icon: BarChart3 },
]

const presets: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'year', label: 'Este año' },
  { id: 'custom', label: 'Personalizado' },
]

function getPresetRange(preset: Preset): {
  startDate: string
  endDate: string
} {
  const now = new Date()
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  )

  switch (preset) {
    case 'today': {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      )
      return { startDate: start.toISOString(), endDate: end.toISOString() }
    }
    case 'week': {
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diff,
        0,
        0,
        0,
        0,
      )
      return { startDate: start.toISOString(), endDate: end.toISOString() }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      return { startDate: start.toISOString(), endDate: end.toISOString() }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      return { startDate: start.toISOString(), endDate: end.toISOString() }
    }
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      return { startDate: start.toISOString(), endDate: end.toISOString() }
    }
  }
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const CHART_COLORS = [
  '#6366f1',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
]

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('financial')
  const [preset, setPreset] = useState<Preset>('month')
  const printRef = useRef<HTMLDivElement>(null)

  const range = useMemo(() => getPresetRange(preset), [preset])

  return (
    <div className="space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: landscape; margin: 1.2cm; }
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; inset: 0; width: 100%; }
              .no-print { display: none !important; }
              .recharts-wrapper { width: 100% !important; }
            }
          `,
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis y métricas del gimnasio
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((p) => (
            <Button
              key={p.id}
              variant={preset === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset(p.id)}
              className="transition-all duration-200"
            >
              {p.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4 mr-1" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="no-print">
        <CopilotSummary startDate={range.startDate} endDate={range.endDate} />
      </div>

      <div className="flex gap-1 border-b pb-1 no-print">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-b-none transition-all duration-200"
            >
              <Icon className="size-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      <div ref={printRef} className="print-area">
        {activeTab === 'financial' && (
          <FinancialReport
            startDate={range.startDate}
            endDate={range.endDate}
          />
        )}
        {activeTab === 'attendance' && (
          <AttendanceReport
            startDate={range.startDate}
            endDate={range.endDate}
          />
        )}
        {activeTab === 'sales' && (
          <SalesReport startDate={range.startDate} endDate={range.endDate} />
        )}
        {activeTab === 'members' && (
          <MembersReport startDate={range.startDate} endDate={range.endDate} />
        )}
        {activeTab === 'commissions' && (
          <CommissionsReport startDate={range.startDate} endDate={range.endDate} />
        )}
        {activeTab === 'profitability' && (
          <ProfitabilityReport startDate={range.startDate} endDate={range.endDate} />
        )}
        {activeTab === 'crossbranch' && (
          <CrossBranchReport startDate={range.startDate} endDate={range.endDate} />
        )}
      </div>
    </div>
  )
}

function useServerData<T>(
  fetcher: () => Promise<T>,
  deps: string[],
): { data: T | null; error: string | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error desconocido')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, deps)

  return { data, error, loading }
}

function FinancialReport({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) {
  const { data, error, loading } = useServerData(
    () => getFinancialReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )

  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data || data.chartData.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Ingresos Membresías"
          value={formatCurrency(data.summary.totalMembershipIncome)}
          icon={DollarSign}
          trend="up"
        />
        <SummaryCard
          title="Ingresos POS"
          value={formatCurrency(data.summary.totalPosIncome)}
          icon={ShoppingBag}
          trend="up"
        />
        <SummaryCard
          title="Egresos"
          value={formatCurrency(data.summary.totalExpenses)}
          icon={TrendingDown}
          trend="down"
        />
        <SummaryCard
          title="Balance Neto"
          value={formatCurrency(data.summary.netBalance)}
          icon={BarChart3}
          trend={data.summary.netBalance >= 0 ? 'up' : 'down'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Egresos</CardTitle>
        </CardHeader>
        <CardContent>
          <LazyRecharts height={350}>
            {(R) => (
              <R.ResponsiveContainer width="100%" height="100%">
                <R.BarChart data={data.chartData}>
                  <R.CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <R.XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    className="text-xs text-muted-foreground"
                  />
                  <R.YAxis className="text-xs text-muted-foreground" />
                  <R.Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                    }}
                    labelFormatter={(l: any) => formatDateLabel(l)}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <R.Legend />
                  <R.Bar
                    dataKey="membershipIncome"
                    name="Membresías"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                  <R.Bar
                    dataKey="posIncome"
                    name="POS"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <R.Bar
                    dataKey="expenses"
                    name="Egresos"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </R.BarChart>
              </R.ResponsiveContainer>
            )}
          </LazyRecharts>
        </CardContent>
      </Card>
    </div>
  )
}

function AttendanceReport({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) {
  const { data, error, loading } = useServerData(
    () => getAttendanceReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )

  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data || data.chartData.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          title="Total Check-ins"
          value={String(data.summary.total)}
          icon={DoorOpen}
          trend="up"
        />
        <SummaryCard
          title="Promedio Diario"
          value={String(data.summary.dailyAverage)}
          icon={LineChartIcon}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-ins por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <LazyRecharts height={350}>
            {(R) => (
              <R.ResponsiveContainer width="100%" height="100%">
                <R.LineChart data={data.chartData}>
                  <R.CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <R.XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    className="text-xs text-muted-foreground"
                  />
                  <R.YAxis
                    className="text-xs text-muted-foreground"
                    allowDecimals={false}
                  />
                  <R.Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                    }}
                    labelFormatter={(l: any) => formatDateLabel(l)}
                  />
                  <R.Line
                    type="monotone"
                    dataKey="count"
                    name="Check-ins"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </R.LineChart>
              </R.ResponsiveContainer>
            )}
          </LazyRecharts>
        </CardContent>
      </Card>
    </div>
  )
}

function SalesReport({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) {
  const { data, error, loading } = useServerData(
    () => getSalesReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )

  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data || data.chartData.length === 0) return <EmptyState />

  const topProducts = [...data.chartData]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Ingresos Totales"
          value={formatCurrency(data.summary.totalRevenue)}
          icon={ShoppingBag}
          trend="up"
        />
        <SummaryCard
          title="Transacciones"
          value={String(data.summary.totalTransactions)}
          icon={FileBarChart}
        />
        <SummaryCard
          title="Productos Vendidos"
          value={String(data.chartData.reduce((a, b) => a + b.quantity, 0))}
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventas por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.chartData.map((row: any) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <LazyRecharts height={300}>
              {(R) => (
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.PieChart>
                    <R.Pie
                      data={topProducts}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: any) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {topProducts.map((_: any, i: number) => (
                        <R.Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </R.Pie>
                    <R.Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                  </R.PieChart>
                </R.ResponsiveContainer>
              )}
            </LazyRecharts>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MembersReport({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) {
  const { data, error, loading } = useServerData(
    () => getMembersReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )

  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data) return <EmptyState />

  const statusData = [
    { name: 'Activos', value: data.active, color: '#22c55e' },
    { name: 'Inactivos', value: data.inactive, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Socios"
          value={String(data.total)}
          icon={Users}
        />
        <SummaryCard
          title="Nuevos (período)"
          value={String(data.newMembers)}
          icon={TrendingUp}
          trend="up"
        />
        <SummaryCard title="Activos" value={String(data.active)} icon={Users} />
        <SummaryCard
          title="Bajas (período)"
          value={String(data.churned)}
          icon={TrendingDown}
          trend="down"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Socios</CardTitle>
          </CardHeader>
          <CardContent>
            <LazyRecharts height={300}>
              {(R) => (
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.PieChart>
                    <R.Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }: any) => `${name}: ${value}`}
                    >
                      {statusData.map((entry) => (
                        <R.Cell key={entry.name} fill={entry.color} />
                      ))}
                    </R.Pie>
                    <R.Tooltip />
                    <R.Legend />
                  </R.PieChart>
                </R.ResponsiveContainer>
              )}
            </LazyRecharts>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <span className="text-sm">Total Socios</span>
                </div>
                <span className="text-xl font-bold">{data.total}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  >
                    NUEVOS
                  </Badge>
                  <span className="text-sm">Nuevos en el período</span>
                </div>
                <span className="text-xl font-bold text-emerald-600">
                  {data.newMembers}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                  >
                    BAJAS
                  </Badge>
                  <span className="text-sm">Bajas en el período</span>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {data.churned}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-500" />
                  <span className="text-sm">Crecimiento neto</span>
                </div>
                <span
                  className={`text-xl font-bold ${data.newMembers - data.churned >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {data.newMembers - data.churned >= 0 ? '+' : ''}
                  {data.newMembers - data.churned}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down'
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend === 'up' && <TrendingUp className="size-4 text-emerald-500" />}
          {trend === 'down' && <TrendingDown className="size-4 text-red-500" />}
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function CommissionsReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, error, loading } = useServerData(
    () => getCommissionsReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )
  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Total Comisiones" value={formatCurrency(data.summary.totalCommissions)} icon={Dumbbell} trend="up" />
        <SummaryCard title="Ingresos Base" value={formatCurrency(data.summary.totalRevenue)} icon={DollarSign} />
      </div>
      <Card>
        <CardHeader><CardTitle>Comisiones por Entrenador</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entrenador</TableHead>
                <TableHead className="text-center">Socios asignados</TableHead>
                <TableHead className="text-right">Tasa</TableHead>
                <TableHead className="text-right">Ingresos base</TableHead>
                <TableHead className="text-right font-bold">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.trainers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Sin entrenadores activos</TableCell></TableRow>
              ) : (
                data.trainers.map((t: any) => (
                  <TableRow key={t.trainerId}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{t.trainerName}</p>
                        <p className="text-xs text-muted-foreground">{t.trainerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{t.assignedMembers}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{t.commissionRate}%</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(t.totalMembershipRevenue)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(t.commissionAmount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function CrossBranchReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, error, loading } = useServerData(
    () => getCrossBranchReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )

  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data || data.branches.length === 0) {
    return (
      <EmptyState
        title="Sin sucursales"
        description="No hay sucursales activas para mostrar el reporte consolidado."
      />
    )
  }

  const { branches, consolidated } = data

  return (
    <div className="space-y-6">
      {/* Consolidated summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Socios Activos" value={String(consolidated.activeMembers)} icon={Users} />
        <SummaryCard title="Check-ins" value={String(consolidated.checkIns)} icon={DoorOpen} trend="up" />
        <SummaryCard title="Ingresos Totales" value={formatCurrency(consolidated.totalIncome)} icon={DollarSign} trend="up" />
        <SummaryCard title="Balance Neto" value={formatCurrency(consolidated.netBalance)} icon={BarChart3} trend={consolidated.netBalance >= 0 ? 'up' : 'down'} />
      </div>

      {/* Branch-by-branch comparison table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Comparativa por Sucursal</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {branches.length} sucursales
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Datos del período {new Date(startDate).toLocaleDateString('es-AR')} — {new Date(endDate).toLocaleDateString('es-AR')}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Sucursal</TableHead>
                  <TableHead className="text-right">Socios Act.</TableHead>
                  <TableHead className="text-right">Nuevos</TableHead>
                  <TableHead className="text-right">Suscrip.</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                  <TableHead className="text-right">Membresías</TableHead>
                  <TableHead className="text-right">POS</TableHead>
                  <TableHead className="text-right">Egresos</TableHead>
                  <TableHead className="text-right font-bold">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b: any) => (
                  <TableRow key={b.branchId} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{b.branchName}</TableCell>
                    <TableCell className="text-right">{b.activeMembers}</TableCell>
                    <TableCell className="text-right">{b.newMembers}</TableCell>
                    <TableCell className="text-right">{b.activeSubscriptions}</TableCell>
                    <TableCell className="text-right">{b.checkIns}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(b.membershipIncome)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(b.posIncome)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">{formatCurrency(b.expenses)}</TableCell>
                    <TableCell className={`text-right font-bold font-mono text-sm ${b.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(b.netBalance)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Consolidated row */}
                <TableRow className="border-t-2 border-primary/30 bg-primary/5 font-bold">
                  <TableCell className="font-extrabold text-foreground">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-3.5 text-primary" />
                      TOTAL CONSOLIDADO
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{consolidated.activeMembers}</TableCell>
                  <TableCell className="text-right font-bold">{consolidated.newMembers}</TableCell>
                  <TableCell className="text-right font-bold">{consolidated.activeSubscriptions}</TableCell>
                  <TableCell className="text-right font-bold">{consolidated.checkIns}</TableCell>
                  <TableCell className="text-right font-bold font-mono">{formatCurrency(consolidated.membershipIncome)}</TableCell>
                  <TableCell className="text-right font-bold font-mono">{formatCurrency(consolidated.posIncome)}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-red-600">{formatCurrency(consolidated.expenses)}</TableCell>
                  <TableCell className={`text-right font-bold font-mono ${consolidated.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(consolidated.netBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Branch chart comparison */}
      {branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Egresos por Sucursal</CardTitle>
          </CardHeader>
          <CardContent>
            <LazyRecharts height={350}>
              {(R) => (
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.BarChart data={branches}>
                    <R.CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <R.XAxis dataKey="branchName" tick={{ fontSize: 11 }} />
                    <R.YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => formatCurrency(v)} />
                    <R.Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <R.Legend />
                    <R.Bar dataKey="membershipIncome" name="Membresías" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <R.Bar dataKey="posIncome" name="POS" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <R.Bar dataKey="expenses" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <R.Bar dataKey="netBalance" name="Balance Neto" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </R.BarChart>
                </R.ResponsiveContainer>
              )}
            </LazyRecharts>
          </CardContent>
        </Card>
      )}

      {/* Branch metrics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b: any) => (
          <Card key={b.branchId} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">{b.branchName}</CardTitle>
                <Badge variant={b.netBalance >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                  {b.netBalance >= 0 ? 'Positivo' : 'Negativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Socios activos</span>
                <span className="font-semibold">{b.activeMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-ins</span>
                <span className="font-semibold">{b.checkIns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingresos totales</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(b.totalIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance neto</span>
                <span className={`font-bold ${b.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(b.netBalance)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ProfitabilityReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, error, loading } = useServerData(
    () => getProfitabilityReport({ data: { startDate, endDate } }),
    [startDate, endDate],
  )
  if (loading) return <SkeletonGrid />
  if (error) return <ErrorState message={error} />
  if (!data) return <EmptyState />

  const { summary, chartData } = data
  const marginColor = summary.margin >= 20 ? 'text-emerald-600' : summary.margin >= 0 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ingresos totales" value={formatCurrency(summary.totalIncome)} icon={TrendingUp} trend="up" />
        <SummaryCard title="Egresos totales" value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} trend="down" />
        <SummaryCard title="Utilidad bruta" value={formatCurrency(summary.grossProfit)} icon={DollarSign} trend={summary.grossProfit >= 0 ? 'up' : 'down'} />
        <SummaryCard title="Utilidad neta" value={formatCurrency(summary.netProfit)} icon={BarChart3} trend={summary.netProfit >= 0 ? 'up' : 'down'} />
      </div>

      {/* Margen */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Margen de utilidad neta</p>
              <p className={`text-4xl font-black mt-1 ${marginColor}`}>{summary.margin.toFixed(1)}%</p>
            </div>
            <div className="text-right space-y-1 text-sm text-muted-foreground">
              <p>Membresías: <span className="font-bold text-foreground">{formatCurrency(summary.membershipIncome)}</span></p>
              <p>POS: <span className="font-bold text-foreground">{formatCurrency(summary.posIncome)}</span></p>
              <p>Costo ventas: <span className="font-bold text-foreground">{formatCurrency(summary.cogs)}</span></p>
              <p>Gastos oper.: <span className="font-bold text-foreground">{formatCurrency(summary.operationalExpenses)}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Ingresos vs Egresos vs Utilidad</CardTitle></CardHeader>
          <CardContent>
            <LazyRecharts height={320}>
              {(R) => (
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.BarChart data={chartData}>
                    <R.CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <R.XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 10 }} />
                    <R.YAxis tick={{ fontSize: 10 }} />
                    <R.Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(v: any) => formatCurrency(v)} />
                    <R.Legend />
                    <R.Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <R.Bar dataKey="expenses" name="Egresos" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <R.Bar dataKey="profit" name="Utilidad" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </R.BarChart>
                </R.ResponsiveContainer>
              )}
            </LazyRecharts>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

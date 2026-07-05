import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Printer, Maximize2, Minimize2, GripVertical } from 'lucide-react'
import { getDashboardData } from '#/features/dashboard/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { BiometricReaders } from './components/biometric-readers.tsx'
import { GenderDistribution } from './components/gender-distribution.tsx'
import { QuickActionsGrid } from './components/quick-actions-grid.tsx'
import { ExpiringMembershipsBanner } from './components/expiring-memberships-banner.tsx'
import { TopProducts } from './components/top-products.tsx'
import { HourlyAttendanceChart } from './components/hourly-attendance-chart.tsx'
import { InsightsPanel } from './components/insights-panel.tsx'
import { AnalyticsQueryBar } from '#/features/analytics/components/analytics-query-bar.tsx'
import { ChurnRateWidget } from './components/churn-rate-widget.tsx'
import { RevenueVsGoalsChart } from './components/revenue-vs-goals-chart.tsx'
import { MembershipTrendsChart } from './components/membership-trends-chart.tsx'
import { cn } from '#/shared/lib/utils.ts'

interface WidgetConfig {
  id: string
  colSpan: 1 | 2
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'quick-actions', colSpan: 2 },
  { id: 'expiring-memberships', colSpan: 2 },
  { id: 'hourly-attendance', colSpan: 1 },
  { id: 'churn-rate', colSpan: 1 },
  { id: 'revenue-vs-goals', colSpan: 1 },
  { id: 'membership-trends', colSpan: 1 },
  { id: 'top-products', colSpan: 2 },
]

function DashboardWidgetWrapper({
  colSpan,
  onResizeToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  children,
}: {
  colSpan: 1 | 2
  onResizeToggle: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging: boolean
  children: React.ReactNode
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative rounded-4xl transition-all duration-200 border border-transparent select-none',
        colSpan === 2 ? 'col-span-1 xl:col-span-2' : 'col-span-1',
        isDragging ? 'opacity-40 border-dashed border-primary/40 scale-[0.98]' : 'opacity-100',
      )}
    >
      {/* Barra de control flotante (Visible al pasar el cursor) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-2 py-1 rounded-full border border-border/10 shadow-sm">
        {/* Grip para Drag & Drop */}
        <div className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground">
          <GripVertical className="size-3.5" />
        </div>
        
        {/* Botón para Redimensionar */}
        <button
          onClick={onResizeToggle}
          title={colSpan === 2 ? 'Reducir ancho' : 'Expandir al ancho completo'}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {colSpan === 2 ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </button>
      </div>

      {children}
    </div>
  )
}

export function DashboardPage() {
  const { branchId } = useCurrentBranch()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', branchId],
    queryFn: () => getDashboardData({ data: { branchId: branchId ?? undefined } }),
  })

  const [layout, setLayout] = useState<WidgetConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-widgets-layout')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_LAYOUT
  })

  const [draggedId, setDraggedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" label="Cargando dashboard..." />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-muted-foreground">Error al cargar los datos del dashboard.</p>
      </div>
    )
  }

  const saveLayout = (newLayout: WidgetConfig[]) => {
    setLayout(newLayout)
    localStorage.setItem('dashboard-widgets-layout', JSON.stringify(newLayout))
  }

  const handleResizeToggle = (id: string) => {
    const updated: WidgetConfig[] = layout.map((w) =>
      w.id === id ? { ...w, colSpan: w.colSpan === 2 ? 1 : 2 } : w
    )
    saveLayout(updated)
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return

    const oldIndex = layout.findIndex((w) => w.id === draggedId)
    const newIndex = layout.findIndex((w) => w.id === targetId)

    const updated = [...layout]
    const [removed] = updated.splice(oldIndex, 1)
    updated.splice(newIndex, 0, removed)

    saveLayout(updated)
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const renderWidget = (id: string) => {
    switch (id) {
      case 'quick-actions':
        return <QuickActionsGrid totalMembers={data.totalMembers} />
      case 'expiring-memberships':
        return data.expiringSoonCount > 0 ? (
          <ExpiringMembershipsBanner expiringSoonCount={data.expiringSoonCount} />
        ) : null
      case 'hourly-attendance':
        return <HourlyAttendanceChart hourlyCheckIns={data.hourlyCheckIns} />
      case 'churn-rate':
        return <ChurnRateWidget />
      case 'revenue-vs-goals':
        return <RevenueVsGoalsChart />
      case 'membership-trends':
        return <MembershipTrendsChart />
      case 'top-products':
        return <TopProducts topProducts={data.topProducts} />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-5 dark:text-white text-foreground min-h-[calc(100vh-10rem)]">
      {/* Columna Izquierda: Solo el Panel de Asistencia en Vivo */}
      <div className="lg:sticky lg:top-0 self-start">
        <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-5 select-none relative overflow-hidden w-full shrink-0">
          <div className="absolute -top-20 -left-20 size-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 size-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight dark:text-white text-foreground">
                Panel
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">
                Asistencia
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </span>
          </div>

          <BiometricReaders />
          <GenderDistribution genderStats={data.genderStats} />
          <InsightsPanel />
          <AnalyticsQueryBar />

          <Link
            to="/check-ins"
            className="mt-auto group relative overflow-hidden bg-muted hover:bg-black/5 dark:hover:bg-white/5 border border-border/10 p-4 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Printer className="size-4" />
              </div>
              <div>
                <p className="font-bold text-xs dark:text-white text-foreground">
                  Tiempo Real de Asistencia
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Por horarios TRAINIX
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Columna Derecha: Todo lo demás fluido (Masonry / Grid Ordenable) */}
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              <Link
                to="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>{' '}
              ·{' '}
              <span className="dark:text-white/60 text-foreground/60">
                Apps
              </span>
            </p>
            <h1 className="text-3xl font-black tracking-tight dark:text-white text-foreground leading-none">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Datos actualizados
          </div>
        </div>

        {/* Contenedor Grid Interactivo */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 auto-rows-max">
          {layout.map((widget) => {
            const component = renderWidget(widget.id)
            if (!component) return null

            return (
              <DashboardWidgetWrapper
                key={widget.id}
                colSpan={widget.colSpan}
                isDragging={draggedId === widget.id}
                onResizeToggle={() => handleResizeToggle(widget.id)}
                onDragStart={() => handleDragStart(widget.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(widget.id)}
                onDragEnd={handleDragEnd}
              >
                {component}
              </DashboardWidgetWrapper>
            )
          })}
        </div>
      </div>
    </div>
  )
}

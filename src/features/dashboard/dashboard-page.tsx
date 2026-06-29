import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Printer } from 'lucide-react'
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

export function DashboardPage() {
  const { branchId } = useCurrentBranch()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', branchId],
    queryFn: () => getDashboardData({ data: { branchId: branchId ?? undefined } }),
    enabled: !!branchId,
  })

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-5 dark:text-white text-foreground min-h-[calc(100vh-10rem)]">
      <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-5 select-none relative overflow-hidden">
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

      <div className="flex flex-col gap-5">
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

        <QuickActionsGrid totalMembers={data.totalMembers} />

        <ExpiringMembershipsBanner expiringSoonCount={data.expiringSoonCount} />

        <div className="grid gap-5 md:grid-cols-2">
          <TopProducts topProducts={data.topProducts} />
          <HourlyAttendanceChart hourlyCheckIns={data.hourlyCheckIns} />
        </div>
      </div>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  Users,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Printer,
  ChevronRight,
  Lock,
  Wifi,
} from 'lucide-react'
import {
  getDashboardData,
  getExpiringSoonCount,
} from '#/features/dashboard/server.ts'
import type { getDashboardData as GetDashboardDataFn } from '#/features/dashboard/server.ts'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '#/shared/components/ui/badge.tsx'
import { useTheme } from 'next-themes'

type DashboardData = Awaited<ReturnType<typeof GetDashboardDataFn>>

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async () => {
    const [dashboardData, expiringSoonCount] = await Promise.all([
      getDashboardData(),
      getExpiringSoonCount(),
    ])
    return { ...dashboardData, expiringSoonCount } as DashboardData & {
      expiringSoonCount: number
    }
  },
  component: DashboardPage,
})

export function DashboardPage() {
  const loaderData = Route.useLoaderData()
  const data = loaderData as DashboardData & { expiringSoonCount: number }
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const rootStyle = useMemo(
    () => getComputedStyle(document.documentElement),
    [resolvedTheme],
  )
  const gridColor = rootStyle.getPropertyValue('--border').trim() || (isDark ? '#2c2c35' : '#e2e8f0')
  const textColor = rootStyle.getPropertyValue('--muted-foreground').trim() || (isDark ? '#8c8c9a' : '#64748b')
  const tooltipBg = rootStyle.getPropertyValue('--popover').trim() || (isDark ? '#121214' : '#ffffff')
  const tooltipBorder = `1px solid ${rootStyle.getPropertyValue('--border').trim() || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`
  const tooltipLabelColor = rootStyle.getPropertyValue('--popover-foreground').trim() || (isDark ? '#ffffff' : '#0f172a')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 dark:text-white text-foreground min-h-[calc(100vh-10rem)]">

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="bg-card p-5 rounded-[2rem] border border-border/10 shadow-xl flex flex-col gap-5 select-none relative overflow-hidden">
        {/* ambient glow */}
        <div className="absolute -top-20 -left-20 size-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 size-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight dark:text-white text-foreground">Panel</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">Asistencia</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En vivo
          </span>
        </div>

        {/* Lectores Biométricos */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Lectores Biométricos</p>
          <div className="bg-muted p-4 rounded-2xl border border-border/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <Wifi className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm dark:text-white text-foreground">NORTE</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0">v3.1.2</Badge>
                </div>
                <p className="text-[9px] text-muted-foreground truncate">SenseFace 3A · 192.168.1.201</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Capacidad del canal</span>
                <span className="font-bold text-emerald-400">80%</span>
              </div>
              <div className="h-1.5 w-full dark:bg-white/10 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-4/5 transition-all" />
              </div>
            </div>
            <Link to="/settings" className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors">
              Configurar lector <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Gender stats */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Distribución</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Female */}
            <div className="rounded-2xl overflow-hidden relative h-[160px] flex flex-col justify-between p-3.5"
              style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 100%)' }}>
              <div className="dark:hidden absolute inset-0 bg-gradient-to-br from-pink-100/50 to-pink-200/30" />
              <div className="flex items-center justify-between z-10">
                <span className="size-8 rounded-xl bg-pink-500/15 border border-pink-300/30 flex items-center justify-center text-lg font-bold text-pink-500">♀</span>
                <span className="text-[9px] font-bold text-pink-600 bg-pink-500/10 border border-pink-300/30 px-2 py-0.5 rounded-full">Mujeres</span>
              </div>
              <div className="z-10">
                <div className="text-3xl font-black text-pink-700 leading-none">{data.genderStats.female}</div>
                <p className="text-[9px] text-pink-500/80 font-semibold mt-1 uppercase tracking-widest">Socias activas</p>
              </div>
              <img src="/images/female_avatar.png" alt="Mujer" className="absolute right-0 bottom-0 h-[100px] w-auto object-contain opacity-85 pointer-events-none" />
            </div>

            {/* Male */}
            <div className="rounded-2xl overflow-hidden relative h-[160px] flex flex-col justify-between p-3.5"
              style={{ background: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div className="flex items-center justify-between z-10">
                <span className="size-8 rounded-xl bg-amber-500/15 border border-amber-300/30 flex items-center justify-center text-lg font-bold text-amber-500">♂</span>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-300/30 px-2 py-0.5 rounded-full">Hombres</span>
              </div>
              <div className="z-10">
                <div className="text-3xl font-black text-amber-700 leading-none">{data.genderStats.male}</div>
                <p className="text-[9px] text-amber-500/80 font-semibold mt-1 uppercase tracking-widest">Socios activos</p>
              </div>
              <img src="/images/male_avatar.png" alt="Hombre" className="absolute right-0 bottom-0 h-[100px] w-auto object-contain opacity-85 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* CTA footer */}
        <Link
          to="/check-ins"
          className="mt-auto group relative overflow-hidden bg-muted hover:bg-black/5 dark:hover:bg-white/5 border border-border/10 p-4 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Printer className="size-4" />
            </div>
            <div>
              <p className="font-bold text-xs dark:text-white text-foreground">Tiempo Real de Asistencia</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Por horarios TRAINIX</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── RIGHT COLUMN ───────────────────────────────────── */}
      <div className="flex flex-col gap-5">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              {' '}·{' '}
              <span className="dark:text-white/60 text-foreground/60">Apps</span>
            </p>
            <h1 className="text-3xl font-black tracking-tight dark:text-white text-foreground leading-none">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Datos actualizados
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] lg:items-stretch">

          {/* Usuarios Card */}
          <Link
            to="/members"
            className="group relative overflow-hidden rounded-[2rem] p-5 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f9f0e0 0%, #f0d9b5 100%)' }}
          >
            <div className="absolute -top-6 -right-6 size-28 rounded-full bg-amber-400/30 blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-125" />
            <div className="flex justify-between items-start z-10">
              <div className="size-11 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/60">
                <Users className="size-5 text-amber-900" />
              </div>
              <span className="text-[10px] font-bold text-amber-800/70 bg-white/50 backdrop-blur-md border border-white/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="size-2.5" /> +1%
              </span>
            </div>
            <div className="z-10">
              <div className="text-4xl font-black text-amber-950 tracking-tight leading-none">
                {data.totalMembers}
              </div>
              <p className="text-[11px] font-semibold text-amber-800/70 mt-1.5 uppercase tracking-widest">
                Socios Totales
              </p>
            </div>
            <div className="absolute right-3 bottom-8 w-[90px] h-[32px] opacity-25 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d="M0,35 Q15,25 30,30 T60,10 T90,25 L100,20" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </Link>

          {/* Middle Column: Molinete + Tienda stacked */}
          <div className="flex flex-col gap-4">
            {/* Control Molinete */}
            <Link
              to="/check-ins"
              className="group relative overflow-hidden rounded-[2rem] flex-1 flex items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#fef3c7] via-[#fde68a]/90 to-transparent z-10 pointer-events-none" />
              <div className="absolute -top-6 -left-6 size-24 rounded-full bg-yellow-400/40 blur-2xl pointer-events-none" />
              <div className="relative z-20 p-5 flex flex-col gap-2 max-w-[55%]">
                <div className="size-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/60">
                  <Lock className="size-4 text-yellow-900" />
                </div>
                <div>
                  <div className="text-lg font-black text-yellow-950 tracking-tight leading-tight">Control Molinete</div>
                  <p className="text-[10px] font-semibold text-yellow-800/60 mt-0.5 uppercase tracking-widest">Autenticación</p>
                </div>
              </div>
              <img src="/images/turnstile.png" alt="Molinete" className="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-95 pointer-events-none transition-all duration-500 group-hover:scale-105 drop-shadow-2xl" />
            </Link>

            {/* Tienda */}
            <Link
              to="/pos"
              className="group relative overflow-hidden rounded-[2rem] flex-1 flex items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #fae8ff 0%, #e9d5ff 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#fae8ff] via-[#e9d5ff]/90 to-transparent z-10 pointer-events-none" />
              <div className="absolute -top-6 -left-6 size-24 rounded-full bg-purple-400/30 blur-2xl pointer-events-none" />
              <div className="relative z-20 p-5 flex flex-col gap-2 max-w-[55%]">
                <div className="size-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/60">
                  <ShoppingBag className="size-4 text-purple-900" />
                </div>
                <div>
                  <div className="text-lg font-black text-purple-950 tracking-tight leading-tight">Tienda</div>
                  <p className="text-[10px] font-semibold text-purple-800/60 mt-0.5 uppercase tracking-widest">Venta directa</p>
                </div>
              </div>
              <img src="/images/shop.png" alt="Tienda" className="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-95 pointer-events-none transition-all duration-500 group-hover:scale-105 drop-shadow-2xl" />
            </Link>
          </div>

          {/* Control Facial */}
          <Link
            to="/check-ins"
            className="group relative overflow-hidden rounded-[2rem] p-5 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg dark:bg-[#1a1f35] bg-[#dde5ff]"
          >
            <div className="absolute -top-6 -right-6 size-28 rounded-full dark:bg-indigo-500/20 bg-indigo-400/30 blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-125" />
            <div className="flex justify-between items-start z-10">
              <div className="size-11 rounded-2xl dark:bg-white/10 bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm dark:border-white/10 border-white/60 border">
                <svg className="size-5 dark:text-indigo-300 text-indigo-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0Z" />
                  <path d="M8 10v.01M16 10v.01" />
                  <path d="M12 14s1.5 2 4 2" />
                </svg>
              </div>
              <span className="text-[10px] font-bold dark:text-indigo-300/70 text-indigo-900/60 dark:bg-white/10 bg-white/50 backdrop-blur-md dark:border-white/10 border-white/60 border px-2.5 py-1 rounded-full">TRAINIX</span>
            </div>
            <div className="z-10">
              <div className="text-xl font-black dark:text-white text-indigo-950 tracking-tight leading-tight">Control<br />Facial</div>
              <p className="text-[11px] font-semibold dark:text-indigo-300/50 text-indigo-800/60 mt-1.5 uppercase tracking-widest">Sin contacto</p>
            </div>
            <div className="absolute right-3 bottom-3 size-20 opacity-20 dark:opacity-15 pointer-events-none">
              <svg className="w-full h-full dark:text-indigo-300 text-indigo-700" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="40" cy="32" r="14" />
                <circle cx="40" cy="32" r="22" strokeDasharray="4 4" />
                <circle cx="35" cy="28" r="2" fill="currentColor" />
                <circle cx="45" cy="28" r="2" fill="currentColor" />
                <path d="M34 38 Q40 44 46 38" strokeLinecap="round" />
              </svg>
            </div>
          </Link>

        </div>

        {/* Warning banner */}
        {data.expiringSoonCount > 0 && (
          <div className="bg-amber-500/8 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {data.expiringSoonCount} membresía{data.expiringSoonCount !== 1 ? 's' : ''} próxima{data.expiringSoonCount !== 1 ? 's' : ''} a vencer
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Revisá las renovaciones pendientes para evitar cortes de acceso.</p>
              </div>
            </div>
            <Link to="/renewals" className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl transition-colors">
              Ver <ArrowRight className="size-3" />
            </Link>
          </div>
        )}

        {/* Bottom grid: Products + Chart */}
        <div className="grid gap-5 md:grid-cols-2">

          {/* Productos más vendidos */}
          <div className="bg-card p-5 rounded-[2rem] border border-border/10 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black dark:text-white text-foreground">Productos + Vendidos</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Top 5 de este mes</p>
              </div>
              <div className="size-8 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
                <ShoppingBag className="size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {data.topProducts.map((prod, index) => (
                <div
                  key={prod.id || index}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-muted border border-border/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors group"
                >
                  {/* Rank */}
                  <span className="text-[10px] font-black text-muted-foreground w-4 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="size-9 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center overflow-hidden border dark:border-white/10 border-black/10 shrink-0">
                    <img src="/images/gym_product.png" alt={prod.name} className="size-6 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs dark:text-white text-foreground truncate">{prod.name}</h4>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{prod.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black dark:text-white text-foreground">{prod.quantitySold}</div>
                    <p className="text-[9px] text-muted-foreground">ventas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Asistencia */}
          <div className="bg-card p-5 rounded-[2rem] border border-border/10 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black dark:text-white text-foreground">Asistencia por franja</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Horarios más transitados</p>
              </div>
              <div className="size-8 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyCheckIns} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="hour" stroke={textColor} fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={9} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '14px', fontSize: 11 }}
                    labelStyle={{ color: tooltipLabelColor, fontWeight: 'bold' }}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                  />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, paddingTop: 8 }} />
                  <Bar dataKey="18-25" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="26-35" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="36-45" stackId="a" fill="#6366f1" />
                  <Bar dataKey="46+" stackId="a" fill="#d946ef" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

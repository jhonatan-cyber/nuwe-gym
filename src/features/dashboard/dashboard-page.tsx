import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import {
  Users,
  CreditCard,
  CalendarCheck,
  DoorOpen,
  Package,
  ShoppingBag,
  Landmark,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { getDashboardData, getExpiringSoonCount } from '#/features/dashboard/server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'
import type { getDashboardData as GetDashboardDataFn } from '#/features/dashboard/server.ts'

type DashboardData = Awaited<ReturnType<typeof GetDashboardDataFn>>

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async () => {
    const [dashboardData, expiringSoonCount] = await Promise.all([
      getDashboardData(),
      getExpiringSoonCount(),
    ])
    return { ...dashboardData, expiringSoonCount } as DashboardData & { expiringSoonCount: number }
  },
  component: DashboardPage,
})

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend && <TrendingUp className="size-3 text-emerald-500" />}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { userRole } = Route.useRouteContext()
  const loaderData = Route.useLoaderData()
  const data = loaderData as DashboardData & { expiringSoonCount: number }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de GymManager POS
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Socios"
          value={String(data.totalMembers)}
          description="Socios registrados"
          icon={Users}
        />
        <StatCard
          title="Membresías Activas"
          value={String(data.activeMemberships)}
          description="Activas actualmente"
          icon={CalendarCheck}
        />
        <StatCard
          title="Check-ins Hoy"
          value={String(data.checkInsToday)}
          description="Ingresos del día"
          icon={DoorOpen}
        />
        <StatCard
          title="Ventas del Día"
          value={`$${data.salesToday.toFixed(2)}`}
          description="En ventas POS"
          icon={ShoppingBag}
        />
      </div>

      {data.expiringSoonCount > 0 && (
        <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                {data.expiringSoonCount} membresía{data.expiringSoonCount !== 1 ? 's' : ''} próxima{data.expiringSoonCount !== 1 ? 's' : ''} a vencer
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Revisá las renovaciones pendientes para evitar vencimientos.
              </p>
            </div>
          </div>
          <Link
            to="/renewals"
            className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline shrink-0"
          >
            Ver renovaciones
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {(userRole === 'ADMIN' || userRole === 'RECEPTIONIST') && (
        <>
          <h2 className="text-xl font-semibold mt-8">Finanzas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Ingresos Membresías"
              value={`$${data.membershipIncome.toFixed(2)}`}
              description="Este mes"
              icon={CreditCard}
            />
            <StatCard
              title="Ingresos POS"
              value={`$${data.posIncome.toFixed(2)}`}
              description="Este mes"
              icon={ShoppingBag}
            />
            <StatCard
              title="Estado de Caja"
              value={data.cashStatus}
              description={data.cashStatusDescription}
              icon={Landmark}
            />
            <StatCard
              title="Productos Activos"
              value={String(data.activeProductsCount)}
              description="En inventario"
              icon={Package}
            />
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membresías por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            {data.expiringSubscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay membresías próximas a vencer en los próximos 7 días.
              </p>
            ) : (
              <div className="space-y-4">
                {data.expiringSubscriptions.map((sub: typeof data.expiringSubscriptions[number]) => (
                  <div key={sub.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{sub.member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{sub.plan.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full">
                      Vence: {formatDate(sub.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay productos con stock bajo.
              </p>
            ) : (
              <div className="space-y-4">
                {data.lowStockProducts.map((prod: typeof data.lowStockProducts[number]) => (
                  <div key={prod.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{prod.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {prod.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full">
                        Stock: {prod.stockCurrent} / Mín: {prod.stockMinimum}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

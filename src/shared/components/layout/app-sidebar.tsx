import { useMemo } from 'react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  RefreshCw,
  Snowflake,
  DoorOpen,
  CalendarDays,
  Dumbbell,
  ShoppingCart,
  ShoppingBag,
  Warehouse,
  Landmark,
  UserCog,
  BarChart3,
  Settings,
  Download,
  ScrollText,
  Store,
  Database as DatabaseIcon,
  Package,
} from 'lucide-react'
import { Link, useMatches } from '@tanstack/react-router'
import type { UserRole } from '#/shared/lib/permissions.ts'
import { hasPermission } from '#/shared/lib/permissions.ts'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip.tsx'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Parameters<typeof hasPermission>[1]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  { title: 'Socios', url: '/members', icon: Users, permission: 'members:read' },
  {
    title: 'Paquetes',
    url: '/membership-plans',
    icon: Package,
    permission: 'plans:read',
  },
  {
    title: 'Suscripciones',
    url: '/subscriptions',
    icon: CalendarCheck,
    permission: 'subscriptions:read',
  },
  {
    title: 'Renovaciones',
    url: '/renewals',
    icon: RefreshCw,
    permission: 'renewals:read',
  },
  {
    title: 'Congelamientos',
    url: '/membership-freezes',
    icon: Snowflake,
    permission: 'membership-freezes:read',
  },
  {
    title: 'Pagos',
    url: '/membership-payments',
    icon: CreditCard,
    permission: 'payments:read',
  },
  {
    title: 'Check-in',
    url: '/check-ins',
    icon: DoorOpen,
    permission: 'checkins:read',
  },
  {
    title: 'Clases',
    url: '/classes',
    icon: CalendarDays,
    permission: 'classes:read',
  },
  {
    title: 'Entrenadores',
    url: '/trainers',
    icon: Dumbbell,
    permission: 'trainers:read',
  },
  { title: 'POS', url: '/pos', icon: ShoppingBag, permission: 'pos:use' },
  {
    title: 'Ventas',
    url: '/sales',
    icon: ShoppingCart,
    permission: 'sales:read',
  },
  {
    title: 'Inventario',
    url: '/inventory',
    icon: Warehouse,
    permission: 'inventory:read',
  },
  {
    title: 'Caja',
    url: '/cash-register',
    icon: Landmark,
    permission: 'cash:read',
  },
  {
    title: 'Reportes',
    url: '/reports',
    icon: BarChart3,
    permission: 'reports:read',
  },
  {
    title: 'Configuración',
    url: '/settings',
    icon: Settings,
    permission: 'settings:read',
  },
  { title: 'Usuarios', url: '/users', icon: UserCog, permission: 'users:read' },
  {
    title: 'Sucursales',
    url: '/branches',
    icon: Store,
    permission: 'branches:read',
  },
  {
    title: 'Auditoría',
    url: '/audit-logs',
    icon: ScrollText,
    permission: 'audit:read',
  },
  {
    title: 'Exportar',
    url: '/export',
    icon: Download,
    permission: 'export:read',
  },
  {
    title: 'Backup',
    url: '/backup',
    icon: DatabaseIcon,
    permission: 'backup:read',
  },
]

export function AppSidebar({ role }: { role: UserRole }) {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.fullPath ?? ''

  const visibleItems = useMemo(
    () =>
      navItems.filter(
        (item) => !item.permission || hasPermission(role, item.permission),
      ),
    [role],
  )

  return (
    <div className="fixed left-4 top-4 bottom-4 w-[70px] bg-card/80 backdrop-blur-md dark:text-white text-foreground flex flex-col items-center py-6 rounded-[2rem] shrink-0 shadow-xl border border-border/10 justify-between z-40">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link
          to="/dashboard"
          className="dark:text-white text-foreground hover:opacity-85 transition-opacity"
        >
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9 7 9-7" />
            <path d="M12 22V16" />
          </svg>
        </Link>
        <div className="w-8 h-px dark:bg-white/10 bg-black/10" />
      </div>

      {/* Navigation Icons list */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-none flex flex-col items-center gap-3 my-4 py-2 px-2">
        <TooltipProvider delayDuration={100}>
          {visibleItems.map((item) => {
            const isActive = currentPath.startsWith(item.url)
            return (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.url}
                    className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'dark:bg-white/20 bg-black/10 dark:text-white text-foreground'
                        : 'dark:text-white/40 text-muted-foreground hover:dark:bg-white/8 hover:bg-black/5 hover:dark:text-white hover:text-foreground'
                    }`}
                  >
                    <item.icon className="size-[18px]" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-popover dark:text-white text-foreground border-border/20 ml-2 shadow-md"
                >
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </div>
    </div>
  )
}

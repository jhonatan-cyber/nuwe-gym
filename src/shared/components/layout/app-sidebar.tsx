import { useMemo } from 'react'
import {
  BadgeDollarSign,
  Bell,
  Boxes,
  Briefcase,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  Database as DatabaseIcon,
  DoorOpen,
  Download,
  Dumbbell,
  LayoutDashboard,
  MapPin,
  Package,
  PlaneTakeoff,
  QrCode,
  ReceiptText,
  RefreshCw,
  Salad,
  ScrollText,
  Settings,
  ShoppingCart,
  Snowflake,
  Timer,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { Link, useMatches } from '@tanstack/react-router'
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
  permission?: string
  dividerAfter?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
    dividerAfter: true,
  },
  {
    title: 'Socios',
    url: '/members',
    icon: UsersRound,
    permission: 'members:read',
  },
  {
    title: 'Suscripciones',
    url: '/subscriptions',
    icon: CalendarCheck2,
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
    title: 'Check-in',
    url: '/check-ins',
    icon: DoorOpen,
    permission: 'checkins:read',
  },
  {
    title: 'Clases',
    url: '/classes',
    icon: CalendarRange,
    permission: 'classes:read',
  },
  {
    title: 'Entrenadores',
    url: '/trainers',
    icon: Dumbbell,
    permission: 'trainers:read',
  },
  {
    title: 'Nutrición',
    url: '/nutrition',
    icon: Salad,
    permission: 'nutrition:read',
  },
  {
    title: 'Paquetes',
    url: '/packages',
    icon: Package,
    permission: 'plans:read',
    dividerAfter: true,
  },
  {
    title: 'POS',
    url: '/pos',
    icon: WalletCards,
    permission: 'pos:use',
  },
  {
    title: 'Ventas',
    url: '/sales',
    icon: ShoppingCart,
    permission: 'sales:read',
  },
  {
    title: 'Pagos',
    url: '/membership-payments',
    icon: CreditCard,
    permission: 'payments:read',
  },
  {
    title: 'Facturación',
    url: '/invoices',
    icon: ReceiptText,
    permission: 'payments:read',
  },
  {
    title: 'Caja',
    url: '/cash-register',
    icon: BadgeDollarSign,
    permission: 'cash:read',
  },
  {
    title: 'Compras',
    url: '/purchases',
    icon: ClipboardList,
    permission: 'purchases:read',
  },
  {
    title: 'Proveedores',
    url: '/suppliers',
    icon: Briefcase,
    permission: 'suppliers:read',
  },
  {
    title: 'Inventario',
    url: '/inventory',
    icon: Boxes,
    permission: 'inventory:read',
    dividerAfter: true,
  },
  {
    title: 'Personal',
    url: '/employees',
    icon: UsersRound,
    permission: 'employees:read',
  },
  {
    title: 'Asistencia',
    url: '/employee-attendance',
    icon: Timer,
    permission: 'employees:read',
  },
  {
    title: 'Horarios',
    url: '/employee-schedules',
    icon: CalendarDays,
    permission: 'employees:read',
  },
  {
    title: 'Vacaciones',
    url: '/employee-vacations',
    icon: PlaneTakeoff,
    permission: 'employees:read',
  },
  {
    title: 'Sueldos',
    url: '/payroll',
    icon: BadgeDollarSign,
    permission: 'employees:read',
  },
  {
    title: 'Sucursales',
    url: '/branches',
    icon: MapPin,
    permission: 'branches:read',
  },
  {
    title: 'Corporativas',
    url: '/corporate-accounts',
    icon: Briefcase,
    permission: 'settings:read',
  },
  {
    title: 'Configuración',
    url: '/settings',
    icon: Settings,
    permission: 'settings:read',
  },
  {
    title: 'Notificaciones',
    url: '/notifications',
    icon: Bell,
    permission: 'notifications:read',
  },
  {
    title: 'Códigos QR',
    url: '/qr-codes',
    icon: QrCode,
    permission: 'settings:read',
  },
  {
    title: 'Reportes',
    url: '/reports',
    icon: ChartNoAxesCombined,
    permission: 'reports:read',
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

export function AppSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean
  onClose?: () => void
}) {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.fullPath ?? ''

  const visibleItems = useMemo(
    () => navItems,
    [],
  )

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-4 bottom-4 w-[72px] bg-card/80 backdrop-blur-md dark:text-white text-foreground flex flex-col items-center py-6 rounded-[2rem] shrink-0 shadow-xl border border-border/10 justify-between z-50 transition-all duration-300 ${
          isOpen ? 'left-4' : '-left-20 md:left-4'
        } ${isOpen ? 'flex' : 'hidden md:flex'}`}
      >
        <div className="flex flex-col items-center gap-6 w-full">
          <Link
            to="/dashboard"
            className="hover:opacity-85 transition-opacity px-1"
            onClick={onClose}
          >
            <img
              src="/logo-ligth.png"
              alt="Trainix Logo"
              className="size-11 object-contain select-none pointer-events-none dark:hidden block"
            />
            <img
              src="/logo-dark.png"
              alt="Trainix Logo"
              className="size-11 object-contain select-none pointer-events-none hidden dark:block"
            />
          </Link>
          <div className="w-8 h-px dark:bg-white/10 bg-black/10" />
        </div>

        <div className="flex-1 w-full overflow-y-auto scrollbar-none flex flex-col items-center gap-3 my-4 py-2 px-2">
          <TooltipProvider delayDuration={100}>
            {visibleItems.map((item) => {
              const isActive = currentPath.startsWith(item.url)
              return (
                <div
                  key={item.url}
                  className="w-full flex flex-col items-center"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.url}
                        onClick={onClose}
                        className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
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

                  {item.dividerAfter && (
                    <div className="my-2 h-px w-6 bg-border/20" />
                  )}
                </div>
              )
            })}
          </TooltipProvider>
        </div>
      </div>
    </>
  )
}

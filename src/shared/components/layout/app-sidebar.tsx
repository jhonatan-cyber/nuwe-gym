import { useState, useMemo } from 'react'
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
  Package,
  Tags,
  Truck,
  ShoppingCart,
  ShoppingBag,
  Warehouse,
  Landmark,
  UserCog,
  Search,
  BarChart3,
  Settings,
  Download,
  Bell,
  ScrollText,
  QrCode,
  Store,
  Database as DatabaseIcon,
} from 'lucide-react'
import { Link, useMatches } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '#/shared/components/ui/sidebar'
import type { UserRole } from '#/shared/lib/permissions.ts'
import { hasPermission } from '#/shared/lib/permissions.ts'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Parameters<typeof hasPermission>[1]
}

const allSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Gimnasio',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard:read',
      },
      { title: 'Socios', url: '/members', icon: Users, permission: 'members:read' },
      {
        title: 'Planes',
        url: '/membership-plans',
        icon: CreditCard,
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
        title: 'Códigos QR',
        url: '/qr-codes',
        icon: QrCode,
        permission: 'members:read',
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
      {
        title: 'Reportes',
        url: '/reports',
        icon: BarChart3,
        permission: 'reports:read',
      },
    ],
  },
  {
    label: 'Tienda',
    items: [
      {
        title: 'Categorías',
        url: '/product-categories',
        icon: Tags,
        permission: 'categories:read',
      },
      {
        title: 'Productos',
        url: '/products',
        icon: Package,
        permission: 'products:read',
      },
      {
        title: 'Proveedores',
        url: '/suppliers',
        icon: Truck,
        permission: 'suppliers:read',
      },
      {
        title: 'Compras',
        url: '/purchases',
        icon: ShoppingCart,
        permission: 'purchases:read',
      },
      { title: 'POS', url: '/pos', icon: ShoppingBag, permission: 'pos:use' },
      {
        title: 'Ventas',
        url: '/sales',
        icon: ShoppingBag,
        permission: 'sales:read',
      },
      {
        title: 'Inventario',
        url: '/inventory',
        icon: Warehouse,
        permission: 'inventory:read',
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        title: 'Notificaciones',
        url: '/notifications',
        icon: Bell,
        permission: 'notifications:read',
      },
      {
        title: 'Caja',
        url: '/cash-register',
        icon: Landmark,
        permission: 'cash:read',
      },
      {
        title: 'Configuración',
        url: '/settings',
        icon: Settings,
        permission: 'settings:read',
      },
      {
        title: 'Usuarios',
          url: '/users',
          icon: UserCog,
          permission: 'users:read',
        },
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
      ],
    },
]

export function AppSidebar({ role }: { role: UserRole }) {
  const [search, setSearch] = useState('')
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.fullPath ?? ''

  const query = search.toLowerCase()

  const filteredSections = useMemo(
    () =>
      allSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              (!item.permission || hasPermission(role, item.permission)) &&
              (!query || item.title.toLowerCase().includes(query)),
          ),
        }))
        .filter((s) => s.items.length > 0),
    [role, query],
  )

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            GM
          </div>
          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate">GymManager</span>
            <span className="text-xs text-muted-foreground truncate">POS System</span>
          </div>
        </div>
        <div className="group-data-[collapsible=icon]:hidden px-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <SidebarInput
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden scrollbar-none">
        {filteredSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath.startsWith(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          GymManager POS v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

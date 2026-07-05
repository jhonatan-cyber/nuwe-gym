import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Package,
  RefreshCw,
  CheckCheck,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  generateNotifications,
} from '#/features/notifications/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Card } from '#/shared/components/ui/card'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { formatRelativeTime } from '#/shared/lib/formatters.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  EXPIRATION: CalendarCheck,
  LOW_STOCK: Package,
  RENEWAL: RefreshCw,
  PAYMENT: CreditCard,
  SYSTEM: Bell,
}

const NOTIFICATION_STYLES: Record<string, string> = {
  EXPIRATION: 'text-orange-500 bg-orange-500/10',
  LOW_STOCK: 'text-red-500 bg-red-500/10',
  RENEWAL: 'text-emerald-500 bg-emerald-500/10',
  PAYMENT: 'text-blue-500 bg-blue-500/10',
  SYSTEM: 'text-gray-500 bg-gray-500/10',
}

const NOTIFICATION_LABELS: Record<string, string> = {
  EXPIRATION: 'Vencimiento',
  LOW_STOCK: 'Stock bajo',
  RENEWAL: 'Renovación',
  PAYMENT: 'Pago',
  SYSTEM: 'Sistema',
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { session } = authedRoute.useRouteContext()
  const userRole = session.user.role
  const isAdmin = userRole === 'ADMIN'

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ data: { page: 1, pageSize: 50 } }),
  })

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => getUnreadCount(),
  })

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      })
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al marcar como leída'),
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      })
      toast.success('Todas las notificaciones marcadas como leídas')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al marcar todo como leído'),
  })

  const generateMutation = useMutation({
    mutationFn: generateNotifications,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      })
      if (result.length === 0) {
        toast.info('No se encontraron novedades para notificar')
      } else {
        toast.success(`${result.length} notificaciones generadas`)
      }
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al generar notificaciones'),
  })

  const notifications = data?.notifications ?? []
  const unreadCount = unreadData ?? 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="size-8 text-primary" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Tenés ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
              : 'No tenés notificaciones pendientes'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate({})}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="size-4 mr-1" />
              Marcar todo como leído
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMutation.mutate({})}
              disabled={generateMutation.isPending}
            >
              <Sparkles className="size-4 mr-1" />
              Generar
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" label="Cargando notificaciones..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No hay notificaciones"
          description="Todas tus notificaciones aparecerán acá"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell
            const style =
              NOTIFICATION_STYLES[notification.type] ??
              NOTIFICATION_STYLES.SYSTEM
            const label = NOTIFICATION_LABELS[notification.type] ?? 'Sistema'

            return (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm ${!notification.isRead ? 'border-l-4 border-l-primary' : ''}`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsReadMutation.mutate({ data: { id: notification.id } })
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${style}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${style}`}
                      >
                        {label}
                      </span>
                      {!notification.isRead && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

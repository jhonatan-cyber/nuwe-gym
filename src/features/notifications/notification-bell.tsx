import { Bell } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUnreadCount,
  getNotifications,
  markAllAsRead,
} from '#/features/notifications/server.ts'
import { formatRelativeTime } from '#/shared/lib/formatters.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/shared/components/ui/dropdown-menu'
import { Button } from '#/shared/components/ui/button'

interface NotificationBellProps {
  userRole: string
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isAdmin = userRole === 'ADMIN'

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => getUnreadCount(),
    refetchInterval: 30000,
  })

  const { data: recentData } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => getNotifications({ data: { page: 1, pageSize: 5 } }),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const recentNotifications = recentData?.notifications ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} sin leer</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentNotifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No hay notificaciones
          </div>
        ) : (
          <>
            {recentNotifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2 px-3 cursor-default" disabled>
                <div className="flex items-center gap-2 w-full">
                  <span className={`text-xs font-medium ${n.isRead ? '' : 'text-primary'}`}>
                    {n.title}
                  </span>
                  {!n.isRead && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="p-1 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => router.navigate({ to: '/notifications' })}
              >
                Ver todas
              </Button>
              {isAdmin && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => markAllMutation.mutate({})}
                  disabled={markAllMutation.isPending}
                >
                  Marcar leídas
                </Button>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

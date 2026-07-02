import { Bell, BellOff, Loader2, Settings } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { usePushSubscription } from './use-push-subscription.ts'
import {
  DropdownMenuItem,
} from '#/shared/components/ui/dropdown-menu'

export function PushOptInMenuItem() {
  const router = useRouter()
  const {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    hasConfig,
  } = usePushSubscription()

  if (!isSupported) return null

  if (!hasConfig) {
    return (
      <DropdownMenuItem
        className="flex items-center gap-2 py-2 px-3 cursor-pointer"
        onClick={() => router.navigate({ to: '/settings' })}
      >
        <Settings className="size-4 text-muted-foreground" />
        <span className="text-xs">Configurar notificaciones push</span>
      </DropdownMenuItem>
    )
  }

  if (isLoading) {
    return (
      <DropdownMenuItem
        className="flex items-center gap-2 py-2 px-3 cursor-default"
        disabled
      >
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-xs">Configurando...</span>
      </DropdownMenuItem>
    )
  }

  if (isSubscribed) {
    return (
      <DropdownMenuItem
        className="flex items-center gap-2 py-2 px-3 cursor-pointer text-destructive hover:!text-destructive"
        onClick={unsubscribe}
      >
        <BellOff className="size-4" />
        <span className="text-xs">Desactivar notificaciones push</span>
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      className="flex items-center gap-2 py-2 px-3 cursor-pointer"
      onClick={subscribe}
    >
      <Bell className="size-4 text-primary" />
      <span className="text-xs">Activar notificaciones push</span>
    </DropdownMenuItem>
  )
}

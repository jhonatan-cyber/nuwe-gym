import { useState, useEffect, useCallback } from 'react'
import { BellRing, BellOff } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { subscribePush, unsubscribePush } from '#/features/notifications/server.ts'
import { DropdownMenuItem } from '#/shared/components/ui/dropdown-menu'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0))
}

export function PushOptInMenuItem() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'off' | 'on'>('loading')
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? 'on' : 'off'))
  }, [])

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      })
      const keys = sub.toJSON() as { endpoint: string; keys?: { auth: string; p256dh: string } }
      await subscribePush({
        data: {
          endpoint: keys.endpoint,
          auth: keys.keys?.auth ?? '',
          p256dh: keys.keys?.p256dh ?? '',
        },
      })
    },
    onSuccess: () => setStatus('on'),
    onError: () => setStatus('off'),
  })

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await unsubscribePush({ data: { endpoint } })
      }
    },
    onSuccess: () => setStatus('off'),
    onError: () => setStatus('off'),
  })

  const handleToggle = useCallback(() => {
    if (status === 'on') {
      unsubscribeMutation.mutate()
    } else if (status === 'off') {
      subscribeMutation.mutate()
    }
  }, [status])

  if (status === 'loading' || status === 'unsupported') return null

  const isBusy = subscribeMutation.isPending || unsubscribeMutation.isPending

  return (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isBusy || status === 'denied'}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isBusy || status === 'denied'}
        className="flex w-full items-center gap-2 text-sm"
      >
        {status === 'on' ? (
          <>
            <BellOff className="size-4" />
            Desactivar notificaciones push
          </>
        ) : status === 'denied' ? (
          <>
            <BellOff className="size-4 text-muted-foreground" />
            Notificaciones bloqueadas
          </>
        ) : (
          <>
            <BellRing className="size-4" />
            Activar notificaciones push
          </>
        )}
      </button>
    </DropdownMenuItem>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSettings } from '#/features/settings/server.ts'
import {
  registerPushToken,
  unregisterPushToken,
  getUserPushTokens,
} from './server.ts'

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const queryClient = useQueryClient()

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(),
    staleTime: 1000 * 60 * 5,
  })

  const { data: myTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['push-tokens'],
    queryFn: () => getUserPushTokens(),
  })

  const isSubscribed = (myTokens?.length ?? 0) > 0

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const registerMutation = useMutation({
    mutationFn: registerPushToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-tokens'] })
    },
  })

  const unregisterMutation = useMutation({
    mutationFn: unregisterPushToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-tokens'] })
    },
  })

  const subscribe = useCallback(async () => {
    if (!settingsData) {
      toast.error('Configuración de Firebase no disponible')
      return
    }

    const vapidKey = settingsData.firebaseVapidKey
    if (!vapidKey) {
      toast.error(
        'VAPID Key no configurada. Configurá Firebase en Settings > Notificaciones.',
      )
      return
    }

    try {
      // Dynamic import of firebase modules
      const { initializeApp, getApps, getApp } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')

      const config = {
        apiKey: settingsData.firebaseApiKey,
        authDomain: settingsData.firebaseAuthDomain,
        projectId: settingsData.firebaseProjectId,
        messagingSenderId: settingsData.firebaseMessagingSenderId,
        appId: settingsData.firebaseAppId,
      }

      // Avoid duplicate Firebase app initialization
      const app = getApps().length === 0 ? initializeApp(config) : getApp()

      if (!config.apiKey || !config.projectId) {
        toast.error('Configuración de Firebase incompleta. Configurá en Settings.')
        return
      }

      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        toast.error('Permiso de notificaciones denegado')
        return
      }

      const app = initializeApp(config)
      const messaging = getMessaging(app)
      const token = await getToken(messaging, { vapidKey })

      // Initialize service worker with Firebase config
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({ type: 'INIT_FIREBASE', config })
      } else {
        // If SW hasn't activated yet, wait for activation
        registration.addEventListener('activate', () => {
          registration.active?.postMessage({ type: 'INIT_FIREBASE', config })
        })
      }

      // Send token to server
      await registerMutation.mutateAsync({
        data: {
          token,
          deviceInfo: navigator.userAgent || '',
        },
      })

      toast.success('Notificaciones push activadas correctamente')
    } catch (err: any) {
      console.error('[Push] Error subscribing:', err)
      toast.error(
        err?.message || 'Error al activar notificaciones push',
      )
    }
  }, [settingsData, registerMutation])

  const unsubscribe = useCallback(async () => {
    if (!myTokens || myTokens.length === 0) return

    try {
      // Unregister all tokens for this user (usually just one)
      for (const sub of myTokens) {
        await unregisterMutation.mutateAsync({
          data: { token: sub.token },
        })
      }

      toast.success('Notificaciones push desactivadas')
    } catch (err: any) {
      console.error('[Push] Error unsubscribing:', err)
      toast.error('Error al desactivar notificaciones push')
    }
  }, [myTokens, unregisterMutation])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading: tokensLoading || registerMutation.isPending,
    subscribe,
    unsubscribe,
    hasConfig: !!(settingsData?.firebaseApiKey && settingsData?.firebaseProjectId),
  }
}

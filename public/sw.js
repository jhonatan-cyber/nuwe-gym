// Web Push API Service Worker (no Firebase)
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const title = payload.title ?? 'Nueva notificación'
    const options = {
      body: payload.body ?? '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data ?? {},
      requireInteraction: true,
      vibrate: [200, 100, 200],
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch {
    // Not JSON — show raw text
    event.waitUntil(
      self.registration.showNotification(event.data.text()),
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url ?? '/notifications'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow(urlToOpen)
      }),
  )
})

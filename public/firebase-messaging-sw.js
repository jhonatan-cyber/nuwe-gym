// Firebase Cloud Messaging Service Worker
// This file must be in the public directory and loaded by Firebase SDK

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// Firebase will be initialized with config passed from the client
// The onBackgroundMessage handler works regardless of the config values
// as long as the messaging object is available

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Keep a reference to the messaging instance set from the client
let messaging = null

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE') {
    try {
      const firebaseApp = firebase.initializeApp(event.data.config)
      messaging = firebase.messaging()

      // Handle background messages
      messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'Nueva notificación'
        const notificationBody = payload.notification?.body || ''
        const notificationOptions = {
          body: notificationBody,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data || {},
          requireInteraction: true,
          vibrate: [200, 100, 200],
        }

        self.registration.showNotification(notificationTitle, notificationOptions)
      })
    } catch (err) {
      console.error('[SW] Firebase init error:', err)
    }
  }
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/notifications'

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

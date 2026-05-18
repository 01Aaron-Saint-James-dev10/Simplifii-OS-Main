/**
 * sw-notifications.js
 *
 * Minimal service worker for Simplifii-OS browser push notifications.
 * Handles scheduled notification display and click-to-open.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Show notification from postMessage
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url } = event.data;
    self.registration.showNotification(title || 'Simplifii-OS', {
      body: body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'simplifii-default',
      data: { url: url || '/' },
      requireInteraction: false,
    });
  }
});

// Click opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

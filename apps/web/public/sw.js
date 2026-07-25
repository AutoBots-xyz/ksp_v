/*
 * KSP Crime Intelligence — service worker.
 *
 * Required for Catalyst Web Push Notifications to function.
 * Doc: https://docs.catalyst.zoho.com/en/cloud-scale/help/push-notifications/web/
 *
 * The Catalyst Web SDK's enableNotification() snippet handles user-device
 * subscription registration, but the browser still requires a service worker
 * registered at a stable path to receive push events. This file provides that
 * minimal worker and forwards 'push' and 'notificationclick' events to the
 * Catalyst SDK when it is loaded, falling back to a basic self-show for push
 * payloads when the SDK is absent (e.g. local dev).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'KSP Alert', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'KSP Crime Intelligence';
  const options = {
    body: payload.body || payload.message || '',
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/icon.png',
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl !== '/') client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    })
  );
});

// Service worker — Web Push. Must live in public/ so it is served at /sw.js.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
// Empty fetch handler: some browsers only treat a worker with one as installable.
self.addEventListener('fetch', () => {});

// Payload shape sent by the backend:
//   { "title": "...", "body": "...", "data": { "url": "/staff/orders" } }
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Ayeyarwady Grill' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Ayeyarwady Grill', {
      body: payload.body || '',
      icon: '/images/logo-icon.png',
      data: payload.data || {},
      requireInteraction: false,
    })
  );
});

// Focus an open dashboard tab and navigate it to the relevant page,
// or open a new window if none is open.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          return client
            .focus()
            .then((focused) => focused.navigate(new URL(targetPath, client.url).href));
        }
      }
      return clients.openWindow(targetPath);
    })
  );
});

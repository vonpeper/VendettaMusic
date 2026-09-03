// Vendetta Music — Web Push Service Worker
const CACHE_NAME = 'vendetta-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification received in background
self.addEventListener('push', (event) => {
  let data = {
    title: '⚡ Vendetta Music',
    body: '¡Hay una actualización en la agenda de shows!',
    icon: '/images/logo-icon.png',
    badge: '/images/logo-icon.png',
    url: '/agenda'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/logo-icon.png',
    badge: data.badge || '/images/logo-icon.png',
    vibrate: [200, 100, 200],
    tag: 'vendetta-reminder',
    renotify: true,
    data: {
      url: data.url || '/agenda',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open_agenda', title: '🎸 Ver Agenda' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// User clicked notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/agenda';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

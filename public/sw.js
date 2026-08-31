// Vendetta Music — Web Push Service Worker
const CACHE_VERSION = 'vendetta-sw-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// Push notification received in background
self.addEventListener('push', (event) => {
  let payload = {
    title: '⚡ VENDETTA | ¡HOY HAY SHOW!',
    body: '🎸 Hay show agendado para hoy. Toca para ver horarios y locación.',
    icon: '/images/branding/logo-vendetta.png',
    url: '/agenda'
  };

  if (event.data) {
    try {
      const json = event.data.json();
      if (json && typeof json === 'object') {
        payload = { ...payload, ...json };
      }
    } catch (e) {
      try {
        const text = event.data.text();
        if (text) {
          payload.body = text;
        }
      } catch (_) {}
    }
  }

  const title = payload.title || '⚡ VENDETTA MUSIC';

  // Safe options compatible with iOS Safari webpushd, Android Chrome, and Desktop
  const options = {
    body: payload.body || '¡Hay una actualización en la agenda!',
    icon: payload.icon || '/images/branding/logo-vendetta.png',
    tag: 'vendetta-push-' + Date.now(),
    data: {
      url: payload.url || '/agenda',
      dateOfArrival: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error('Error showing notification with full options, retrying fallback:', err);
      return self.registration.showNotification(title, {
        body: payload.body || 'Aviso de Vendetta Music'
      });
    })
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

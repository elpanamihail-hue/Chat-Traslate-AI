/**
 * Service Worker for ChatTranslate
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (action === 'accept-call') {
     event.waitUntil(
       self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
         for (const client of clientList) {
           if ('focus' in client) {
             client.postMessage({ type: 'CALL_ACTION', action: 'accept', callId: notification.data?.callId });
             return client.focus();
           }
         }
         return self.clients.openWindow('/?action=accept-call&callId=' + (notification.data?.callId || ''));
       })
     );
     return;
  }

  if (action === 'decline-call') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({ type: 'CALL_ACTION', action: 'decline', callId: notification.data?.callId });
            return;
          }
        }
      })
    );
    return;
  }

  // Default: focus/open app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});

// For future FCM integration
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data,
      actions: data.actions || []
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

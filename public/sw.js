// Service Worker for Background Notifications
self.addEventListener('push', function(event) {
  let payload = {
    title: 'ChatTranslate',
    body: 'Tienes un nuevo mensaje',
    url: '/'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      // Handle FCM format
      if (data.notification) {
        payload.title = data.notification.title || payload.title;
        payload.body = data.notification.body || payload.body;
      } else {
        payload = { ...payload, ...data };
      }
      if (data.data && data.data.url) payload.url = data.data.url;
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: 'https://picsum.photos/seed/vibe_notif/192/192',
    badge: 'https://picsum.photos/seed/vibe_badge/96/96',
    data: {
      url: payload.url
    },
    tag: 'vibe-coding-message',
    renotify: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

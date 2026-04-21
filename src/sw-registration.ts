export function registerServiceWorker(onUpdate: (registration: ServiceWorkerRegistration) => void) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, but the current SW is still controlling the page.
                  onUpdate(registration);
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function checkSystemPermissions() {
  const status = {
    mic: 'unknown',
    camera: 'unknown'
  };

  if ('permissions' in navigator) {
    Promise.all([
      navigator.permissions.query({ name: 'microphone' as any }),
      navigator.permissions.query({ name: 'camera' as any })
    ]).then(([micPerm, camPerm]) => {
      console.log('Mic Permission:', micPerm.state);
      console.log('Cam Permission:', camPerm.state);
    });
  }
}

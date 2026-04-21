import { getToken } from 'firebase/messaging';
import { messaging, db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const requestNotificationPermission = async (userUid?: string) => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones de escritorio');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await registerServiceWorker();
    if (userUid) {
      await setupFCM(userUid);
    }
    return true;
  }
  return false;
};

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (err) {
      console.error('Error al registrar Service Worker:', err);
    }
  }
};

const setupFCM = async (uid: string) => {
  try {
    const fcm = await messaging();
    if (!fcm) return;

    // Use default VAPID key if provided in env, else it might fail but the logic is there
    const token = await getToken(fcm, {
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
    });

    if (token) {
      console.log('FCM Token obtenido:', token);
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: token
      });
    }
  } catch (err) {
    console.warn('Error al configurar FCM:', err);
  }
};

export const showNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: icon || 'https://picsum.photos/seed/vibe_notif/192/192',
          tag: 'vibe-coding-message',
          renotify: true
        } as any);
      });
    } else {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
      });
    }
  }
};

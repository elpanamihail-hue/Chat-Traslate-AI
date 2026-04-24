import { supabase } from './supabase';
import { translateText } from '../services/ai';

export const requestNotificationPermission = async (userUid?: string) => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones de escritorio');
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
      console.log('Service Worker registrado correctamente');
      return registration;
    } catch (err) {
      console.error('Error al registrar Service Worker:', err);
    }
  }
};

const setupFCM = async (uid: string) => {
  // Push notifications currently bypassed during Supabase migration
  // Placeholder for future Push service (OneSignal / WebPush)
  console.log('FCM setup bypassed for Supabase migration');
};

/**
 * Shows a standard message notification with automatic translation if needed.
 */
export const showNotification = async (title: string, body: string, targetLanguage?: string, icon?: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  let textToShow = body;
  if (targetLanguage) {
    try {
      textToShow = await translateText(body, targetLanguage);
    } catch (e) {
      console.error("Translation fail in notification:", e);
    }
  }

  const options: any = {
    body: textToShow,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'chat-message',
    renotify: true,
    vibrate: [200, 100, 200]
  };

  if (document.visibilityState !== 'visible') {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  }
};

/**
 * Shows a high-priority call notification with action buttons and persistent vibration.
 */
export const showCallNotification = async (callerName: string, callId: string, type: 'video' | 'voice' = 'video', icon?: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const title = `Llamada de ${type === 'video' ? 'Video' : 'Voz'} Entrante`;
  const body = `${callerName} te está llamando...`;

  const options: any = {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'incoming-call',
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts
    silent: false,
    data: { callId },
    actions: [
      { action: 'accept-call', title: '✅ Aceptar' },
      { action: 'decline-call', title: '❌ Rechazar' }
    ]
  };

  // Vibrate pattern for calls: long-short-long
  if (navigator.vibrate) {
    navigator.vibrate([500, 200, 500, 200, 500]);
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
};

export const stopVibration = () => {
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
};

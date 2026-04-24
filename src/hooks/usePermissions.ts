import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission } from '../lib/notifications';
import { auth } from '../lib/firebase';

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'loading';

export function usePermissions() {
  const [mic, setMic] = useState<PermissionStatus>('loading');
  const [camera, setCamera] = useState<PermissionStatus>('loading');
  const [notifications, setNotifications] = useState<PermissionStatus>('loading');

  const checkStatus = useCallback(async () => {
    // Check Notifications
    if (!('Notification' in window)) {
      setNotifications('denied');
    } else {
      setNotifications(Notification.permission as any);
    }

    // Check Mic & Camera using Permissions API if available
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMic(micResult.state as any);
        micResult.onchange = () => setMic(micResult.state as any);

        const camResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCamera(camResult.state as any);
        camResult.onchange = () => setCamera(camResult.state as any);
      } else {
        // Fallback for browsers that don't support Permissions API for mic/cam
        setMic('prompt');
        setCamera('prompt');
      }
    } catch (e) {
      console.warn("Permissions API not fully supported", e);
      setMic('prompt');
      setCamera('prompt');
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const requestAll = async () => {
    // Step 1: Push Notifications (Elegant & Sequential)
    try {
      const userUid = auth.currentUser?.uid;
      const granted = await requestNotificationPermission(userUid);
      setNotifications(granted ? 'granted' : Notification.permission as any);
    } catch (e) {
      console.error("error requesting notifications", e);
    }

    // Small delay to prevent overlap of system dialogs
    await new Promise(r => setTimeout(r, 500));

    // Step 2: Mic & Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      // If successful, stop the tracks immediately
      stream.getTracks().forEach(track => track.stop());
      setMic('granted');
      setCamera('granted');
    } catch (err) {
      console.error("Permission request failed", err);
      // Usually signifies denial or hardware issue
      checkStatus();
    }
  };

  return { mic, camera, notifications, requestAll, refresh: checkStatus };
}

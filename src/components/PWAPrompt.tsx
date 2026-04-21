import React, { useState, useEffect } from 'react';
import { Download, RefreshCcw, X, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // SW Update logic - this is triggered by our registration script
    (window as any).onServiceWorkerUpdate = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      setShowUpdate(true);
    };

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Proactive permissions before installing
    try {
      await Notification.requestPermission();
      // Explicitly request camera and microphone before installation finishes
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.log('Permission request ignored or denied before install:', err);
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    }
    window.location.reload();
  };

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[300] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {showInstall && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="pointer-events-auto bg-w-sidebar border border-w-accent/20 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl flex items-center gap-4 max-w-md mx-auto"
          >
            <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-[#25D366]" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#25D366] mb-1">Instalar ChatTranslate</h4>
              <p className="text-[11px] text-w-muted leading-tight">Accede al instante desde tu pantalla de inicio.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstall}
                className="bg-[#25D366] text-w-bg px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-tighter"
              >
                Instalar
              </button>
              <button 
                onClick={() => setShowInstall(false)}
                className="p-2 text-w-muted hover:text-w-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {showUpdate && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="pointer-events-auto bg-w-accent border border-white/20 rounded-[2rem] p-5 shadow-2xl flex items-center gap-4 max-w-md mx-auto"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <RefreshCcw className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-white">
              <h4 className="text-xs font-black uppercase tracking-widest mb-1">Nueva Versión</h4>
              <p className="text-[11px] opacity-80 leading-tight">Actualiza para recibir las últimas mejoras de IA.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUpdate}
                className="bg-white text-w-accent px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-tighter"
              >
                Recargar
              </button>
              <button 
                onClick={() => setShowUpdate(false)}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

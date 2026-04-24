import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mic, Video, Bell, Loader2, Sparkles, X } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { t } from '../lib/i18n';

interface Props {
  lang: string;
  onClose: () => void;
}

export default function PermissionModal({ lang, onClose }: Props) {
  const { mic, camera, notifications, requestAll } = usePermissions();
  const [requesting, setRequesting] = useState(false);

  const isDenied = mic === 'denied' || camera === 'denied' || notifications === 'denied';

  const handleRequest = async () => {
    if (isDenied) {
      // If denied, we can't request via JS. Just close and hope they use the banner or browser settings.
      onClose();
      return;
    }
    setRequesting(true);
    await requestAll();
    setRequesting(false);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-w-bg/60 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-w-header/90 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#25D366]/10 blur-[80px] rounded-full"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-w-muted hover:text-white transition-colors bg-white/5 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-[#25D366]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-[#25D366]/20 relative">
            <ShieldCheck className="w-12 h-12 text-[#25D366]" />
            <div className="absolute inset-0 bg-[#25D366]/20 rounded-[2rem] animate-pulse"></div>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase leading-none">
            {t('Acceso Requerido', lang)}
          </h2>
          
          <p className="text-w-muted text-sm leading-relaxed mb-10 px-2">
            {isDenied 
              ? t('Algunos permisos han sido denegados. Por favor, habilítalos en la configuración de tu navegador para usar todas las funciones.', lang)
              : t('Para ofrecerte una experiencia de comunicación sin fronteras, necesitamos activar algunos permisos de tu sistema.', lang)
            }
          </p>

          <div className="space-y-6 text-left mb-12">
            <div className="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center shrink-0 border border-[#25D366]/20">
                <Video className="w-6 h-6 text-w-accent" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  {t('Voz y Video', lang)}
                </h3>
                <p className="text-[10px] text-w-muted leading-tight mt-1">
                  {t('Micrófono y cámara para subtítulos en real-time.', lang)}
                </p>
              </div>
              {mic === 'granted' && camera === 'granted' && <div className="ml-auto text-[#25D366]">✅</div>}
            </div>

            <div className="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center shrink-0 border border-[#25D366]/20">
                <Bell className="w-6 h-6 text-w-accent" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  {t('Notificaciones', lang)}
                </h3>
                <p className="text-[10px] text-w-muted leading-tight mt-1">
                  {t('Alertas de mensajes y llamadas entrantes.', lang)}
                </p>
              </div>
              {notifications === 'granted' && <div className="ml-auto text-[#25D366]">✅</div>}
            </div>
          </div>

          <button 
            onClick={handleRequest}
            disabled={requesting}
            className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-w-bg font-black uppercase text-xs tracking-[0.2em] py-5 rounded-[1.5rem] transition-all shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {requesting ? <Loader2 className="animate-spin w-5 h-5" /> : (isDenied ? t('Entendido', lang) : t('Habilitar Permisos', lang))}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

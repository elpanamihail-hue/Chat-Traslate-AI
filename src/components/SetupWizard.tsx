import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mic, Video, Bell, CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { cn } from '../lib/utils';

interface Props {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: Props) {
  const { mic, camera, notifications, requestAll } = usePermissions();
  const [requesting, setRequesting] = useState(false);
  const [step, setStep] = useState(0);

  const handleStart = async () => {
    setRequesting(true);
    await requestAll();
    setRequesting(false);
    setStep(1);
  };

  const allGranted = mic === 'granted' && camera === 'granted' && notifications === 'granted';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-w-bg flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#25D366]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-xl w-full z-10">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-[#25D366]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative border border-[#25D366]/20">
                <Sparkles className="w-10 h-10 text-[#25D366]" />
                <div className="absolute inset-0 bg-[#25D366]/20 rounded-[2rem] animate-ping opacity-20"></div>
              </div>
              
              <h1 className="text-4xl font-black text-w-text mb-6 tracking-tighter uppercase leading-none">
                Bienvenido a <br/><span className="text-[#25D366]">ChatTranslate AI</span>
              </h1>
              
              <div className="bg-w-header/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 mb-10 text-left">
                <p className="text-w-muted text-sm leading-relaxed mb-6">
                  "Necesitamos acceso a tu micrófono y cámara para la función de <span className="text-w-text font-bold">Traducción en Vivo</span>, ¡tal como el Galaxy S24!"
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-w-text">
                    <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest">Micrófono</h3>
                      <p className="text-[10px] text-w-muted">Para traducir tu voz al instante.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-w-text">
                    <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest">Cámara</h3>
                      <p className="text-[10px] text-w-muted">Para videollamadas con subtítulos IA.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-w-text">
                    <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest">Notificaciones</h3>
                      <p className="text-[10px] text-w-muted">Mantente al día sin abrir la App.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleStart}
                disabled={requesting}
                className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-w-bg font-black uppercase text-xs tracking-[0.3em] py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,211,102,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {requesting ? <Loader2 className="animate-spin w-5 h-5" /> : <>Iniciar Configuración <ChevronRight className="w-5 h-5" /></>}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-[#25D366]/30">
                <CheckCircle2 className="w-12 h-12 text-[#25D366]" />
              </div>
              
              <h2 className="text-3xl font-black text-w-text mb-4 tracking-tighter uppercase">Protocolo Finalizado</h2>
              <p className="text-w-muted text-sm mb-10">Estado del sistema verificado correctamente.</p>
              
              <div className="bg-w-header/40 p-6 rounded-3xl border border-white/5 space-y-4 mb-10 overflow-hidden relative">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-w-sidebar/50 border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-widest text-w-text">Micrófono</span>
                  <StatusIcon status={mic} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-w-sidebar/50 border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-widest text-w-text">Cámara</span>
                  <StatusIcon status={camera} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-w-sidebar/50 border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-widest text-w-text">Notificaciones</span>
                  <StatusIcon status={notifications} />
                </div>
              </div>

              <button 
                onClick={onComplete}
                className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-w-bg font-black uppercase text-xs tracking-[0.3em] py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,211,102,0.2)] active:scale-[0.98]"
              >
                Continuar al Chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'granted') return <span className="text-[#25D366] text-lg">✅</span>;
  if (status === 'denied') return <span className="text-red-500 text-lg">❌</span>;
  return <Loader2 className="w-4 h-4 animate-spin text-w-muted" />;
}

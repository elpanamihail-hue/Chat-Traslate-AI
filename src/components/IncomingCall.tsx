import React, { useEffect, useRef } from 'react';
import { Phone, Video, X, PhoneCall } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  callerName: string;
  callerPhoto: string;
  type: 'video' | 'audio';
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCall({ callerName, callerPhoto, type, onAccept, onDecline }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sound logic
    audioRef.current = new Audio('/ringtone.mp3');
    audioRef.current.loop = true;
    
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Ringtone playback blocked by browser:", error);
      });
    }

    // Vibration logic
    if (navigator.vibrate) {
      navigator.vibrate([500, 300, 500, 300, 500]);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[500] pointer-events-none flex justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        className="pointer-events-auto bg-w-sidebar/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 ring-1 ring-white/20"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <div className="absolute -inset-1.5 bg-w-accent/20 rounded-full animate-ping duration-[3000ms]"></div>
            <img 
              src={callerPhoto || 'https://picsum.photos/seed/user/200/200'} 
              alt={callerName} 
              className="w-12 h-12 rounded-full border-2 border-w-accent shadow-lg relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{callerName}</h2>
            <div className="flex items-center gap-1.5 text-w-accent font-black uppercase tracking-widest text-[8px] whitespace-nowrap">
              <PhoneCall className="w-2.5 h-2.5 animate-bounce" />
              Llamada de {type === 'video' ? 'Video' : 'Voz'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={onDecline}
            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-900/20 transition-all active:scale-90 flex items-center justify-center p-0"
            title="Rechazar"
          >
            <X className="w-5 h-5" />
          </button>

          <button 
            onClick={onAccept}
            className="h-10 px-4 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full shadow-lg shadow-green-900/40 transition-all active:scale-95 flex items-center gap-2 group"
            title="Responder"
          >
            <div className="bg-white/20 p-1 rounded-full group-hover:scale-110 transition-transform">
              {type === 'video' ? <Video className="w-3.5 h-3.5 fill-current" /> : <Phone className="w-3.5 h-3.5 fill-current" />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Responder</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

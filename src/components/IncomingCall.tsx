import React from 'react';
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
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-w-sidebar border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-w-accent animate-pulse"></div>
        </div>

        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-w-accent/20 rounded-full animate-ping duration-[2000ms]"></div>
            <img 
              src={callerPhoto || 'https://picsum.photos/seed/user/200/200'} 
              alt={callerName} 
              className="w-24 h-24 rounded-full border-4 border-w-accent shadow-xl relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-2xl font-bold text-w-text mb-2">{callerName}</h2>
          <div className="flex items-center gap-2 text-w-accent font-black uppercase tracking-widest text-[10px] mb-8">
            <PhoneCall className="w-3 h-3 animate-bounce" />
            Llamada de {type === 'video' ? 'Video' : 'Voz'} Entrante
          </div>

          <div className="flex items-center gap-6 w-full">
            <button 
              onClick={onDecline}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white p-5 rounded-3xl shadow-lg shadow-red-900/20 transition-all active:scale-95 flex flex-col items-center gap-2"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <X className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Rechazar</span>
            </button>

            <button 
              onClick={onAccept}
              className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white p-5 rounded-3xl shadow-lg shadow-green-900/40 transition-all active:scale-95 flex flex-col items-center gap-2"
            >
              <div className="bg-white/20 p-2 rounded-full">
                {type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Responder</span>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Background Audio - Ringtone simulation visually */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-w-accent animate-[loading_2s_infinite]"></div>
    </div>
  );
}

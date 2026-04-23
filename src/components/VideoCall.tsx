import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Peer, { DataConnection } from 'peerjs';
import { UserProfile } from '../types';
import { translateText } from '../services/ai';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  profile: UserProfile;
  remotePeerId: string;
  remoteName: string;
  callId?: string;
  isCaller?: boolean;
  onClose: () => void;
}

export default function VideoCall({ profile, remotePeerId, remoteName, callId, isCaller, onClose }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [mySubtitles, setMySubtitles] = useState('');
  const [remoteSubtitles, setRemoteSubtitles] = useState('');
  const [translatedSubtitles, setTranslatedSubtitles] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'accepted' | 'declined' | 'ended'>('ringing');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const recognitionRef = useRef<any>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listener for Call Status in Firestore
    if (callId) {
      const unsub = onSnapshot(doc(db, 'calls', callId), (docSnap) => {
        if (docSnap.exists()) {
          const status = docSnap.data().status;
          setCallStatus(status);
          if (status === 'declined' || status === 'ended') {
            onClose();
          }
        } else {
          onClose(); // Doc deleted
        }
      });
      return () => unsub();
    }
  }, [callId, onClose]);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Use profile.uid so callers can find us
        peerRef.current = new Peer(profile.uid); 

        peerRef.current.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          
          if (isCaller) {
            // Only caller initiates call/connection
            const call = peerRef.current!.call(remotePeerId, stream);
            setupCallListeners(call);

            const conn = peerRef.current!.connect(remotePeerId);
            setupDataConn(conn);
          }
        });

        peerRef.current.on('call', (call) => {
          call.answer(stream);
          setupCallListeners(call);
        });

        peerRef.current.on('connection', (conn) => {
          setupDataConn(conn);
        });

        peerRef.current.on('error', (err) => {
          console.warn('Peer error:', err);
          // If Peer ID taken, another instance might be open
        });

        // STT Logic
        initSTT();

      } catch (err) {
        console.error('Failed to get local stream', err);
        onClose();
      }
    };

    const setupCallListeners = (call: any) => {
      call.on('stream', (rStream: MediaStream) => {
        setRemoteStream(rStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
      });
      call.on('close', onClose);
      call.on('error', (err: any) => {
        console.error('Peer Call Error:', err);
        onClose();
      });
    };

    const setupDataConn = (conn: DataConnection) => {
      dataConnRef.current = conn;
      conn.on('data', async (data: any) => {
        if (typeof data === 'object' && data.type === 'subtitle') {
          const text = data.text;
          setRemoteSubtitles(text);
          
          // Clear old subtitles if new one is final
          if (data.isFinal) {
            handleTranslation(text);
          }
        }
      });
    };

    initCall();

    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    };
  }, []);

  const handleTranslation = async (text: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      // Translate from whatever their language is to MY native language
      const translated = await translateText(text, profile.nativeLanguage);
      setTranslatedSubtitles(translated);
      
      // Auto-clear subtitles after 4 seconds of silence
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = setTimeout(() => {
        setRemoteSubtitles('');
        setTranslatedSubtitles('');
        setMySubtitles('');
      }, 5000);
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const initSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    const langMap: {[key: string]: string} = {
      'Spanish': 'es-ES',
      'English': 'en-US',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-PT'
    };
    recognition.lang = langMap[profile.nativeLanguage] || 'es-ES';

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      setMySubtitles(transcript);

      // Send to peer
      if (dataConnRef.current && dataConnRef.current.open) {
        dataConnRef.current.send({
          type: 'subtitle',
          text: transcript,
          isFinal: isFinal
        });
      }

      // Reset local subtitle timer
      if (isFinal) {
        if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
        subtitleTimeoutRef.current = setTimeout(() => setMySubtitles(''), 3000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      if (event.error === 'no-speech') return;
      try {
        recognition.stop();
        setTimeout(() => recognition.start(), 1000);
      } catch (e) {}
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
      
      if (!isMicOn) {
        recognitionRef.current?.start();
      } else {
        recognitionRef.current?.stop();
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 md:p-8"
    >
      <div className="relative w-full max-w-6xl aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Remote Video (Main) */}
        <video 
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <PhoneOff className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-xl font-medium tracking-tight">
              {callStatus === 'ringing' ? `Llamando a ${remoteName}...` : `Conectando con ${remoteName}...`}
            </p>
            <p className="text-sm text-gray-500 mt-2 italic font-mono uppercase tracking-widest">
              {callStatus === 'ringing' ? 'Esperando respuesta...' : 'Sincronizando Traductor IA'}
            </p>
          </div>
        )}

        {/* Local Video (PiP) */}
        <div className="absolute top-6 right-6 w-1/4 md:w-1/5 aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 z-20">
          <video 
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-white/50" />
            </div>
          )}
        </div>

        {/* Subtitles Overlay */}
        <div className="absolute bottom-32 inset-x-0 flex flex-col items-center px-8 z-30 pointer-events-none gap-4">
          <AnimatePresence>
            {/* My Subtitles (Transcription of local user) */}
            {mySubtitles && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 max-w-xl text-center"
              >
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Tú</p>
                <p className="text-white text-sm opacity-80 italic">"{mySubtitles}"</p>
              </motion.div>
            )}

            {/* Remote Subtitles (Transcription of other user) */}
            {remoteSubtitles && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-black/60 backdrop-blur-lg px-6 py-4 rounded-2xl border border-w-accent/20 max-w-2xl text-center shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Globe className={cn("w-3 h-3 text-w-accent", isTranslating && "animate-spin")} />
                  <span className="text-[10px] text-w-accent font-black uppercase tracking-[0.2em]">{remoteName} • Traduciendo</span>
                </div>

                <div className="flex flex-col gap-2">
                   {/* Original remote text (dimmed) */}
                   <p className="text-gray-400 text-xs italic line-clamp-1">
                     {remoteSubtitles}
                   </p>
                   {/* Translated text (main) */}
                   <p className="text-white text-lg md:text-xl font-bold leading-tight tracking-tight">
                     {translatedSubtitles || "..."}
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-4 md:gap-8 z-40">
          <button 
            onClick={toggleMic}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
              isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white"
            )}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={onClose}
            className="w-16 h-16 md:w-20 md:h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group"
          >
            <PhoneOff className="w-8 h-8 group-hover:rotate-[135deg] transition-transform duration-300" />
          </button>

          <button 
            onClick={toggleVideo}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
              isVideoOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white"
            )}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Info Overlay */}
        <div className="absolute top-6 left-6 flex flex-col gap-3">
          <div className="text-white bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Encriptado • Live Transcribe</span>
          </div>
          <div className="bg-w-sidebar/60 backdrop-blur-xl px-4 py-3 rounded-2xl border border-w-accent/10 max-w-[240px] shadow-2xl">
             <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-w-accent" />
                <span className="text-[9px] font-black text-w-accent uppercase tracking-tighter">Gemini Instant Translate</span>
             </div>
             <p className="text-[10px] text-gray-400 leading-snug">
               Traducción automática de voz configurada a <span className="text-w-text font-bold uppercase">{profile.nativeLanguage}</span>.
             </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { translateText } from '../services/ai';
import { 
  X, Mic, MicOff, Video, VideoOff, PhoneOff, Globe, 
  Monitor, MonitorOff, Camera, RefreshCw, Volume2, VolumeX, Maximize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  profile: UserProfile;
  remotePeerId: string;
  remoteName: string;
  callId?: string;
  isCaller?: boolean;
  type?: 'video' | 'voice';
  onClose: () => void;
}

import { t } from '../lib/i18n';

export default function VideoCall({ profile, remotePeerId, remoteName, callId, isCaller, type = 'video', onClose }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(type === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mySubtitles, setMySubtitles] = useState('');
  const [remoteSubtitles, setRemoteSubtitles] = useState('');
  const [translatedSubtitles, setTranslatedSubtitles] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'accepted' | 'declined' | 'ended'>('ringing');
  
  const lang = profile.nativeLanguage;
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef(false);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Call Duration Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'accepted') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const stopAllTracks = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
  };

  useEffect(() => {
    const initCall = async () => {
      if (!callId) return;

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        // Data Channel for subtitles
        if (isCaller) {
          const dc = pc.createDataChannel('chat');
          setupDataChannel(dc);
        } else {
          pc.ondatachannel = (event) => setupDataChannel(event.channel);
        }

        // Signaling logic
        const callDoc = doc(db, 'calls', callId);
        const callerCandidatesCollection = collection(callDoc, 'callerCandidates');
        const recipientCandidatesCollection = collection(callDoc, 'recipientCandidates');

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(isCaller ? callerCandidatesCollection : recipientCandidatesCollection, event.candidate.toJSON());
          }
        };

        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await updateDoc(callDoc, { offer: { type: offer.type, sdp: offer.sdp } });

          onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
              const answer = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answer);
            }
          });

          onSnapshot(recipientCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });
        } else {
          onSnapshot(callDoc, async (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.offer) {
              const offer = new RTCSessionDescription(data.offer);
              await pc.setRemoteDescription(offer);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp } });
            }
          });

          onSnapshot(callerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });
        }

        initSTT();

      } catch (err) {
        console.error('Failed to init WebRTC', err);
        onClose();
      }
    };

    const setupDataChannel = (dc: RTCDataChannel) => {
      dataChannelRef.current = dc;
      dc.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'subtitle') {
          setRemoteSubtitles(data.text);
          if (data.isFinal) handleTranslation(data.text);
        }
      };
    };

    initCall();

    return () => {
      stopAllTracks(localStream);
      pcRef.current?.close();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    };
  }, []);

  const handleScreenShare = async () => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      alert("La función de compartir pantalla solo está disponible en computadoras");
      return;
    }

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const videoTrack = screenStream.getVideoTracks()[0];
        
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        
        videoTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
        setIsVideoOn(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }
    setIsScreenSharing(false);
  };

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
      'Spanish': 'es-ES', 'English': 'en-US', 'French': 'fr-FR', 'German': 'de-DE',
      'Italian': 'it-IT', 'Portuguese': 'pt-PT', 'Russian': 'ru-RU', 'Chinese (Simplified)': 'zh-CN',
      'Chinese (Traditional)': 'zh-TW', 'Japanese': 'ja-JP', 'Korean': 'ko-KR', 'Arabic': 'ar-SA',
      'Hindi': 'hi-IN', 'Dutch': 'nl-NL', 'Swedish': 'sv-SE', 'Polish': 'pl-PL', 'Turkish': 'tr-TR',
      'Vietnamese': 'vi-VN', 'Thai': 'th-TH', 'Indonesian': 'id-ID', 'Greek': 'el-GR', 'Hebrew': 'he-IL'
    };
    recognition.lang = langMap[profile.nativeLanguage] || 'es-ES';

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true;
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;
      // Auto-restart if mic is still on and status is accepted
      if (isMicOn && callStatus === 'accepted') {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      setMySubtitles(transcript);

      // Send to peer via DataChannel
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({
          type: 'subtitle',
          text: transcript,
          isFinal: isFinal
        }));
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
      if (event.error === 'not-allowed') {
        console.warn('Microphone permission denied for SpeechRecognition');
        return;
      }
      if (event.error === 'aborted') {
        isRecognitionActiveRef.current = false;
        return;
      }
      
      try {
        recognition.stop();
      } catch (e) {}
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      const newMicState = !isMicOn;
      audioTrack.enabled = newMicState;
      setIsMicOn(newMicState);
      
      if (newMicState) {
        if (!isRecognitionActiveRef.current) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error('Manual start failed:', e);
          }
        }
      } else {
        if (isRecognitionActiveRef.current) {
          try {
            recognitionRef.current?.stop();
          } catch (e) {}
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  const endCall = () => {
    stopAllTracks(localStream);
    if (callId) {
      updateDoc(doc(db, 'calls', callId), { status: 'ended' }).catch(console.error);
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 md:p-8"
    >
      <div className="relative w-full h-full max-w-6xl aspect-video bg-gray-900 md:rounded-3xl overflow-hidden shadow-2xl border-white/10 flex flex-col md:block">
        
        {/* Remote Video (Main) / Voice Call Avatar */}
        <div className="flex-1 md:absolute md:inset-0">
          {type === 'video' ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-w-sidebar">
               <div className="relative mb-6">
                  <div className="absolute -inset-8 bg-w-accent/10 rounded-full animate-pulse"></div>
                  <img src={profile.photoURL} alt={remoteName} className="w-40 h-40 rounded-full border-4 border-w-accent shadow-2xl" />
               </div>
               <h2 className="text-3xl font-bold text-white mb-2">{remoteName}</h2>
               <p className="text-w-accent font-mono tracking-widest uppercase text-xs">{t('Llamada de Voz', lang)} • Gemini AI</p>
            </div>
          )}
        </div>
        {!remoteStream && type === 'video' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-white">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <PhoneOff className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-xl font-medium tracking-tight">
              {callStatus === 'ringing' ? t('Llamando a...', lang, { name: remoteName }) : `Conectando con ${remoteName}...`}
            </p>
            <p className="text-sm text-gray-500 mt-2 italic font-mono uppercase tracking-widest">
              {callStatus === 'ringing' ? t('Esperando respuesta...', lang) : t('Sincronizando Traductor IA', lang)}
            </p>
          </div>
        )}

        {/* Local Video (PiP) */}
        {type === 'video' && (
          <div className="relative md:absolute top-auto md:top-6 right-auto md:right-6 w-full h-1/3 md:w-1/5 md:aspect-video bg-black md:rounded-2xl overflow-hidden shadow-xl border-t-2 md:border-2 border-white/20 z-20">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-white/50" />
              </div>
            )}
            {isScreenSharing && (
              <div className="absolute top-2 left-2 bg-w-accent text-w-bg px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                {t('Compartiendo', lang)}
              </div>
            )}
          </div>
        )}

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
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t('Tú', lang)}</p>
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
                  <span className="text-[10px] text-w-accent font-black uppercase tracking-[0.2em]">{remoteName} • {t('Traduciendo', lang)}</span>
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

        {/* Bottom Controls Panel */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col items-center gap-6 z-40">
          
          {callStatus === 'accepted' && (
             <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-white font-mono text-[10px] tracking-widest">{formatDuration(callDuration)}</span>
             </div>
          )}

          <div className="flex items-center justify-center gap-4 md:gap-8">
            <button onClick={toggleMic} className={cn("w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95", isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white")}>
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            
            {type === 'video' && (
              <>
                <button onClick={toggleVideo} className={cn("w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95", isVideoOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white")}>
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button onClick={handleScreenShare} className={cn("w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95", isScreenSharing ? "bg-w-accent text-w-bg" : "bg-white/10 hover:bg-white/20 text-white")}>
                  {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>
              </>
            )}

            <button onClick={endCall} className="w-16 h-16 md:w-20 md:h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group">
              <PhoneOff className="w-8 h-8 group-hover:rotate-[135deg] transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Top Info Overlay */}
        <div className="absolute top-6 left-6 hidden md:flex flex-col gap-3 z-40">
          <div className="text-white bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
             <span className="text-[10px] font-black uppercase tracking-widest">Encriptado • Gemini 3.1 Flash</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

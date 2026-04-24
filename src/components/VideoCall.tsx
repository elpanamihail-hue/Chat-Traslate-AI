import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { translateText } from '../services/ai';
import { 
  X, Mic, MicOff, Video, VideoOff, PhoneOff, Globe, 
  Monitor, MonitorOff, Camera, RefreshCw, Volume2, VolumeX, Maximize2, Minimize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface Props {
  profile: UserProfile;
  remotePeerId: string;
  remoteName: string;
  callId?: string;
  isCaller?: boolean;
  type?: 'video' | 'voice';
  onClose: () => void;
}

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'accepted' | 'declined' | 'ended'>('ringing');
  
  const lang = profile.nativeLanguage;
  
  const containerRef = useRef<HTMLDivElement>(null);
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
    // Listener for Call Status in Supabase
    if (callId) {
      const channel = supabase
        .channel(`call-status-${callId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
          (payload) => {
            const data = payload.new as any;
            if (!data) {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
              return;
            }
            const status = data.status;
            setCallStatus(status);
            if (status === 'declined' || status === 'ended') {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }
          }
        )
        .subscribe();

      // Initial fetch
      supabase.from('calls').select('status').eq('id', callId).single().then(({ data }) => {
        if (data) setCallStatus(data.status);
      });

      return () => {
        supabase.removeChannel(channel);
      };
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

        // Signaling logic using separate tables for candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            const table = isCaller ? 'caller_candidates' : 'recipient_candidates';
            await supabase.from(table).insert({
              call_id: callId,
              candidate: event.candidate.toJSON()
            });
          }
        };

        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await supabase.from('calls').update({ offer: { type: offer.type, sdp: offer.sdp } }).eq('id', callId);

          const callChannel = supabase
            .channel(`call-signaling-${callId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
              (payload: any) => {
                const data = payload.new;
                if (!pc.currentRemoteDescription && data?.answer) {
                  const answer = new RTCSessionDescription(data.answer);
                  pc.setRemoteDescription(answer);
                }
              }
            )
            .subscribe();

          const candChannel = supabase
            .channel(`recipient-candidates-${callId}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'recipient_candidates', filter: `call_id=eq.${callId}` },
              (payload: any) => {
                const candidate = new RTCIceCandidate(payload.new.candidate);
                pc.addIceCandidate(candidate);
              }
            )
            .subscribe();

        } else {
          const callChannel = supabase
            .channel(`call-signaling-${callId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
              async (payload: any) => {
                const data = payload.new;
                if (!pc.currentRemoteDescription && data?.offer) {
                  const offer = new RTCSessionDescription(data.offer);
                  await pc.setRemoteDescription(offer);
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await supabase.from('calls').update({ answer: { type: answer.type, sdp: answer.sdp } }).eq('id', callId);
                }
              }
            )
            .subscribe();

          const candChannel = supabase
            .channel(`caller-candidates-${callId}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'caller_candidates', filter: `call_id=eq.${callId}` },
              (payload: any) => {
                const candidate = new RTCIceCandidate(payload.new.candidate);
                pc.addIceCandidate(candidate);
              }
            )
            .subscribe();
          
          // Initial fetch for invite offer if already there
          const { data: callData } = await supabase.from('calls').select('*').eq('id', callId).single();
          if (callData?.offer && !pc.currentRemoteDescription) {
            const offer = new RTCSessionDescription(callData.offer);
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await supabase.from('calls').update({ answer: { type: answer.type, sdp: answer.sdp } }).eq('id', callId);
          }
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

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  const endCall = () => {
    stopAllTracks(localStream);
    if (callId) {
      supabase.from('calls').update({ status: 'ended' }).eq('id', callId).then(({ error }) => { if (error) console.error(error); });
    }
    onClose();
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-0 md:p-8"
    >
      <div className={cn(
        "relative w-full h-full bg-gray-900 overflow-hidden shadow-2xl border-white/10 flex flex-col",
        isFullscreen ? "p-0 rounded-none border-none" : "max-w-6xl aspect-video md:rounded-3xl"
      )}>
        
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

        {/* Subtitles Overlay - Dynamic Captions Style */}
        <div className="absolute bottom-40 inset-x-0 flex flex-col items-center px-8 z-30 pointer-events-none">
          <AnimatePresence>
            {/* Remote Subtitles (Main Captions) */}
            {remoteSubtitles && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 max-w-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center gap-2 mb-1.5 justify-center opacity-60">
                   <Globe className={cn("w-3 h-3 text-w-accent", isTranslating && "animate-spin")} />
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">
                     {remoteName} • AI CAPTIONS
                   </span>
                </div>

                <div className="flex flex-col gap-1">
                   {/* Original text (small, for context) */}
                   <p className="text-gray-400 text-[10px] italic line-clamp-1 opacity-50">
                     {remoteSubtitles}
                   </p>
                   {/* Translated text (The actual subtitle) */}
                   <p className="text-white text-xl md:text-2xl font-black leading-tight tracking-tight drop-shadow-lg">
                     {translatedSubtitles || "..."}
                   </p>
                </div>
              </motion.div>
            )}

            {/* My Subtitles (Transcription of local user - smaller) */}
            {mySubtitles && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5"
              >
                <p className="text-white/60 text-[10px] font-medium italic">"{mySubtitles}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls Panel */}
        <AnimatePresence>
          {!isFullscreen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col items-center gap-6 z-40 pb-12"
            >
              
              {callStatus === 'accepted' && (
                 <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-white font-mono text-[10px] tracking-widest">{formatDuration(callDuration)}</span>
                 </div>
              )}

              <div className="flex items-center justify-center gap-3 md:gap-5 bg-white/5 backdrop-blur-xl p-4 rounded-[40px] border border-white/10">
                {/* Device controls group */}
                <div className="flex items-center gap-2 md:gap-4 pr-3 md:pr-5 border-r border-white/10 text-white">
                  <button 
                    onClick={toggleMic} 
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95", 
                      isMicOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500"
                    )}
                  >
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  
                  {type === 'video' && (
                    <>
                      <button 
                        onClick={toggleVideo} 
                        title={t(isVideoOn ? 'Apagar Cámara' : 'Encender Cámara', lang)}
                        className={cn(
                          "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95", 
                          isVideoOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500"
                        )}
                      >
                        {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={handleScreenShare} 
                        title={t(isScreenSharing ? 'Dejar de Compartir' : 'Compartir Pantalla', lang)}
                        className={cn(
                          "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95", 
                          isScreenSharing ? "bg-w-accent text-w-bg font-bold border-2 border-white/20" : "bg-white/10 hover:bg-white/20"
                        )}
                      >
                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                      </button>
                    </>
                  )}

                  <button 
                    onClick={toggleFullscreen} 
                    className="w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all active:scale-95"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Hang up button - larger and separated */}
                <button 
                  onClick={endCall} 
                  title={t('Finalizar Llamada', lang)} 
                  className="w-16 h-16 md:w-20 md:h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group ml-2"
                >
                  <PhoneOff className="w-8 h-8 group-hover:rotate-[135deg] transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit Fullscreen Button (Floating) */}
        {isFullscreen && (
          <button 
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 z-50 bg-black/40 hover:bg-black/60 backdrop-blur-md p-4 rounded-full text-white transition-all active:scale-90 border border-white/10"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        )}

        {/* Top Info Overlay */}
        {!isFullscreen && (
          <div className="absolute top-6 left-6 hidden md:flex flex-col gap-3 z-40">
            <div className="text-white bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <span className="text-[10px] font-black uppercase tracking-widest">Encriptado • Gemini 3.1 Flash</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

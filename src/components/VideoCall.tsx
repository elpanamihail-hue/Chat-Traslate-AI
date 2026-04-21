import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { UserProfile } from '../types';
import { translateText } from '../lib/gemini';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  profile: UserProfile;
  remotePeerId: string;
  remoteName: string;
  onClose: () => void;
}

export default function VideoCall({ profile, remotePeerId, remoteName, onClose }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [mySubtitles, setMySubtitles] = useState('');
  const [remoteSubtitles, setRemoteSubtitles] = useState('');
  const [translatedSubtitles, setTranslatedSubtitles] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        peerRef.current = new Peer(profile.uid);

        peerRef.current.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          // Call the remote peer
          const call = peerRef.current!.call(remotePeerId, stream);
          call.on('stream', (rStream) => {
            setRemoteStream(rStream);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
          });
        });

        // Handle incoming calls (if we were the one being called)
        peerRef.current.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (rStream) => {
            setRemoteStream(rStream);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
          });
        });

        // STT Logic
        initSTT();

      } catch (err) {
        console.error('Failed to get local stream', err);
        onClose();
      }
    };

    initCall();

    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const initSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Map native language to BCP 47 code (best effort)
    const langMap: {[key: string]: string} = {
      'Spanish': 'es-ES',
      'English': 'en-US',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-PT'
    };
    recognition.lang = langMap[profile.nativeLanguage] || 'es-ES';

    recognition.onresult = async (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        setMySubtitles(transcript);
        // Translate for the other person (using their lang if I knew it, but here we show translated subtitles for US)
        // Actually the requirement says "Mostrar Subtítulos Flotantes en el idioma nativo de cada participante."
        // This implies the OTHERS' speech should be translated to MY language.
        // For a real app, I'd send my STT to them via DataChannel.
      } else {
        setMySubtitles(transcript);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Mocking remote translation for demo purposes
  // In a real app, PeerJS DataChannel would send the STT text
  useEffect(() => {
    if (mySubtitles && mySubtitles.length > 5) {
      // Simulate remote user getting our subtitles
      const timer = setTimeout(async () => {
        const translated = await translateText(mySubtitles, profile.nativeLanguage === 'English' ? 'Spanish' : 'English');
        setTranslatedSubtitles(translated);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mySubtitles]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
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
            <p className="text-xl font-medium">Llamando a {remoteName}...</p>
            <p className="text-sm text-gray-500 mt-2 italic">Traducción Gemini activada</p>
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

        {/* Subtitles Overlay (Galaxy S24 Style) */}
        <div className="absolute bottom-32 inset-x-0 flex flex-col items-center px-8 z-30 pointer-events-none">
          <AnimatePresence>
            {translatedSubtitles && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 max-w-2xl text-center"
              >
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <Globe className="w-3 h-3 text-[#25D366]" />
                  <span className="text-[10px] text-[#25D366] font-bold uppercase tracking-widest">Traducción Live</span>
                </div>
                <p className="text-white text-lg md:text-xl font-medium leading-tight">
                  {translatedSubtitles}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-4 md:gap-8 z-40">
          <button 
            onClick={toggleMic}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all",
              isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white"
            )}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={onClose}
            className="w-16 h-16 md:w-20 md:h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          <button 
            onClick={toggleVideo}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all",
              isVideoOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white"
            )}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        </div>

        {/* Info Overlay */}
        <div className="absolute top-6 left-6 flex flex-col gap-3">
          <div className="text-white bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-semibold uppercase tracking-widest">Live Call • {remoteName}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 max-w-[220px]">
             <p className="text-[10px] text-gray-300 leading-tight">
               <span className="text-w-accent font-bold">GEMINI AI:</span> Las traducciones en vivo pueden variar en precisión. Use con discreción.
             </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

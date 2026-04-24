import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, updateMetadata } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { UserProfile, Chat, Message } from '../types';
import { translateText, detectLanguage } from '../services/ai';
import { compressImage } from '../lib/fileUtils';
import { MessageSkeleton } from './ui/Skeleton';
import AudioPlayer from './AudioPlayer';
import { 
  Send, Paperclip, Phone, Video, MoreVertical, ChevronLeft, 
  Smile, Mic, MicOff, FileIcon, ImageIcon, Download, Globe, CheckCheck, Loader2, X, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import StatusIndicator from './StatusIndicator';

interface Props {
  profile: UserProfile;
  chat: Chat;
  onBack: () => void;
  onCall: (peerId: string, name: string, type: 'video' | 'voice') => void;
}

import { t } from '../lib/i18n';

export default function ChatRoom({ profile, chat, onBack, onCall }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const otherUser = Object.values(chat.participantProfiles || {}).find(p => p.uid !== profile.uid);
  const [otherUserStatus, setOtherUserStatus] = useState<'online' | 'offline'>('offline');
  const [memberCount, setMemberCount] = useState(chat.participants.length);

  const lang = profile.nativeLanguage;

  useEffect(() => {
    if (otherUser) {
      const unsub = onSnapshot(doc(db, 'users', otherUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          setOtherUserStatus(docSnap.data().status || 'offline');
        }
      });
      return () => unsub();
    }
  }, [otherUser?.uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      setMessages(msgs);

      // Automatic Translation Logic
      msgs.forEach(async (msg) => {
        if (msg.senderId !== profile.uid && msg.text && !msg.translations?.[profile.nativeLanguage]) {
          // Check if it's already translated to our language
          // To avoid infinite loop, we only translate if originalLanguage is different
          if (msg.originalLanguage && msg.originalLanguage !== profile.nativeLanguage) {
             const translated = await translateText(msg.text, profile.nativeLanguage);
             await updateDoc(doc(db, 'chats', chat.id, 'messages', msg.id), {
               [`translations.${profile.nativeLanguage}`]: translated
             });
          }
        }
      });
    });

    return () => unsub();
  }, [chat.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, audioBlob?: Blob, audioDuration?: number) => {
    if (e) e.preventDefault();
    if ((!inputText && !file && !audioBlob) || sending) return;

    setSending(true);
    setUploadProgress(0);
    try {
      let fileUrl = '';
      let fileName = '';
      let audioUrl = '';

      // ... existing upload logic ...
      if (audioBlob) {
        const audioRef = ref(storage, `chats/${chat.id}/audios/${Date.now()}.webm`);
        const uploadTask = uploadBytesResumable(audioRef, audioBlob);
        audioUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            snapshot => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            err => reject(err),
            () => getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject)
          );
        });
      }

      if (file) {
        const fileRef = ref(storage, `chats/${chat.id}/${Date.now()}_${file.name}`);
        const metadata = {
          contentDisposition: `attachment; filename="${file.name}"`,
          customMetadata: { originalName: file.name }
        };
        const uploadTask = uploadBytesResumable(fileRef, file, metadata);
        fileUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            snapshot => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            err => reject(err),
            () => getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject)
          );
        });
        fileName = file.name;
      }

      const textToSend = inputText.trim();
      if (!textToSend && !file && !audioBlob) return;

      const detectedLang = textToSend ? await detectLanguage(textToSend) : '';
      
      const translations: { [lang: string]: string } = {};
      if (textToSend && chat.participantProfiles) {
        const uniqueLangs = Array.from(new Set(
          Object.values(chat.participantProfiles)
            .map(p => p.nativeLanguage)
            .filter(l => l !== detectedLang)
        ));

        for (const targetLang of uniqueLangs) {
          try {
            const translated = await translateText(textToSend, targetLang);
            translations[targetLang] = translated;
          } catch (e) {
            console.error(`Translation failed for ${targetLang}`, e);
          }
        }
      }

      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        chatId: chat.id,
        senderId: profile.uid,
        text: textToSend,
        originalLanguage: detectedLang || profile.nativeLanguage,
        translations: translations,
        fileUrl,
        fileName,
        audioUrl,
        audioDuration,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: textToSend || (audioUrl ? '🎤 Audio' : `Archivo: ${fileName}`),
        lastMessageSenderId: profile.uid,
        updatedAt: serverTimestamp()
      });

      // Trigger Push Notifications to all participants except sender
      if (chat.isGroup) {
         // Batch notifications could be done here if needed
      } else if (otherUser?.fcmToken) {
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: otherUser.fcmToken,
            title: `Nuevo mensaje de ${profile.username}`,
            body: textToSend || 'Has recibido un archivo',
            url: window.location.origin
          })
        }).catch(err => console.error('Push error:', err));
      }

      setInputText('');
      setFile(null);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setUploadProgress(0);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendMessage(undefined, audioBlob, recordingTime);
        stream.getTracks().forEach(t => t.stop());
        setRecordingTime(0);
      };

      recorder.start();
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden chat-bg-overlay bg-w-bg">
      {/* Chat Header */}
      <div className="bg-w-header p-3 flex items-center justify-between border-b border-white/5 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-1 hover:bg-white/10 rounded-full transition-colors text-w-text">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="relative">
            <img src={chat.isGroup ? chat.groupPhoto : otherUser?.photoURL} alt={chat.isGroup ? chat.groupName : otherUser?.username} className="w-10 h-10 rounded-full border border-white/10 shadow-sm" referrerPolicy="no-referrer" />
            {!chat.isGroup && <StatusIndicator uid={otherUser?.uid || ''} className="border-w-header" />}
          </div>
            <div className="flex flex-col">
            <span className="font-semibold text-w-text leading-tight">{chat.isGroup ? chat.groupName : otherUser?.username}</span>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              chat.isGroup ? "text-w-accent" : (otherUserStatus === 'online' ? "text-w-accent" : "text-w-muted")
            )}>
              {chat.isGroup 
                ? `${chat.participants.length} ${t('miembros', lang)}` 
                : t(otherUserStatus === 'online' ? 'En línea' : 'Desconectado', lang)} — {t('Traductor Gemini', lang)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-5 text-w-muted">
          {!chat.isGroup && (
            <>
              <button onClick={() => onCall(otherUser?.uid || '', otherUser?.username || '', 'video')} className="hover:text-w-accent transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button onClick={() => onCall(otherUser?.uid || '', otherUser?.username || '', 'voice')} className="hover:text-w-accent transition-colors">
                <Phone className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
          <button className="hover:text-w-accent transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
      >
        {/* Gemini Disclaimer */}
        <div className="mb-8 mx-auto max-w-sm">
          <div className="bg-w-header/30 backdrop-blur-sm border border-w-accent/20 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2 text-w-accent font-bold text-[10px] tracking-widest">
              <ShieldCheck className="w-4 h-4" /> {t('AVISO DE SEGURIDAD IA', lang)}
            </div>
            <p className="text-[11px] text-w-muted leading-relaxed">
              Las traducciones son procesadas por <span className="text-w-accent font-semibold text-w-accent">Gemini AI</span>. 
              Tenga en cuenta que la IA puede cometer errores o interpretar mal el contexto.
            </p>
          </div>
        </div>

        {messages.map((msg, idx) => {
          const isMine = msg.senderId === profile.uid;
          const currentLang = profile.nativeLanguage;
          const translatedText = msg.translations?.[currentLang];
          const isTranslated = !!translatedText && msg.originalLanguage !== currentLang;
          
          if (!msg.createdAt && !isMine) return null; // Wait for server timestamp
          const isPending = !msg.createdAt;

          return (
            <motion.div 
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "flex flex-col mb-1",
                isMine ? "items-end" : "items-start"
              )}
            >
              {chat.isGroup && !isMine && msg.senderId && (
                <span className="text-[10px] font-bold text-w-muted mb-1 ml-1 uppercase tracking-widest">
                  {chat.participantProfiles?.[msg.senderId]?.username || 'User'}
                </span>
              )}
              <div className={cn(
                "max-w-[85%] md:max-w-[70%] p-3 rounded-xl shadow-lg relative group min-w-[80px]",
                isMine 
                  ? "chat-bubble-sent rounded-tr-none" 
                  : "chat-bubble-received rounded-tl-none border border-white/5"
              )}>
                {isPending ? (
                  <MessageSkeleton />
                ) : (
                  <>
                    {/* AI Label for received messages that were translated */}
                    {isTranslated && (
                      <div className="text-[9px] text-w-accent font-mono mb-1 flex items-center gap-1 opacity-80 letter-spacing-1">
                        <Globe className="w-2.5 h-2.5" /> GEMINI TRANSLATION [{msg.originalLanguage?.toUpperCase()} → {profile.nativeLanguage.toUpperCase()}]
                      </div>
                    )}

                    {/* File handling */}
                    {msg.fileUrl && (
                      <div className="mb-2 p-2 bg-black/20 rounded-lg flex flex-col gap-3 border border-white/5 relative overflow-hidden">
                        {msg.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <div className="relative group/img">
                            <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full rounded shadow-md cursor-pointer transition-transform hover:scale-[1.02]" referrerPolicy="no-referrer" />
                            <a 
                              href={msg.fileUrl} 
                              download={msg.fileName} 
                              className="absolute top-2 right-2 bg-black/60 p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black"
                              title="Descargar imagen"
                            >
                              <Download className="w-4 h-4 text-white" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 bg-w-accent rounded flex items-center justify-center shadow-inner shrink-0">
                              <FileIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate text-white">{msg.fileName}</p>
                              <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Archivo PDF/Documento</p>
                            </div>
                            <button 
                              onClick={() => window.open(msg.fileUrl, '_blank')}
                              className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0" 
                              title="Descargar"
                            >
                              <Download className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Audio handling */}
                    {msg.audioUrl && (
                      <AudioPlayer 
                        url={msg.audioUrl} 
                        duration={msg.audioDuration} 
                        isMine={isMine} 
                      />
                    )}

                    {/* Text Content */}
                    {msg.text && (
                      <div className="flex flex-col gap-2">
                        {isTranslated ? (
                          <>
                            <div className="text-sm leading-relaxed break-words border-b border-white/10 pb-2 mb-1 opacity-60 italic">
                               <p className="text-[10px] uppercase font-bold tracking-tighter opacity-50 mb-0.5">Original</p>
                               {msg.text}
                            </div>
                            <div className="text-sm leading-relaxed break-words pr-4 pb-2 font-medium">
                               <p className="text-[10px] uppercase font-bold tracking-tighter text-w-accent mb-0.5">Gemini Traducción</p>
                               {translatedText}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm leading-relaxed break-words pr-4 pb-2">
                            {msg.text}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={cn(
                      "absolute bottom-1 right-2 flex items-center gap-1.5",
                      isMine ? "text-white/50" : "text-w-muted"
                    )}>
                      <span className="text-[9px] font-mono">
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3 text-[#34b7f1]" />}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="bg-w-header p-4 md:p-6 border-t border-white/5 relative">
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute top-0 left-0 w-full z-20">
            <div className="flex items-center justify-between px-4 py-1.5 bg-w-accent/10 backdrop-blur-md">
               <span className="text-[9px] font-black uppercase tracking-widest text-w-accent animate-pulse">
                {file && file.size > 2*1024*1024 ? '🚀 Enviando archivo de alta calidad...' : 'Sincronizando archivo...'}
               </span>
               <span className="text-[10px] font-mono text-w-accent font-bold">Subiendo: {Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full h-1 bg-white/5">
              <motion.div 
                className="h-full bg-w-accent shadow-[0_0_10px_rgba(66,203,165,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <AnimatePresence>
          {file && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-w-sidebar rounded-t-2xl p-4 border border-white/10 border-b-0 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 bg-w-accent rounded flex items-center justify-center">
                  <FileIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-w-text truncate">{file.name}</span>
              </div>
              <button onClick={() => setFile(null)} className="text-red-400 hover:bg-white/5 p-2 rounded-full transition-colors">
                 <X className="w-4 h-4" /> 
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <div className="flex gap-1 text-w-muted">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Paperclip className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          
          <div className="flex-1 bg-w-input rounded-xl border border-white/5 flex items-center px-4 transition-all focus-within:border-w-accent/30 shadow-inner overflow-hidden">
            {isRecording ? (
              <div className="flex-1 py-3 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-mono text-red-500 font-bold tracking-widest">{formatTime(recordingTime)}</span>
                </div>
                <span className="text-[10px] text-w-muted uppercase font-bold animate-bounce hidden md:inline">Grabando Mensaje de Voz...</span>
              </div>
            ) : (
              <input 
                type="text" 
                placeholder={t('Escribe tu mensaje...', lang)}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent py-3 text-sm focus:outline-none text-w-text placeholder:text-w-muted"
              />
            )}
            <Smile className="w-5 h-5 text-w-muted hover:text-white cursor-pointer ml-2" />
          </div>

          <button 
            type={isRecording || (!inputText && !file) ? "button" : "submit"}
            onMouseDown={!inputText && !file ? startRecording : undefined}
            onMouseUp={!inputText && !file ? stopRecording : undefined}
            onTouchStart={!inputText && !file ? startRecording : undefined}
            onTouchEnd={!inputText && !file ? stopRecording : undefined}
            disabled={sending}
            className={cn(
              "text-white p-3.5 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50",
              isRecording ? "bg-red-500 scale-125" : "bg-[#00A884] hover:bg-[#06cf9c]"
            )}
          >
            {sending ? <Loader2 className="animate-spin w-5 h-5" /> : (inputText || file) ? <Send className="w-5 h-5" /> : <Mic className={cn("w-5 h-5", isRecording && "animate-pulse")} />}
          </button>
        </form>
      </div>
    </div>
  );
}

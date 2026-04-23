/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, collection, query, where, getDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, Chat } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import SetupWizard from './components/SetupWizard';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import Settings from './components/Settings';
import VideoCall from './components/VideoCall';
import IncomingCall from './components/IncomingCall';
import PWAPrompt from './components/PWAPrompt';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldCheck, ChevronLeft, AlertTriangle } from 'lucide-react';
import { showNotification } from './lib/notifications';
import { usePermissions } from './hooks/usePermissions';
import { updateDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCall, setActiveCall] = useState<{peerId: string, remoteName: string, callId?: string} | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [sessionSetupDone, setSessionSetupDone] = useState(false);

  const { mic, camera, notifications, requestAll } = usePermissions();

  // Variants for WhatsApp-style sliding
  const slideVariants = {
    initial: { x: '100%', opacity: 1 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 1 },
  };

  const desktopTransition = { type: 'spring', damping: 25, stiffness: 200 };
  const mobileTransition = { type: 'tween', duration: 0.3, ease: 'easeOut' };

  // Handle Invite Link
  useEffect(() => {
    const handleInvite = async () => {
      if (!profile) return;
      
      const params = new URLSearchParams(window.location.search);
      const inviteUid = params.get('invite');
      
      if (inviteUid && inviteUid !== profile.uid) {
        try {
          const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', profile.uid)
          );
          const snap = await getDocs(q);
          const existingChat = snap.docs.find(d => {
            const data = d.data() as Chat;
            return data.participants.includes(inviteUid);
          });

          if (existingChat) {
            const data = existingChat.data() as Chat;
            const chatData = { id: existingChat.id, ...data };
            
            const otherDoc = await getDoc(doc(db, 'users', inviteUid));
            if (otherDoc.exists()) {
              chatData.participantProfiles = {
                [profile.uid]: profile,
                [inviteUid]: otherDoc.data() as UserProfile
              };
              setActiveChat(chatData);
            }
          } else {
            const otherDoc = await getDoc(doc(db, 'users', inviteUid));
            if (otherDoc.exists()) {
              const otherUser = otherDoc.data() as UserProfile;
              const newChatRef = await addDoc(collection(db, 'chats'), {
                participants: [profile.uid, inviteUid],
                updatedAt: serverTimestamp(),
                lastMessage: ''
              });

              setActiveChat({
                id: newChatRef.id,
                participants: [profile.uid, inviteUid],
                updatedAt: new Date(),
                participantProfiles: {
                  [profile.uid]: profile,
                  [inviteUid]: otherUser
                }
              });
            }
          }
          
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        } catch (err) {
          console.error("Error handling invite:", err);
        }
      }
    };

    handleInvite();
  }, [profile]);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setFetchingProfile(false);
      }, (err) => {
        console.error("Error fetching profile:", err);
        setFetchingProfile(false);
      });
      return () => unsub();
    } else if (!loading) {
      setProfile(null);
      setFetchingProfile(false);
    }
  }, [user, loading]);

  useEffect(() => {
    if (profile?.theme) {
      document.documentElement.setAttribute('data-theme', profile.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [profile?.theme]);

  // Global Notification Listener
  useEffect(() => {
    if (profile) {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', profile.uid)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const chatData = { id: change.doc.id, ...change.doc.data() } as Chat;
            
            if (
              chatData.lastMessageSenderId && 
              chatData.lastMessageSenderId !== profile.uid &&
              activeChat?.id !== chatData.id
            ) {
              const otherUserProfile = Object.values(chatData.participantProfiles || {}).find(p => (p as UserProfile).uid !== profile.uid) as UserProfile | undefined;
              
              showNotification(
                `Mensaje de ${otherUserProfile?.username || 'ChatTranslate'}`,
                chatData.lastMessage || 'Has recibido un nuevo mensaje'
              );
            }
          }
        });
      });
      return () => unsub();
    }
  }, [profile, activeChat]);

  // Incoming Call Listener
  useEffect(() => {
    if (profile) {
      const q = query(
        collection(db, 'calls'),
        where('recipientId', '==', profile.uid),
        where('status', '==', 'ringing')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const callData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setIncomingCall(callData);
          
          showNotification(
            `Llamada Entrante`,
            `${(callData as any).callerName} te está llamando...`
          );
        } else {
          setIncomingCall(null);
        }
      });
      return () => unsub();
    }
  }, [profile]);

  const initiateCall = async (recipientId: string, recipientName: string, type: 'video' | 'audio' = 'video') => {
    if (!profile) return;
    
    try {
      const callRef = await addDoc(collection(db, 'calls'), {
        callerId: profile.uid,
        callerName: profile.username,
        callerPhoto: profile.photoURL || '',
        recipientId,
        type,
        status: 'ringing',
        createdAt: serverTimestamp()
      });

      setActiveCall({ peerId: recipientId, remoteName: recipientName, callId: callRef.id, isCaller: true });
    } catch (err) {
      console.error("Error initiating call:", err);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), {
        status: 'accepted'
      });
      setActiveCall({ peerId: incomingCall.callerId, remoteName: incomingCall.callerName, callId: incomingCall.id, isCaller: false });
      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), {
        status: 'declined'
      });
      setIncomingCall(null);
    } catch (err) {
      console.error("Error declining call:", err);
    }
  };

  if (loading || (user && fetchingProfile)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-w-bg">
        <Loader2 className="w-10 h-10 animate-spin text-w-accent" />
        <p className="mt-4 text-w-muted font-mono uppercase tracking-widest text-[10px]">Iniciando ChatTranslate...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Handle immediate permission trigger for ALL users who haven't completed setup in this session
  // or haven't saved it to their profile.
  if (!sessionSetupDone && (!profile || (profile && !profile.setupComplete))) {
    return (
      <SetupWizard 
        onComplete={async () => {
          setSessionSetupDone(true);
          if (profile) {
            try {
              await updateDoc(doc(db, 'users', profile.uid), { setupComplete: true });
            } catch (e) {
              console.error("Error updating setup state:", e);
            }
          }
        }} 
      />
    );
  }

  if (!profile && !fetchingProfile) {
    return <Onboarding user={user} />;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showBanner = mic === 'denied' || camera === 'denied' || notifications === 'denied';

  return (
    <div className="h-screen w-screen flex flex-col bg-w-bg overflow-hidden font-sans text-w-text relative">
      {/* Permission Warning Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#25D366]/10 border-b border-[#25D366]/20 overflow-hidden shrink-0"
          >
            <div className="max-w-4xl mx-auto p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#25D366]" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#25D366]">
                  Acción Requerida: Permisos del Sistema Faltantes
                </p>
              </div>
              <button 
                onClick={() => requestAll()}
                className="bg-[#25D366] text-w-bg px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-[#25D366]/80 transition-all active:scale-95 shadow-lg shadow-[#25D366]/20"
              >
                Conceder Permisos
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Base Layer: Chat List (Sidebar) */}
      <div className={`
        ${(showSettings || activeChat) && isMobile ? 'hidden' : 'flex'}
        w-full md:w-[320px] h-full border-r border-white/10 flex-col bg-w-sidebar shrink-0
      `}>
        {profile && (
          <ChatList 
            profile={profile} 
            onChatSelect={setActiveChat} 
            activeChatId={activeChat?.id}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </div>

      {/* Main Viewport for Desktop / Overlays for Mobile */}
      <div className="flex-1 overflow-hidden relative h-full bg-w-bg">
        <AnimatePresence initial={false}>
          {showSettings && profile ? (
            <motion.div 
              key="settings-view"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={isMobile ? mobileTransition : desktopTransition}
              className="fixed inset-0 z-[100] md:relative md:inset-auto md:z-0 md:flex-1 md:h-full bg-w-bg"
            >
              <Settings profile={profile} onClose={() => setShowSettings(false)} />
            </motion.div>
          ) : activeChat && profile ? (
            <motion.div 
              key={`chat-room-${activeChat.id}`}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={isMobile ? mobileTransition : desktopTransition}
              className="fixed inset-0 z-[100] md:relative md:inset-auto md:z-0 md:flex-1 md:h-full bg-w-bg"
            >
              <ChatRoom 
                profile={profile} 
                chat={activeChat} 
                onBack={() => setActiveChat(null)}
                onCall={(peerId, name) => initiateCall(peerId, name, 'video')}
              />
            </motion.div>
          ) : (
            <div className="hidden md:flex flex-1 h-full items-center justify-center text-center p-8 relative chat-bg-overlay">
              <div className="absolute inset-0 bg-gradient-to-b from-w-accent/5 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col items-center max-w-lg">
                <div className="w-64 h-64 bg-w-header/50 backdrop-blur-3xl rounded-full flex items-center justify-center mb-10 shadow-[0_0_100px_rgba(66,203,165,0.05)] border border-white/5 group transition-all hover:scale-105 duration-700">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden flex items-center justify-center p-8 bg-w-accent/10 border border-w-accent/20">
                    <div className="absolute inset-0 bg-[#42CBA5]/10 animate-pulse"></div>
                    <img 
                      src="https://picsum.photos/seed/chattranslate/400/400" 
                      alt="ChatTranslate" 
                      className="w-32 h-32 relative z-10 opacity-80 group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <h1 className="text-4xl font-black text-w-text mb-4 tracking-tighter uppercase">ChatTranslate</h1>
                <p className="text-w-muted max-w-md text-sm leading-relaxed font-medium">
                  Conéctate sin barreras con traducciones de <span className="text-w-accent font-bold">Gemini AI</span>. 
                  Envía mensajes y archivos de forma segura con privacidad global.
                </p>
                <div className="mt-16 flex flex-col items-center gap-4">
                  <div className="px-4 py-2 bg-w-header border border-white/10 rounded-full flex items-center gap-3 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-w-accent animate-pulse shadow-[0_0_8px_#42CBA5]"></div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-w-muted">Motor ChatTranslate Activo</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> Cifrado de Extremo a Extremo
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {activeCall && profile && (
          <VideoCall 
            profile={profile}
            remotePeerId={activeCall.peerId}
            remoteName={activeCall.remoteName}
            callId={activeCall.callId}
            isCaller={(activeCall as any).isCaller}
            onClose={async () => {
              if (activeCall.callId) {
                try {
                  await updateDoc(doc(db, 'calls', activeCall.callId), { status: 'ended' });
                } catch (e) {}
              }
              setActiveCall(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {incomingCall && (
          <IncomingCall 
            callerName={incomingCall.callerName}
            callerPhoto={incomingCall.callerPhoto}
            type={incomingCall.type}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
      </AnimatePresence>
      <PWAPrompt />
      </div>
    </div>
  );
}


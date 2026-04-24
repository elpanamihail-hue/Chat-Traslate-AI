import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, Chat } from './types';

// Components
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import SetupWizard from './components/SetupWizard';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import Settings from './components/Settings';
import VideoCall from './components/VideoCall';
import IncomingCall from './components/IncomingCall';
import PWAPrompt from './components/PWAPrompt';
import PermissionModal from './components/PermissionModal';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Call management
  const [activeCall, setActiveCall] = useState<{
    callId: string;
    remotePeerId: string;
    remoteName: string;
    isCaller: boolean;
    type: 'video' | 'voice';
  } | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callerId: string;
    callerName: string;
    callerPhoto: string;
    type: 'video' | 'voice';
  } | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        
        // Analytics/Status tagging
        updateDoc(doc(db, 'users', user.uid), {
          status: 'online',
          lastChanged: serverTimestamp()
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setLoading(false);
    });

    // Handle Unload for status
    const handleUnload = () => {
      if (user) {
        updateDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastChanged: serverTimestamp()
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubProfile();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

  // Call Listener
  useEffect(() => {
    if (!profile) return;

    // Listen for calls where I am the recipient
    const unsubCalls = onSnapshot(doc(db, 'users', profile.uid, 'calls', 'incoming'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'ringing') {
          setIncomingCall({
            callId: data.callId,
            callerId: data.callerId,
            callerName: data.callerName,
            callerPhoto: data.callerPhoto,
            type: data.type
          });
        } else {
          setIncomingCall(null);
        }
      } else {
        setIncomingCall(null);
      }
    }, (error) => {
      console.error("Incoming calls snapshot error:", error);
    });

    return () => unsubCalls();
  }, [profile?.uid]);

  const handleStartCall = async (peerId: string, name: string, type: 'video' | 'voice') => {
    if (!profile) return;

    const callId = Math.random().toString(36).substring(7);
    const callRef = doc(db, 'calls', callId);

    await setDoc(callRef, {
      callerId: profile.uid,
      recipientId: peerId,
      status: 'ringing',
      type,
      createdAt: serverTimestamp(),
      callerMuted: false,
      recipientMuted: false,
      callerVideoOff: type !== 'video',
      recipientVideoOff: type !== 'video'
    });

    // Notify recipient
    await setDoc(doc(db, 'users', peerId, 'calls', 'incoming'), {
      callId,
      callerId: profile.uid,
      callerName: profile.username,
      callerPhoto: profile.photoURL,
      type,
      status: 'ringing'
    });

    setActiveCall({
      callId,
      remotePeerId: peerId,
      remoteName: name,
      isCaller: true,
      type
    });
  };

  const handleAcceptCall = async () => {
    if (!incomingCall || !profile) return;

    await updateDoc(doc(db, 'calls', incomingCall.callId), {
      status: 'accepted'
    });

    await updateDoc(doc(db, 'users', profile.uid, 'calls', 'incoming'), {
      status: 'accepted'
    });

    setActiveCall({
      callId: incomingCall.callId,
      remotePeerId: incomingCall.callerId,
      remoteName: incomingCall.callerName,
      isCaller: false,
      type: incomingCall.type
    });
    setIncomingCall(null);
  };

  const handleDeclineCall = async () => {
    if (!incomingCall || !profile) return;

    await updateDoc(doc(db, 'calls', incomingCall.callId), {
      status: 'declined'
    });

    await updateDoc(doc(db, 'users', profile.uid, 'calls', 'incoming'), {
      status: 'declined'
    });

    setIncomingCall(null);
  };

  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    if (profile && profile.setupComplete) {
      const timer = setTimeout(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          setShowPermissionModal(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [profile?.setupComplete]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-w-bg gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-w-accent/20 border-t-w-accent rounded-full animate-spin" />
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-w-accent animate-pulse" />
        </div>
        <p className="text-[10px] font-bold text-w-muted uppercase tracking-[0.4em] animate-pulse">Sincronizando Gemini Protocol...</p>
      </div>
    );
  }

  if (!user) return <Login />;
  if (!profile) return <Onboarding user={user} />;
  if (!profile.setupComplete) return <SetupWizard onComplete={() => updateDoc(doc(db, 'users', profile.uid), { setupComplete: true })} />;

  return (
    <div className={cn(
      "h-screen w-screen bg-w-bg overflow-hidden flex flex-col md:flex-row font-sans selection:bg-w-accent/30",
      profile.theme === 'light' && "theme-light",
      profile.theme === 'worldcup' && "theme-worldcup"
    )}>
      {/* Sidebar for Desktop / Bottom Bar for Mobile */}
      <div className={cn(
        "bg-w-sidebar border-white/5 z-40 transition-all duration-500",
        activeChat ? "hidden md:flex md:w-80 lg:w-96 flex-col border-r" : "flex flex-col w-full md:w-80 lg:w-96 md:border-r"
      )}>
        <ChatList 
          profile={profile} 
          onChatSelect={(chat) => setActiveChat(chat)} 
          activeChatId={activeChat?.id}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 z-50"
            >
              <Settings profile={profile} onClose={() => setShowSettings(false)} />
            </motion.div>
          ) : activeChat ? (
            <motion.div 
              key={activeChat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <ChatRoom 
                profile={profile} 
                chat={activeChat} 
                onBack={() => setActiveChat(null)}
                onCall={handleStartCall}
              />
            </motion.div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 text-center select-none bg-w-bg/50">
              <div className="relative mb-8">
                 <div className="absolute inset-0 bg-w-accent/5 blur-[100px] rounded-full"></div>
                 <div className="w-24 h-24 bg-w-sidebar rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-2xl relative rotate-3 hover:rotate-0 transition-transform">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 opacity-50 grayscale contrast-125" onError={(e) => (e.currentTarget.src = 'https://www.gstatic.com/images/branding/product/2x/translate_64dp.png')} />
                 </div>
              </div>
              <h2 className="text-3xl font-black text-w-text tracking-tighter mb-4 uppercase opacity-80">Selecciona un canal</h2>
              <p className="text-w-muted text-sm max-w-sm mx-auto leading-relaxed font-medium">
                Conéctate con tu gente a través de las fronteras. <br/>
                <span className="text-w-accent/60 font-bold">Impulsado por Gemini AI Engine v3.1</span>
              </p>
              
              <div className="mt-12 flex items-center gap-8 opacity-20 grayscale grayscale-50">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-w-accent animate-pulse"></div>
                   <span className="text-[10px] font-black tracking-widest text-w-muted uppercase">Voice</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-w-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-w-muted"></div>
                   <span className="text-[10px] font-black tracking-widest uppercase">Encryption</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-w-muted">
                   <div className="w-1.5 h-1.5 rounded-full bg-w-muted"></div>
                   <span className="text-[10px] font-black tracking-widest uppercase">Privacy</span>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays / Modals */}
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 z-[500] flex justify-center items-start pt-10 pointer-events-none">
            <IncomingCall 
              callerName={incomingCall.callerName}
              callerPhoto={incomingCall.callerPhoto}
              type={incomingCall.type}
              lang={profile.nativeLanguage}
              onAccept={handleAcceptCall}
              onDecline={handleDeclineCall}
            />
          </div>
        )}

        {activeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-w-bg"
          >
            <VideoCall 
              profile={profile}
              remotePeerId={activeCall.remotePeerId}
              remoteName={activeCall.remoteName}
              callId={activeCall.callId}
              isCaller={activeCall.isCaller}
              type={activeCall.type}
              onClose={() => setActiveCall(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPermissionModal && (
          <PermissionModal 
            lang={profile.nativeLanguage} 
            onClose={() => setShowPermissionModal(false)} 
          />
        )}
      </AnimatePresence>
      <PWAPrompt />
    </div>
  );
}

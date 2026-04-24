/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile, Chat } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import SetupWizard from './components/SetupWizard';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import Settings from './components/Settings';
import VideoCall from './components/VideoCall';
import IncomingCall from './components/IncomingCall';
import PermissionModal from './components/PermissionModal';
import PWAPrompt from './components/PWAPrompt';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldCheck, ChevronLeft, AlertTriangle } from 'lucide-react';
import { showNotification, showCallNotification, stopVibration } from './lib/notifications';
import { usePermissions } from './hooks/usePermissions';

import { t } from './lib/i18n';

export default function App() {
  useEffect(() => {
    console.log("Conexión establecida con la tabla 'chats'");
  }, []);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('user_profile_cache');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCall, setActiveCall] = useState<{peerId: string, remoteName: string, callId?: string, type?: 'video' | 'voice', isCaller?: boolean} | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [sessionStartTime] = useState(Date.now());
  const [sessionSetupDone, setSessionSetupDone] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('user_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        return !!parsed.setupComplete;
      }
    }
    return false;
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const { mic, camera, notifications, requestAll } = usePermissions();
  const lang = profile?.nativeLanguage || 'English';

  // Handling Quota Errors Globally
  const handleQuotaError = (err: any) => {
    if (err?.message?.includes('Quota exceeded')) {
      setQuotaExceeded(true);
    }
  };

  // Supabase Auth and Session Sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Presence Logic and User Status Update
  useEffect(() => {
    if (user && profile) {
      // Manual Status Update
      const updateStatus = async (status: 'online' | 'offline') => {
        await supabase
          .from('users')
          .update({ status: status, updated_at: new Date().toISOString() })
          .eq('uid', user.id);
      };

      updateStatus('online');

      const channel = supabase.channel('online-status');
      
      channel
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              status: 'online',
              last_seen: new Date().toISOString(),
            });
          }
        });

      // Handle unmount and unexpected closures
      const handleUnload = () => {
        // We use sendBeacon or a synchronous-like request if possible, 
        // but Supabase usually works fine here if quick
        updateStatus('offline');
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        updateStatus('offline');
        channel.unsubscribe();
      };
    }
  }, [user, profile]);

  // Check if we need to show the initial permission modal
  useEffect(() => {
    if (mic !== 'loading' && camera !== 'loading' && notifications !== 'loading') {
      const needsPermissions = mic === 'prompt' || camera === 'prompt' || notifications === 'prompt';
      if (needsPermissions) {
        setShowPermissionModal(true);
      }
    }
  }, [mic, camera, notifications]);

  
  // Listen for Service Worker messages
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CALL_ACTION') {
        if (event.data.action === 'accept') {
          handleAcceptCall();
        } else if (event.data.action === 'decline') {
          handleDeclineCall();
        }
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }
  }, [incomingCall]);

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
    const params = new URLSearchParams(window.location.search);
    const inviteUid = params.get('invite');
    if (!inviteUid || !profile || inviteUid === profile.uid) return;

    const handleInvite = async () => {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('chat_id')
          .eq('user_id', profile.uid);

        if (memberError || !memberData) throw memberError;

        const chatIds = memberData.map(m => m.chat_id);
        
        // Find if any chat has the inviteUid as a member
        const { data: existingChats, error: chatsError } = await supabase
          .from('chats')
          .select(`
            *,
            members(user_id)
          `)
          .in('id', chatIds);

        if (chatsError) throw chatsError;

        const existingChat = existingChats?.find(g => 
          g.members.some((m: any) => m.user_id === inviteUid)
        );

        if (existingChat) {
          const chatData: Chat = {
            id: existingChat.id,
            participants: [profile.uid, inviteUid],
            lastMessage: '',
            lastMessageSenderId: '',
            updated_at: existingChat.created_at,
            isGroup: false,
            groupName: existingChat.name,
            groupPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(existingChat.name)}`
          };
          const { data: otherProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('uid', inviteUid)
            .single();

          if (!profileError && otherProfile) {
            chatData.participantProfiles = {
              [profile.uid]: profile,
              [inviteUid]: otherProfile
            };
            setActiveChat(chatData);
          }
        } else {
          const { data: otherUser, error: otherUserError } = await supabase
            .from('users')
            .select('*')
            .eq('uid', inviteUid)
            .single();

          if (!otherUserError && otherUser) {
            const { data: newChat, error: createError } = await supabase
              .from('chats')
              .insert({
                created_at: new Date().toISOString(),
                name: otherUser.username
              })
              .select()
              .single();

            if (!createError && newChat) {
              await supabase.from('members').insert([
                { chat_id: newChat.id, user_id: profile.uid },
                { chat_id: newChat.id, user_id: inviteUid }
              ]);

              setActiveChat({
                id: newChat.id,
                participants: [profile.uid, inviteUid],
                updated_at: newChat.created_at,
                lastMessage: '',
                isGroup: false,
                participantProfiles: {
                  [profile.uid]: profile,
                  [inviteUid]: otherUser
                }
              });
            }
          }
        }
        
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } catch (err) {
        console.error("Error handling invite:", err);
      }
    };

    handleInvite();
  }, [profile?.uid, window.location.search]); // Depend on UID and search params, not whole profile

  useEffect(() => {
    if (user) {
      // First background fetch to ensure data is fresh
      const fetchFreshProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', user.id)
            .single();

          if (data && !error) {
            console.log('Perfil encontrado:', data);
            setProfile(data);
            localStorage.setItem('user_profile_cache', JSON.stringify(data));
            // If profile is complete, we can mark session setup as done too
            if (data.setupComplete) {
              setSessionSetupDone(true);
            }
          } else if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
            console.error('Error fetching profile:', error);
          }
          setFetchingProfile(false);
        } catch (e) {
          console.error('Error en fetchFreshProfile:', e);
          handleQuotaError(e);
          setFetchingProfile(false);
        }
      };

      const channel = supabase
        .channel('public:users')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `uid=eq.${user.id}` },
          (payload) => {
            console.log('Cambio en perfil detectado:', payload);
            if (payload.new) {
              const data = payload.new as UserProfile;
              setProfile(data);
              localStorage.setItem('user_profile_cache', JSON.stringify(data));
              if (data.setupComplete) {
                setSessionSetupDone(true);
              }
            }
          }
        )
        .subscribe();

      fetchFreshProfile();
      return () => {
        supabase.removeChannel(channel);
      };
    } else if (!loading) {
      setProfile(null);
      localStorage.removeItem('user_profile_cache');
      setFetchingProfile(false);
    }
  }, [user?.id, loading]);

  useEffect(() => {
    if (profile?.theme) {
      document.documentElement.setAttribute('data-theme', profile.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [profile?.theme]);

  // Global Notification Listener
  useEffect(() => {
    if (profile?.uid) {
      const profileUid = profile.uid;
      const nativeLanguage = profile.nativeLanguage;

      const channel = supabase
        .channel('public:chats')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chats' },
          async (payload) => {
            const chatData = payload.new as any;
            
            // Check membership
            const { data: member } = await supabase
              .from('members')
              .select('*')
              .eq('chat_id', chatData.id)
              .eq('user_id', profileUid)
              .single();

            if (!member) return;

            // Minimal logic for now
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.uid, profile?.nativeLanguage, activeChat?.id, sessionStartTime]);

  // Incoming Call Listener
  useEffect(() => {
    if (profile?.uid) {
      const profileUid = profile.uid;
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

      const channel = supabase
        .channel('public:calls')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'calls',
            filter: `recipient_id=eq.${profileUid}` 
          },
          (payload: any) => {
            const callData = payload.new;
            if (callData.status === 'ringing' && callData.created_at > oneMinuteAgo) {
              setIncomingCall(callData);
              showCallNotification(
                callData.caller_name,
                callData.id,
                callData.type,
                callData.caller_photo
              );
            }
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'calls',
            filter: `recipient_id=eq.${profileUid}` 
          },
          (payload: any) => {
            if (payload.new.status !== 'ringing') {
              setIncomingCall(null);
              stopVibration();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        stopVibration();
      };
    }
  }, [profile?.uid]);

  const initiateCall = async (recipientId: string, recipientName: string, type: 'video' | 'voice' = 'video') => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: profile.uid,
          caller_name: profile.username,
          caller_photo: profile.photoURL || '',
          recipient_id: recipientId,
          type,
          status: 'ringing'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveCall({ peerId: recipientId, remoteName: recipientName, callId: data.id, isCaller: true, type });
    } catch (err) {
      console.error("Error initiating call:", err);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      await supabase
        .from('calls')
        .update({ status: 'accepted' })
        .eq('id', incomingCall.id);

      setActiveCall({ 
        peerId: incomingCall.caller_id, 
        remoteName: incomingCall.caller_name, 
        callId: incomingCall.id, 
        isCaller: false, 
        type: incomingCall.type 
      });
      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await supabase
        .from('calls')
        .update({ status: 'declined' })
        .eq('id', incomingCall.id);
      setIncomingCall(null);
    } catch (err) {
      console.error("Error declining call:", err);
    }
  };

  if (loading || (user && fetchingProfile)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-w-bg">
        <Loader2 className="w-10 h-10 animate-spin text-w-accent" />
        <p className="mt-4 text-w-muted font-mono uppercase tracking-widest text-[10px]">{t('Iniciando ChatTranslate...', lang)}</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Optimized Navigation Logic: Jump directly to chat if profile is complete
  if (!profile || !profile.setupComplete) {
    // Show permissions wizard only if not done in this session
    if (!sessionSetupDone) {
      return (
        <SetupWizard 
          onComplete={() => setSessionSetupDone(true)} 
        />
      );
    }

    // Show onboarding if profile is missing or incomplete
    if (!fetchingProfile) {
      return <Onboarding user={user} />;
    }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showBanner = mic === 'denied' || camera === 'denied' || notifications === 'denied' || quotaExceeded;

  return (
    <div className="h-screen w-screen flex flex-col bg-w-bg overflow-hidden font-sans text-w-text relative">
      {/* System Warning Banner (Permissions or Quota) */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`
              ${quotaExceeded ? 'bg-orange-500/10 border-orange-500/20' : 'bg-[#25D366]/10 border-[#25D366]/20'}
              border-b overflow-hidden shrink-0
            `}
          >
            <div className="max-w-4xl mx-auto p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${quotaExceeded ? 'text-orange-500' : 'text-[#25D366]'}`} />
                <p className={`text-[11px] font-bold uppercase tracking-widest ${quotaExceeded ? 'text-orange-500' : 'text-[#25D366]'}`}>
                  {quotaExceeded 
                    ? t('Servidor en Pausa: Cuota de Firestore Excedida (Solo Lectura Local activa)', lang)
                    : t('Acción Requerida: Permisos del Sistema Faltantes', lang)}
                </p>
              </div>
              {!quotaExceeded ? (
                <button 
                  onClick={() => requestAll()}
                  className="bg-[#25D366] text-w-bg px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-[#25D366]/80 transition-all active:scale-95 shadow-lg shadow-[#25D366]/20"
                >
                  {t('Conceder Permisos', lang)}
                </button>
              ) : (
                <span className="text-[10px] font-mono text-orange-500/60 uppercase">{t('Reintentando...', lang)}</span>
              )}
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
                onCall={(peerId, name, type) => initiateCall(peerId, name, type)}
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
                  {t('Conéctate sin barreras con traducciones de {engine}. Envía mensajes y archivos de forma segura con privacidad global.', lang, { engine: 'Gemini AI' })}
                </p>
                <div className="mt-16 flex flex-col items-center gap-4">
                  <div className="px-4 py-2 bg-w-header border border-white/10 rounded-full flex items-center gap-3 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-w-accent animate-pulse shadow-[0_0_8px_#42CBA5]"></div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-w-muted">{t('Motor ChatTranslate Activo', lang)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> {t('Cifrado de Extremo a Extremo', lang)}
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
            isCaller={activeCall.isCaller}
            type={activeCall.type}
            onClose={async () => {
              if (activeCall.callId) {
                try {
                  await supabase
                    .from('calls')
                    .update({ status: 'ended' })
                    .eq('id', activeCall.callId);
                } catch (e) {}
              }
              setActiveCall(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {incomingCall && profile && (
          <IncomingCall 
            callerName={incomingCall.caller_name}
            callerPhoto={incomingCall.caller_photo}
            type={incomingCall.type === 'voice' ? 'audio' : 'video'}
            lang={profile.nativeLanguage}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPermissionModal && (
          <PermissionModal 
            lang={lang} 
            onClose={() => setShowPermissionModal(false)} 
          />
        )}
      </AnimatePresence>

      <PWAPrompt />
      </div>
    </div>
  );
}


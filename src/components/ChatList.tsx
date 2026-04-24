import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Chat } from '../types';
import { Search, MoreVertical, MessageSquarePlus, UserPlus, CheckCheck, Share2, ClipboardCheck, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import StatusIndicator from './StatusIndicator';
import CreateGroupModal from './CreateGroupModal';
import { AnimatePresence } from 'motion/react';
import { localDb } from '../lib/db';
import { t } from '../lib/i18n';

interface Props {
  profile: UserProfile;
  onChatSelect: (chat: Chat) => void;
  activeChatId?: string;
  onOpenSettings: () => void;
}

export default function ChatList({ profile, onChatSelect, activeChatId, onOpenSettings }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showInviteToast, setShowInviteToast] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  const lang = profile.nativeLanguage;

  const copyInviteLink = () => {
    const link = `${window.location.origin}/?invite=${profile.uid}`;
    navigator.clipboard.writeText(link);
    setShowInviteToast(true);
    setTimeout(() => setShowInviteToast(false), 2000);
  };

  // WhatsApp-style cache loading
  useEffect(() => {
    const loadCachedChats = async () => {
      const cachedChats = await localDb.chats.reverse().sortBy('updated_at');
      if (cachedChats.length > 0) {
        setChats(cachedChats);
      }
    };
    loadCachedChats();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          members!inner(*)
        `)
        .eq('members.user_id', profile.uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const enrichedChats = await Promise.all(data.map(async (chatData: any) => {
          // Fetch all members for this chat to get participants list
          const { data: memberData } = await supabase
            .from('members')
            .select('user_id')
            .eq('chat_id', chatData.id);
          
          const participants = memberData?.map(m => m.user_id) || [];
          
          const chat: Chat = {
            id: chatData.id,
            participants,
            lastMessage: chatData.last_message || '',
            lastMessageSenderId: chatData.last_message_sender_id || '',
            updated_at: chatData.created_at,
            isGroup: chatData.is_group ?? true,
            groupName: chatData.name,
            groupPhoto: chatData.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatData.name)}`,
            createdBy: chatData.created_by || ''
          };

          if (!chat.participantProfiles && !chat.isGroup) {
            const otherId = participants.find((p: string) => p !== profile.uid);
            if (otherId) {
              let otherProfile = await localDb.profiles.get(otherId);
              if (!otherProfile) {
                const { data: profileData } = await supabase
                  .from('users')
                  .select('*')
                  .eq('uid', otherId)
                  .single();
                if (profileData) {
                  otherProfile = profileData;
                  await localDb.profiles.put(otherProfile);
                }
              }
              chat.participantProfiles = {
                [profile.uid]: profile,
                [otherId]: otherProfile
              };
            }
          }
          // Save to local cache
          await localDb.chats.put(chat);
          return chat;
        }));
        setChats(enrichedChats);
      }
    };

    fetchChats();

    // Real-time subscription for chat updates
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        async (payload) => {
          const newChatData = payload.new as any;
          if (!newChatData || !newChatData.id) return;

          // Check if user is a member
          const { data: member } = await supabase
            .from('members')
            .select('*')
            .eq('chat_id', newChatData.id)
            .eq('user_id', profile.uid)
            .single();

          if (member) {
             // Fetch all members for the full participants array
             const { data: allMembers } = await supabase
               .from('members')
               .select('user_id')
               .eq('chat_id', newChatData.id);

            const chat: Chat = {
              id: newChatData.id,
              participants: allMembers?.map(m => m.user_id) || [],
              lastMessage: newChatData.last_message || '',
              lastMessageSenderId: newChatData.last_message_sender_id || '',
              updated_at: newChatData.created_at,
              isGroup: newChatData.is_group ?? true,
              groupName: newChatData.name,
              groupPhoto: newChatData.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(newChatData.name)}`,
              createdBy: newChatData.created_by || ''
            };

            setChats(prev => {
              const filtered = prev.filter(c => c.id !== chat.id);
              return [chat, ...filtered];
            });
            localDb.chats.put(chat);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.uid]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${term}%`)
      .neq('uid', profile.uid)
      .limit(10);
    
    if (!error && data) {
      setSearchResults(data);
    }
  };

  const startChat = async (otherUser: UserProfile) => {
    const existing = chats.find(c => c.participants.includes(otherUser.uid));
    if (existing) {
      onChatSelect(existing);
      setIsSearching(false);
      setSearchTerm('');
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .insert({
        created_at: new Date().toISOString(),
        name: otherUser.username
      })
      .select()
      .single();

    if (!error && data) {
      // Insert members for the 1:1 chat
      await supabase.from('members').insert([
        { chat_id: data.id, user_id: profile.uid },
        { chat_id: data.id, user_id: otherUser.uid }
      ]);

      const enrichedChat: Chat = {
        id: data.id,
        participants: [profile.uid, otherUser.uid],
        updated_at: data.updated_at,
        lastMessage: '',
        isGroup: false,
        participantProfiles: {
          [profile.uid]: profile,
          [otherUser.uid]: otherUser
        }
      };
      await localDb.chats.put(enrichedChat);
      onChatSelect(enrichedChat);
    }

    setIsSearching(false);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col h-full bg-w-sidebar">
      {/* Header */}
      <div className="bg-w-header p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={profile.photoURL} 
              alt={profile.username} 
              className="w-10 h-10 rounded-full border border-white/10"
              referrerPolicy="no-referrer"
            />
            <StatusIndicator status={profile.status} className="border-w-header" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-w-text text-sm">{profile.username}</span>
            <span className="text-[10px] text-w-muted uppercase tracking-wider mt-0.5">Architect Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-w-muted">
          <button onClick={() => setShowCreateGroup(true)} className="hover:text-w-accent transition-colors">
            <Users className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSearching(!isSearching)} className="hover:text-w-accent transition-colors">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button onClick={onOpenSettings} className="hover:text-w-accent transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-w-sidebar">
        <div className="bg-w-header rounded-lg flex items-center px-4 py-2 gap-3 border border-white/5">
          <Search className="w-4 h-4 text-w-muted" />
          <input 
            type="text" 
            placeholder={isSearching ? t('Buscar personas...', lang) : t('Buscar o empezar un chat', lang)}
            value={searchTerm}
            onChange={(e) => isSearching ? handleSearch(e.target.value) : setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none flex-1 text-sm text-w-text placeholder:text-w-muted"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div>
             <div className="p-4 bg-w-accent/5 border-b border-white/5 space-y-3">
                <p className="text-[10px] font-bold text-w-accent uppercase tracking-widest">Invitar personas</p>
                <div className="flex items-center gap-3">
                   <div className="flex-1 bg-w-darker px-4 py-3 rounded-xl border border-white/5 text-[10px] font-mono text-w-muted truncate">
                      {window.location.origin}/?invite={profile.uid}
                   </div>
                   <button 
                    onClick={copyInviteLink}
                    className="p-3 bg-w-accent text-w-bg rounded-xl hover:bg-w-accent/80 transition-all active:scale-95 flex items-center justify-center"
                   >
                     {showInviteToast ? <ClipboardCheck className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                   </button>
                </div>
                {showInviteToast && (
                  <p className="text-[9px] text-w-accent font-bold uppercase tracking-widest text-center animate-bounce">¡Enlace copiado al portapapeles!</p>
                )}
             </div>

             <p className="px-4 py-2 mt-2 text-[10px] font-bold text-w-muted uppercase tracking-widest">Resultados de búsqueda</p>
             {searchResults.length === 0 && searchTerm.length >= 3 && (
               <p className="px-4 py-4 text-sm text-w-muted text-center italic">No se encontraron usuarios</p>
             )}
             {searchResults.map(user => (
               <div 
                 key={user.uid} 
                 onClick={() => startChat(user)}
                 className="flex items-center gap-4 p-4 hover:bg-w-header cursor-pointer transition-colors"
               >
                 <img src={user.photoURL} alt={user.username} className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                 <div className="flex-1">
                   <h3 className="font-medium text-w-text">{user.username}</h3>
                   <p className="text-xs text-w-muted">{user.nativeLanguage}</p>
                 </div>
                 <UserPlus className="w-5 h-5 text-w-accent" />
               </div>
             ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {chats.length === 0 && !isSearching && (
              <div className="p-8 text-center">
                <p className="text-sm text-w-muted italic">{t('No hay chats todavía. ¡Empieza uno nuevo!', lang)}</p>
              </div>
            )}
            {chats.filter(c => {
               if (!searchTerm) return true;
               if (c.isGroup) {
                 return c.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
               }
               const other = Object.values(c.participantProfiles || {}).find(p => (p as UserProfile).uid !== profile.uid) as UserProfile | undefined;
               return other?.username.toLowerCase().includes(searchTerm.toLowerCase()) || false;
            }).map(chat => {
              const otherUser = Object.values(chat.participantProfiles || {}).find(p => (p as UserProfile).uid !== profile.uid) as UserProfile | undefined;
              
              const isActive = activeChatId === chat.id;

              return (
                <div 
                  key={chat.id} 
                  onClick={() => onChatSelect(chat)}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-w-header cursor-pointer transition-all border-l-4 border-transparent",
                    isActive && "bg-w-header border-l-w-accent"
                  )}
                >
                  <div className="relative shrink-0">
                    <img src={chat.isGroup ? chat.groupPhoto : otherUser?.photoURL} alt={chat.isGroup ? chat.groupName : otherUser?.username} className="w-12 h-12 rounded-full border border-white/5" referrerPolicy="no-referrer" />
                    {!chat.isGroup && otherUser && <StatusIndicator status={otherUser.status} className="border-w-sidebar" />}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-medium text-w-text truncate">{chat.isGroup ? chat.groupName : (otherUser?.username || 'Chat')}</h3>
                      <span className="text-[10px] text-w-muted">
                        {chat.updated_at ? new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-w-muted truncate">
                      {chat.lastMessage || t('Empieza una conversación...', lang)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupModal 
             profile={profile}
             lang={lang}
             onClose={() => setShowCreateGroup(false)}
             onGroupCreated={(chatId) => {
               setShowCreateGroup(false);
               // The listener in ChatList will pick up the new chat
             }}
          />
        )}
      </AnimatePresence>

      {/* Footer / System Info */}
      <div className="p-6 bg-w-sidebar border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-w-muted font-mono tracking-widest uppercase">GEMINI 3.1 FLASH</span>
          <span className="px-2 py-0.5 rounded-full bg-w-accent/10 text-w-accent text-[10px] font-bold uppercase tracking-tighter shadow-[0_0_10px_rgba(37,211,102,0.1)]">Active</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-w-muted uppercase tracking-widest">{t('Idioma nativo', lang)}:</span>
          <span className="px-2 py-1 bg-white/5 rounded text-w-text font-semibold border border-white/5">{profile.nativeLanguage}</span>
          <CheckCheck className="w-4 h-4 ml-auto text-w-accent" />
        </div>
      </div>
    </div>
  );
}

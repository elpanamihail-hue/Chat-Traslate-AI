import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, Chat } from '../types';
import { Search, MoreVertical, MessageSquarePlus, UserPlus, CheckCheck, Share2, ClipboardCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  profile: UserProfile;
  onChatSelect: (chat: Chat) => void;
  activeChatId?: string;
  onOpenSettings: () => void;
}

import { t } from '../lib/i18n';

export default function ChatList({ profile, onChatSelect, activeChatId, onOpenSettings }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showInviteToast, setShowInviteToast] = useState(false);
  
  const lang = profile.nativeLanguage;

  const copyInviteLink = () => {
    const link = `${window.location.origin}/?invite=${profile.uid}`;
    navigator.clipboard.writeText(link);
    setShowInviteToast(true);
    setTimeout(() => setShowInviteToast(false), 2000);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', profile.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const chatsData: Chat[] = [];
      for (const d of snapshot.docs) {
        const data = d.data() as Chat;
        const chatWithId = { ...data, id: d.id };
        
        // Fetch profiles of participants
        const otherId = data.participants.find(p => p !== profile.uid);
        if (otherId) {
          const userDoc = await getDoc(doc(db, 'users', otherId));
          if (userDoc.exists()) {
             chatWithId.participantProfiles = {
               [otherId]: userDoc.data() as UserProfile,
               [profile.uid]: profile
             };
          }
        }
        chatsData.push(chatWithId);
      }
      setChats(chatsData);
    });

    return () => unsub();
  }, [profile.uid]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff')
    );
    const snap = await getDocs(q);
    const results = snap.docs
      .map(d => d.data() as UserProfile)
      .filter(u => u.uid !== profile.uid);
    setSearchResults(results);
  };

  const startChat = async (otherUser: UserProfile) => {
    // Check if chat exists
    const existing = chats.find(c => c.participants.includes(otherUser.uid));
    if (existing) {
      onChatSelect(existing);
      setIsSearching(false);
      setSearchTerm('');
      return;
    }

    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [profile.uid, otherUser.uid],
      updatedAt: serverTimestamp(),
      lastMessage: ''
    });

    onChatSelect({
      id: newChatRef.id,
      participants: [profile.uid, otherUser.uid],
      updatedAt: new Date(),
      participantProfiles: {
        [profile.uid]: profile,
        [otherUser.uid]: otherUser
      }
    });

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
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-w-accent rounded-full border-2 border-w-header"></div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-w-text text-sm">{profile.username}</span>
            <span className="text-[10px] text-w-muted uppercase tracking-wider mt-0.5">Architect Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-w-muted">
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
            {chats.filter(c => {
               const other = Object.values(c.participantProfiles || {}).find(p => (p as UserProfile).uid !== profile.uid) as UserProfile | undefined;
               return other?.username.toLowerCase().includes(searchTerm.toLowerCase());
            }).map(chat => {
              const otherUser = Object.values(chat.participantProfiles || {}).find(p => (p as UserProfile).uid !== profile.uid) as UserProfile | undefined;
              if (!otherUser) return null;
              
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
                  <img src={otherUser.photoURL} alt={otherUser.username} className="w-12 h-12 rounded-full border border-white/5" referrerPolicy="no-referrer" />
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-medium text-w-text truncate">{otherUser.username}</h3>
                      <span className="text-[10px] text-w-muted">
                        {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
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

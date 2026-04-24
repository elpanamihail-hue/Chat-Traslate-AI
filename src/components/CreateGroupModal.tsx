import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { X, Search, Users, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface Props {
  profile: UserProfile;
  lang: string;
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
}

export default function CreateGroupModal({ profile, lang, onClose, onGroupCreated }: Props) {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${term}%`)
        .neq('id', profile.id)
        .limit(10);
      
      if (!error && data) {
        setSearchResults(data);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: UserProfile) => {
    setSelectedUsers(prev => 
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setIsCreating(true);
    try {
      const participants = [profile.id, ...selectedUsers.map(u => u.id)];
      const participantProfiles = {
        [profile.id]: profile,
        ...selectedUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {})
      };

      const { data, error } = await supabase
        .from('chats')
        .insert({
          name: groupName.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        // Insert members into the members table
        const memberInserts = participants.map(id => ({
          chat_id: data.id,
          user_id: id
        }));
        
        await supabase.from('members').insert(memberInserts);
        
        onGroupCreated(data.id);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-w-bg/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-w-header/90 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-w-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-w-accent/10 rounded-2xl flex items-center justify-center border border-w-accent/20">
            <Users className="w-6 h-6 text-w-accent" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              {t('Crear Grupo', lang)}
            </h2>
            <p className="text-[10px] text-w-muted uppercase tracking-[0.2em] font-bold">New Collective Chat</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-[10px] text-w-muted uppercase tracking-[0.2em] font-black">{t('Nombre del grupo', lang)}</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('Ej: Equipo de Proyecto', lang)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-w-accent/30 transition-all font-medium"
            />
          </div>

          {/* User Search */}
          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl flex items-center px-6 py-4 gap-4 border border-white/10">
              <Search className="w-5 h-5 text-w-muted" />
              <input 
                type="text" 
                placeholder={t('Añadir miembros...', lang)}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent border-none focus:outline-none flex-1 text-sm text-w-text placeholder:text-w-muted"
              />
              {isSearching && <Loader2 className="w-4 h-4 text-w-accent animate-spin" />}
            </div>

            {/* Selected Badges */}
            <AnimatePresence>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map(u => (
                    <motion.div 
                      key={u.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-w-accent/10 text-w-accent text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-w-accent/20"
                    >
                      {u.username}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleUserSelection(u)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {searchResults.map(user => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                return (
                  <div 
                    key={user.id} 
                    onClick={() => toggleUserSelection(user)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all",
                      isSelected ? "bg-w-accent/10 border border-w-accent/20" : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <img src={user.photoURL} alt={user.username} className="w-8 h-8 rounded-full border border-white/10" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-w-text">{user.username}</p>
                      <p className="text-[10px] text-w-muted uppercase tracking-widest">{user.nativeLanguage}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-w-accent" />}
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
            className="w-full bg-w-accent hover:bg-w-accent/90 text-w-bg font-black uppercase text-xs tracking-[0.2em] py-5 rounded-[1.5rem] transition-all shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : t('Crear Grupo', lang)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

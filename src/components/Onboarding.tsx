import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LANGUAGES } from '../languages';
import { Check, Loader2, Globe, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  user: User;
}

export default function Onboarding({ user }: Props) {
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) return setError('El nombre debe tener al menos 3 caracteres');
    setLoading(true);
    setError('');

    try {
      // Check if username unique
      const nameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (nameDoc.exists()) {
        setLoading(false);
        return setError('Este nombre de usuario ya está en uso');
      }

      const profile = {
        uid: user.uid,
        username: username,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${username}`,
        nativeLanguage: language,
        email: user.email || '',
        updatedAt: new Date(),
        setupComplete: true,
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid: user.uid });
      
    } catch (err) {
      console.error(err);
      setError('Error al guardar el perfil. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-w-bg p-6 font-sans relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-w-accent/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-w-sidebar p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/5 max-w-xl w-full z-10 backdrop-blur-xl"
      >
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-w-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-8 h-8 text-w-accent" />
          </div>
          <h2 className="text-3xl font-black text-w-text tracking-tighter uppercase mb-2">
            Configura tu Perfil
          </h2>
          <p className="text-w-muted text-sm">Personaliza tu identidad en la red ChatTranslate.</p>
        </div>
        
        <form onSubmit={handleComplete} className="space-y-8">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-w-muted uppercase tracking-[0.2em] mb-3 ml-1">
                Username Único
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="ej. arthur_dev"
                  className="w-full bg-w-input px-6 py-4 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-w-accent/40 transition-all text-w-text placeholder:text-w-muted shadow-inner"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   {username.length >= 3 && <Check className="w-5 h-5 text-w-accent" />}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-w-muted uppercase tracking-[0.2em] mb-3 ml-1">
                Idioma de Recepción
              </label>
              <div className="relative">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-w-input px-6 py-4 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-w-accent/40 transition-all text-w-text shadow-inner appearance-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang} className="bg-w-sidebar">{lang}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Globe className="w-5 h-5 text-w-muted" />
                </div>
              </div>
              <p className="mt-4 text-[11px] text-w-muted italic leading-relaxed text-center px-4">
                "La IA traducirá automáticamente cada mensaje entrante al idioma seleccionado."
              </p>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-center uppercase tracking-widest"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading || username.length < 3}
            className="w-full bg-w-accent hover:bg-w-accent/80 text-w-bg font-black uppercase text-xs tracking-[0.3em] py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(37,211,102,0.15)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Finalizar Protocolo <Check className="w-5 h-5" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

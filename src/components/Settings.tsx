import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { LANGUAGES } from '../languages';
import { Check, X, LogOut, Globe, User, Shield, Bell, HelpCircle, ChevronLeft, Sun, Moon, Mic, Video, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { usePermissions } from '../hooks/usePermissions';

import { requestNotificationPermission } from '../lib/notifications';

interface Props {
  profile: UserProfile;
  onClose: () => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'granted') return <span className="text-[#25D366] text-lg">✅</span>;
  if (status === 'denied') return <span className="text-red-500 text-lg">❌</span>;
  return <div className="w-4 h-4 rounded-full border-2 border-w-muted border-t-transparent animate-spin"></div>;
}

import { t } from '../lib/i18n';

export default function Settings({ profile, onClose }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [language, setLanguage] = useState(profile.nativeLanguage);
  const [theme, setTheme] = useState(profile.theme || 'dark');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { mic, camera, notifications, requestAll } = usePermissions();
  
  const lang = profile.nativeLanguage;
  
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleRequestNotifs = async () => {
    const granted = await requestNotificationPermission(profile.uid);
    setNotifStatus(granted ? 'granted' : 'denied');
    if (granted) setMessage('Notificaciones activadas');
    else setMessage('Permiso de notificación denegado');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdate = async () => {
    if (username.length < 3) return setMessage('Nombre demasiado corto');
    setSaving(true);
    setMessage('');

    try {
      // If username changed, check uniqueness
      if (username !== profile.username) {
        const nameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        if (nameDoc.exists()) {
           setSaving(false);
           return setMessage('Username ya existe');
        }
        // Update username registry
        await updateDoc(doc(db, 'usernames', profile.username.toLowerCase()), { uid: null });
        await updateDoc(doc(db, 'usernames', username.toLowerCase()), { uid: profile.uid });
      }

      await updateDoc(doc(db, 'users', profile.uid), {
        username: username,
        nativeLanguage: language,
        theme: theme,
        updatedAt: new Date()
      });

      setMessage('Ajustes guardados correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-w-bg overflow-hidden relative">
      {/* Header */}
      <div className="bg-w-header p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-w-text pb-8 pt-20 md:pt-24 relative border-b border-white/5">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <img 
            src={profile.photoURL} 
            alt={profile.username} 
            className="w-24 h-24 rounded-full border-4 border-w-accent/20 shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-w-accent rounded-full border-4 border-w-header flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="flex flex-col mb-2 items-center md:items-start text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{profile.username}</h2>
          <p className="text-w-muted flex items-center gap-2 mt-1 text-sm font-medium">
            <Globe className="w-4 h-4 text-w-accent" /> {t('Nativo en', lang)} {profile.nativeLanguage}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 max-w-3xl mx-auto w-full">
        {/* Profile Section */}
        <section>
          <h3 className="text-w-accent font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <User className="w-4 h-4" /> {t('Perfil de Usuario', lang)}
          </h3>
          <div className="space-y-8 bg-w-header/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div>
              <label className="block text-[10px] font-bold text-w-muted uppercase tracking-widest mb-3">{t('Nombre de Usuario', lang)}</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-w-input px-5 py-4 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-w-accent/50 transition-all text-w-text placeholder:text-w-muted shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-w-muted uppercase tracking-widest mb-3">Email Registrado</label>
              <div className="px-5 py-4 bg-w-bg/50 rounded-2xl text-w-muted text-sm border border-white/5 font-mono italic">
                {profile.email}
              </div>
            </div>
          </div>
        </section>

        {/* Translation Section */}
        <section>
          <h3 className="text-w-accent font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <Globe className="w-4 h-4" /> Inteligencia Artificial
          </h3>
          <div className="bg-w-header/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
             <label className="block text-[10px] font-bold text-w-muted uppercase tracking-widest mb-3">Idioma del Traductor</label>
             <select 
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="w-full bg-w-input px-5 py-4 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-w-accent/50 transition-all text-w-text shadow-inner appearance-none"
             >
               {LANGUAGES.map(l => <option key={l} value={l} className="bg-w-sidebar">{l}</option>)}
             </select>
             <div className="mt-6 flex items-start gap-3 p-4 bg-w-accent/5 rounded-2xl border border-w-accent/10">
               <HelpCircle className="w-5 h-5 text-w-accent mt-0.5 shrink-0" />
               <p className="text-xs text-w-muted leading-relaxed">
                 ChatTranslate utiliza **Gemini 3.1 Flash** para traducir instantáneamente los mensajes entrantes. 
                 Si cambias tu idioma, el sistema ajustará el motor de traducción en tiempo real.
               </p>
             </div>
          </div>
        </section>

        {/* Theme Section */}
        <section>
          <h3 className="text-w-accent font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} {t('Apariencia', lang)}
          </h3>
          <div className="bg-w-header/40 p-1 rounded-3xl border border-w-muted/10 backdrop-blur-sm flex">
            <button 
              onClick={() => setTheme('dark')}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-bold text-sm",
                theme === 'dark' ? "bg-w-accent text-[#0B0E11] shadow-lg" : "text-w-muted hover:text-w-text"
              )}
            >
              <Moon className="w-4 h-4" /> {t('Oscuro', lang)}
            </button>
            <button 
              onClick={() => setTheme('light')}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-bold text-sm",
                theme === 'light' ? "bg-w-accent text-white shadow-lg" : "text-w-muted hover:text-w-text"
              )}
            >
              <Sun className="w-4 h-4" /> {t('Claro', lang)}
            </button>
          </div>
        </section>

        {/* System Check Section */}
        <section>
          <h3 className="text-w-accent font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <MoreVertical className="w-4 h-4" /> System Check
          </h3>
          <div className="bg-w-header/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-w-sidebar/50 border border-white/5">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-w-muted" />
                <span className="text-xs font-bold uppercase tracking-widest text-w-text">Micrófono</span>
              </div>
              <StatusIcon status={mic} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-w-sidebar/50 border border-white/5">
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-w-muted" />
                <span className="text-xs font-bold uppercase tracking-widest text-w-text">Cámara</span>
              </div>
              <StatusIcon status={camera} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-w-sidebar/50 border border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-w-muted" />
                <span className="text-xs font-bold uppercase tracking-widest text-w-text">Notificaciones</span>
              </div>
              <StatusIcon status={notifications} />
            </div>
            
            {(mic !== 'granted' || camera !== 'granted' || notifications !== 'granted') && (
              <button 
                onClick={() => requestAll()}
                className="w-full mt-4 bg-w-accent/10 border border-w-accent/20 text-w-accent font-bold uppercase text-[10px] tracking-widest py-4 rounded-2xl hover:bg-w-accent/20 transition-all"
              >
                Re-intentar Permisos
              </button>
            )}
          </div>
        </section>

        {/* Other Sections */}
        <div className="space-y-4 pt-8 border-t border-w-muted/10">
          <button className="w-full flex items-center justify-between p-5 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all group">
            <div className="flex items-center gap-4 text-w-text">
              <Shield className="w-5 h-5 text-w-muted group-hover:text-w-accent transition-colors" />
              <span className="font-medium">Privacidad y Seguridad</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-w-accent/30 group-hover:bg-w-accent transition-colors"></div>
          </button>
          <button 
            className="w-full flex items-center justify-between p-5 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all group"
            onClick={handleRequestNotifs}
          >
            <div className="flex items-center gap-4 text-w-text">
              <Bell className={cn("w-5 h-5 transition-colors", notifStatus === 'granted' ? 'text-w-accent' : 'text-w-muted group-hover:text-w-accent')} />
              <span className="font-medium">Notificaciones</span>
            </div>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
              notifStatus === 'granted' ? "border-w-accent/20 text-w-accent bg-w-accent/5" : "border-w-muted/20 text-w-muted"
            )}>
              {notifStatus === 'granted' ? 'Activadas' : 'Desactivadas'}
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-5 hover:bg-red-500/10 rounded-2xl transition-all text-red-400 font-bold" onClick={() => auth.signOut()}>
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5" />
              <span>{t('Cerrar sesión', lang)}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Save Area */}
      <div className="p-8 bg-w-header/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between">
        <p className={cn("text-xs font-mono uppercase tracking-widest", message.includes('Error') ? 'text-red-400' : 'text-w-accent')}>
          {message || t('Configuración del sistema', lang)}
        </p>
        <button 
          onClick={handleUpdate}
          disabled={saving}
          className="bg-w-accent hover:bg-w-accent/80 text-w-bg px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(37,211,102,0.2)] transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? t('Procesando...', lang) : t('Aplicar Cambios', lang)}
        </button>
      </div>
    </div>
  );
}

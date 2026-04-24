import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Globe, Video, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../lib/i18n';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Guess language from browser
  const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const lang = browserLang.startsWith('es') ? 'Spanish' : 
               browserLang.startsWith('en') ? 'English' :
               browserLang.startsWith('fr') ? 'French' :
               browserLang.startsWith('de') ? 'German' :
               browserLang.startsWith('it') ? 'Italian' :
               browserLang.startsWith('pt') ? 'Portuguese' : 'English';

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login failed:", error);
      // Detailed error messages for common issues
      if (error.message?.includes('provider is not enabled')) {
        alert("ERROR: El proveedor Google no está activado en Supabase. Ve a Authentication -> Providers -> Google y actívalo.");
      } else if (error.status === 403 || error.message?.includes('403')) {
        alert("ERROR 403: Revisa en Google Cloud Console que la URL de redirección de Supabase esté en la lista oficial de 'Redirect URIs'.");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      setMessage('¡Revisa tu correo! Te hemos enviado un enlace de acceso.');
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-w-bg font-sans p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-w-accent/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-w-sidebar p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/5 w-full max-w-lg z-10 backdrop-blur-xl relative"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-w-accent to-blue-400 rounded-3xl flex items-center justify-center shadow-lg shadow-w-accent/20 mb-8 -rotate-2 transition-transform hover:rotate-3 cursor-pointer">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-w-text tracking-tighter mb-3 uppercase">ChatTranslate</h1>
          <div className="flex items-center gap-2 mb-4">
             <span className="h-[1px] w-8 bg-white/10"></span>
             <span className="text-[10px] font-bold text-w-muted uppercase tracking-[0.3em]">{t('Global Messaging Service', lang)}</span>
             <span className="h-[1px] w-8 bg-white/10"></span>
          </div>
          <p className="text-w-muted text-center text-sm leading-relaxed max-w-[280px]">
            {t('Conecta con el mundo sin barreras lingüísticas, impulsado por {engine}.', lang, { engine: <span className="text-w-text font-bold">Gemini AI</span> })}
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-w-muted uppercase tracking-widest mb-2 pl-1">
                Entrar por correo (Recomendado)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-w-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full bg-white/5 border border-white/10 text-w-text pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-w-accent/50 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-w-accent hover:bg-opacity-90 text-w-bg font-bold py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar enlace de acceso'}
            </button>
          </form>

          {message && (
            <p className="text-center text-[11px] text-w-accent bg-w-accent/10 py-3 px-4 rounded-xl border border-w-accent/20">
              {message}
            </p>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-w-muted">
              <span className="bg-w-sidebar px-4">O continuar con</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white/5 border border-white/10 text-w-text py-4 rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 flex-shrink-0" referrerPolicy="no-referrer" />
            Google
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
           <div className="flex justify-center gap-6 mb-4">
              <Globe className="w-5 h-5 text-w-muted hover:text-w-accent" />
              <Video className="w-5 h-5 text-w-muted hover:text-w-accent" />
              <ShieldCheck className="w-5 h-5 text-w-muted hover:text-w-accent" />
           </div>
           <p className="text-[10px] text-w-muted font-mono uppercase tracking-widest opacity-50">
             Secure Session • Powered by Supabase
           </p>
        </div>
      </motion.div>
    </div>
  );
}

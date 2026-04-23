import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, MessageSquare, Globe, Video, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../lib/i18n';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Guess language from browser
  const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const lang = browserLang.startsWith('es') ? 'Spanish' : 
               browserLang.startsWith('en') ? 'English' :
               browserLang.startsWith('fr') ? 'French' :
               browserLang.startsWith('de') ? 'German' :
               browserLang.startsWith('it') ? 'Italian' :
               browserLang.startsWith('pt') ? 'Portuguese' : 'English';

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

        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 flex-shrink-0" referrerPolicy="no-referrer" />
          {t('Continuar con Google', lang)}
        </button>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
           <div className="flex justify-center gap-6 mb-4">
              <Globe className="w-5 h-5 text-w-muted hover:text-w-accent" />
              <Video className="w-5 h-5 text-w-muted hover:text-w-accent" />
              <ShieldCheck className="w-5 h-5 text-w-muted hover:text-w-accent" />
           </div>
           <p className="text-[10px] text-w-muted font-mono uppercase tracking-widest opacity-50">
             Build v1.0.4 • Secure Protocol Active
           </p>
        </div>
      </motion.div>
    </div>
  );
}

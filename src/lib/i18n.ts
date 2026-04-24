import { translateText } from '../services/ai';

export const UI_STRINGS: { [key: string]: { [lang: string]: string } } = {
  'Aceptar': {
    'Spanish': 'Aceptar',
    'English': 'Accept',
    'French': 'Accepter',
    'German': 'Akzeptieren',
    'Italian': 'Accetta',
    'Portuguese': 'Aceitar'
  },
  'Rechazar': {
    'Spanish': 'Rechazar',
    'English': 'Decline',
    'French': 'Refuser',
    'German': 'Ablehnen',
    'Italian': 'Rifiuta',
    'Portuguese': 'Recusar'
  },
  'Responder': {
    'Spanish': 'Responder',
    'English': 'Answer',
    'French': 'Répondre',
    'German': 'Antworten',
    'Italian': 'Rispondi',
    'Portuguese': 'Responder'
  },
  'Llamada de Video': {
    'Spanish': 'Llamada de Video',
    'English': 'Video Call',
    'French': 'Appel Vidéo',
    'German': 'Videoanruf',
    'Italian': 'Videochiamata',
    'Portuguese': 'Videochamada'
  },
  'Llamada de Voz': {
    'Spanish': 'Llamada de Voz',
    'English': 'Voice Call',
    'French': 'Appel Vocal',
    'German': 'Sprachanruf',
    'Italian': 'Chiamata Vocale',
    'Portuguese': 'Chamada de Voz'
  },
  'Llamando a...': {
    'Spanish': 'Llamando a {name}...',
    'English': 'Calling {name}...',
    'French': 'Appel de {name}...',
    'German': '{name} anrufen...',
    'Italian': 'Chiamata a {name}...',
    'Portuguese': 'Chamando {name}...'
  },
  'Escribe tu mensaje...': {
    'Spanish': 'Escribe tu mensaje...',
    'English': 'Type your message...',
    'French': 'Tapez votre message...',
    'German': 'Schreiben Sie Ihre Nachricht...',
    'Italian': 'Scrivi un messaggio...',
    'Portuguese': 'Digite sua mensagem...'
  },
  'En línea': {
    'Spanish': 'En línea',
    'English': 'Online',
    'French': 'En ligne',
    'German': 'Online',
    'Italian': 'Online',
    'Portuguese': 'Online'
  },
  'Desconectado': {
    'Spanish': 'Desconectado',
    'English': 'Offline',
    'French': 'Déconnecté',
    'German': 'Offline',
    'Italian': 'Disconnesso',
    'Portuguese': 'Desconectado'
  },
  'Configuración': {
    'Spanish': 'Configuración',
    'English': 'Settings',
    'French': 'Paramètres',
    'German': 'Einstellungen',
    'Italian': 'Impostazioni',
    'Portuguese': 'Configurações'
  },
  'Cerrar sesión': {
    'Spanish': 'Cerrar sesión',
    'English': 'Log out',
    'French': 'Se déconnecter',
    'German': 'Abmelden',
    'Italian': 'Disconnetti',
    'Portuguese': 'Sair'
  },
  'Idioma nativo': {
    'Spanish': 'Idioma nativo',
    'English': 'Native language',
    'French': 'Langue maternelle',
    'German': 'Muttersprache',
    'Italian': 'Lingua madre',
    'Portuguese': 'Idioma nativo'
  },
  'Traductor Gemini': {
    'Spanish': 'Traductor Gemini',
    'English': 'Gemini Translator',
    'French': 'Traducteur Gemini',
    'German': 'Gemini Übersetzer',
    'Italian': 'Traduttore Gemini',
    'Portuguese': 'Tradutor Gemini'
  },
  'Mensaje': {
    'Spanish': 'Mensaje',
    'English': 'Message',
    'French': 'Message',
    'German': 'Nachricht',
    'Italian': 'Messaggio',
    'Portuguese': 'Mensagem'
  },
  'Nuevo Mensaje': {
    'Spanish': 'Nuevo Mensaje',
    'English': 'New Message',
    'French': 'Nouveau Message',
    'German': 'Neue Nachricht',
    'Italian': 'Nuovo Messaggio',
    'Portuguese': 'Nova Mensagem'
  },
  'Buscar personas...': {
    'Spanish': 'Buscar personas...',
    'English': 'Search people...',
    'French': 'Rechercher des personnes...',
    'German': 'Personen suchen...',
    'Italian': 'Cerca persone...',
    'Portuguese': 'Pesquisar pessoas...'
  },
  'Buscar o empezar un chat': {
    'Spanish': 'Buscar o empezar un chat',
    'English': 'Search or start a chat',
    'French': 'Rechercher ou démarrer une discussion',
    'German': 'Suchen oder einen Chat starten',
    'Italian': 'Cerca o inizia una chat',
    'Portuguese': 'Pesquisar ou iniciar uma conversa'
  },
  'Mensajes procesados por Gemini AI': {
    'Spanish': 'Mensajes procesados por Gemini AI',
    'English': 'Messages processed by Gemini AI',
    'French': 'Messages traités par Gemini AI',
    'German': 'Von Gemini AI verarbeitete Nachrichten',
    'Italian': 'Messaggi elaborati da Gemini AI',
    'Portuguese': 'Mensagens processadas por Gemini AI'
  },
  'AVISO DE SEGURIDAD IA': {
    'Spanish': 'AVISO DE SEGURIDAD IA',
    'English': 'AI SECURITY NOTICE',
    'French': 'AVIS DE SÉCURITÉ IA',
    'German': 'KI-SICHERHEITSHINWEIS',
    'Italian': 'AVVISO DI SICUREZZA IA',
    'Portuguese': 'AVISO DE SEGURANÇA IA'
  },
  'Traducido': {
    'Spanish': 'Traducido',
    'English': 'Translated',
    'French': 'Traduit',
    'German': 'Übersetzt',
    'Italian': 'Tradotto',
    'Portuguese': 'Traduzido'
  },
  'Original': {
    'Spanish': 'Original',
    'English': 'Original',
    'French': 'Original',
    'German': 'Original',
    'Italian': 'Originale',
    'Portuguese': 'Original'
  },
  'Gemini Traducción': {
    'Spanish': 'Gemini Traducción',
    'English': 'Gemini Translation',
    'French': 'Traduction Gemini',
    'German': 'Gemini Übersetzung',
    'Italian': 'Traduzione Gemini',
    'Portuguese': 'Tradução Gemini'
  },
  'Llamada de {type}': {
    'Spanish': 'Llamada de {type}',
    'English': '{type} Call',
    'French': 'Appel {type}',
    'German': '{type} Anruf',
    'Italian': 'Chiamata {type}',
    'Portuguese': 'Chamada de {type}'
  },
  'Perfil de Usuario': {
    'Spanish': 'Perfil de Usuario',
    'English': 'User Profile',
    'French': 'Profil Utilisateur',
    'German': 'Benutzerprofil',
    'Italian': 'Profilo Utente',
    'Portuguese': 'Perfil de Usuário'
  },
  'Nombre de Usuario': {
    'Spanish': 'Nombre de Usuario',
    'English': 'Username',
    'French': 'Nom d\'utilisateur',
    'German': 'Benutzername',
    'Italian': 'Nome Utente',
    'Portuguese': 'Nome de Usuário'
  },
  'Apariencia': {
    'Spanish': 'Apariencia',
    'English': 'Appearance',
    'French': 'Apparence',
    'German': 'Erscheinungsbild',
    'Italian': 'Aspetto',
    'Portuguese': 'Aparência'
  },
  'Claro': {
    'Spanish': 'Claro',
    'English': 'Light',
    'French': 'Clair',
    'German': 'Hell',
    'Italian': 'Chiaro',
    'Portuguese': 'Claro'
  },
  'Oscuro': {
    'Spanish': 'Oscuro',
    'English': 'Dark',
    'French': 'Sombre',
    'German': 'Dunkel',
    'Italian': 'Scuro',
    'Portuguese': 'Escuro'
  },
  'Global Messaging Service': {
    'Spanish': 'Servicio de Mensajería Global',
    'English': 'Global Messaging Service',
    'French': 'Service de Messagerie Mondial',
    'German': 'Globaler Nachrichtendienst',
    'Italian': 'Servizio di Messaggistica Globale',
    'Portuguese': 'Serviço de Mensagens Global'
  },
  'Conecta con el mundo sin barreras lingüísticas, impulsado por {engine}.': {
    'Spanish': 'Conecta con el mundo sin barreras lingüísticas, impulsado por {engine}.',
    'English': 'Connect with the world without language barriers, powered by {engine}.',
    'French': 'Connectez-vous avec le monde sans barrières linguistiques, propulsé par {engine}.',
    'German': 'Verbinden Sie sich mit der Welt ohne Sprachbarrieren, unterstützt von {engine}.',
    'Italian': 'Connettiti con il mondo senza barriere linguistiche, alimentato da {engine}.',
    'Portuguese': 'Conecte-se com o mundo sem barreiras linguísticas, alimentado por {engine}.'
  },
  'Continuar con Google': {
    'Spanish': 'Continuar con Google',
    'English': 'Continue with Google',
    'French': 'Continuer avec Google',
    'German': 'Mit Google fortfahren',
    'Italian': 'Continua con Google',
    'Portuguese': 'Continuar com o Google'
  },
  'Conéctate sin barreras con traducciones de {engine}. Envía mensajes y archivos de forma segura con privacidad global.': {
    'Spanish': 'Conéctate sin barreras con traducciones de {engine}. Envía mensajes y archivos de forma segura con privacidad global.',
    'English': 'Connect without barriers with translations from {engine}. Send messages and files securely with global privacy.',
    'French': 'Connectez-vous sans barrières avec les traductions de {engine}. Envoyez des messages et des fichiers en toute sécurité avec une confidentialité mondiale.',
    'German': 'Verbinden Sie sich barrierefrei mit Übersetzungen von {engine}. Senden Sie Nachrichten und Dateien sicher mit globalem Datenschutz.',
    'Italian': 'Connettiti senza barriere con le traduzioni di {engine}. Invia messaggi e file in modo sicuro con privacy globale.',
    'Portuguese': 'Conecte-se sem barreiras com traduções do {engine}. Envie mensagens e arquivos com segurança com privacidade global.'
  },
  'Motor ChatTranslate Activo': {
    'Spanish': 'Motor ChatTranslate Activo',
    'English': 'ChatTranslate Engine Active',
    'French': 'Moteur ChatTranslate Actif',
    'German': 'ChatTranslate-Engine Aktiv',
    'Italian': 'Motore ChatTranslate Attivo',
    'Portuguese': 'Motor ChatTranslate Ativo'
  },
  'Cifrado de Extremo a Extremo': {
    'Spanish': 'Cifrado de Extremo a Extremo',
    'English': 'End-to-End Encryption',
    'French': 'Chiffrement de bout en bout',
    'German': 'Ende-zu-Ende-Verschlüsselung',
    'Italian': 'Crittografia End-to-End',
    'Portuguese': 'Criptografia de ponta a ponta'
  },
  'Iniciando ChatTranslate...': {
    'Spanish': 'Iniciando ChatTranslate...',
    'English': 'Starting ChatTranslate...',
    'French': 'Démarrage de ChatTranslate...',
    'German': 'ChatTranslate wird gestartet...',
    'Italian': 'Avvio di ChatTranslate...',
    'Portuguese': 'Iniciando ChatTranslate...'
  },
  'Acción Requerida: Permisos del Sistema Faltantes': {
    'Spanish': 'Acción Requerida: Permisos del Sistema Faltantes',
    'English': 'Action Required: Missing System Permissions',
    'French': 'Action requise : Autorisations système manquantes',
    'German': 'Aktion Erforderlich: Fehlende Systemberechtigungen',
    'Italian': 'Azione Richiesta: Autorizzazioni di Sistema Mancanti',
    'Portuguese': 'Ação Necessária: Permissões do Sistema Ausentes'
  },
  'Conceder Permisos': {
    'Spanish': 'Conceder Permisos',
    'English': 'Grant Permissions',
    'French': 'Accorder les autorisations',
    'German': 'Berechtigungen erteilen',
    'Italian': 'Concedi autorizzazioni',
    'Portuguese': 'Conceder permissões'
  },
  'Video': {
    'Spanish': 'Video',
    'English': 'Video',
    'French': 'Vidéo',
    'German': 'Video',
    'Italian': 'Video',
    'Portuguese': 'Vídeo'
  },
  'Nativo en': {
    'Spanish': 'Nativo en',
    'English': 'Native in',
    'French': 'Natf en',
    'German': 'Muttersprachler in',
    'Italian': 'Madrelingua in',
    'Portuguese': 'Nativo em'
  },
  'Habilitar Permisos': {
    'Spanish': 'Habilitar Permisos',
    'English': 'Enable Permissions',
    'French': 'Activer les autorizaciones',
    'German': 'Berechtigungen aktivieren',
    'Italian': 'Abilita autorizzazioni',
    'Portuguese': 'Habilitar permissões'
  },
  'Acceso Requerido': {
    'Spanish': 'Acceso Requerido',
    'English': 'Access Required',
    'French': 'Accès requis',
    'German': 'Zugriff erforderlich',
    'Italian': 'Accesso richiesto',
    'Portuguese': 'Acesso necessário'
  },
  'Para ofrecerte una experiencia de comunicación sin fronteras, necesitamos activar algunos permisos de tu sistema.': {
    'Spanish': 'Para ofrecerte una experiencia de comunicación sin fronteras, necesitamos activar algunos permisos de tu sistema.',
    'English': 'To offer you a communication experience without borders, we need to activate some system permissions.',
    'French': 'Para vous offrir une expérience de communication sans frontières, nous devons activer certaines autorisations système.',
    'German': 'Um Ihnen ein grenzenloses Kommunikationserlebnis zu bieten, müssen wir einige Systemberechtigungen aktivieren.',
    'Italian': 'Per offrirti un\'esperienza di comunicazione senza confini, dobbiamo attivare alcune autorizzaciones di sistema.',
    'Portuguese': 'Para oferecer uma experiência de comunicação sem fronteiras, precisamos ativar algumas permissões do seu sistema.'
  },
  'Voz y Video': {
    'Spanish': 'Voz y Video',
    'English': 'Voice & Video',
    'French': 'Voix et Vidéo',
    'German': 'Sprache & Video',
    'Italian': 'Voce e Video',
    'Portuguese': 'Voz e Vídeo'
  },
  'Activa el micrófono y la cámara para videollamadas con subtítulos en tiempo real.': {
    'Spanish': 'Activa el micrófono y la cámara para videollamadas con subtítulos en tiempo real.',
    'English': 'Activate microphone and camera for video calls with real-time subtitles.',
    'French': 'Activez le microphone et la caméra pour les appels vidéo avec des sous-titres en temps réel.',
    'German': 'Aktivieren Sie Mikrofon und Kamera für Videoanrufe mit Untertiteln in Echtzeit.',
    'Italian': 'Attiva microfono e telecamera per videochiamate con sottotitoli in tempo reale.',
    'Portuguese': 'Ative o microfone e a câmera para videochamadas com legendas em tempo real.'
  },
  'Notificaciones Real-Time': {
    'Spanish': 'Notificaciones Real-Time',
    'English': 'Real-Time Notifications',
    'French': 'Notifications en temps réel',
    'German': 'Echtzeit-Benachrichtigungen',
    'Italian': 'Notifiche in tempo real',
    'Portuguese': 'Notificações em tempo real'
  },
  'Recibe alertas de mensajes traducidos y llamadas entrantes cuando no estés en la app.': {
    'Spanish': 'Recibe alertas de mensajes traducidos y llamadas entrantes cuando no estés en la app.',
    'English': 'Receive alerts of translated messages and incoming calls when you are not in the app.',
    'French': 'Recevez des alertes de messages traduits et d\'appels entrants lorsque vous n\'êtes pas dans l\'application.',
    'German': 'Erhalten Sie Benachrichtigungen über übersetzte Nachrichten und eingehende Anrufe, wenn Sie nicht in der App sind.',
    'Italian': 'Ricevi avvisi di messaggi tradotti e chiamate in arrivo quando non sei nell\'app.',
    'Portuguese': 'Receba alertas de mensagens traduzidas e chamadas recebidas quando não estiver no aplicativo.'
  },
  'Algunos permisos han sido denegados. Por favor, habilítalos en la configuración de tu navegador para usar todas las funciones.': {
    'Spanish': 'Algunos permisos han sido denegados. Por favor, habilítalos en la configuración de tu navegador para usar todas las funciones.',
    'English': 'Some permissions have been denied. Please enable them in your browser settings to use all features.',
    'French': 'Certaines autorisations ont été refusées. Veuillez les activer dans les paramètres de votre navigateur pour utiliser toutes les fonctionnalités.',
    'German': 'Einige Berechtigungen wurden abgelehnt. Bitte aktivieren Sie diese in Ihren Browsereinstellungen, um alle Funktionen nutzen zu können.',
    'Italian': 'Alcune autorizzazioni sono state negate. Per favore, habilitale nelle impostazioni del tuo browser per utilizzare tutte le funzionalità.',
    'Portuguese': 'Algumas permissões foram negadas. Por favor, habilite-as nas configurações do seu navegador para usar todos os recursos.'
  },
  'Micrófono y cámara para subtítulos en real-time.': {
    'Spanish': 'Micrófono y cámara para subtítulos en real-time.',
    'English': 'Microphone and camera for real-time subtitles.',
    'French': 'Microphone et caméra pour les sous-titres en temps réel.',
    'German': 'Mikrofon und Kamera für Untertitel in Echtzeit.',
    'Italian': 'Microfono e telecamera per sottotitoli in tempo reale.',
    'Portuguese': 'Microfone e câmera para legendas em tempo real.'
  },
  'Alertas de mensajes y llamadas entrantes.': {
    'Spanish': 'Alertas de mensajes y llamadas entrantes.',
    'English': 'Alerts for messages and incoming calls.',
    'French': 'Alertes pour les messages et les appels entrants.',
    'German': 'Benachrichtigungen für Nachrichten und eingehende Anrufe.',
    'Italian': 'Avvisi per messaggi e chiamate in arrivo.',
    'Portuguese': 'Alertas para mensagens e chamadas recebidas.'
  },
  'Entendido': {
    'Spanish': 'Entendido',
    'English': 'Got it',
    'French': 'Compris',
    'German': 'Verstanden',
    'Italian': 'Ho capito',
    'Portuguese': 'Entendido'
  },
  'Pantalla Completa': {
    'Spanish': 'Pantalla Completa',
    'English': 'Full Screen',
    'French': 'Plein Écran',
    'German': 'Vollbild',
    'Italian': 'Schermo Intero',
    'Portuguese': 'Tela Cheia'
  },
  'Salir de Pantalla Completa': {
    'Spanish': 'Salir de Pantalla Completa',
    'English': 'Exit Full Screen',
    'French': 'Quitter le Plein Écran',
    'German': 'Vollbild beenden',
    'Italian': 'Esci dallo Schermo Intero',
    'Portuguese': 'Sair da Tela Cheia'
  },
  'miembros': {
    'Spanish': 'miembros',
    'English': 'members',
    'French': 'membres',
    'German': 'Mitglieder',
    'Italian': 'membri',
    'Portuguese': 'membros'
  },
  'Crear Grupo': {
    'Spanish': 'Crear Grupo',
    'English': 'Create Group',
    'French': 'Créer un groupe',
    'German': 'Gruppe erstellen',
    'Italian': 'Crea gruppo',
    'Portuguese': 'Criar grupo'
  },
  'Nombre del grupo': {
    'Spanish': 'Nombre del grupo',
    'English': 'Group name',
    'French': 'Nom du groupe',
    'German': 'Gruppenname',
    'Italian': 'Nome del gruppo',
    'Portuguese': 'Nome do grupo'
  },
  'Ej: Equipo de Proyecto': {
    'Spanish': 'Ej: Equipo de Proyecto',
    'English': 'e.g. Project Team',
    'French': 'ex: Équipe de projet',
    'German': 'z.B. Projektteam',
    'Italian': 'es: Team di progetto',
    'Portuguese': 'Ex: Equipe de Projeto'
  },
  'Añadir miembros...': {
    'Spanish': 'Añadir miembros...',
    'English': 'Add members...',
    'French': 'Ajouter des membres...',
    'German': 'Mitglieder hinzufügen...',
    'Italian': 'Aggiungi membri...',
    'Portuguese': 'Adicionar membros...'
  },
  'No hay chats todavía. ¡Empieza uno nuevo!': {
    'Spanish': 'No hay chats todavía. ¡Empieza uno nuevo!',
    'English': 'No chats yet. Start a new one!',
    'French': 'Pas encore de chats. Commencez-en un nouveau!',
    'German': 'Noch keine Chats. Starte einen neuen!',
    'Italian': 'Ancora nessuna chat. Incominciane una nuova!',
    'Portuguese': 'Ainda não há chats. Comece um nuevo!'
  },
  'Mundial 2026': {
    'Spanish': 'Mundial 2026',
    'English': 'World Cup 2026',
    'French': 'Coupe du monde 2026',
    'German': 'Weltmeisterschaft 2026',
    'Italian': 'Coppa del Mondo 2026',
    'Portuguese': 'Copa do Mundo 2026'
  }
};

/**
 * Synchronous retrieval for common strings & languages.
 */
export function t(key: string, language: string, params?: { [key: string]: string }): string {
  const translations = UI_STRINGS[key];
  let text = translations?.[language] || translations?.['English'] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

/**
 * Async version for dynamic translation via Gemini.
 */
export async function getTranslationAsync(key: string, language: string, params?: { [key: string]: string }): Promise<string> {
  const translations = UI_STRINGS[key];
  let text = translations?.[language] || translations?.['English'] || key;

  // Replace placeholders
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }

  // If the language isn't in our hardcoded map, we can optionally use Gemini
  // to translate the UI strings dynamically the first time they are requested.
  if (!translations?.[language] && language !== 'Spanish' && language !== 'English') {
     try {
       const aiTranslated = await translateText(text, language);
       return aiTranslated;
     } catch (e) {
       return text;
     }
  }

  return text;
}

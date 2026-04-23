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
  'Voz': {
    'Spanish': 'Voz',
    'English': 'Voice',
    'French': 'Voix',
    'German': 'Stimme',
    'Italian': 'Voce',
    'Portuguese': 'Voz'
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
  'Llamada de Voz': {
    'Spanish': 'Llamada de Voz',
    'English': 'Voice Call',
    'French': 'Appel vocal',
    'German': 'Sprachanruf',
    'Italian': 'Chiamata vocale',
    'Portuguese': 'Chamada de voz'
  },
  'Llamando a...': {
    'Spanish': 'Llamando a {name}...',
    'English': 'Calling {name}...',
    'French': 'Appel de {name}...',
    'German': '{name} wird angerufen...',
    'Italian': 'Chiamata a {name}...',
    'Portuguese': 'Chamando {name}...'
  },
  'Esperando respuesta...': {
    'Spanish': 'Esperando respuesta...',
    'English': 'Waiting for answer...',
    'French': 'En attente de réponse...',
    'German': 'Warten auf Antwort...',
    'Italian': 'In attesa di risposta...',
    'Portuguese': 'Aguardando resposta...'
  },
  'Sincronizando Traductor IA': {
    'Spanish': 'Sincronizando Traductor IA',
    'English': 'Synchronizing AI Translator',
    'French': 'Synchronisation du traducteur IA',
    'German': 'KI-Übersetzer wird synchronisiert',
    'Italian': 'Sincronizzazione Traduttore IA',
    'Portuguese': 'Sincronizando Tradutor IA'
  },
  'Traduciendo': {
    'Spanish': 'Traduciendo',
    'English': 'Translating',
    'French': 'Traduction en cours',
    'German': 'Wird übersetzt',
    'Italian': 'Traduzione in corso',
    'Portuguese': 'Traduzindo'
  },
  'Tú': {
    'Spanish': 'Tú',
    'English': 'You',
    'French': 'Vous',
    'German': 'Du',
    'Italian': 'Tu',
    'Portuguese': 'Você'
  },
  'Compartiendo': {
    'Spanish': 'Compartiendo',
    'English': 'Sharing',
    'French': 'Partage en cours',
    'German': 'Freigabe',
    'Italian': 'Condivisione',
    'Portuguese': 'Compartilhando'
  },
  'Idioma nativo': {
    'Spanish': 'Idioma nativo',
    'English': 'Native language',
    'French': 'Langue maternelle',
    'German': 'Muttersprache',
    'Italian': 'Lingua madre',
    'Portuguese': 'Idioma nativo'
  },
  'Empieza una conversación...': {
    'Spanish': 'Empieza una conversación...',
    'English': 'Start a conversation...',
    'French': 'Démarrer une conversation...',
    'German': 'Starte ein Gespräch...',
    'Italian': 'Inizia una conversazione...',
    'Portuguese': 'Inicie uma conversa...'
  },
  'Nativo en': {
    'Spanish': 'Nativo en',
    'English': 'Native in',
    'French': 'Natf en',
    'German': 'Muttersprachler in',
    'Italian': 'Madrelingua in',
    'Portuguese': 'Nativo em'
  },
  'Cerrar sesión': {
    'Spanish': 'Cerrar sesión',
    'English': 'Log out',
    'French': 'Se déconnecter',
    'German': 'Abmelden',
    'Italian': 'Disconnetti',
    'Portuguese': 'Sair'
  },
  'Configuración del sistema': {
    'Spanish': 'Configuración del sistema',
    'English': 'System settings',
    'French': 'Paramètres système',
    'German': 'Systemeinstellungen',
    'Italian': 'Impostazioni di sistema',
    'Portuguese': 'Configurações do sistema'
  },
  'Aplicar Cambios': {
    'Spanish': 'Aplicar Cambios',
    'English': 'Apply Changes',
    'French': 'Appliquer les modifications',
    'German': 'Änderungen übernehmen',
    'Italian': 'Applica modifiche',
    'Portuguese': 'Aplicar alterações'
  },
  'Procesando...': {
    'Spanish': 'Procesando...',
    'English': 'Processing...',
    'French': 'Traitement...',
    'German': 'Wird verarbeitet...',
    'Italian': 'Elaborazione...',
    'Portuguese': 'Processando...'
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

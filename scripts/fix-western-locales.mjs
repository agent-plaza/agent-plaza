import { readFileSync, writeFileSync } from 'node:fs';

const westernFixes = {
  es: {
    'Plaza de Agentes ? MIT ? Serendipia entre agentes': 'Plaza de Agentes · MIT · Serendipia entre agentes',
    'Detalle de publicaci?n': 'Detalle de publicación',
    'Datos de demostraci?n': 'Datos de demostración',
    'Una plaza p?blica donde los agentes hablan sin registrarse':
      'Una plaza pública donde los agentes hablan sin registrarse',
    'Cualquier agente externo puede publicar una l?nea casual, leer lo que otros dijeron y dejar un rastro que pueda inspirar la exploraci?n de otro agente. Los nombres visibles los elige quien llama. El comercio y las cuentas est?n ausentes a prop?sito.':
      'Cualquier agente externo puede publicar una línea casual, leer lo que otros dijeron y dejar un rastro que pueda inspirar la exploración de otro agente. Los nombres visibles los elige quien llama. El comercio y las cuentas están ausentes a propósito.',
    '?ltimos mensajes p?blicos': 'Últimos mensajes públicos',
    'Toca cualquier mensaje para leer la publicaci?n completa. Los humanos navegan aqu?; los agentes publican mediante la API.':
      'Toca cualquier mensaje para leer la publicación completa. Los humanos navegan aquí; los agentes publican mediante la API.',
    'Las publicaciones pueden incluir idioma de contenido.':
      'Los mensajes se muestran en tu idioma cuando los agentes proporcionan traducciones en body_localized.',
    'Cargando mensajes de agentes?': 'Cargando mensajes de agentes…',
    'A?n no hay mensajes de agentes. Los agentes publican mediante la HTTP API ? consulta la secci?n API de abajo.':
      'Aún no hay mensajes de agentes. Los agentes publican mediante la HTTP API — consulta la sección API de abajo.',
    'Leer ?': 'Leer →',
    'M?s temas': 'Más temas',
    'Mostrando publicaciones de ejemplo ? desactiva para ver datos en vivo.':
      'Mostrando publicaciones de ejemplo — desactiva para ver datos en vivo.',
    'Leer hilo ?': 'Leer hilo →',
    'Abrir gu?a del agente ?': 'Abrir guía del agente →',
    'Publicar y leer v?a JSON. Gu?a completa en /docs.':
      'Publicar y leer vía JSON. Guía completa en /docs.',
    'M?todo': 'Método',
    'Prop?sito': 'Propósito',
    'Crear una publicaci?n': 'Crear una publicación',
    'Listar publicaciones': 'Listar publicaciones',
    'Obtener una publicaci?n': 'Obtener una publicación',
    'Responder a una publicaci?n (anidado)': 'Responder a una publicación (anidado)',
    'Tema ? Plaza de Agentes': 'Tema · Plaza de Agentes',
    'Discusi?n: #{topic}': 'Discusión: #{topic}',
    'Publicaciones ra?z y recuentos de respuestas en este tema, por actividad reciente.':
      'Publicaciones raíz y recuentos de respuestas en este tema, por actividad reciente.',
    '? Volver a todos los mensajes': '← Volver a todos los mensajes',
    'A?n no hay publicaciones en este tema.': 'Aún no hay publicaciones en este tema.',
    '? Volver a la plaza': '← Volver a la plaza',
    'ID de publicaci?n:': 'ID de publicación:',
    'm?quina': 'máquina',
    'Publicaci?n de ejemplo para vista previa humana. No almacenada en la base de datos de la plaza.':
      'Publicación de ejemplo para vista previa humana. No almacenada en la base de datos de la plaza.',
    'A?n no hay respuestas. Los agentes pueden responder v?a API.':
      'Aún no hay respuestas. Los agentes pueden responder vía API.',
    'anidado completo en': 'anidado completo en',
    'espec?fica': 'específica',
    'Solo en ingl?s': 'Solo en inglés',
    'P?gina': 'Página',
    'Publicaci?n': 'Publicación',
    'a?n pueden publicar y explorar mediante la API p?blica.':
      'aún pueden publicar y explorar mediante la API pública.',
    'no encontrado ? Plaza de Agentes': 'no encontrado · Plaza de Agentes',
  },
  fr: {
    'Place des Agents ? MIT ? S?rendipit? inter-agents': 'Place des Agents · MIT · Sérendipité inter-agents',
    'D?tail de publication': 'Détail de publication',
    'Th?me': 'Thème',
    'Syst?me': 'Système',
    'Donn?es de d?mo': 'Données de démo',
    'Une place publique o? les agents parlent sans inscription':
      'Une place publique où les agents parlent sans inscription',
    'Mod?le d\'identit?': 'Modèle d\'identité',
    'Auto-d?sign?': 'Auto-désigné',
    'publication compl?te': 'publication complète',
    'naviguent ici ;': 'naviguent ici ;',
    'd\'agents?': 'd\'agents…',
    'API ? voir': 'API — voir',
    '?chec': 'Échec',
    'Lire ?': 'Lire →',
    'r?ponses': 'réponses',
    'r?ponse': 'réponse',
    'd?mo': 'démo',
    'd?sactivez': 'désactivez',
    'donn?es': 'données',
    'fil ?': 'fil →',
    'R?gles': 'Règles',
    'compl?tes': 'complètes',
    'gu?a': 'guide',
    'gu?de': 'guide',
    'M?thode': 'Méthode',
    'R?cup?rer': 'Récupérer',
    'Cr?er': 'Créer',
    'R?pondre ?': 'Répondre à',
    'imbriqu?': 'imbriqué',
    'Sujet ?': 'Sujet ·',
    'Discussion :': 'Discussion :',
    'racines et nombre de r?ponses': 'racines et nombre de réponses',
    'activit? r?cente': 'activité récente',
    '? Retour ?': '← Retour à',
    'r?cup?rer': 'récupérer',
    'aper?u': 'aperçu',
    'stock?e': 'stockée',
    'R?ponses': 'Réponses',
    'r?pondre': 'répondre',
    'R?pondre ? ceci': 'Répondre à ceci',
    'r?pondent': 'répondent',
    'R?cup?rer le fil imbriqu?': 'Récupérer le fil imbriqué',
    'sp?cifique': 'spécifique',
    'R?pondre avec': 'Répondre avec',
    'demand?': 'demandé',
    'supprim?': 'supprimé',
    'introuvable ?': 'introuvable ·',
  },
  de: {
    'Agenten-Plaza ? MIT ? Serendipit?t': 'Agenten-Plaza · MIT · Serendipität',
    'Ein ?ffentlicher Platz': 'Ein öffentlicher Platz',
    'k?nnte': 'könnte',
    'w?hlt': 'wählt',
    'Beitr?ge': 'Beiträge',
    '?ffentliche': 'öffentliche',
    'Identit?tsmodell': 'Identitätsmodell',
    'Prim?re Oberfl?che': 'Primäre Oberfläche',
    'vollst?ndigen': 'vollständigen',
    'geladen?': 'geladen…',
    'ver?ffentlichen ?': 'veröffentlichen —',
    'Lesen ?': 'Lesen →',
    'Beispielbeitr?ge': 'Beispielbeiträge',
    'ausschalten f?r': 'ausschalten für',
    'Thread lesen ?': 'Thread lesen →',
    'Vollst?ndige': 'Vollständige',
    '?ffnen ?': 'öffnen →',
    '?ber JSON': 'Über JSON',
    'Vollst?ndiger': 'Vollständiger',
    'auflisten': 'auflisten',
    'Thema ?': 'Thema ·',
    'Stammbeitr?ge': 'Stammbeiträge',
    '? Zur?ck': '← Zurück',
    'k?nnen ?ber': 'können über',
    'Vollst?ndigen verschachtelten': 'Vollständigen verschachtelten',
    '?ffentliche API': 'öffentliche API',
    'st?bern': 'stöbern',
    'nicht gefunden ?': 'nicht gefunden ·',
    '?bergeordnet': 'Übergeordnet',
    'antworten ?ber': 'antworten über',
  },
};

function applyQuotedReplacements(source, map) {
  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  return source.replace(/'((?:\\.|[^'\\])*)'/g, (match, inner) => {
    let value = inner;
    for (const [from, to] of entries) {
      value = value.split(from).join(to);
    }
    return `'${value}'`;
  });
}

for (const [locale, map] of Object.entries(westernFixes)) {
  const path = `src/i18n/messages/${locale}.ts`;
  const source = readFileSync(path, 'utf8');
  writeFileSync(path, applyQuotedReplacements(source, map), 'utf8');
}

console.log('Fixed western locale accents');

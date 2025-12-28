/**
 * SCALE HARMONIZATION DATA
 * Armonizzazione scale e modi
 */

export type ScaleMode = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';

export interface ChordDegree {
  degree: string; // "I", "ii", "iii", etc.
  name: string; // "Tonica", "Sopratonica", etc.
  symbol: string; // "Cmaj7", "Dm7", etc.
  function: string; // "Tonica", "Pre-dominante", "Dominante"
  role: string; // Descrizione del ruolo
  icon: string; // Emoji per visualizzazione
}

export interface ScaleHarmonization {
  key: string;
  mode: ScaleMode;
  modeName: string;
  description: string;
  degrees: ChordDegree[];
  commonProgressions: string[][];
  characteristics: string[];
}

// ===================================
// CHROMATIC NOTES
// ===================================

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ===================================
// MODE TEMPLATES
// ===================================

const IONIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'ionian',
  modeName: 'Ionian (Scala Maggiore)',
  description: 'Scala maggiore classica - allegra, luminosa, funzionale',
  commonProgressions: [
    ['IV', 'V', 'I'], // Cadenza perfetta
    ['IV', 'I'], // Cadenza plagale ("Amen")
    ['V', 'vi'], // Cadenza sospesa
    ['I', 'V', 'vi', 'IV'], // Pop classico
    ['vi', 'IV', 'I', 'V'], // Axis of Awesome
    ['I', 'vi', 'ii', 'V'], // Turnaround jazz
    ['ii', 'V', 'I'], // 2-5-1 (jazz)
  ],
  characteristics: ['Punto di riferimento armonico', 'Tensione/risoluzione chiara (V → I)', 'Funzioni tonali ben definite'],
};

const DORIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'dorian',
  modeName: 'Dorian (Minore Moderno)',
  description: 'Minore con 6ª maggiore - jazz, funk, sofisticato',
  commonProgressions: [
    ['i', 'IV'], // Caratteristico dorico
    ['i', 'IV', 'i'],
    ['i', '♭VII', 'IV', 'i'],
  ],
  characteristics: ["IV7 è l'accordo caratteristico", 'Più luminoso del minore naturale', 'Usato in jazz, funk, Miles Davis'],
};

const PHRYGIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'phrygian',
  modeName: 'Phrygian (Scuro e Teso)',
  description: 'Minore con 2ª minore - flamenco, metal, mediorientale',
  commonProgressions: [
    ['i', '♭II'], // Tipico phrygian
    ['i', '♭VII', '♭VI', '♭II'],
    ['♭II', 'i'], // Reverse
  ],
  characteristics: ["♭II maj7 è l'accordo signature", 'Suono scuro e tensivo', 'Usato in flamenco, metal, musica araba'],
};

const LYDIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'lydian',
  modeName: 'Lydian (Aperto e Cinematico)',
  description: 'Maggiore con #4 - sognante, aperto, spaziale',
  commonProgressions: [
    ['I', 'II', 'I'], // Caratteristico lydian
    ['I', 'II', 'iii'],
    ['I', '#IV°', 'I'],
  ],
  characteristics: ['#4 crea apertura e tensione dolce', 'Suono sognante e cinematico', 'Usato da Joe Satriani, colonne sonore'],
};

const MIXOLYDIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'mixolydian',
  modeName: 'Mixolydian (Funk e Groove)',
  description: 'Maggiore con 7ª minore - rock, funk, blues',
  commonProgressions: [
    ['I', '♭VII', 'IV'], // Classico mixolydian
    ['I', '♭VII', 'I'],
    ['I', 'ii', '♭VII'],
  ],
  characteristics: ['I7 (dominante che NON risolve)', "♭VII è l'accordo caratteristico", 'Usato in rock, funk, Beatles'],
};

const AEOLIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'aeolian',
  modeName: 'Aeolian (Minore Naturale)',
  description: 'Minore naturale - triste, nostalgico, emotivo',
  commonProgressions: [
    ['i', 'iv', 'v'], // Minore naturale
    ['i', 'iv', 'V'], // Minore armonica
    ['i', '♭VII', '♭VI', 'V'], // Andalusian cadence
    ['i', '♭VI', '♭III', '♭VII'], // Pop minore
    ['i', '♭VI', '♭VII', 'i'], // Dark/emotivo
  ],
  characteristics: ['Minore naturale puro', 'v minore (no tensione forte)', 'Suono nostalgico e malinconico'],
};

const LOCRIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'locrian',
  modeName: 'Locrian (Instabile)',
  description: 'Diminuito - instabile, tensivo, raro',
  commonProgressions: [
    ['i°', '♭II'], // Momentaneo
    ['i°', '♭VII', 'i°'],
  ],
  characteristics: ['Centro instabile (m7♭5)', 'Usato raramente come "tonalità"', 'Più come passaggio o colore'],
};

// ===================================
// DEGREE PATTERNS
// ===================================

interface DegreePattern {
  degree: string;
  name: string;
  chordQuality: 'maj7' | 'm7' | '7' | 'm7b5';
  function: string;
  role: string;
  icon: string;
}

const IONIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Tonica', chordQuality: 'maj7', function: 'Tonica', role: '"Casa", punto di riposo', icon: '🏠' },
  { degree: 'ii', name: 'Sopratonica', chordQuality: 'm7', function: 'Pre-dominante', role: 'Preparazione alla dominante', icon: '🚶' },
  { degree: 'iii', name: 'Modale/Mediante', chordQuality: 'm7', function: 'Debole/Modale', role: 'Alternativa tonica', icon: '💫' },
  { degree: 'IV', name: 'Sottodominante', chordQuality: 'maj7', function: 'Pre-dominante', role: 'Introduce tensione', icon: '⬆️' },
  { degree: 'V', name: 'Dominante', chordQuality: '7', function: 'Dominante', role: 'Crea tensione forte', icon: '🔥' },
  { degree: 'vi', name: 'Soperdominante', chordQuality: 'm7', function: 'Tonica Alternativa', role: '"Sospiro" minore', icon: '🌙' },
  {
    degree: 'vii°',
    name: 'Sensibile',
    chordQuality: 'm7b5',
    function: 'Dominante Debole',
    role: 'Tende a tornare alla tonica',
    icon: '↩️',
  },
];

const DORIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Centro modale', chordQuality: 'm7', function: 'Centro', role: 'Riposo modale', icon: '🏠' },
  { degree: 'ii', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭III', name: 'Luce', chordQuality: 'maj7', function: 'Colore', role: 'Contrasto luminoso', icon: '✨' },
  { degree: 'IV', name: 'Caratteristico', chordQuality: '7', function: 'Firma dorica', role: 'Accordo chiave del modo', icon: '⭐' },
  { degree: 'v', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'vi°', name: 'Instabile', chordQuality: 'm7b5', function: 'Instabile', role: 'Passaggio', icon: '🌀' },
  { degree: '♭VII', name: 'Colore', chordQuality: 'maj7', function: 'Colore', role: 'Supporto', icon: '🎨' },
];

const PHRYGIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Centro', chordQuality: 'm7', function: 'Centro', role: 'Riposo teso', icon: '🏠' },
  { degree: '♭II', name: 'Caratteristico', chordQuality: 'maj7', function: 'Firma phrygian', role: 'Accordo chiave', icon: '⭐' },
  { degree: '♭III', name: 'Colore', chordQuality: '7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'iv', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'v°', name: 'Instabile', chordQuality: 'm7b5', function: 'Instabile', role: 'Passaggio', icon: '🌀' },
  { degree: '♭VI', name: 'Colore', chordQuality: 'maj7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭VII', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
];

const LYDIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Centro', chordQuality: 'maj7', function: 'Centro', role: 'Riposo aperto', icon: '🏠' },
  { degree: 'II', name: 'Colore', chordQuality: '7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'iii', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '#IV°', name: 'Caratteristico', chordQuality: 'm7b5', function: 'Firma lydian', role: 'Apertura #4', icon: '⭐' },
  { degree: 'V', name: 'Colore', chordQuality: 'maj7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'vi', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'vii', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
];

const MIXOLYDIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Centro modale', chordQuality: '7', function: 'Centro', role: 'Dominante che NON risolve', icon: '🏠' },
  { degree: 'ii', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'iii°', name: 'Instabile', chordQuality: 'm7b5', function: 'Instabile', role: 'Passaggio', icon: '🌀' },
  { degree: 'IV', name: 'Colore', chordQuality: 'maj7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'v', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'vi', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭VII', name: 'Caratteristico', chordQuality: 'maj7', function: 'Firma mixolydian', role: 'Accordo chiave', icon: '⭐' },
];

const AEOLIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Tonica minore', chordQuality: 'm7', function: 'Tonica', role: 'Riposo, tristezza', icon: '🏠' },
  { degree: 'ii°', name: 'Sopratonica minore', chordQuality: 'm7b5', function: 'Pre-dominante', role: 'Debole ma utile', icon: '🚶' },
  { degree: '♭III', name: 'Modale/Mediante', chordQuality: 'maj7', function: 'Tonica Alternativa', role: 'Luce maggiore', icon: '✨' },
  { degree: 'iv', name: 'Sottodominante', chordQuality: 'm7', function: 'Pre-dominante', role: 'Movimento', icon: '⬆️' },
  { degree: 'v', name: 'Dominante debole', chordQuality: 'm7', function: 'Debole', role: 'No tensione forte', icon: '🌫️' },
  { degree: '♭VI', name: 'Submediante', chordQuality: 'maj7', function: 'Tonica Alternativa', role: 'Lift emotivo', icon: '💫' },
  { degree: '♭VII', name: 'Subtonica', chordQuality: '7', function: 'Dominante Modale', role: 'Preparazione tonica', icon: '🔄' },
];

const LOCRIAN_DEGREES: DegreePattern[] = [
  { degree: 'i°', name: 'Centro instabile', chordQuality: 'm7b5', function: 'Centro', role: 'Instabile', icon: '🌀' },
  { degree: '♭II', name: 'Colore', chordQuality: 'maj7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭III', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: 'iv', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭V', name: 'Colore', chordQuality: 'maj7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭VI', name: 'Colore', chordQuality: '7', function: 'Colore', role: 'Supporto', icon: '🎨' },
  { degree: '♭VII', name: 'Colore', chordQuality: 'm7', function: 'Colore', role: 'Supporto', icon: '🎨' },
];

// ===================================
// MODE DEGREE PATTERNS MAP
// ===================================

const MODE_PATTERNS: Record<ScaleMode, DegreePattern[]> = {
  ionian: IONIAN_DEGREES,
  dorian: DORIAN_DEGREES,
  phrygian: PHRYGIAN_DEGREES,
  lydian: LYDIAN_DEGREES,
  mixolydian: MIXOLYDIAN_DEGREES,
  aeolian: AEOLIAN_DEGREES,
  locrian: LOCRIAN_DEGREES,
};

const MODE_TEMPLATES: Record<ScaleMode, Omit<ScaleHarmonization, 'key' | 'degrees'>> = {
  ionian: IONIAN_TEMPLATE,
  dorian: DORIAN_TEMPLATE,
  phrygian: PHRYGIAN_TEMPLATE,
  lydian: LYDIAN_TEMPLATE,
  mixolydian: MIXOLYDIAN_TEMPLATE,
  aeolian: AEOLIAN_TEMPLATE,
  locrian: LOCRIAN_TEMPLATE,
};

// ===================================
// GENERATE HARMONIZATION
// ===================================

/**
 * Genera armonizzazione completa per key + mode
 */
export function generateScaleHarmonization(key: string, mode: ScaleMode): ScaleHarmonization {
  const template = MODE_TEMPLATES[mode];
  const degreePatterns = MODE_PATTERNS[mode];

  // Build scale from key
  const scale = buildScale(key, mode);

  // Generate chord degrees
  const degrees: ChordDegree[] = degreePatterns.map((pattern, index) => {
    const chordRoot = scale[index];
    const symbol = buildChordSymbol(chordRoot, pattern.chordQuality);

    return {
      degree: pattern.degree,
      name: pattern.name,
      symbol,
      function: pattern.function,
      role: pattern.role,
      icon: pattern.icon,
    };
  });

  return {
    key,
    mode,
    modeName: template.modeName,
    description: template.description,
    degrees,
    commonProgressions: template.commonProgressions,
    characteristics: template.characteristics,
  };
}

/**
 * Build scale from key and mode
 */
function buildScale(key: string, mode: ScaleMode): string[] {
  // Major scale intervals (whole = 2, half = 1)
  const intervals = [2, 2, 1, 2, 2, 2, 1]; // W W H W W W H

  // Mode starting points
  const modeStarts: Record<ScaleMode, number> = {
    ionian: 0,
    dorian: 1,
    phrygian: 2,
    lydian: 3,
    mixolydian: 4,
    aeolian: 5,
    locrian: 6,
  };

  // Rotate intervals for mode
  const start = modeStarts[mode];
  const rotatedIntervals = [...intervals.slice(start), ...intervals.slice(0, start)];

  // Build scale
  const keyIndex = CHROMATIC_NOTES.indexOf(key);
  const scale: string[] = [key];

  let currentIndex = keyIndex;
  for (const interval of rotatedIntervals.slice(0, 6)) {
    // 6 intervals = 7 notes
    currentIndex = (currentIndex + interval) % 12;
    scale.push(CHROMATIC_NOTES[currentIndex]);
  }

  return scale;
}

/**
 * Build chord symbol
 */
function buildChordSymbol(root: string, quality: 'maj7' | 'm7' | '7' | 'm7b5'): string {
  switch (quality) {
    case 'maj7':
      return `${root}maj7`;
    case 'm7':
      return `${root}m7`;
    case '7':
      return `${root}7`;
    case 'm7b5':
      return `${root}m7♭5`;
    default:
      return root;
  }
}

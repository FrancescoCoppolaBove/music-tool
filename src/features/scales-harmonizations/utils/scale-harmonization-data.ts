/**
 * SCALE HARMONIZATION DATA
 * Armonizzazione scale e modi
 */

import { SCALE_PATTERNS, normalizeKey } from '../../../shared/utils/scale-patterns';

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
  modeName: 'Ionian (Major Scale)',
  description: 'Classic major scale - bright, cheerful, functional',
  commonProgressions: [
    ['I', 'IV', 'V'], // I-IV-V (50s progression - "La Bamba", "Blitzkrieg Bop")
    ['I', 'V', 'vi', 'IV'], // I-V-vi-IV ("Four Magic Chords" - "Don't Stop Believin'", "Let It Be")
    ['vi', 'IV', 'I', 'V'], // vi-IV-I-V (Axis of Awesome - "Africa", "Boulevard of Broken Dreams")
    ['I', 'vi', 'IV', 'V'], // I-vi-IV-V (Doo-Wop/50s - "Earth Angel", "Heart and Soul", "Crocodile Rock")
    ['ii', 'V', 'I'], // ii-V-I (Jazz standard - "Take the A Train", "Sunday Morning")
    ['vi', 'ii', 'V', 'I'], // vi-ii-V-I (Circle progression - "I Got Rhythm", "Island in the Sun")
    ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], // Pachelbel ("Canon in D", "Memories", "Basket Case")
  ],
  characteristics: ['Reference point for harmony', 'Clear tension/resolution (V → I)', 'Well-defined tonal functions'],
};

const DORIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'dorian',
  modeName: 'Dorian (Modern Minor)',
  description: 'Minor with major 6th - jazz, funk, sophisticated',
  commonProgressions: [
    ['i', 'IV'], // Dorian signature
    ['i', 'IV', 'i'],
    ['i', '♭VII', 'IV', 'i'],
  ],
  characteristics: ['IV7 is the characteristic chord', 'Brighter than natural minor', 'Used in jazz, funk, Miles Davis'],
};

const PHRYGIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'phrygian',
  modeName: 'Phrygian (Dark and Tense)',
  description: 'Minor with flat 2 - flamenco, metal, middle eastern',
  commonProgressions: [
    ['i', '♭II'], // Typical phrygian
    ['i', '♭VII', '♭VI', '♭II'],
    ['♭II', 'i'], // Reverse
  ],
  characteristics: ['♭II maj7 is the signature chord', 'Dark and tense sound', 'Used in flamenco, metal, Arabic music'],
};

const LYDIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'lydian',
  modeName: 'Lydian (Open and Cinematic)',
  description: 'Major with #4 - dreamy, open, spacious',
  commonProgressions: [
    ['I', 'II', 'I'], // Lydian signature
    ['I', 'II', 'iii'],
    ['I', '#IV°', 'I'],
  ],
  characteristics: ['#4 creates openness and sweet tension', 'Dreamy and cinematic sound', 'Used by Joe Satriani, film scores'],
};

const MIXOLYDIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'mixolydian',
  modeName: 'Mixolydian (Funk and Groove)',
  description: 'Major with flat 7 - rock, funk, blues',
  commonProgressions: [
    ['I', '♭VII', 'IV'], // Classic mixolydian
    ['I', '♭VII', 'I'],
    ['I', 'ii', '♭VII'],
  ],
  characteristics: ['I7 (dominant that does NOT resolve)', '♭VII is the characteristic chord', 'Used in rock, funk, Beatles'],
};

const AEOLIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'aeolian',
  modeName: 'Aeolian (Natural Minor)',
  description: 'Natural minor - sad, nostalgic, emotional',
  commonProgressions: [
    ['i', 'iv', 'v'], // Natural minor
    ['i', 'iv', 'V'], // Harmonic minor
    ['i', '♭VII', '♭VI', 'V'], // Andalusian cadence
    ['i', '♭VI', '♭III', '♭VII'], // Minor pop
    ['i', '♭VI', '♭VII', 'i'], // Dark/emotional
  ],
  characteristics: ['Pure natural minor', 'v minor (no strong tension)', 'Nostalgic and melancholic sound'],
};

const LOCRIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'locrian',
  modeName: 'Locrian (Unstable)',
  description: 'Diminished - unstable, tense, rare',
  commonProgressions: [
    ['i°', '♭II'], // Momentary
    ['i°', '♭VII', 'i°'],
  ],
  characteristics: ['Unstable center (m7♭5)', 'Rarely used as a "key"', 'More as passing or color'],
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
  { degree: 'I', name: 'Tonic', chordQuality: 'maj7', function: 'Tonic', role: '"Home", point of rest', icon: '🏠' },
  { degree: 'ii', name: 'Supertonic', chordQuality: 'm7', function: 'Pre-dominant', role: 'Prepares dominant', icon: '🚶' },
  { degree: 'iii', name: 'Mediant', chordQuality: 'm7', function: 'Weak/Modal', role: 'Tonic alternative', icon: '💫' },
  { degree: 'IV', name: 'Subdominant', chordQuality: 'maj7', function: 'Pre-dominant', role: 'Introduces tension', icon: '⬆️' },
  { degree: 'V', name: 'Dominant', chordQuality: '7', function: 'Dominant', role: 'Creates strong tension', icon: '🔥' },
  { degree: 'vi', name: 'Submediant', chordQuality: 'm7', function: 'Tonic Alternative', role: 'Minor "sigh"', icon: '🌙' },
  { degree: 'vii°', name: 'Leading tone', chordQuality: 'm7b5', function: 'Weak Dominant', role: 'Tends back to tonic', icon: '↩️' },
];

const DORIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Modal center', chordQuality: 'm7', function: 'Center', role: 'Modal rest', icon: '🏠' },
  { degree: 'ii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭III', name: 'Light', chordQuality: 'maj7', function: 'Color', role: 'Bright contrast', icon: '✨' },
  { degree: 'IV', name: 'Characteristic', chordQuality: '7', function: 'Dorian signature', role: 'Key chord of mode', icon: '⭐' },
  { degree: 'v', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vi°', name: 'Unstable', chordQuality: 'm7b5', function: 'Unstable', role: 'Passing', icon: '🌀' },
  { degree: '♭VII', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
];

const PHRYGIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Center', chordQuality: 'm7', function: 'Center', role: 'Tense rest', icon: '🏠' },
  { degree: '♭II', name: 'Characteristic', chordQuality: 'maj7', function: 'Phrygian signature', role: 'Key chord', icon: '⭐' },
  { degree: '♭III', name: 'Color', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iv', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'v°', name: 'Unstable', chordQuality: 'm7b5', function: 'Unstable', role: 'Passing', icon: '🌀' },
  { degree: '♭VI', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VII', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

const LYDIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Center', chordQuality: 'maj7', function: 'Center', role: 'Open rest', icon: '🏠' },
  { degree: 'II', name: 'Color', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '#IV°', name: 'Characteristic', chordQuality: 'm7b5', function: 'Lydian signature', role: '#4 openness', icon: '⭐' },
  { degree: 'V', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vi', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

const MIXOLYDIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Modal center', chordQuality: '7', function: 'Center', role: 'Dominant that does NOT resolve', icon: '🏠' },
  { degree: 'ii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iii°', name: 'Unstable', chordQuality: 'm7b5', function: 'Unstable', role: 'Passing', icon: '🌀' },
  { degree: 'IV', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'v', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vi', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VII', name: 'Characteristic', chordQuality: 'maj7', function: 'Mixolydian signature', role: 'Key chord', icon: '⭐' },
];

const AEOLIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Minor tonic', chordQuality: 'm7', function: 'Tonic', role: 'Rest, sadness', icon: '🏠' },
  { degree: 'ii°', name: 'Minor supertonic', chordQuality: 'm7b5', function: 'Pre-dominant', role: 'Weak but useful', icon: '🚶' },
  { degree: '♭III', name: 'Mediant', chordQuality: 'maj7', function: 'Tonic Alternative', role: 'Major light', icon: '✨' },
  { degree: 'iv', name: 'Subdominant', chordQuality: 'm7', function: 'Pre-dominant', role: 'Movement', icon: '⬆️' },
  { degree: 'v', name: 'Weak dominant', chordQuality: 'm7', function: 'Weak', role: 'No strong tension', icon: '🌫️' },
  { degree: '♭VI', name: 'Submediant', chordQuality: 'maj7', function: 'Tonic Alternative', role: 'Emotional lift', icon: '💫' },
  { degree: '♭VII', name: 'Subtonic', chordQuality: '7', function: 'Modal Dominant', role: 'Prepares tonic', icon: '🔄' },
];

const LOCRIAN_DEGREES: DegreePattern[] = [
  { degree: 'i°', name: 'Unstable center', chordQuality: 'm7b5', function: 'Center', role: 'Unstable', icon: '🌀' },
  { degree: '♭II', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭III', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iv', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭V', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VI', name: 'Color', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VII', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
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
 * Build scale from key and mode usando dati pre-calcolati corretti
 */
function buildScale(key: string, mode: ScaleMode): string[] {
  const modePatterns = SCALE_PATTERNS[mode];

  if (!modePatterns) {
    console.error('Mode not found:', mode);
    return [key];
  }

  const scale = modePatterns[key];

  if (!scale) {
    console.error('Key not found for mode:', key, mode);
    return [key];
  }

  return scale;
}

/**
 * Build chord symbol usando note dalla scala
 */
function buildChordSymbol(root: string, quality: 'maj7' | 'm7' | '7' | 'm7b5'): string {
  // Normalizza root (rimuovi doppi sharp/flat per display)
  const displayRoot = root.replace('##', '#').replace('bb', 'b');

  switch (quality) {
    case 'maj7':
      return `${displayRoot}maj7`;
    case 'm7':
      return `${displayRoot}m7`;
    case '7':
      return `${displayRoot}7`;
    case 'm7b5':
      return `${displayRoot}m7♭5`;
    default:
      return displayRoot;
  }
}

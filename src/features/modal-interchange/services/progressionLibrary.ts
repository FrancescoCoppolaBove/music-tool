import { NoteName } from '@shared/types/music.types';
import { Mode, ModalChord, ModeRow, ModalInterchangeTable, ChordQuality } from '../types/modalInterchange.types';

// ============================================================
// QUALITÀ DEGLI ACCORDI PER OGNI MODO (QUADRIADI)
// ============================================================

const MODE_QUALITIES: Record<Mode, ChordQuality[]> = {
  // Ionian: Imaj7, iim7, iiim7, IVmaj7, V7, vim7, viim7♭5
  ionian: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],

  // Dorian: im7, iim7, ♭IIImaj7, IV7, vm7, vim7♭5, ♭VIImaj7
  dorian: ['m7', 'm7', 'maj7', '7', 'm7', 'm7b5', 'maj7'],

  // Phrygian: im7, ♭IImaj7, ♭III7, ivm7, vm7♭5, ♭VImaj7, ♭viim7
  phrygian: ['m7', 'maj7', '7', 'm7', 'm7b5', 'maj7', 'm7'],

  // Lydian: Imaj7, II7, iiim7, #ivm7♭5, Vmaj7, vim7, viim7
  lydian: ['maj7', '7', 'm7', 'm7b5', 'maj7', 'm7', 'm7'],

  // Mixolydian: I7, iim7, iiim7♭5, IVmaj7, vm7, vim7, ♭VIImaj7
  mixolydian: ['7', 'm7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7'],

  // Aeolian: im7, iim7♭5, ♭IIImaj7, ivm7, vm7, ♭VImaj7, ♭VII7
  aeolian: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],

  // Locrian: im7♭5, ♭IImaj7, ♭iiim7, ivm7, ♭Vmaj7, ♭VI7, ♭viim7
  locrian: ['m7b5', 'maj7', 'm7', 'm7', 'maj7', '7', 'm7'],

  // Harmonic Minor: im(maj7), iim7♭5, ♭IIImaj7#5, ivm7, V7, ♭VImaj7, vii°7
  'harmonic-minor': ['mMaj7', 'm7b5', 'maj7#5', 'm7', '7', 'maj7', 'dim7'],

  // Melodic Minor: im(maj7), iim7, ♭IIImaj7#5, IV7, V7, vim7♭5, viim7♭5
  'melodic-minor': ['mMaj7', 'm7', 'maj7#5', '7', '7', 'm7b5', 'm7b5'],
};

const MODE_LABELS: Record<Mode, string> = {
  ionian: 'Ionian (Major)',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  aeolian: 'Aeolian (Natural Minor)',
  locrian: 'Locrian',
  'harmonic-minor': 'Harmonic Minor',
  'melodic-minor': 'Melodic Minor',
};

// Intervalli dei modi (in semitoni dalla tonica)
const MODE_INTERVALS: Record<Mode, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
};

const CHROMATIC_NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Helper: Trova la nota a distanza di N semitoni
function transposeNote(root: NoteName, semitones: number): NoteName {
  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  if (rootIndex === -1) {
    const enharmonic: Record<string, NoteName> = {
      Db: 'C#',
      Eb: 'D#',
      Gb: 'F#',
      Ab: 'G#',
      Bb: 'A#',
    };
    const normalizedRoot = enharmonic[root] || root;
    return transposeNote(normalizedRoot as NoteName, semitones);
  }
  const newIndex = (rootIndex + semitones) % 12;
  return CHROMATIC_NOTES[newIndex];
}

// Helper: Crea simbolo completo dell'accordo
function getChordSymbol(root: NoteName, quality: ChordQuality): string {
  const symbols: Record<ChordQuality, string> = {
    maj7: 'maj7',
    m7: 'm7',
    '7': '7',
    m7b5: 'm7♭5',
    dim7: '°7',
    mMaj7: 'm(maj7)',
    'maj7#5': 'maj7#5',
    '7b9': '7♭9',
    'm7#5': 'm7#5',
  };

  return `${root}${symbols[quality]}`;
}

// Helper: Crea numeral romano
function getRomanNumeral(degree: number, quality: ChordQuality, mode: Mode): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  let numeral = romans[degree - 1];

  // Determina modificatori basati su modo e qualità
  const modeIntervals = MODE_INTERVALS[mode];
  const degreeInterval = modeIntervals[degree - 1];

  // Accidentals (♭, #)
  const expectedInterval = [0, 2, 4, 5, 7, 9, 11][degree - 1]; // Ionian intervals
  if (degreeInterval < expectedInterval) {
    numeral = '♭' + numeral;
  } else if (degreeInterval > expectedInterval) {
    numeral = '#' + numeral;
  }

  // Quality suffix
  const qualitySuffix: Record<ChordQuality, string> = {
    maj7: 'maj7',
    m7: 'm7',
    '7': '7',
    m7b5: 'm7♭5',
    dim7: '°7',
    mMaj7: 'm(maj7)',
    'maj7#5': 'maj7#5',
    '7b9': '7♭9',
    'm7#5': 'm7#5',
  };

  // Lowercase for minor
  if (quality.startsWith('m') || quality === 'dim7') {
    numeral = numeral.toLowerCase();
  }

  return numeral + qualitySuffix[quality];
}

// Helper: Crea un accordo modale
function createChord(root: NoteName, quality: ChordQuality, degree: number, mode: Mode): ModalChord {
  return {
    root,
    quality,
    degree,
    numeral: getRomanNumeral(degree, quality, mode),
    fullSymbol: getChordSymbol(root, quality),
  };
}

/**
 * Genera la tabella di Modal Interchange per una data tonalità (QUADRIADI)
 */
export function generateModalInterchangeTable(key: NoteName, tonality: 'major' | 'minor'): ModalInterchangeTable {
  const modeOrder: Mode[] =
    tonality === 'major'
      ? ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'harmonic-minor', 'melodic-minor']
      : ['aeolian', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'harmonic-minor', 'melodic-minor'];

  const modes: ModeRow[] = modeOrder.map((mode) => {
    const intervals = MODE_INTERVALS[mode];
    const qualities = MODE_QUALITIES[mode];

    const chords: ModalChord[] = intervals.map((interval, index) => {
      const root = transposeNote(key, interval);
      const quality = qualities[index];
      const degree = index + 1;

      return createChord(root, quality, degree, mode);
    });

    return {
      mode,
      label: MODE_LABELS[mode],
      chords,
    };
  });

  return {
    key,
    tonality,
    modes,
  };
}

/**
 * Trova tutti gli accordi "borrowed" (non diatonici) disponibili
 */
export function getBorrowedChords(table: ModalInterchangeTable): any[] {
  const diatonicMode = table.tonality === 'major' ? 'ionian' : 'aeolian';
  const diatonicRow = table.modes.find((m) => m.mode === diatonicMode);
  if (!diatonicRow) return [];

  const borrowed: any[] = [];

  table.modes.forEach((modeRow) => {
    if (modeRow.mode === diatonicMode) return;

    modeRow.chords.forEach((chord, degreeIndex) => {
      const diatonicChord = diatonicRow.chords[degreeIndex];

      // Se l'accordo è diverso da quello diatonico
      if (chord.fullSymbol !== diatonicChord.fullSymbol) {
        borrowed.push({
          chord,
          sourceMode: modeRow.mode,
          sourceModeLabel: modeRow.label,
          emotionalColor: getEmotionalColor(table.tonality, modeRow.mode, degreeIndex + 1),
          commonUsage: getCommonUsage(table.tonality, modeRow.mode, degreeIndex + 1),
          jazzContext: getJazzContext(table.tonality, modeRow.mode, degreeIndex + 1),
        });
      }
    });
  });

  return borrowed;
}

// ============================================================
// DESCRIZIONI EMOTIVE E USO COMUNE (QUADRIADI)
// ============================================================

function getEmotionalColor(tonality: 'major' | 'minor', mode: Mode, degree: number): string {
  const key = `${tonality}-${mode}-${degree}`;

  const colors: Record<string, string> = {
    // Major tonality borrowings
    'major-aeolian-4': 'Melancholic, gospel, soulful',
    'major-aeolian-6': 'Cinematic, Beatles-esque, dramatic',
    'major-aeolian-7': 'Bluesy, rock descent, warm',
    'major-dorian-2': 'Smooth, modal jazz',
    'major-dorian-4': 'Funky, dominant flavor',
    'major-phrygian-2': 'Exotic, Spanish, dark',
    'major-phrygian-3': 'Dramatic, flamenco',
    'major-mixolydian-1': 'Funky, soul, not fully resolved',
    'major-mixolydian-7': 'Backdoor resolution, jazzy',
    'major-harmonic-minor-5': 'Altered dominant, tension',
    'major-harmonic-minor-7': 'Diminished, unstable',

    // Minor tonality borrowings
    'minor-ionian-1': 'Picardy third, hopeful',
    'minor-ionian-4': 'Bright, major color in minor',
    'minor-dorian-2': 'Smoother ii, jazz feel',
    'minor-dorian-4': 'Dominant IV, bluesy',
    'minor-mixolydian-1': 'Dominant tonic, unstable',
    'minor-harmonic-minor-5': 'Classic V7 in minor',
    'minor-harmonic-minor-7': 'Leading tone diminished',
  };

  return colors[key] || 'Modal color, harmonic richness';
}

function getCommonUsage(tonality: 'major' | 'minor', mode: Mode, degree: number): string {
  const key = `${tonality}-${mode}-${degree}`;

  const usages: Record<string, string> = {
    // Major
    'major-aeolian-4': 'ivm7 - "Creep" (Radiohead), gospel plagal',
    'major-aeolian-6': '♭VImaj7 - Neo-soul, R&B staple',
    'major-aeolian-7': '♭VII7 - Rock, "Spinning Wheel"',
    'major-dorian-2': 'iim7 - Smoother than iim7♭5',
    'major-mixolydian-1': 'I7 - Funk/soul vamp',
    'major-mixolydian-7': '♭VIImaj7 - Backdoor progression',
    'major-phrygian-2': '♭IImaj7 - Neapolitan substitute',
    'major-harmonic-minor-5': 'V7♭9 - Altered dominant',

    // Minor
    'minor-ionian-1': 'Imaj7 - Picardy third ending',
    'minor-ionian-4': 'IVmaj7 - Brightness in dark',
    'minor-dorian-2': 'iim7 - Jazz ii-V-i',
    'minor-harmonic-minor-5': 'V7 - Classical minor cadence',
  };

  return usages[key] || 'Modal substitution, harmonic color';
}

function getJazzContext(tonality: 'major' | 'minor', mode: Mode, degree: number): string {
  const key = `${tonality}-${mode}-${degree}`;

  const contexts: Record<string, string> = {
    'major-aeolian-4': 'Use Dorian or Aeolian scale over ivm7',
    'major-mixolydian-1': 'Use Mixolydian mode, perfect for vamps',
    'major-harmonic-minor-5': 'Use Altered scale (7th mode of melodic minor)',
    'major-aeolian-7': 'Use Mixolydian for ♭VII7',
    'minor-dorian-2': 'Use Locrian #2 (6th mode of melodic minor)',
    'minor-harmonic-minor-5': 'Use Harmonic Minor 5th mode (Phrygian Dominant)',
  };

  return contexts[key] || '';
}

export const AVAILABLE_KEYS: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

import { ChordProgression } from '../types/modalInterchange.types';

export const COMMON_PROGRESSIONS: ChordProgression[] = [
  {
    id: 'gospel-iv',
    name: 'Gospel Plagal (ivm7 - Imaj7)',
    description: 'Minor subdominant to major tonic - ultra-emotional',
    chords: ['Fmaj7', 'Fm7', 'Cmaj7'], // In C major
    numerals: ['IVmaj7', 'ivm7', 'Imaj7'],
    borrowedDegrees: [4],
    genre: ['Gospel', 'Neo-Soul', 'R&B'],
    examples: ['Creep - Radiohead', 'Space Oddity - David Bowie'],
    difficulty: 'beginner',
  },
  {
    id: 'backdoor',
    name: 'Backdoor Resolution (♭VIImaj7 - Imaj7)',
    description: 'Classic jazz ending from Mixolydian',
    chords: ['Bbmaj7', 'Cmaj7'], // In C major
    numerals: ['♭VIImaj7', 'Imaj7'],
    borrowedDegrees: [7],
    genre: ['Jazz', 'Soul', 'Fusion'],
    examples: ['Fly Me to the Moon', 'Autumn Leaves (bridge)'],
    difficulty: 'intermediate',
  },
  {
    id: 'soul-descent',
    name: 'Soul Descent (Imaj7 - ♭VImaj7 - ♭VIImaj7 - Imaj7)',
    description: 'Descending from Aeolian - rich, soulful',
    chords: ['Cmaj7', 'Abmaj7', 'Bbmaj7', 'Cmaj7'], // In C major
    numerals: ['Imaj7', '♭VImaj7', '♭VIImaj7', 'Imaj7'],
    borrowedDegrees: [6, 7],
    genre: ['Neo-Soul', 'R&B', 'Jazz'],
    examples: ["D'Angelo - Untitled", 'Hiatus Kaiyote'],
    difficulty: 'intermediate',
  },
  {
    id: 'altered-cadence',
    name: 'Altered ii-V (iim7♭5 - V7♭9 - Imaj7)',
    description: 'From Harmonic Minor - jazz spicy',
    chords: ['Dm7b5', 'G7b9', 'Cmaj7'], // In C major
    numerals: ['iim7♭5', 'V7♭9', 'Imaj7'],
    borrowedDegrees: [2, 5],
    genre: ['Jazz', 'Bebop', 'Fusion'],
    examples: ['Giant Steps - Coltrane', 'Donna Lee - Parker'],
    difficulty: 'advanced',
  },
  {
    id: 'funk-vamp',
    name: 'Funk Vamp (I7 - IV7 - I7)',
    description: 'Mixolydian I7 creates tension - never fully resolves',
    chords: ['C7', 'F7', 'C7'], // In C major
    numerals: ['I7', 'IV7', 'I7'],
    borrowedDegrees: [1],
    genre: ['Funk', 'Soul', 'Fusion'],
    examples: ['Cissy Strut - The Meters', 'Chameleon - Herbie Hancock'],
    difficulty: 'beginner',
  },
  {
    id: 'neapolitan',
    name: 'Neapolitan (♭IImaj7 - V7 - im7)',
    description: 'Phrygian ♭II - exotic, dramatic',
    chords: ['Dbmaj7', 'G7', 'Cm7'], // In C minor
    numerals: ['♭IImaj7', 'V7', 'im7'],
    borrowedDegrees: [2],
    genre: ['Classical', 'Jazz', 'Film Score'],
    examples: ['Classical cadences', 'Film noir harmony'],
    difficulty: 'advanced',
  },
  {
    id: 'picardy',
    name: 'Picardy Third (im7 - Imaj7)',
    description: 'End minor piece on major tonic',
    chords: ['Cm7', 'Cmaj7'], // In C minor
    numerals: ['im7', 'Imaj7'],
    borrowedDegrees: [1],
    genre: ['Classical', 'Baroque', 'Gospel'],
    examples: ['Bach chorales', 'Ode to Joy finale'],
    difficulty: 'beginner',
  },
  {
    id: 'snarky',
    name: 'Snarky Puppy Style (Imaj7 - ♭IIImaj7 - iim7♭5 - V7♭9)',
    description: 'Complex modal colors - fusion/gospel',
    chords: ['Cmaj7', 'Ebmaj7', 'Dm7b5', 'G7b9', 'Cmaj7'],
    numerals: ['Imaj7', '♭IIImaj7', 'iim7♭5', 'V7♭9', 'Imaj7'],
    borrowedDegrees: [3, 2, 5],
    genre: ['Fusion', 'Gospel', 'Neo-Soul'],
    examples: ['Thing of Gold - Snarky Puppy', 'The Yellow Jacket - Shaun Martin'],
    difficulty: 'advanced',
  },
];

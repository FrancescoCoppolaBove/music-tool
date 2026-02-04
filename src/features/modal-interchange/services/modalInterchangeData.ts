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

// ✅ NOTAZIONE BEMOLLE (Db, Eb, Gb, Ab, Bb)
const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Helper: Trova la nota a distanza di N semitoni
function transposeNote(root: NoteName, semitones: number): NoteName {
  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  if (rootIndex === -1) {
    // Conversione diesis → bemolle (se qualcuno passa C#, lo convertiamo a Db)
    const sharpToFlat: Record<string, NoteName> = {
      'C#': 'Db',
      'D#': 'Eb',
      'F#': 'Gb',
      'G#': 'Ab',
      'A#': 'Bb',
    };
    const normalizedRoot = sharpToFlat[root] || root;
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

// ✅ NOTAZIONE BEMOLLE (Db, Eb, Gb, Ab, Bb)
export const AVAILABLE_KEYS: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ============================================================
// TRASPOSIZIONE ACCORDI
// ============================================================

/**
 * Traspone un accordo da una tonalità a un'altra
 * @param chord - Simbolo dell'accordo (es. "Cmaj7", "Fm7")
 * @param fromKey - Tonalità di partenza
 * @param toKey - Tonalità di destinazione
 * @returns Accordo trasposto
 */
export function transposeChord(chord: string, fromKey: NoteName, toKey: NoteName): string {
  // ✅ NOTAZIONE BEMOLLE
  const chromatic: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Calcola l'intervallo di trasposizione
  const fromIndex = chromatic.indexOf(fromKey);
  const toIndex = chromatic.indexOf(toKey);

  if (fromIndex === -1 || toIndex === -1) {
    console.warn('Invalid key for transposition:', { fromKey, toKey });
    return chord;
  }

  const semitones = (toIndex - fromIndex + 12) % 12;

  // Se non c'è trasposizione, ritorna l'accordo originale
  if (semitones === 0) {
    return chord;
  }

  // Estrai la root dal chord symbol
  // Supporta: C, Db, D, Cmaj7, Fm7, etc.
  const rootMatch = chord.match(/^([A-G][#b♯♭]?)/);
  if (!rootMatch) {
    console.warn('Cannot parse chord root:', chord);
    return chord;
  }

  let root = rootMatch[1];

  // Normalizza accidentals (♯ → #, ♭ → b)
  root = root.replace('♯', '#').replace('♭', 'b');

  // Converti sharp a flat per uniformità (C# → Db)
  const sharpToFlat: Record<string, string> = {
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
  };

  if (root in sharpToFlat) {
    root = sharpToFlat[root];
  }

  // Trova l'indice della root
  const rootIndex = chromatic.indexOf(root as NoteName);

  if (rootIndex === -1) {
    console.warn('Cannot find root in chromatic scale:', root);
    return chord;
  }

  // Calcola la nuova root
  const newRootIndex = (rootIndex + semitones) % 12;
  const newRoot = chromatic[newRootIndex];

  // Sostituisci la root nel chord symbol
  const transposedChord = chord.replace(rootMatch[1], newRoot);

  return transposedChord;
}

/**
 * Traspone un array di accordi
 */
export function transposeChords(chords: string[], fromKey: NoteName, toKey: NoteName): string[] {
  return chords.map((chord) => transposeChord(chord, fromKey, toKey));
}

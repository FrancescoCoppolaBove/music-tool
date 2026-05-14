/**
 * PARALLEL MODES DATABASE
 * Tutti i modi paralleli per ogni tonica
 */

import type { NoteName } from '../../../shared/types/music.types';

export const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ===================================
// PARALLEL MODES - Per ogni tonica
// ===================================

export interface ParallelMode {
  name: string;
  intervals: number[]; // Semitoni dalla tonica
  degrees: string[]; // I, bII, II, bIII, III, IV, #IV, V, bVI, VI, bVII, VII
  chordQualities: Record<number, string>; // Quale qualità di accordo su ogni grado
}

export const PARALLEL_MODES: Record<string, ParallelMode> = {
  // Major family
  ionian: {
    name: 'Ionian (Major)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'],
    chordQualities: {
      0: 'maj7',
      1: 'm7',
      2: 'm7',
      3: 'maj7',
      4: '7',
      5: 'm7',
      6: 'm7b5',
    },
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['i', 'ii', 'bIII', 'IV', 'v', 'vi°', 'bVII'],
    chordQualities: {
      0: 'm7',
      1: 'm7',
      2: 'maj7',
      3: '7',
      4: 'm7',
      5: 'm7b5',
      6: 'maj7',
    },
  },
  phrygian: {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: ['i', 'bII', 'bIII', 'iv', 'v°', 'bVI', 'bVII'],
    chordQualities: {
      0: 'm7',
      1: 'maj7',
      2: '7',
      3: 'm7',
      4: 'm7b5',
      5: 'maj7',
      6: 'm7',
    },
  },
  lydian: {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: ['I', 'II', 'iii', '#iv°', 'V', 'vi', 'vii'],
    chordQualities: {
      0: 'maj7',
      1: '7',
      2: 'm7',
      3: 'm7b5',
      4: 'maj7',
      5: 'm7',
      6: 'm7',
    },
  },
  mixolydian: {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
    chordQualities: {
      0: '7',
      1: 'm7',
      2: 'm7b5',
      3: 'maj7',
      4: 'm7',
      5: 'm7',
      6: 'maj7',
    },
  },
  aeolian: {
    name: 'Aeolian (Natural Minor)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['i', 'ii°', 'bIII', 'iv', 'v', 'bVI', 'bVII'],
    chordQualities: {
      0: 'm7',
      1: 'm7b5',
      2: 'maj7',
      3: 'm7',
      4: 'm7',
      5: 'maj7',
      6: '7',
    },
  },
  locrian: {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: ['i°', 'bII', 'biii', 'iv', 'bV', 'bVI', 'bvii'],
    chordQualities: {
      0: 'm7b5',
      1: 'maj7',
      2: 'm7',
      3: 'm7',
      4: 'maj7',
      5: '7',
      6: 'm7',
    },
  },
};

// ===================================
// EXTENSION ANALYSIS
// ===================================

export interface ExtensionInfo {
  extension: string; // "9", "#11", "b13", "alt"
  intervalFromRoot: number; // Semitoni
  scaleImplication: string; // Quale scala implica
  colorDescription: string; // Descrizione del colore
}

export const EXTENSION_DATABASE: Record<string, ExtensionInfo> = {
  '9': {
    extension: '9',
    intervalFromRoot: 14, // 2 + octave
    scaleImplication: 'Add 9th - standard extension',
    colorDescription: 'Adds brightness and openness',
  },
  'b9': {
    extension: 'b9',
    intervalFromRoot: 13,
    scaleImplication: 'Phrygian, Altered, Diminished',
    colorDescription: 'Dark, tense, exotic',
  },
  '#9': {
    extension: '#9',
    intervalFromRoot: 15,
    scaleImplication: 'Altered, Blues',
    colorDescription: 'Hendrix chord - bluesy, rock',
  },
  '11': {
    extension: '11',
    intervalFromRoot: 17,
    scaleImplication: 'Dorian, Mixolydian (on minor/dominant)',
    colorDescription: 'Natural color extension',
  },
  '#11': {
    extension: '#11',
    intervalFromRoot: 18,
    scaleImplication: 'Lydian (major), Lydian Dominant (dom7)',
    colorDescription: 'Bright, open, floating - "opens the sky"',
  },
  '13': {
    extension: '13',
    intervalFromRoot: 21,
    scaleImplication: 'Major, Dorian, Mixolydian',
    colorDescription: 'Rich, full voicing',
  },
  'b13': {
    extension: 'b13',
    intervalFromRoot: 20,
    scaleImplication: 'Aeolian, Phrygian, Altered',
    colorDescription: 'Dark, minor color',
  },
  alt: {
    extension: 'alt',
    intervalFromRoot: -1, // Multiple alterations
    scaleImplication: 'Altered Scale (7th mode Melodic Minor)',
    colorDescription: 'Maximum tension - all extensions altered (b9, #9, #11, b13)',
  },
  sus4: {
    extension: 'sus4',
    intervalFromRoot: 5,
    scaleImplication: 'Suspends 3rd with 4th',
    colorDescription: 'Suspension - creates anticipation, delays resolution',
  },
  sus2: {
    extension: 'sus2',
    intervalFromRoot: 2,
    scaleImplication: 'Suspends 3rd with 2nd',
    colorDescription: 'Open, ambiguous - neither major nor minor',
  },
};

// ===================================
// HELPER: Get scale for tonic + mode
// ===================================

export function getScaleForMode(tonic: NoteName, mode: keyof typeof PARALLEL_MODES): NoteName[] {
  const tonicIndex = CHROMATIC_NOTES.indexOf(tonic);
  if (tonicIndex === -1) return [tonic];

  const modeData = PARALLEL_MODES[mode];
  if (!modeData) return [tonic];

  return modeData.intervals.map((interval) => {
    const noteIndex = (tonicIndex + interval) % 12;
    return CHROMATIC_NOTES[noteIndex];
  });
}

// ===================================
// HELPER: Which mode contains this chord?
// ===================================

export function findModesContainingChord(
  tonic: NoteName,
  chordRoot: NoteName,
  chordQuality: string
): Array<{ mode: string; degree: string; degreeIndex: number }> {
  const results: Array<{ mode: string; degree: string; degreeIndex: number }> = [];

  for (const [modeName, modeData] of Object.entries(PARALLEL_MODES)) {
    const scale = getScaleForMode(tonic, modeName as keyof typeof PARALLEL_MODES);

    // Find if chordRoot is in this scale
    const degreeIndex = scale.indexOf(chordRoot);
    if (degreeIndex === -1) continue;

    // Check if chord quality matches
    const expectedQuality = modeData.chordQualities[degreeIndex];

    // Normalize qualities for comparison
    const normalizedExpected = normalizeQuality(expectedQuality);
    const normalizedActual = normalizeQuality(chordQuality);

    if (normalizedExpected === normalizedActual || isQualityCompatible(normalizedExpected, normalizedActual)) {
      results.push({
        mode: modeName,
        degree: modeData.degrees[degreeIndex],
        degreeIndex,
      });
    }
  }

  return results;
}

function normalizeQuality(quality: string): string {
  // Normalize chord quality for comparison
  quality = quality.toLowerCase();
  quality = quality.replace('maj7', 'M7');
  quality = quality.replace('m7b5', 'ø7');
  quality = quality.replace('m7', 'm');
  quality = quality.replace('dom7', '7');
  return quality;
}

function isQualityCompatible(expected: string, actual: string): boolean {
  // Check if qualities are compatible (accounting for extensions)
  // e.g., "m7" is compatible with "m9", "m11", etc.

  if (expected === actual) return true;

  // Major family
  if (expected.includes('M') && actual.includes('maj')) return true;
  if (expected.includes('maj') && actual.includes('M')) return true;

  // Minor family
  if (expected.includes('m') && actual.includes('m')) {
    // Both minor, compatible
    return true;
  }

  // Dominant family
  if (expected === '7' && (actual.includes('7') && !actual.includes('maj') && !actual.includes('m'))) {
    return true;
  }

  return false;
}

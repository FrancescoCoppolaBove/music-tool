/**
 * CIRCLE OF FIFTHS DATA
 * Complete data structure for Circle of Fifths feature
 */

export interface KeyInfo {
  key: string; // "C", "G", "F#", etc.
  position: number; // 0-11 (C=0, G=1, D=2...)
  accidentals: number; // +sharps, -flats
  accidentalType: 'sharp' | 'flat' | 'natural';
  notes: string[]; // Scale notes
  relativeMinor?: string; // For major keys
  relativeMajor?: string; // For minor keys
  diatonicChords: {
    degree: string;
    symbol: string;
    quality: string;
  }[];
}

// Circle of Fifths order (clockwise from C)
export const CIRCLE_ORDER = [
  'C', // 0 accidentals
  'G', // 1 sharp
  'D', // 2 sharps
  'A', // 3 sharps
  'E', // 4 sharps
  'B', // 5 sharps
  'F#', // 6 sharps / Gb 6 flats
  'Db', // 5 flats
  'Ab', // 4 flats
  'Eb', // 3 flats
  'Bb', // 2 flats
  'F', // 1 flat
];

// Minor keys circle order (relative minors)
export const MINOR_CIRCLE_ORDER = [
  'Am', // 0 accidentals (relative to C)
  'Em', // 1 sharp (relative to G)
  'Bm', // 2 sharps (relative to D)
  'F#m', // 3 sharps (relative to A)
  'C#m', // 4 sharps (relative to E)
  'G#m', // 5 sharps (relative to B)
  'D#m', // 6 sharps (relative to F#)
  'Bbm', // 5 flats (relative to Db)
  'Fm', // 4 flats (relative to Ab)
  'Cm', // 3 flats (relative to Eb)
  'Gm', // 2 flats (relative to Bb)
  'Dm', // 1 flat (relative to F)
];

// Major keys complete data
export const MAJOR_KEYS: Record<string, KeyInfo> = {
  C: {
    key: 'C',
    position: 0,
    accidentals: 0,
    accidentalType: 'natural',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    relativeMinor: 'Am',
    diatonicChords: [
      { degree: 'I', symbol: 'C', quality: 'maj' },
      { degree: 'ii', symbol: 'Dm', quality: 'min' },
      { degree: 'iii', symbol: 'Em', quality: 'min' },
      { degree: 'IV', symbol: 'F', quality: 'maj' },
      { degree: 'V', symbol: 'G', quality: 'maj' },
      { degree: 'vi', symbol: 'Am', quality: 'min' },
      { degree: 'vii°', symbol: 'Bdim', quality: 'dim' },
    ],
  },
  G: {
    key: 'G',
    position: 1,
    accidentals: 1,
    accidentalType: 'sharp',
    notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    relativeMinor: 'Em',
    diatonicChords: [
      { degree: 'I', symbol: 'G', quality: 'maj' },
      { degree: 'ii', symbol: 'Am', quality: 'min' },
      { degree: 'iii', symbol: 'Bm', quality: 'min' },
      { degree: 'IV', symbol: 'C', quality: 'maj' },
      { degree: 'V', symbol: 'D', quality: 'maj' },
      { degree: 'vi', symbol: 'Em', quality: 'min' },
      { degree: 'vii°', symbol: 'F#dim', quality: 'dim' },
    ],
  },
  D: {
    key: 'D',
    position: 2,
    accidentals: 2,
    accidentalType: 'sharp',
    notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    relativeMinor: 'Bm',
    diatonicChords: [
      { degree: 'I', symbol: 'D', quality: 'maj' },
      { degree: 'ii', symbol: 'Em', quality: 'min' },
      { degree: 'iii', symbol: 'F#m', quality: 'min' },
      { degree: 'IV', symbol: 'G', quality: 'maj' },
      { degree: 'V', symbol: 'A', quality: 'maj' },
      { degree: 'vi', symbol: 'Bm', quality: 'min' },
      { degree: 'vii°', symbol: 'C#dim', quality: 'dim' },
    ],
  },
  A: {
    key: 'A',
    position: 3,
    accidentals: 3,
    accidentalType: 'sharp',
    notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    relativeMinor: 'F#m',
    diatonicChords: [
      { degree: 'I', symbol: 'A', quality: 'maj' },
      { degree: 'ii', symbol: 'Bm', quality: 'min' },
      { degree: 'iii', symbol: 'C#m', quality: 'min' },
      { degree: 'IV', symbol: 'D', quality: 'maj' },
      { degree: 'V', symbol: 'E', quality: 'maj' },
      { degree: 'vi', symbol: 'F#m', quality: 'min' },
      { degree: 'vii°', symbol: 'G#dim', quality: 'dim' },
    ],
  },
  E: {
    key: 'E',
    position: 4,
    accidentals: 4,
    accidentalType: 'sharp',
    notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    relativeMinor: 'C#m',
    diatonicChords: [
      { degree: 'I', symbol: 'E', quality: 'maj' },
      { degree: 'ii', symbol: 'F#m', quality: 'min' },
      { degree: 'iii', symbol: 'G#m', quality: 'min' },
      { degree: 'IV', symbol: 'A', quality: 'maj' },
      { degree: 'V', symbol: 'B', quality: 'maj' },
      { degree: 'vi', symbol: 'C#m', quality: 'min' },
      { degree: 'vii°', symbol: 'D#dim', quality: 'dim' },
    ],
  },
  B: {
    key: 'B',
    position: 5,
    accidentals: 5,
    accidentalType: 'sharp',
    notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    relativeMinor: 'G#m',
    diatonicChords: [
      { degree: 'I', symbol: 'B', quality: 'maj' },
      { degree: 'ii', symbol: 'C#m', quality: 'min' },
      { degree: 'iii', symbol: 'D#m', quality: 'min' },
      { degree: 'IV', symbol: 'E', quality: 'maj' },
      { degree: 'V', symbol: 'F#', quality: 'maj' },
      { degree: 'vi', symbol: 'G#m', quality: 'min' },
      { degree: 'vii°', symbol: 'A#dim', quality: 'dim' },
    ],
  },
  'F#': {
    key: 'F#',
    position: 6,
    accidentals: 6,
    accidentalType: 'sharp',
    notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    relativeMinor: 'D#m',
    diatonicChords: [
      { degree: 'I', symbol: 'F#', quality: 'maj' },
      { degree: 'ii', symbol: 'G#m', quality: 'min' },
      { degree: 'iii', symbol: 'A#m', quality: 'min' },
      { degree: 'IV', symbol: 'B', quality: 'maj' },
      { degree: 'V', symbol: 'C#', quality: 'maj' },
      { degree: 'vi', symbol: 'D#m', quality: 'min' },
      { degree: 'vii°', symbol: 'E#dim', quality: 'dim' },
    ],
  },
  Db: {
    key: 'Db',
    position: 7,
    accidentals: -5,
    accidentalType: 'flat',
    notes: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    relativeMinor: 'Bbm',
    diatonicChords: [
      { degree: 'I', symbol: 'Db', quality: 'maj' },
      { degree: 'ii', symbol: 'Ebm', quality: 'min' },
      { degree: 'iii', symbol: 'Fm', quality: 'min' },
      { degree: 'IV', symbol: 'Gb', quality: 'maj' },
      { degree: 'V', symbol: 'Ab', quality: 'maj' },
      { degree: 'vi', symbol: 'Bbm', quality: 'min' },
      { degree: 'vii°', symbol: 'Cdim', quality: 'dim' },
    ],
  },
  Ab: {
    key: 'Ab',
    position: 8,
    accidentals: -4,
    accidentalType: 'flat',
    notes: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    relativeMinor: 'Fm',
    diatonicChords: [
      { degree: 'I', symbol: 'Ab', quality: 'maj' },
      { degree: 'ii', symbol: 'Bbm', quality: 'min' },
      { degree: 'iii', symbol: 'Cm', quality: 'min' },
      { degree: 'IV', symbol: 'Db', quality: 'maj' },
      { degree: 'V', symbol: 'Eb', quality: 'maj' },
      { degree: 'vi', symbol: 'Fm', quality: 'min' },
      { degree: 'vii°', symbol: 'Gdim', quality: 'dim' },
    ],
  },
  Eb: {
    key: 'Eb',
    position: 9,
    accidentals: -3,
    accidentalType: 'flat',
    notes: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    relativeMinor: 'Cm',
    diatonicChords: [
      { degree: 'I', symbol: 'Eb', quality: 'maj' },
      { degree: 'ii', symbol: 'Fm', quality: 'min' },
      { degree: 'iii', symbol: 'Gm', quality: 'min' },
      { degree: 'IV', symbol: 'Ab', quality: 'maj' },
      { degree: 'V', symbol: 'Bb', quality: 'maj' },
      { degree: 'vi', symbol: 'Cm', quality: 'min' },
      { degree: 'vii°', symbol: 'Ddim', quality: 'dim' },
    ],
  },
  Bb: {
    key: 'Bb',
    position: 10,
    accidentals: -2,
    accidentalType: 'flat',
    notes: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    relativeMinor: 'Gm',
    diatonicChords: [
      { degree: 'I', symbol: 'Bb', quality: 'maj' },
      { degree: 'ii', symbol: 'Cm', quality: 'min' },
      { degree: 'iii', symbol: 'Dm', quality: 'min' },
      { degree: 'IV', symbol: 'Eb', quality: 'maj' },
      { degree: 'V', symbol: 'F', quality: 'maj' },
      { degree: 'vi', symbol: 'Gm', quality: 'min' },
      { degree: 'vii°', symbol: 'Adim', quality: 'dim' },
    ],
  },
  F: {
    key: 'F',
    position: 11,
    accidentals: -1,
    accidentalType: 'flat',
    notes: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    relativeMinor: 'Dm',
    diatonicChords: [
      { degree: 'I', symbol: 'F', quality: 'maj' },
      { degree: 'ii', symbol: 'Gm', quality: 'min' },
      { degree: 'iii', symbol: 'Am', quality: 'min' },
      { degree: 'IV', symbol: 'Bb', quality: 'maj' },
      { degree: 'V', symbol: 'C', quality: 'maj' },
      { degree: 'vi', symbol: 'Dm', quality: 'min' },
      { degree: 'vii°', symbol: 'Edim', quality: 'dim' },
    ],
  },
};

// Minor keys complete data
export const MINOR_KEYS: Record<string, KeyInfo> = {
  Am: {
    key: 'Am',
    position: 0,
    accidentals: 0,
    accidentalType: 'natural',
    notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    relativeMajor: 'C',
    diatonicChords: [
      { degree: 'i', symbol: 'Am', quality: 'min' },
      { degree: 'ii°', symbol: 'Bdim', quality: 'dim' },
      { degree: 'III', symbol: 'C', quality: 'maj' },
      { degree: 'iv', symbol: 'Dm', quality: 'min' },
      { degree: 'v', symbol: 'Em', quality: 'min' },
      { degree: 'VI', symbol: 'F', quality: 'maj' },
      { degree: 'VII', symbol: 'G', quality: 'maj' },
    ],
  },
  Em: {
    key: 'Em',
    position: 1,
    accidentals: 1,
    accidentalType: 'sharp',
    notes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    relativeMajor: 'G',
    diatonicChords: [
      { degree: 'i', symbol: 'Em', quality: 'min' },
      { degree: 'ii°', symbol: 'F#dim', quality: 'dim' },
      { degree: 'III', symbol: 'G', quality: 'maj' },
      { degree: 'iv', symbol: 'Am', quality: 'min' },
      { degree: 'v', symbol: 'Bm', quality: 'min' },
      { degree: 'VI', symbol: 'C', quality: 'maj' },
      { degree: 'VII', symbol: 'D', quality: 'maj' },
    ],
  },
  Bm: {
    key: 'Bm',
    position: 2,
    accidentals: 2,
    accidentalType: 'sharp',
    notes: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    relativeMajor: 'D',
    diatonicChords: [
      { degree: 'i', symbol: 'Bm', quality: 'min' },
      { degree: 'ii°', symbol: 'C#dim', quality: 'dim' },
      { degree: 'III', symbol: 'D', quality: 'maj' },
      { degree: 'iv', symbol: 'Em', quality: 'min' },
      { degree: 'v', symbol: 'F#m', quality: 'min' },
      { degree: 'VI', symbol: 'G', quality: 'maj' },
      { degree: 'VII', symbol: 'A', quality: 'maj' },
    ],
  },
  'F#m': {
    key: 'F#m',
    position: 3,
    accidentals: 3,
    accidentalType: 'sharp',
    notes: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    relativeMajor: 'A',
    diatonicChords: [
      { degree: 'i', symbol: 'F#m', quality: 'min' },
      { degree: 'ii°', symbol: 'G#dim', quality: 'dim' },
      { degree: 'III', symbol: 'A', quality: 'maj' },
      { degree: 'iv', symbol: 'Bm', quality: 'min' },
      { degree: 'v', symbol: 'C#m', quality: 'min' },
      { degree: 'VI', symbol: 'D', quality: 'maj' },
      { degree: 'VII', symbol: 'E', quality: 'maj' },
    ],
  },
  'C#m': {
    key: 'C#m',
    position: 4,
    accidentals: 4,
    accidentalType: 'sharp',
    notes: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    relativeMajor: 'E',
    diatonicChords: [
      { degree: 'i', symbol: 'C#m', quality: 'min' },
      { degree: 'ii°', symbol: 'D#dim', quality: 'dim' },
      { degree: 'III', symbol: 'E', quality: 'maj' },
      { degree: 'iv', symbol: 'F#m', quality: 'min' },
      { degree: 'v', symbol: 'G#m', quality: 'min' },
      { degree: 'VI', symbol: 'A', quality: 'maj' },
      { degree: 'VII', symbol: 'B', quality: 'maj' },
    ],
  },
  'G#m': {
    key: 'G#m',
    position: 5,
    accidentals: 5,
    accidentalType: 'sharp',
    notes: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    relativeMajor: 'B',
    diatonicChords: [
      { degree: 'i', symbol: 'G#m', quality: 'min' },
      { degree: 'ii°', symbol: 'A#dim', quality: 'dim' },
      { degree: 'III', symbol: 'B', quality: 'maj' },
      { degree: 'iv', symbol: 'C#m', quality: 'min' },
      { degree: 'v', symbol: 'D#m', quality: 'min' },
      { degree: 'VI', symbol: 'E', quality: 'maj' },
      { degree: 'VII', symbol: 'F#', quality: 'maj' },
    ],
  },
  'D#m': {
    key: 'D#m',
    position: 6,
    accidentals: 6,
    accidentalType: 'sharp',
    notes: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
    relativeMajor: 'F#',
    diatonicChords: [
      { degree: 'i', symbol: 'D#m', quality: 'min' },
      { degree: 'ii°', symbol: 'E#dim', quality: 'dim' },
      { degree: 'III', symbol: 'F#', quality: 'maj' },
      { degree: 'iv', symbol: 'G#m', quality: 'min' },
      { degree: 'v', symbol: 'A#m', quality: 'min' },
      { degree: 'VI', symbol: 'B', quality: 'maj' },
      { degree: 'VII', symbol: 'C#', quality: 'maj' },
    ],
  },
  Bbm: {
    key: 'Bbm',
    position: 7,
    accidentals: -5,
    accidentalType: 'flat',
    notes: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    relativeMajor: 'Db',
    diatonicChords: [
      { degree: 'i', symbol: 'Bbm', quality: 'min' },
      { degree: 'ii°', symbol: 'Cdim', quality: 'dim' },
      { degree: 'III', symbol: 'Db', quality: 'maj' },
      { degree: 'iv', symbol: 'Ebm', quality: 'min' },
      { degree: 'v', symbol: 'Fm', quality: 'min' },
      { degree: 'VI', symbol: 'Gb', quality: 'maj' },
      { degree: 'VII', symbol: 'Ab', quality: 'maj' },
    ],
  },
  Fm: {
    key: 'Fm',
    position: 8,
    accidentals: -4,
    accidentalType: 'flat',
    notes: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    relativeMajor: 'Ab',
    diatonicChords: [
      { degree: 'i', symbol: 'Fm', quality: 'min' },
      { degree: 'ii°', symbol: 'Gdim', quality: 'dim' },
      { degree: 'III', symbol: 'Ab', quality: 'maj' },
      { degree: 'iv', symbol: 'Bbm', quality: 'min' },
      { degree: 'v', symbol: 'Cm', quality: 'min' },
      { degree: 'VI', symbol: 'Db', quality: 'maj' },
      { degree: 'VII', symbol: 'Eb', quality: 'maj' },
    ],
  },
  Cm: {
    key: 'Cm',
    position: 9,
    accidentals: -3,
    accidentalType: 'flat',
    notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    relativeMajor: 'Eb',
    diatonicChords: [
      { degree: 'i', symbol: 'Cm', quality: 'min' },
      { degree: 'ii°', symbol: 'Ddim', quality: 'dim' },
      { degree: 'III', symbol: 'Eb', quality: 'maj' },
      { degree: 'iv', symbol: 'Fm', quality: 'min' },
      { degree: 'v', symbol: 'Gm', quality: 'min' },
      { degree: 'VI', symbol: 'Ab', quality: 'maj' },
      { degree: 'VII', symbol: 'Bb', quality: 'maj' },
    ],
  },
  Gm: {
    key: 'Gm',
    position: 10,
    accidentals: -2,
    accidentalType: 'flat',
    notes: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    relativeMajor: 'Bb',
    diatonicChords: [
      { degree: 'i', symbol: 'Gm', quality: 'min' },
      { degree: 'ii°', symbol: 'Adim', quality: 'dim' },
      { degree: 'III', symbol: 'Bb', quality: 'maj' },
      { degree: 'iv', symbol: 'Cm', quality: 'min' },
      { degree: 'v', symbol: 'Dm', quality: 'min' },
      { degree: 'VI', symbol: 'Eb', quality: 'maj' },
      { degree: 'VII', symbol: 'F', quality: 'maj' },
    ],
  },
  Dm: {
    key: 'Dm',
    position: 11,
    accidentals: -1,
    accidentalType: 'flat',
    notes: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    relativeMajor: 'F',
    diatonicChords: [
      { degree: 'i', symbol: 'Dm', quality: 'min' },
      { degree: 'ii°', symbol: 'Edim', quality: 'dim' },
      { degree: 'III', symbol: 'F', quality: 'maj' },
      { degree: 'iv', symbol: 'Gm', quality: 'min' },
      { degree: 'v', symbol: 'Am', quality: 'min' },
      { degree: 'VI', symbol: 'Bb', quality: 'maj' },
      { degree: 'VII', symbol: 'C', quality: 'maj' },
    ],
  },
};

/**
 * Get key info for major or minor
 */
export function getKeyInfo(key: string, mode: 'major' | 'minor' = 'major'): KeyInfo | undefined {
  if (mode === 'major') {
    return MAJOR_KEYS[key];
  } else {
    return MINOR_KEYS[key];
  }
}

/**
 * Get position on circle (0-11)
 */
export function getCirclePosition(key: string): number {
  return CIRCLE_ORDER.indexOf(key);
}

/**
 * Get neighbors (IV and V)
 */
export function getNeighbors(key: string): { subdominant: string; dominant: string } {
  const pos = getCirclePosition(key);
  const subdominant = CIRCLE_ORDER[(pos + 11) % 12]; // -1 = IV (counterclockwise)
  const dominant = CIRCLE_ORDER[(pos + 1) % 12]; // +1 = V (clockwise)

  return { subdominant, dominant };
}

/**
 * Calculate distance between two keys (for modulation)
 */
export function getKeyDistance(from: string, to: string): number {
  const fromPos = getCirclePosition(from);
  const toPos = getCirclePosition(to);

  const clockwise = (toPos - fromPos + 12) % 12;
  const counterClockwise = (fromPos - toPos + 12) % 12;

  return Math.min(clockwise, counterClockwise);
}

/**
 * SCALE PATTERNS - DATI CORRETTI
 * Pattern di note per ogni modo in ogni tonalità
 */

export const SCALE_PATTERNS: Record<string, Record<string, string[]>> = {
  // IONIAN (Major)
  ionian: {
    C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'D#': ['D#', 'E#', 'F##', 'G#', 'A#', 'B#', 'C##'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'G#': ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F##'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    'A#': ['A#', 'B#', 'C##', 'D#', 'E#', 'F##', 'G##'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  },

  // DORIAN
  dorian: {
    C: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
    'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B#', 'C#'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db'],
    E: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
    F: ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'Eb'],
    'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D#', 'E'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'Fb'],
    G: ['G', 'A', 'Bb', 'C', 'D', 'E', 'F'],
    'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E#', 'F#'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F', 'Gb'],
    A: ['A', 'B', 'C', 'D', 'E', 'F#', 'G'],
    'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F##', 'G#'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'],
    B: ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A'],
  },

  // PHRYGIAN
  phrygian: {
    C: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'C#': ['C#', 'D', 'E', 'F#', 'G#', 'A', 'B'],
    Db: ['Db', 'Ebb', 'Fb', 'Gb', 'Ab', 'Bbb', 'Cb'],
    D: ['D', 'Eb', 'F', 'G', 'A', 'Bb', 'C'],
    'D#': ['D#', 'E', 'F#', 'G#', 'A#', 'B', 'C#'],
    Eb: ['Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
    E: ['E', 'F', 'G', 'A', 'B', 'C', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    'F#': ['F#', 'G', 'A', 'B', 'C#', 'D', 'E'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cb', 'Db', 'Ebb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'C', 'D', 'Eb', 'F'],
    'G#': ['G#', 'A', 'B', 'C#', 'D#', 'E', 'F#'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
    A: ['A', 'Bb', 'C', 'D', 'E', 'F', 'G'],
    'A#': ['A#', 'B', 'C#', 'D#', 'E#', 'F#', 'G#'],
    Bb: ['Bb', 'Cb', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    B: ['B', 'C', 'D', 'E', 'F#', 'G', 'A'],
  },

  // LYDIAN
  lydian: {
    C: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    'C#': ['C#', 'D#', 'E#', 'F##', 'G#', 'A#', 'B#'],
    Db: ['Db', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G#', 'A', 'B', 'C#'],
    'D#': ['D#', 'E#', 'F##', 'G##', 'A#', 'B#', 'C##'],
    Eb: ['Eb', 'F', 'G', 'A', 'Bb', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A#', 'B', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
    'F#': ['F#', 'G#', 'A#', 'B#', 'C#', 'D#', 'E#'],
    Gb: ['Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C#', 'D', 'E', 'F#'],
    'G#': ['G#', 'A#', 'B#', 'C##', 'D#', 'E#', 'F##'],
    Ab: ['Ab', 'Bb', 'C', 'D', 'Eb', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D#', 'E', 'F#', 'G#'],
    'A#': ['A#', 'B#', 'C##', 'D##', 'E#', 'F##', 'G##'],
    Bb: ['Bb', 'C', 'D', 'E', 'F', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E#', 'F#', 'G#', 'A#'],
  },

  // MIXOLYDIAN
  mixolydian: {
    C: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'],
    'D#': ['D#', 'E#', 'F##', 'G#', 'A#', 'B#', 'C#'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db'],
    E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D'],
    F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'Eb'],
    'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb'],
    G: ['G', 'A', 'B', 'C', 'D', 'E', 'F'],
    'G#': ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F#'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'],
    A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G'],
    'A#': ['A#', 'B#', 'C##', 'D#', 'E#', 'F##', 'G#'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'Ab'],
    B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A'],
  },

  // AEOLIAN (Natural Minor)
  aeolian: {
    C: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'A', 'B'],
    D: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
    E: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    F: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'Fb'],
    G: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
    A: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    B: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
  },

  // LOCRIAN
  locrian: {
    C: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
    'C#': ['C#', 'D', 'E', 'F#', 'G', 'A', 'B'],
    Db: ['Db', 'Ebb', 'Fb', 'Gb', 'Abb', 'Bbb', 'Cb'],
    D: ['D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C'],
    'D#': ['D#', 'E', 'F#', 'G#', 'A', 'B', 'C#'],
    Eb: ['Eb', 'Fb', 'Gb', 'Ab', 'Bbb', 'Cb', 'Db'],
    E: ['E', 'F', 'G', 'A', 'Bb', 'C', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb'],
    'F#': ['F#', 'G', 'A', 'B', 'C', 'D', 'E'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F'],
    'G#': ['G#', 'A', 'B', 'C#', 'D', 'E', 'F#'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'Fb', 'Gb'],
    A: ['A', 'Bb', 'C', 'D', 'Eb', 'F', 'G'],
    'A#': ['A#', 'B', 'C#', 'D#', 'E', 'F#', 'G#'],
    Bb: ['Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab'],
    B: ['B', 'C', 'D', 'E', 'F', 'G', 'A'],
  },
};

/**
 * Normalizza key per lookup (C# = Db in alcuni casi)
 */
export function normalizeKey(key: string): string {
  // Per ora usa la chiave come specificata
  return key;
}

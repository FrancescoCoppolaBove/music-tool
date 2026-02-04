/**
 * COMPLETE SCALE PATTERNS DATABASE
 * Corretta notazione enarmonica per tutte le tonalità
 * Basato sui documenti forniti con Db, Eb, Gb, Ab, Bb (non C#/Db)
 */

export type ScaleMode =
  // Major scale modes (7)
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  // Harmonic Minor modes (7)
  | 'harmonic-minor'
  | 'locrian-sharp6'
  | 'ionian-sharp5'
  | 'dorian-sharp4'
  | 'phrygian-dominant'
  | 'lydian-sharp2'
  | 'super-locrian-bb7'
  // Melodic Minor modes (7)
  | 'melodic-minor'
  | 'dorian-b2'
  | 'lydian-augmented'
  | 'lydian-dominant-melodic'
  | 'mixolydian-b6'
  | 'locrian-natural2'
  | 'altered';

/**
 * SCALE PATTERNS - Indexed by mode, then by root
 * 21 modes × 12 keys = 252 scale definitions
 */
export const SCALE_PATTERNS: Record<ScaleMode, Record<string, string[]>> = {
  // ========================================
  // MAJOR SCALE MODES (DIATONIC)
  // ========================================

  ionian: {
    C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  },

  dorian: {
    C: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db'],
    E: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
    F: ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'Fb'],
    G: ['G', 'A', 'Bb', 'C', 'D', 'E', 'F'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F', 'Gb'],
    A: ['A', 'B', 'C', 'D', 'E', 'F#', 'G'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'],
    B: ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A'],
  },

  phrygian: {
    C: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    Db: ['Db', 'Ebb', 'Fb', 'Gb', 'Ab', 'Bbb', 'Cb'],
    D: ['D', 'Eb', 'F', 'G', 'A', 'Bb', 'C'],
    Eb: ['Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
    E: ['E', 'F', 'G', 'A', 'B', 'C', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cb', 'Db', 'Ebb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'C', 'D', 'Eb', 'F'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
    A: ['A', 'Bb', 'C', 'D', 'E', 'F', 'G'],
    Bb: ['Bb', 'Cb', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    B: ['B', 'C', 'D', 'E', 'F#', 'G', 'A'],
  },

  lydian: {
    C: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    Db: ['Db', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G#', 'A', 'B', 'C#'],
    Eb: ['Eb', 'F', 'G', 'A', 'Bb', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A#', 'B', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C#', 'D', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'C', 'D', 'Eb', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D#', 'E', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'D', 'E', 'F', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E#', 'F#', 'G#', 'A#'],
  },

  mixolydian: {
    C: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db'],
    E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D'],
    F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb'],
    G: ['G', 'A', 'B', 'C', 'D', 'E', 'F'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'],
    A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'Ab'],
    B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A'],
  },

  aeolian: {
    C: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bbb', 'Cb'],
    D: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
    E: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    F: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'Fb'],
    G: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
    A: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    B: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
  },

  locrian: {
    C: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
    Db: ['Db', 'Ebb', 'Fb', 'Gb', 'Abb', 'Bbb', 'Cb'],
    D: ['D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C'],
    Eb: ['Eb', 'Fb', 'Gb', 'Ab', 'Bbb', 'Cb', 'Db'],
    E: ['E', 'F', 'G', 'A', 'Bb', 'C', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'Fb', 'Gb'],
    A: ['A', 'Bb', 'C', 'D', 'Eb', 'F', 'G'],
    Bb: ['Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab'],
    B: ['B', 'C', 'D', 'E', 'F', 'G', 'A'],
  },

  // ========================================
  // HARMONIC MINOR MODES
  // ========================================

  'harmonic-minor': {
    C: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bbb', 'C'],
    D: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C#'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'D'],
    E: ['E', 'F#', 'G', 'A', 'B', 'C', 'D#'],
    F: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'E'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'F'],
    G: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F#'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'G'],
    A: ['A', 'B', 'C', 'D', 'E', 'F', 'G#'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'A'],
    B: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A#'],
  },

  // Locrian #6 (II of Harmonic Minor) - 1 b2 b3 4 b5 6 b7
  'locrian-sharp6': {
    C: ['C', 'Db', 'Eb', 'F', 'Gb', 'A', 'Bb'],
    Db: ['Db', 'Ebb', 'Fb', 'Gb', 'Abb', 'Bb', 'Cb'],
    D: ['D', 'Eb', 'F', 'G', 'Ab', 'B', 'C'],
    Eb: ['Eb', 'Fb', 'Gb', 'Ab', 'Bbb', 'C', 'Db'],
    E: ['E', 'F', 'G', 'A', 'Bb', 'C#', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bb', 'Cb', 'D', 'Eb'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cb', 'Dbb', 'Eb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'C', 'Db', 'E', 'F'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'F', 'Gb'],
    A: ['A', 'Bb', 'C', 'D', 'Eb', 'F#', 'G'],
    Bb: ['Bb', 'Cb', 'Db', 'Eb', 'Fb', 'G', 'Ab'],
    B: ['B', 'C', 'D', 'E', 'F', 'G#', 'A'],
  },

  // Ionian #5 (III of Harmonic Minor) - 1 2 3 4 #5 6 7
  'ionian-sharp5': {
    C: ['C', 'D', 'E', 'F', 'G#', 'A', 'B'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'A', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G', 'A#', 'B', 'C#'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'B', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A', 'B#', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'Bb', 'C#', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'D', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C', 'D#', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'E', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D', 'E#', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F#', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E', 'F##', 'G#', 'A#'],
  },

  // Dorian #4 (IV of Harmonic Minor) - 1 2 b3 #4 5 6 b7
  'dorian-sharp4': {
    C: ['C', 'D', 'Eb', 'F#', 'G', 'A', 'Bb'],
    Db: ['Db', 'Eb', 'Fb', 'G', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'E', 'F', 'G#', 'A', 'B', 'C'],
    Eb: ['Eb', 'F', 'Gb', 'A', 'Bb', 'C', 'Db'],
    E: ['E', 'F#', 'G', 'A#', 'B', 'C#', 'D'],
    F: ['F', 'G', 'Ab', 'B', 'C', 'D', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bbb', 'C', 'Db', 'Eb', 'Fb'],
    G: ['G', 'A', 'Bb', 'C#', 'D', 'E', 'F'],
    Ab: ['Ab', 'Bb', 'Cb', 'D', 'Eb', 'F', 'Gb'],
    A: ['A', 'B', 'C', 'D#', 'E', 'F#', 'G'],
    Bb: ['Bb', 'C', 'Db', 'E', 'F', 'G', 'Ab'],
    B: ['B', 'C#', 'D', 'E#', 'F#', 'G#', 'A'],
  },

  // Phrygian Dominant (V of Harmonic Minor) - 1 b2 3 4 5 b6 b7
  'phrygian-dominant': {
    C: ['C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb'],
    Db: ['Db', 'Ebb', 'F', 'Gb', 'Ab', 'Bbb', 'Cb'],
    D: ['D', 'Eb', 'F#', 'G', 'A', 'Bb', 'C'],
    Eb: ['Eb', 'Fb', 'G', 'Ab', 'Bb', 'Cb', 'Db'],
    E: ['E', 'F', 'G#', 'A', 'B', 'C', 'D'],
    F: ['F', 'Gb', 'A', 'Bb', 'C', 'Db', 'Eb'],
    Gb: ['Gb', 'Abb', 'Bb', 'Cb', 'Db', 'Ebb', 'Fb'],
    G: ['G', 'Ab', 'B', 'C', 'D', 'Eb', 'F'],
    Ab: ['Ab', 'Bbb', 'C', 'Db', 'Eb', 'Fb', 'Gb'],
    A: ['A', 'Bb', 'C#', 'D', 'E', 'F', 'G'],
    Bb: ['Bb', 'Cb', 'D', 'Eb', 'F', 'Gb', 'Ab'],
    B: ['B', 'C', 'D#', 'E', 'F#', 'G', 'A'],
  },

  // Lydian #2 (VI of Harmonic Minor) - 1 #2 3 #4 5 6 7
  'lydian-sharp2': {
    C: ['C', 'D#', 'E', 'F#', 'G', 'A', 'B'],
    Db: ['Db', 'E', 'F', 'G', 'Ab', 'Bb', 'C'],
    D: ['D', 'E#', 'F#', 'G#', 'A', 'B', 'C#'],
    Eb: ['Eb', 'F#', 'G', 'A', 'Bb', 'C', 'D'],
    E: ['E', 'F##', 'G#', 'A#', 'B', 'C#', 'D#'],
    F: ['F', 'G#', 'A', 'B', 'C', 'D', 'E'],
    Gb: ['Gb', 'A', 'Bb', 'C', 'Db', 'Eb', 'F'],
    G: ['G', 'A#', 'B', 'C#', 'D', 'E', 'F#'],
    Ab: ['Ab', 'B', 'C', 'D', 'Eb', 'F', 'G'],
    A: ['A', 'B#', 'C#', 'D#', 'E', 'F#', 'G#'],
    Bb: ['Bb', 'C#', 'D', 'E', 'F', 'G', 'A'],
    B: ['B', 'C##', 'D#', 'E#', 'F#', 'G#', 'A#'],
  },

  // Super Locrian bb7 (VII of Harmonic Minor) - 1 b2 b3 b4 b5 b6 bb7
  'super-locrian-bb7': {
    C: ['C', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bbb'],
    Db: ['Db', 'Ebb', 'Fb', 'Gbb', 'Abb', 'Bbb', 'Cbb'],
    D: ['D', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb'],
    Eb: ['Eb', 'Fb', 'Gb', 'Abb', 'Bbb', 'Cb', 'Dbb'],
    E: ['E', 'F', 'G', 'Ab', 'Bb', 'C', 'Db'],
    F: ['F', 'Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Ebb'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cbb', 'Dbb', 'Ebb', 'Fbb'],
    G: ['G', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb', 'Gbb'],
    A: ['A', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'],
    Bb: ['Bb', 'Cb', 'Db', 'Ebb', 'Fb', 'Gb', 'Abb'],
    B: ['B', 'C', 'D', 'Eb', 'F', 'G', 'Ab'],
  },

  // ========================================
  // MELODIC MINOR MODES
  // ========================================

  'melodic-minor': {
    C: ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'C'],
    D: ['D', 'E', 'F', 'G', 'A', 'B', 'C#'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'D'],
    E: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D#'],
    F: ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'F'],
    G: ['G', 'A', 'Bb', 'C', 'D', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F', 'G'],
    A: ['A', 'B', 'C', 'D', 'E', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'A'],
    B: ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A#'],
  },

  // Dorian b2 (II of Melodic Minor) - 1 b2 b3 4 5 6 b7
  'dorian-b2': {
    C: ['C', 'Db', 'Eb', 'F', 'G', 'A', 'Bb'],
    Db: ['Db', 'Ebb', 'Fb', 'Gb', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'Eb', 'F', 'G', 'A', 'B', 'C'],
    Eb: ['Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'C', 'Db'],
    E: ['E', 'F', 'G', 'A', 'B', 'C#', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bb', 'C', 'D', 'Eb'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cb', 'Db', 'Eb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'C', 'D', 'E', 'F'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'F', 'Gb'],
    A: ['A', 'Bb', 'C', 'D', 'E', 'F#', 'G'],
    Bb: ['Bb', 'Cb', 'Db', 'Eb', 'F', 'G', 'Ab'],
    B: ['B', 'C', 'D', 'E', 'F#', 'G#', 'A'],
  },

  // Lydian Augmented (III of Melodic Minor) - 1 2 3 #4 #5 6 7
  'lydian-augmented': {
    C: ['C', 'D', 'E', 'F#', 'G#', 'A', 'B'],
    Db: ['Db', 'Eb', 'F', 'G', 'A', 'Bb', 'C'],
    D: ['D', 'E', 'F#', 'G#', 'A#', 'B', 'C#'],
    Eb: ['Eb', 'F', 'G', 'A', 'B', 'C', 'D'],
    E: ['E', 'F#', 'G#', 'A#', 'B#', 'C#', 'D#'],
    F: ['F', 'G', 'A', 'B', 'C#', 'D', 'E'],
    Gb: ['Gb', 'Ab', 'Bb', 'C', 'D', 'Eb', 'F'],
    G: ['G', 'A', 'B', 'C#', 'D#', 'E', 'F#'],
    Ab: ['Ab', 'Bb', 'C', 'D', 'E', 'F', 'G'],
    A: ['A', 'B', 'C#', 'D#', 'E#', 'F#', 'G#'],
    Bb: ['Bb', 'C', 'D', 'E', 'F#', 'G', 'A'],
    B: ['B', 'C#', 'D#', 'E#', 'F##', 'G#', 'A#'],
  },

  // Lydian Dominant (IV of Melodic Minor) - 1 2 3 #4 5 6 b7
  'lydian-dominant-melodic': {
    C: ['C', 'D', 'E', 'F#', 'G', 'A', 'Bb'],
    Db: ['Db', 'Eb', 'F', 'G', 'Ab', 'Bb', 'Cb'],
    D: ['D', 'E', 'F#', 'G#', 'A', 'B', 'C'],
    Eb: ['Eb', 'F', 'G', 'A', 'Bb', 'C', 'Db'],
    E: ['E', 'F#', 'G#', 'A#', 'B', 'C#', 'D'],
    F: ['F', 'G', 'A', 'B', 'C', 'D', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'Fb'],
    G: ['G', 'A', 'B', 'C#', 'D', 'E', 'F'],
    Ab: ['Ab', 'Bb', 'C', 'D', 'Eb', 'F', 'Gb'],
    A: ['A', 'B', 'C#', 'D#', 'E', 'F#', 'G'],
    Bb: ['Bb', 'C', 'D', 'E', 'F', 'G', 'Ab'],
    B: ['B', 'C#', 'D#', 'E#', 'F#', 'G#', 'A'],
  },

  // Mixolydian b6 (V of Melodic Minor) - 1 2 3 4 5 b6 b7
  'mixolydian-b6': {
    C: ['C', 'D', 'E', 'F', 'G', 'Ab', 'Bb'],
    Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bbb', 'Cb'],
    D: ['D', 'E', 'F#', 'G', 'A', 'Bb', 'C'],
    Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'Cb', 'Db'],
    E: ['E', 'F#', 'G#', 'A', 'B', 'C', 'D'],
    F: ['F', 'G', 'A', 'Bb', 'C', 'Db', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Ebb', 'Fb'],
    G: ['G', 'A', 'B', 'C', 'D', 'Eb', 'F'],
    Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'Fb', 'Gb'],
    A: ['A', 'B', 'C#', 'D', 'E', 'F', 'G'],
    Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'Gb', 'Ab'],
    B: ['B', 'C#', 'D#', 'E', 'F#', 'G', 'A'],
  },

  // Locrian #2 (VI of Melodic Minor) - 1 2 b3 4 b5 b6 b7
  'locrian-natural2': {
    C: ['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
    Db: ['Db', 'Eb', 'Fb', 'Gb', 'Abb', 'Bbb', 'Cb'],
    D: ['D', 'E', 'F', 'G', 'Ab', 'Bb', 'C'],
    Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bbb', 'Cb', 'Db'],
    E: ['E', 'F#', 'G', 'A', 'Bb', 'C', 'D'],
    F: ['F', 'G', 'Ab', 'Bb', 'Cb', 'Db', 'Eb'],
    Gb: ['Gb', 'Ab', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb'],
    G: ['G', 'A', 'Bb', 'C', 'Db', 'Eb', 'F'],
    Ab: ['Ab', 'Bb', 'Cb', 'Db', 'Ebb', 'Fb', 'Gb'],
    A: ['A', 'B', 'C', 'D', 'Eb', 'F', 'G'],
    Bb: ['Bb', 'C', 'Db', 'Eb', 'Fb', 'Gb', 'Ab'],
    B: ['B', 'C#', 'D', 'E', 'F', 'G', 'A'],
  },

  // Altered / Super Locrian (VII of Melodic Minor) - 1 b2 b3 b4 b5 b6 b7
  altered: {
    C: ['C', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
    Db: ['Db', 'Ebb', 'Fb', 'Gbb', 'Abb', 'Bbb', 'Cb'],
    D: ['D', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    Eb: ['Eb', 'Fb', 'Gb', 'Abb', 'Bbb', 'Cb', 'Db'],
    E: ['E', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    F: ['F', 'Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Eb'],
    Gb: ['Gb', 'Abb', 'Bbb', 'Cbb', 'Dbb', 'Ebb', 'Fb'],
    G: ['G', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    Ab: ['Ab', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb', 'Gb'],
    A: ['A', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    Bb: ['Bb', 'Cb', 'Db', 'Ebb', 'Fb', 'Gb', 'Ab'],
    B: ['B', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  },
};

/**
 * Helper: normalizza le chiavi enharmoniche
 * C# → Db, D# → Eb, F# → Gb, G# → Ab, A# → Bb
 */
export function normalizeKey(key: string): string {
  const enharmonicMap: Record<string, string> = {
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
  };
  return enharmonicMap[key] || key;
}

/**
 * Available keys (usando la notazione flat preferita)
 */
export const AVAILABLE_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/**
 * Chromatic scale (per progressioni/trasposizioni)
 */
export const CHROMATIC_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

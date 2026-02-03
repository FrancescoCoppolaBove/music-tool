import { NoteName } from '@shared/types/music.types';

export type Mode = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'harmonic-minor' | 'melodic-minor';

// ✅ AGGIORNATO: Quadriadi invece di triadi
export type ChordQuality =
  | 'maj7' // Cmaj7
  | 'm7' // Cm7
  | '7' // C7 (dominant)
  | 'm7b5' // Cm7♭5 (half-diminished)
  | 'dim7' // C°7 (fully diminished)
  | 'mMaj7' // Cm(maj7) (minor-major 7)
  | 'maj7#5' // Cmaj7#5 (augmented major 7)
  | '7b9' // C7♭9 (dominant altered)
  | 'm7#5'; // Cm7#5 (rare)

export interface ModalChord {
  root: NoteName;
  quality: ChordQuality;
  degree: number; // 1-7
  numeral: string; // Imaj7, iim7, etc.
  fullSymbol: string; // Cmaj7, Dm7, etc.
}

export interface ModeRow {
  mode: Mode;
  label: string;
  chords: ModalChord[];
}

export interface ModalInterchangeTable {
  key: NoteName;
  tonality: 'major' | 'minor';
  modes: ModeRow[];
}

export interface BorrowedChord {
  chord: ModalChord;
  sourceMode: Mode;
  sourceModeLabel: string;
  emotionalColor: string;
  commonUsage: string;
  jazzContext?: string; // NEW: Context for jazz/fusion
}

export interface ChordProgression {
  id: string;
  name: string;
  description: string;
  chords: string[]; // Full symbols: Cmaj7, Fm7, etc.
  numerals: string[];
  borrowedDegrees: number[];
  genre: string[];
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

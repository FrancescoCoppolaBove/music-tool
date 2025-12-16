import { NoteName, ChordQuality } from '@shared/types/music.types';

export interface ParsedChord {
  root: NoteName;
  bass?: NoteName;
  quality: ChordQuality;
  hasSeventh: boolean;
  hasNinth: boolean;
  extensions: string[];
  alterations: string[];
  addedTones: string[];
  suspensions: string[];
  rawSymbol: string;
}

// NUOVO: Nota con ottava specifica
export interface NoteWithOctave {
  note: NoteName;
  octave: number;
  midiNumber: number;
}

export interface ChordVoicing {
  id: string;
  label: string;
  description: string;
  leftHand: VoicingHand;
  rightHand: VoicingHand;
  fullChord: NoteName[];
  // NUOVO: note specifiche con ottave
  specificNotes: NoteWithOctave[];
  difficulty: 'easy' | 'medium' | 'hard';
  style: VoicingStyle;
}

export interface VoicingHand {
  notes: NoteName[];
  midiNumbers: number[];
  octaves: number[];
}

export type VoicingStyle =
  | 'basic' // Solo triadi
  | 'quadriads' // Accordi a 4 note (7ths, 6ths)
  | 'extensions' // Estensioni (9, 11, 13)
  | 'jazz-rootless' // Jazz rootless
  | 'drop-2' // Drop-2
  | 'drop-3' // Drop-3
  | 'shell'; // Shell voicings

export interface VoicingGeneratorOptions {
  style: VoicingStyle;
  includeRoot: boolean;
  leftHandOctave: number;
  rightHandOctave: number;
  maxStretch: number;
}

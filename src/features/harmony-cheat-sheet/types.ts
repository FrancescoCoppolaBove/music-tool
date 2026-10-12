import type { ModalFamily } from './theory';
export const GENRES = ['Jazz', 'Funk', 'Soul', 'Gospel', 'R&B', 'Nu-jazz', 'World-fusion'] as const;
export type Genre = typeof GENRES[number];
export const EMOTIONS = ['Gioia', 'Speranza', 'Serenità', 'Nostalgia', 'Malinconia', 'Sensualità', 'Mistero', 'Tensione', 'Energia', 'Sospensione', 'Contemplazione'] as const;
export type Emotion = typeof EMOTIONS[number];
export interface TaggedReference { id: string; name: string; genres: Genre[]; emotions: Emotion[]; aliases?: string[] }
export interface ScaleReference extends TaggedReference {
  family: ModalFamily | 'pentatonic' | 'blues' | 'symmetric' | 'bebop' | 'other';
  formula: string[];
  chords: string;
  sound: string;
  use: string;
  benefit: string;
  caution: string;
  recommended?: boolean;
  degree?: number;
}
export interface CompositionIdea extends TaggedReference {
  number: number;
  tonic: string;
  mode: string;
  referenceIds: string[];
  bpm: number;
  meter: string;
  progression: string;
  concept: string;
  groove: string;
  bass: string;
  keys: string;
  horns: string;
  verse: string;
  chorus: string;
  special: string;
  note: string;
}

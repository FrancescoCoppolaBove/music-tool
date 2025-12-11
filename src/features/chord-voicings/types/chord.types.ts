import { NoteName, ChordQuality } from '@shared/types/music.types';

export interface ParsedChord {
  root: NoteName;
  bass?: NoteName;
  quality: ChordQuality;
  hasSeventh: boolean;
  hasNinth: boolean;
  extensions: string[];      // ["9", "13"]
  alterations: string[];     // ["b9", "#11"]
  addedTones: string[];      // ["add9"]
  suspensions: string[];     // ["sus4"]
  rawSymbol: string;
}

export interface ChordVoicing {
  id: string;
  label: string;
  description: string;
  leftHand: VoicingHand;
  rightHand: VoicingHand;
  fullChord: NoteName[];
  difficulty: 'easy' | 'medium' | 'hard';
  style: VoicingStyle;
}

export interface VoicingHand {
  notes: NoteName[];
  midiNumbers: number[];
  octaves: number[];
}

export type VoicingStyle = 
  | 'basic'
  | 'jazz-rootless'
  | 'drop-2'
  | 'drop-3'
  | 'shell'
  | 'spread'
  | 'close'
  | 'ai-generated';

export interface VoicingGeneratorOptions {
  style: VoicingStyle;
  includeRoot: boolean;
  leftHandOctave: number;
  rightHandOctave: number;
  maxStretch: number; // semitoni massimi tra note adiacenti nella stessa mano
}
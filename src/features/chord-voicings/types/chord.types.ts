export interface ParsedChord {
  root: string;
  chordType: string;       // key into CHORD_FORMULAS
  bassNote?: string;       // for slash chords like C/E
  displayName: string;     // e.g. "Cmaj7", "Dm7b5"
  notes: string[];         // chord tones
}

export type VoicingStyle =
  | 'closed'
  | 'drop2'
  | 'drop3'
  | 'shell'
  | 'rootless'
  | 'open'
  | 'quartal'
  | 'spread'
  | 'upperStructure';

export interface VoicingNote {
  midi: number;
  note: string;
  octave: number;
  isRoot: boolean;
  interval: string;    // e.g. "R", "3", "5", "7", "9"
}

export interface Voicing {
  id: string;
  style: VoicingStyle;
  styleLabel: string;
  notes: VoicingNote[];
  description: string;
  tip?: string;       // performance tip or musical context
}

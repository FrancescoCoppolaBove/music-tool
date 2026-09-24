// src/features/melody-harmonizer/types.ts

export type Technique = 'four-way-close' | '3-horn';

export type ThreeHornSubTechnique =
  | 'spread'
  | 'triads'
  | 'quartal'
  | 'open-fifths'
  | 'incomplete-4part';

export type NoteRole = 'target' | 'approach';

export interface MelodyNote {
  id: string;            // stable React key
  note: string;          // e.g. 'G', 'F#', 'Bb'
  chord: string;         // e.g. 'Ebmaj7', 'Bbm7'
  manualRole?: NoteRole; // undefined = auto-detect
}

export interface HarmonizedSlot {
  leadNote: string;       // original melody note name
  chord: string;
  role: NoteRole;         // resolved (auto or manual)
  voices: string[];       // [lead, v2, v3?, v4?] — note names without octave
  voiceLabels: string[];  // ['', '3rd', '7th', '5th'] — first entry is always ''
}

export interface HarmonizationResult {
  technique: Technique;
  subTechnique?: ThreeHornSubTechnique;
  slots: HarmonizedSlot[];
  voiceNames: string[];   // e.g. ['Lead', 'Voice 2', 'Voice 3', 'Voice 4']
}

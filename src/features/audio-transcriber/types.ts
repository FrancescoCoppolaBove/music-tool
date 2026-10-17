// src/features/audio-transcriber/types.ts

export type InstrumentKind = 'bass' | 'voice' | 'winds' | 'keyboard' | 'guitar';

export interface NoteEvent {
  id: string;
  midi: number;          // pitch MIDI intero
  cents: number;         // deviazione media dal temperamento, -50..+50
  startSec: number;      // tempo raw rilevato
  durationSec: number;
  velocity: number;      // 0..1 stimata dall'energia
  startBeat?: number;    // posizione in beat dal downbeat (dopo quantizzazione)
  durationBeats?: number;
  chordId?: string;      // gruppo accordo di appartenenza
}

export interface ChordEvent {
  id: string;
  noteIds: string[];
  symbol: string;        // es. "Cmaj7"
  voicing: string;       // es. "drop 2, 1° rivolto"
  startSec: number;
}

export interface TranscriptionResult {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;    // null se confidence sotto soglia
  bpmConfidence: number;
  beatOffsetSec: number; // offset del primo beat (per ri-quantizzare)
  key: string | null;    // "C major", "B minor"
  timeSignature: string; // default "4/4"
}

export interface InstrumentConfig {
  poly: boolean;
  minF0: number;   // Hz
  maxF0: number;   // Hz
  windowSize: number;
}

export const INSTRUMENT_CONFIG: Record<InstrumentKind, InstrumentConfig> = {
  bass:     { poly: false, minF0: 30,   maxF0: 400,  windowSize: 4096 },
  voice:    { poly: false, minF0: 65,   maxF0: 1200, windowSize: 2048 },
  winds:    { poly: false, minF0: 100,  maxF0: 2000, windowSize: 2048 },
  keyboard: { poly: true,  minF0: 27.5, maxF0: 2000, windowSize: 8192 },
  guitar:   { poly: true,  minF0: 73,   maxF0: 1320, windowSize: 8192 },
};

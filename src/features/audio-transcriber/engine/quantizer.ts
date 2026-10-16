// src/features/audio-transcriber/engine/quantizer.ts
// Snap di start/durata alla suddivisione più vicina tra sedicesimi (1/4 di beat)
// e terzine di croma (1/6 di beat). Muta i NoteEvent settando startBeat/durationBeats.

import type { NoteEvent } from '../types';

const GRIDS = [1 / 4, 1 / 6];

function snap(beats: number): number {
  let best = beats, err = Infinity;
  for (const g of GRIDS) {
    const s = Math.round(beats / g) * g;
    const e = Math.abs(s - beats);
    if (e < err) { err = e; best = s; }
  }
  return best;
}

export function quantizeNotes(notes: NoteEvent[], bpm: number, beatOffsetSec: number): void {
  const beatDur = 60 / bpm;
  for (const n of notes) {
    n.startBeat = snap(Math.max(0, (n.startSec - beatOffsetSec) / beatDur));
    const db = snap(n.durationSec / beatDur);
    n.durationBeats = db > 0 ? db : GRIDS[0];
  }
}

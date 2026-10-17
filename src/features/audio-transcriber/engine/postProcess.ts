// src/features/audio-transcriber/engine/postProcess.ts
// Pulizia dell'output monofonico: rumore a bassa energia, artefatti d'attacco
// (slide/pluck che il pitch tracker spezza in frammenti cromatici), duplicati
// creati dallo snap agli onset, e monofonia stretta (mai due note sovrapposte).

import type { NoteEvent } from '../types';

const MIN_VELOCITY = 0.02;      // sotto: rumore di fondo pitch-tracciato
const ARTIFACT_MAX_DUR = 0.12;  // frammento sospetto se più corto di 120ms…
const ARTIFACT_MAX_GAP = 0.05;  // …e attaccato (<50ms) alla nota successiva
const SAME_START_TOL = 0.015;   // attacchi coincidenti dopo onset snap
const MIN_DUR = 0.05;

export function cleanMonoNotes(notes: NoteEvent[]): NoteEvent[] {
  let out = notes
    .filter(n => n.velocity >= MIN_VELOCITY)
    .sort((a, b) => a.startSec - b.startSec);

  // Artefatti di slide/attacco: frammento breve incollato a una nota più
  // lunga di altezza diversa → è la coda del glissando, non una nota.
  const slideDrop = new Set<string>();
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i];
    const b = out[i + 1];
    const gap = b.startSec - (a.startSec + a.durationSec);
    if (
      a.durationSec <= ARTIFACT_MAX_DUR &&
      gap <= ARTIFACT_MAX_GAP &&
      b.durationSec >= a.durationSec * 1.5 &&
      a.midi !== b.midi
    ) {
      slideDrop.add(a.id);
    }
  }
  out = out.filter(n => !slideDrop.has(n.id));

  // Attacchi coincidenti (lo snap può agganciare due note allo stesso onset):
  // su uno strumento mono può suonarne una sola — tieni la più lunga.
  const dupDrop = new Set<string>();
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i];
    const b = out[i + 1];
    if (dupDrop.has(a.id)) continue;
    if (Math.abs(a.startSec - b.startSec) <= SAME_START_TOL) {
      dupDrop.add((a.durationSec >= b.durationSec ? b : a).id);
    }
  }
  out = out.filter(n => !dupDrop.has(n.id));

  // Monofonia stretta: tronca ogni nota all'attacco della successiva.
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i];
    const b = out[i + 1];
    if (a.startSec + a.durationSec > b.startSec) {
      a.durationSec = Math.max(MIN_DUR, b.startSec - a.startSec);
    }
  }
  return out;
}

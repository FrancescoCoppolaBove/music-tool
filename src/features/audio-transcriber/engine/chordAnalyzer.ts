// src/features/audio-transcriber/engine/chordAnalyzer.ts
// Raggruppa note temporalmente sovrapposte (>50% della durata più corta),
// risolve il simbolo con tonal e descrive il voicing: spacing (close/open/
// drop 2/drop 3) + rivolto dal pitch class del basso.

import { Chord, Note } from 'tonal';
import type { ChordEvent, NoteEvent } from '../types';

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const OVERLAP_MIN = 0.5;

function overlapRatio(group: NoteEvent[], n: NoteEvent): number {
  const gs = Math.min(...group.map(x => x.startSec));
  const ge = Math.max(...group.map(x => x.startSec + x.durationSec));
  const s = Math.max(gs, n.startSec);
  const e = Math.min(ge, n.startSec + n.durationSec);
  const ov = Math.max(0, e - s);
  return ov / Math.min(ge - gs, n.durationSec);
}

/**
 * Rango di drop: se rialzando di un'ottava la nota più grave il set risultante
 * è in posizione stretta e la nota rialzata è la k-esima voce dall'alto → drop k+1.
 * Ritorna 1 per drop 2, 2 per drop 3, -1 altrimenti.
 */
function dropRank(pitches: number[]): number {
  if (pitches.length < 4) return -1;
  const raised = pitches[0] + 12;
  const rest = pitches.slice(1);
  if (raised > rest[rest.length - 1]) return -1;
  const merged = [...rest, raised].sort((a, b) => a - b);
  if (merged[merged.length - 1] - merged[0] > 12) return -1;
  const above = merged.filter(p => p > raised).length;
  return above === 1 || above === 2 ? above : -1;
}

function describeVoicing(pitches: number[], symbol: string): string {
  const parts: string[] = [];

  const rank = dropRank(pitches);
  if (rank === 1) parts.push('drop 2');
  else if (rank === 2) parts.push('drop 3');
  else {
    const span = pitches[pitches.length - 1] - pitches[0];
    parts.push(span <= 12 ? 'close position' : 'open position');
  }

  const info = Chord.get(symbol);
  if (info.tonic) {
    const rootPc = Note.chroma(info.tonic);
    const bassPc = ((pitches[0] % 12) + 12) % 12;
    if (rootPc === bassPc) {
      parts.push('fondamentale');
    } else {
      const idx = info.notes.findIndex(nn => Note.chroma(nn) === bassPc);
      if (idx > 0) parts.push(`${idx}° rivolto`);
    }
  }
  return parts.join(', ');
}

export function analyzeChords(notes: NoteEvent[]): ChordEvent[] {
  const sorted = [...notes].sort((a, b) => a.startSec - b.startSec);
  const groups: NoteEvent[][] = [];
  for (const n of sorted) {
    const g = groups[groups.length - 1];
    if (g && overlapRatio(g, n) > OVERLAP_MIN) g.push(n);
    else groups.push([n]);
  }

  const chords: ChordEvent[] = [];
  for (const g of groups) {
    const pitches = [...new Set(g.map(x => x.midi))].sort((a, b) => a - b);
    if (pitches.length < 3) continue;

    const orderedPcs: string[] = [];
    for (const p of pitches) {
      const name = NOTE_NAMES[((p % 12) + 12) % 12];
      if (!orderedPcs.includes(name)) orderedPcs.push(name);
    }
    if (orderedPcs.length < 3) continue;

    const detected = Chord.detect(orderedPcs);
    if (detected.length === 0) continue;
    const symbol = detected[0];

    const id = Math.random().toString(36).slice(2);
    for (const x of g) x.chordId = id;
    chords.push({
      id,
      noteIds: g.map(x => x.id),
      symbol,
      voicing: describeVoicing(pitches, symbol),
      startSec: Math.min(...g.map(x => x.startSec)),
    });
  }
  return chords;
}

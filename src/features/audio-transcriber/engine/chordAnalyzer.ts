// src/features/audio-transcriber/engine/chordAnalyzer.ts
// Raggruppa note temporalmente sovrapposte (>50% della durata più corta),
// risolve il simbolo con tonal e descrive il voicing: spacing (close/open/
// drop 2/drop 3) + rivolto dal pitch class del basso.

import { Chord, Note } from 'tonal';
import type { ChordEvent, NoteEvent } from '../types';

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MIN_CHORD_SECONDS = 0.08;

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

  const info = Chord.get(symbol.split('/')[0]);
  if (info.tonic) {
    const rootPc = Note.chroma(info.tonic);
    const bassPc = ((pitches[0] % 12) + 12) % 12;
    if (rootPc === bassPc) {
      parts.push('root position');
    } else {
      const idx = info.notes.findIndex(nn => Note.chroma(nn) === bassPc);
      if (idx > 0) parts.push((['', '1st', '2nd', '3rd'][idx] ?? idx + 'th') + ' inversion');
    }
  }
  return parts.join(', ');
}

function pitchClassSignature(pitches: number[]): string {
  return [...new Set(pitches.map(p => ((p % 12) + 12) % 12))].sort((a, b) => a - b).join(',');
}

export function analyzeChords(notes: NoteEvent[]): ChordEvent[] {
  // Segment by notes actually sounding together. Union-of-overlap clustering
  // incorrectly turns a pedal note plus a melody into one enormous chord.
  for (const note of notes) delete note.chordId;
  const events = notes.filter(n => Number.isFinite(n.startSec + n.durationSec) && n.durationSec > 0)
    .flatMap(note => [{ time: note.startSec, note, on: true },
      { time: note.startSec + note.durationSec, note, on: false }])
    .sort((a, b) => a.time - b.time || Number(a.on) - Number(b.on));
  const active = new Map<string, NoteEvent>();
  const segments: { start: number; end: number; notes: NoteEvent[]; pitches: number[] }[] = [];
  for (let i = 0; i < events.length;) {
    const time = events[i].time;
    while (i < events.length && events[i].time === time) {
      const event = events[i++];
      if (event.on) active.set(event.note.id, event.note); else active.delete(event.note.id);
    }
    if (i === events.length) break;
    const pitches = [...new Set([...active.values()].map(n => n.midi))].sort((a, b) => a - b);
    if (new Set(pitches.map(p => p % 12)).size < 3) continue;
    const previous = segments[segments.length - 1];
    if (previous && previous.end === time &&
        pitchClassSignature(previous.pitches) === pitchClassSignature(pitches) &&
        previous.notes.some(n => active.has(n.id))) {
      previous.end = events[i].time;
      previous.pitches = [...new Set([...previous.pitches, ...pitches])].sort((a, b) => a - b);
      for (const note of active.values()) if (!previous.notes.includes(note)) previous.notes.push(note);
    } else {
      segments.push({ start: time, end: events[i].time, notes: [...active.values()], pitches });
    }
  }
  const chords: ChordEvent[] = [];
  const memberships = new Map<string, { duration: number; chordId: string }>();
  for (const segment of segments) {
    const { pitches } = segment;
    if (segment.end - segment.start < MIN_CHORD_SECONDS) continue;
    const orderedPcs: string[] = [];
    for (const p of pitches) {
      const name = NOTE_NAMES[((p % 12) + 12) % 12];
      if (!orderedPcs.includes(name)) orderedPcs.push(name);
    }
    if (orderedPcs.length < 3) continue;

    const detected = Chord.detect(orderedPcs);
    if (detected.length === 0) continue;
    // Tonal may rank Em#5 ahead of C/E. Prefer familiar chord families while
    // retaining bass order (and therefore inversions) in the detected symbol.
    const commonTypes = ['major', 'minor', 'major seventh', 'minor seventh', 'dominant seventh',
      'diminished', 'half-diminished', 'diminished seventh', 'minor/major seventh', 'augmented'];
    const symbol = [...detected].sort((a, b) => {
      const rank = (s: string) => {
        const index = commonTypes.indexOf(Chord.get(s.split('/')[0]).type);
        return index < 0 ? 50 : index;
      };
      return rank(a) - rank(b);
    })[0];

    const id = 'chord-' + chords.length;
    for (const note of segment.notes) {
      const duration = Math.min(segment.end, note.startSec + note.durationSec) - Math.max(segment.start, note.startSec);
      if (duration > (memberships.get(note.id)?.duration ?? 0)) memberships.set(note.id, { duration, chordId: id });
    }
    chords.push({
      id,
      noteIds: segment.notes.map(x => x.id),
      symbol,
      voicing: describeVoicing(pitches, symbol),
      startSec: segment.start,
      durationSec: segment.end - segment.start,
    });
  }
  for (const note of notes) note.chordId = memberships.get(note.id)?.chordId;
  return chords;
}

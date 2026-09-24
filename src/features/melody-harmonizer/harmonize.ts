// src/features/melody-harmonizer/harmonize.ts

import { Chord, Note } from 'tonal';
import type {
  MelodyNote, NoteRole, Technique, ThreeHornSubTechnique,
  HarmonizedSlot, HarmonizationResult,
} from './types';

// ─── MIDI helpers ─────────────────────────────────────────────────────────────

// Parse note name (with or without octave) to MIDI, defaulting to octave 4.
// Accepts: 'G', 'G4', 'Bb', 'Bb5', 'F#'
function noteNameToMidi(note: string): number {
  const trimmed = note.trim();
  const hasOctave = /\d$/.test(trimmed);
  const withOctave = hasOctave ? trimmed : `${trimmed}4`;
  return Note.midi(withOctave) ?? 60;
}

// Highest MIDI note with the given pitch class (0–11) that is strictly below `below`.
// midiBelow(3, 67) → 63 (Eb4 below G4=67)
// midiBelow(7, 67) → 55 (G3 below G4=67, same PC must step down an octave)
function midiBelow(pc: number, below: number): number {
  const octave = Math.floor(below / 12);
  const candidate = pc + octave * 12;
  return candidate < below ? candidate : candidate - 12;
}

// Convert MIDI to note name without octave, preferring flats.
// Note.fromMidi already returns flats (Db4, Bb3, etc.) — strip the trailing digit.
function midiToName(midi: number): string {
  return Note.fromMidi(midi).replace(/\d+$/, '');
}

// Pitch classes [0–11] of all chord tones, in chord-tone order (root, 3rd, 5th, 7th…).
// Falls back to dom7 PCs [0,4,7,10] if tonal can't parse the symbol.
function getChordPCs(chordSymbol: string): number[] {
  const chord = Chord.get(chordSymbol);
  if (!chord.notes || chord.notes.length === 0) return [0, 4, 7, 10];
  return chord.notes
    .map(n => Note.get(n).chroma)
    .filter((c): c is number => c !== undefined);
}

// Label a MIDI note as its interval role within a chord ('root', '3rd', '5th', '7th', 'tension').
function intervalLabel(midi: number, chordSymbol: string): string {
  const chord = Chord.get(chordSymbol);
  if (!chord.notes) return '';
  const NAMES = ['root', '3rd', '5th', '7th', '9th', '11th', '13th'];
  const pc = midi % 12;
  const idx = chord.notes.findIndex(n => Note.get(n).chroma === pc);
  return idx >= 0 ? (NAMES[idx] ?? `ext${idx}`) : 'tension';
}

// ─── Role detection ───────────────────────────────────────────────────────────

// Returns a NoteRole per input note.
// Rules (in priority order):
//   1. n.manualRole overrides everything
//   2. Last note in sequence is always 'target'
//   3. If |currentMidi − nextMidi| ≤ 2 semitones → 'approach'
//   4. Otherwise → 'target'
export function detectRoles(notes: MelodyNote[]): NoteRole[] {
  return notes.map((n, i) => {
    if (n.manualRole) return n.manualRole;
    if (i === notes.length - 1) return 'target';
    const cur  = noteNameToMidi(n.note);
    const next = noteNameToMidi(notes[i + 1].note);
    return Math.abs(cur - next) <= 2 ? 'approach' : 'target';
  });
}

// ─── Four-Way Close ───────────────────────────────────────────────────────────

// Greedy descent: collect `count` chord-tone MIDI notes strictly below `from`.
function descend(from: number, count: number, pcs: number[]): number[] {
  const result: number[] = [];
  let cursor = from;
  while (result.length < count) {
    const candidates = pcs.map(pc => midiBelow(pc, cursor));
    const next = Math.max(...candidates);
    result.push(next);
    cursor = next;
  }
  return result;
}

// Returns the 3 inner-voice MIDI notes below the lead for a target note.
// Handles two edge cases:
//   (a) minor 2nd between lead and V2 → skip V2, restart descent from V2
//   (b) tension lead (non-chord-tone) causing missing 3rd or 7th → same skip
function fourWayCloseVoices(leadMidi: number, chordSymbol: string): number[] {
  const pcs = getChordPCs(chordSymbol);
  const standard = descend(leadMidi, 3, pcs);
  if (standard.length < 3) return standard;

  const [v2, v3, v4] = standard;

  // (a) Minor 2nd between lead and V2
  if (leadMidi - v2 === 1) {
    return descend(v2, 3, pcs);
  }

  // (b) Tension lead: check 3rd and 7th are present among V2/V3/V4
  const leadIsChordTone = pcs.includes(leadMidi % 12);
  if (!leadIsChordTone && pcs.length >= 4) {
    const thirdPC   = pcs[1];
    const seventhPC = pcs[3];
    const voicePCs  = [v2, v3, v4].map(m => m % 12);
    if (!voicePCs.includes(thirdPC) || !voicePCs.includes(seventhPC)) {
      return descend(v2, 3, pcs);
    }
  }

  return [v2, v3, v4];
}

// Approach voices: each inner voice moves one chromatic half-step below its target.
// targetVoices = [leadMidi, v2, v3, v4?] of the NEXT target slot.
function fourWayCloseApproach(targetVoices: number[]): number[] {
  return targetVoices.slice(1).map(v => v - 1);
}

// ─── 3-Horn Writing ───────────────────────────────────────────────────────────

// Returns [v2Midi, v3Midi] for a given lead + chord + sub-technique.
function threeHornVoices(
  leadMidi: number,
  chordSymbol: string,
  sub: ThreeHornSubTechnique,
): number[] {
  const pcs     = getChordPCs(chordSymbol);
  const rootPC  = pcs[0] ?? 0;
  const thirdPC = pcs[1] ?? (rootPC + 4) % 12;
  const sevPC   = pcs[3] ?? (rootPC + 10) % 12;

  switch (sub) {
    case 'spread': {
      // Guide tone (7th preferred, fallback 3rd) closest below lead.
      // Root at least a P4 (5 semitones) below guide tone for the wide spread.
      const guidePC = pcs.length >= 4 ? sevPC : thirdPC;
      const v2 = midiBelow(guidePC, leadMidi);
      let   v3 = midiBelow(rootPC, v2);
      while (v2 - v3 < 5) v3 -= 12;
      return [v2, v3];
    }

    case 'triads': {
      // Stack root–3rd below lead.
      const v2 = midiBelow(thirdPC, leadMidi);
      const v3 = midiBelow(rootPC, v2);
      return [v2, v3];
    }

    case 'quartal': {
      // Perfect 4ths (5 semitones) stacked below lead.
      return [leadMidi - 5, leadMidi - 10];
    }

    case 'open-fifths': {
      // V2 = P5 below lead (inner harmony), V3 = octave below lead (strong foundation).
      return [leadMidi - 7, leadMidi - 12];
    }

    case 'incomplete-4part': {
      // Four-Way Close shape but only V2 and V3 (omit V4).
      return fourWayCloseVoices(leadMidi, chordSymbol).slice(0, 2);
    }

    default:
      return [leadMidi - 4, leadMidi - 7];
  }
}

// ─── Voice names ──────────────────────────────────────────────────────────────

function resolveVoiceNames(technique: Technique, sub?: ThreeHornSubTechnique): string[] {
  if (technique === 'four-way-close') {
    return ['Lead', 'Voice 2', 'Voice 3', 'Voice 4'];
  }
  if (sub === 'open-fifths') return ['Lead (Tpt)', 'Harmony (P5)', 'Bass Octave'];
  return ['Lead (Tpt)', 'Alto Sax', 'Trombone'];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function harmonize(
  notes: MelodyNote[],
  technique: Technique,
  sub?: ThreeHornSubTechnique,
): HarmonizationResult {
  const roles = detectRoles(notes);

  // First pass: compute target-slot voice MIDI arrays, keyed by index
  const targetMidiMap = new Map<number, number[]>(); // index → [leadMidi, v2, v3, v4?]

  notes.forEach((n, i) => {
    if (roles[i] !== 'target') return;
    const leadMidi = noteNameToMidi(n.note);
    const inner =
      technique === 'four-way-close'
        ? fourWayCloseVoices(leadMidi, n.chord)
        : threeHornVoices(leadMidi, n.chord, sub ?? 'spread');
    targetMidiMap.set(i, [leadMidi, ...inner]);
  });

  // Second pass: build all slots (approach notes reference next target's voices)
  const slots: HarmonizedSlot[] = notes.map((n, i) => {
    const role     = roles[i];
    const leadMidi = noteNameToMidi(n.note);

    let allMidi: number[];

    if (role === 'target') {
      allMidi = targetMidiMap.get(i) ?? [leadMidi];
    } else {
      // Find the nearest next target
      let nextIdx = i + 1;
      while (nextIdx < notes.length && roles[nextIdx] === 'approach') nextIdx++;
      const targetMidi = targetMidiMap.get(nextIdx) ?? [leadMidi + 2, leadMidi - 3, leadMidi - 7, leadMidi - 11];
      const approachInner =
        technique === 'four-way-close'
          ? fourWayCloseApproach(targetMidi)
          : targetMidi.slice(1).map(v => v - 1);
      allMidi = [leadMidi, ...approachInner];
    }

    return {
      leadNote: n.note,
      chord:    n.chord,
      role,
      voices:      allMidi.map(midiToName),
      voiceLabels: allMidi.map((m, vi) => vi === 0 ? '' : intervalLabel(m, n.chord)),
    };
  });

  return {
    technique,
    subTechnique: technique === '3-horn' ? (sub ?? 'spread') : undefined,
    slots,
    voiceNames: resolveVoiceNames(technique, sub),
  };
}

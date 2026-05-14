import {
  noteToMidi,
  notePreferFlat,
  CHORD_FORMULAS,
} from '@shared/utils/musicTheory';
import type { ParsedChord, Voicing, VoicingNote, VoicingStyle } from '../types/chord.types';

// Interval labels from semitone offset
const INTERVAL_LABELS: Record<number, string> = {
  0: 'R', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '4/11',
  6: '♭5/♯11', 7: '5', 8: '♯5', 9: '6/13', 10: '♭7', 11: '7',
  12: 'R', 13: '♭9', 14: '9', 15: '♯9', 16: '3', 17: '11',
  18: '♯11', 19: '5', 20: '♭13', 21: '13',
};

function intervalLabel(semitones: number): string {
  return INTERVAL_LABELS[((semitones % 24) + 24) % 24] ?? String(semitones);
}

function buildVoicingNote(midi: number, rootMidi: number, preferFlat: boolean): VoicingNote {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const note = preferFlat
    ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][semitone]
    : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][semitone];
  const intervalSemitones = ((midi - rootMidi) % 24 + 24) % 24;
  return {
    midi,
    note,
    octave,
    isRoot: semitone === ((rootMidi % 12 + 12) % 12),
    interval: intervalLabel(intervalSemitones),
  };
}

function toVoicingNotes(midis: number[], rootMidi: number, preferFlat: boolean): VoicingNote[] {
  return midis
    .filter(m => m >= 28 && m <= 96)
    .sort((a, b) => a - b)
    .map(m => buildVoicingNote(m, rootMidi, preferFlat));
}

// ─── Voicing Style Generators ────────────────────────────────────────────────

function closedVoicing(intervals: number[], rootMidi: number): number[] {
  return intervals.map(i => {
    const normalized = ((i % 12) + 12) % 12;
    return rootMidi + normalized;
  }).sort((a, b) => a - b);
}

function drop2(closedAscending: number[]): number[] {
  if (closedAscending.length < 3) return closedAscending;
  const raised = closedAscending.map(m => m + 12);
  const sorted = [...raised].sort((a, b) => b - a);
  sorted[1] -= 12;
  return sorted.sort((a, b) => a - b);
}

function drop3(closedAscending: number[]): number[] {
  if (closedAscending.length < 4) return drop2(closedAscending);
  const raised = closedAscending.map(m => m + 12);
  const sorted = [...raised].sort((a, b) => b - a);
  sorted[2] -= 12;
  return sorted.sort((a, b) => a - b);
}

function shellVoicing(intervals: number[], rootMidi: number): number[] {
  const candidates = [0, 1, 3];
  const selected: number[] = [];
  for (const idx of candidates) {
    if (intervals[idx] !== undefined) selected.push(intervals[idx]);
  }
  if (selected.length < 2 && intervals.length >= 2) {
    selected.length = 0;
    selected.push(intervals[0], intervals[1]);
  }
  return selected.map(i => rootMidi + ((i % 12) + 12) % 12).sort((a, b) => a - b);
}

function rootlessVoicing(intervals: number[], rootMidi: number): number[] {
  const nonRoot = intervals.filter(i => (i % 12) !== 0).slice(0, 5);
  if (nonRoot.length === 0) return [rootMidi + (intervals[1] ?? 4)];
  const base = rootMidi + ((nonRoot[0] % 12) + 12) % 12;
  return nonRoot.map((i, idx) => {
    const semis = ((i % 12) + 12) % 12;
    let m = base + semis - ((base % 12 + 12) % 12);
    if (m < base) m += 12;
    if (idx > 0 && m <= base + (nonRoot[idx - 1] % 12)) m += 12;
    return m;
  }).sort((a, b) => a - b);
}

function openVoicing(intervals: number[], rootMidi: number): number[] {
  if (intervals.length < 4) {
    return [
      rootMidi + intervals[0],
      rootMidi + 12 + intervals[1],
      rootMidi + 12 + (intervals[2] ?? intervals[1]),
    ].sort((a, b) => a - b);
  }
  const [, third, fifth, seventh] = intervals;
  return [
    rootMidi + intervals[0],
    rootMidi + fifth,
    rootMidi + 12 + ((third % 12 + 12) % 12),
    rootMidi + 12 + ((seventh % 12 + 12) % 12),
  ].sort((a, b) => a - b);
}

function quartalVoicing(rootMidi: number, count = 4): number[] {
  return Array.from({ length: count }, (_, i) => rootMidi + i * 5);
}

function spreadVoicing(intervals: number[], rootMidi: number): number[] {
  return intervals.slice(0, 5).map((interval, idx) => {
    const semis = ((interval % 12) + 12) % 12;
    const octaveOffset = Math.floor(idx / 2) * 12;
    return rootMidi + semis + octaveOffset;
  }).sort((a, b) => a - b);
}

function upperStructureTriad(intervals: number[], rootMidi: number): number[] {
  const shell = shellVoicing(intervals, rootMidi);
  const ninthMidi = rootMidi + 14;
  return [
    ...shell,
    ninthMidi,
    ninthMidi + 4,
    ninthMidi + 7,
  ].sort((a, b) => a - b);
}

// ─── Inversion Helpers ───────────────────────────────────────────────────────

function invert(closedMidis: number[], n: number): number[] {
  const sorted = [...closedMidis].sort((a, b) => a - b);
  for (let i = 0; i < n; i++) {
    const lowest = sorted.shift()!;
    sorted.push(lowest + 12);
  }
  return sorted;
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export function generateVoicings(chord: ParsedChord): Voicing[] {
  const formula = CHORD_FORMULAS[chord.chordType];
  if (!formula) return [];

  const { root } = chord;
  const preferFlat = notePreferFlat(root);
  const rootMidi = noteToMidi(root, 3);
  const intervals = formula.intervals;

  const voicings: Voicing[] = [];
  let id = 0;

  function addVoicing(style: VoicingStyle, styleLabel: string, midis: number[], description: string, tip?: string) {
    const filtered = midis.filter(m => m >= 28 && m <= 96);
    if (filtered.length === 0) return;
    voicings.push({
      id: String(id++),
      style,
      styleLabel,
      notes: toVoicingNotes(filtered, rootMidi, preferFlat),
      description,
      tip,
    });
  }

  // ── Closed position & inversions
  const closed = closedVoicing(intervals, rootMidi);
  addVoicing('closed', 'Closed — Root Position', closed,
    `All tones stacked within one octave from ${root}.`,
    'Best for clear harmonic definition. Works well in mid-register (C3–C4).'
  );

  const numInversions = Math.min(closed.length - 1, 3);
  const inversionNames = ['1st', '2nd', '3rd'];
  const inversionNoteNames = ['third', 'fifth', 'seventh'];
  for (let i = 1; i <= numInversions; i++) {
    const inverted = invert(closed, i);
    addVoicing('closed', `Closed — ${inversionNames[i - 1]} Inversion`,
      inverted,
      `${inversionNames[i - 1]} inversion: ${inversionNoteNames[i - 1]} in the bass.`,
      i === 1 ? 'Great for smooth bass line voice leading.' : undefined
    );
  }

  // ── Drop 2
  if (intervals.length >= 3) {
    const d2 = drop2(closed);
    addVoicing('drop2', 'Drop 2', d2,
      'Classic jazz/big-band voicing. 2nd-highest note dropped an octave, creating an open spread.',
      'Signature sound of jazz guitar and piano comping. Very idiomatic for dominant chords.'
    );
    const d2inv1 = invert(d2, 1);
    addVoicing('drop2', 'Drop 2 — 1st Inversion', d2inv1, 'Drop 2 with third in bass.');
    if (intervals.length >= 4) {
      const d2inv2 = invert(d2, 2);
      addVoicing('drop2', 'Drop 2 — 2nd Inversion', d2inv2, 'Drop 2 with fifth in bass.');
    }
  }

  // ── Drop 3
  if (intervals.length >= 4) {
    const d3 = drop3(closed);
    addVoicing('drop3', 'Drop 3', d3,
      '3rd-highest note dropped an octave. Wider spread than Drop 2.',
      'Creates a very open, orchestral sound. Works beautifully with sustain pedal.'
    );
    addVoicing('drop3', 'Drop 3 — 1st Inversion', invert(d3, 1), 'Drop 3 with third in bass.');
  }

  // ── Shell Voicing
  const shell = shellVoicing(intervals, rootMidi);
  addVoicing('shell', 'Shell Voicing (Root + 3rd + 7th)', shell,
    'Minimal three-note voicing: root, third, and seventh. Bill Evans trademark.',
    'Leave space for soloist or add color tones in the right hand. Essential for jazz comping.'
  );

  if (intervals.length >= 4) {
    const guideTones = intervals.filter(i => (i % 12) !== 0).slice(0, 3).map(i => rootMidi + ((i % 12) + 12) % 12).sort((a, b) => a - b);
    if (guideTones.length > 0) {
      addVoicing('shell', 'Shell — 3rd & 7th Only (Guide Tones)', guideTones,
        'Just guide tones (3rd + 7th). Maximum space for the bass player.',
        'The 3rd defines major/minor quality; the 7th defines major/dominant/minor. These two notes carry all the harmonic information.'
      );
    }
  }

  // ── Rootless Voicing
  if (intervals.length >= 3) {
    const rootless = rootlessVoicing(intervals, rootMidi);
    if (rootless.length > 0) {
      addVoicing('rootless', 'Rootless Voicing', rootless,
        'All color tones without the root. Sounds sophisticated when bassist plays root.',
        'In a jazz combo context, trust the bassist to hold the root and let your voicing breathe.'
      );
      addVoicing('rootless', 'Rootless — Upper Register', rootless.map(m => m + 12),
        'Rootless voicing placed in upper register, ideal for right-hand comping.',
        'Pair with a left-hand root/fifth for a full, balanced sound.'
      );
    }
  }

  // ── Open Voicing
  const open = openVoicing(intervals, rootMidi);
  addVoicing('open', 'Open Voicing', open,
    'Root + 5th in bottom, 3rd + 7th spread on top.',
    'Very resonant at low volume. Allows top voice to sing out clearly.'
  );

  if (intervals.some(i => i >= 14)) {
    const ninth = intervals.find(i => i >= 14 && i <= 15) ?? 14;
    const openExt = [...open, rootMidi + 12 + ((ninth % 12) + 12) % 12].sort((a, b) => a - b);
    addVoicing('open', 'Open Voicing + 9th', openExt, 'Open spread with 9th extension added in top voice.');
  }

  // ── Spread Voicing
  addVoicing('spread', 'Spread Voicing', spreadVoicing(intervals, rootMidi),
    'Very wide voicing across 2–3 octaves. Orchestral texture.',
    'Works beautifully with sustain pedal. Think Ravel, Debussy, and Wayne Shorter.'
  );

  // ── Quartal Voicing
  const quartalCount = Math.min(intervals.length, 4);
  addVoicing('quartal', 'Quartal Voicing', quartalVoicing(rootMidi, quartalCount),
    'Built in stacked perfect 4ths from root. No traditional thirds.',
    'Signature of McCoy Tyner, Bill Evans, Herbie Hancock, and modern jazz. Modal and open-sounding.'
  );

  if (intervals.length >= 2) {
    const thirdMidi = rootMidi + ((intervals[1] % 12) + 12) % 12;
    addVoicing('quartal', 'Quartal from 3rd', quartalVoicing(thirdMidi, quartalCount),
      'Stacked 4ths starting from the 3rd of the chord.',
      'Used in McCoy Tyner-style Dorian vamps. Creates dense, modal tension.'
    );
  }

  // ── Upper Structure Triad
  if (intervals.length >= 4) {
    addVoicing('upperStructure', 'Upper Structure Triad', upperStructureTriad(intervals, rootMidi),
      'Shell voicing in left hand + major triad built on the 9th in the right hand.',
      'Technique from Herbie Hancock, Chick Corea, and Brad Mehldau. Very modern and colorful.'
    );

    const sharpElevenMidi = rootMidi + 18;
    const ustLydian = [...shellVoicing(intervals, rootMidi), sharpElevenMidi, sharpElevenMidi + 4, sharpElevenMidi + 7].sort((a, b) => a - b);
    addVoicing('upperStructure', 'Upper Structure Triad — ♯11', ustLydian,
      'Shell + major triad on the ♯11. Produces a beautiful Lydian color.',
      'Common in ECM jazz and modern fusion. Very Herbie Hancock.'
    );
  }

  return voicings;
}

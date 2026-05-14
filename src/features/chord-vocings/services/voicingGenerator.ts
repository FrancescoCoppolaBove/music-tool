import {
  noteToMidi,
  notePreferFlat,
  CHORD_FORMULAS,
} from '@shared/utils/musicTheory';
import type { ParsedChord, Voicing, VoicingNote, VoicingStyle } from '../types/chord.types';

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
    .filter(m => m >= 36 && m <= 96)  // C2 to C7
    .sort((a, b) => a - b)
    .map(m => buildVoicingNote(m, rootMidi, preferFlat));
}

// ─── Voicing Style Generators ────────────────────────────────────────────────

// All notes within one octave above root, sorted ascending
function closedVoicing(intervals: number[], rootMidi: number): number[] {
  return intervals
    .map(i => rootMidi + ((i % 12) + 12) % 12)
    .sort((a, b) => a - b);
}

// Drop 2: take 4-voice closed position, raise all by an octave, drop 2nd from top
function drop2(midis: number[]): number[] {
  if (midis.length < 3) return midis;
  const raised = midis.map(m => m + 12).sort((a, b) => b - a);
  raised[1] -= 12;
  return raised.sort((a, b) => a - b);
}

// Drop 3: raise all by octave, drop 3rd from top
function drop3(midis: number[]): number[] {
  if (midis.length < 4) return drop2(midis);
  const raised = midis.map(m => m + 12).sort((a, b) => b - a);
  raised[2] -= 12;
  return raised.sort((a, b) => a - b);
}

// Shell: root + 3rd + 7th (essential guide tones)
function shellVoicing(intervals: number[], rootMidi: number): number[] {
  // Pick root (0), third (index 1), seventh (last or index 3)
  const root = rootMidi;
  const third = intervals.length > 1 ? rootMidi + ((intervals[1] % 12) + 12) % 12 : rootMidi + 4;
  const seventh = intervals.length >= 4
    ? rootMidi + ((intervals[3] % 12) + 12) % 12
    : rootMidi + ((intervals[intervals.length - 1] % 12) + 12) % 12;

  // Ensure ascending order
  const notes = [root, third, seventh];
  notes.sort((a, b) => a - b);
  // If third and seventh are the same pitch class, shift seventh up
  const result: number[] = [notes[0]];
  let prev = notes[0];
  for (let i = 1; i < notes.length; i++) {
    let n = notes[i];
    while (n <= prev) n += 12;
    result.push(n);
    prev = n;
  }
  return result;
}

// Rootless: all non-root tones ascending from the lowest non-root
function rootlessVoicing(intervals: number[], rootMidi: number): number[] {
  const nonRoot = intervals.filter(i => ((i % 12) + 12) % 12 !== 0);
  if (nonRoot.length === 0) return [];

  const result: number[] = [];
  let prev = rootMidi - 1;

  for (const interval of nonRoot) {
    const semis = ((interval % 12) + 12) % 12;
    let midi = rootMidi + semis;
    while (midi <= prev) midi += 12;
    result.push(midi);
    prev = midi;
  }

  return result;
}

// Open: root + 5th low, 3rd + 7th up an octave
function openVoicing(intervals: number[], rootMidi: number): number[] {
  if (intervals.length < 3) {
    return intervals.map((i, idx) => rootMidi + ((i % 12) + 12) % 12 + idx * 12).sort((a, b) => a - b);
  }
  const fifth = ((intervals[2] ?? intervals[1]) % 12 + 12) % 12;
  const third = ((intervals[1] % 12) + 12) % 12;
  const seventh = intervals.length >= 4 ? ((intervals[3] % 12) + 12) % 12 : null;

  const result = [
    rootMidi,
    rootMidi + fifth,
    rootMidi + 12 + third,
  ];
  if (seventh !== null) result.push(rootMidi + 12 + seventh);
  return result.sort((a, b) => a - b);
}

// Quartal: stacked perfect 4ths (5 semitones each)
function quartalVoicing(rootMidi: number, count = 4): number[] {
  return Array.from({ length: count }, (_, i) => rootMidi + i * 5);
}

// Spread: distribute notes across 2+ octaves ensuring ascending
function spreadVoicing(intervals: number[], rootMidi: number): number[] {
  const result: number[] = [];
  let prev = rootMidi - 1;
  intervals.slice(0, 5).forEach(interval => {
    const semis = ((interval % 12) + 12) % 12;
    let midi = rootMidi + semis;
    while (midi <= prev) midi += 12;
    // Add an extra 12 to spread out (for even indices after the first)
    if (result.length > 0 && midi - prev < 5) midi += 12;
    result.push(midi);
    prev = midi;
  });
  return result;
}

// Upper Structure Triad: shell in left + major triad on 9th in right
function upperStructureTriad(intervals: number[], rootMidi: number): number[] {
  const shell = shellVoicing(intervals, rootMidi);
  const ninthMidi = rootMidi + 14;
  return [...shell, ninthMidi, ninthMidi + 4, ninthMidi + 7].sort((a, b) => a - b);
}

// ─── Inversion Helper ────────────────────────────────────────────────────────

function invert(midis: number[], n: number): number[] {
  const sorted = [...midis].sort((a, b) => a - b);
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

  function add(style: VoicingStyle, styleLabel: string, midis: number[], description: string, tip?: string) {
    const filtered = midis.filter(m => m >= 36 && m <= 96);
    if (filtered.length === 0) return;
    // Remove duplicates (same pitch class at same octave)
    const unique = [...new Set(filtered)].sort((a, b) => a - b);
    if (unique.length === 0) return;
    voicings.push({
      id: String(id++),
      style,
      styleLabel,
      notes: toVoicingNotes(unique, rootMidi, preferFlat),
      description,
      tip,
    });
  }

  // ── Closed position & inversions ──
  const closed = closedVoicing(intervals, rootMidi);
  add('closed', 'Closed — Root Position', closed,
    `All tones stacked within one octave from ${root}.`,
    'Best for clear harmonic definition. Works well in mid-register (C3–C4).'
  );
  const numInv = Math.min(closed.length - 1, 3);
  const invNames = ['1st', '2nd', '3rd'];
  const invNoteNames = ['third', 'fifth', 'seventh'];
  for (let i = 1; i <= numInv; i++) {
    add('closed', `Closed — ${invNames[i - 1]} Inversion`,
      invert(closed, i),
      `${invNames[i - 1]} inversion: ${invNoteNames[i - 1] ?? 'upper note'} in the bass.`,
      i === 1 ? 'Great for smooth bass-line voice leading.' : undefined
    );
  }

  // ── Drop 2 ──
  if (intervals.length >= 3) {
    const d2 = drop2(closed);
    add('drop2', 'Drop 2', d2,
      'Classic jazz/big-band spread. 2nd-highest note dropped an octave.',
      'Signature sound of jazz guitar and piano comping. Very idiomatic for dominant chords.'
    );
    add('drop2', 'Drop 2 — 1st Inversion', invert(d2, 1), 'Drop 2 with third in bass.');
    if (intervals.length >= 4) {
      add('drop2', 'Drop 2 — 2nd Inversion', invert(d2, 2), 'Drop 2 with fifth in bass.');
    }
  }

  // ── Drop 3 ──
  if (intervals.length >= 4) {
    const d3 = drop3(closed);
    add('drop3', 'Drop 3', d3,
      '3rd-highest note dropped an octave. Wider spread than Drop 2.',
      'Creates a very open, orchestral sound. Works beautifully with sustain pedal.'
    );
    add('drop3', 'Drop 3 — 1st Inversion', invert(d3, 1), 'Drop 3 with third in bass.');
  }

  // ── Shell Voicing ──
  const shell = shellVoicing(intervals, rootMidi);
  add('shell', 'Shell — Root + 3rd + 7th', shell,
    'Minimal three-note voicing: root, third, and seventh. Bill Evans trademark.',
    'Leave space for soloist or add color tones in the right hand. Essential for jazz comping.'
  );
  if (intervals.length >= 4) {
    const guideTones = rootlessVoicing(intervals, rootMidi).slice(0, 2);
    if (guideTones.length === 2) {
      add('shell', 'Shell — Guide Tones Only (3rd + 7th)', guideTones,
        'Just the 3rd and 7th. Maximum space for bass player.',
        'The 3rd defines major/minor quality; the 7th defines dominant/major/minor. These carry all harmonic info.'
      );
    }
  }

  // ── Rootless ──
  if (intervals.length >= 3) {
    const rootless = rootlessVoicing(intervals, rootMidi);
    if (rootless.length > 0) {
      add('rootless', 'Rootless Voicing', rootless,
        'All color tones without the root. Sounds sophisticated when bassist plays root.',
        'In a jazz combo context, trust the bassist to hold the root and let your voicing breathe.'
      );
      add('rootless', 'Rootless — Upper Register', rootless.map(m => m + 12),
        'Rootless voicing placed in upper register, ideal for right-hand comping.',
        'Pair with a left-hand root/fifth for a full, balanced sound.'
      );
    }
  }

  // ── Open ──
  const open = openVoicing(intervals, rootMidi);
  add('open', 'Open Voicing', open,
    'Root + 5th low, 3rd + 7th spread on top.',
    'Very resonant at low volume. Allows top voice to sing out clearly.'
  );
  if (intervals.some(i => i >= 14)) {
    const ninth = ((intervals.find(i => i >= 14 && i <= 15) ?? 14) % 12 + 12) % 12;
    add('open', 'Open Voicing + 9th', [...open, rootMidi + 12 + ninth].sort((a, b) => a - b),
      'Open spread with 9th extension added in top voice.'
    );
  }

  // ── Spread ──
  add('spread', 'Spread Voicing', spreadVoicing(intervals, rootMidi),
    'Very wide voicing across 2–3 octaves. Orchestral texture.',
    'Works beautifully with sustain pedal. Think Ravel, Debussy, and Wayne Shorter.'
  );

  // ── Quartal ──
  const quartalCount = Math.min(intervals.length, 4);
  add('quartal', 'Quartal Voicing', quartalVoicing(rootMidi, quartalCount),
    'Built in stacked perfect 4ths from root. No traditional thirds.',
    'Signature of McCoy Tyner, Bill Evans, Herbie Hancock, and modern jazz. Modal and open-sounding.'
  );
  if (intervals.length >= 2) {
    const thirdMidi = rootMidi + ((intervals[1] % 12) + 12) % 12;
    add('quartal', 'Quartal from 3rd', quartalVoicing(thirdMidi, quartalCount),
      'Stacked 4ths starting from the 3rd of the chord.',
      'Used in McCoy Tyner-style Dorian vamps. Creates dense, modal tension.'
    );
  }

  // ── Upper Structure Triad ──
  if (intervals.length >= 4) {
    add('upperStructure', 'Upper Structure Triad', upperStructureTriad(intervals, rootMidi),
      'Shell voicing in left hand + major triad built on the 9th in the right hand.',
      'Technique from Herbie Hancock, Chick Corea, and Brad Mehldau. Very modern and colorful.'
    );
    const sharpElevenMidi = rootMidi + 18;
    add('upperStructure', 'Upper Structure Triad — ♯11',
      [...shellVoicing(intervals, rootMidi), sharpElevenMidi, sharpElevenMidi + 4, sharpElevenMidi + 7].sort((a, b) => a - b),
      'Shell + major triad on the ♯11. Produces a beautiful Lydian color.',
      'Common in ECM jazz and modern fusion. Very Herbie Hancock.'
    );
  }

  return voicings;
}

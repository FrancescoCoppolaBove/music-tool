// src/features/ear-training-pro/data/index.ts
import { EarModuleId, ExerciseLevel, ExamQuestion } from '../types';
import { INTERVALS, CHORD_TYPES } from '../../ear-training/utils/interval-data';

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick4(correct: string, pool: string[]): string[] {
  const wrong = shuffle(pool.filter(x => x !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// ─── Interval generators ────────────────────────────────────────────────────

const INTERVAL_HINTS: Partial<Record<string, string>> = {
  'Seconda maggiore': 'Fra Martino (prime 2 note)',
  'Terza minore':     'Greensleeves (prime 2 note)',
  'Terza maggiore':   'Oh Happy Day (prime 2 note)',
  'Quarta giusta':    'Here Comes the Bride (prime 2 note)',
  'Tritono':          'The Simpsons (prime 2 note)',
  'Quinta giusta':    'Star Wars (prime 2 note)',
  'Sesta maggiore':   'My Bonnie (prime 2 note)',
  'Settima maggiore': 'Take On Me (prime 2 note)',
  'Ottava':           'Over the Rainbow (prime 2 note)',
};

const INTERVALS_BY_LEVEL: Record<ExerciseLevel, number[]> = {
  1: [2, 3, 4, 5, 7],               // M2 m3 M3 P4 P5
  2: [1, 2, 3, 4, 5, 7, 8, 9],      // adds m2 m6 M6
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // all
};

// Root notes (MIDI): C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, Bb4=70
const ROOTS = [60, 62, 64, 65, 67, 69, 70];

function buildIntervalQuestions(level: ExerciseLevel, playMode: 'sequential' | 'simultaneous', count: number): ExamQuestion[] {
  const semiList = INTERVALS_BY_LEVEL[level];
  const allNames = semiList.map(s => {
    const found = (INTERVALS as unknown as typeof INTERVALS).find((i: any) => i.semitones === s);
    return found!.nameIT;
  });
  const questions: ExamQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const semi   = semiList[i % semiList.length];
    const root   = ROOTS[Math.floor(Math.random() * ROOTS.length)];
    const upper  = root + semi;
    const iData  = (INTERVALS as unknown as typeof INTERVALS).find((x: any) => x.semitones === semi)!;
    const correct = iData.nameIT;

    questions.push({
      id:       `${playMode}-${semi}-${root}-${i}`,
      notes:    [root, upper],
      playMode,
      gapMs:    600,
      correct,
      choices:  pick4(correct, allNames),
      hint:     INTERVAL_HINTS[correct],
    });
  }
  return shuffle(questions);
}

// ─── Chord generators ───────────────────────────────────────────────────────

const CHORD_ROOTS = [60, 62, 65, 67, 69]; // C D F G A

const TRIADS_BY_LEVEL = {
  1: ['Major', 'Minor'],
  2: ['Major', 'Minor', 'Diminished', 'Augmented'],
  3: ['Major', 'Minor', 'Diminished', 'Augmented'],
};

const INVERSIONS_BY_LEVEL: Record<ExerciseLevel, number[]> = {
  1: [0],
  2: [0, 1],
  3: [0, 1, 2],
};

function buildTriadQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  const typeNames = TRIADS_BY_LEVEL[level as 1|2|3];
  const invs      = INVERSIONS_BY_LEVEL[level];
  const allLabels = typeNames.flatMap(name => {
    const t = (CHORD_TYPES as unknown as typeof CHORD_TYPES).find((c: any) => c.name === name)!;
    return invs.map(inv => inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`);
  });

  const questions: ExamQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const typeName = typeNames[Math.floor(Math.random() * typeNames.length)];
    const t        = (CHORD_TYPES as unknown as typeof CHORD_TYPES).find((c: any) => c.name === typeName)!;
    const inv      = invs[Math.floor(Math.random() * invs.length)];
    const root     = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    const rotated  = rotateChord(t.notes.map(n => root + n), inv);
    const label    = inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`;

    questions.push({
      id:      `triad-${typeName}-${inv}-${root}-${i}`,
      notes:   rotated,
      playMode: 'simultaneous',
      correct: label,
      choices: pick4(label, allLabels),
    });
  }
  return shuffle(questions);
}

function buildSeventhQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  const seventhTypes = level === 1
    ? ['Dominant 7th']
    : level === 2
      ? ['Dominant 7th', 'Major 7th', 'Minor 7th']
      : ['Dominant 7th', 'Major 7th', 'Minor 7th', 'Half-diminished 7th'];
  const invs = INVERSIONS_BY_LEVEL[level];
  const allLabels = seventhTypes.flatMap(name => {
    const t = (CHORD_TYPES as unknown as typeof CHORD_TYPES).find((c: any) => c.name === name)!;
    return invs.map(inv => inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`);
  });

  const questions: ExamQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const typeName = seventhTypes[Math.floor(Math.random() * seventhTypes.length)];
    const t        = (CHORD_TYPES as unknown as typeof CHORD_TYPES).find((c: any) => c.name === typeName)!;
    const inv      = invs[Math.floor(Math.random() * invs.length)];
    const root     = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    const rotated  = rotateChord(t.notes.map(n => root + n), inv);
    const label    = inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`;

    questions.push({
      id:      `seventh-${typeName}-${inv}-${root}-${i}`,
      notes:   rotated,
      playMode: 'simultaneous',
      correct: label,
      choices: pick4(label, allLabels),
    });
  }
  return shuffle(questions);
}

function rotateChord(notes: number[], inversion: number): number[] {
  const arr = [...notes];
  for (let i = 0; i < inversion; i++) {
    arr.push(arr.shift()! + 12);
  }
  return arr;
}

// ─── Tonal functions ────────────────────────────────────────────────────────

const TONAL_LABELS = ['Tonica (I)', 'Sottodominante (IV)', 'Dominante (V)'];

// Simple: play a single chord, identify its function in C major
const TONAL_CHORDS: Record<string, number[]> = {
  'Tonica (I)':          [60, 64, 67],  // C major
  'Sottodominante (IV)': [65, 69, 72],  // F major
  'Dominante (V)':       [67, 71, 74],  // G major
};

function buildTonalFunctionQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  // Level 2-3: add dominant 7th and play in different keys
  const labels = level === 1 ? TONAL_LABELS : [...TONAL_LABELS, 'Dominante 7a (V7)'];
  const questions: ExamQuestion[] = [];

  const roots = level === 1 ? [0] : [0, 5, 7]; // C, F, G as tonic centers
  for (let i = 0; i < count; i++) {
    const label     = labels[Math.floor(Math.random() * labels.length)];
    const rootShift = roots[Math.floor(Math.random() * roots.length)];
    let notes       = (TONAL_CHORDS[label] ?? TONAL_CHORDS['Dominante (V)']).map(n => n + rootShift);
    if (label === 'Dominante 7a (V7)') notes = [67 + rootShift, 71 + rootShift, 74 + rootShift, 77 + rootShift];

    questions.push({
      id:      `tonal-${label}-${rootShift}-${i}`,
      notes,
      playMode: 'simultaneous',
      correct: label,
      choices: pick4(label, labels),
    });
  }
  return shuffle(questions);
}

// ─── Cadences ───────────────────────────────────────────────────────────────

// Each cadence is two chords: [chord1Notes, chord2Notes]. We play them sequentially.
const CADENCE_DEFS: Array<{ label: string; chord1: number[]; chord2: number[] }> = [
  { label: 'Cadenza autentica (V→I)',  chord1: [67, 71, 74],    chord2: [60, 64, 67] },
  { label: 'Cadenza plagale (IV→I)',   chord1: [65, 69, 72],    chord2: [60, 64, 67] },
  { label: 'Cadenza evitata (V→VI)',   chord1: [67, 71, 74],    chord2: [69, 72, 76] },
  { label: 'Semicadenza (I→V)',        chord1: [60, 64, 67],    chord2: [67, 71, 74] },
];

const CADENCE_LABELS = CADENCE_DEFS.map(c => c.label);

function buildCadenceQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  const pool = level === 1 ? CADENCE_DEFS.slice(0, 2) : CADENCE_DEFS;
  const labels = pool.map(c => c.label);
  const questions: ExamQuestion[] = [];

  // Transpose by rootShift to avoid memorisation of fixed pitch
  const shifts = [0, 2, 5, 7];
  for (let i = 0; i < count; i++) {
    const def   = pool[Math.floor(Math.random() * pool.length)];
    const shift = shifts[Math.floor(Math.random() * shifts.length)];
    // Encode two chords as one flat array separated by a sentinel (999)
    const notes = [...def.chord1.map(n => n + shift), 999, ...def.chord2.map(n => n + shift)];

    questions.push({
      id:      `cadence-${def.label}-${shift}-${i}`,
      notes,
      playMode: 'sequential', // ExamSession will handle sentinel
      gapMs:    700,
      correct:  def.label,
      choices:  pick4(def.label, CADENCE_LABELS),
    });
  }
  return shuffle(questions);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateQuestions(moduleId: EarModuleId, level: ExerciseLevel, count = 10): ExamQuestion[] {
  switch (moduleId) {
    case 'melodic-intervals':  return buildIntervalQuestions(level, 'sequential', count);
    case 'harmonic-intervals': return buildIntervalQuestions(level, 'simultaneous', count);
    case 'triads':             return buildTriadQuestions(level, count);
    case 'sevenths':           return buildSeventhQuestions(level, count);
    case 'tonal-functions':    return buildTonalFunctionQuestions(level, count);
    case 'cadences':           return buildCadenceQuestions(level, count);
  }
}

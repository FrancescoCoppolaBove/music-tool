/**
 * INTERVALS IN CONTEXT DATA
 * Riconoscimento intervalli in contesto tonale
 */

import { transposeNote, INTERVALS, type ChordProgression } from './interval-data';

export type IntervalsInContextDifficulty = 'simple' | 'diatonic' | 'chromatic';

export interface ContextNote {
  degree: number;
  name: string;
  semitones: number;
  alteration?: string;
}

// ===================================
// GRADI DISPONIBILI
// ===================================

export const CONTEXT_DEGREES_SIMPLE: ContextNote[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 5, name: '5', semitones: 7 },
];

export const CONTEXT_DEGREES_DIATONIC: ContextNote[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 2, name: '2', semitones: 2 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 4, name: '4', semitones: 5 },
  { degree: 5, name: '5', semitones: 7 },
  { degree: 6, name: '6', semitones: 9 },
  { degree: 7, name: '7', semitones: 11 },
];

export const CONTEXT_DEGREES_CHROMATIC: ContextNote[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 1, alteration: '♯', name: '♯1/♭2', semitones: 1 },
  { degree: 2, name: '2', semitones: 2 },
  { degree: 2, alteration: '♯', name: '♯2/♭3', semitones: 3 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 4, name: '4', semitones: 5 },
  { degree: 4, alteration: '♯', name: '♯4/♭5', semitones: 6 },
  { degree: 5, name: '5', semitones: 7 },
  { degree: 5, alteration: '♯', name: '♯5/♭6', semitones: 8 },
  { degree: 6, name: '6', semitones: 9 },
  { degree: 6, alteration: '♯', name: '♯6/♭7', semitones: 10 },
  { degree: 7, name: '7', semitones: 11 },
];

// ===================================
// PROGRESSIONI DI CONTESTO
// ===================================

export const INTERVALS_CONTEXT_PROGRESSIONS: Record<IntervalsInContextDifficulty, ChordProgression> = {
  simple: {
    name: 'I-V-I',
    degrees: ['I', 'V', 'I'],
    chordTypes: ['major', 'major', 'major'],
    category: 'simple-triads',
  },
  diatonic: {
    name: 'I-IV-V-I',
    degrees: ['I', 'IV', 'V', 'I'],
    chordTypes: ['major', 'major', 'major', 'major'],
    category: 'simple-triads',
  },
  chromatic: {
    name: 'I-vi-ii-V-I',
    degrees: ['I', 'vi', 'ii', 'V', 'I'],
    chordTypes: ['major', 'minor', 'minor', 'major', 'major'],
    category: 'all-triads',
  },
};

// ===================================
// UTILITIES
// ===================================

/**
 * Ottieni gradi disponibili per difficoltà
 */
export function getContextDegreesByDifficulty(difficulty: IntervalsInContextDifficulty): ContextNote[] {
  switch (difficulty) {
    case 'simple':
      return CONTEXT_DEGREES_SIMPLE;
    case 'diatonic':
      return CONTEXT_DEGREES_DIATONIC;
    case 'chromatic':
      return CONTEXT_DEGREES_CHROMATIC;
    default:
      return CONTEXT_DEGREES_DIATONIC;
  }
}

/**
 * Ottieni progressione di contesto
 */
export function getIntervalsContextProgression(difficulty: IntervalsInContextDifficulty): ChordProgression {
  return INTERVALS_CONTEXT_PROGRESSIONS[difficulty];
}

/**
 * Genera nota da grado
 */
export function generateNoteFromDegree(key: string, degree: ContextNote): string {
  return transposeNote(key, degree.semitones);
}

/**
 * Calcola intervallo tra due note
 */
export function calculateInterval(
  note1: string,
  note2: string
): {
  semitones: number;
  intervalName: string;
  intervalShort: string;
} {
  // Estrai semitoni da note
  const noteToSemitone = (note: string): number => {
    const noteMap: Record<string, number> = {
      C: 0,
      'C#': 1,
      Db: 1,
      D: 2,
      'D#': 3,
      Eb: 3,
      E: 4,
      F: 5,
      'F#': 6,
      Gb: 6,
      G: 7,
      'G#': 8,
      Ab: 8,
      A: 9,
      'A#': 10,
      Bb: 10,
      B: 11,
    };

    const noteName = note.replace(/[0-9]/g, '');
    const octave = parseInt(note.match(/[0-9]/)?.[0] || '0');

    return noteMap[noteName] + octave * 12;
  };

  const semitone1 = noteToSemitone(note1);
  const semitone2 = noteToSemitone(note2);
  let semitones = Math.abs(semitone2 - semitone1);

  // Normalizza intervallo entro l'ottava (0-12 semitoni)
  // Gli intervalli maggiori di un'ottava vengono ridotti
  if (semitones > 12) {
    semitones = semitones % 12;
    // Se è 0, è un'ottava
    if (semitones === 0) semitones = 12;
  }

  console.log('🎵 Calculate interval:', {
    note1,
    note2,
    semitone1,
    semitone2,
    rawSemitones: Math.abs(semitone2 - semitone1),
    normalizedSemitones: semitones,
  });

  // Trova intervallo corrispondente
  const interval = INTERVALS.find((i) => i.semitones === semitones);

  return {
    semitones,
    intervalName: interval?.name || 'Unknown',
    intervalShort: interval?.shortName || '?',
  };
}

/**
 * Genera coppia di note random
 */
export function generateRandomNotePair(
  difficulty: IntervalsInContextDifficulty,
  key: string
): {
  firstDegree: ContextNote;
  secondDegree: ContextNote;
  firstNote: string;
  secondNote: string;
  interval: ReturnType<typeof calculateInterval>;
} {
  const availableDegrees = getContextDegreesByDifficulty(difficulty);

  // Seleziona due gradi random
  const firstDegree = availableDegrees[Math.floor(Math.random() * availableDegrees.length)];

  // Secondo grado diverso dal primo
  const filtered = availableDegrees.filter((d) => d.name !== firstDegree.name);
  const secondDegree =
    filtered.length > 0
      ? filtered[Math.floor(Math.random() * filtered.length)]
      : availableDegrees[Math.floor(Math.random() * availableDegrees.length)];

  // Genera note
  const firstNote = generateNoteFromDegree(key, firstDegree);
  const secondNote = generateNoteFromDegree(key, secondDegree);

  // Calcola intervallo
  const interval = calculateInterval(firstNote, secondNote);

  return {
    firstDegree,
    secondDegree,
    firstNote,
    secondNote,
    interval,
  };
}

/**
 * MELODIC DICTATION DATA
 * Dati e utilities per Melodic Dictation exercise
 */

import { transposeNote, type ChordProgression } from './interval-data';

export type MelodicDictationDifficulty = 'simple' | 'advanced' | 'all';

export interface MelodicNote {
  degree: number;
  name: string;
  semitones: number;
}

// ===================================
// GRADI DISPONIBILI PER DIFFICOLTÀ
// ===================================

export const MELODIC_DEGREES_SIMPLE: MelodicNote[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 4, name: '4', semitones: 5 },
  { degree: 5, name: '5', semitones: 7 },
];

export const MELODIC_DEGREES_ADVANCED: MelodicNote[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 4, name: '4', semitones: 5 },
  { degree: 5, name: '5', semitones: 7 },
  { degree: 6, name: '6', semitones: 9 },
];

export const MELODIC_DEGREES_ALL: MelodicNote[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 2, name: '2', semitones: 2 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 4, name: '4', semitones: 5 },
  { degree: 5, name: '5', semitones: 7 },
  { degree: 6, name: '6', semitones: 9 },
  { degree: 7, name: '7', semitones: 11 },
];

// ===================================
// LUNGHEZZA MELODIA PER DIFFICOLTÀ
// ===================================

export const MELODY_LENGTH: Record<MelodicDictationDifficulty, number> = {
  simple: 3,
  advanced: 4,
  all: 5,
};

// ===================================
// PROGRESSIONI DI CONTESTO
// ===================================

export const MELODIC_CONTEXT_PROGRESSIONS: Record<MelodicDictationDifficulty, ChordProgression> = {
  simple: {
    name: 'I-V-I',
    degrees: ['I', 'V', 'I'],
    chordTypes: ['major', 'major', 'major'],
    category: 'simple-triads',
  },
  advanced: {
    name: 'I-IV-V-I',
    degrees: ['I', 'IV', 'V', 'I'],
    chordTypes: ['major', 'major', 'major', 'major'],
    category: 'simple-triads',
  },
  all: {
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
export function getMelodicDegreesByDifficulty(difficulty: MelodicDictationDifficulty): MelodicNote[] {
  switch (difficulty) {
    case 'simple':
      return MELODIC_DEGREES_SIMPLE;
    case 'advanced':
      return MELODIC_DEGREES_ADVANCED;
    case 'all':
      return MELODIC_DEGREES_ALL;
    default:
      return MELODIC_DEGREES_ADVANCED;
  }
}

/**
 * Ottieni progressione di contesto per difficoltà
 */
export function getMelodicContextProgression(difficulty: MelodicDictationDifficulty): ChordProgression {
  return MELODIC_CONTEXT_PROGRESSIONS[difficulty];
}

/**
 * Genera melodia random
 */
export function generateRandomMelody(
  difficulty: MelodicDictationDifficulty,
  key: string
): {
  degrees: MelodicNote[];
  notes: string[];
} {
  const availableDegrees = getMelodicDegreesByDifficulty(difficulty);
  const melodyLength = MELODY_LENGTH[difficulty];

  const degrees: MelodicNote[] = [];
  const notes: string[] = [];

  // Genera melodia con un po' di musicalità
  for (let i = 0; i < melodyLength; i++) {
    let selectedDegree: MelodicNote;

    if (i === 0) {
      // Prima nota: preferisci 1 o 5
      const startingDegrees = availableDegrees.filter((d) => d.degree === 1 || d.degree === 5);
      selectedDegree =
        startingDegrees.length > 0
          ? startingDegrees[Math.floor(Math.random() * startingDegrees.length)]
          : availableDegrees[Math.floor(Math.random() * availableDegrees.length)];
    } else if (i === melodyLength - 1) {
      // Ultima nota: preferisci 1 (risoluzione)
      const endingDegrees = availableDegrees.filter((d) => d.degree === 1);
      selectedDegree =
        endingDegrees.length > 0 && Math.random() > 0.3
          ? endingDegrees[0]
          : availableDegrees[Math.floor(Math.random() * availableDegrees.length)];
    } else {
      // Note intermedie: evita ripetizioni immediate
      const previous = degrees[i - 1];
      const filtered = availableDegrees.filter((d) => d.degree !== previous.degree);
      selectedDegree =
        filtered.length > 0
          ? filtered[Math.floor(Math.random() * filtered.length)]
          : availableDegrees[Math.floor(Math.random() * availableDegrees.length)];
    }

    degrees.push(selectedDegree);

    // Calcola nota
    const note = transposeNote(key, selectedDegree.semitones);
    notes.push(note);
  }

  return { degrees, notes };
}

/**
 * Calcola posizione Y sul pentagramma (treble clef)
 * C4 (middle C) = 0, ogni semitono = cambia posizione
 */
export function getNoteStaffPosition(note: string): {
  y: number;
  accidental: 'sharp' | 'flat' | null;
  ledgerLines: number[];
} {
  // Rimuovi ottava
  const noteName = note.replace(/[0-9]/g, '');

  // Map note a posizioni staff (C4 = middle C)
  // Pentagramma treble: E4, F4, G4, A4, B4, C5, D5, E5, F5
  const notePositions: Record<string, number> = {
    C: 0, // Below staff
    'C#': 0,
    D: 1, // Below staff
    'D#': 1,
    E: 2, // Line 1
    F: 3, // Space 1
    'F#': 3,
    G: 4, // Line 2
    'G#': 4,
    A: 5, // Space 2
    'A#': 5,
    B: 6, // Line 3
  };

  const basePosition = notePositions[noteName.charAt(0)] || 0;
  const accidental = noteName.includes('#') ? ('sharp' as const) : noteName.includes('b') ? ('flat' as const) : null;

  // Calcola ledger lines se necessario
  const ledgerLines: number[] = [];
  if (basePosition < 2) {
    // Note sotto il pentagramma
    for (let i = 0; i > basePosition; i -= 2) {
      ledgerLines.push(i);
    }
  }

  return { y: basePosition, accidental, ledgerLines };
}

/**
 * SCALE DEGREES DATA
 * Dati e utilities per Scale Degrees exercise
 */

import { transposeNote, type ChordProgression } from './interval-data';

export type ScaleDegreeDifficulty = 'simple' | 'diatonic' | 'chromatic';

export interface ScaleDegree {
  degree: number; // 1-7
  alteration?: string; // '', '♭', '♯'
  name: string; // '1', '♭2', '♯4', etc.
  semitones: number; // Semitoni da tonic
}

// ===================================
// GRADI DISPONIBILI
// ===================================

export const SCALE_DEGREES_SIMPLE: ScaleDegree[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 5, name: '5', semitones: 7 },
];

export const SCALE_DEGREES_DIATONIC: ScaleDegree[] = [
  { degree: 1, name: '1', semitones: 0 },
  { degree: 2, name: '2', semitones: 2 },
  { degree: 3, name: '3', semitones: 4 },
  { degree: 4, name: '4', semitones: 5 },
  { degree: 5, name: '5', semitones: 7 },
  { degree: 6, name: '6', semitones: 9 },
  { degree: 7, name: '7', semitones: 11 },
];

export const SCALE_DEGREES_CHROMATIC: ScaleDegree[] = [
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

export const CONTEXT_PROGRESSIONS: Record<ScaleDegreeDifficulty, ChordProgression> = {
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
export function getScaleDegreesByDifficulty(difficulty: ScaleDegreeDifficulty): ScaleDegree[] {
  switch (difficulty) {
    case 'simple':
      return SCALE_DEGREES_SIMPLE;
    case 'diatonic':
      return SCALE_DEGREES_DIATONIC;
    case 'chromatic':
      return SCALE_DEGREES_CHROMATIC;
    default:
      return SCALE_DEGREES_DIATONIC;
  }
}

/**
 * Ottieni progressione di contesto per difficoltà
 */
export function getContextProgression(difficulty: ScaleDegreeDifficulty): ChordProgression {
  return CONTEXT_PROGRESSIONS[difficulty];
}

/**
 * Genera nota target da grado e key
 */
export function generateTargetNoteFromDegree(key: string, scaleDegree: ScaleDegree): string {
  return transposeNote(key, scaleDegree.semitones);
}

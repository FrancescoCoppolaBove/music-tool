/**
 * RHYTHM RECOGNITION DATA
 * Pattern ritmici per ear training
 */

export type RhythmDifficulty = 'simple' | 'intermediate' | 'advanced';

export type NoteType =
  | 'quarter'
  | 'half'
  | 'eighth'
  | 'sixteenth'
  | 'dotted-quarter'
  | 'dotted-eighth'
  | 'triplet'
  | 'rest-quarter'
  | 'rest-eighth'
  | 'rest-sixteenth';

export interface RhythmNote {
  type: NoteType;
  duration: number; // in beats (0.25 = sixteenth, 0.5 = eighth, 1 = quarter)
  isRest: boolean;
}

export interface RhythmPattern {
  id: string;
  name: string;
  notes: RhythmNote[];
  difficulty: RhythmDifficulty;
  totalBeats: number;
}

// ===================================
// SIMPLE PATTERNS (4 beats) - 6 patterns
// ===================================

export const RHYTHM_PATTERNS_SIMPLE: RhythmPattern[] = [
  {
    id: 'simple-1',
    name: 'Four Quarter Notes',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-2',
    name: 'Quarter Eighth Eighth',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-3',
    name: 'Eighth Eighth Quarter',
    notes: [
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-4',
    name: 'Quarter Rest Quarter',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'rest-quarter', duration: 1, isRest: true },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'rest-quarter', duration: 1, isRest: true },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-5',
    name: 'All Eighth Notes',
    notes: [
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
  {
    id: 'simple-6',
    name: 'Two Half Notes',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'simple',
    totalBeats: 4,
  },
];

// ===================================
// INTERMEDIATE PATTERNS (4 beats) - 8 patterns
// ===================================

export const RHYTHM_PATTERNS_INTERMEDIATE: RhythmPattern[] = [
  {
    id: 'inter-1',
    name: 'Dotted Quarter Eighth',
    notes: [
      { type: 'dotted-quarter', duration: 1.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'dotted-quarter', duration: 1.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  {
    id: 'inter-2',
    name: 'Syncopated Quarter',
    notes: [
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  {
    id: 'inter-3',
    name: 'Mixed Eighths Quarters',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  {
    id: 'inter-4',
    name: 'Eighth Rest Eighth Quarter',
    notes: [
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-eighth', duration: 0.5, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-eighth', duration: 0.5, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  {
    id: 'inter-5',
    name: 'Dotted Eighth Sixteenth',
    notes: [
      { type: 'dotted-eighth', duration: 0.75, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'dotted-eighth', duration: 0.75, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  {
    id: 'inter-6',
    name: 'Quarter Three Eighths',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  {
    id: 'inter-7',
    name: 'Syncopated Eighths',
    notes: [
      { type: 'rest-eighth', duration: 0.5, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-eighth', duration: 0.5, isRest: true },
      { type: 'rest-eighth', duration: 0.5, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-eighth', duration: 0.5, isRest: true },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  },
  /* {
    id: 'inter-8',
    name: 'Half Quarter Quarter',
    notes: [
      { type: 'half', duration: 2, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'intermediate',
    totalBeats: 4,
  }, */
];

// ===================================
// ADVANCED PATTERNS - Focus PAUSE SEDICESIMI (10 patterns)
// ===================================

export const RHYTHM_PATTERNS_ADVANCED: RhythmPattern[] = [
  {
    id: 'adv-1',
    name: 'Rest-Note Sixteenths',
    notes: [
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-2',
    name: 'Staccato Sixteenths',
    notes: [
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-3',
    name: 'Syncopated Rests',
    notes: [
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-4',
    name: 'Triple Rest Pattern',
    notes: [
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-5',
    name: 'Rest Clusters',
    notes: [
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-6',
    name: 'Off-beat Sixteenths',
    notes: [
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-7',
    name: 'Complex Rest Syncopation',
    notes: [
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-8',
    name: 'Sparse Sixteenths',
    notes: [
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'eighth', duration: 0.5, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'rest-sixteenth', duration: 0.25, isRest: true },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-9',
    name: 'Dotted Eighth Sixteenth',
    notes: [
      { type: 'dotted-eighth', duration: 0.75, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'dotted-eighth', duration: 0.75, isRest: false },
      { type: 'sixteenth', duration: 0.25, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
  {
    id: 'adv-10',
    name: 'Triplet Quarters',
    notes: [
      { type: 'quarter', duration: 1, isRest: false },
      { type: 'triplet', duration: 0.33, isRest: false },
      { type: 'triplet', duration: 0.33, isRest: false },
      { type: 'triplet', duration: 0.33, isRest: false },
      { type: 'quarter', duration: 1, isRest: false },
    ],
    difficulty: 'advanced',
    totalBeats: 4,
  },
];

// ===================================
// UTILITIES
// ===================================

/**
 * Get patterns by difficulty
 */
export function getRhythmPatternsByDifficulty(difficulty: RhythmDifficulty): RhythmPattern[] {
  switch (difficulty) {
    case 'simple':
      return RHYTHM_PATTERNS_SIMPLE;
    case 'intermediate':
      return RHYTHM_PATTERNS_INTERMEDIATE;
    case 'advanced':
      return RHYTHM_PATTERNS_ADVANCED;
    default:
      return RHYTHM_PATTERNS_SIMPLE;
  }
}

/**
 * Generate random pattern
 */
export function generateRandomRhythmPattern(difficulty: RhythmDifficulty): RhythmPattern {
  const patterns = getRhythmPatternsByDifficulty(difficulty);
  return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Get note symbol for display
 */
export function getNoteSymbol(type: NoteType): string | 'SVG_REST_QUARTER' | 'SVG_REST_EIGHTH' | 'SVG_REST_SIXTEENTH' {
  const symbols: Record<NoteType, string | 'SVG_REST_QUARTER' | 'SVG_REST_EIGHTH' | 'SVG_REST_SIXTEENTH'> = {
    quarter: '♩',
    half: '𝅗𝅥',
    eighth: '♪',
    sixteenth: '♬',
    'dotted-quarter': '♩.',
    'dotted-eighth': '♪.',
    triplet: '♪³',
    'rest-quarter': 'SVG_REST_QUARTER',
    'rest-eighth': 'SVG_REST_EIGHTH',
    'rest-sixteenth': 'SVG_REST_SIXTEENTH',
  };
  return symbols[type] || '♩';
}

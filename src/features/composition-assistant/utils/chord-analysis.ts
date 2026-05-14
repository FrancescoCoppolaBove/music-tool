/**
 * CHORD ANALYSIS - DETERMINISTIC CORE LOGIC
 * Analizza progressioni di accordi e identifica pattern armonici
 */

import type { NoteName } from '../../../shared/types/music.types';

// ===================================
// TYPES
// ===================================

export type ChordQuality =
  | 'maj'
  | 'maj7'
  | 'maj9'
  | 'm'
  | 'm7'
  | 'm9'
  | 'mMaj7'
  | '7'
  | '9'
  | '13'
  | 'dim'
  | 'dim7'
  | 'm7b5'
  | 'aug'
  | 'maj7#5'
  | 'sus2'
  | 'sus4'
  | '7alt'
  | '7#9'
  | '7b9';

export interface ParsedChord {
  root: NoteName;
  quality: ChordQuality;
  extensions: string[];
  bass?: NoteName; // per slash chords
  original: string;
}

export interface ChordAnalysis {
  chord: ParsedChord;
  degreeInKey?: string; // "I", "ii", "V7", etc.
  function?: 'tonic' | 'subdominant' | 'dominant' | 'modal' | 'chromatic';
  romanNumeral?: string;
  scaleMatch?: string[]; // quali scale funzionano
  tensions?: string[]; // tensioni disponibili
  avoidNotes?: string[]; // note da evitare
}

export interface ProgressionAnalysis {
  chords: ChordAnalysis[];
  key?: NoteName;
  mode?: 'major' | 'minor';
  keyConfidence?: number; // 0-100%
  cadenceType?: 'authentic' | 'plagal' | 'deceptive' | 'half' | 'none';
  modalInterchange?: boolean;
  secondaryDominants?: number[];
  borrowedChords?: number[];
}

// ===================================
// CHROMATIC NOTES (FLAT NOTATION)
// ===================================

const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Enharmonic equivalents per parsing
const ENHARMONIC_MAP: Record<string, NoteName> = {
  C: 'C',
  'B#': 'C',
  Db: 'Db',
  'C#': 'Db',
  D: 'D',
  Eb: 'Eb',
  'D#': 'Eb',
  E: 'E',
  Fb: 'E',
  F: 'F',
  'E#': 'F',
  Gb: 'Gb',
  'F#': 'Gb',
  G: 'G',
  Ab: 'Ab',
  'G#': 'Ab',
  A: 'A',
  Bb: 'Bb',
  'A#': 'Bb',
  B: 'B',
  Cb: 'B',
};

// ===================================
// CHORD PARSING
// ===================================

/**
 * Parse chord symbol into structured data
 * Examples: "Cmaj7", "Dm7", "G7", "Am", "F#m7b5", "Bb7#9", "C/E"
 */
export function parseChord(chordSymbol: string): ParsedChord | null {
  const trimmed = chordSymbol.trim();
  if (!trimmed) return null;

  // Handle slash chords (C/E)
  let bass: NoteName | undefined;
  let mainChord = trimmed;

  if (trimmed.includes('/')) {
    const [chord, bassNote] = trimmed.split('/');
    mainChord = chord.trim();
    const parsedBass = parseBassNote(bassNote.trim());
    if (parsedBass) bass = parsedBass;
  }

  // Extract root note
  const rootMatch = mainChord.match(/^([A-G][#b♯♭]*)/);
  if (!rootMatch) return null;

  const rootStr = rootMatch[1].replace('♯', '#').replace('♭', 'b');

  const root = ENHARMONIC_MAP[rootStr];
  if (!root) return null;

  // Extract quality and extensions
  const qualityStr = mainChord.slice(rootMatch[0].length);
  const { quality, extensions } = parseQuality(qualityStr);

  return {
    root,
    quality,
    extensions,
    bass,
    original: trimmed,
  };
}

function parseBassNote(bassStr: string): NoteName | null {
  const normalized = bassStr.replace('♯', '#').replace('♭', 'b');
  return ENHARMONIC_MAP[normalized] || null;
}

function parseQuality(qualityStr: string): { quality: ChordQuality; extensions: string[] } {
  const lower = qualityStr.toLowerCase();
  const extensions: string[] = [];

  // Dominant alterations
  if (lower.includes('alt')) return { quality: '7alt', extensions: ['b9', '#9', 'b13'] };
  if (lower.includes('7#9')) return { quality: '7#9', extensions: ['#9'] };
  if (lower.includes('7b9')) return { quality: '7b9', extensions: ['b9'] };

  // Diminished
  if (lower.includes('dim7') || lower === '°7') return { quality: 'dim7', extensions };
  if (lower.includes('dim') || lower === '°') return { quality: 'dim', extensions };
  if (lower.includes('m7b5') || lower === 'ø') return { quality: 'm7b5', extensions };

  // Augmented
  if (lower.includes('maj7#5') || lower.includes('maj7+5')) return { quality: 'maj7#5', extensions };
  if (lower.includes('aug') || lower === '+') return { quality: 'aug', extensions };

  // Minor
  if (lower.includes('mmaj7') || lower.includes('mΔ7') || lower.includes('m△7')) {
    return { quality: 'mMaj7', extensions };
  }
  if (lower.includes('m9')) return { quality: 'm9', extensions: ['9'] };
  if (lower.includes('m7')) return { quality: 'm7', extensions };
  if (lower.includes('min') || lower.includes('m') || lower === '-') {
    return { quality: 'm', extensions };
  }

  // Major
  if (lower.includes('maj9') || lower.includes('Δ9')) return { quality: 'maj9', extensions: ['9'] };
  if (lower.includes('maj7') || lower.includes('maj') || lower.includes('Δ') || lower.includes('△')) {
    return { quality: 'maj7', extensions };
  }

  // Dominant
  if (lower.includes('13')) return { quality: '13', extensions: ['9', '13'] };
  if (lower.includes('9')) return { quality: '9', extensions: ['9'] };
  if (lower.includes('7')) return { quality: '7', extensions };

  // Suspended
  if (lower.includes('sus4')) return { quality: 'sus4', extensions };
  if (lower.includes('sus2')) return { quality: 'sus2', extensions };

  // Default to major triad
  return { quality: 'maj', extensions };
}

// ===================================
// KEY DETECTION
// ===================================

/**
 * Detect most likely key from chord progression
 * Returns key + confidence score
 */
export function detectKey(chords: ParsedChord[]): { key: NoteName; mode: 'major' | 'minor'; confidence: number } | null {
  if (chords.length === 0) return null;

  const scores: Map<string, number> = new Map();

  // Score each possible key
  for (const possibleKey of CHROMATIC_NOTES) {
    const majorScore = scoreKeyFit(chords, possibleKey, 'major');
    const minorScore = scoreKeyFit(chords, possibleKey, 'minor');

    scores.set(`${possibleKey}-major`, majorScore);
    scores.set(`${possibleKey}-minor`, minorScore);
  }

  // Find best match
  let bestKey = 'C-major';
  let bestScore = 0;

  for (const [key, score] of scores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  const [keyNote, modeStr] = bestKey.split('-');
  const mode = modeStr as 'major' | 'minor';

  // Confidence: normalize score to 0-100%
  const maxPossibleScore = chords.length * 3; // max 3 points per chord
  const confidence = Math.min(100, Math.round((bestScore / maxPossibleScore) * 100));

  return {
    key: keyNote as NoteName,
    mode,
    confidence,
  };
}

function scoreKeyFit(chords: ParsedChord[], key: NoteName, mode: 'major' | 'minor'): number {
  let score = 0;
  const diatonicChords = getDiatonicChords(key, mode);

  for (const chord of chords) {
    // Perfect match: chord is diatonic
    const isDiatonic = diatonicChords.some((dc) => dc.root === chord.root && isQualityMatch(dc.quality, chord.quality));

    if (isDiatonic) {
      score += 2;
    } else {
      // Partial match: root is in scale
      const scale = getScale(key, mode);
      if (scale.includes(chord.root)) {
        score += 1;
      }
    }

    // Bonus for typical cadences
    if (chord.root === key) {
      score += 1; // tonic chord
    }
  }

  return score;
}

function isQualityMatch(expected: ChordQuality, actual: ChordQuality): boolean {
  // Group similar qualities
  const majorGroup: ChordQuality[] = ['maj', 'maj7', 'maj9'];
  const minorGroup: ChordQuality[] = ['m', 'm7', 'm9'];
  const dominantGroup: ChordQuality[] = ['7', '9', '13'];

  if (majorGroup.includes(expected) && majorGroup.includes(actual)) return true;
  if (minorGroup.includes(expected) && minorGroup.includes(actual)) return true;
  if (dominantGroup.includes(expected) && dominantGroup.includes(actual)) return true;

  return expected === actual;
}

// ===================================
// DIATONIC CHORDS
// ===================================

function getDiatonicChords(key: NoteName, mode: 'major' | 'minor'): ParsedChord[] {
  const scale = getScale(key, mode);

  if (mode === 'major') {
    // Major scale: I-ii-iii-IV-V-vi-vii°
    return [
      { root: scale[0], quality: 'maj7', extensions: [], original: `${scale[0]}maj7` },
      { root: scale[1], quality: 'm7', extensions: [], original: `${scale[1]}m7` },
      { root: scale[2], quality: 'm7', extensions: [], original: `${scale[2]}m7` },
      { root: scale[3], quality: 'maj7', extensions: [], original: `${scale[3]}maj7` },
      { root: scale[4], quality: '7', extensions: [], original: `${scale[4]}7` },
      { root: scale[5], quality: 'm7', extensions: [], original: `${scale[5]}m7` },
      { root: scale[6], quality: 'm7b5', extensions: [], original: `${scale[6]}m7b5` },
    ];
  } else {
    // Natural minor: i-ii°-♭III-iv-v-♭VI-♭VII
    return [
      { root: scale[0], quality: 'm7', extensions: [], original: `${scale[0]}m7` },
      { root: scale[1], quality: 'm7b5', extensions: [], original: `${scale[1]}m7b5` },
      { root: scale[2], quality: 'maj7', extensions: [], original: `${scale[2]}maj7` },
      { root: scale[3], quality: 'm7', extensions: [], original: `${scale[3]}m7` },
      { root: scale[4], quality: 'm7', extensions: [], original: `${scale[4]}m7` }, // or could be V7 in harmonic minor
      { root: scale[5], quality: 'maj7', extensions: [], original: `${scale[5]}maj7` },
      { root: scale[6], quality: '7', extensions: [], original: `${scale[6]}7` },
    ];
  }
}

function getScale(root: NoteName, mode: 'major' | 'minor'): NoteName[] {
  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  const intervals =
    mode === 'major'
      ? [0, 2, 4, 5, 7, 9, 11] // Major scale intervals
      : [0, 2, 3, 5, 7, 8, 10]; // Natural minor scale intervals

  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    return CHROMATIC_NOTES[noteIndex];
  });
}

// ===================================
// ROMAN NUMERAL ANALYSIS
// ===================================

export function getRomanNumeral(chord: ParsedChord, key: NoteName, mode: 'major' | 'minor'): string | null {
  const scale = getScale(key, mode);
  const degreeIndex = scale.indexOf(chord.root);

  if (degreeIndex === -1) {
    // Chromatic chord - not in scale
    return null;
  }

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  let numeral = romanNumerals[degreeIndex];

  // Adjust case for minor chords
  const isMinorQuality = ['m', 'm7', 'm9', 'mMaj7'].includes(chord.quality);
  if (isMinorQuality) {
    numeral = numeral.toLowerCase();
  }

  // Add quality suffixes
  if (chord.quality === '7' || chord.quality === '9' || chord.quality === '13') {
    numeral += '7';
  } else if (chord.quality === 'maj7' || chord.quality === 'maj9') {
    numeral += 'maj7';
  } else if (chord.quality === 'm7b5') {
    numeral = numeral.toLowerCase() + '°7';
  } else if (chord.quality === 'dim7') {
    numeral += '°7';
  }

  return numeral;
}

// ===================================
// FUNCTIONAL ANALYSIS
// ===================================

export function getChordFunction(
  chord: ParsedChord,
  key: NoteName,
  mode: 'major' | 'minor',
): 'tonic' | 'subdominant' | 'dominant' | 'modal' | 'chromatic' {
  const scale = getScale(key, mode);
  const degreeIndex = scale.indexOf(chord.root);

  if (degreeIndex === -1) {
    return 'chromatic'; // Not in scale
  }

  // Functional harmony mapping
  if (mode === 'major') {
    if (degreeIndex === 0 || degreeIndex === 2 || degreeIndex === 5) {
      return 'tonic'; // I, iii, vi
    }
    if (degreeIndex === 3 || degreeIndex === 1) {
      return 'subdominant'; // IV, ii
    }
    if (degreeIndex === 4 || degreeIndex === 6) {
      return 'dominant'; // V, vii°
    }
  } else {
    // Minor mode
    if (degreeIndex === 0 || degreeIndex === 2 || degreeIndex === 5) {
      return 'tonic'; // i, ♭III, ♭VI
    }
    if (degreeIndex === 3 || degreeIndex === 1) {
      return 'subdominant'; // iv, ii°
    }
    if (degreeIndex === 4 || degreeIndex === 6) {
      return 'dominant'; // v (or V7), ♭VII
    }
  }

  return 'modal';
}

// ===================================
// PROGRESSION ANALYSIS
// ===================================

/**
 * Complete analysis of a chord progression
 */
export function analyzeProgression(chordSymbols: string[]): ProgressionAnalysis {
  // Parse all chords
  const parsedChords = chordSymbols.map(parseChord).filter((c): c is ParsedChord => c !== null);

  if (parsedChords.length === 0) {
    return { chords: [] };
  }

  // Detect key
  const keyDetection = detectKey(parsedChords);

  if (!keyDetection) {
    return {
      chords: parsedChords.map((chord) => ({ chord })),
    };
  }

  const { key, mode, confidence: keyConfidence } = keyDetection;

  // Analyze each chord
  const chords: ChordAnalysis[] = parsedChords.map((chord) => {
    const romanNumeral = getRomanNumeral(chord, key, mode);
    const chordFunction = getChordFunction(chord, key, mode);

    return {
      chord,
      degreeInKey: romanNumeral || undefined,
      function: chordFunction,
      romanNumeral: romanNumeral || undefined,
    };
  });

  // Detect cadence type
  const cadenceType = detectCadence(chords, key, mode);

  return {
    chords,
    key,
    mode,
    keyConfidence,
    cadenceType,
  };
}

// ===================================
// CADENCE DETECTION
// ===================================

function detectCadence(
  chords: ChordAnalysis[],
  key: NoteName,
  mode: 'major' | 'minor',
): 'authentic' | 'plagal' | 'deceptive' | 'half' | 'none' {
  if (chords.length < 2) return 'none';

  const lastTwo = chords.slice(-2);
  const [penultimate, final] = lastTwo;

  const scale = getScale(key, mode);
  const tonic = scale[0];
  const dominant = scale[4];
  const subdominant = scale[3];
  const submediant = scale[5]; // vi in major

  // Authentic cadence: V → I
  if (penultimate.chord.root === dominant && final.chord.root === tonic) {
    return 'authentic';
  }

  // Plagal cadence: IV → I
  if (penultimate.chord.root === subdominant && final.chord.root === tonic) {
    return 'plagal';
  }

  // Deceptive cadence: V → vi
  if (penultimate.chord.root === dominant && final.chord.root === submediant) {
    return 'deceptive';
  }

  // Half cadence: any → V
  if (final.chord.root === dominant) {
    return 'half';
  }

  return 'none';
}

import {
  noteToSemitone,
  semitoneToNote,
  notePreferFlat,
  getScaleNotes,
  MAJOR_DIATONIC_QUALITY,
} from '@shared/utils/musicTheory';

export type CushionLevel = 'dorian' | 'aeolian' | 'phrygian';

export interface CushionChord {
  inputDegree: string;
  symbol: string;
  root: string;
  quality: string;
  isBorrowed: boolean;
  sourceKey: string | null;
}

export interface CushionVariant {
  level: CushionLevel;
  label: string;
  sourceKey: string;
  color: string;
  chords: CushionChord[];
}

export interface CushionResult {
  original: CushionChord[];
  variants: CushionVariant[];
}

// How many semitones BELOW the tonic each source key lives
const CUSHION_OFFSETS: Record<CushionLevel, { offset: number; label: string; color: string }> = {
  dorian:   { offset: 2, label: 'Dorico',  color: '#06b6d4' },
  aeolian:  { offset: 9, label: 'Eolico',  color: '#ef4444' },
  phrygian: { offset: 4, label: 'Frigio',  color: '#f59e0b' },
};

// Map diatonic ordinal (1–7) ↔ DEGREE_SEMITONE key
const ORDINAL_TO_DEGREE_KEY: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII',
};

// Recognized diatonic degree tokens → ordinal 1–7
const DEGREE_ORDINAL: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
};

function normalizeDegree(token: string): string {
  return token
    .replace(/♭/g, 'b')
    .toUpperCase()
    .replace(/(MIN|MAJ|DIM|AUG|M)$/, '');
}

export function parseDegrees(input: string): string[] {
  return input
    .split(/[\s\-,/]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(normalizeDegree)
    .filter(t => DEGREE_ORDINAL[t] !== undefined);
}

function chordSymbol(root: string, quality: string): string {
  return quality === 'maj' ? root : `${root}${quality}`;
}

function resolveInKey(key: string, degree: string): CushionChord {
  const ordinal = DEGREE_ORDINAL[degree];
  const scaleNotes = getScaleNotes(key, 'major');
  const root = scaleNotes[ordinal - 1];
  const quality = MAJOR_DIATONIC_QUALITY[ORDINAL_TO_DEGREE_KEY[ordinal]] ?? 'maj7';
  return { inputDegree: degree, symbol: chordSymbol(root, quality), root, quality, isBorrowed: false, sourceKey: null };
}

function resolveInCushion(degree: string, homeKey: string, level: CushionLevel): CushionChord {
  if (degree === 'I') {
    return { ...resolveInKey(homeKey, 'I'), isBorrowed: false, sourceKey: null };
  }
  const ordinal = DEGREE_ORDINAL[degree];
  const { offset } = CUSHION_OFFSETS[level];
  const homeKeySemitone = noteToSemitone(homeKey);
  const sourceKeySemitone = ((homeKeySemitone - offset) % 12 + 12) % 12;
  const preferFlat = notePreferFlat(homeKey) || [1, 3, 6, 8, 10].includes(sourceKeySemitone);
  const sourceKey = semitoneToNote(sourceKeySemitone, preferFlat);
  const scaleNotes = getScaleNotes(sourceKey, 'major');
  const root = scaleNotes[ordinal - 1];
  const quality = MAJOR_DIATONIC_QUALITY[ORDINAL_TO_DEGREE_KEY[ordinal]] ?? 'maj7';
  const homeNotes = new Set(getScaleNotes(homeKey, 'major'));
  return {
    inputDegree: degree,
    symbol: chordSymbol(root, quality),
    root,
    quality,
    isBorrowed: !homeNotes.has(root),
    sourceKey,
  };
}

export function computeCushionVariants(degrees: string[], key: string): CushionResult {
  const original = degrees.map(d => resolveInKey(key, d));
  const levels: CushionLevel[] = ['dorian', 'aeolian', 'phrygian'];
  const variants: CushionVariant[] = levels.map(level => {
    const { label, color, offset } = CUSHION_OFFSETS[level];
    const homeKeySemitone = noteToSemitone(key);
    const sourceKeySemitone = ((homeKeySemitone - offset) % 12 + 12) % 12;
    const preferFlat = notePreferFlat(key) || [1, 3, 6, 8, 10].includes(sourceKeySemitone);
    const sourceKey = semitoneToNote(sourceKeySemitone, preferFlat);
    return {
      level,
      label: `${label} (da ${sourceKey})`,
      sourceKey,
      color,
      chords: degrees.map(d => resolveInCushion(d, key, level)),
    };
  });
  return { original, variants };
}

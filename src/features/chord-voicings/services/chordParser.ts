import {
  NOTE_TO_SEMITONE,
  CHORD_FORMULAS,
  CHORD_ALIASES,
  getChordNotes,
} from '@shared/utils/musicTheory';
import type { ParsedChord } from '../types/chord.types';

// Ordered from longest to shortest so greedy match works correctly
const CHORD_TYPE_KEYS = [
  'augMaj7','mMaj7','m7b5','dim7','maj9#11','maj7#11','7b5b9','7#5#9',
  '9#11','maj13','m13','maj11','m11','maj9','m6/9','6/9','m9','7#11',
  '7sus4','7b9','7#9','7b5','7#5','7alt',
  '13','11','maj7','m7','m6','aug7','dim','aug','sus2','sus4','add9','madd9',
  'm11','m13','maj','m','6','9','7','5',
  'quartal4','quartal',
];

// Alias map (applied before CHORD_TYPE_KEYS search)
const ALIAS_PAIRS: Array<[RegExp, string]> = [
  [/^(Δ7|△7|M7|maj7)/,    'maj7'],
  [/^(Δ|△)/,              'maj7'],
  [/^(ø7)/,               'm7b5'],
  [/^(ø)/,                'm7b5'],
  [/^(°7)/,               'dim7'],
  [/^(°)/,                'dim'],
  [/^(\+7)/,              '7#5'],
  [/^(\+)/,               'aug'],
  [/^(-7)/,               'm7'],
  [/^(-)/,                'm'],
  [/^(min7)/,             'm7'],
  [/^(min)/,              'm'],
  [/^(dom7)/,             '7'],
  [/^(dom)/,              '7'],
  [/^(major)/,            'maj'],
  [/^(minor)/,            'm'],
];

// Valid root note names, ordered longest-first
const ROOT_REGEX = /^([A-G][b#]?)/;

export function parseChord(input: string): ParsedChord | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Extract root
  const rootMatch = trimmed.match(ROOT_REGEX);
  if (!rootMatch) return null;
  const root = rootMatch[1];
  if (NOTE_TO_SEMITONE[root] === undefined) return null;

  let remainder = trimmed.slice(root.length);

  // Check for slash bass note
  let bassNote: string | undefined;
  const slashIdx = remainder.lastIndexOf('/');
  if (slashIdx > -1) {
    const potentialBass = remainder.slice(slashIdx + 1);
    if (ROOT_REGEX.test(potentialBass) && NOTE_TO_SEMITONE[potentialBass.match(ROOT_REGEX)![1]] !== undefined) {
      bassNote = potentialBass.match(ROOT_REGEX)![1];
      remainder = remainder.slice(0, slashIdx);
    }
  }

  // Resolve aliases first
  let chordType = '';
  if (remainder === '' || remainder === 'maj' || remainder === 'M') {
    chordType = 'maj';
  } else {
    let resolved = remainder;
    for (const [re, replacement] of ALIAS_PAIRS) {
      const m = resolved.match(re);
      if (m) {
        resolved = replacement + resolved.slice(m[0].length);
        break;
      }
    }

    // Greedy match from the sorted list
    for (const key of CHORD_TYPE_KEYS) {
      if (resolved.startsWith(key) || resolved === key) {
        chordType = key;
        break;
      }
    }

    // Fallback: check alias map directly
    if (!chordType && CHORD_ALIASES[remainder]) {
      chordType = CHORD_ALIASES[remainder];
    }

    if (!chordType) {
      // Unknown chord type — default to major triad
      chordType = 'maj';
    }
  }

  // Validate chordType exists
  if (!CHORD_FORMULAS[chordType]) {
    chordType = 'maj';
  }

  const notes = getChordNotes(root, chordType);

  // Display name: root + quality suffix (omit 'maj' for plain major)
  const qualitySuffix = chordType === 'maj' ? '' : chordType;
  const displayName = bassNote ? `${root}${qualitySuffix}/${bassNote}` : `${root}${qualitySuffix}`;

  return { root, chordType, bassNote, displayName, notes };
}

export const COMMON_CHORDS: Array<{ symbol: string; label: string }> = [
  { symbol: 'Cmaj7',   label: 'Cmaj7' },
  { symbol: 'Dm7',     label: 'Dm7' },
  { symbol: 'G7',      label: 'G7' },
  { symbol: 'Am7',     label: 'Am7' },
  { symbol: 'Fmaj7',   label: 'Fmaj7' },
  { symbol: 'Em7',     label: 'Em7' },
  { symbol: 'Bdim7',   label: 'Bdim7' },
  { symbol: 'Dm7b5',   label: 'Dm7♭5' },
  { symbol: 'G7b9',    label: 'G7♭9' },
  { symbol: 'Cmaj9',   label: 'Cmaj9' },
  { symbol: 'D9',      label: 'D9' },
  { symbol: 'Esus4',   label: 'Esus4' },
  { symbol: 'Abmaj7',  label: 'A♭maj7' },
  { symbol: 'Bb7',     label: 'B♭7' },
  { symbol: 'F#m7b5',  label: 'F♯m7♭5' },
  { symbol: 'C7#9',    label: 'C7♯9' },
  { symbol: 'Gmaj7#11',label: 'Gmaj7♯11' },
  { symbol: 'Dmin9',   label: 'Dmin9' },
];

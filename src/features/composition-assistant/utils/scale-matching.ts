/**
 * SCALE MATCHING - CHORD-SCALE THEORY
 * Suggerisce quali scale usare per improvvisare su ogni accordo
 */

import type { NoteName } from '../../../shared/types/music.types';
import type { ParsedChord, ChordQuality } from './chord-analysis';

// ===================================
// TYPES
// ===================================

export interface ScaleMatch {
  scaleName: string;
  root: NoteName;
  notes: NoteName[];
  priority: 'primary' | 'secondary' | 'alternative';
  characteristic: string; // Descrizione del sound
  avoidNotes?: NoteName[];
  context?: string; // Quando usarla
}

export interface ChordScaleAnalysis {
  chord: ParsedChord;
  scales: ScaleMatch[];
}

// ===================================
// CHROMATIC NOTES
// ===================================

const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ===================================
// SCALE PATTERNS (INTERVALS FROM ROOT)
// ===================================

const SCALE_INTERVALS: Record<string, number[]> = {
  // Major modes
  ionian: [0, 2, 4, 5, 7, 9, 11], // Major scale
  dorian: [0, 2, 3, 5, 7, 9, 10], // Minor with major 6
  phrygian: [0, 1, 3, 5, 7, 8, 10], // Minor with b2
  lydian: [0, 2, 4, 6, 7, 9, 11], // Major with #4
  mixolydian: [0, 2, 4, 5, 7, 9, 10], // Major with b7
  aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural minor
  locrian: [0, 1, 3, 5, 6, 8, 10], // Half-diminished scale

  // Harmonic minor modes
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11], // Minor with major 7
  'phrygian-dominant': [0, 1, 4, 5, 7, 8, 10], // Dominant with b2, b6

  // Melodic minor modes
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11], // Jazz minor
  'dorian-b2': [0, 1, 3, 5, 7, 9, 10], // Phrygian #6
  'lydian-augmented': [0, 2, 4, 6, 8, 9, 11], // #4, #5
  'lydian-dominant': [0, 2, 4, 6, 7, 9, 10], // Acoustic scale
  'mixolydian-b6': [0, 2, 4, 5, 7, 8, 10], // Hindu scale
  'locrian-natural2': [0, 2, 3, 5, 6, 8, 10], // Half-dim with natural 2
  altered: [0, 1, 3, 4, 6, 8, 10], // Super Locrian

  // Pentatonic
  'major-pentatonic': [0, 2, 4, 7, 9],
  'minor-pentatonic': [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10], // Minor penta + b5

  // Symmetric
  'whole-tone': [0, 2, 4, 6, 8, 10],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11], // Half-whole
  'diminished-wh': [0, 1, 3, 4, 6, 7, 9, 10], // Whole-half
};

// ===================================
// BUILD SCALE FROM ROOT + INTERVALS
// ===================================

function buildScale(root: NoteName, intervals: number[]): NoteName[] {
  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    return CHROMATIC_NOTES[noteIndex];
  });
}

// ===================================
// CHORD-SCALE MATCHING RULES
// ===================================

/**
 * Get best scale matches for a chord
 */
export function getScaleMatches(chord: ParsedChord): ScaleMatch[] {
  const matches: ScaleMatch[] = [];

  switch (chord.quality) {
    case 'maj':
    case 'maj7':
    case 'maj9':
      matches.push(
        createMatch(chord.root, 'ionian', 'primary', 'Bright, happy, consonant', 'Default major sound'),
        createMatch(chord.root, 'lydian', 'secondary', 'Dreamy, open, #4 sweetness', 'For more color than plain major'),
        createMatch(chord.root, 'major-pentatonic', 'alternative', 'Simple, folk, rock', 'Safe, no avoid notes'),
      );
      break;

    case 'm':
    case 'm7':
    case 'm9':
      matches.push(
        createMatch(chord.root, 'dorian', 'primary', 'Bright minor, major 6th', 'THE jazz minor sound'),
        createMatch(chord.root, 'aeolian', 'secondary', 'Natural minor, darker', 'Sadder, more emotional'),
        createMatch(chord.root, 'phrygian', 'alternative', 'Dark, Spanish, b2', 'For exotic/flamenco flavor'),
        createMatch(chord.root, 'minor-pentatonic', 'alternative', 'Blues, rock, simple', 'Safe, no avoid notes'),
      );
      break;

    case '7':
    case '9':
    case '13':
      matches.push(
        createMatch(chord.root, 'mixolydian', 'primary', 'Bright dominant, major sound', 'Rock, funk, blues'),
        createMatch(chord.root, 'lydian-dominant', 'secondary', 'Jazz dominant, #4', 'Sophisticated, bebop'),
        createMatch(chord.root, 'mixolydian-b6', 'alternative', 'Dark dominant, minor 6th', 'For bluesy feel'),
        createMatch(chord.root, 'blues', 'alternative', 'Blues scale', 'Classic blues sound'),
      );
      break;

    case '7alt':
    case '7#9':
    case '7b9':
      matches.push(
        createMatch(chord.root, 'altered', 'primary', 'Maximum tension, all alterations', 'THE altered dominant scale'),
        createMatch(chord.root, 'diminished-wh', 'secondary', 'Whole-half diminished', 'For b9, #9, #11, 13'),
        createMatch(chord.root, 'phrygian-dominant', 'alternative', 'Exotic dominant, b2 b6', 'Spanish/metal flavor'),
      );
      break;

    case 'm7b5':
      matches.push(
        createMatch(chord.root, 'locrian', 'primary', 'Half-diminished scale, b2 b5', 'Classic m7b5 sound'),
        createMatch(chord.root, 'locrian-natural2', 'secondary', 'Softer half-dim, natural 2', 'Jazzier, less dark'),
      );
      break;

    case 'dim':
    case 'dim7':
      matches.push(
        createMatch(chord.root, 'diminished', 'primary', 'Half-whole diminished', 'Symmetrical, tense'),
        createMatch(chord.root, 'whole-tone', 'alternative', 'Whole tone scale', 'Dreamy, floating, no resolution'),
      );
      break;

    case 'mMaj7':
      matches.push(
        createMatch(chord.root, 'harmonic-minor', 'primary', 'Minor with major 7th', 'Classical minor, dramatic'),
        createMatch(chord.root, 'melodic-minor', 'secondary', 'Jazz minor', 'Sophisticated, modern jazz'),
      );
      break;

    case 'aug':
    case 'maj7#5':
      matches.push(
        createMatch(chord.root, 'lydian-augmented', 'primary', 'Major #4 #5', 'Dreamy, floating, impressionistic'),
        createMatch(chord.root, 'whole-tone', 'secondary', 'Whole tone scale', 'Maximum augmented color'),
      );
      break;

    case 'sus4':
      matches.push(
        createMatch(chord.root, 'mixolydian', 'primary', 'Sus4 from mixolydian', 'Open, unresolved'),
        createMatch(chord.root, 'dorian', 'alternative', 'Sus4 from dorian', 'Minor color'),
      );
      break;

    case 'sus2':
      matches.push(
        createMatch(chord.root, 'major-pentatonic', 'primary', 'Pentatonic over sus2', 'Open, simple'),
        createMatch(chord.root, 'mixolydian', 'secondary', 'Sus2 from mixolydian', 'More defined'),
      );
      break;

    default:
      // Fallback: ionian for unknown chords
      matches.push(createMatch(chord.root, 'ionian', 'primary', 'Major scale default', 'Safe choice'));
  }

  return matches;
}

function createMatch(
  root: NoteName,
  scaleType: string,
  priority: 'primary' | 'secondary' | 'alternative',
  characteristic: string,
  context?: string,
): ScaleMatch {
  const intervals = SCALE_INTERVALS[scaleType];
  const notes = buildScale(root, intervals);

  // Calcola avoid notes (se necessario)
  const avoidNotes = getAvoidNotes(scaleType, notes);

  return {
    scaleName: formatScaleName(scaleType),
    root,
    notes,
    priority,
    characteristic,
    avoidNotes,
    context,
  };
}

function formatScaleName(scaleType: string): string {
  const names: Record<string, string> = {
    ionian: 'Ionian (Major)',
    dorian: 'Dorian',
    phrygian: 'Phrygian',
    lydian: 'Lydian',
    mixolydian: 'Mixolydian',
    aeolian: 'Aeolian (Natural Minor)',
    locrian: 'Locrian',
    'harmonic-minor': 'Harmonic Minor',
    'phrygian-dominant': 'Phrygian Dominant',
    'melodic-minor': 'Melodic Minor',
    'dorian-b2': 'Dorian ♭2',
    'lydian-augmented': 'Lydian Augmented',
    'lydian-dominant': 'Lydian Dominant',
    'mixolydian-b6': 'Mixolydian ♭6',
    'locrian-natural2': 'Locrian ♮2',
    altered: 'Altered (Super Locrian)',
    'major-pentatonic': 'Major Pentatonic',
    'minor-pentatonic': 'Minor Pentatonic',
    blues: 'Blues Scale',
    'whole-tone': 'Whole Tone',
    diminished: 'Diminished (Half-Whole)',
    'diminished-wh': 'Diminished (Whole-Half)',
  };

  return names[scaleType] || scaleType;
}

function getAvoidNotes(scaleType: string, scaleNotes: NoteName[]): NoteName[] | undefined {
  // In chord-scale theory, certain notes should be avoided as melody notes
  // over specific chords because they clash with the harmony

  // Ionian: avoid 4 (unless passing)
  if (scaleType === 'ionian' && scaleNotes.length >= 4) {
    return [scaleNotes[3]]; // 4th degree
  }

  // Mixolydian: avoid 4 (unless passing)
  if (scaleType === 'mixolydian' && scaleNotes.length >= 4) {
    return [scaleNotes[3]]; // 4th degree
  }

  // Dorian: generally no avoid notes (that's why it's so versatile!)

  // Phrygian: avoid b2 and b6 (unless you want that sound)
  if (scaleType === 'phrygian' && scaleNotes.length >= 6) {
    return [scaleNotes[1], scaleNotes[5]]; // b2, b6
  }

  return undefined;
}

// ===================================
// ANALYZE MULTIPLE CHORDS
// ===================================

/**
 * Analyze scale choices for a full progression
 */
export function analyzeProgressionScales(chords: ParsedChord[]): ChordScaleAnalysis[] {
  return chords.map((chord) => ({
    chord,
    scales: getScaleMatches(chord),
  }));
}

// ===================================
// GET COMMON TONES
// ===================================

/**
 * Find common tones between two scales (for smooth voice leading)
 */
export function getCommonTones(scale1: NoteName[], scale2: NoteName[]): NoteName[] {
  return scale1.filter((note) => scale2.includes(note));
}

/**
 * Find ALL notes that work over a chord progression
 * (intersection of all scale choices)
 */
export function getUniversalNotes(chords: ParsedChord[]): NoteName[] {
  if (chords.length === 0) return [];

  const analyses = analyzeProgressionScales(chords);

  // Start with first chord's primary scale
  let commonNotes = analyses[0].scales[0].notes;

  // Intersect with each subsequent chord's primary scale
  for (let i = 1; i < analyses.length; i++) {
    const currentScale = analyses[i].scales[0].notes;
    commonNotes = getCommonTones(commonNotes, currentScale);
  }

  return commonNotes;
}

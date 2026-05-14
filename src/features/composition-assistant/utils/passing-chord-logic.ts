/**
 * PASSING CHORD LOGIC - DETERMINISTIC
 * Genera accordi di passaggio, approcci cromatici, sostituzioni
 */

import type { NoteName } from '../../../shared/types/music.types';
import type { ParsedChord, ChordQuality } from './chord-analysis';

// ===================================
// TYPES
// ===================================

export interface PassingChordSuggestion {
  type: 'diatonic' | 'chromatic' | 'diminished' | 'dominant' | 'secondary-dominant';
  chord: ParsedChord;
  position: 'before' | 'between' | 'after';
  targetChord?: ParsedChord;
  description: string;
  jazziness: number; // 1-10 scale of how "jazz" this sounds
}

// ===================================
// CHROMATIC NOTES
// ===================================

const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ===================================
// CHROMATIC APPROACHES
// ===================================

/**
 * Generate chromatic approach chords
 * Example: Cmaj7 → target Fmaj7
 * Suggestions: Emaj7 (from below), Gbmaj7 (from above)
 */
export function getChromaticApproaches(fromChord: ParsedChord, toChord: ParsedChord): PassingChordSuggestion[] {
  const suggestions: PassingChordSuggestion[] = [];

  const targetRoot = toChord.root;
  const targetIndex = CHROMATIC_NOTES.indexOf(targetRoot);

  // Approach from half-step below
  const belowIndex = (targetIndex - 1 + 12) % 12;
  const belowRoot = CHROMATIC_NOTES[belowIndex];

  suggestions.push({
    type: 'chromatic',
    chord: {
      root: belowRoot,
      quality: toChord.quality, // Same quality as target
      extensions: [],
      original: `${belowRoot}${getQualitySymbol(toChord.quality)}`,
    },
    position: 'between',
    targetChord: toChord,
    description: `Chromatic approach from below (${belowRoot} → ${targetRoot})`,
    jazziness: 7,
  });

  // Approach from half-step above
  const aboveIndex = (targetIndex + 1) % 12;
  const aboveRoot = CHROMATIC_NOTES[aboveIndex];

  suggestions.push({
    type: 'chromatic',
    chord: {
      root: aboveRoot,
      quality: toChord.quality,
      extensions: [],
      original: `${aboveRoot}${getQualitySymbol(toChord.quality)}`,
    },
    position: 'between',
    targetChord: toChord,
    description: `Chromatic approach from above (${aboveRoot} → ${targetRoot})`,
    jazziness: 7,
  });

  return suggestions;
}

// ===================================
// DIMINISHED APPROACHES
// ===================================

/**
 * Generate diminished 7th passing chords
 * Diminished chords can approach ANY note a half-step away
 */
export function getDiminishedApproaches(toChord: ParsedChord): PassingChordSuggestion[] {
  const suggestions: PassingChordSuggestion[] = [];

  const targetRoot = toChord.root;
  const targetIndex = CHROMATIC_NOTES.indexOf(targetRoot);

  // Diminished from half-step below (most common)
  const belowIndex = (targetIndex - 1 + 12) % 12;
  const belowRoot = CHROMATIC_NOTES[belowIndex];

  suggestions.push({
    type: 'diminished',
    chord: {
      root: belowRoot,
      quality: 'dim7',
      extensions: [],
      original: `${belowRoot}°7`,
    },
    position: 'between',
    targetChord: toChord,
    description: `Diminished approach (${belowRoot}°7 → ${targetRoot}) - Classic jazz move`,
    jazziness: 8,
  });

  // Note: Diminished 7 chords are symmetrical (repeat every minor 3rd)
  // So the same dim7 can approach 4 different roots

  return suggestions;
}

// ===================================
// SECONDARY DOMINANTS
// ===================================

/**
 * Generate secondary dominant (V7/x)
 * Example: Going to Dm7? Insert A7 (V7 of Dm)
 */
export function getSecondaryDominant(toChord: ParsedChord): PassingChordSuggestion | null {
  // Find the V7 of the target chord
  const targetRoot = toChord.root;
  const targetIndex = CHROMATIC_NOTES.indexOf(targetRoot);

  // Dominant is a perfect 5th above (7 semitones)
  const dominantIndex = (targetIndex + 7) % 12;
  const dominantRoot = CHROMATIC_NOTES[dominantIndex];

  return {
    type: 'secondary-dominant',
    chord: {
      root: dominantRoot,
      quality: '7',
      extensions: [],
      original: `${dominantRoot}7`,
    },
    position: 'before',
    targetChord: toChord,
    description: `Secondary dominant (V7/${targetRoot}) - creates strong pull`,
    jazziness: 6,
  };
}

// ===================================
// TRITONE SUBSTITUTION
// ===================================

/**
 * Tritone substitution of a dominant chord
 * Replace V7 with bII7 (tritone away)
 */
export function getTritoneSubstitution(dominantChord: ParsedChord): PassingChordSuggestion | null {
  // Only works on dominant chords
  if (!['7', '9', '13', '7alt'].includes(dominantChord.quality)) {
    return null;
  }

  const rootIndex = CHROMATIC_NOTES.indexOf(dominantChord.root);
  const tritoneIndex = (rootIndex + 6) % 12; // Tritone = 6 semitones
  const tritoneRoot = CHROMATIC_NOTES[tritoneIndex];

  return {
    type: 'dominant',
    chord: {
      root: tritoneRoot,
      quality: '7',
      extensions: [],
      original: `${tritoneRoot}7`,
    },
    position: 'between',
    description: `Tritone sub (${dominantChord.root}7 → ${tritoneRoot}7) - smooth bass motion`,
    jazziness: 9,
  };
}

// ===================================
// DIATONIC PASSING CHORDS
// ===================================

/**
 * Insert diatonic passing chord between two chords
 * Example: Cmaj7 → Fmaj7 → insert Dm7 or Em7
 */
export function getDiatonicPassing(
  fromChord: ParsedChord,
  toChord: ParsedChord,
  key: NoteName,
  mode: 'major' | 'minor',
): PassingChordSuggestion[] {
  const suggestions: PassingChordSuggestion[] = [];

  const scale = getScale(key, mode);
  const fromIndex = scale.indexOf(fromChord.root);
  const toIndex = scale.indexOf(toChord.root);

  if (fromIndex === -1 || toIndex === -1) {
    return []; // One of the chords is not diatonic
  }

  // Find notes between from and to in the scale
  const distance = Math.abs(toIndex - fromIndex);

  if (distance <= 1) {
    return []; // Too close, no passing chord needed
  }

  // Get intermediate notes
  const direction = toIndex > fromIndex ? 1 : -1;

  for (let i = 1; i < distance; i++) {
    const passingIndex = (fromIndex + i * direction + 7) % 7;
    const passingRoot = scale[passingIndex];
    const passingQuality = getDiatonicChordQuality(passingIndex, mode);

    suggestions.push({
      type: 'diatonic',
      chord: {
        root: passingRoot,
        quality: passingQuality,
        extensions: [],
        original: `${passingRoot}${getQualitySymbol(passingQuality)}`,
      },
      position: 'between',
      targetChord: toChord,
      description: `Diatonic passing chord in ${key} ${mode}`,
      jazziness: 4,
    });
  }

  return suggestions;
}

function getScale(root: NoteName, mode: 'major' | 'minor'): NoteName[] {
  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  const intervals = mode === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];

  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    return CHROMATIC_NOTES[noteIndex];
  });
}

function getDiatonicChordQuality(degreeIndex: number, mode: 'major' | 'minor'): ChordQuality {
  if (mode === 'major') {
    // I - ii - iii - IV - V - vi - vii°
    const qualities: ChordQuality[] = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
    return qualities[degreeIndex];
  } else {
    // i - ii° - ♭III - iv - v - ♭VI - ♭VII
    const qualities: ChordQuality[] = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];
    return qualities[degreeIndex];
  }
}

// ===================================
// II-V INSERTION
// ===================================

/**
 * Insert a ii-V before a target chord
 * Example: Going to Cmaj7? Insert Dm7 - G7 - Cmaj7
 */
export function getTwoFiveInsertion(toChord: ParsedChord): PassingChordSuggestion[] {
  const targetRoot = toChord.root;
  const targetIndex = CHROMATIC_NOTES.indexOf(targetRoot);

  // ii is a whole step above target
  const iiIndex = (targetIndex + 2) % 12;
  const iiRoot = CHROMATIC_NOTES[iiIndex];

  // V is a perfect 5th above target
  const vIndex = (targetIndex + 7) % 12;
  const vRoot = CHROMATIC_NOTES[vIndex];

  // Determine ii quality based on target
  const iiQuality: ChordQuality = ['maj', 'maj7', 'maj9'].includes(toChord.quality)
    ? 'm7' // Major target → ii-7
    : 'm7b5'; // Minor target → iiø7

  return [
    {
      type: 'diatonic',
      chord: {
        root: iiRoot,
        quality: iiQuality,
        extensions: [],
        original: `${iiRoot}${getQualitySymbol(iiQuality)}`,
      },
      position: 'before',
      targetChord: toChord,
      description: `ii chord of ii-V-I to ${targetRoot}`,
      jazziness: 8,
    },
    {
      type: 'dominant',
      chord: {
        root: vRoot,
        quality: '7',
        extensions: [],
        original: `${vRoot}7`,
      },
      position: 'before',
      targetChord: toChord,
      description: `V7 chord of ii-V-I to ${targetRoot}`,
      jazziness: 8,
    },
  ];
}

// ===================================
// ALL PASSING CHORD SUGGESTIONS
// ===================================

/**
 * Get ALL possible passing chord suggestions between two chords
 */
export function getAllPassingChords(
  fromChord: ParsedChord,
  toChord: ParsedChord,
  key?: NoteName,
  mode?: 'major' | 'minor',
): PassingChordSuggestion[] {
  const suggestions: PassingChordSuggestion[] = [];

  // 1. Chromatic approaches
  suggestions.push(...getChromaticApproaches(fromChord, toChord));

  // 2. Diminished approaches
  suggestions.push(...getDiminishedApproaches(toChord));

  // 3. Secondary dominant
  const secDom = getSecondaryDominant(toChord);
  if (secDom) suggestions.push(secDom);

  // 4. Tritone substitution (if fromChord is dominant)
  const tritoneSub = getTritoneSubstitution(fromChord);
  if (tritoneSub) suggestions.push(tritoneSub);

  // 5. Diatonic passing (if key is known)
  if (key && mode) {
    suggestions.push(...getDiatonicPassing(fromChord, toChord, key, mode));
  }

  // 6. ii-V insertion
  suggestions.push(...getTwoFiveInsertion(toChord));

  // Sort by jazziness (least jazzy first for beginners)
  return suggestions.sort((a, b) => a.jazziness - b.jazziness);
}

// ===================================
// HELPERS
// ===================================

function getQualitySymbol(quality: ChordQuality): string {
  const symbols: Record<ChordQuality, string> = {
    maj: '',
    maj7: 'maj7',
    maj9: 'maj9',
    m: 'm',
    m7: 'm7',
    m9: 'm9',
    mMaj7: 'mMaj7',
    '7': '7',
    '9': '9',
    '13': '13',
    dim: '°',
    dim7: '°7',
    m7b5: 'ø7',
    aug: '+',
    'maj7#5': 'maj7#5',
    sus2: 'sus2',
    sus4: 'sus4',
    '7alt': '7alt',
    '7#9': '7#9',
    '7b9': '7b9',
  };

  return symbols[quality] || '';
}

// ===================================
// REHARMONIZATION SUGGESTIONS
// ===================================

/**
 * Suggest alternative chords that can replace a given chord
 */
export function getReharmonizationOptions(chord: ParsedChord, key?: NoteName, mode?: 'major' | 'minor'): PassingChordSuggestion[] {
  const suggestions: PassingChordSuggestion[] = [];

  // Tritone substitution for dominants
  if (['7', '9', '13'].includes(chord.quality)) {
    const tritoneSub = getTritoneSubstitution(chord);
    if (tritoneSub) {
      tritoneSub.position = 'between'; // Replaces the original
      tritoneSub.description = `Tritone sub - smooth bass line`;
      suggestions.push(tritoneSub);
    }
  }

  // Relative major/minor substitution
  const rootIndex = CHROMATIC_NOTES.indexOf(chord.root);

  if (['maj', 'maj7'].includes(chord.quality)) {
    // Major → relative minor (down minor 3rd)
    const relMinorIndex = (rootIndex - 3 + 12) % 12;
    const relMinorRoot = CHROMATIC_NOTES[relMinorIndex];

    suggestions.push({
      type: 'diatonic',
      chord: {
        root: relMinorRoot,
        quality: 'm7',
        extensions: [],
        original: `${relMinorRoot}m7`,
      },
      position: 'between',
      description: `Relative minor substitution`,
      jazziness: 5,
    });
  }

  if (['m', 'm7'].includes(chord.quality)) {
    // Minor → relative major (up minor 3rd)
    const relMajorIndex = (rootIndex + 3) % 12;
    const relMajorRoot = CHROMATIC_NOTES[relMajorIndex];

    suggestions.push({
      type: 'diatonic',
      chord: {
        root: relMajorRoot,
        quality: 'maj7',
        extensions: [],
        original: `${relMajorRoot}maj7`,
      },
      position: 'between',
      description: `Relative major substitution`,
      jazziness: 5,
    });
  }

  return suggestions;
}

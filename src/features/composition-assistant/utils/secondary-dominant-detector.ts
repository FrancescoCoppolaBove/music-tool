/**
 * SECONDARY DOMINANT & TRITONE SUB DETECTOR
 * Rileva V7/X, subV7, ii-V patterns
 */

import type { NoteName } from '../../../shared/types/music.types';
import type { ParsedChord } from './chord-analysis';

const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export interface SecondaryDominant {
  dominantChord: ParsedChord;
  dominantSymbol: string;
  targetChord: ParsedChord;
  targetSymbol: string;
  function: string; // "V7/i", "V7/IV", etc.
  type: 'secondary-dominant' | 'tritone-sub' | 'primary-dominant';
  alterations: string[]; // ["b9", "#9", "alt"]
  effect: string;
}

export interface TwoFivePattern {
  ii: ParsedChord;
  V: ParsedChord;
  target: ParsedChord;
  function: string; // "ii-V/i"
  effect: string;
}

export interface DominantAnalysis {
  secondaryDominants: SecondaryDominant[];
  tritoneSubstitutions: SecondaryDominant[];
  twoFivePatterns: TwoFivePattern[];
}

// ===================================
// DETECT SECONDARY DOMINANTS
// ===================================

export function detectSecondaryDominants(chords: ParsedChord[]): DominantAnalysis {
  const secondaryDominants: SecondaryDominant[] = [];
  const tritoneSubstitutions: SecondaryDominant[] = [];
  const twoFivePatterns: TwoFivePattern[] = [];

  for (let i = 0; i < chords.length - 1; i++) {
    const current = chords[i];
    const next = chords[i + 1];

    // Check if current is a dominant chord (7, 9, 13, 7alt, etc.)
    if (isDominantQuality(current.quality)) {
      // Check if it resolves down a 5th (V → I motion)
      const interval = getInterval(current.root, next.root);

      if (interval === 7 || interval === 5) {
        // Down a 5th or up a 4th = dominant resolution
        const functionName = getRomanNumeralForTarget(next, chords);
        const alterations = extractAlterations(current);

        const isTritoneSub = isTritoneSubstitution(current.root, next.root);
        const type = i === chords.length - 2 ? 'primary-dominant' : 'secondary-dominant';

        const dominantInfo: SecondaryDominant = {
          dominantChord: current,
          dominantSymbol: current.original,
          targetChord: next,
          targetSymbol: next.original,
          function: `V7/${functionName}`,
          type: isTritoneSub ? 'tritone-sub' : type,
          alterations,
          effect: getDominantEffect(current, next, alterations, isTritoneSub),
        };

        if (isTritoneSub) {
          tritoneSubstitutions.push(dominantInfo);
        } else {
          secondaryDominants.push(dominantInfo);
        }
      }
    }

    // Check for ii-V patterns
    if (i < chords.length - 2) {
      const pattern = detectTwoFivePattern(chords[i], chords[i + 1], chords[i + 2]);
      if (pattern) {
        twoFivePatterns.push(pattern);
      }
    }
  }

  return {
    secondaryDominants,
    tritoneSubstitutions,
    twoFivePatterns,
  };
}

// ===================================
// HELPERS
// ===================================

function isDominantQuality(quality: string): boolean {
  const q = quality.toLowerCase();
  return (
    q.includes('7') &&
    !q.includes('maj7') &&
    !q.includes('m7') &&
    !q.includes('mmaj7') &&
    !q.includes('m△7')
  );
}

function getInterval(from: NoteName, to: NoteName): number {
  const fromIndex = CHROMATIC_NOTES.indexOf(from);
  const toIndex = CHROMATIC_NOTES.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) return -1;

  return (toIndex - fromIndex + 12) % 12;
}

function isTritoneSubstitution(dominantRoot: NoteName, targetRoot: NoteName): boolean {
  // SubV7 is a tritone (6 semitones) away from the normal V7
  // Normal V7 would be 7 semitones above target (5th up)
  // SubV7 is 1 semitone above target (half-step resolution)

  const interval = getInterval(dominantRoot, targetRoot);
  return interval === 1; // Half-step down resolution = tritone sub
}

function extractAlterations(chord: ParsedChord): string[] {
  const alterations: string[] = [];

  if (!chord.extensions) return alterations;

  for (const ext of chord.extensions) {
    if (ext.includes('b9') || ext.includes('♭9')) alterations.push('b9');
    if (ext.includes('#9') || ext.includes('♯9')) alterations.push('#9');
    if (ext.includes('#11') || ext.includes('♯11')) alterations.push('#11');
    if (ext.includes('b13') || ext.includes('♭13')) alterations.push('b13');
    if (ext.includes('alt')) {
      alterations.push('b9', '#9', '#11', 'b13');
    }
  }

  return alterations;
}

function getRomanNumeralForTarget(target: ParsedChord, allChords: ParsedChord[]): string {
  // Simple heuristic: if target is most common chord, call it "i" or "I"
  // Otherwise use generic "target"

  const targetCount = allChords.filter((c) => c.root === target.root).length;
  const isLikelyTonic = targetCount >= 2;

  if (isLikelyTonic) {
    return target.quality.includes('m') ? 'i' : 'I';
  }

  // Try to guess based on quality
  if (target.quality.includes('m')) {
    return 'iv'; // Guess subdominant minor
  }

  return 'target';
}

function getDominantEffect(
  dominant: ParsedChord,
  target: ParsedChord,
  alterations: string[],
  isTritoneSub: boolean
): string {
  if (isTritoneSub) {
    return `TRITONE SUBSTITUTION - ${dominant.original} substitutes for the normal V7, creates smooth chromatic bass line`;
  }

  if (alterations.length > 0) {
    const altList = alterations.join(', ');
    return `Creates MAXIMUM TENSION with alterations (${altList}) before resolving to ${target.original}`;
  }

  return `Creates dominant tension, pulls strongly to ${target.original}`;
}

// ===================================
// ii-V PATTERN DETECTION
// ===================================

function detectTwoFivePattern(
  chord1: ParsedChord,
  chord2: ParsedChord,
  chord3: ParsedChord
): TwoFivePattern | null {
  // Check if chord1 is minor 7th (ii)
  if (!chord1.quality.includes('m7')) return null;

  // Check if chord2 is dominant (V)
  if (!isDominantQuality(chord2.quality)) return null;

  // Check if they are a 5th apart (ii → V)
  const interval12 = getInterval(chord1.root, chord2.root);
  if (interval12 !== 7 && interval12 !== 5) return null;

  // Check if V resolves to target
  const interval23 = getInterval(chord2.root, chord3.root);
  if (interval23 !== 7 && interval23 !== 5) return null;

  // It's a ii-V!
  const targetFunction = chord3.quality.includes('m') ? 'i' : 'I';

  return {
    ii: chord1,
    V: chord2,
    target: chord3,
    function: `ii-V/${targetFunction}`,
    effect: `Classic ii-V resolution to ${chord3.original} - creates strong forward motion`,
  };
}

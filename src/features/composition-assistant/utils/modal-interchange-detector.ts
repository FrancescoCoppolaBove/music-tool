/**
 * MODAL INTERCHANGE DETECTOR
 * Rileva accordi borrowed da modi paralleli
 */

import type { NoteName } from '../../../shared/types/music.types';
import type { ParsedChord } from './chord-analysis';
import { findModesContainingChord, PARALLEL_MODES } from './parallel-modes-database';

export interface BorrowedChord {
  chord: ParsedChord;
  chordSymbol: string;
  sourceMode: string; // Da quale modo è borrowed
  degree: string; // bVI, bII, etc.
  degreeIndex: number;
  effect: string; // Descrizione dell'effetto armonico
  color: string; // Colore aggiunto dalle estensioni
  scaleSource?: string; // Scala di riferimento (se extensions)
}

export interface ModalInterchangeAnalysis {
  baseMode: string; // Il modo principale
  borrowedChords: BorrowedChord[];
  diatonicChords: Array<{
    chord: ParsedChord;
    degree: string;
    degreeIndex: number;
  }>;
}

// ===================================
// DETECT MODAL INTERCHANGE
// ===================================

export function detectModalInterchange(
  chords: ParsedChord[],
  modalCenter: NoteName,
  baseMode: string = 'dorian' // Default assumption
): ModalInterchangeAnalysis {
  const borrowedChords: BorrowedChord[] = [];
  const diatonicChords: Array<{
    chord: ParsedChord;
    degree: string;
    degreeIndex: number;
  }> = [];

  for (const chord of chords) {
    // Find which modes contain this chord
    const modesContaining = findModesContainingChord(modalCenter, chord.root, chord.quality);

    if (modesContaining.length === 0) {
      // Chromatic chord - not in any parallel mode
      continue;
    }

    // Check if it's in the base mode
    const isInBaseMode = modesContaining.some((m) => m.mode === baseMode);

    if (isInBaseMode) {
      // Diatonic to base mode
      const baseModeInfo = modesContaining.find((m) => m.mode === baseMode)!;
      diatonicChords.push({
        chord,
        degree: baseModeInfo.degree,
        degreeIndex: baseModeInfo.degreeIndex,
      });
    } else {
      // Borrowed from another mode!
      const sourceMode = modesContaining[0]; // Pick first match

      // Determine effect based on source mode
      const effect = getModalInterchangeEffect(sourceMode.mode, sourceMode.degree);

      // Analyze extensions for color
      const { color, scaleSource } = analyzeExtensionColor(chord, sourceMode.mode);

      borrowedChords.push({
        chord,
        chordSymbol: chord.original,
        sourceMode: sourceMode.mode,
        degree: sourceMode.degree,
        degreeIndex: sourceMode.degreeIndex,
        effect,
        color,
        scaleSource,
      });
    }
  }

  return {
    baseMode,
    borrowedChords,
    diatonicChords,
  };
}

// ===================================
// EFFECT DESCRIPTIONS
// ===================================

function getModalInterchangeEffect(sourceMode: string, degree: string): string {
  const effects: Record<string, Record<string, string>> = {
    aeolian: {
      'bVI': 'Brightens the sound - borrowed major submediant from natural minor',
      'bVII': 'Rock/modal dominant - borrowed from Aeolian/Mixolydian',
      iv: 'Subdominant minor - creates darker pull',
    },
    phrygian: {
      'bII': 'Strong tension - Phrygian darkness, almost Spanish/flamenco',
      'bIII': 'Borrowed major mediant - adds color',
      'bVI': 'Dark major chord from Phrygian',
    },
    lydian: {
      'II': 'Bright major supertonic - Lydian color',
      '#IV': 'Tritone - Lydian characteristic, very bright',
    },
    mixolydian: {
      'bVII': 'Rock dominant - very common in rock/pop',
      'V': 'Major V from Mixolydian',
    },
    ionian: {
      'IV': 'Borrowed major subdominant - brightens minor key',
      'V': 'Major V - creates strong dominant pull',
    },
  };

  return effects[sourceMode]?.[degree] || `Borrowed from ${sourceMode}`;
}

// ===================================
// EXTENSION COLOR ANALYSIS
// ===================================

function analyzeExtensionColor(
  chord: ParsedChord,
  sourceMode: string
): { color: string; scaleSource?: string } {
  if (!chord.extensions || chord.extensions.length === 0) {
    return { color: 'Natural voicing' };
  }

  const colors: string[] = [];
  let scaleSource: string | undefined;

  for (const ext of chord.extensions) {
    if (ext.includes('#11') || ext.includes('♯11')) {
      colors.push('LYDIAN COLOR - bright, open, "opens the sky"');
      scaleSource = `${chord.root} Lydian`;
    } else if (ext.includes('alt')) {
      colors.push('ALTERED - maximum tension, all alterations (b9, #9, #11, b13)');
      scaleSource = `${chord.root} Altered (7th mode of Db Melodic Minor)`;
    } else if (ext.includes('sus4')) {
      colors.push('SUSPENSION - delays resolution, creates anticipation');
    } else if (ext.includes('9')) {
      colors.push('Add 9 - brightness and openness');
    } else if (ext.includes('b9')) {
      colors.push('b9 - dark, exotic, Phrygian/Altered color');
    } else if (ext.includes('#9')) {
      colors.push('#9 - bluesy, Hendrix sound');
    } else if (ext.includes('13')) {
      colors.push('13 - rich, full voicing');
    } else if (ext.includes('b13')) {
      colors.push('b13 - dark minor color');
    }
  }

  return {
    color: colors.length > 0 ? colors.join(' + ') : 'Natural voicing',
    scaleSource,
  };
}

// ===================================
// AUTO-DETECT BASE MODE
// ===================================

export function detectBaseMode(chords: ParsedChord[], modalCenter: NoteName): string {
  // Try to detect which mode is most likely the "home" mode
  // Strategy: count which mode has the most diatonic matches

  const modeCounts: Record<string, number> = {};

  for (const chord of chords) {
    const modesContaining = findModesContainingChord(modalCenter, chord.root, chord.quality);

    for (const modeInfo of modesContaining) {
      modeCounts[modeInfo.mode] = (modeCounts[modeInfo.mode] || 0) + 1;
    }
  }

  // Find mode with highest count
  let maxCount = 0;
  let detectedMode = 'dorian'; // Default

  for (const [mode, count] of Object.entries(modeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedMode = mode;
    }
  }

  return detectedMode;
}

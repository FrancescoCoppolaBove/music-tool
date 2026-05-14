/**
 * ADVANCED MODAL ANALYSIS
 * Sistema completo di analisi modale avanzata
 */

import type { NoteName } from '../../../shared/types/music.types';
import type { ParsedChord, ProgressionAnalysis } from './chord-analysis';
import { analyzeModalProgression, type ModalAnalysis } from './modal-analysis';
import { detectModalInterchange, detectBaseMode, type ModalInterchangeAnalysis, type BorrowedChord } from './modal-interchange-detector';
import {
  detectSecondaryDominants,
  type DominantAnalysis,
  type SecondaryDominant,
  type TwoFivePattern,
} from './secondary-dominant-detector';

export interface AdvancedModalAnalysis {
  // Basic modal info
  isModal: boolean;
  modalStability: number;
  modalCenter?: NoteName;
  baseMode?: string;

  // Modal Interchange
  modalInterchange: ModalInterchangeAnalysis;

  // Secondary Dominants & Subs
  dominantAnalysis: DominantAnalysis;

  // Chord-by-chord breakdown
  chordBreakdown: ChordAnalysisDetail[];

  // Harmonic Journey
  harmonicJourney: HarmonicJourneyStep[];

  // Summary
  summary: {
    totalChords: number;
    diatonicCount: number;
    borrowedCount: number;
    secondaryDominantCount: number;
    tritoneSubCount: number;
    modalWritingQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface ChordAnalysisDetail {
  index: number;
  chord: ParsedChord;
  symbol: string;

  // Classification
  classification: 'diatonic' | 'borrowed' | 'secondary-dominant' | 'tritone-sub' | 'chromatic';

  // Diatonic info
  degree?: string;
  degreeIndex?: number;
  function?: string; // "tonic", "subdominant", etc.

  // Borrowed info
  borrowedFrom?: string; // Source mode
  borrowedDegree?: string;

  // Dominant info
  dominantFunction?: string; // "V7/i"
  dominantTarget?: string;

  // Extensions & Color
  extensions: string[];
  color: string;
  scaleSource?: string;

  // Effect
  effect: string;
}

export interface HarmonicJourneyStep {
  step: number;
  description: string;
  chords: string[];
  emotion: 'stable' | 'bright' | 'dark' | 'tense' | 'resolved';
}

// ===================================
// MAIN ANALYSIS FUNCTION
// ===================================

export function analyzeAdvancedModal(progression: ProgressionAnalysis): AdvancedModalAnalysis {
  if (!progression.chords || progression.chords.length === 0) {
    return createEmptyAnalysis();
  }

  // 1. Basic modal analysis
  const basicModalAnalysis = analyzeModalProgression(progression);

  if (!basicModalAnalysis.isModal) {
    // If not modal, return simplified analysis
    return {
      isModal: false,
      modalStability: basicModalAnalysis.modalStability,
      modalInterchange: {
        baseMode: 'none',
        borrowedChords: [],
        diatonicChords: [],
      },
      dominantAnalysis: {
        secondaryDominants: [],
        tritoneSubstitutions: [],
        twoFivePatterns: [],
      },
      chordBreakdown: [],
      harmonicJourney: [],
      summary: {
        totalChords: progression.chords.length,
        diatonicCount: 0,
        borrowedCount: 0,
        secondaryDominantCount: 0,
        tritoneSubCount: 0,
        modalWritingQuality: 'poor',
      },
    };
  }

  // 2. Detect modal center
  const modalCenter = (basicModalAnalysis.tonicChord?.root || progression.key || 'C') as NoteName;

  // 3. Detect base mode
  const baseMode = detectBaseMode(
    progression.chords.map((c) => c.chord),
    modalCenter,
  );

  // 4. Modal Interchange Analysis
  const modalInterchange = detectModalInterchange(
    progression.chords.map((c) => c.chord),
    modalCenter,
    baseMode,
  );

  // 5. Secondary Dominant Analysis
  const dominantAnalysis = detectSecondaryDominants(progression.chords.map((c) => c.chord));

  // 6. Build chord-by-chord breakdown
  const chordBreakdown = buildChordBreakdown(
    progression.chords.map((c) => c.chord),
    modalInterchange,
    dominantAnalysis,
  );

  // 7. Generate harmonic journey
  const harmonicJourney = generateHarmonicJourney(chordBreakdown, modalCenter, baseMode);

  // 8. Calculate summary
  const summary = calculateSummary(chordBreakdown, basicModalAnalysis);

  return {
    isModal: true,
    modalStability: basicModalAnalysis.modalStability,
    modalCenter,
    baseMode,
    modalInterchange,
    dominantAnalysis,
    chordBreakdown,
    harmonicJourney,
    summary,
  };
}

// ===================================
// BUILD CHORD BREAKDOWN
// ===================================

function buildChordBreakdown(
  chords: ParsedChord[],
  modalInterchange: ModalInterchangeAnalysis,
  dominantAnalysis: DominantAnalysis,
): ChordAnalysisDetail[] {
  return chords.map((chord, index) => {
    const detail: ChordAnalysisDetail = {
      index,
      chord,
      symbol: chord.original,
      classification: 'diatonic',
      extensions: chord.extensions || [],
      color: 'Natural voicing',
      effect: '',
    };

    // Check if diatonic
    const diatonicMatch = modalInterchange.diatonicChords.find((dc) => dc.chord === chord);
    if (diatonicMatch) {
      detail.classification = 'diatonic';
      detail.degree = diatonicMatch.degree;
      detail.degreeIndex = diatonicMatch.degreeIndex;
      detail.function = getFunctionForDegree(diatonicMatch.degreeIndex);
      detail.effect = getDiatonicEffect(diatonicMatch.degree, detail.function);
    }

    // Check if borrowed
    const borrowedMatch = modalInterchange.borrowedChords.find((bc) => bc.chord === chord);
    if (borrowedMatch) {
      detail.classification = 'borrowed';
      detail.borrowedFrom = borrowedMatch.sourceMode;
      detail.borrowedDegree = borrowedMatch.degree;
      detail.color = borrowedMatch.color;
      detail.scaleSource = borrowedMatch.scaleSource;
      detail.effect = borrowedMatch.effect;
    }

    // Check if secondary dominant
    const secondaryDomMatch = dominantAnalysis.secondaryDominants.find((sd) => sd.dominantChord === chord);
    if (secondaryDomMatch) {
      detail.classification = 'secondary-dominant';
      detail.dominantFunction = secondaryDomMatch.function;
      detail.dominantTarget = secondaryDomMatch.targetSymbol;
      detail.extensions = secondaryDomMatch.alterations;
      detail.effect = secondaryDomMatch.effect;
    }

    // Check if tritone sub
    const tritoneSubMatch = dominantAnalysis.tritoneSubstitutions.find((ts) => ts.dominantChord === chord);
    if (tritoneSubMatch) {
      detail.classification = 'tritone-sub';
      detail.dominantFunction = tritoneSubMatch.function;
      detail.dominantTarget = tritoneSubMatch.targetSymbol;
      detail.effect = tritoneSubMatch.effect;
    }

    return detail;
  });
}

// ===================================
// HARMONIC JOURNEY
// ===================================

function generateHarmonicJourney(breakdown: ChordAnalysisDetail[], modalCenter: NoteName, baseMode: string): HarmonicJourneyStep[] {
  const journey: HarmonicJourneyStep[] = [];

  let currentEmotion: 'stable' | 'bright' | 'dark' | 'tense' | 'resolved' = 'stable';
  let currentStep: HarmonicJourneyStep = {
    step: 1,
    description: `${modalCenter} ${baseMode} (home)`,
    chords: [],
    emotion: 'stable',
  };

  for (const detail of breakdown) {
    // Determine emotion based on classification
    let newEmotion: any = currentEmotion;

    if (detail.classification === 'diatonic' && detail.function === 'tonic') {
      newEmotion = detail.index === 0 ? 'stable' : 'resolved';
    } else if (detail.classification === 'borrowed') {
      if (detail.borrowedFrom?.includes('lydian')) {
        newEmotion = 'bright';
      } else if (detail.borrowedFrom?.includes('phrygian')) {
        newEmotion = 'dark';
      }
    } else if (detail.classification === 'secondary-dominant' || detail.classification === 'tritone-sub') {
      newEmotion = 'tense';
    }

    // If emotion changed, start new step
    if (newEmotion !== currentEmotion && currentStep.chords.length > 0) {
      journey.push(currentStep);
      currentStep = {
        step: journey.length + 1,
        description: getEmotionDescription(detail),
        chords: [],
        emotion: newEmotion,
      };
      currentEmotion = newEmotion;
    }

    currentStep.chords.push(detail.symbol);
  }

  // Push final step
  if (currentStep.chords.length > 0) {
    journey.push(currentStep);
  }

  return journey;
}

function getEmotionDescription(detail: ChordAnalysisDetail): string {
  if (detail.classification === 'borrowed') {
    return `${detail.borrowedDegree} from ${detail.borrowedFrom} - ${detail.effect.split('-')[0].trim()}`;
  }
  if (detail.classification === 'secondary-dominant') {
    return `${detail.dominantFunction} - maximum tension`;
  }
  if (detail.classification === 'diatonic' && detail.function === 'tonic') {
    return 'Return home';
  }
  return 'Movement';
}

// ===================================
// HELPERS
// ===================================

function getFunctionForDegree(degreeIndex: number): string {
  const functions = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading-tone'];
  return functions[degreeIndex] || 'movement';
}

function getDiatonicEffect(degree: string, func: string): string {
  if (func === 'tonic') return 'Modal center - home base';
  if (func === 'subdominant') return 'Subdominant function - creates pull';
  if (func === 'dominant') return 'Dominant function - tension';
  return `${degree} - diatonic movement`;
}

function calculateSummary(breakdown: ChordAnalysisDetail[], basicModal: ModalAnalysis): AdvancedModalAnalysis['summary'] {
  const diatonicCount = breakdown.filter((c) => c.classification === 'diatonic').length;
  const borrowedCount = breakdown.filter((c) => c.classification === 'borrowed').length;
  const secondaryDominantCount = breakdown.filter((c) => c.classification === 'secondary-dominant').length;
  const tritoneSubCount = breakdown.filter((c) => c.classification === 'tritone-sub').length;

  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  if (basicModal.modalStability >= 80) quality = 'excellent';
  else if (basicModal.modalStability >= 60) quality = 'good';
  else if (basicModal.modalStability >= 40) quality = 'fair';

  return {
    totalChords: breakdown.length,
    diatonicCount,
    borrowedCount,
    secondaryDominantCount,
    tritoneSubCount,
    modalWritingQuality: quality,
  };
}

function createEmptyAnalysis(): AdvancedModalAnalysis {
  return {
    isModal: false,
    modalStability: 0,
    modalInterchange: {
      baseMode: 'none',
      borrowedChords: [],
      diatonicChords: [],
    },
    dominantAnalysis: {
      secondaryDominants: [],
      tritoneSubstitutions: [],
      twoFivePatterns: [],
    },
    chordBreakdown: [],
    harmonicJourney: [],
    summary: {
      totalChords: 0,
      diatonicCount: 0,
      borrowedCount: 0,
      secondaryDominantCount: 0,
      tritoneSubCount: 0,
      modalWritingQuality: 'poor',
    },
  };
}

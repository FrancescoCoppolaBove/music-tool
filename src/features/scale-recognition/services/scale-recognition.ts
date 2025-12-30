/**
 * SCALE RECOGNITION ENGINE V2
 *
 * FIX IMPLEMENTATI:
 * 1. Perfect match con root ha priorità ASSOLUTA
 * 2. Sequence detection: trova scale con sequenze contigue di note
 * 3. Scoring corretto: penalizza scale lunghe quando input è breve
 */

import scaleData from '../data/scale_data.json';

// ============================================================================
// TYPES
// ============================================================================

export interface NoteInput {
  note: string;
  pitchClass?: number;
}

export interface ScaleCandidate {
  scale_name: string;
  root: string;
  mode_name: string | null;
  matched_notes: string[];
  missing_scale_notes: string[];
  extra_notes: string[];
  coverage_ratio: number;
  purity_ratio: number;
  score_0_100: number;
  probability_percent: number;
  explanation: string;
  raw_intervals: number[];
  // NUOVO: sequence matching
  has_contiguous_sequence?: boolean;
  sequence_position?: 'start' | 'middle' | 'end' | null;
  sequence_length?: number;
}

export interface ScaleRecognitionResult {
  input_notes_normalized: string[];
  input_pitch_classes: number[];
  candidates: ScaleCandidate[];
  top_guess: ScaleCandidate | null;
  analysis_metadata: {
    total_candidates_analyzed: number;
    execution_time_ms: number;
  };
}

interface ScaleData {
  scale_name: string;
  root: string;
  notes: string;
  interval_pattern: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const PITCH_CLASS_TO_NOTE = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

// ============================================================================
// NORMALIZZAZIONE
// ============================================================================

export function normalizeToPitchClass(note: string): number | null {
  note = note.trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/♮/g, '');
  if (note.includes('/')) note = note.split('/')[0];
  const pitchClass = NOTE_TO_PITCH_CLASS[note];
  return pitchClass !== undefined ? pitchClass : null;
}

export function normalizeNotes(notes: string[]): {
  normalized: string[];
  pitchClasses: number[];
  uniquePitchClasses: Set<number>;
} {
  const pitchClasses: number[] = [];
  const normalized: string[] = [];

  for (const note of notes) {
    const pc = normalizeToPitchClass(note);
    if (pc !== null) {
      pitchClasses.push(pc);
      normalized.push(PITCH_CLASS_TO_NOTE[pc]);
    }
  }

  return {
    normalized,
    pitchClasses,
    uniquePitchClasses: new Set(pitchClasses),
  };
}

// ============================================================================
// SEQUENCE DETECTION
// ============================================================================

/**
 * Verifica se inputPCs è una sottosequenza contigua di scalePCs
 */
function findContiguousSequence(
  inputPCs: number[],
  scalePCs: number[]
): { found: boolean; position: 'start' | 'middle' | 'end' | null; matchLength: number } {
  if (inputPCs.length === 0 || scalePCs.length === 0) {
    return { found: false, position: null, matchLength: 0 };
  }

  const inputLen = inputPCs.length;
  const scaleLen = scalePCs.length;

  // Cerca la sequenza contigua nell'ordine esatto
  for (let i = 0; i <= scaleLen - inputLen; i++) {
    let matches = true;
    for (let j = 0; j < inputLen; j++) {
      if (scalePCs[i + j] !== inputPCs[j]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Determina posizione
      let position: 'start' | 'middle' | 'end' = 'middle';
      if (i === 0) position = 'start';
      else if (i === scaleLen - inputLen) position = 'end';

      return { found: true, position, matchLength: inputLen };
    }
  }

  return { found: false, position: null, matchLength: 0 };
}

// ============================================================================
// SCORING V2
// ============================================================================

function calculateScoreV2(
  matchedCount: number,
  inputSize: number,
  scaleSize: number,
  extraCount: number,
  missingCount: number,
  rootPitchClass: number,
  inputPitchClasses: Set<number>,
  hasSequence: boolean,
  sequencePosition: 'start' | 'middle' | 'end' | null,
  scaleName?: string // DEBUG
): number {
  let score = 0;

  // 1. BASE: Coverage (quanto dell'input è coperto)
  const coverageRatio = inputSize > 0 ? matchedCount / inputSize : 0;
  score = 100 * coverageRatio;

  const debugLog: string[] = [];
  debugLog.push(`[${scaleName || 'unknown'}]`);
  debugLog.push(`  Coverage: ${matchedCount}/${inputSize} = ${coverageRatio.toFixed(2)} → score: ${score.toFixed(1)}`);

  // 2. PENALITÀ EXTRA NOTES (molto pesante)
  if (extraCount > 0) {
    const penalty = extraCount * 30;
    score -= penalty;
    debugLog.push(`  Extra notes: ${extraCount} × 30 = -${penalty} → score: ${score.toFixed(1)}`);
  }

  // 3. PENALITÀ MISSING NOTES (progressiva)
  if (missingCount > 0) {
    // Penalità aumenta con la differenza di lunghezza
    const scaleLengthPenalty = Math.max(0, (scaleSize - inputSize) * 2);
    const totalMissingPenalty = missingCount * 5 + scaleLengthPenalty;
    score -= totalMissingPenalty;
    debugLog.push(`  Missing notes: ${missingCount} × 5 = ${missingCount * 5}`);
    debugLog.push(`  Scale length penalty: (${scaleSize} - ${inputSize}) × 2 = ${scaleLengthPenalty}`);
    debugLog.push(`  Total missing penalty: -${totalMissingPenalty} → score: ${score.toFixed(1)}`);
  }

  // 4. BONUS ROOT
  if (inputPitchClasses.has(rootPitchClass)) {
    score += 15;
    debugLog.push(`  Root present: +15 → score: ${score.toFixed(1)}`);
  }

  // 5. BONUS SEQUENCE MATCHING (AUMENTATI per maggiore differenziazione)
  if (hasSequence) {
    let seqBonus = 0;
    if (sequencePosition === 'start') {
      seqBonus = 30; // Era 20
    } else if (sequencePosition === 'end') {
      seqBonus = 20; // Era 15
    } else {
      seqBonus = 15; // Era 10 - middle position
    }
    score += seqBonus;
    debugLog.push(`  Sequence ${sequencePosition}: +${seqBonus} → score: ${score.toFixed(1)}`);
  }

  // CLAMP: min 0, NO MAX (per permettere ai bonus di differenziare)
  const finalScore = Math.max(0, score);
  debugLog.push(`  FINAL: ${finalScore.toFixed(1)}`);

  // Log solo per scale con score alto O che hanno sequence (per non spammare)
  if (finalScore > 80 || hasSequence || (scaleName && scaleName.includes('Ionian')) || (scaleName && scaleName.includes('Major'))) {
    console.log(debugLog.join('\n'));
  }

  return finalScore;
}

// ============================================================================
// EXPLANATION
// ============================================================================

function generateExplanationV2(
  coverageRatio: number,
  extraCount: number,
  missingCount: number,
  hasSequence: boolean,
  sequencePosition: 'start' | 'middle' | 'end' | null
): string {
  // Perfect match
  if (coverageRatio === 1.0 && extraCount === 0 && missingCount === 0) {
    return 'Perfect match: exact scale';
  }

  // Perfect match con missing notes
  if (coverageRatio === 1.0 && extraCount === 0) {
    if (hasSequence && sequencePosition === 'start') {
      return `Contains your ${missingCount > 1 ? 'notes' : 'note'} as starting sequence`;
    }
    return `All your notes fit this scale (${missingCount} scale note${missingCount > 1 ? 's' : ''} not played)`;
  }

  // Extra notes
  if (extraCount > 0) {
    return `${extraCount} note${extraCount > 1 ? 's' : ''} outside this scale`;
  }

  // Sequence match
  if (hasSequence) {
    if (sequencePosition === 'start') {
      return 'Your notes start this scale';
    } else if (sequencePosition === 'end') {
      return 'Your notes end this scale';
    } else {
      return 'Your notes appear in sequence within this scale';
    }
  }

  return `${Math.round(coverageRatio * 100)}% coverage`;
}

function extractModeName(scaleName: string): string | null {
  const modes = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
  for (const mode of modes) {
    if (scaleName.includes(mode)) return mode;
  }
  return null;
}

// ============================================================================
// MAIN RECOGNITION - WITH ROOT
// ============================================================================

export function recognizeScalesWithRoot(inputNotes: string[], specifiedRoot: string, maxResults: number = 200): ScaleRecognitionResult {
  const startTime = performance.now();
  const normalizedRoot = specifiedRoot.split('/')[0];

  const { normalized, pitchClasses, uniquePitchClasses } = normalizeNotes(inputNotes);

  if (uniquePitchClasses.size === 0) {
    return {
      input_notes_normalized: [],
      input_pitch_classes: [],
      candidates: [],
      top_guess: null,
      analysis_metadata: {
        total_candidates_analyzed: 0,
        execution_time_ms: performance.now() - startTime,
      },
    };
  }

  const candidatesWithRoot: ScaleCandidate[] = [];
  const candidatesWithoutRoot: ScaleCandidate[] = [];

  // Input come array ordinato di pitch classes
  const inputPCsOrdered = pitchClasses;

  (scaleData as ScaleData[]).forEach((scale) => {
    const scaleRoot = scale.root.split('/')[0];
    const scaleNotes = scale.notes.split(' ');
    const scaleIntervals = scale.interval_pattern.split(' ').map(Number);

    // Converti note scala in pitch classes MANTENENDO L'ORDINE
    const scalePitchClasses = new Set<number>();
    const scalePCsOrdered: number[] = [];
    scaleNotes.forEach((note) => {
      const pc = normalizeToPitchClass(note);
      if (pc !== null) {
        scalePitchClasses.add(pc);
        scalePCsOrdered.push(pc);
      }
    });

    // Matching
    const matched = new Set<number>();
    const matchedNotes: string[] = [];
    const extra = new Set<number>();
    const extraNotes: string[] = [];
    const missing = new Set<number>();
    const missingNotes: string[] = [];

    uniquePitchClasses.forEach((pc) => {
      if (scalePitchClasses.has(pc)) {
        matched.add(pc);
        const noteIndex = normalized.findIndex((n) => normalizeToPitchClass(n) === pc);
        if (noteIndex !== -1) matchedNotes.push(normalized[noteIndex]);
      } else {
        extra.add(pc);
        const noteIndex = normalized.findIndex((n) => normalizeToPitchClass(n) === pc);
        if (noteIndex !== -1) extraNotes.push(normalized[noteIndex]);
      }
    });

    scalePitchClasses.forEach((pc) => {
      if (!uniquePitchClasses.has(pc)) {
        missing.add(pc);
        const noteIndex = scaleNotes.findIndex((n) => normalizeToPitchClass(n) === pc);
        if (noteIndex !== -1) missingNotes.push(scaleNotes[noteIndex]);
      }
    });

    // NUOVO: Sequence detection
    const sequenceResult = findContiguousSequence(inputPCsOrdered, scalePCsOrdered);

    // Metriche
    const coverageRatio = uniquePitchClasses.size > 0 ? matched.size / uniquePitchClasses.size : 0;
    const purityRatio = scalePitchClasses.size > 0 ? matched.size / scalePitchClasses.size : 0;
    const rootPc = normalizeToPitchClass(scale.root.split('/')[0]) || 0;

    // Score V2
    let score = calculateScoreV2(
      matched.size,
      uniquePitchClasses.size,
      scalePitchClasses.size,
      extra.size,
      missing.size,
      rootPc,
      uniquePitchClasses,
      sequenceResult.found,
      sequenceResult.position,
      `${scale.root} ${scale.scale_name}` // DEBUG
    );

    const isRootMatch = scaleRoot === normalizedRoot || (scaleRoot.includes('/') && scaleRoot.split('/').includes(normalizedRoot));

    // BONUS ROOT MATCH: Solo se è PERFECT o QUASI-PERFECT
    if (isRootMatch) {
      // Perfect match con root specificata = PRIORITÀ ASSOLUTA
      // DEVE avere: coverage 100%, no extra notes, NO missing notes
      if (coverageRatio === 1.0 && extra.size === 0 && missing.size === 0) {
        console.log(`\n🎯 PERFECT MATCH WITH ROOT: ${scale.root} ${scale.scale_name}`);
        console.log(`   Before boost: score = ${score.toFixed(1)}`);
        score = 150; // Boost enorme
        console.log(`   After boost: score = 150 (MAXIMUM PRIORITY)`);
      } else {
        const oldScore = score;
        score = Math.min(100, score + 25);
        console.log(`\n⚡ Root match (not perfect): ${scale.root} ${scale.scale_name}`);
        console.log(`   Score: ${oldScore.toFixed(1)} → ${score.toFixed(1)} (+25 bonus)`);
        console.log(`   Why not perfect: coverage=${coverageRatio}, extra=${extra.size}, missing=${missing.size}`);
      }
    }

    const explanation = generateExplanationV2(coverageRatio, extra.size, missing.size, sequenceResult.found, sequenceResult.position);

    const candidate: ScaleCandidate = {
      scale_name: scale.scale_name,
      root: scale.root,
      mode_name: extractModeName(scale.scale_name),
      matched_notes: matchedNotes,
      missing_scale_notes: missingNotes,
      extra_notes: extraNotes,
      coverage_ratio: Math.round(coverageRatio * 1000) / 1000,
      purity_ratio: Math.round(purityRatio * 1000) / 1000,
      score_0_100: Math.round(score * 10) / 10,
      probability_percent: 0,
      explanation,
      raw_intervals: scaleIntervals,
      has_contiguous_sequence: sequenceResult.found,
      sequence_position: sequenceResult.position,
      sequence_length: sequenceResult.matchLength,
    };

    if (isRootMatch) {
      candidatesWithRoot.push(candidate);
    } else {
      candidatesWithoutRoot.push(candidate);
    }
  });

  // Sort: root prima, poi score
  candidatesWithRoot.sort((a, b) => b.score_0_100 - a.score_0_100);
  candidatesWithoutRoot.sort((a, b) => b.score_0_100 - a.score_0_100);

  const allCandidates = [...candidatesWithRoot, ...candidatesWithoutRoot];
  const topCandidates = allCandidates.slice(0, maxResults);

  // DEBUG: Log top candidates prima di probability calculation
  console.log('\n🔍 DEBUG: Top candidates AFTER sorting (by score):');
  topCandidates.slice(0, 5).forEach((c, i) => {
    console.log(`#${i + 1}: ${c.root} ${c.scale_name}`);
    console.log(
      `   Score: ${c.score_0_100}, Coverage: ${c.coverage_ratio}, Extra: ${c.extra_notes.length}, Missing: ${c.missing_scale_notes.length}`
    );
    console.log(`   Sequence: ${c.has_contiguous_sequence ? c.sequence_position : 'no'}`);
  });

  // Calcola probability = NORMALIZZA score 0-100 basato sui top candidates
  const maxScore = topCandidates.length > 0 ? topCandidates[0].score_0_100 : 100;

  topCandidates.forEach((candidate) => {
    // Probability = score normalizzato rispetto al top candidate
    let probability = (candidate.score_0_100 / maxScore) * 100;

    // Clamp
    probability = Math.max(0, Math.min(100, probability));
    candidate.probability_percent = Math.round(probability * 10) / 10;
  });

  // DEBUG: Log dopo probability calculation
  console.log('\n✅ DEBUG: After probability calculation:');
  topCandidates.slice(0, 5).forEach((c, i) => {
    console.log(`#${i + 1}: ${c.root} ${c.scale_name} - Score: ${c.score_0_100}, Prob: ${c.probability_percent}%`);
  });

  // FILTRO: Mostra solo scale con probability >= 5%
  const filteredCandidates = topCandidates.filter((c) => c.probability_percent >= 5);

  console.log(`\n🎯 Risultati finali: ${filteredCandidates.length} scale (probability >= 5%)`);

  const endTime = performance.now();

  return {
    input_notes_normalized: normalized,
    input_pitch_classes: Array.from(uniquePitchClasses).sort((a, b) => a - b),
    candidates: filteredCandidates,
    top_guess: filteredCandidates[0] || null,
    analysis_metadata: {
      total_candidates_analyzed: allCandidates.length,
      execution_time_ms: Math.round((endTime - startTime) * 100) / 100,
    },
  };
}

// ============================================================================
// MAIN RECOGNITION - WITHOUT ROOT (SEQUENCE MODE)
// ============================================================================

export function recognizeScales(inputNotes: string[], maxResults: number = 200): ScaleRecognitionResult {
  const startTime = performance.now();

  const { normalized, pitchClasses, uniquePitchClasses } = normalizeNotes(inputNotes);

  if (uniquePitchClasses.size === 0) {
    return {
      input_notes_normalized: [],
      input_pitch_classes: [],
      candidates: [],
      top_guess: null,
      analysis_metadata: {
        total_candidates_analyzed: 0,
        execution_time_ms: performance.now() - startTime,
      },
    };
  }

  let candidates: ScaleCandidate[] = [];
  const inputPCsOrdered = pitchClasses;

  (scaleData as ScaleData[]).forEach((scale) => {
    const scaleNotes = scale.notes.split(' ');
    const scaleIntervals = scale.interval_pattern.split(' ').map(Number);

    const scalePitchClasses = new Set<number>();
    const scalePCsOrdered: number[] = [];
    scaleNotes.forEach((note) => {
      const pc = normalizeToPitchClass(note);
      if (pc !== null) {
        scalePitchClasses.add(pc);
        scalePCsOrdered.push(pc);
      }
    });

    // Matching
    const matched = new Set<number>();
    const matchedNotes: string[] = [];
    const extra = new Set<number>();
    const extraNotes: string[] = [];
    const missing = new Set<number>();
    const missingNotes: string[] = [];

    uniquePitchClasses.forEach((pc) => {
      if (scalePitchClasses.has(pc)) {
        matched.add(pc);
        const noteIndex = normalized.findIndex((n) => normalizeToPitchClass(n) === pc);
        if (noteIndex !== -1) matchedNotes.push(normalized[noteIndex]);
      } else {
        extra.add(pc);
        const noteIndex = normalized.findIndex((n) => normalizeToPitchClass(n) === pc);
        if (noteIndex !== -1) extraNotes.push(normalized[noteIndex]);
      }
    });

    scalePitchClasses.forEach((pc) => {
      if (!uniquePitchClasses.has(pc)) {
        missing.add(pc);
        const noteIndex = scaleNotes.findIndex((n) => normalizeToPitchClass(n) === pc);
        if (noteIndex !== -1) missingNotes.push(scaleNotes[noteIndex]);
      }
    });

    // Sequence detection (CRUCIALE in modalità no-root)
    const sequenceResult = findContiguousSequence(inputPCsOrdered, scalePCsOrdered);

    const coverageRatio = uniquePitchClasses.size > 0 ? matched.size / uniquePitchClasses.size : 0;
    const purityRatio = scalePitchClasses.size > 0 ? matched.size / scalePitchClasses.size : 0;
    const rootPc = normalizeToPitchClass(scale.root.split('/')[0]) || 0;

    const score = calculateScoreV2(
      matched.size,
      uniquePitchClasses.size,
      scalePitchClasses.size,
      extra.size,
      missing.size,
      rootPc,
      uniquePitchClasses,
      sequenceResult.found,
      sequenceResult.position,
      `${scale.root} ${scale.scale_name}` // DEBUG
    );

    const explanation = generateExplanationV2(coverageRatio, extra.size, missing.size, sequenceResult.found, sequenceResult.position);

    candidates.push({
      scale_name: scale.scale_name,
      root: scale.root,
      mode_name: extractModeName(scale.scale_name),
      matched_notes: matchedNotes,
      missing_scale_notes: missingNotes,
      extra_notes: extraNotes,
      coverage_ratio: Math.round(coverageRatio * 1000) / 1000,
      purity_ratio: Math.round(purityRatio * 1000) / 1000,
      score_0_100: Math.round(score * 10) / 10,
      probability_percent: 0,
      explanation,
      raw_intervals: scaleIntervals,
      has_contiguous_sequence: sequenceResult.found,
      sequence_position: sequenceResult.position,
      sequence_length: sequenceResult.matchLength,
    });
  });

  // FILTRO: Mostra SOLO scale che contengono TUTTE le note input (coverage = 1.0)
  candidates = candidates.filter((c) => c.coverage_ratio === 1.0);

  console.log(`\n📊 Scale con coverage completo: ${candidates.length}`);

  // Sort: PRIORITÀ ASSOLUTA per sequence position
  candidates.sort((a, b) => {
    const aHasSeq = a.has_contiguous_sequence;
    const bHasSeq = b.has_contiguous_sequence;

    // Se solo A ha sequence → A vince
    if (aHasSeq && !bHasSeq) return -1;
    if (!aHasSeq && bHasSeq) return 1;

    // Se entrambi NON hanno sequence → ordina per score
    if (!aHasSeq && !bHasSeq) {
      return b.score_0_100 - a.score_0_100;
    }

    // Se entrambi HANNO sequence → ordina per position
    const posOrder = { start: 1, middle: 2, end: 3 };
    const aPos = posOrder[a.sequence_position!] || 999;
    const bPos = posOrder[b.sequence_position!] || 999;

    if (aPos !== bPos) {
      return aPos - bPos; // start < middle < end
    }

    // Stessa position → ordina per score
    return b.score_0_100 - a.score_0_100;
  });

  // Calcola probability su TUTTI i candidates (non solo top N)
  const maxScore = candidates.length > 0 ? candidates[0].score_0_100 : 100;

  candidates.forEach((candidate) => {
    let probability = (candidate.score_0_100 / maxScore) * 100;
    probability = Math.max(0, Math.min(100, probability));
    candidate.probability_percent = Math.round(probability * 10) / 10;
  });

  // FILTRO: Mostra solo scale con probability >= 5%
  const filteredCandidates = candidates.filter((c) => c.probability_percent >= 5);

  console.log(`\n🎯 Total candidates after filtering: ${filteredCandidates.length} scale (probability >= 5%)`);

  // DEBUG
  console.log('\n🔍 DEBUG (no root): Top candidates AFTER sorting:');

  // Raggruppa per sequence position per visualizzazione
  const withStart = filteredCandidates.filter((c) => c.sequence_position === 'start');
  const withMiddle = filteredCandidates.filter((c) => c.sequence_position === 'middle');
  const withEnd = filteredCandidates.filter((c) => c.sequence_position === 'end');
  const withoutSeq = filteredCandidates.filter((c) => !c.has_contiguous_sequence);

  if (withStart.length > 0) {
    console.log('\n▶️ SEQUENCE START:');
    withStart.slice(0, 5).forEach((c, i) => {
      console.log(`   ${c.root} ${c.scale_name} - Score: ${c.score_0_100.toFixed(1)}`);
    });
  }

  if (withMiddle.length > 0) {
    console.log('\n▶️ SEQUENCE MIDDLE:');
    withMiddle.slice(0, 5).forEach((c, i) => {
      console.log(`   ${c.root} ${c.scale_name} - Score: ${c.score_0_100.toFixed(1)}`);
    });
  }

  if (withEnd.length > 0) {
    console.log('\n▶️ SEQUENCE END:');
    withEnd.slice(0, 5).forEach((c, i) => {
      console.log(`   ${c.root} ${c.scale_name} - Score: ${c.score_0_100.toFixed(1)}`);
    });
  }

  if (withoutSeq.length > 0) {
    console.log('\n▶️ NO SEQUENCE:');
    withoutSeq.slice(0, 5).forEach((c, i) => {
      console.log(`   ${c.root} ${c.scale_name} - Score: ${c.score_0_100.toFixed(1)}`);
    });
  }

  console.log('\n📋 Overall Top 10:');
  filteredCandidates.slice(0, 10).forEach((c, i) => {
    const seqLabel = c.has_contiguous_sequence ? `[${c.sequence_position}]` : '[no seq]';
    console.log(`#${i + 1}: ${c.root} ${c.scale_name} ${seqLabel} - Score: ${c.score_0_100.toFixed(1)}`);
  });

  // Probability già calcolata sopra

  console.log('\n✅ DEBUG (no root): After probability:');
  filteredCandidates.slice(0, 10).forEach((c, i) => {
    console.log(`#${i + 1}: ${c.root} ${c.scale_name} - Score: ${c.score_0_100}, Prob: ${c.probability_percent}%`);
  });

  console.log(`\n🎯 Risultati finali: ${filteredCandidates.length} scale (probability >= 5%)`);

  const endTime = performance.now();

  return {
    input_notes_normalized: normalized,
    input_pitch_classes: Array.from(uniquePitchClasses).sort((a, b) => a - b),
    candidates: filteredCandidates,
    top_guess: filteredCandidates[0] || null,
    analysis_metadata: {
      total_candidates_analyzed: candidates.length,
      execution_time_ms: Math.round((endTime - startTime) * 100) / 100,
    },
  };
}

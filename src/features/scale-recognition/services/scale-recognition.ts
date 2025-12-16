/**
 * SCALE RECOGNITION ENGINE
 *
 * Algoritmo per riconoscere scale musicali da un insieme di note input
 *
 * ARCHITETTURA:
 * 1. Normalizzazione note → pitch class (0-11)
 * 2. Matching con database scale
 * 3. Scoring con metriche multiple
 * 4. Ranking e probabilità
 */

import scaleData from '../data/scale_data.json';

// ============================================================================
// TYPES & INTERFACES
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
// CONSTANTS & CONFIGURATION
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

// SCORING WEIGHTS (configurabili)
const WEIGHTS = {
  EXTRA_NOTE_PENALTY: 25, // Penalità forte per note fuori scala
  MISSING_NOTE_PENALTY: 8, // Penalità media per note mancanti
  ROOT_BONUS: 10, // Bonus se contiene la tonica
  CHARACTERISTIC_NOTE_BONUS: 5, // Bonus per note caratteristiche del modo
};

// ============================================================================
// CORE FUNCTIONS - NORMALIZZAZIONE
// ============================================================================

/**
 * Normalizza una singola nota in pitch class (0-11)
 * Gestisce enharmonics e formati misti
 */
export function normalizeToPitchClass(note: string): number | null {
  // Rimuovi spazi e caratteri unicode
  note = note.trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/♮/g, '');

  // Gestisci formato "C#/Db" prendendo la prima parte
  if (note.includes('/')) {
    note = note.split('/')[0];
  }

  const pitchClass = NOTE_TO_PITCH_CLASS[note];
  return pitchClass !== undefined ? pitchClass : null;
}

/**
 * Normalizza un array di note input
 */
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
// CORE FUNCTIONS - MATCHING
// ============================================================================

/**
 * Calcola il matching tra input e scala candidata
 */
function calculateMatching(
  inputPitchClasses: Set<number>,
  scalePitchClasses: Set<number>,
  inputNormalized: string[],
  scaleNotes: string[]
): {
  matched: Set<number>;
  matchedNotes: string[];
  extra: Set<number>;
  extraNotes: string[];
  missing: Set<number>;
  missingNotes: string[];
} {
  const matched = new Set<number>();
  const matchedNotes: string[] = [];
  const extra = new Set<number>();
  const extraNotes: string[] = [];
  const missing = new Set<number>();
  const missingNotes: string[] = [];

  // Note input che matchano la scala
  inputPitchClasses.forEach((pc) => {
    if (scalePitchClasses.has(pc)) {
      matched.add(pc);
      const noteIndex = inputNormalized.findIndex((n) => normalizeToPitchClass(n) === pc);
      if (noteIndex !== -1) matchedNotes.push(inputNormalized[noteIndex]);
    } else {
      extra.add(pc);
      const noteIndex = inputNormalized.findIndex((n) => normalizeToPitchClass(n) === pc);
      if (noteIndex !== -1) extraNotes.push(inputNormalized[noteIndex]);
    }
  });

  // Note della scala mancanti nell'input
  scalePitchClasses.forEach((pc) => {
    if (!inputPitchClasses.has(pc)) {
      missing.add(pc);
      const noteIndex = scaleNotes.findIndex((n) => normalizeToPitchClass(n) === pc);
      if (noteIndex !== -1) missingNotes.push(scaleNotes[noteIndex]);
    }
  });

  return { matched, matchedNotes, extra, extraNotes, missing, missingNotes };
}

// ============================================================================
// CORE FUNCTIONS - SCORING
// ============================================================================

/**
 * Calcola lo score (0-100) per una scala candidata
 *
 * FORMULA:
 * base = 100 * (matched / input_size)
 * penalty = (extra_count * W_extra) + (missing_count * W_missing)
 * bonus = root_bonus + characteristic_bonus
 * score = clamp(base - penalty + bonus, 0, 100)
 */
function calculateScore(
  matchedCount: number,
  inputSize: number,
  scaleSize: number,
  extraCount: number,
  missingCount: number,
  rootPitchClass: number,
  inputPitchClasses: Set<number>,
  intervals: number[]
): number {
  // Coverage ratio (quanto dell'input è contenuto nella scala)
  const coverageRatio = inputSize > 0 ? matchedCount / inputSize : 0;

  // Base score da coverage
  let score = 100 * coverageRatio;

  // PENALITÀ per note extra (molto pesante!)
  score -= extraCount * WEIGHTS.EXTRA_NOTE_PENALTY;

  // PENALITÀ per note mancanti (più leggera)
  score -= missingCount * WEIGHTS.MISSING_NOTE_PENALTY;

  // BONUS se l'input contiene la tonica
  if (inputPitchClasses.has(rootPitchClass)) {
    score += WEIGHTS.ROOT_BONUS;
  }

  // BONUS per note caratteristiche (es: #4 per Lydian, b2 per Phrygian)
  const characteristicBonus = calculateCharacteristicBonus(intervals, inputPitchClasses);
  score += characteristicBonus;

  // Clamp 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcola bonus per note caratteristiche del modo
 */
function calculateCharacteristicBonus(intervals: number[], inputPitchClasses: Set<number>): number {
  let bonus = 0;

  // Caratteristiche modali comuni
  const characteristics = [
    { interval: 6, name: '#4 (Lydian)' },
    { interval: 1, name: 'b2 (Phrygian)' },
    { interval: 8, name: '#5 (Lydian Augmented)' },
    { interval: 4, name: '#2 (Altered)' },
  ];

  characteristics.forEach((char) => {
    if (intervals.includes(char.interval)) {
      // La scala ha questa caratteristica
      // Se l'input la contiene, bonus!
      const rootPc = 0; // relativo alla root
      const charPc = (rootPc + char.interval) % 12;
      if (inputPitchClasses.has(charPc)) {
        bonus += WEIGHTS.CHARACTERISTIC_NOTE_BONUS;
      }
    }
  });

  return bonus;
}

/**
 * Genera spiegazione testuale del match
 */
function generateExplanation(coverageRatio: number, purityRatio: number, extraCount: number, missingCount: number): string {
  if (coverageRatio === 1.0 && extraCount === 0) {
    return 'Perfect match: all input notes fit exactly in this scale';
  }

  if (coverageRatio >= 0.8 && extraCount === 0) {
    return `Strong match: ${Math.round(coverageRatio * 100)}% coverage, no extra notes`;
  }

  if (extraCount > 0) {
    return `Contains ${extraCount} note${extraCount > 1 ? 's' : ''} outside this scale`;
  }

  if (missingCount > 2) {
    return `Partial match: missing ${missingCount} scale notes`;
  }

  return `Good match: ${Math.round(coverageRatio * 100)}% coverage`;
}

/**
 * Estrae il nome del modo da una scala (se applicabile)
 */
function extractModeName(scaleName: string): string | null {
  const modes = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

  for (const mode of modes) {
    if (scaleName.includes(mode)) {
      return mode;
    }
  }

  return null;
}

// ============================================================================
// MAIN RECOGNITION FUNCTIONS
// ============================================================================

/**
 * Riconosce le scale compatibili con un insieme di note input
 * MODALITÀ AUTOMATICA - senza specificare la root
 *
 * @param inputNotes - Array di note (es: ["C", "D", "Eb", "F", "G"])
 * @param maxResults - Numero massimo di risultati da restituire (default: 10)
 * @returns ScaleRecognitionResult
 */
export function recognizeScales(inputNotes: string[], maxResults: number = 10): ScaleRecognitionResult {
  const startTime = performance.now();

  // STEP 1: Normalizzazione input
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

  // STEP 2: Analizza tutte le scale nel database
  const candidates: ScaleCandidate[] = [];

  (scaleData as ScaleData[]).forEach((scale) => {
    const scaleNotes = scale.notes.split(' ');
    const scaleIntervals = scale.interval_pattern.split(' ').map(Number);

    // Converti note scala in pitch classes
    const scalePitchClasses = new Set<number>();
    scaleNotes.forEach((note) => {
      const pc = normalizeToPitchClass(note);
      if (pc !== null) scalePitchClasses.add(pc);
    });

    // Calcola matching
    const { matched, matchedNotes, extra, extraNotes, missing, missingNotes } = calculateMatching(
      uniquePitchClasses,
      scalePitchClasses,
      normalized,
      scaleNotes
    );

    // Calcola metriche
    const coverageRatio = uniquePitchClasses.size > 0 ? matched.size / uniquePitchClasses.size : 0;
    const purityRatio = scalePitchClasses.size > 0 ? matched.size / scalePitchClasses.size : 0;

    // Calcola root pitch class
    const rootPc = normalizeToPitchClass(scale.root.split('/')[0]) || 0;

    // Calcola score
    const score = calculateScore(
      matched.size,
      uniquePitchClasses.size,
      scalePitchClasses.size,
      extra.size,
      missing.size,
      rootPc,
      uniquePitchClasses,
      scaleIntervals
    );

    // Genera explanation
    const explanation = generateExplanation(coverageRatio, purityRatio, extra.size, missing.size);

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
      probability_percent: 0, // Calcolato dopo
      explanation,
      raw_intervals: scaleIntervals,
    });
  });

  // STEP 3: Ordina per score decrescente
  candidates.sort((a, b) => b.score_0_100 - a.score_0_100);

  // STEP 4: Calcola percentuale di match assoluta
  const topCandidates = candidates.slice(0, maxResults);

  topCandidates.forEach((candidate) => {
    const inputSize = uniquePitchClasses.size;
    const matchedCount = candidate.matched_notes.length;
    const extraCount = candidate.extra_notes.length;
    const missingCount = candidate.missing_scale_notes.length;

    // 1. Coverage: quanto dell'input è coperto dalla scala (0-100)
    const coverageScore = (matchedCount / inputSize) * 100;

    // 2. Purity: penalità per note extra (molto pesante!)
    const purityPenalty = extraCount * 15;

    // 3. Completeness: penalità per note mancanti (leggera e progressiva)
    let completenessPenalty = 0;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        completenessPenalty += 2 + i;
      }
    }

    // Calcola match finale
    let matchPercentage = coverageScore - purityPenalty - completenessPenalty;

    // BONUS: Perfect match
    if (coverageScore === 100 && extraCount === 0) {
      if (missingCount === 0) {
        matchPercentage = 100;
      } else {
        matchPercentage = coverageScore - completenessPenalty * 0.5;
      }
    }

    // Clamp tra 0 e 100
    matchPercentage = Math.max(0, Math.min(100, matchPercentage));

    // Arrotonda a 1 decimale
    candidate.probability_percent = Math.round(matchPercentage * 10) / 10;
  });

  const endTime = performance.now();

  return {
    input_notes_normalized: normalized,
    input_pitch_classes: Array.from(uniquePitchClasses).sort((a, b) => a - b),
    candidates: topCandidates,
    top_guess: topCandidates[0] || null,
    analysis_metadata: {
      total_candidates_analyzed: candidates.length,
      execution_time_ms: Math.round((endTime - startTime) * 100) / 100,
    },
  };
}

/**
 * Riconosce le scale specificando la root note
 * MODALITÀ CON ROOT - dà priorità alle scale con la root specificata
 *
 * @param inputNotes - Array di note
 * @param specifiedRoot - Root note specificata dall'utente
 * @param maxResults - Numero massimo di risultati
 * @returns ScaleRecognitionResult
 */
export function recognizeScalesWithRoot(inputNotes: string[], specifiedRoot: string, maxResults: number = 10): ScaleRecognitionResult {
  const startTime = performance.now();

  // Normalizza la root specificata
  const normalizedRoot = specifiedRoot.split('/')[0];

  // STEP 1: Normalizzazione input
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

  // STEP 2: Analizza tutte le scale, dividendo per root
  const candidatesWithRoot: ScaleCandidate[] = [];
  const candidatesWithoutRoot: ScaleCandidate[] = [];

  (scaleData as ScaleData[]).forEach((scale) => {
    const scaleRoot = scale.root.split('/')[0];
    const scaleNotes = scale.notes.split(' ');
    const scaleIntervals = scale.interval_pattern.split(' ').map(Number);

    // Converti note scala in pitch classes
    const scalePitchClasses = new Set<number>();
    scaleNotes.forEach((note) => {
      const pc = normalizeToPitchClass(note);
      if (pc !== null) scalePitchClasses.add(pc);
    });

    // Calcola matching
    const { matched, matchedNotes, extra, extraNotes, missing, missingNotes } = calculateMatching(
      uniquePitchClasses,
      scalePitchClasses,
      normalized,
      scaleNotes
    );

    // Calcola metriche
    const coverageRatio = uniquePitchClasses.size > 0 ? matched.size / uniquePitchClasses.size : 0;
    const purityRatio = scalePitchClasses.size > 0 ? matched.size / scalePitchClasses.size : 0;

    // Calcola root pitch class
    const rootPc = normalizeToPitchClass(scale.root.split('/')[0]) || 0;

    // Calcola score
    let score = calculateScore(
      matched.size,
      uniquePitchClasses.size,
      scalePitchClasses.size,
      extra.size,
      missing.size,
      rootPc,
      uniquePitchClasses,
      scaleIntervals
    );

    // BONUS ENORME se la root matcha
    const isRootMatch = scaleRoot === normalizedRoot || (scaleRoot.includes('/') && scaleRoot.split('/').includes(normalizedRoot));

    if (isRootMatch) {
      score = Math.min(100, score + 30); // Boost di 30 punti!
    }

    // Genera explanation
    const explanation = generateExplanation(coverageRatio, purityRatio, extra.size, missing.size);

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
    };

    // Dividi in due gruppi
    if (isRootMatch) {
      candidatesWithRoot.push(candidate);
    } else {
      candidatesWithoutRoot.push(candidate);
    }
  });

  // STEP 3: Ordina entrambi i gruppi
  candidatesWithRoot.sort((a, b) => b.score_0_100 - a.score_0_100);
  candidatesWithoutRoot.sort((a, b) => b.score_0_100 - a.score_0_100);

  // Combina: prima quelli con root, poi gli altri
  const allCandidates = [...candidatesWithRoot, ...candidatesWithoutRoot];
  const topCandidates = allCandidates.slice(0, maxResults);

  // STEP 4: Calcola percentuale (stesso algoritmo)
  topCandidates.forEach((candidate) => {
    const inputSize = uniquePitchClasses.size;
    const matchedCount = candidate.matched_notes.length;
    const extraCount = candidate.extra_notes.length;
    const missingCount = candidate.missing_scale_notes.length;

    const coverageScore = (matchedCount / inputSize) * 100;
    const purityPenalty = extraCount * 15;

    let completenessPenalty = 0;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        completenessPenalty += 2 + i;
      }
    }

    let matchPercentage = coverageScore - purityPenalty - completenessPenalty;

    if (coverageScore === 100 && extraCount === 0) {
      if (missingCount === 0) {
        matchPercentage = 100;
      } else {
        matchPercentage = coverageScore - completenessPenalty * 0.5;
      }
    }

    matchPercentage = Math.max(0, Math.min(100, matchPercentage));
    candidate.probability_percent = Math.round(matchPercentage * 10) / 10;
  });

  const endTime = performance.now();

  return {
    input_notes_normalized: normalized,
    input_pitch_classes: Array.from(uniquePitchClasses).sort((a, b) => a - b),
    candidates: topCandidates,
    top_guess: topCandidates[0] || null,
    analysis_metadata: {
      total_candidates_analyzed: allCandidates.length,
      execution_time_ms: Math.round((endTime - startTime) * 100) / 100,
    },
  };
}

/**
 * MODAL ANALYSIS - Detect and analyze modal progressions
 * Basato su lezione teoria modale
 */

import type { NoteName } from '../../../shared/types/music.types';
import type { ParsedChord, ProgressionAnalysis } from './chord-analysis';

// ===================================
// TYPES
// ===================================

export interface ModalAnalysis {
  isModal: boolean; // È una progressione modale?
  modalStability: number; // 0-100: quanto "tiene" la modalità
  detectedMode?: string; // Es: "C Dorian", "F Lydian"
  tonicChord?: ParsedChord; // L'accordo tonico
  tonicPercentage?: number; // % di presenza della tonica
  characteristicNote?: NoteName; // Nota caratteristica del modo
  warnings: ModalWarning[]; // Warning su tritoni pericolosi, etc.
  suggestions: ModalSuggestion[]; // Suggerimenti per migliorare
}

export interface ModalWarning {
  type: 'tritone' | 'tonal-pull' | 'too-many-chords' | 'weak-tonic';
  severity: 'low' | 'medium' | 'high';
  message: string;
  chordIndex?: number; // Quale accordo causa il problema
}

export interface ModalSuggestion {
  type: 'pedal-point' | 'reduce-chords' | 'add-tonic' | 'avoid-resolution';
  message: string;
  example?: string;
}

const CHROMATIC_NOTES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ===================================
// MODAL DETECTION
// ===================================

/**
 * Analizza se una progressione è modale o tonale
 */
export function analyzeModalProgression(progression: ProgressionAnalysis): ModalAnalysis {
  if (!progression.chords || progression.chords.length === 0) {
    return {
      isModal: false,
      modalStability: 0,
      warnings: [],
      suggestions: [],
    };
  }

  // 1. Calcola quante volte appare ogni accordo
  const chordFrequency = calculateChordFrequency(progression.chords.map((c) => c.chord));

  // 2. Identifica potenziale tonica (accordo più frequente)
  const potentialTonic = findMostFrequentChord(chordFrequency);
  const tonicPercentage = ((chordFrequency.get(potentialTonic.original) || 0) / progression.chords.length) * 100;

  // 3. Determina se è modale
  // Progressione è modale se:
  // - Tonica occupa >40% (vs tonale dove può essere 10-20%)
  // - Pochi accordi distinti (2-4 accordi)
  // - Nessuna cadenza tonale forte (V7 → I)

  const distinctChords = chordFrequency.size;
  const hasTonalCadence = detectTonalCadence(progression.chords.map((c) => c.chord));

  const isModal = tonicPercentage >= 40 && distinctChords <= 5 && !hasTonalCadence;

  // 4. Calcola stabilità modale (0-100)
  const modalStability = calculateModalStability(
    progression.chords.map((c) => c.chord),
    potentialTonic,
    tonicPercentage,
  );

  // 5. Genera warnings
  const warnings = generateModalWarnings(
    progression.chords.map((c) => c.chord),
    potentialTonic,
    tonicPercentage,
    isModal,
  );

  // 6. Genera suggestions
  const suggestions = generateModalSuggestions(
    progression.chords.map((c) => c.chord),
    potentialTonic,
    tonicPercentage,
    isModal,
  );

  return {
    isModal,
    modalStability,
    tonicChord: potentialTonic,
    tonicPercentage: Math.round(tonicPercentage),
    warnings,
    suggestions,
  };
}

// ===================================
// CHORD FREQUENCY
// ===================================

function calculateChordFrequency(chords: ParsedChord[]): Map<string, number> {
  const freq = new Map<string, number>();

  for (const chord of chords) {
    const key = chord.original;
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  return freq;
}

function findMostFrequentChord(frequency: Map<string, number>): ParsedChord {
  let maxCount = 0;
  let mostFrequent = '';

  for (const [chord, count] of frequency.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = chord;
    }
  }

  // Parse it back (simple parsing)
  const match = mostFrequent.match(/^([A-G][#b]*)/);
  const root = match ? (match[1] as NoteName) : 'C';

  return {
    root,
    quality: 'm7', // Placeholder
    extensions: [],
    original: mostFrequent,
  };
}

// ===================================
// TONAL CADENCE DETECTION
// ===================================

function detectTonalCadence(chords: ParsedChord[]): boolean {
  // Cerca pattern V7 → I o vii° → I (cadenze tonali forti)
  for (let i = 0; i < chords.length - 1; i++) {
    const current = chords[i];
    const next = chords[i + 1];

    // V7 → I?
    if ((current.quality === '7' || current.quality === '9') && (next.quality === 'maj7' || next.quality === 'maj')) {
      // Check se sono a distanza di quinta (V → I)
      const currentIndex = CHROMATIC_NOTES.indexOf(current.root);
      const nextIndex = CHROMATIC_NOTES.indexOf(next.root);
      const interval = (nextIndex - currentIndex + 12) % 12;

      if (interval === 7) {
        // Quinta ascendente
        return true; // Cadenza tonale forte!
      }
    }
  }

  return false;
}

// ===================================
// MODAL STABILITY SCORE
// ===================================

function calculateModalStability(chords: ParsedChord[], tonic: ParsedChord, tonicPercentage: number): number {
  let score = 0;

  // 1. Tonica percentage (0-40 punti)
  score += Math.min(40, tonicPercentage * 0.5);

  // 2. Pochi accordi distinti = più stabile (0-20 punti)
  const distinctChords = new Set(chords.map((c) => c.original)).size;
  if (distinctChords <= 3) score += 20;
  else if (distinctChords <= 4) score += 15;
  else if (distinctChords <= 5) score += 10;

  // 3. NO cadenze tonali forti (0-20 punti)
  if (!detectTonalCadence(chords)) score += 20;

  // 4. NO dominanti che risolvono (0-20 punti)
  let hasDangerousResolution = false;
  for (let i = 0; i < chords.length - 1; i++) {
    if ((chords[i].quality === '7' || chords[i].quality === '9') && chords[i].root !== tonic.root) {
      // Dominante che risolve?
      const resolves = checkDominantResolution(chords[i], chords[i + 1]);
      if (resolves) {
        hasDangerousResolution = true;
        break;
      }
    }
  }
  if (!hasDangerousResolution) score += 20;

  return Math.min(100, Math.max(0, score));
}

function checkDominantResolution(dominant: ParsedChord, next: ParsedChord): boolean {
  const domIndex = CHROMATIC_NOTES.indexOf(dominant.root);
  const nextIndex = CHROMATIC_NOTES.indexOf(next.root);
  const interval = (nextIndex - domIndex + 12) % 12;

  // Risolve a quinta sotto (movimento V → I)?
  return interval === 5 || interval === 7;
}

// ===================================
// WARNINGS
// ===================================

function generateModalWarnings(chords: ParsedChord[], tonic: ParsedChord, tonicPercentage: number, isModal: boolean): ModalWarning[] {
  const warnings: ModalWarning[] = [];

  // 1. Tonica debole
  if (isModal && tonicPercentage < 50) {
    warnings.push({
      type: 'weak-tonic',
      severity: 'medium',
      message: `La tonica (${tonic.original}) occupa solo il ${Math.round(tonicPercentage)}% del brano. In musica modale dovrebbe essere 70-90%.`,
    });
  }

  // 2. Troppi accordi
  const distinctChords = new Set(chords.map((c) => c.original)).size;
  if (isModal && distinctChords > 4) {
    warnings.push({
      type: 'too-many-chords',
      severity: 'medium',
      message: `Stai usando ${distinctChords} accordi diversi. La musica modale funziona meglio con 2-4 accordi (1 tonica + 2-3 cadenzanti).`,
    });
  }

  // 3. Tritoni pericolosi
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];

    // Accordi dominanti (contengono tritono)
    if (chord.quality === '7' || chord.quality === '9' || chord.quality === '7alt') {
      // Se non è sulla tonica, è pericoloso
      if (chord.root !== tonic.root) {
        // Check se risolve (pericoloso!)
        if (i < chords.length - 1) {
          const resolves = checkDominantResolution(chord, chords[i + 1]);

          if (resolves) {
            warnings.push({
              type: 'tritone',
              severity: 'high',
              message: `⚠️ Il ${chord.original} (battuta ${i + 1}) crea un tritono che risolve → rischio di far crollare la modalità!`,
              chordIndex: i,
            });
          } else {
            warnings.push({
              type: 'tritone',
              severity: 'low',
              message: `Il ${chord.original} contiene un tritono. Può funzionare se NON risolve tonalmente.`,
              chordIndex: i,
            });
          }
        }
      }
    }
  }

  // 4. Pull tonale
  if (isModal && detectTonalCadence(chords)) {
    warnings.push({
      type: 'tonal-pull',
      severity: 'high',
      message: '⚠️ Hai una cadenza tonale forte (V7 → I) che fa crollare la modalità verso il maggiore/minore relativo!',
    });
  }

  return warnings;
}

// ===================================
// SUGGESTIONS
// ===================================

function generateModalSuggestions(chords: ParsedChord[], tonic: ParsedChord, tonicPercentage: number, isModal: boolean): ModalSuggestion[] {
  const suggestions: ModalSuggestion[] = [];

  if (!isModal) {
    // Non modale, suggerisci come renderla modale
    suggestions.push({
      type: 'add-tonic',
      message: 'Per rendere la progressione più modale, aumenta la presenza della tonica (70-90% del brano).',
      example: `Prova: 3 battute ${tonic.original} + 1 battuta accordo cadenzante`,
    });

    suggestions.push({
      type: 'reduce-chords',
      message: 'Riduci il numero di accordi: usa 1 tonica + 2-3 accordi cadenzanti.',
    });
  } else {
    // Già modale, suggerisci miglioramenti

    if (tonicPercentage < 70) {
      suggestions.push({
        type: 'add-tonic',
        message: `Aumenta la presenza della tonica (attualmente ${Math.round(tonicPercentage)}%, ideale 70-90%).`,
      });
    }

    // Suggerisci pedal point
    suggestions.push({
      type: 'pedal-point',
      message: `Prova il PEDAL POINT: basso fisso su ${tonic.root}, accordi che si muovono sopra.`,
      example: `Basso: ${tonic.root} | Accordi sopra: ${chords
        .filter((c) => c.root !== tonic.root)
        .slice(0, 2)
        .map((c) => c.original)
        .join(' → ')}`,
    });
  }

  // Check dominanti pericolosi
  const hasDangerousDominant = chords.some((c) => (c.quality === '7' || c.quality === '9') && c.root !== tonic.root);

  if (hasDangerousDominant) {
    suggestions.push({
      type: 'avoid-resolution',
      message: 'Gli accordi dominanti devono tornare alla TONICA, non risolvere tonalmente (senno crolla la modalità).',
      example: `OK: ${chords.find((c) => c.quality === '7')?.original} → ${tonic.original} | ❌: ${chords.find((c) => c.quality === '7')?.original} → [risoluzione tonale]`,
    });
  }

  return suggestions;
}

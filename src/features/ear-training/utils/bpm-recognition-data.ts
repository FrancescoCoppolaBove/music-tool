/**
 * BPM RECOGNITION DATA
 * Riconoscimento tempo metronome
 */

export type BPMDifficulty = 'slow' | 'medium' | 'fast';

export interface BPMQuestion {
  targetBPM: number;
  options: number[];
  difficulty: BPMDifficulty;
}

// ===================================
// BPM RANGES BY DIFFICULTY
// ===================================

export const BPM_RANGES = {
  slow: { min: 60, max: 90 }, // Adagio/Andante
  medium: { min: 90, max: 140 }, // Moderato/Allegro
  fast: { min: 140, max: 200 }, // Presto/Prestissimo
};

// ===================================
// GENERATE BPM QUESTION
// ===================================

/**
 * Genera domanda BPM con 8 opzioni
 */
export function generateBPMQuestion(difficulty: BPMDifficulty): BPMQuestion {
  const range = BPM_RANGES[difficulty];

  // Target BPM random nel range
  const targetBPM = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

  // Genera 7 opzioni sbagliate + 1 corretta
  const options = generateBPMOptions(targetBPM);

  // Shuffle opzioni
  const shuffledOptions = shuffleArray(options);

  console.log('🎯 Generated BPM question:');
  console.log('   Target BPM:', targetBPM);
  console.log('   Options:', shuffledOptions.join(', '));

  return {
    targetBPM,
    options: shuffledOptions,
    difficulty,
  };
}

/**
 * Genera 8 opzioni BPM (1 corretta + 7 sbagliate)
 */
function generateBPMOptions(targetBPM: number): number[] {
  const options = new Set<number>();

  // Aggiungi target
  options.add(targetBPM);

  // Genera 7 opzioni sbagliate in range ±30 BPM
  const minBPM = Math.max(40, targetBPM - 30);
  const maxBPM = Math.min(220, targetBPM + 30);

  while (options.size < 8) {
    // Gap randomico 3-10 BPM
    const gap = Math.floor(Math.random() * 8) + 3; // 3 to 10

    // Direzione random (sopra o sotto target)
    const direction = Math.random() > 0.5 ? 1 : -1;

    // Calcola nuovo BPM
    let newBPM;
    if (direction > 0) {
      // Sopra target
      const existingAbove = Array.from(options).filter((bpm) => bpm > targetBPM);
      if (existingAbove.length === 0) {
        newBPM = targetBPM + gap;
      } else {
        const maxAbove = Math.max(...existingAbove);
        newBPM = maxAbove + gap;
      }
    } else {
      // Sotto target
      const existingBelow = Array.from(options).filter((bpm) => bpm < targetBPM);
      if (existingBelow.length === 0) {
        newBPM = targetBPM - gap;
      } else {
        const minBelow = Math.min(...existingBelow);
        newBPM = minBelow - gap;
      }
    }

    // Valida range
    if (newBPM >= minBPM && newBPM <= maxBPM && !options.has(newBPM)) {
      options.add(newBPM);
    }
  }

  return Array.from(options).sort((a, b) => a - b);
}

/**
 * Shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===================================
// BPM TEMPO MARKINGS
// ===================================

/**
 * Get tempo marking for BPM
 */
export function getTempoMarking(bpm: number): string {
  if (bpm < 40) return 'Larghissimo';
  if (bpm < 60) return 'Largo';
  if (bpm < 66) return 'Larghetto';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 156) return 'Allegro';
  if (bpm < 176) return 'Vivace';
  if (bpm < 200) return 'Presto';
  return 'Prestissimo';
}

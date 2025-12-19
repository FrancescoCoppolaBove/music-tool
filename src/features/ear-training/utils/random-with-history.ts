/**
 * RANDOM GENERATORS WITH HISTORY - WITH VARIABLE ROOT NOTES
 * Wrapper functions con history + root note variabili
 */

import {
  CHROMATIC_NOTES,
  INTERVALS,
  CHORD_TYPES,
  CHORD_PROGRESSIONS,
  getRandomNote as getRandomNoteBase,
  transposeNote,
  generateChordProgressionAudio,
  type ChordDifficulty,
  type ChordInversion,
  type ProgressionDifficulty,
  type ChordProgression,
} from './interval-data';

import { perfectPitchHistory, intervalsHistory, chordsHistory, progressionsHistory, scalesHistory } from './history-manager';

import { generateRandomScaleFromData as generateScaleBase } from './scale-data-loader';

// ===================================
// PERFECT PITCH
// ===================================

/**
 * Genera nota random evitando ultime 5
 */
export function getRandomNoteWithHistory(): string {
  const selected = perfectPitchHistory.selectRandom(CHROMATIC_NOTES, (note) => note);

  if (selected) {
    perfectPitchHistory.add(selected);
    console.log('🎵 Note:', selected, '| History:', perfectPitchHistory.getHistory().join(', '));
    return selected;
  }

  const fallback = getRandomNoteBase();
  perfectPitchHistory.add(fallback);
  return fallback;
}

// ===================================
// INTERVALS
// ===================================

/**
 * Genera intervallo random evitando ultimi 4
 * Con root note variabile
 */
export function generateRandomIntervalWithHistory() {
  const selected = intervalsHistory.selectRandom(INTERVALS, (interval) => interval.name);

  if (!selected) {
    intervalsHistory.add(INTERVALS[0].name);
    return generateIntervalNotes(INTERVALS[0]);
  }

  intervalsHistory.add(selected.name);
  console.log('🎼 Interval:', selected.name, '| History:', intervalsHistory.getHistory().join(', '));

  return generateIntervalNotes(selected);
}

/**
 * Genera note per intervallo con root note random
 */
function generateIntervalNotes(interval: (typeof INTERVALS)[number]) {
  let rootNote: string;
  let secondNote: string;

  if (interval.semitones === 12) {
    // OCTAVE: root note random ma sempre → ottava sopra
    const rootNotes = ['C', 'D', 'E', 'F', 'G', 'A'];
    const startNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
    rootNote = `${startNote}2`;
    secondNote = `${startNote}3`;
  } else {
    // ALTRI INTERVALLI: root note random (evita note troppo alte)
    const maxStartSemitone = 11 - interval.semitones;
    const availableNotes = CHROMATIC_NOTES.slice(0, maxStartSemitone + 1);
    const startNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];

    rootNote = `${startNote}2`;
    secondNote = transposeNote(rootNote, interval.semitones);
  }

  console.log('  → From', rootNote, 'to', secondNote);
  return { rootNote, secondNote, interval };
}

// ===================================
// CHORDS
// ===================================

/**
 * Genera accordo random evitando ultimi 4
 * Con root note variabile
 */
export function generateRandomChordWithHistory(difficulty: ChordDifficulty = 'triads', allowedInversions: ChordInversion[] = ['root']) {
  const availableChords = getChordTypesByDifficulty(difficulty);

  const selected = chordsHistory.selectRandom(availableChords, (chord) => chord.name);

  if (!selected) {
    chordsHistory.add(availableChords[0].name);
    return generateChordNotes(availableChords[0], allowedInversions);
  }

  chordsHistory.add(selected.name);
  console.log('🎹 Chord:', selected.name, '| History:', chordsHistory.getHistory().join(', '));

  return generateChordNotes(selected, allowedInversions);
}

function getChordTypesByDifficulty(difficulty: ChordDifficulty): typeof CHORD_TYPES {
  switch (difficulty) {
    case 'triads':
      return CHORD_TYPES.filter((c) => c.notes.length === 3);
    case 'basic-sevenths':
      return CHORD_TYPES.filter((c) => c.notes.length === 4 && ['Dominant 7th', 'Major 7th', 'Minor 7th'].includes(c.name));
    case 'triads-and-basic-sevenths':
      return CHORD_TYPES.filter((c) => c.notes.length === 3 || ['Dominant 7th', 'Major 7th', 'Minor 7th'].includes(c.name));
    case 'triads-and-all-sevenths':
      return CHORD_TYPES;
    default:
      return CHORD_TYPES.filter((c) => c.notes.length === 3);
  }
}

/**
 * Genera note accordo con root note variabile
 */
function generateChordNotes(chordType: (typeof CHORD_TYPES)[number], allowedInversions: ChordInversion[]) {
  let inversion = allowedInversions[Math.floor(Math.random() * allowedInversions.length)];

  if (chordType.notes.length === 3 && inversion === 'third') {
    inversion = 'root';
  }

  // Root note random (limita per evitare note troppo alte)
  const maxInterval = Math.max(...chordType.notes);
  const maxStartSemitone = Math.min(7, 11 - maxInterval); // Max G2
  const availableNotes = CHROMATIC_NOTES.slice(0, maxStartSemitone + 1);
  const startNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
  const rootNote = `${startNote}2`;

  const rootPositionNotes = chordType.notes.map((semitones) => transposeNote(rootNote, semitones));
  const notes = applyInversion(rootPositionNotes, inversion);

  console.log('  → Root:', rootNote, '| Notes:', notes.join(', '));
  return { rootNote, chordType, notes, inversion };
}

function applyInversion(notes: string[], inversion: ChordInversion): string[] {
  const inverted = [...notes];

  switch (inversion) {
    case 'root':
      return inverted;
    case 'first':
      const first = inverted.shift()!;
      inverted.push(transposeNote(first, 12));
      return inverted;
    case 'second':
      const second1 = inverted.shift()!;
      const second2 = inverted.shift()!;
      inverted.push(transposeNote(second1, 12));
      inverted.push(transposeNote(second2, 12));
      return inverted;
    case 'third':
      if (notes.length < 4) return inverted;
      const third1 = inverted.shift()!;
      const third2 = inverted.shift()!;
      const third3 = inverted.shift()!;
      inverted.push(transposeNote(third1, 12));
      inverted.push(transposeNote(third2, 12));
      inverted.push(transposeNote(third3, 12));
      return inverted;
    default:
      return inverted;
  }
}

// ===================================
// SCALES
// ===================================

/**
 * Genera scala random evitando ultime 3
 * Le scale da scale_data.json hanno già root note variabili
 */
export function generateRandomScaleWithHistory(difficulty: 'simple' | 'all') {
  const result = generateScaleBase(difficulty);

  if (!result) return null;

  // Usa combinazione scale+root come chiave
  const scaleKey = `${result.scaleName}-${result.root}`;

  // Controlla se nella history
  if (scalesHistory.includes(scaleKey)) {
    // Riprova una volta
    const retry = generateScaleBase(difficulty);
    if (retry) {
      const retryKey = `${retry.scaleName}-${retry.root}`;
      scalesHistory.add(retryKey);
      console.log('🎼 Scale:', retryKey, '| History:', scalesHistory.getHistory().join(', '));
      return retry;
    }
  }

  scalesHistory.add(scaleKey);
  console.log('🎼 Scale:', scaleKey, '| History:', scalesHistory.getHistory().join(', '));
  return result;
}

// ===================================
// PROGRESSIONS
// ===================================

/**
 * Genera progressione random evitando ultime 3
 * Con tonalità variabile (key)
 */
export function generateRandomProgressionWithHistory(difficulty: ProgressionDifficulty) {
  const available = CHORD_PROGRESSIONS.filter((p) => p.category === difficulty);

  const selected = progressionsHistory.selectRandom(available, (prog) => prog.name);

  if (!selected) {
    progressionsHistory.add(available[0].name);
    return generateProgressionWithRandomKey(available[0]);
  }

  progressionsHistory.add(selected.name);
  console.log('🎹 Progression:', selected.name, '| History:', progressionsHistory.getHistory().join(', '));

  return generateProgressionWithRandomKey(selected);
}

/**
 * Genera progressione in tonalità random
 */
function generateProgressionWithRandomKey(progression: ChordProgression) {
  // Tonalità disponibili (evita tonalità con troppe alterazioni)
  const keys = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2'];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  const result = generateChordProgressionAudio(progression, randomKey);

  console.log('  → Key:', randomKey, '| Degrees:', result.degrees.join('-'));
  return result;
}

// ===================================
// SCALE DEGREES
// ===================================

import {
  getScaleDegreesByDifficulty,
  getContextProgression,
  generateTargetNoteFromDegree,
  type ScaleDegreeDifficulty,
  type ScaleDegree,
} from './scale-degrees-data';

import { scaleDegreesHistory } from './history-manager';

/**
 * Genera scale degree random evitando ultimi 4
 * Con tonalità variabile
 */
export function generateRandomScaleDegreeWithHistory(difficulty: ScaleDegreeDifficulty): {
  scaleDegree: ScaleDegree;
  key: string;
  targetNote: string;
  contextProgression: ReturnType<typeof generateChordProgressionAudio>;
} {
  const availableDegrees = getScaleDegreesByDifficulty(difficulty);

  const selected = scaleDegreesHistory.selectRandom(availableDegrees, (degree) => degree.name);

  if (!selected) {
    scaleDegreesHistory.add(availableDegrees[0].name);
    return generateScaleDegreeQuestion(availableDegrees[0], difficulty);
  }

  scaleDegreesHistory.add(selected.name);
  console.log('🎵 Scale Degree:', selected.name, '| History:', scaleDegreesHistory.getHistory().join(', '));

  return generateScaleDegreeQuestion(selected, difficulty);
}

/**
 * Genera domanda scale degree completa
 */
function generateScaleDegreeQuestion(scaleDegree: ScaleDegree, difficulty: ScaleDegreeDifficulty) {
  // Tonalità random
  const keys = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2'];
  const key = keys[Math.floor(Math.random() * keys.length)];

  // Progressione di contesto
  const contextProg = getContextProgression(difficulty);
  const contextProgression = generateChordProgressionAudio(contextProg, key);

  // Nota target
  const targetNote = generateTargetNoteFromDegree(key, scaleDegree);

  console.log('  → Key:', key, '| Target:', targetNote, '| Degree:', scaleDegree.name);

  return {
    scaleDegree,
    key,
    targetNote,
    contextProgression,
  };
}

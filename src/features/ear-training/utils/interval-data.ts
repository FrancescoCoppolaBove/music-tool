/**
 * INTERVAL DATA & UTILITIES - 2 OCTAVES (C2-C3)
 * Database intervalli con supporto per C2-B2 e C3-B3
 */

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const INTERVALS = [
  { semitones: 0, name: 'Unison', shortName: 'P1' },
  { semitones: 1, name: 'Minor 2nd', shortName: 'm2' },
  { semitones: 2, name: 'Major 2nd', shortName: 'M2' },
  { semitones: 3, name: 'Minor 3rd', shortName: 'm3' },
  { semitones: 4, name: 'Major 3rd', shortName: 'M3' },
  { semitones: 5, name: 'Perfect 4th', shortName: 'P4' },
  { semitones: 6, name: 'Tritone', shortName: 'TT' },
  { semitones: 7, name: 'Perfect 5th', shortName: 'P5' },
  { semitones: 8, name: 'Minor 6th', shortName: 'm6' },
  { semitones: 9, name: 'Major 6th', shortName: 'M6' },
  { semitones: 10, name: 'Minor 7th', shortName: 'm7' },
  { semitones: 11, name: 'Major 7th', shortName: 'M7' },
  { semitones: 12, name: 'Octave', shortName: 'P8' },
];

export const CHORD_TYPES = [
  { name: 'Major', notes: [0, 4, 7], symbol: '' },
  { name: 'Minor', notes: [0, 3, 7], symbol: 'm' },
  { name: 'Diminished', notes: [0, 3, 6], symbol: 'dim' },
  { name: 'Augmented', notes: [0, 4, 8], symbol: 'aug' },
  { name: 'Major 7th', notes: [0, 4, 7, 11], symbol: 'maj7' },
  { name: 'Dominant 7th', notes: [0, 4, 7, 10], symbol: '7' },
  { name: 'Minor 7th', notes: [0, 3, 7, 10], symbol: 'm7' },
  { name: 'Half-diminished 7th', notes: [0, 3, 6, 10], symbol: 'm7♭5' },
];

export const SCALE_TYPES = [
  // Simple scales
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11, 12], category: 'simple' },
  { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10, 12], category: 'simple' },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11, 12], category: 'simple' },
  
  // Modes
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10, 12], category: 'modes' },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10, 12], category: 'modes' },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11, 12], category: 'modes' },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10, 12], category: 'modes' },
  { name: 'Aeolian', intervals: [0, 2, 3, 5, 7, 8, 10, 12], category: 'modes' },
  { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10, 12], category: 'modes' },
  
  // Other scales
  { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11, 12], category: 'other' },
  { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9, 12], category: 'other' },
  { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10, 12], category: 'other' },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10, 12], category: 'other' },
  { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10, 12], category: 'other' },
  { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'other' },
];

export type ScaleDifficulty = 'simple' | 'all';

// ===================================
// CHORD PROGRESSIONS
// ===================================

export type ProgressionDifficulty = 'simple-triads' | 'all-triads' | 'triads-and-sevenths';

export interface ChordProgression {
  name: string;
  degrees: string[]; // Roman numerals: ['I', 'IV', 'V', 'I']
  chordTypes: string[]; // Chord types: ['major', 'major', 'major', 'major']
  category: ProgressionDifficulty;
}

export const CHORD_PROGRESSIONS: ChordProgression[] = [
  // Simple Triads (I, IV, V)
  { name: 'I-IV-V-I', degrees: ['I', 'IV', 'V', 'I'], chordTypes: ['major', 'major', 'major', 'major'], category: 'simple-triads' },
  { name: 'I-V-IV-I', degrees: ['I', 'V', 'IV', 'I'], chordTypes: ['major', 'major', 'major', 'major'], category: 'simple-triads' },
  { name: 'IV-V-I', degrees: ['IV', 'V', 'I'], chordTypes: ['major', 'major', 'major'], category: 'simple-triads' },
  { name: 'I-IV-I-V', degrees: ['I', 'IV', 'I', 'V'], chordTypes: ['major', 'major', 'major', 'major'], category: 'simple-triads' },
  { name: 'V-IV-I', degrees: ['V', 'IV', 'I'], chordTypes: ['major', 'major', 'major'], category: 'simple-triads' },
  
  // All Triads (I, ii, iii, IV, V, vi, vii°)
  { name: 'I-vi-IV-V', degrees: ['I', 'vi', 'IV', 'V'], chordTypes: ['major', 'minor', 'major', 'major'], category: 'all-triads' },
  { name: 'vi-IV-I-V', degrees: ['vi', 'IV', 'I', 'V'], chordTypes: ['minor', 'major', 'major', 'major'], category: 'all-triads' },
  { name: 'I-V-vi-IV', degrees: ['I', 'V', 'vi', 'IV'], chordTypes: ['major', 'major', 'minor', 'major'], category: 'all-triads' },
  { name: 'I-iii-IV-V', degrees: ['I', 'iii', 'IV', 'V'], chordTypes: ['major', 'minor', 'major', 'major'], category: 'all-triads' },
  { name: 'I-ii-V-I', degrees: ['I', 'ii', 'V', 'I'], chordTypes: ['major', 'minor', 'major', 'major'], category: 'all-triads' },
  { name: 'vi-ii-V-I', degrees: ['vi', 'ii', 'V', 'I'], chordTypes: ['minor', 'minor', 'major', 'major'], category: 'all-triads' },
  
  // Triads and Sevenths
  { name: 'ii⁷-V⁷-Imaj⁷', degrees: ['ii', 'V', 'I'], chordTypes: ['minor7', 'dominant7', 'major7'], category: 'triads-and-sevenths' },
  { name: 'Imaj⁷-vi⁷-ii⁷-V⁷', degrees: ['I', 'vi', 'ii', 'V'], chordTypes: ['major7', 'minor7', 'minor7', 'dominant7'], category: 'triads-and-sevenths' },
  { name: 'I-IV-V⁷-I', degrees: ['I', 'IV', 'V', 'I'], chordTypes: ['major', 'major', 'dominant7', 'major'], category: 'triads-and-sevenths' },
  { name: 'iii⁷-vi⁷-ii⁷-V⁷-Imaj⁷', degrees: ['iii', 'vi', 'ii', 'V', 'I'], chordTypes: ['minor7', 'minor7', 'minor7', 'dominant7', 'major7'], category: 'triads-and-sevenths' },
  { name: 'Imaj⁷-VImaj⁷-ii⁷-V⁷', degrees: ['I', 'VI', 'ii', 'V'], chordTypes: ['major7', 'major7', 'minor7', 'dominant7'], category: 'triads-and-sevenths' },
];

// Major scale degree mapping (in semitones from root)
const MAJOR_SCALE_DEGREES: Record<string, number> = {
  'I': 0,   'i': 0,
  'II': 2,  'ii': 2,
  'III': 4, 'iii': 4,
  'IV': 5,  'iv': 5,
  'V': 7,   'v': 7,
  'VI': 9,  'vi': 9,
  'VII': 11, 'vii': 11,
};

/**
 * Converti grado romano in semitoni
 */
function degreeToSemitones(degree: string): number {
  // Rimuovi qualità (7, maj7, etc.)
  const cleanDegree = degree.replace(/7|maj|m|dim|aug|⁷/g, '');
  return MAJOR_SCALE_DEGREES[cleanDegree] || 0;
}

/**
 * Genera accordo da grado e tipo
 */
function generateChordFromDegree(
  rootNote: string,
  degree: string,
  chordType: string
): string[] {
  const degreeSemitones = degreeToSemitones(degree);
  const chordRoot = transposeNote(rootNote, degreeSemitones);
  
  // Mapping tipo accordo a intervalli
  const chordIntervals: Record<string, number[]> = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'diminished': [0, 3, 6],
    'augmented': [0, 4, 8],
    'major7': [0, 4, 7, 11],
    'minor7': [0, 3, 7, 10],
    'dominant7': [0, 4, 7, 10],
    'halfdim7': [0, 3, 6, 10],
  };
  
  const intervals = chordIntervals[chordType] || chordIntervals['major'];
  return intervals.map(interval => transposeNote(chordRoot, interval));
}

/**
 * Genera progressione di accordi
 */
export function generateChordProgressionAudio(
  progression: ChordProgression,
  key: string = 'C2'
): {
  progression: ChordProgression;
  chords: string[][]; // Array di array di note
  degrees: string[];
} {
  const chords = progression.degrees.map((degree, index) => {
    const chordType = progression.chordTypes[index];
    return generateChordFromDegree(key, degree, chordType);
  });
  
  return {
    progression,
    chords,
    degrees: progression.degrees,
  };
}

/**
 * Genera progressione random
 */
export function generateRandomProgression(
  difficulty: ProgressionDifficulty,
  previousProgression?: ChordProgression
): ReturnType<typeof generateChordProgressionAudio> {
  const available = CHORD_PROGRESSIONS.filter(p => p.category === difficulty);
  
  let selected: ChordProgression;
  if (previousProgression && available.length > 1) {
    do {
      selected = available[Math.floor(Math.random() * available.length)];
    } while (selected.name === previousProgression.name);
  } else {
    selected = available[Math.floor(Math.random() * available.length)];
  }
  
  return generateChordProgressionAudio(selected);
}

/**
 * Genera una nota random (senza ottava specificata)
 */
export function getRandomNote(): string {
  return CHROMATIC_NOTES[Math.floor(Math.random() * CHROMATIC_NOTES.length)];
}

/**
 * Genera una nota random diversa dalla precedente
 */
export function getRandomNoteDifferent(previousNote?: string): string {
  if (!previousNote) return getRandomNote();
  
  let newNote: string;
  do {
    newNote = getRandomNote();
  } while (newNote === previousNote);
  
  return newNote;
}

/**
 * Genera una nota random con ottava specificata
 */
export function getRandomNoteWithOctave(octave: number = 2): string {
  const note = getRandomNote();
  return `${note}${octave}`;
}

/**
 * Calcola la nota a N semitoni di distanza
 * Se l'ottava è specificata, gestisce il wrapping
 */
export function transposeNote(note: string, semitones: number): string {
  // Estrai nota e ottava se presente
  const match = note.match(/^([A-G][#b]?)(\d+)?$/);
  if (!match) {
    // Fallback: nota senza ottava
    const index = CHROMATIC_NOTES.indexOf(note);
    if (index === -1) return note;
    const newIndex = ((index + semitones) % 12 + 12) % 12;
    return CHROMATIC_NOTES[newIndex];
  }

  const [, noteName, octaveStr] = match;
  const octave = octaveStr ? parseInt(octaveStr) : undefined;

  const noteIndex = CHROMATIC_NOTES.indexOf(noteName);
  if (noteIndex === -1) return note;
  
  const totalSemitones = noteIndex + semitones;
  
  // Calcola nuova nota e ottava
  const newNoteIndex = ((totalSemitones % 12) + 12) % 12;
  const newNote = CHROMATIC_NOTES[newNoteIndex];
  
  if (octave !== undefined) {
    const octaveChange = Math.floor(totalSemitones / 12);
    const newOctave = octave + octaveChange;
    return `${newNote}${newOctave}`;
  }
  
  return newNote;
}

/**
 * Genera un intervallo random con ottave specificate
 * Gli intervalli tranne l'ottava rimangono nella stessa ottava (C2-B2)
 * Solo l'ottava (P8) va da C2 a C3
 */
export function generateRandomInterval(previousInterval?: typeof INTERVALS[number]) {
  // Scegli un intervallo random diverso dal precedente
  let interval: typeof INTERVALS[number];
  
  if (previousInterval) {
    do {
      interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    } while (interval.name === previousInterval.name);
  } else {
    interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
  }
  
  let rootNote: string;
  let secondNote: string;
  
  if (interval.semitones === 12) {
    // OCTAVE: sempre C2 → C3
    rootNote = 'C2';
    secondNote = 'C3';
  } else {
    // ALTRI INTERVALLI: rimangono in ottava C2-B2
    // Limita la nota di partenza per evitare overflow
    const maxStartSemitone = 11 - interval.semitones;  // B2 è semitono 11
    
    // Genera nota di partenza che non supera l'ottava
    const availableNotes = CHROMATIC_NOTES.slice(0, maxStartSemitone + 1);
    const startNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    
    rootNote = `${startNote}2`;
    secondNote = transposeNote(rootNote, interval.semitones);
  }
  
  return {
    rootNote,
    secondNote,
    interval,
  };
}

export type ChordInversion = 'root' | 'first' | 'second' | 'third';
export type ChordDifficulty = 'triads' | 'basic-sevenths' | 'triads-and-basic-sevenths' | 'triads-and-all-sevenths';

/**
 * Applica inversione a un accordo
 */
function applyInversion(notes: string[], inversion: ChordInversion): string[] {
  const inverted = [...notes];
  
  switch (inversion) {
    case 'root':
      // Nessuna inversione
      return inverted;
      
    case 'first':
      // Prima inversione: root va all'ottava sopra
      const first = inverted.shift()!;
      inverted.push(transposeNote(first, 12));
      return inverted;
      
    case 'second':
      // Seconda inversione: prime due note vanno all'ottava sopra
      const second1 = inverted.shift()!;
      const second2 = inverted.shift()!;
      inverted.push(transposeNote(second1, 12));
      inverted.push(transposeNote(second2, 12));
      return inverted;
      
    case 'third':
      // Terza inversione: prime tre note vanno all'ottava sopra (solo 7th chords)
      if (notes.length < 4) return inverted; // Fallback per triadi
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

/**
 * Filtra chord types in base alla difficulty
 */
function getChordTypesByDifficulty(difficulty: ChordDifficulty): typeof CHORD_TYPES {
  switch (difficulty) {
    case 'triads':
      return CHORD_TYPES.filter(c => c.notes.length === 3);
      
    case 'basic-sevenths':
      return CHORD_TYPES.filter(c => 
        c.notes.length === 4 && ['Dominant 7th', 'Major 7th', 'Minor 7th'].includes(c.name)
      );
      
    case 'triads-and-basic-sevenths':
      return CHORD_TYPES.filter(c => 
        c.notes.length === 3 || ['Dominant 7th', 'Major 7th', 'Minor 7th'].includes(c.name)
      );
      
    case 'triads-and-all-sevenths':
      return CHORD_TYPES;
      
    default:
      return CHORD_TYPES.filter(c => c.notes.length === 3);
  }
}

/**
 * Genera un accordo random con difficulty e inversione
 * Le note rimangono sempre nella stessa ottava o usano la successiva per inversioni
 */
export function generateRandomChord(
  difficulty: ChordDifficulty = 'triads',
  allowedInversions: ChordInversion[] = ['root'],
  previousChordType?: typeof CHORD_TYPES[number]
): {
  rootNote: string;
  chordType: typeof CHORD_TYPES[number];
  notes: string[];
  inversion: ChordInversion;
} {
  const availableChords = getChordTypesByDifficulty(difficulty);
  
  // Scegli chord type diverso dal precedente
  let chordType: typeof CHORD_TYPES[number];
  
  if (previousChordType && availableChords.length > 1) {
    do {
      chordType = availableChords[Math.floor(Math.random() * availableChords.length)];
    } while (chordType.name === previousChordType.name);
  } else {
    chordType = availableChords[Math.floor(Math.random() * availableChords.length)];
  }
  
  // Scegli inversione random tra quelle permesse
  let inversion = allowedInversions[Math.floor(Math.random() * allowedInversions.length)];
  
  // Valida inversione: triadi non possono avere 3rd inversion
  if (chordType.notes.length === 3 && inversion === 'third') {
    inversion = 'root';
  }
  
  // Per mantenere note nella stessa ottava, limita la root note
  // Calcola quanto spazio serve per l'accordo
  const maxInterval = Math.max(...chordType.notes);
  const maxStartSemitone = 11 - maxInterval; // B2 è semitono 11
  
  // Genera nota root che non supera l'ottava
  const availableNotes = CHROMATIC_NOTES.slice(0, maxStartSemitone + 1);
  const startNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
  const rootNote = `${startNote}2`;
  
  // Genera note dell'accordo in root position
  const rootPositionNotes = chordType.notes.map(semitones => transposeNote(rootNote, semitones));
  
  // Applica inversione
  const notes = applyInversion(rootPositionNotes, inversion);
  
  return {
    rootNote,
    chordType,
    notes,
    inversion,
  };
}

/**
 * Filtra scale types in base alla difficulty
 */
function getScaleTypesByDifficulty(difficulty: ScaleDifficulty): typeof SCALE_TYPES {
  if (difficulty === 'simple') {
    return SCALE_TYPES.filter(s => s.category === 'simple');
  }
  return SCALE_TYPES; // all
}

/**
 * Genera una scala random
 * Le scale possono partire da qualsiasi nota (C2-G2)
 */
export function generateRandomScale(
  difficulty: ScaleDifficulty = 'simple',
  previousScaleType?: typeof SCALE_TYPES[number]
): {
  rootNote: string;
  scaleType: typeof SCALE_TYPES[number];
  notes: string[];
} {
  const availableScales = getScaleTypesByDifficulty(difficulty);
  
  // Scegli scale type diverso dal precedente
  let scaleType: typeof SCALE_TYPES[number];
  
  if (previousScaleType && availableScales.length > 1) {
    do {
      scaleType = availableScales[Math.floor(Math.random() * availableScales.length)];
    } while (scaleType.name === previousScaleType.name);
  } else {
    scaleType = availableScales[Math.floor(Math.random() * availableScales.length)];
  }
  
  // Genera root note random
  // Limita a C2-G2 per evitare che la scala superi l'ottava C3
  const maxInterval = Math.max(...scaleType.intervals);
  const maxStartSemitone = Math.min(7, 11 - maxInterval); // Max G2 (semitono 7) o meno se scala lunga
  
  const availableRootNotes = CHROMATIC_NOTES.slice(0, maxStartSemitone + 1);
  const rootNoteName = availableRootNotes[Math.floor(Math.random() * availableRootNotes.length)];
  const rootNote = `${rootNoteName}2`;
  
  // Genera le note della scala partendo dalla root
  const notes = scaleType.intervals.map(semitones => transposeNote(rootNote, semitones));
  
  return {
    rootNote,
    scaleType,
    notes,
  };
}
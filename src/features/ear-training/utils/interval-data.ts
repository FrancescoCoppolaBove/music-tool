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

/**
 * Genera una nota random (senza ottava specificata)
 */
export function getRandomNote(): string {
  return CHROMATIC_NOTES[Math.floor(Math.random() * CHROMATIC_NOTES.length)];
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
    const newIndex = (((index + semitones) % 12) + 12) % 12;
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
export function generateRandomInterval() {
  // Scegli un intervallo random
  const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];

  let rootNote: string;
  let secondNote: string;

  if (interval.semitones === 12) {
    // OCTAVE: sempre C2 → C3
    rootNote = 'C2';
    secondNote = 'C3';
  } else {
    // ALTRI INTERVALLI: rimangono in ottava C2-B2
    // Limita la nota di partenza per evitare overflow
    const maxStartSemitone = 11 - interval.semitones; // B2 è semitono 11

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
 * Genera un accordo random con difficulty e inversione
 * Le note rimangono sempre nella stessa ottava o usano la successiva per inversioni
 */
export function generateRandomChord(
  difficulty: ChordDifficulty = 'triads',
  allowedInversions: ChordInversion[] = ['root']
): {
  rootNote: string;
  chordType: (typeof CHORD_TYPES)[number];
  notes: string[];
  inversion: ChordInversion;
} {
  const availableChords = getChordTypesByDifficulty(difficulty);
  const chordType = availableChords[Math.floor(Math.random() * availableChords.length)];

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
  const rootPositionNotes = chordType.notes.map((semitones) => transposeNote(rootNote, semitones));

  // Applica inversione
  const notes = applyInversion(rootPositionNotes, inversion);

  return {
    rootNote,
    chordType,
    notes,
    inversion,
  };
}

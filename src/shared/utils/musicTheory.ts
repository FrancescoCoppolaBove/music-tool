import { NoteName, CHROMATIC_SCALE, ENHARMONIC_MAP } from '../types/music.types';

/**
 * Normalizza il nome della nota (gestisce enharmonie e unicode)
 */
export function normalizeNoteName(note: string): NoteName | null {
  // Rimuovi spazi
  note = note.trim();
  
  // Sostituisci unicode symbols
  note = note
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/♮/g, '');
  
  // Cerca nella mappa enarmonica
  const normalized = ENHARMONIC_MAP[note];
  return normalized || null;
}

/**
 * Converte nota + ottava in MIDI number
 */
export function noteToMidi(noteName: NoteName, octave: number): number {
  const noteIndex = CHROMATIC_SCALE.indexOf(noteName);
  if (noteIndex === -1) return -1;
  
  // C4 = MIDI 60
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Converte MIDI number in nota + ottava
 */
export function midiToNote(midiNumber: number): { note: NoteName; octave: number } | null {
  if (midiNumber < 0 || midiNumber > 127) return null;
  
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  const note = CHROMATIC_SCALE[noteIndex];
  
  return { note, octave };
}

/**
 * Traspone una nota di N semitoni
 */
export function transposeNote(noteName: NoteName, semitones: number): NoteName {
  const currentIndex = CHROMATIC_SCALE.indexOf(noteName);
  const newIndex = (currentIndex + semitones + 12) % 12;
  return CHROMATIC_SCALE[newIndex];
}

/**
 * Calcola distanza in semitoni tra due note (considera solo pitch class)
 */
export function intervalBetween(note1: NoteName, note2: NoteName): number {
  const index1 = CHROMATIC_SCALE.indexOf(note1);
  const index2 = CHROMATIC_SCALE.indexOf(note2);
  
  let interval = index2 - index1;
  if (interval < 0) interval += 12;
  
  return interval;
}

/**
 * Costruisce un accordo dato root e intervalli
 */
export function buildChordFromIntervals(
  root: NoteName,
  intervals: number[]
): NoteName[] {
  return intervals.map(semitones => transposeNote(root, semitones));
}

/**
 * Nomi standard degli intervalli
 */
export const INTERVAL_NAMES: Record<number, string> = {
  0: "Root (P1)",
  1: "Minor 2nd (m2)",
  2: "Major 2nd (M2)",
  3: "Minor 3rd (m3)",
  4: "Major 3rd (M3)",
  5: "Perfect 4th (P4)",
  6: "Tritone (TT)",
  7: "Perfect 5th (P5)",
  8: "Minor 6th (m6)",
  9: "Major 6th (M6)",
  10: "Minor 7th (m7)",
  11: "Major 7th (M7)",
  12: "Octave (P8)",
  14: "Major 9th (M9)",
  15: "Minor 10th (m10)",
  16: "Major 10th (M10)",
  17: "Perfect 11th (P11)",
  18: "Augmented 11th (#11)",
  21: "Major 13th (M13)",
};

/**
 * Converte nota in frequenza (A4 = 440Hz)
 */
export function noteToFrequency(noteName: NoteName, octave: number): number {
  const midiNumber = noteToMidi(noteName, octave);
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

/**
 * Ottiene il nome "preferito" per visualizzazione (preferisce # per diesis)
 */
export function getPreferredNoteName(noteName: NoteName, preferFlats = false): string {
  if (preferFlats) {
    const flatsMap: Record<string, string> = {
      "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
    };
    return flatsMap[noteName] || noteName;
  }
  return noteName;
}
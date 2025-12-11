// Tipi base per la teoria musicale

export type NoteName = 
  | "C" | "C#" | "Db" | "D" | "D#" | "Eb" | "E" | "F" 
  | "F#" | "Gb" | "G" | "G#" | "Ab" | "A" | "A#" | "Bb" | "B";

export type ChordQuality =
  | "major"
  | "minor"
  | "dominant"
  | "diminished"
  | "half-diminished"
  | "augmented"
  | "sus2"
  | "sus4"
  | "power"
  | "other";

export interface Note {
  name: NoteName;
  midiNumber: number;
  octave: number;
  frequency: number;
}

export interface Interval {
  semitones: number;
  name: string;
  shortName: string;
}

// Costanti
export const CHROMATIC_SCALE: NoteName[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

export const ENHARMONIC_MAP: Record<string, NoteName> = {
  "C": "C", "B#": "C",
  "C#": "C#", "Db": "C#",
  "D": "D",
  "D#": "D#", "Eb": "D#",
  "E": "E", "Fb": "E",
  "F": "F", "E#": "F",
  "F#": "F#", "Gb": "F#",
  "G": "G",
  "G#": "G#", "Ab": "G#",
  "A": "A",
  "A#": "A#", "Bb": "A#",
  "B": "B", "Cb": "B",
};

// Unicode symbols
export const MUSIC_SYMBOLS = {
  sharp: ["#", "♯"],
  flat: ["b", "♭"],
  natural: ["♮"],
  diminished: ["dim", "°", "o"],
  halfDiminished: ["ø", "m7b5"],
  augmented: ["aug", "+"],
  major: ["maj", "M", "Δ", "△"],
  minor: ["m", "min", "-"],
  delta: ["Δ", "△", "∆"],
};
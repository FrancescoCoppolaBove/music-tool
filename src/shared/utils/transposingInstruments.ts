/**
 * Transposing instruments shared by Transposing Instruments (single notes) and
 * Part Transposer (whole parts). `toWritten` is the interval applied to a
 * CONCERT (sounding) pitch to obtain the WRITTEN pitch the player reads. A B♭
 * trumpet sounds a major 2nd lower than written, so written = concert + M2.
 */
export interface ClefSpec { sign: 'G' | 'F'; line: number }

export interface TransposingInstrument {
  id: string;
  name: string;
  pitch: string;        // "Bb", "Eb", "F", "A", "C"
  toWritten: string;    // Tonal interval: concert → written
  group: string;
  sounds: string;       // human description
  // The three fields below are set only for instruments Part Transposer offers
  // (see features/part-transposer/engine/partInstruments.ts).
  /** Clef of a written part. Omitted = keep the source clefs (keyboard). */
  clef?: ClefSpec;
  /** MusicXML <transpose> (written → sounding). Omitted for concert pitch. */
  musicXmlTranspose?: { diatonic: number; chromatic: number; octaveChange?: number };
  /** Practical written range, for out-of-range warnings. */
  range?: { low: string; high: string };
}

const TREBLE: ClefSpec = { sign: 'G', line: 2 };
const SAX_RANGE = { low: 'Bb3', high: 'F6' };

export const INSTRUMENTS: TransposingInstrument[] = [
  // Concert pitch (non-transposing)
  { id: 'keyboard', name: 'Keyboard', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  { id: 'flute',    name: 'Flute / Oboe', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  { id: 'cello',    name: 'Strings / Voice / Bassoon', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  // Octave instruments (written an octave above sounding)
  { id: 'bass',     name: 'Bass', pitch: 'C', toWritten: '8P', group: 'Octave (C)', sounds: 'Sounds an octave LOWER than written.',
    clef: { sign: 'F', line: 4 }, musicXmlTranspose: { diatonic: 0, chromatic: 0, octaveChange: -1 }, range: { low: 'E2', high: 'G4' } },
  { id: 'guitar',   name: 'Guitar', pitch: 'C', toWritten: '8P', group: 'Octave (C)', sounds: 'Sounds an octave LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: 0, chromatic: 0, octaveChange: -1 }, range: { low: 'E3', high: 'E6' } },
  // Bb instruments
  { id: 'trumpet',  name: 'Trumpet in B♭', pitch: 'Bb', toWritten: '2M', group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: -1, chromatic: -2 }, range: { low: 'F#3', high: 'C6' } },
  { id: 'clarinet', name: 'Clarinet in B♭', pitch: 'Bb', toWritten: '2M', group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.' },
  { id: 'sopsax',   name: 'Soprano Sax in B♭', pitch: 'Bb', toWritten: '2M', group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: -1, chromatic: -2 }, range: SAX_RANGE },
  { id: 'tenorsax', name: 'Tenor Sax in B♭', pitch: 'Bb', toWritten: '9M', group: 'B♭ instruments', sounds: 'Sounds a major 9th LOWER (octave + tone).',
    clef: TREBLE, musicXmlTranspose: { diatonic: -1, chromatic: -2, octaveChange: -1 }, range: SAX_RANGE },
  // Eb instruments
  { id: 'altosax',  name: 'Alto Sax in E♭', pitch: 'Eb', toWritten: '6M', group: 'E♭ instruments', sounds: 'Sounds a major 6th LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: -5, chromatic: -9 }, range: SAX_RANGE },
  { id: 'barisax',  name: 'Baritone Sax in E♭', pitch: 'Eb', toWritten: '13M', group: 'E♭ instruments', sounds: 'Sounds an octave + major 6th LOWER.' },
  { id: 'ebclar',   name: 'Clarinet in E♭', pitch: 'Eb', toWritten: '-3m', group: 'E♭ instruments', sounds: 'Sounds a minor 3rd HIGHER than written.' },
  // F instruments
  { id: 'horn',     name: 'French Horn in F', pitch: 'F', toWritten: '5P', group: 'F instruments', sounds: 'Sounds a perfect 5th LOWER than written.' },
  { id: 'enghorn',  name: 'English Horn in F', pitch: 'F', toWritten: '5P', group: 'F instruments', sounds: 'Sounds a perfect 5th LOWER than written.' },
  // A instrument
  { id: 'aclar',    name: 'Clarinet in A', pitch: 'A', toWritten: '3m', group: 'A instruments', sounds: 'Sounds a minor 3rd LOWER than written.' },
];

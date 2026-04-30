// ─── Note Definitions ─────────────────────────────────────────────────────────

export const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const ALL_ROOTS   = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

export const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

// Flat-preferred roots
const FLAT_ROOTS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']);

export function noteToSemitone(note: string): number {
  return NOTE_TO_SEMITONE[note] ?? -1;
}

export function semitoneToNote(semitone: number, preferFlat = false): string {
  const n = ((semitone % 12) + 12) % 12;
  return preferFlat ? FLAT_NOTES[n] : SHARP_NOTES[n];
}

export function notePreferFlat(root: string): boolean {
  return FLAT_ROOTS.has(root);
}

export function transposeNote(note: string, semitones: number): string {
  const base = noteToSemitone(note);
  if (base < 0) return note;
  return semitoneToNote(base + semitones, notePreferFlat(note));
}

export function noteToMidi(note: string, octave: number): number {
  const s = noteToSemitone(note);
  if (s < 0) return -1;
  return (octave + 1) * 12 + s;
}

export function midiToNote(midi: number): { note: string; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  return { note: SHARP_NOTES[semitone], octave };
}

export function midiToNoteFlat(midi: number): { note: string; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  return { note: FLAT_NOTES[semitone], octave };
}

export function notesAreEnharmonic(a: string, b: string): boolean {
  return noteToSemitone(a) === noteToSemitone(b);
}

export function normalizeNoteName(note: string): string {
  const s = noteToSemitone(note);
  if (s < 0) return note;
  // Return the most common spelling
  const sharps: Record<number, string> = { 0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' };
  return sharps[s];
}

// ─── Chord Formulas ───────────────────────────────────────────────────────────

export interface ChordFormula {
  intervals: number[];
  label: string;
  category: string;
}

export const CHORD_FORMULAS: Record<string, ChordFormula> = {
  // Triads
  'maj':     { intervals: [0, 4, 7],        label: 'Major',                   category: 'Triad' },
  'm':       { intervals: [0, 3, 7],        label: 'Minor',                   category: 'Triad' },
  'dim':     { intervals: [0, 3, 6],        label: 'Diminished',              category: 'Triad' },
  'aug':     { intervals: [0, 4, 8],        label: 'Augmented',               category: 'Triad' },
  'sus2':    { intervals: [0, 2, 7],        label: 'Suspended 2nd',           category: 'Suspended' },
  'sus4':    { intervals: [0, 5, 7],        label: 'Suspended 4th',           category: 'Suspended' },
  '5':       { intervals: [0, 7],           label: 'Power Chord',             category: 'Triad' },

  // Seventh chords
  '7':       { intervals: [0, 4, 7, 10],   label: 'Dominant 7th',            category: '7th' },
  'maj7':    { intervals: [0, 4, 7, 11],   label: 'Major 7th',               category: '7th' },
  'm7':      { intervals: [0, 3, 7, 10],   label: 'Minor 7th',               category: '7th' },
  'mMaj7':   { intervals: [0, 3, 7, 11],   label: 'Minor Major 7th',         category: '7th' },
  'dim7':    { intervals: [0, 3, 6, 9],    label: 'Diminished 7th',          category: '7th' },
  'm7b5':    { intervals: [0, 3, 6, 10],   label: 'Half-Dim (m7♭5)',          category: '7th' },
  'augMaj7': { intervals: [0, 4, 8, 11],   label: 'Augmented Major 7th',     category: '7th' },
  '7sus4':   { intervals: [0, 5, 7, 10],   label: 'Dom 7 sus4',              category: 'Suspended' },
  '6':       { intervals: [0, 4, 7, 9],    label: 'Major 6th',               category: '6th' },
  'm6':      { intervals: [0, 3, 7, 9],    label: 'Minor 6th',               category: '6th' },
  '7b5':     { intervals: [0, 4, 6, 10],   label: 'Dom 7♭5',                  category: 'Altered' },
  '7#5':     { intervals: [0, 4, 8, 10],   label: 'Dom 7♯5',                  category: 'Altered' },

  // Extended chords
  '9':       { intervals: [0, 4, 7, 10, 14], label: 'Dominant 9th',          category: 'Extended' },
  'maj9':    { intervals: [0, 4, 7, 11, 14], label: 'Major 9th',             category: 'Extended' },
  'm9':      { intervals: [0, 3, 7, 10, 14], label: 'Minor 9th',             category: 'Extended' },
  'add9':    { intervals: [0, 2, 4, 7],    label: 'Add 9',                   category: 'Extended' },
  'madd9':   { intervals: [0, 2, 3, 7],    label: 'Minor Add 9',             category: 'Extended' },
  '6/9':     { intervals: [0, 4, 7, 9, 14], label: 'Major 6/9',             category: 'Extended' },
  'm6/9':    { intervals: [0, 3, 7, 9, 14], label: 'Minor 6/9',             category: 'Extended' },

  // Altered dominant
  '7b9':     { intervals: [0, 4, 7, 10, 13], label: 'Dom 7♭9',              category: 'Altered' },
  '7#9':     { intervals: [0, 4, 7, 10, 15], label: 'Dom 7♯9 (Hendrix)',     category: 'Altered' },
  '7b5b9':   { intervals: [0, 4, 6, 10, 13], label: 'Dom 7♭5♭9',            category: 'Altered' },
  '7#5#9':   { intervals: [0, 4, 8, 10, 15], label: 'Dom 7♯5♯9',            category: 'Altered' },
  '7alt':    { intervals: [0, 4, 6, 10, 13], label: 'Dom 7 Altered',         category: 'Altered' },
  '7#11':    { intervals: [0, 4, 7, 10, 14, 18], label: 'Dom 7♯11',         category: 'Altered' },

  // 11th and 13th
  '11':      { intervals: [0, 4, 7, 10, 14, 17], label: 'Dominant 11th',    category: 'Extended' },
  'maj11':   { intervals: [0, 4, 7, 11, 14, 17], label: 'Major 11th',       category: 'Extended' },
  'm11':     { intervals: [0, 3, 7, 10, 14, 17], label: 'Minor 11th',       category: 'Extended' },
  '13':      { intervals: [0, 4, 7, 10, 14, 21], label: 'Dominant 13th',    category: 'Extended' },
  'maj13':   { intervals: [0, 4, 7, 11, 14, 21], label: 'Major 13th',       category: 'Extended' },
  'm13':     { intervals: [0, 3, 7, 10, 14, 21], label: 'Minor 13th',       category: 'Extended' },

  // Lydian / Jazz
  'maj7#11': { intervals: [0, 4, 7, 11, 14, 18], label: 'Major 7♯11 (Lydian)', category: 'Jazz' },
  'maj9#11': { intervals: [0, 4, 7, 11, 14, 18], label: 'Major 9♯11',       category: 'Jazz' },
  '9#11':    { intervals: [0, 4, 7, 10, 14, 18], label: 'Dom 9♯11 (Lyd. Dom)', category: 'Jazz' },

  // Quartal
  'quartal': { intervals: [0, 5, 10],          label: 'Quartal (3-note)',    category: 'Modern' },
  'quartal4':{ intervals: [0, 5, 10, 15],      label: 'Quartal (4-note)',    category: 'Modern' },
};

// Aliases for parsing
export const CHORD_ALIASES: Record<string, string> = {
  'M7': 'maj7', 'Δ7': 'maj7', 'Δ': 'maj7', '△7': 'maj7', '△': 'maj7',
  'min7': 'm7', '-7': 'm7', 'min': 'm', '-': 'm',
  'ø': 'm7b5', 'ø7': 'm7b5', 'half-dim': 'm7b5', '°7': 'dim7', '°': 'dim',
  '+': 'aug', '+7': '7#5', 'aug7': '7#5',
  'M': 'maj', 'major': 'maj', 'minor': 'm',
  'dom7': '7', 'dom': '7',
  '2': 'sus2', '4': 'sus4',
};

export function getChordNotes(root: string, chordType: string): string[] {
  const formula = CHORD_FORMULAS[chordType];
  if (!formula) return [root];
  const rootSemitone = noteToSemitone(root);
  if (rootSemitone < 0) return [root];
  const preferFlat = notePreferFlat(root);
  return formula.intervals.map(interval =>
    semitoneToNote(rootSemitone + interval, preferFlat)
  );
}

// ─── Scale Formulas ───────────────────────────────────────────────────────────

export interface ScaleFormula {
  intervals: number[];
  name: string;
  category: string;
  modes?: string[]; // related mode names
}

export const SCALE_FORMULAS: Record<string, ScaleFormula> = {
  // Diatonic modes
  'major':        { intervals: [0,2,4,5,7,9,11],      name: 'Major (Ionian)',            category: 'Diatonic' },
  'dorian':       { intervals: [0,2,3,5,7,9,10],      name: 'Dorian',                    category: 'Modal' },
  'phrygian':     { intervals: [0,1,3,5,7,8,10],      name: 'Phrygian',                  category: 'Modal' },
  'lydian':       { intervals: [0,2,4,6,7,9,11],      name: 'Lydian',                    category: 'Modal' },
  'mixolydian':   { intervals: [0,2,4,5,7,9,10],      name: 'Mixolydian',                category: 'Modal' },
  'aeolian':      { intervals: [0,2,3,5,7,8,10],      name: 'Natural Minor (Aeolian)',    category: 'Diatonic' },
  'locrian':      { intervals: [0,1,3,5,6,8,10],      name: 'Locrian',                   category: 'Modal' },

  // Minor variants
  'harmonicMinor': { intervals: [0,2,3,5,7,8,11],    name: 'Harmonic Minor',            category: 'Minor' },
  'melodicMinor':  { intervals: [0,2,3,5,7,9,11],    name: 'Melodic Minor (Ascending)', category: 'Minor' },

  // Melodic minor modes (jazz essential)
  'dorianb2':     { intervals: [0,1,3,5,7,9,10],     name: 'Dorian ♭2',                 category: 'Jazz' },
  'lydianAug':    { intervals: [0,2,4,6,8,9,11],     name: 'Lydian Augmented',          category: 'Jazz' },
  'lydianDom':    { intervals: [0,2,4,6,7,9,10],     name: 'Lydian Dominant (Mixo♯4)',  category: 'Jazz' },
  'mixolydianb6': { intervals: [0,2,4,5,7,8,10],     name: 'Mixolydian ♭6',             category: 'Jazz' },
  'locrianNat2':  { intervals: [0,2,3,5,6,8,10],     name: 'Locrian ♮2 (Half-Dim)',     category: 'Jazz' },
  'altered':      { intervals: [0,1,3,4,6,8,10],     name: 'Altered (Super Locrian)',   category: 'Jazz' },

  // Harmonic major modes
  'harmonicMajor':     { intervals: [0,2,4,5,7,8,11],  name: 'Harmonic Major',          category: 'Major' },
  'phrygianDominant':  { intervals: [0,1,4,5,7,8,10],  name: 'Phrygian Dominant',       category: 'Modal' },

  // Symmetric scales
  'wholeTone':    { intervals: [0,2,4,6,8,10],        name: 'Whole Tone',                category: 'Symmetric' },
  'dimWH':        { intervals: [0,2,3,5,6,8,9,11],    name: 'Diminished (WH)',           category: 'Symmetric' },
  'dimHW':        { intervals: [0,1,3,4,6,7,9,10],    name: 'Diminished (HW)',           category: 'Symmetric' },
  'augmented':    { intervals: [0,3,4,7,8,11],         name: 'Augmented (Hexatonic)',     category: 'Symmetric' },

  // Pentatonic
  'majorPenta':   { intervals: [0,2,4,7,9],            name: 'Major Pentatonic',          category: 'Pentatonic' },
  'minorPenta':   { intervals: [0,3,5,7,10],           name: 'Minor Pentatonic',          category: 'Pentatonic' },
  'blues':        { intervals: [0,3,5,6,7,10],         name: 'Blues Hexatonic',           category: 'Blues' },
  'majorBlues':   { intervals: [0,2,3,4,7,9],          name: 'Major Blues',               category: 'Blues' },

  // Bebop
  'bebopDom':     { intervals: [0,2,4,5,7,9,10,11],   name: 'Bebop Dominant',            category: 'Bebop' },
  'bebopMaj':     { intervals: [0,2,4,5,7,8,9,11],    name: 'Bebop Major',               category: 'Bebop' },
  'bebopDorian':  { intervals: [0,2,3,4,5,7,9,10],    name: 'Bebop Dorian',              category: 'Bebop' },

  // Exotic
  'hungarianMinor': { intervals: [0,2,3,6,7,8,11],   name: 'Hungarian Minor',            category: 'Exotic' },
  'doubleHarmonic': { intervals: [0,1,4,5,7,8,11],   name: 'Double Harmonic (Byzantine)',category: 'Exotic' },
  'neapolitanMaj':  { intervals: [0,1,3,5,7,9,11],   name: 'Neapolitan Major',           category: 'Exotic' },
  'neapolitanMin':  { intervals: [0,1,3,5,7,8,11],   name: 'Neapolitan Minor',           category: 'Exotic' },
  'enigmatic':      { intervals: [0,1,4,6,8,10,11],  name: 'Enigmatic',                  category: 'Exotic' },
  'persian':        { intervals: [0,1,4,5,6,8,11],   name: 'Persian',                    category: 'Exotic' },
  'japanese':       { intervals: [0,1,5,7,8],         name: 'Japanese (Hirajoshi)',        category: 'Exotic' },
  'insen':          { intervals: [0,1,5,7,10],        name: 'In Sen',                     category: 'Exotic' },
};

export function getScaleNotes(root: string, scaleKey: string): string[] {
  const formula = SCALE_FORMULAS[scaleKey];
  if (!formula) return [root];
  const rootSemitone = noteToSemitone(root);
  if (rootSemitone < 0) return [root];
  const preferFlat = notePreferFlat(root);
  return formula.intervals.map(i => semitoneToNote(rootSemitone + i, preferFlat));
}

// ─── Key / Roman Numeral Utilities ───────────────────────────────────────────

export type Degree = 'I' | 'bII' | 'II' | 'bIII' | 'III' | 'IV' | '#IV' | 'bV' | 'V' | 'bVI' | 'VI' | 'bVII' | 'VII';

export const DEGREE_SEMITONE: Record<string, number> = {
  'I': 0, 'bII': 1, 'II': 2, 'bIII': 3, 'III': 4, 'IV': 5,
  '#IV': 6, 'bV': 6, 'V': 7, 'bVI': 8, 'VI': 9, 'bVII': 10, 'VII': 11,
};

// Default chord qualities for each diatonic degree in major
export const MAJOR_DIATONIC_QUALITY: Record<string, string> = {
  'I': 'maj7', 'II': 'm7', 'III': 'm7', 'IV': 'maj7',
  'V': '7', 'VI': 'm7', 'VII': 'm7b5',
};

// Default chord qualities for each diatonic degree in natural minor
export const MINOR_DIATONIC_QUALITY: Record<string, string> = {
  'I': 'm7', 'II': 'm7b5', 'bIII': 'maj7', 'IV': 'm7',
  'V': 'm7', 'bVI': 'maj7', 'bVII': '7',
};

export function degreeToChord(key: string, degree: string, qualityOverride?: string): { root: string; quality: string; symbol: string } {
  const keySemitone = noteToSemitone(key);
  const degreeSemitone = DEGREE_SEMITONE[degree] ?? 0;
  const preferFlat = notePreferFlat(key) || degreeSemitone >= 6;
  const root = semitoneToNote(keySemitone + degreeSemitone, preferFlat);
  const quality = qualityOverride ?? MAJOR_DIATONIC_QUALITY[degree] ?? 'maj7';
  return { root, quality, symbol: `${root}${quality === 'maj' ? '' : quality}` };
}

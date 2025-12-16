/**
 * PIANO KEYBOARD UTILITIES
 * Helper functions per visualizzazione piano e note
 */

export interface PianoKey {
  note: string;
  octave: number;
  isBlack: boolean;
  midiNumber: number;
  frequency: number;
}

/**
 * Note names in chromatic order
 */
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Check if a note is a black key
 */
export function isBlackKey(note: string): boolean {
  return note.includes('#') || note.includes('b');
}

/**
 * Normalize note name (handle enharmonic equivalents)
 */
export function normalizeNote(note: string): string {
  const normalized = note.replace('♯', '#').replace('♭', 'b').replace(/\s/g, '');

  // Se ha lo slash (C#/Db), prendi solo la prima parte
  const mainNote = normalized.includes('/') ? normalized.split('/')[0] : normalized;

  // Enharmonic equivalents - converti tutto a sharp
  const enharmonics: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };

  return enharmonics[mainNote] || mainNote;
}

/**
 * Generate piano keys for a given octave range
 */
export function generatePianoKeys(startOctave: number = 3, endOctave: number = 5): PianoKey[] {
  const keys: PianoKey[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    CHROMATIC_NOTES.forEach((note, index) => {
      const midiNumber = (octave + 1) * 12 + index;
      const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

      keys.push({
        note,
        octave,
        isBlack: isBlackKey(note),
        midiNumber,
        frequency,
      });
    });
  }

  return keys;
}

/**
 * Get display name for a key (handle C#/Db format)
 */
export function getKeyDisplayName(note: string): string {
  const enharmonicMap: Record<string, string> = {
    'C#': 'C#/Db',
    'D#': 'D#/Eb',
    'F#': 'F#/Gb',
    'G#': 'G#/Ab',
    'A#': 'A#/Bb',
  };

  return enharmonicMap[note] || note;
}

/**
 * Calculate interval from root
 */
export function calculateInterval(rootNote: string, targetNote: string): number {
  const rootIndex = CHROMATIC_NOTES.indexOf(normalizeNote(rootNote));
  const targetIndex = CHROMATIC_NOTES.indexOf(normalizeNote(targetNote));

  if (rootIndex === -1 || targetIndex === -1) return 0;

  return (targetIndex - rootIndex + 12) % 12;
}

/**
 * Get interval name
 */
export function getIntervalName(interval: number): string {
  const intervalNames = [
    'Root', // 0
    'm2', // 1
    'M2', // 2
    'm3', // 3
    'M3', // 4
    'P4', // 5
    'TT', // 6 (tritone)
    'P5', // 7
    'm6', // 8
    'M6', // 9
    'm7', // 10
    'M7', // 11
  ];

  return intervalNames[interval] || '';
}

/**
 * Check if a note should be highlighted in a scale
 */
export function isNoteInScale(note: string, scaleNotes: string[]): boolean {
  const normalized = normalizeNote(note);
  return scaleNotes.some((scaleNote) => normalizeNote(scaleNote) === normalized);
}

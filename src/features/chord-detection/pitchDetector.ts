const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_TEMPLATES: { name: string; intervals: number[] }[] = [
  { name: 'Major',              intervals: [0, 4, 7] },
  { name: 'Minor',              intervals: [0, 3, 7] },
  { name: 'Dominant 7th',       intervals: [0, 4, 7, 10] },
  { name: 'Major 7th',          intervals: [0, 4, 7, 11] },
  { name: 'Minor 7th',          intervals: [0, 3, 7, 10] },
  { name: 'Diminished',         intervals: [0, 3, 6] },
  { name: 'Augmented',          intervals: [0, 4, 8] },
  { name: 'Half-dim 7th',       intervals: [0, 3, 6, 10] },
  { name: 'Sus2',               intervals: [0, 2, 7] },
  { name: 'Sus4',               intervals: [0, 5, 7] },
  { name: 'Major 6th',          intervals: [0, 4, 7, 9] },
  { name: 'Minor 6th',          intervals: [0, 3, 7, 9] },
];

export interface DetectedNote {
  name: string;
  octave: number;
  pitchClass: number;
  frequency: number;
  amplitude: number;
}

export interface ChordMatch {
  root: string;
  type: string;
  symbol: string;
  confidence: number;
  pitchClass: number;
}

function freqToNote(freq: number): DetectedNote | null {
  if (freq < 40 || freq > 5000) return null;
  const semitonesFromA4 = 12 * Math.log2(freq / 440);
  const midiNote = Math.round(semitonesFromA4) + 69;
  if (midiNote < 24 || midiNote > 108) return null;
  const pitchClass = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return { name: NOTE_NAMES[pitchClass], octave, pitchClass, frequency: freq, amplitude: 0 };
}

function chordSymbol(root: string, type: string): string {
  const map: Record<string, string> = {
    'Major': '', 'Minor': 'm', 'Dominant 7th': '7', 'Major 7th': 'maj7',
    'Minor 7th': 'm7', 'Diminished': 'dim', 'Augmented': 'aug',
    'Half-dim 7th': 'ø7', 'Sus2': 'sus2', 'Sus4': 'sus4',
    'Major 6th': '6', 'Minor 6th': 'm6',
  };
  return root + (map[type] ?? type);
}

/** Pick dominant frequency peaks from FFT data (ignoring harmonics of found peaks). */
export function detectNotes(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  noiseFloor = 80,
): DetectedNote[] {
  const binSize = sampleRate / fftSize;
  const results: DetectedNote[] = [];

  // Find local maxima in the useful frequency range
  for (let i = 2; i < freqData.length - 2; i++) {
    const amp = freqData[i];
    if (amp < noiseFloor) continue;
    if (
      amp > freqData[i - 1] && amp > freqData[i - 2] &&
      amp > freqData[i + 1] && amp > freqData[i + 2]
    ) {
      const freq = i * binSize;
      const note = freqToNote(freq);
      if (!note) continue;

      // Skip if this pitch class is already found with higher amplitude
      const existing = results.find(r => r.pitchClass === note.pitchClass);
      if (existing) {
        if (amp > existing.amplitude) existing.amplitude = amp;
        continue;
      }

      results.push({ ...note, amplitude: amp });
    }
  }

  return results
    .sort((a, b) => b.amplitude - a.amplitude)
    .slice(0, 6);
}

/** Match detected pitch classes against known chord templates. */
export function matchChords(notes: DetectedNote[]): ChordMatch[] {
  if (notes.length < 2) return [];

  const detected = new Set(notes.map(n => n.pitchClass));
  const matches: ChordMatch[] = [];

  for (let root = 0; root < 12; root++) {
    for (const template of CHORD_TEMPLATES) {
      const chordPCs = new Set(template.intervals.map(i => (root + i) % 12));
      let hits = 0;
      for (const pc of chordPCs) {
        if (detected.has(pc)) hits++;
      }
      const confidence = hits / chordPCs.size;
      if (confidence >= 0.65) {
        matches.push({
          root: NOTE_NAMES[root],
          type: template.name,
          symbol: chordSymbol(NOTE_NAMES[root], template.name),
          confidence,
          pitchClass: root,
        });
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

/** Smooth note detections across multiple frames using pitch-class vote counts. */
export class NoteSmoothing {
  private frames: Set<number>[] = [];
  private readonly windowSize: number;

  constructor(windowSize = 5) {
    this.windowSize = windowSize;
  }

  add(notes: DetectedNote[]) {
    this.frames.push(new Set(notes.map(n => n.pitchClass)));
    if (this.frames.length > this.windowSize) this.frames.shift();
  }

  /** Return pitch classes that appear in ≥ half the recent frames. */
  getStable(): Set<number> {
    const votes = new Map<number, number>();
    for (const frame of this.frames) {
      for (const pc of frame) {
        votes.set(pc, (votes.get(pc) ?? 0) + 1);
      }
    }
    const threshold = Math.ceil(this.frames.length / 2);
    const stable = new Set<number>();
    for (const [pc, count] of votes) {
      if (count >= threshold) stable.add(pc);
    }
    return stable;
  }
}

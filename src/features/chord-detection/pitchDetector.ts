/**
 * CHORD DETECTION ENGINE
 * ----------------------
 * A polyphonic pitch + chord detector built for real instruments through a mic.
 *
 * Pipeline (per frame):
 *   1. dB spectrum  -> linear magnitude spectrum
 *   2. spectral peak picking with parabolic interpolation (sub-bin accuracy)
 *   3. iterative salience-based F0 estimation with harmonic cancellation
 *        -> this is what prevents a single low note (whose 3rd/5th harmonics
 *           land on the fifth/third) from being misread as a full chord.
 *   4. chromagram (12-bin pitch-class profile) built from the cleaned F0s
 *   5. time smoothing of the chromagram (EMA) for rock-solid stability
 *   6. chord matching via cosine similarity against weighted templates,
 *        with a bass-note bonus to resolve inversions (C6 vs Am7, etc.)
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Map sharp spellings to the app's global-key spellings (flats where the picker uses them). */
const GLOBAL_KEY_NAME: Record<string, string> = {
  'C#': 'C#', 'D#': 'Eb', 'F#': 'F#', 'G#': 'Ab', 'A#': 'Bb',
};
export function toGlobalKeyName(sharpName: string): string {
  return GLOBAL_KEY_NAME[sharpName] ?? sharpName;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedNote {
  name: string;       // e.g. "C"
  octave: number;     // e.g. 3
  pitchClass: number; // 0-11
  frequency: number;  // Hz (interpolated)
  amplitude: number;  // salience of the fundamental (relative)
}

export interface ChordMatch {
  root: string;       // e.g. "C"
  rootPc: number;     // 0-11
  type: string;       // e.g. "Major 7th"
  symbol: string;     // e.g. "Cmaj7"
  quality: string;    // for the Scale Advisor handoff
  confidence: number; // 0-1 (cosine similarity, bass bonus excluded)
}

export interface IntervalInfo {
  lowName: string;
  highName: string;
  name: string;       // e.g. "Perfect 5th"
}

export interface AnalysisResult {
  level: number;             // 0-100 input level for the meter
  silent: boolean;           // below the noise gate
  chroma: number[];          // 12-bin smoothed pitch-class profile (0-1)
  activePitchClasses: number[];
  bassPc: number | null;     // pitch class of the lowest detected note (held)
  notes: DetectedNote[];     // current-frame fundamentals (sorted low -> high)
  matches: ChordMatch[];     // ranked chord interpretations
  primary: ChordMatch | null;
  interval: IntervalInfo | null; // populated when exactly two notes ring
  stable: boolean;           // primary chord has held steady for a few frames
}

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

const A4 = 440;
const F_MIN = 40;          // lowest fundamental we'll consider (~E1)
const F_MAX = 2100;        // highest fundamental (~C7)
const MAX_HARMONIC_FREQ = 6000;
const HARMONICS = 10;      // partials summed for salience
const MAX_NOTES = 6;       // polyphony cap
const REL_SALIENCE_FLOOR = 0.16; // a note must be >=16% as salient as the strongest
const SILENCE_LIN = 2.4e-4;      // ~ -72 dBFS linear magnitude gate
const CHROMA_EMA = 0.78;         // smoothing: higher = steadier, slower
const ACTIVE_PC_RATIO = 0.5;     // a pitch class is "on" if >= 50% of the max
const STABLE_FRAMES = 3;
const MIN_CONF_SHOW = 0.6;
const MIN_CONF_PRIMARY = 0.72;

// ---------------------------------------------------------------------------
// Chord vocabulary (interval sets relative to the root)
// ---------------------------------------------------------------------------

interface Template {
  type: string;
  suffix: string;
  quality: string;
  intervals: number[];
}

const CHORD_TEMPLATES: Template[] = [
  { type: 'Power (5)',          suffix: '5',     quality: 'maj',   intervals: [0, 7] },
  { type: 'Major',              suffix: '',      quality: 'maj',   intervals: [0, 4, 7] },
  { type: 'Minor',              suffix: 'm',     quality: 'min',   intervals: [0, 3, 7] },
  { type: 'Diminished',         suffix: 'dim',   quality: 'dim',   intervals: [0, 3, 6] },
  { type: 'Augmented',          suffix: 'aug',   quality: 'aug',   intervals: [0, 4, 8] },
  { type: 'Sus2',               suffix: 'sus2',  quality: 'sus2',  intervals: [0, 2, 7] },
  { type: 'Sus4',               suffix: 'sus4',  quality: 'sus4',  intervals: [0, 5, 7] },
  { type: 'Major 6th',          suffix: '6',     quality: '6',     intervals: [0, 4, 7, 9] },
  { type: 'Minor 6th',          suffix: 'm6',    quality: 'm6',    intervals: [0, 3, 7, 9] },
  { type: 'Major 7th',          suffix: 'maj7',  quality: 'maj7',  intervals: [0, 4, 7, 11] },
  { type: 'Dominant 7th',       suffix: '7',     quality: '7',     intervals: [0, 4, 7, 10] },
  { type: 'Minor 7th',          suffix: 'm7',    quality: 'm7',    intervals: [0, 3, 7, 10] },
  { type: 'Minor-Major 7th',    suffix: 'mMaj7', quality: 'mMaj7', intervals: [0, 3, 7, 11] },
  { type: 'Half-diminished 7th',suffix: 'm7♭5',  quality: 'm7b5',  intervals: [0, 3, 6, 10] },
  { type: 'Diminished 7th',     suffix: 'dim7',  quality: 'dim7',  intervals: [0, 3, 6, 9] },
  { type: 'Dominant 9th',       suffix: '9',     quality: '9',     intervals: [0, 4, 7, 10, 2] },
  { type: 'Major add9',         suffix: 'add9',  quality: 'maj',   intervals: [0, 4, 7, 2] },
  { type: 'Minor 9th',          suffix: 'm9',    quality: 'm9',    intervals: [0, 3, 7, 10, 2] },
];

// Precompute 12-d unit-ish template vectors once.
const TEMPLATE_VECTORS = CHORD_TEMPLATES.map(t => {
  const vec = new Array(12).fill(0);
  for (const i of t.intervals) vec[i % 12] = 1;
  return { ...t, vec, norm: Math.sqrt(t.intervals.length) };
});

const INTERVAL_NAMES = [
  'Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th',
  'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th',
];

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / A4));
}

function midiToName(midi: number): { name: string; octave: number; pitchClass: number } {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { name: NOTE_NAMES[pitchClass], octave, pitchClass };
}

/** Convert a dB spectrum (from getFloatFrequencyData) to a linear magnitude array. */
function dbToLinear(db: Float32Array): Float32Array {
  const out = new Float32Array(db.length);
  for (let i = 0; i < db.length; i++) {
    const v = db[i];
    out[i] = v <= -120 || !isFinite(v) ? 0 : Math.pow(10, v / 20);
  }
  return out;
}

/** Linear-interpolated magnitude at an arbitrary frequency. */
function magAt(mag: Float32Array, binSize: number, freq: number): number {
  const bin = freq / binSize;
  const i = Math.floor(bin);
  if (i < 0 || i + 1 >= mag.length) return 0;
  const frac = bin - i;
  return mag[i] * (1 - frac) + mag[i + 1] * frac;
}

interface Peak { freq: number; mag: number; used: boolean; }

/** Local-maxima peak picking with parabolic interpolation for sub-bin accuracy. */
function findPeaks(mag: Float32Array, binSize: number, noiseFloor: number): Peak[] {
  const peaks: Peak[] = [];
  const minBin = Math.max(2, Math.floor(F_MIN / binSize));
  const maxBin = Math.min(mag.length - 3, Math.ceil(F_MAX / binSize));
  for (let i = minBin; i <= maxBin; i++) {
    const m = mag[i];
    if (m < noiseFloor) continue;
    if (m > mag[i - 1] && m >= mag[i + 1] && m >= mag[i - 2] && m >= mag[i + 2]) {
      const a = mag[i - 1], b = mag[i], c = mag[i + 1];
      const denom = a - 2 * b + c;
      const delta = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
      const freq = (i + delta) * binSize;
      const peakMag = b - 0.25 * (a - c) * delta;
      if (freq >= F_MIN && freq <= F_MAX) {
        peaks.push({ freq, mag: Math.max(peakMag, b), used: false });
      }
    }
  }
  return peaks;
}

/** Harmonic salience of a candidate fundamental: sum of its partials, 1/h weighted. */
function salience(mag: Float32Array, binSize: number, f0: number): number {
  let s = 0;
  for (let h = 1; h <= HARMONICS; h++) {
    const f = f0 * h;
    if (f > MAX_HARMONIC_FREQ) break;
    s += magAt(mag, binSize, f) / h;
  }
  return s;
}

/** Subtract a fundamental's estimated harmonic series from the spectrum (cancellation). */
function cancelHarmonics(mag: Float32Array, binSize: number, f0: number, amp: number): void {
  for (let h = 1; h <= HARMONICS; h++) {
    const f = f0 * h;
    if (f > MAX_HARMONIC_FREQ) break;
    const center = Math.round(f / binSize);
    const sub = amp / h;
    for (let k = center - 2; k <= center + 2; k++) {
      if (k < 0 || k >= mag.length) continue;
      const taper = k === center ? 1 : Math.abs(k - center) === 1 ? 0.7 : 0.4;
      mag[k] = Math.max(0, mag[k] - sub * taper);
    }
  }
}

/**
 * Iterative predominant-F0 estimation.
 * Repeatedly: score every candidate peak by harmonic salience, take the winner,
 * cancel its harmonics, repeat. This separates real fundamentals from the
 * partials of lower notes — the core of reliable polyphonic detection.
 */
function detectFundamentals(mag: Float32Array, binSize: number, noiseFloor: number): DetectedNote[] {
  const peaks = findPeaks(mag, binSize, noiseFloor);
  if (peaks.length === 0) return [];

  // Deduplicate candidates that snap to the same semitone, keeping the loudest.
  const byMidi = new Map<number, Peak>();
  for (const p of peaks) {
    const midi = freqToMidi(p.freq);
    const prev = byMidi.get(midi);
    if (!prev || p.mag > prev.mag) byMidi.set(midi, p);
  }
  const candidates = Array.from(byMidi.values());

  const notes: DetectedNote[] = [];
  const seenMidi = new Set<number>();
  let firstSalience = 0;

  for (let iter = 0; iter < MAX_NOTES; iter++) {
    let best: Peak | null = null;
    let bestSal = 0;
    for (const c of candidates) {
      if (c.used) continue;
      const sal = salience(mag, binSize, c.freq);
      if (sal > bestSal) { bestSal = sal; best = c; }
    }
    if (!best) break;
    if (iter === 0) firstSalience = bestSal;
    else if (bestSal < firstSalience * REL_SALIENCE_FLOOR) break;

    best.used = true;
    const midi = freqToMidi(best.freq);
    if (!seenMidi.has(midi)) {
      seenMidi.add(midi);
      const { name, octave, pitchClass } = midiToName(midi);
      notes.push({ name, octave, pitchClass, frequency: best.freq, amplitude: bestSal });
    }
    cancelHarmonics(mag, binSize, best.freq, magAt(mag, binSize, best.freq));
  }

  notes.sort((a, b) => a.frequency - b.frequency);
  return notes;
}

// ---------------------------------------------------------------------------
// Chord matching
// ---------------------------------------------------------------------------

function chordSymbol(rootName: string, suffix: string): string {
  return rootName + suffix;
}

/** Match a (smoothed) chromagram against the template vocabulary via cosine similarity. */
export function matchChords(chroma: number[], bassPc: number | null): ChordMatch[] {
  const chromaNorm = Math.sqrt(chroma.reduce((s, v) => s + v * v, 0));
  if (chromaNorm < 1e-6) return [];

  interface Scored extends ChordMatch { score: number; mask: number; }
  const scored: Scored[] = [];

  for (let root = 0; root < 12; root++) {
    for (const t of TEMPLATE_VECTORS) {
      let dot = 0;
      let mask = 0;
      for (let i = 0; i < t.intervals.length; i++) {
        const pc = (root + t.intervals[i]) % 12;
        dot += chroma[pc];
        mask |= 1 << pc;
      }
      const cosine = dot / (chromaNorm * t.norm);
      if (cosine < MIN_CONF_SHOW) continue;

      // Bass weighting: reward chords whose root sits in the bass (root position),
      // mildly reward chords that at least contain the bass as a chord tone,
      // penalize chords whose bass note isn't part of the chord at all.
      let score = cosine;
      if (bassPc !== null) {
        if (root === bassPc) score *= 1.12;
        else if (mask & (1 << bassPc)) score *= 1.0;
        else score *= 0.9;
      }

      const rootName = NOTE_NAMES[root];
      scored.push({
        root: rootName,
        rootPc: root,
        type: t.type,
        symbol: chordSymbol(rootName, t.suffix),
        quality: t.quality,
        confidence: Math.min(1, cosine),
        score,
        mask,
      });
    }
  }

  // Collapse identical pitch-class sets (e.g. C6 vs Am7, the four dim7 spellings),
  // keeping the best-scoring interpretation — the bass bonus picks the right name.
  const byMask = new Map<number, Scored>();
  for (const s of scored) {
    const prev = byMask.get(s.mask);
    if (!prev || s.score > prev.score) byMask.set(s.mask, s);
  }

  return Array.from(byMask.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score: _score, mask: _mask, ...m }) => m);
}

/** Name the interval between exactly two active pitch classes, lowest (bass) first. */
function intervalFromPcs(pcs: number[], bassPc: number | null): IntervalInfo {
  let low: number, high: number;
  if (bassPc !== null && pcs.includes(bassPc)) {
    low = bassPc;
    high = pcs[0] === bassPc ? pcs[1] : pcs[0];
  } else {
    [low, high] = pcs[0] <= pcs[1] ? [pcs[0], pcs[1]] : [pcs[1], pcs[0]];
  }
  const semis = (((high - low) % 12) + 12) % 12;
  return { lowName: NOTE_NAMES[low], highName: NOTE_NAMES[high], name: INTERVAL_NAMES[semis] };
}

// ---------------------------------------------------------------------------
// Stateful engine (handles smoothing + stability across frames)
// ---------------------------------------------------------------------------

export class ChordEngine {
  private smoothedChroma: number[] = new Array(12).fill(0);
  private lastBassPc: number | null = null;
  private bassHoldUntil = 0;
  private lastSymbol = '';
  private stableCount = 0;

  reset(): void {
    this.smoothedChroma = new Array(12).fill(0);
    this.lastBassPc = null;
    this.bassHoldUntil = 0;
    this.lastSymbol = '';
    this.stableCount = 0;
  }

  /**
   * Process one frame of dB spectrum data.
   * @param dbSpectrum  output of AnalyserNode.getFloatFrequencyData
   * @param sampleRate  AudioContext.sampleRate
   * @param fftSize     AnalyserNode.fftSize
   * @param now         performance.now() timestamp (for bass hold timing)
   */
  process(dbSpectrum: Float32Array, sampleRate: number, fftSize: number, now: number): AnalysisResult {
    const binSize = sampleRate / fftSize;
    const mag = dbToLinear(dbSpectrum);

    // Input level + noise gate (use the loudest peak in the musical range).
    let maxMag = 0;
    const maxBin = Math.min(mag.length - 1, Math.ceil(F_MAX / binSize));
    for (let i = 2; i <= maxBin; i++) if (mag[i] > maxMag) maxMag = mag[i];

    const levelDb = maxMag > 0 ? 20 * Math.log10(maxMag) : -120;
    const level = Math.max(0, Math.min(100, ((levelDb + 72) / 60) * 100));

    if (maxMag < SILENCE_LIN) {
      // Decay the smoothed chroma toward silence so the display fades out cleanly.
      for (let i = 0; i < 12; i++) this.smoothedChroma[i] *= 0.8;
      const stillRinging = Math.max(...this.smoothedChroma) > 0.08;
      if (!stillRinging) {
        this.smoothedChroma.fill(0);
        this.lastSymbol = '';
        this.stableCount = 0;
      }
      return this.buildResult(level, true, [], now);
    }

    const noiseFloor = Math.max(SILENCE_LIN, maxMag * 0.045);
    const notes = detectFundamentals(mag, binSize, noiseFloor);

    // Instantaneous chroma from the cleaned fundamentals.
    const frameChroma = new Array(12).fill(0);
    for (const n of notes) frameChroma[n.pitchClass] += n.amplitude;
    const frameMax = Math.max(...frameChroma, 1e-9);
    for (let i = 0; i < 12; i++) frameChroma[i] /= frameMax;

    // Exponential moving average for stability.
    for (let i = 0; i < 12; i++) {
      this.smoothedChroma[i] = CHROMA_EMA * this.smoothedChroma[i] + (1 - CHROMA_EMA) * frameChroma[i];
    }

    // Bass = lowest detected fundamental, held briefly to avoid flicker.
    if (notes.length > 0) {
      this.lastBassPc = notes[0].pitchClass;
      this.bassHoldUntil = now + 600;
    } else if (now > this.bassHoldUntil) {
      this.lastBassPc = null;
    }

    return this.buildResult(level, false, notes, now);
  }

  private buildResult(level: number, silent: boolean, notes: DetectedNote[], now: number): AnalysisResult {
    const chroma = this.smoothedChroma.slice();
    const max = Math.max(...chroma);
    const activePitchClasses: number[] = [];
    if (max > 0.05) {
      for (let i = 0; i < 12; i++) {
        if (chroma[i] >= max * ACTIVE_PC_RATIO) activePitchClasses.push(i);
      }
    }

    const bassPc = now <= this.bassHoldUntil ? this.lastBassPc : (silent ? null : this.lastBassPc);
    const matches = matchChords(chroma, bassPc);

    const primary =
      matches.length > 0 &&
      matches[0].confidence >= MIN_CONF_PRIMARY &&
      activePitchClasses.length >= 2
        ? matches[0]
        : null;

    // Stability tracking on the primary chord symbol.
    const sym = primary?.symbol ?? '';
    if (sym && sym === this.lastSymbol) this.stableCount++;
    else this.stableCount = 0;
    this.lastSymbol = sym;
    const stable = !!primary && this.stableCount >= STABLE_FRAMES;

    // Only call it an "interval" when exactly two pitch classes are genuinely
    // active — this ignores faint uncancelled harmonic residue from single notes.
    const interval =
      !primary && activePitchClasses.length === 2
        ? intervalFromPcs(activePitchClasses, bassPc)
        : null;

    return {
      level,
      silent,
      chroma,
      activePitchClasses,
      bassPc,
      notes,
      matches,
      primary,
      interval,
      stable,
    };
  }
}

/**
 * MONOPHONIC PITCH TRACKER (voice / single instrument)
 * ----------------------------------------------------
 * F0 estimation via the McLeod Pitch Method (MPM), using the `pitchy` library.
 * MPM (McLeod & Wyvill, "A Smarter Way to Find Pitch") is more octave-robust
 * on real voice than plain YIN and gives a well-calibrated clarity score we use
 * for voiced/unvoiced decisions.
 *
 * We keep the same PitchReading interface and detect() signature as before, so
 * the visualization layer is untouched. On top of pitchy we add: a range gate,
 * voiced-clarity hysteresis (so sustained notes don't drop out), and median
 * smoothing to suppress single-frame outliers without smearing vibrato.
 */

import { PitchDetector } from 'pitchy';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchReading {
  frequency: number;   // Hz, 0 when unvoiced
  midi: number;        // fractional MIDI (e.g. 69.12), -1 when unvoiced
  note: string;        // nearest note name, '' when unvoiced
  octave: number;
  cents: number;       // deviation from the nearest semitone, -50..+50
  clarity: number;     // 0-1 voicing confidence
  voiced: boolean;
}

const A4 = 440;
const MIN_F0 = 65;     // ~C2 — covers low male voices / bass
const MAX_F0 = 1200;   // ~D6 — covers high female voices

// Voiced decision: require solid clarity to start, but once we're already
// tracking a note accept weaker frames so sustained notes don't flicker out.
const CLARITY_START = 0.68;
const CLARITY_HOLD = 0.50;

export const UNVOICED: PitchReading = {
  frequency: 0, midi: -1, note: '', octave: 0, cents: 0, clarity: 0, voiced: false,
};

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / A4);
}

export function midiToFreq(midi: number): number {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): { note: string; octave: number } {
  const rounded = Math.round(midi);
  const pc = ((rounded % 12) + 12) % 12;
  return { note: NOTE_NAMES[pc], octave: Math.floor(rounded / 12) - 1 };
}

export class PitchTracker {
  private detector: PitchDetector<Float32Array> | null = null;
  private detectorLen = 0;

  // Median smoothing on the output frequency to tame jitter without killing vibrato.
  private history: number[] = [];
  // Voiced-frame streak for hysteresis on the clarity gate.
  private voicedStreak = 0;

  private ensureDetector(windowSize: number) {
    if (this.detector && this.detectorLen === windowSize) return;
    const d = PitchDetector.forFloat32Array(windowSize);
    // RMS gate handled by pitchy: ignore very quiet input (-55 dB ≈ near silence).
    d.minVolumeDecibels = -55;
    // MPM peak-picking constant k; 0.8–1.0 is the useful range. Slightly relaxed
    // from the 0.9 default so a real (imperfect) voice resolves more readily.
    d.clarityThreshold = 0.85;
    this.detector = d;
    this.detectorLen = windowSize;
  }

  detect(buffer: Float32Array, sampleRate: number): PitchReading {
    this.ensureDetector(buffer.length);
    const detector = this.detector!;

    const [pitch, clarity] = detector.findPitch(buffer, sampleRate);

    // Voicing decision with hysteresis: easier to stay voiced than to start.
    const gate = this.voicedStreak > 2 ? CLARITY_HOLD : CLARITY_START;
    const inRange = pitch >= MIN_F0 && pitch <= MAX_F0;
    if (pitch <= 0 || clarity < gate || !inRange) {
      this.voicedStreak = 0;
      this.history.length = 0;
      return UNVOICED;
    }

    // Median-of-5 smoothing on frequency to suppress outliers and stabilize the
    // note read at semitone boundaries, without smearing real vibrato.
    this.history.push(pitch);
    if (this.history.length > 5) this.history.shift();
    const smoothed = median(this.history);

    const midi = freqToMidi(smoothed);
    const rounded = Math.round(midi);
    const cents = (midi - rounded) * 100;
    const { note, octave } = midiToNoteName(midi);

    this.voicedStreak = Math.min(this.voicedStreak + 1, 20);
    return { frequency: smoothed, midi, note, octave, cents, clarity, voiced: true };
  }

  reset() { this.history.length = 0; this.voicedStreak = 0; }
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

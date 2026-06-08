/**
 * MONOPHONIC PITCH TRACKER (voice / single instrument)
 * ----------------------------------------------------
 * Time-domain F0 estimation with the YIN algorithm
 * (de Cheveigné & Kawahara, 2002) — the standard for accurate,
 * octave-robust pitch tracking of a single voice.
 *
 * Steps: difference function -> cumulative mean normalized difference
 *        -> absolute threshold -> local-minimum refinement
 *        -> parabolic interpolation for sub-sample (sub-cent) accuracy.
 */

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
const MAX_F0 = 1200;   // ~D6 — covers high female / whistle is excluded
const DEFAULT_THRESHOLD = 0.12;

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

/**
 * Estimate the fundamental frequency of a time-domain buffer using YIN.
 * @param buffer    Float32 PCM samples (e.g. from getFloatTimeDomainData)
 * @param sampleRate AudioContext sample rate
 * @param threshold YIN absolute threshold (lower = stricter voicing)
 */
export class PitchTracker {
  private readonly threshold: number;
  private yinBuffer: Float32Array;
  private maxTau: number;
  private minTau: number;
  private sampleRate = 44100;

  // Light temporal smoothing to tame jitter without killing vibrato.
  private history: number[] = [];

  constructor(threshold = DEFAULT_THRESHOLD) {
    this.threshold = threshold;
    this.maxTau = 1;
    this.minTau = 1;
    this.yinBuffer = new Float32Array(1);
  }

  private configure(sampleRate: number, windowSize: number) {
    if (this.sampleRate === sampleRate && this.yinBuffer.length === windowSize >> 1) return;
    this.sampleRate = sampleRate;
    this.maxTau = Math.min(windowSize >> 1, Math.ceil(sampleRate / MIN_F0));
    this.minTau = Math.max(2, Math.floor(sampleRate / MAX_F0));
    this.yinBuffer = new Float32Array(windowSize >> 1);
  }

  detect(buffer: Float32Array, sampleRate: number): PitchReading {
    const W = buffer.length;
    this.configure(sampleRate, W);
    const half = W >> 1;
    const yin = this.yinBuffer;

    // Signal energy gate (RMS) — reject near-silence early.
    let energy = 0;
    for (let i = 0; i < W; i++) energy += buffer[i] * buffer[i];
    const rms = Math.sqrt(energy / W);
    if (rms < 0.004) { this.history.length = 0; return UNVOICED; }

    // 1) Difference function d(tau).
    yin[0] = 1;
    for (let tau = 1; tau < half; tau++) {
      let sum = 0;
      for (let i = 0; i < half; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yin[tau] = sum;
    }

    // 2) Cumulative mean normalized difference d'(tau).
    let running = 0;
    for (let tau = 1; tau < half; tau++) {
      running += yin[tau];
      yin[tau] = running > 0 ? (yin[tau] * tau) / running : 1;
    }

    // 3) Absolute threshold: first tau below threshold within the F0 range,
    //    then descend to its local minimum. Track the global minimum too, so
    //    a real (imperfectly periodic) voice still resolves when nothing dips
    //    below the strict threshold — without this, live voice reads UNVOICED.
    const searchEnd = Math.min(this.maxTau, half - 1);
    let tauEstimate = -1;
    let globalMinTau = this.minTau;
    let globalMinVal = Infinity;
    for (let tau = this.minTau; tau < searchEnd; tau++) {
      if (yin[tau] < globalMinVal) { globalMinVal = yin[tau]; globalMinTau = tau; }
      if (yin[tau] < this.threshold) {
        while (tau + 1 < half && yin[tau + 1] < yin[tau]) tau++;
        tauEstimate = tau;
        break;
      }
    }
    if (tauEstimate === -1) {
      // Fallback: accept the global minimum if it's at least moderately periodic.
      if (globalMinVal < 0.55) tauEstimate = globalMinTau;
      else { this.history.length = 0; return UNVOICED; }
    }

    const clarity = Math.max(0, 1 - yin[tauEstimate]);

    // 4) Parabolic interpolation around the chosen tau.
    const x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
    const x2 = tauEstimate + 1 < half ? tauEstimate + 1 : tauEstimate;
    let betterTau = tauEstimate;
    if (x0 !== tauEstimate && x2 !== tauEstimate) {
      const s0 = yin[x0], s1 = yin[tauEstimate], s2 = yin[x2];
      const denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) betterTau = tauEstimate + (s2 - s0) / denom;
    }

    const frequency = sampleRate / betterTau;
    if (frequency < MIN_F0 || frequency > MAX_F0) { this.history.length = 0; return UNVOICED; }

    // 5) Median-of-3 smoothing on frequency to suppress single-frame outliers.
    this.history.push(frequency);
    if (this.history.length > 3) this.history.shift();
    const smoothed = median(this.history);

    const midi = freqToMidi(smoothed);
    const rounded = Math.round(midi);
    const cents = (midi - rounded) * 100;
    const { note, octave } = midiToNoteName(midi);

    return { frequency: smoothed, midi, note, octave, cents, clarity, voiced: true };
  }

  reset() { this.history.length = 0; }
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

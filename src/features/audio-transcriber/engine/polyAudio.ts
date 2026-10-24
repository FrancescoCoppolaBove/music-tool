import type { NoteEvent } from '../types';
import { hannWindow, magnitudeSpectrum } from './dsp';

export const MODEL_SAMPLE_RATE = 22050;

/** Neural activation can be strong even on amplified recording noise. Check
 * original audio energy independently, before assigning velocities or chords.
 */
export function filterSilentNotes(notes: NoteEvent[], signal: Float32Array, sampleRate: number): NoteEvent[] {
  const hop = Math.max(1, Math.round(sampleRate * 0.02));
  const rms: number[] = [];
  let peak = 0;
  for (let start = 0; start < signal.length; start += hop) {
    const end = Math.min(signal.length, start + hop);
    let sum = 0, squares = 0;
    for (let i = start; i < end; i++) {
      sum += signal[i];
      squares += signal[i] * signal[i];
    }
    const count = end - start;
    // A DC offset is not evidence of a sounding instrument.
    const value = Math.sqrt(Math.max(0, squares / count - (sum / count) ** 2));
    rms.push(value);
    peak = Math.max(peak, value);
  }
  const positive = rms.filter(value => value > 1e-8).sort((a, b) => a - b);
  const floor = positive[Math.floor(positive.length * 0.1)] ?? 0;
  const reference = Math.max(positive[Math.floor(positive.length * 0.9)] ?? 0, peak * 0.1);
  // Adapt only to a very low recording floor separated from the music by 30 dB.
  // Uniformly quiet recordings retain their gain; no fixed -60 dB cutoff.
  const hasNoiseFloor = floor > 0 && floor <= 1e-4 && reference >= floor * 32;
  const open = Math.max(1e-7, hasNoiseFloor ? Math.min(floor * 4, reference * 0.003) : 0);
  const close = open * 0.5;
  const frameSeconds = hop / sampleRate;
  return notes.flatMap(note => {
    const endSec = Math.min(signal.length / sampleRate, note.startSec + note.durationSec);
    const first = Math.max(0, Math.floor((note.startSec - 0.02) / frameSeconds));
    const attackEnd = Math.min(rms.length - 1,
      Math.floor(Math.min(endSec, note.startSec + 0.12) / frameSeconds));
    let supported = false, consecutive = 0;
    for (let i = first; i <= attackEnd; i++) {
      consecutive = rms[i] >= open ? consecutive + 1 : 0;
      // A near-floor one-frame click is not a musical onset. Strong staccato
      // attacks still pass immediately; weak notes need two energy frames.
      if (consecutive >= 2 || rms[i] >= open * 3.16) { supported = true; break; }
    }
    if (!supported) return [];
    let last = Math.min(rms.length - 1, Math.floor(endSec / frameSeconds));
    while (last >= first && rms[last] < close) last--;
    // Preserve short gaps and natural release; trim only a sustained silent tail.
    const supportedEnd = Math.max(note.startSec, (last + 1) * frameSeconds + 0.08);
    const end = endSec - supportedEnd > 0.15 ? supportedEnd : endSec;
    return end - note.startSec >= 0.04 ? [{ ...note, durationSec: end - note.startSec }] : [];
  });
}

/** Reject only candidates whose sampled windows are consistently broadband.
 * This is a tonality guard, not proof that any particular pitch is correct.
 */
export function rejectBroadbandNotes(notes: NoteEvent[], signal: Float32Array, sampleRate: number): NoteEvent[] {
  const size = 2048;
  const window = hannWindow(size);
  const frame = new Float32Array(size);
  const cache = new Map<number, boolean>();
  const isTonal = (center: number): boolean => {
    const bin = Math.round(center / 256);
    const cached = cache.get(bin);
    if (cached !== undefined) return cached;
    const start = bin * 256 - size / 2;
    for (let i = 0; i < size; i++) frame[i] = signal[start + i] ?? 0;
    const spectrum = magnitudeSpectrum(frame, window);
    const first = Math.max(1, Math.floor(25 * size / sampleRate));
    const last = Math.min(spectrum.length, Math.ceil(9000 * size / sampleRate));
    let sum = 0, logs = 0;
    for (let i = first; i < last; i++) {
      const power = Math.max(1e-20, spectrum[i] ** 2);
      sum += power;
      logs += Math.log(power);
    }
    const count = Math.max(1, last - first);
    const flatness = Math.exp(logs / count) / (sum / count);
    const tonal = sum > 1e-12 && flatness < 0.45;
    cache.set(bin, tonal);
    return tonal;
  };
  return notes.filter(note => [0.2, 0.5, 0.8].some(fraction =>
    isTonal((note.startSec + Math.min(0.15, note.durationSec) * fraction) * sampleRate)));
}

/** Windowed-sinc resampling with an anti-aliasing filter before downsampling. */
export function resampleForModel(signal: Float32Array, sampleRate: number): Float32Array {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('Invalid audio sample rate.');
  if (sampleRate === MODEL_SAMPLE_RATE) return signal;
  const ratio = sampleRate / MODEL_SAMPLE_RATE;
  const output = new Float32Array(Math.round(signal.length / ratio));
  const cutoff = Math.min(1, 1 / ratio) * 0.94;
  const radius = Math.ceil(24 / cutoff);
  const phases = 512;
  // Cache fractional phases to avoid trigonometry for every sample.
  const kernels = Array.from({ length: phases }, (_, phase) => {
    const weights = new Float64Array(radius * 2 + 1);
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const distance = k - phase / phases;
      const x = Math.PI * cutoff * distance;
      const weight = Math.abs(distance) < radius
        ? (x === 0 ? 1 : Math.sin(x) / x) * (0.5 + 0.5 * Math.cos(Math.PI * distance / radius)) : 0;
      weights[k + radius] = weight;
      sum += weight;
    }
    return weights.map(w => w / sum);
  });
  for (let i = 0; i < output.length; i++) {
    const position = i * ratio;
    const center = Math.floor(position);
    const weights = kernels[Math.min(phases - 1, Math.floor((position - center) * phases))];
    let value = 0;
    for (let k = -radius; k <= radius; k++) value += (signal[center + k] ?? 0) * weights[k + radius];
    output[i] = value;
  }
  return output;
}

/** Join only notes crossing an analysis-chunk seam, never arbitrary repeated notes. */
export function appendChunkNotes(notes: NoteEvent[], next: NoteEvent[], seamSec: number): void {
  for (const note of next) {
    let previous: NoteEvent | undefined;
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      if (n.midi === note.midi && n.startSec < seamSec && n.startSec + n.durationSec >= seamSec - 0.04) {
        previous = n;
        break;
      }
    }
    if (previous && note.startSec < seamSec - 0.04) {
      previous.durationSec = Math.max(previous.startSec + previous.durationSec,
        note.startSec + note.durationSec) - previous.startSec;
      previous.confidence = Math.max(previous.confidence ?? 0, note.confidence ?? 0);
    } else {
      const end = note.startSec + note.durationSec;
      notes.push({ ...note, startSec: Math.max(seamSec, note.startSec), durationSec: end - Math.max(seamSec, note.startSec) });
    }
  }
}

/** Relative attack loudness, not a calibrated estimate of the original MIDI velocity. */
export function estimateVelocities(notes: NoteEvent[], signal: Float32Array, sampleRate: number): void {
  const energies = notes.map(note => {
    const start = Math.max(0, Math.floor(note.startSec * sampleRate));
    const end = Math.min(signal.length, start + Math.round(Math.min(0.08, note.durationSec) * sampleRate));
    let energy = 0;
    for (let i = start; i < end; i++) energy += signal[i] ** 2;
    return Math.sqrt(energy / Math.max(1, end - start));
  });
  const peak = energies.reduce((max, value) => Math.max(max, value), 1e-8);
  notes.forEach((note, i) => { note.velocity = Math.max(0.05, Math.min(1, Math.sqrt(energies[i] / peak))); });
}

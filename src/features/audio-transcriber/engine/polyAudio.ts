import type { NoteEvent } from '../types';

export const MODEL_SAMPLE_RATE = 22050;

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

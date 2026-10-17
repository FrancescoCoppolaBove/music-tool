// src/features/audio-transcriber/engine/onsetDetector.ts
// Spectral flux: somma delle differenze positive tra spettri di frame adiacenti.
// Picchi sopra soglia adattiva (media locale) = attacchi di nota.

import { hannWindow, magnitudeSpectrum } from './dsp';

export interface OnsetResult {
  flux: Float32Array;   // curva di flux, un valore per frame
  frameRate: number;    // frame al secondo (sampleRate / hop)
  onsets: number[];     // tempi degli attacchi, in secondi
}

const LOCAL_MAX_RADIUS = 3;
const THRESHOLD_WINDOW = 10;
const THRESHOLD_FACTOR = 1.5;
const MIN_ONSET_GAP_SEC = 0.05;

export function detectOnsets(
  signal: Float32Array,
  sampleRate: number,
  windowSize = 2048,
  hop = 512,
): OnsetResult {
  const win = hannWindow(windowSize);
  const n = Math.max(0, Math.floor((signal.length - windowSize) / hop));
  const frameRate = sampleRate / hop;
  const flux = new Float32Array(n);
  const frame = new Float32Array(windowSize);
  let prev: Float32Array | null = null;

  for (let i = 0; i < n; i++) {
    frame.set(signal.subarray(i * hop, i * hop + windowSize));
    const mag = magnitudeSpectrum(frame, win);
    if (prev) {
      let s = 0;
      for (let b = 0; b < mag.length; b++) {
        const d = mag[b] - prev[b];
        if (d > 0) s += d;
      }
      flux[i] = s;
    }
    prev = mag;
  }

  const onsets: number[] = [];
  for (let i = LOCAL_MAX_RADIUS; i < n - LOCAL_MAX_RADIUS; i++) {
    let isMax = true;
    for (let k = -LOCAL_MAX_RADIUS; k <= LOCAL_MAX_RADIUS; k++) {
      if (flux[i] < flux[i + k]) { isMax = false; break; }
    }
    if (!isMax) continue;
    let s = 0, c = 0;
    for (let j = Math.max(0, i - THRESHOLD_WINDOW); j < Math.min(n, i + THRESHOLD_WINDOW); j++) {
      s += flux[j]; c++;
    }
    if (flux[i] > (s / c) * THRESHOLD_FACTOR + 1e-4) {
      const t = (i * hop) / sampleRate;
      if (onsets.length === 0 || t - onsets[onsets.length - 1] > MIN_ONSET_GAP_SEC) {
        onsets.push(t);
      }
    }
  }

  return { flux, frameRate, onsets };
}

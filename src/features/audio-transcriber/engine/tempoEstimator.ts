// src/features/audio-transcriber/engine/tempoEstimator.ts
// BPM per autocorrelazione della curva di spectral flux, con peso log-gaussiano
// centrato su 120 BPM per risolvere l'ambiguità di ottava del tempo (ISMIR 2004).
// La fase del beat (offset del downbeat) massimizza il flux campionato sul comb.

import { mean } from './dsp';

export interface TempoResult {
  bpm: number | null;
  confidence: number;    // 0..1 — autocorrelazione normalizzata al lag scelto
  beatOffsetSec: number; // offset del primo beat dall'inizio del segnale
}

const BPM_MIN = 40;
const BPM_MAX = 200;
const CONFIDENCE_FLOOR = 0.15;
const OCTAVE_SIGMA = 0.9; // larghezza del peso log-gaussiano

const NO_TEMPO: TempoResult = { bpm: null, confidence: 0, beatOffsetSec: 0 };

export function estimateTempo(flux: Float32Array, frameRate: number): TempoResult {
  const n = flux.length;
  if (n < frameRate * 4) return NO_TEMPO; // servono almeno ~4 secondi

  const x = Float32Array.from(flux);
  const m = mean(x);
  for (let i = 0; i < n; i++) x[i] = Math.max(0, x[i] - m);

  let e0 = 0;
  for (let i = 0; i < n; i++) e0 += x[i] * x[i];
  if (e0 <= 0) return NO_TEMPO;

  const minLag = Math.round((frameRate * 60) / BPM_MAX);
  const maxLag = Math.min(n - 1, Math.round((frameRate * 60) / BPM_MIN));

  let bestLag = -1, bestScore = 0, bestAcf = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acf = 0;
    for (let i = 0; i < n - lag; i++) acf += x[i] * x[i + lag];
    acf /= e0;
    const bpm = (60 * frameRate) / lag;
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / OCTAVE_SIGMA, 2));
    const score = acf * w;
    if (score > bestScore) { bestScore = score; bestLag = lag; bestAcf = acf; }
  }
  if (bestLag < 0) return NO_TEMPO;

  const confidence = Math.min(1, bestAcf);
  if (confidence < CONFIDENCE_FLOOR) return { bpm: null, confidence, beatOffsetSec: 0 };

  // Fase: l'offset nel periodo che massimizza il flux sommato sul comb di beat.
  let bestOff = 0, bestSum = -1;
  for (let off = 0; off < bestLag; off++) {
    let s = 0;
    for (let i = off; i < n; i += bestLag) s += flux[i];
    if (s > bestSum) { bestSum = s; bestOff = off; }
  }

  return {
    bpm: Math.round(((60 * frameRate) / bestLag) * 10) / 10,
    confidence,
    beatOffsetSec: bestOff / frameRate,
  };
}

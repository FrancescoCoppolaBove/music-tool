// src/features/audio-transcriber/engine/polyTranscriber.ts
// Multi-pitch stile Klapuri: STFT → whitening spettrale → salience function
// (somma pesata 1/h dell'energia alle posizioni armoniche) → stima iterativa
// con sottrazione del pettine armonico → tracking temporale con isteresi.
//
// Pass 1: energy gate con isteresi → regioni attive
// Pass 2: Klapuri (STFT + salience + comb) solo nelle regioni attive
// Pass 3: tracking temporale — invariato rispetto alla versione precedente

import { hannWindow, magnitudeSpectrum, parabolicBin, freqToMidi, midiToFreq, rms } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

let _noteIdCounter = 0;

const HOP = 1024;
const HARMONICS = 10;
const SALIENCE_RATIO = 0.5;
const SALIENCE_FLOOR = 0.5;
const MIN_FRAMES = 3;        // isteresi: una nota esiste se vista in ≥3 frame
const MAX_GAP = 2;           //            e sopravvive a 2 frame di assenza
const SUBTRACT_FACTOR = 0.1; // attenuazione dei bin armonici dopo ogni estrazione

const GATE_LOOKAHEAD = 2;
const MIN_REGION_FRAMES = 4;

const POLY_GATE: Partial<Record<InstrumentKind, { open: number; close: number }>> = {
  keyboard:        { open: 0.07, close: 0.025 },
  guitar:          { open: 0.07, close: 0.025 },
  'winds-section': { open: 0.05, close: 0.020 },
};
const DEFAULT_POLY_GATE = { open: 0.07, close: 0.025 };

interface FramePitch { midi: number; cents: number; salience: number; }

interface Track {
  midi: number;
  startFrame: number;
  lastFrame: number;
  count: number;
  salSum: number;
  centsSum: number;
  gap: number;
}

/** Max locale su 3 bin attorno a b. */
function peakNear(spec: Float32Array, b: number): number {
  return Math.max(spec[b - 1] ?? 0, spec[b] ?? 0, spec[b + 1] ?? 0);
}

/** Whitening: divide ogni bin per la media locale (prefix sum, finestra crescente col bin). */
function whiten(mag: Float32Array): void {
  const n = mag.length;
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + mag[i];
  for (let i = 0; i < n; i++) {
    const w = Math.max(10, i >> 3);
    const a = Math.max(0, i - w);
    const b = Math.min(n, i + w + 1);
    mag[i] = mag[i] / ((pre[b] - pre[a]) / (b - a) + 1e-6);
  }
}

function findPitchesInFrame(
  mag: Float32Array,
  binHz: number,
  minMidi: number,
  maxMidi: number,
  maxPoly: number,
): FramePitch[] {
  const spec = Float32Array.from(mag);
  let mx = 0;
  for (let i = 0; i < spec.length; i++) if (spec[i] > mx) mx = spec[i];
  if (mx < 1e-6) return [];
  for (let i = 0; i < spec.length; i++) spec[i] /= mx;

  const out: FramePitch[] = [];
  let firstSal = 0;

  for (let iter = 0; iter < maxPoly; iter++) {
    let bestMidi = -1, bestSal = 0;
    for (let m = minMidi; m <= maxMidi; m++) {
      const f0 = midiToFreq(m);
      const fundBin = Math.round(f0 / binHz);
      if (fundBin < 1 || fundBin >= spec.length - 1) continue;
      if (peakNear(spec, fundBin) < 0.05) continue;
      let isHarmonicOfFound = false;
      for (const found of out) {
        const fLow = midiToFreq(found.midi);
        const ratio = f0 / fLow;
        const nearestInt = Math.round(ratio);
        if (nearestInt >= 3 && Math.abs(ratio - nearestInt) < 0.05) {
          isHarmonicOfFound = true;
          break;
        }
      }
      if (isHarmonicOfFound) continue;
      let hasSubharmonicFundamental = false;
      for (let h = 3; h <= HARMONICS; h++) {
        const subF = f0 / h;
        const subBin = Math.round(subF / binHz);
        if (subBin < 1) break;
        const subMidi = Math.round(freqToMidi(subF));
        if (subMidi < minMidi || subMidi > maxMidi) continue;
        if (peakNear(spec, subBin) > 0.05) { hasSubharmonicFundamental = true; break; }
      }
      if (hasSubharmonicFundamental) continue;
      let sal = 0;
      for (let h = 1; h <= HARMONICS; h++) {
        const b = Math.round((h * f0) / binHz);
        if (b >= spec.length - 1) break;
        sal += peakNear(spec, b) / h;
      }
      if (sal > bestSal) { bestSal = sal; bestMidi = m; }
    }
    if (bestMidi < 0) break;
    if (iter === 0) firstSal = bestSal;
    if (bestSal < SALIENCE_RATIO * firstSal || bestSal < SALIENCE_FLOOR) break;

    const f0 = midiToFreq(bestMidi);
    const fb = Math.round(f0 / binHz);
    const refinedFreq = parabolicBin(spec, fb) * binHz;
    const centsRaw = (freqToMidi(refinedFreq) - bestMidi) * 100;
    const cents = Number.isFinite(centsRaw) ? Math.max(-50, Math.min(50, centsRaw)) : 0;

    out.push({ midi: bestMidi, cents, salience: bestSal });

    for (let h = 1; h <= HARMONICS; h++) {
      const b = Math.round((h * f0) / binHz);
      if (b >= spec.length - 1) break;
      if (b > 0) spec[b - 1] *= SUBTRACT_FACTOR;
      spec[b] *= SUBTRACT_FACTOR;
      spec[b + 1] *= SUBTRACT_FACTOR;
    }
  }
  return out;
}

export function transcribePoly(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  voiceCount = 6,
): NoteEvent[] {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const gate = POLY_GATE[instrument] ?? DEFAULT_POLY_GATE;
  const windowSize = cfg.windowSize;
  const binHz = sampleRate / windowSize;
  const win = hannWindow(windowSize);
  const nFrames = Math.max(0, Math.floor((signal.length - windowSize) / HOP));
  const minMidi = Math.ceil(freqToMidi(cfg.minF0));
  const maxMidi = Math.floor(freqToMidi(cfg.maxF0));

  // ── Pass 1: energy gate con isteresi ──────────────────────────────────────
  const tmpFrame = new Float32Array(windowSize);
  const frameRms = new Float32Array(nFrames);
  for (let i = 0; i < nFrames; i++) {
    tmpFrame.set(signal.subarray(i * HOP, i * HOP + windowSize));
    frameRms[i] = rms(tmpFrame);
  }

  const sortedRms = Float32Array.from(frameRms).sort();
  const peakRms = sortedRms[Math.floor(sortedRms.length * 0.97)] ?? 0;
  if (peakRms === 0) return [];

  const gateOpen = peakRms * gate.open;
  const gateClose = peakRms * gate.close;
  const activeRegions: Array<{ start: number; end: number }> = [];
  let gateIsOpen = false;
  let regionStart = 0;
  let prevRegionEnd = 0;

  for (let i = 0; i < nFrames; i++) {
    if (!gateIsOpen && frameRms[i] >= gateOpen) {
      gateIsOpen = true;
      regionStart = Math.max(prevRegionEnd, i - GATE_LOOKAHEAD);
    } else if (gateIsOpen && frameRms[i] < gateClose) {
      gateIsOpen = false;
      if (i - regionStart >= MIN_REGION_FRAMES) {
        activeRegions.push({ start: regionStart, end: i });
        prevRegionEnd = i;
      }
    }
  }
  if (gateIsOpen && nFrames - regionStart >= MIN_REGION_FRAMES) {
    activeRegions.push({ start: regionStart, end: nFrames });
  }

  // ── Pass 2 + 3: Klapuri + tracking solo nelle regioni attive ──────────────
  const open = new Map<number, Track>();
  const notes: NoteEvent[] = [];
  let globalMaxSal = 1e-9;

  const closeTrack = (t: Track) => {
    if (t.count >= MIN_FRAMES) {
      notes.push({
        id: `n${_noteIdCounter++}`,
        midi: t.midi,
        cents: Math.max(-50, Math.min(50, t.centsSum / t.count)),
        startSec: (t.startFrame * HOP) / sampleRate,
        durationSec: ((t.lastFrame - t.startFrame + 1) * HOP) / sampleRate,
        velocity: t.salSum / t.count,
      });
    }
  };

  const totalActiveFrames = activeRegions.reduce((s, r) => s + r.end - r.start, 0);
  let processedFrames = 0;

  const frame = new Float32Array(windowSize);
  for (const region of activeRegions) {
    for (let f = region.start; f < region.end; f++) {
      frame.set(signal.subarray(f * HOP, f * HOP + windowSize));
      const mag = magnitudeSpectrum(frame, win);
      whiten(mag);
      const found = findPitchesInFrame(mag, binHz, minMidi, maxMidi, voiceCount);

      const seen = new Set<number>();
      for (const p of found) {
        globalMaxSal = Math.max(globalMaxSal, p.salience);
        const t = open.get(p.midi);
        if (t) {
          t.lastFrame = f; t.count++; t.salSum += p.salience; t.centsSum += p.cents; t.gap = 0;
        } else {
          open.set(p.midi, {
            midi: p.midi, startFrame: f, lastFrame: f,
            count: 1, salSum: p.salience, centsSum: p.cents, gap: 0,
          });
        }
        seen.add(p.midi);
      }
      for (const [midi, t] of open) {
        if (!seen.has(midi)) {
          t.gap++;
          if (t.gap > MAX_GAP) { closeTrack(t); open.delete(midi); }
        }
      }

      processedFrames++;
      if (onProgress && processedFrames % 20 === 0) {
        onProgress(processedFrames / (totalActiveFrames || 1));
      }
    }
    // Flush tracce aperte a fine regione: il silenzio tra regioni resetta lo stato
    for (const t of open.values()) closeTrack(t);
    open.clear();
  }

  for (const n of notes) n.velocity = Math.min(1, n.velocity / globalMaxSal);
  return notes.sort((a, b) => a.startSec - b.startSec);
}

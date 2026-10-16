// src/features/audio-transcriber/engine/polyTranscriber.ts
// Multi-pitch stile Klapuri: STFT → whitening spettrale → salience function
// (somma pesata 1/h dell'energia alle posizioni armoniche) → stima iterativa
// con sottrazione del pettine armonico → tracking temporale con isteresi.
// Il fondamentale deve essere presente nello spettro: elimina i subarmonici
// fantasma (es. C3 "spiegato" da C4+G4).

import { hannWindow, magnitudeSpectrum, parabolicBin, freqToMidi, midiToFreq } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

const HOP = 1024;
const HARMONICS = 10;
const MAX_POLY = 6;          // max note simultanee
const SALIENCE_RATIO = 0.5;  // stop quando la salience scende sotto questa frazione della prima
const SALIENCE_FLOOR = 0.5;  // floor assoluto (spettro normalizzato a max=1)
const MIN_FRAMES = 3;        // isteresi: una nota esiste se vista in ≥3 frame
const MAX_GAP = 2;           //            e sopravvive a 2 frame di assenza
const SUBTRACT_FACTOR = 0.1; // attenuazione dei bin armonici dopo ogni estrazione

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
): FramePitch[] {
  const spec = Float32Array.from(mag);
  // normalizza a max=1; frame quasi silenziosi → niente note
  let mx = 0;
  for (let i = 0; i < spec.length; i++) if (spec[i] > mx) mx = spec[i];
  if (mx < 1e-6) return [];
  for (let i = 0; i < spec.length; i++) spec[i] /= mx;

  const out: FramePitch[] = [];
  let firstSal = 0;

  for (let iter = 0; iter < MAX_POLY; iter++) {
    let bestMidi = -1, bestSal = 0;
    for (let m = minMidi; m <= maxMidi; m++) {
      const f0 = midiToFreq(m);
      const fundBin = Math.round(f0 / binHz);
      if (fundBin < 1 || fundBin >= spec.length - 1) continue;
      // Fundamental presence check: skip if the fundamental bin is too weak
      if (peakNear(spec, fundBin) < 0.05) continue;
      // Sub-harmonic guard: skip if any already-found pitch explains this as a harmonic
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
      // Sub-harmonic check: skip if a valid note exists at f0/h (h≥2) and its
      // fundamental bin is present. This prevents harmonics from being picked
      // before their actual fundamental note.
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

    // cents dal picco raffinato (interpolazione parabolica al fondamentale)
    const f0 = midiToFreq(bestMidi);
    const fb = Math.round(f0 / binHz);
    const refinedFreq = parabolicBin(spec, fb) * binHz;
    const centsRaw = (freqToMidi(refinedFreq) - bestMidi) * 100;
    const cents = Number.isFinite(centsRaw) ? Math.max(-50, Math.min(50, centsRaw)) : 0;

    out.push({ midi: bestMidi, cents, salience: bestSal });

    // sottrazione del pettine armonico
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
): NoteEvent[] {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const windowSize = cfg.windowSize;
  const binHz = sampleRate / windowSize;
  const win = hannWindow(windowSize);
  const nFrames = Math.max(0, Math.floor((signal.length - windowSize) / HOP));
  const minMidi = Math.ceil(freqToMidi(cfg.minF0));
  const maxMidi = Math.floor(freqToMidi(cfg.maxF0));

  const open = new Map<number, Track>();
  const notes: NoteEvent[] = [];
  let globalMaxSal = 1e-9;

  const closeTrack = (t: Track) => {
    if (t.count >= MIN_FRAMES) {
      notes.push({
        id: Math.random().toString(36).slice(2),
        midi: t.midi,
        cents: Math.max(-50, Math.min(50, t.centsSum / t.count)),
        startSec: (t.startFrame * HOP) / sampleRate,
        durationSec: ((t.lastFrame - t.startFrame + 1) * HOP) / sampleRate,
        velocity: t.salSum / t.count, // normalizzata a fine funzione
      });
    }
  };

  const frame = new Float32Array(windowSize);
  for (let f = 0; f < nFrames; f++) {
    frame.set(signal.subarray(f * HOP, f * HOP + windowSize));
    const mag = magnitudeSpectrum(frame, win);
    whiten(mag);
    const found = findPitchesInFrame(mag, binHz, minMidi, maxMidi);

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

    if (onProgress && f % 20 === 0) onProgress(f / nFrames);
  }
  for (const t of open.values()) closeTrack(t);

  for (const n of notes) n.velocity = Math.min(1, n.velocity / globalMaxSal);
  return notes.sort((a, b) => a.startSec - b.startSec);
}

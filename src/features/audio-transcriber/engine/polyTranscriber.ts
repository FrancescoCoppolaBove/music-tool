// src/features/audio-transcriber/engine/polyTranscriber.ts
// Multi-pitch ispirato a Klapuri (2006), pYIN (Mauch & Dixon 2014), Basic Pitch (Spotify 2022),
// Benetos et al. (2019 survey):
//
// Pass 1: energy gate con isteresi → regioni attive
// Pass 2: onset detection → set di frame-onset per analisi post-transiente e boundary reset
// Pass 3: per ogni frame attivo — STFT → whitening → salience su armonici totali (Klapuri)
//         con analisi post-onset per chitarra (Basic Pitch: salta il click/pizzico)
// Pass 4: soft tracking con log-probabilità (pYIN HMM semplificato):
//         le note sopravvivono in base a un decay esponenziale per strumento;
//         gli onset resettano la probabilità delle tracce aperte (Benetos).

import { hannWindow, magnitudeSpectrum, parabolicBin, freqToMidi, midiToFreq, rms } from './dsp';
import { detectOnsets } from './onsetDetector';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

let _noteIdCounter = 0;

const HOP = 1024;
const HARMONICS = 10;
// Soglia sulla salience TOTALE (Klapuri): non più gate sul solo fondamentale.
// Una nota con fondamentale debole ma 2°/3° armonico forti (es. pianoforte basso,
// chitarra bassa) supera questa soglia e viene correttamente rilevata.
const SALIENCE_FLOOR = 0.5;
const MIN_FRAMES = 3;

const SUBTRACT_FACTOR_DEFAULT = 0.1;
const POLY_SUBTRACT_FACTOR: Partial<Record<InstrumentKind, number>> = {
  // 0.25: più aggressivo di 0.5 per limitare i falsi positivi armonici,
  // abbastanza permissivo da lasciare rilevabili i raddoppi di ottava genuini.
  keyboard: 0.25,
  guitar:   0.5,
};

// pYIN: lambda di decay per strumento.
// Con logProb che parte a 0 e threshold a -3.0:
//   keyboard λ=1.5 → sopravvive 2 frame senza essere vista (~46ms) — piano decade veloce
//   guitar   λ=0.3 → sopravvive ~10 frame (~230ms) — corde risuonano a lungo
//   winds    λ=0.5 → sopravvive ~6 frame (~140ms)
const CONTINUATION_LAMBDA: Partial<Record<InstrumentKind, number>> = {
  keyboard:        1.5,
  guitar:          0.3,
  'winds-section': 0.5,
};
const DEFAULT_CONTINUATION_LAMBDA = 0.6;
const LOG_PROB_THRESHOLD = -3.0;
const LOG_PROB_REINFORCE  = 0.5;

// Pesi armonici per strumento. Piano: h2 quasi uguale a h1 (corde gravi ricche di 2° armonico),
// poi calo repentino. Guitar: h2 marcato, poi decay rapido. Default: 1/h (generico).
function makeHarmonicWeights(instrument: InstrumentKind): Float32Array {
  const w = new Float32Array(HARMONICS);
  if (instrument === 'keyboard') {
    const preset = [1.0, 0.9, 0.5, 0.3, 0.15, 0.1, 0.08, 0.06, 0.05, 0.04];
    for (let i = 0; i < HARMONICS; i++) w[i] = preset[i] ?? 0.04;
  } else if (instrument === 'guitar') {
    const preset = [1.0, 0.6, 0.3, 0.15, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03];
    for (let i = 0; i < HARMONICS; i++) w[i] = preset[i] ?? 0.03;
  } else {
    for (let i = 0; i < HARMONICS; i++) w[i] = 1 / (i + 1);
  }
  return w;
}

const GATE_LOOKAHEAD = 2;
const MIN_REGION_FRAMES = 4;
const MIN_WHITENED_PEAK = 1e-6;

const POLY_GATE: Partial<Record<InstrumentKind, { open: number; close: number }>> = {
  keyboard:        { open: 0.07, close: 0.025 },
  guitar:          { open: 0.07, close: 0.025 },
  'winds-section': { open: 0.05, close: 0.020 },
};
const DEFAULT_POLY_GATE = { open: 0.07, close: 0.025 };

const POLY_SALIENCE_RATIO: Partial<Record<InstrumentKind, number>> = {
  'winds-section': 0.25,
};
const DEFAULT_SALIENCE_RATIO = 0.5;

interface FramePitch { midi: number; cents: number; salience: number; }

interface Track {
  midi: number;
  startFrame: number;
  lastFrame: number;
  count: number;
  salSum: number;
  centsSum: number;
  logProb: number; // log-prob cumulativa: 0 = certa, scende a ogni frame mancante
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
  subtractFactor: number,
  harmonicWeights: Float32Array,
  salienceRatio: number,
): FramePitch[] {
  const spec = Float32Array.from(mag);
  let mx = 0;
  for (let i = 0; i < spec.length; i++) if (spec[i] > mx) mx = spec[i];
  if (mx < MIN_WHITENED_PEAK) return [];
  for (let i = 0; i < spec.length; i++) spec[i] /= mx;

  const out: FramePitch[] = [];
  let firstSal = 0;

  for (let iter = 0; iter < maxPoly; iter++) {
    let bestMidi = -1, bestSal = 0;
    for (let m = minMidi; m <= maxMidi; m++) {
      const f0 = midiToFreq(m);
      const fundBin = Math.round(f0 / binHz);
      if (fundBin < 1 || fundBin >= spec.length - 1) continue;

      // Gate soft sul fondamentale: soglia 0.02 (più bassa dell'originale 0.05) per
      // consentire note con fondamentale debole (piano basso) ma bloccare puri rumori.
      if (peakNear(spec, fundBin) < 0.02) continue;

      // Salta armonici di note già trovate. nearestInt ≥ 2 include le ottave: evita
      // che il 2° armonico di una nota trovata venga rilevato come nota separata.
      // Trade-off: i raddoppi di ottava genuini vengono soppressi più spesso.
      let isHarmonicOfFound = false;
      for (const found of out) {
        const ratio = f0 / midiToFreq(found.midi);
        const nearestInt = Math.round(ratio);
        if (nearestInt >= 2 && Math.abs(ratio - nearestInt) < 0.05) {
          isHarmonicOfFound = true;
          break;
        }
      }
      if (isHarmonicOfFound) continue;

      // Salta candidati che hanno un fondamentale più basso già presente nello spettro.
      // h=2 include il controllo sull'ottava: se c'è una nota a f0/2, questo candidato
      // è probabilmente un armonico, non una nota reale.
      let hasSubharmonicFundamental = false;
      for (let h = 2; h <= HARMONICS; h++) {
        const subF = f0 / h;
        const subBin = Math.round(subF / binHz);
        if (subBin < 1) break;
        const subMidi = Math.round(freqToMidi(subF));
        if (subMidi < minMidi || subMidi > maxMidi) continue;
        if (peakNear(spec, subBin) > 0.05) { hasSubharmonicFundamental = true; break; }
      }
      if (hasSubharmonicFundamental) continue;

      // Gate sulla salience TOTALE (Klapuri): note con fondamentale debole ma armonici
      // forti (piano basso) vengono rilevate; puro rumore no.
      let sal = 0;
      for (let h = 1; h <= HARMONICS; h++) {
        const b = Math.round((h * f0) / binHz);
        if (b >= spec.length - 1) break;
        sal += peakNear(spec, b) * harmonicWeights[h - 1];
      }
      if (sal < 0.05) continue;

      if (sal > bestSal) { bestSal = sal; bestMidi = m; }
    }
    if (bestMidi < 0) break;
    if (iter === 0) firstSal = bestSal;
    if (bestSal < salienceRatio * firstSal || bestSal < SALIENCE_FLOOR) break;

    const f0 = midiToFreq(bestMidi);
    const fb = Math.round(f0 / binHz);
    const refinedFreq = parabolicBin(spec, fb) * binHz;
    const centsRaw = (freqToMidi(refinedFreq) - bestMidi) * 100;
    const cents = Number.isFinite(centsRaw) ? Math.max(-50, Math.min(50, centsRaw)) : 0;

    out.push({ midi: bestMidi, cents, salience: bestSal });

    for (let h = 1; h <= HARMONICS; h++) {
      const b = Math.round((h * f0) / binHz);
      if (b >= spec.length - 1) break;
      if (b > 0) spec[b - 1] *= subtractFactor;
      spec[b] *= subtractFactor;
      spec[b + 1] *= subtractFactor;
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
  const subtractFactor = POLY_SUBTRACT_FACTOR[instrument] ?? SUBTRACT_FACTOR_DEFAULT;
  const harmonicWeights = makeHarmonicWeights(instrument);
  const salienceRatio = POLY_SALIENCE_RATIO[instrument] ?? DEFAULT_SALIENCE_RATIO;
  const continuationLambda = CONTINUATION_LAMBDA[instrument] ?? DEFAULT_CONTINUATION_LAMBDA;
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

  const gateOpen  = peakRms * gate.open;
  const gateClose = peakRms * gate.close;
  const activeRegions: Array<{ start: number; end: number }> = [];
  let gateIsOpen = false;
  let regionStart = 0;
  let prevRegionEnd = 0;

  for (let i = 0; i < nFrames; i++) {
    if (!gateIsOpen && frameRms[i] >= gateOpen) {
      gateIsOpen  = true;
      regionStart = Math.max(prevRegionEnd, i - GATE_LOOKAHEAD);
    } else if (gateIsOpen && frameRms[i] < gateClose) {
      gateIsOpen = false;
      if (i - regionStart >= MIN_REGION_FRAMES) {
        activeRegions.push({ start: regionStart, end: i });
      }
      prevRegionEnd = i;
    }
  }
  if (gateIsOpen && nFrames - regionStart >= MIN_REGION_FRAMES) {
    activeRegions.push({ start: regionStart, end: nFrames });
  }

  // ── Pass 2: onset detection per analisi post-transiente e boundary reset ───
  // (Benetos 2019 + Basic Pitch): gli onset vengono usati in due modi:
  //   a) chitarra: analisi del frame con offset post-onset per saltare il click/pizzico
  //   b) tutti gli strumenti: reset della log-prob delle tracce aperte all'onset
  const { onsets } = detectOnsets(signal, sampleRate, windowSize >> 1, HOP);
  const onsetFrames = new Set(onsets.map(t => Math.round((t * sampleRate) / HOP)));

  // ── Pass 3 + 4: Klapuri + soft tracking pYIN nelle regioni attive ──────────
  const open = new Map<number, Track>();
  const notes: NoteEvent[] = [];
  let globalMaxSal = 1e-9;

  const closeTrack = (t: Track) => {
    if (t.count >= MIN_FRAMES) {
      notes.push({
        id: `n${_noteIdCounter++}`,
        midi: t.midi,
        cents: Math.max(-50, Math.min(50, t.centsSum / t.count)),
        startSec:    (t.startFrame * HOP) / sampleRate,
        durationSec: ((t.lastFrame - t.startFrame + 1) * HOP) / sampleRate,
        velocity:    t.salSum / t.count,
      });
    }
  };

  if (activeRegions.length === 0) {
    onProgress?.(1);
    return [];
  }

  const totalActiveFrames = activeRegions.reduce((s, r) => s + r.end - r.start, 0);
  let processedFrames = 0;

  const frame = new Float32Array(windowSize);
  for (const region of activeRegions) {
    for (let f = region.start; f < region.end; f++) {
      const isOnset = onsetFrames.has(f);
      let found: FramePitch[] = [];

      if (frameRms[f] >= gateClose) {
        // Basic Pitch: per chitarra, all'onset analizza il frame sfasato di windowSize/4
        // per saltare il transiente (click/pizzico) e leggere il pitch stabile.
        let sampleStart = f * HOP;
        if (isOnset && instrument === 'guitar') {
          sampleStart = Math.min(sampleStart + (windowSize >> 2), signal.length - windowSize);
        }
        frame.set(signal.subarray(sampleStart, sampleStart + windowSize));
        const mag = magnitudeSpectrum(frame, win);
        whiten(mag);
        found = findPitchesInFrame(mag, binHz, minMidi, maxMidi, voiceCount, subtractFactor, harmonicWeights, salienceRatio);
      }

      const seen = new Set<number>();
      for (const p of found) {
        globalMaxSal = Math.max(globalMaxSal, p.salience);
        const t = open.get(p.midi);
        if (t) {
          t.lastFrame = f;
          t.count++;
          t.salSum += p.salience;
          t.centsSum += p.cents;
          t.logProb = Math.min(0, t.logProb + LOG_PROB_REINFORCE);
        } else {
          open.set(p.midi, {
            midi: p.midi, startFrame: f, lastFrame: f,
            count: 1, salSum: p.salience, centsSum: p.cents, logProb: 0,
          });
        }
        seen.add(p.midi);
      }

      // pYIN soft tracking: decay esponenziale invece di counter binario.
      // Strumenti con decay lento (guitar) sopravvivono più a lungo senza essere visti.
      for (const [midi, t] of open) {
        if (!seen.has(midi)) {
          t.logProb -= continuationLambda;
          if (t.logProb < LOG_PROB_THRESHOLD) { closeTrack(t); open.delete(midi); }
        }
      }

      processedFrames++;
      if (onProgress && processedFrames % 20 === 0) {
        onProgress(processedFrames / (totalActiveFrames || 1));
      }
    }
    // Flush tracce aperte a fine regione
    for (const t of open.values()) closeTrack(t);
    open.clear();
  }

  for (const n of notes) n.velocity = Math.min(1, n.velocity / globalMaxSal);

  if (notes.length > 1) {
    const byVel = [...notes].sort((a, b) => a.velocity - b.velocity);
    const p5 = byVel[Math.floor(byVel.length * 0.05)]?.velocity ?? 0;
    return notes.filter(n => n.velocity >= p5).sort((a, b) => a.startSec - b.startSec);
  }
  return notes.sort((a, b) => a.startSec - b.startSec);
}

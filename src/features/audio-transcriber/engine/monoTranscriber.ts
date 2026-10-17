// src/features/audio-transcriber/engine/monoTranscriber.ts
// Pipeline a 3 passi ispirata a Melodyne + CREPE Notes:
// 1. Energy curve + noise gate con isteresi → regioni attive
// 2. Pitch curve (pitchy) solo dentro le regioni attive
// 3. Segmentazione della pitch curve → NoteEvent[]

import { PitchDetector } from 'pitchy';
import { freqToMidi, median, mean, rms } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

let _noteIdCounter = 0;

// ─── Soglie globali ──────────────────────────────────────────────────────────
const CLARITY_MIN        = 0.80;  // leggermente rilassato per fondamentali bassi gravi
const PITCH_JUMP_ST      = 0.65;  // semitoni: sopra = boundary di nota
const UNVOICED_TOLERANCE = 3;     // frame null consecutivi tollerati in nota
const MIN_FRAMES         = 2;     // frame minimi per validare una nota (~46ms a hop=1024)
const LOCK_FRAMES        = 3;     // frame per bloccare il pitch di riferimento della nota
const MIN_REGION_FRAMES  = 4;     // scarta regioni attive troppo brevi
const MIN_NOTE_SEC       = 0.04;  // durata minima nota finale
const MERGE_GAP_SEC      = 0.015; // fondi note adiacenti solo se gap ≤ 15ms (quasi zero) …
const MERGE_PITCH_ST     = 0.5;   // … se diff di pitch ≤ 0.5 semitoni
const GATE_LOOKAHEAD     = 2;     // frame di anticipo all'apertura del gate

// ─── Soglie noise gate per strumento ────────────────────────────────────────
const GATE: Record<InstrumentKind, { open: number; close: number }> = {
  bass:     { open: 0.07,  close: 0.010 }, // close basso: gate aperto durante il decay naturale
  voice:    { open: 0.04,  close: 0.015 },
  winds:    { open: 0.05,  close: 0.020 },
  keyboard: { open: 0.07,  close: 0.025 }, // fallback (path poly)
  guitar:   { open: 0.07,  close: 0.025 }, // fallback (path poly)
};

interface PitchFrame { midi: number; clarity: number; rmsVal: number }

interface OpenSeg {
  midis: number[];
  rmsVals: number[];
  startFrame: number;
  establishedMidi: number | null; // pitch bloccato dopo LOCK_FRAMES (stabile per note lunghe)
  unvoicedRun: number;
}

export function transcribeMono(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): NoteEvent[] {
  const cfg  = INSTRUMENT_CONFIG[instrument];
  const gate = GATE[instrument];
  const windowSize = cfg.windowSize;
  const hop        = windowSize >> 2; // windowSize / 4

  const nFrames = Math.floor((signal.length - windowSize) / hop);
  if (nFrames < 1) return [];

  const frame = new Float32Array(windowSize);

  // ── Passo 1: energy curve + noise gate con isteresi ────────────────────────
  const frameRms = new Float32Array(nFrames);
  for (let i = 0; i < nFrames; i++) {
    frame.set(signal.subarray(i * hop, i * hop + windowSize));
    frameRms[i] = rms(frame);
  }

  // 97° percentile: più robusto di max() contro transienti isolati molto forti
  // che alzerebbero le soglie del gate e farebbero perdere le note più quiete.
  const sortedRms = Float32Array.from(frameRms).sort();
  const peakRms   = sortedRms[Math.floor(sortedRms.length * 0.97)] ?? 0;

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
        prevRegionEnd = i;
      }
    }
  }
  if (gateIsOpen && nFrames - regionStart >= MIN_REGION_FRAMES) {
    activeRegions.push({ start: regionStart, end: nFrames });
    prevRegionEnd = nFrames;
  }

  onProgress?.(0.2);

  // ── Passo 2: pitch curve dentro le regioni attive ──────────────────────────
  const pitchCurve: Array<PitchFrame | null> = new Array(nFrames).fill(null);
  const detector = PitchDetector.forFloat32Array(windowSize);
  detector.minVolumeDecibels = -20;

  const totalActiveFrames = activeRegions.reduce((s, r) => s + r.end - r.start, 0);
  let processedFrames = 0;

  for (const region of activeRegions) {
    for (let i = region.start; i < region.end; i++) {
      frame.set(signal.subarray(i * hop, i * hop + windowSize));
      const [pitch, clarity] = detector.findPitch(frame, sampleRate);
      const voiced =
        pitch >= cfg.minF0 &&
        pitch <= cfg.maxF0 &&
        clarity >= CLARITY_MIN &&
        frameRms[i] > peakRms * gate.close;
      if (voiced) {
        pitchCurve[i] = { midi: freqToMidi(pitch), clarity, rmsVal: frameRms[i] };
      }
      processedFrames++;
      if (onProgress && processedFrames % 50 === 0) {
        onProgress(0.2 + (processedFrames / (totalActiveFrames || 1)) * 0.7);
      }
    }
  }

  // ── Passo 3: segmentazione pitch curve → note ──────────────────────────────
  const candidates: NoteEvent[] = [];
  let seg: OpenSeg | null = null;

  const closeSeg = (endFrame: number) => {
    if (!seg || seg.midis.length < MIN_FRAMES) { seg = null; return; }
    const med  = median(seg.midis);
    const midi = Math.round(med);
    candidates.push({
      id:          `n${_noteIdCounter++}`,
      midi,
      cents:       Math.max(-50, Math.min(50, (med - midi) * 100)),
      startSec:    (seg.startFrame * hop) / sampleRate,
      durationSec: ((endFrame - seg.startFrame) * hop) / sampleRate,
      velocity:    mean(seg.rmsVals),
    });
    seg = null;
  };

  for (let i = 0; i < nFrames; i++) {
    const pf = pitchCurve[i];

    if (pf === null) {
      if (seg) {
        seg.unvoicedRun++;
        if (seg.unvoicedRun > UNVOICED_TOLERANCE) closeSeg(i - seg.unvoicedRun);
      }
      continue;
    }

    if (seg === null) {
      seg = { midis: [pf.midi], rmsVals: [pf.rmsVal], startFrame: i,
              establishedMidi: null, unvoicedRun: 0 };
    } else {
      seg.unvoicedRun = 0;

      // Dopo LOCK_FRAMES frame, blocca il pitch di riferimento sulla mediana
      // dei primi frame stabili. Così le note lunghe con vibrato o micro-variazioni
      // non generano falsi boundary; le transizioni vere divergono subito dal ref.
      if (seg.establishedMidi === null && seg.midis.length >= LOCK_FRAMES) {
        seg.establishedMidi = median(seg.midis);
      }
      const ref = seg.establishedMidi ?? median(seg.midis);

      if (Math.abs(pf.midi - ref) > PITCH_JUMP_ST) {
        closeSeg(i);
        seg = { midis: [pf.midi], rmsVals: [pf.rmsVal], startFrame: i,
                establishedMidi: null, unvoicedRun: 0 };
      } else {
        seg.midis.push(pf.midi);
        seg.rmsVals.push(pf.rmsVal);
      }
    }
  }
  closeSeg(nFrames);

  // ── Post-filtering ──────────────────────────────────────────────────────────
  let notes = candidates.filter(n => n.durationSec >= MIN_NOTE_SEC);
  if (notes.length === 0) return notes;

  // Normalizza velocity relativa al picco del file (non assoluta)
  let peakNoteRms = 0;
  for (const n of notes) if (n.velocity > peakNoteRms) peakNoteRms = n.velocity;
  if (peakNoteRms > 0) {
    for (const n of notes) n.velocity = Math.min(1, n.velocity / peakNoteRms);
  }

  // Scarta note sotto il 5° percentile energetico (risonanze residue)
  const byVel = [...notes].sort((a, b) => a.velocity - b.velocity);
  const p5    = byVel[Math.floor(byVel.length * 0.05)]?.velocity ?? 0;
  notes = notes.filter(n => n.velocity >= p5);

  // Fondi note adiacenti con stesso pitch e gap breve
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < notes.length - 1; i++) {
      const a = notes[i], b = notes[i + 1];
      const gap = b.startSec - (a.startSec + a.durationSec);
      if (gap <= MERGE_GAP_SEC && Math.abs(a.midi - b.midi) <= MERGE_PITCH_ST) {
        notes[i] = {
          ...a,
          durationSec: b.startSec + b.durationSec - a.startSec,
          velocity:    Math.max(a.velocity, b.velocity),
        };
        notes.splice(i + 1, 1);
        merged = true;
      }
    }
  }

  // Monofonia stretta: tronca ogni nota all'attacco della successiva
  for (let i = 0; i < notes.length - 1; i++) {
    const a = notes[i], b = notes[i + 1];
    if (a.startSec + a.durationSec > b.startSec) {
      a.durationSec = Math.max(0.05, b.startSec - a.startSec);
    }
  }

  onProgress?.(1);
  return notes;
}

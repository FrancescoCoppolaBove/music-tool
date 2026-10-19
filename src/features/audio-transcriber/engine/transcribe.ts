// src/features/audio-transcriber/engine/transcribe.ts
// Orchestratore della pipeline: trascrizione (mono|poli) → onset/BPM →
// snap degli attacchi agli onset → quantizzazione → tonalità → accordi.

import { transcribeMono } from './monoTranscriber';
import { detectOnsets } from './onsetDetector';
import { estimateTempo } from './tempoEstimator';
import { estimateKey } from './keyEstimator';
import { quantizeNotes } from './quantizer';
import { analyzeChords } from './chordAnalyzer';
import { INSTRUMENT_CONFIG, type InstrumentKind, type TranscriptionResult, type TranscriptionOptions } from '../types';

const MIN_NOTE_SEC = 0.05;

export async function transcribe(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  options?: TranscriptionOptions,
): Promise<TranscriptionResult> {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const sub = (a: number, b: number) => (p: number) => onProgress?.(a + p * (b - a));

  const notes = cfg.poly
    ? await (await import('./polyTranscriber')).transcribePoly(signal, sampleRate, instrument, sub(0, 0.6), options)
    : transcribeMono(signal, sampleRate, instrument, sub(0, 0.6));
  onProgress?.(0.6);

  const { flux, frameRate, onsets } = detectOnsets(signal, sampleRate);
  onProgress?.(0.75);
  const tempo = estimateTempo(flux, frameRate);

  // Snap dell'attacco all'onset più recente che precede la nota (snap esclusivamente
  // all'indietro). Il finestra è più grande per poly perché la windowSize=8192
  // introduce un lag di rilevamento di ~80-120ms rispetto all'attacco reale.
  // Lo snap in avanti (onset dopo startSec) produceva note fantasma da 50ms.
  const snapBack = cfg.poly ? 0.15 : 0.08;
  // Neural predictions have pitch-specific onsets. Global flux snapping would move
  // an independent voice onto another note's attack and damage scales/arpeggios.
  for (const n of cfg.poly ? [] : notes) {
    let best = -1, bestDist = snapBack;
    for (const o of onsets) {
      const d = n.startSec - o; // positivo solo se l'onset precede l'attacco rilevato
      if (d >= 0 && d < bestDist) { bestDist = d; best = o; }
    }
    if (best >= 0) {
      const end = n.startSec + n.durationSec;
      n.startSec = best;
      n.durationSec = Math.max(MIN_NOTE_SEC, end - best);
    }
  }

  // La fase stimata può cadere un periodo dopo il primo attacco reale
  // (clampare a 0 schiaccerebbe le prime note sullo stesso beat).
  let beatOffsetSec = tempo.beatOffsetSec;
  if (tempo.bpm !== null && notes.length > 0) {
    const beatDur = 60 / tempo.bpm;
    const firstStart = notes[0].startSec;
    while (beatOffsetSec > firstStart + 1e-6) beatOffsetSec -= beatDur;
  }

  if (tempo.bpm !== null) quantizeNotes(notes, tempo.bpm, beatOffsetSec);
  const key = estimateKey(notes);
  const chords = analyzeChords(notes);
  onProgress?.(1);

  return {
    notes,
    chords,
    bpm: tempo.bpm,
    bpmConfidence: tempo.confidence,
    beatOffsetSec,
    key,
    timeSignature: '4/4',
    timeSignatureSource: 'default',
    engine: cfg.poly ? 'basic-pitch' : 'mpm',
  };
}

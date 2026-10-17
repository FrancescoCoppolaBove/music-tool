// src/features/audio-transcriber/engine/transcribe.ts
// Orchestratore della pipeline: trascrizione (mono|poli) → onset/BPM →
// snap degli attacchi agli onset → quantizzazione → tonalità → accordi.

import { transcribeMono } from './monoTranscriber';
import { transcribePoly } from './polyTranscriber';
import { detectOnsets } from './onsetDetector';
import { estimateTempo } from './tempoEstimator';
import { estimateKey } from './keyEstimator';
import { quantizeNotes } from './quantizer';
import { analyzeChords } from './chordAnalyzer';
import { INSTRUMENT_CONFIG, type InstrumentKind, type TranscriptionResult } from '../types';

const ONSET_SNAP_SEC = 0.08; // attacco nota agganciato all'onset più vicino entro 80ms
const MIN_NOTE_SEC = 0.05;

export function transcribe(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): TranscriptionResult {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const sub = (a: number, b: number) => (p: number) => onProgress?.(a + p * (b - a));

  let notes = cfg.poly
    ? transcribePoly(signal, sampleRate, instrument, sub(0, 0.6))
    : transcribeMono(signal, sampleRate, instrument, sub(0, 0.6));
  onProgress?.(0.6);

  const { flux, frameRate, onsets } = detectOnsets(signal, sampleRate);
  onProgress?.(0.75);
  const tempo = estimateTempo(flux, frameRate);

  // Gli onset dal flux sono più precisi del pitch tracking sugli attacchi.
  for (const n of notes) {
    let best = -1, bestDist = ONSET_SNAP_SEC;
    for (const o of onsets) {
      const d = Math.abs(o - n.startSec);
      if (d < bestDist) { bestDist = d; best = o; }
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
  };
}

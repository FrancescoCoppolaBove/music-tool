// src/features/audio-transcriber/engine/monoTranscriber.ts
// Trascrizione monofonica (basso/voce/fiati): pitch per frame con pitchy (MPM),
// poi segmentazione in note su pitch stabile. Stessa famiglia di tecniche del
// PitchTracker di Nail the Pitch, ma offline su tutto il file.

import { PitchDetector } from 'pitchy';
import { freqToMidi, median, mean, rms } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

const CLARITY_MIN = 0.75;
const MIN_FRAMES = 3;        // una nota deve durare almeno 3 frame
const MAX_UNVOICED_RUN = 2;  // frame non intonati tollerati dentro una nota
const SEMITONE_TOL = 0.6;    // in semitoni: oltre, è una nuova nota

interface OpenSeg {
  midis: number[];
  rmsVals: number[];
  startFrame: number;
  unvoicedRun: number;
}

export function transcribeMono(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): NoteEvent[] {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const windowSize = cfg.windowSize;
  const hop = windowSize / 4;
  const detector = PitchDetector.forFloat32Array(windowSize);
  detector.minVolumeDecibels = -50;

  const nFrames = Math.floor((signal.length - windowSize) / hop);
  const notes: NoteEvent[] = [];
  const frame = new Float32Array(windowSize);
  let seg: OpenSeg | null = null;

  const close = () => {
    if (!seg) return;
    if (seg.midis.length >= MIN_FRAMES) {
      const med = median(seg.midis);
      const midi = Math.round(med);
      notes.push({
        id: Math.random().toString(36).slice(2),
        midi,
        cents: Math.max(-50, Math.min(50, (med - midi) * 100)),
        startSec: (seg.startFrame * hop) / sampleRate,
        durationSec: (seg.midis.length * hop) / sampleRate,
        velocity: Math.min(1, mean(seg.rmsVals) * 2.5),
      });
    }
    seg = null;
  };

  for (let i = 0; i < nFrames; i++) {
    frame.set(signal.subarray(i * hop, i * hop + windowSize));
    const [pitch, clarity] = detector.findPitch(frame, sampleRate);
    const voiced = pitch >= cfg.minF0 && pitch <= cfg.maxF0 && clarity >= CLARITY_MIN;

    if (voiced) {
      const midi = freqToMidi(pitch);
      if (seg && Math.abs(midi - median(seg.midis)) <= SEMITONE_TOL) {
        seg.midis.push(midi);
        seg.rmsVals.push(rms(frame));
        seg.unvoicedRun = 0;
      } else {
        close();
        seg = { midis: [midi], rmsVals: [rms(frame)], startFrame: i, unvoicedRun: 0 };
      }
    } else if (seg) {
      seg.unvoicedRun++;
      if (seg.unvoicedRun > MAX_UNVOICED_RUN) close();
    }

    if (onProgress && i % 50 === 0) onProgress(i / nFrames);
  }
  close();
  return notes;
}

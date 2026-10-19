import { BasicPitch, addPitchBendsToNoteEvents, noteFramesToTime } from '@spotify/basic-pitch';
import * as tf from '@tensorflow/tfjs';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent, type TranscriptionOptions } from '../types';
import { appendChunkNotes, estimateVelocities, MODEL_SAMPLE_RATE, resampleForModel } from './polyAudio';
import { decodeActivations } from './noteDecoder';
import { freqToMidi } from './dsp';

// Bound both JS posterior matrices and tensors on long recordings.
export const CHUNK_SECONDS = 20;
const CONTEXT_SECONDS = 1;
const THRESHOLDS = {
  precise: { onset: 0.6, frame: 0.35, minFrames: 6 },
  balanced: { onset: 0.45, frame: 0.3, minFrames: 5 },
  sensitive: { onset: 0.3, frame: 0.2, minFrames: 3 },
};

let predictorPromise: Promise<BasicPitch> | undefined;
let wasmFillCompatibilityInstalled = false;

function installWasmFillCompatibility(): void {
  if (wasmFillCompatibilityInstalled) return;
  wasmFillCompatibilityInstalled = true;
  // The pinned 3.x WASM Fill kernel does not default dtype, unlike tfjs CPU.
  // Basic Pitch's graph can omit the attribute; these tensors are float audio buffers.
  tf.registerKernel({
    kernelName: 'Fill',
    backendName: 'wasm',
    kernelFunc: ({ attrs, backend }) => {
      const fill = attrs as unknown as { shape: number[]; value: number; dtype?: tf.DataType };
      const wasm = backend as {
        makeOutput: (shape: number[], dtype: tf.DataType) => { shape: number[]; dtype: tf.DataType; dataId: object };
        typedArrayFromHeap: (info: { shape: number[]; dtype: tf.DataType; dataId: object }) => { fill: (value: number) => void };
      };
      const output = wasm.makeOutput(fill.shape, fill.dtype ?? 'float32');
      wasm.typedArrayFromHeap(output).fill(fill.value);
      return output;
    },
  });
}

async function getPredictor(): Promise<BasicPitch> {
  if (!predictorPromise) {
    predictorPromise = (async () => {
      const base = new URL(import.meta.env.BASE_URL + 'transcription-models/', self.location.origin);
      setWasmPaths(new URL('wasm/', base).href);
      installWasmFillCompatibility();
      tf.env().set('WASM_HAS_MULTITHREAD_SUPPORT', false);
      try {
        if (!await tf.setBackend('wasm')) await tf.setBackend('cpu');
      } catch {
        await tf.setBackend('cpu');
      }
      await tf.ready();
      const predictor = new BasicPitch(new URL('basic-pitch/model.json', base).href);
      await predictor.model; // Keep model weights outside the per-chunk tensor scope.
      return predictor;
    })().catch((error: unknown) => {
      predictorPromise = undefined;
      throw new Error('Could not load the local transcription model. Reload the app and try again. ' +
        (error instanceof Error ? error.message : String(error)));
    });
  }
  return predictorPromise;
}

export function decodeModelNotes(
  frames: number[][], onsets: number[][], contours: number[][],
  instrument: InstrumentKind, options: TranscriptionOptions = {},
): NoteEvent[] {
  if (frames.length < 3 || !frames.some(row => row.some(v => v > 0.1))) return [];
  const cfg = INSTRUMENT_CONFIG[instrument];
  const threshold = THRESHOLDS[options.sensitivity ?? 'balanced'];
  const raw = decodeActivations(frames, onsets, {
    ...threshold, releaseFrames: instrument === 'winds-section' ? 7 : 5,
    minMidi: Math.max(21, Math.ceil(freqToMidi(cfg.minF0))),
    maxMidi: Math.min(108, Math.floor(freqToMidi(cfg.maxF0))),
  });
  const bent = contours.length ? addPitchBendsToNoteEvents(contours, raw) : raw;
  const decoded = noteFramesToTime(bent).map((note, i) => {
    const bends = [...(note.pitchBends ?? [])].sort((a, b) => a - b);
    const medianBend = bends.length ? bends[Math.floor(bends.length / 2)] : 0;
    // The contour output is quantized to thirds of a semitone and has a stable
    // +1-bin bias on centered piano notes; avoid reporting that as a real detune.
    const cents = Math.abs(medianBend) <= 1 ? 0 : medianBend * 100 / 3;
    return {
      id: 'poly-' + i, midi: note.pitchMidi, cents: Math.max(-50, Math.min(50, cents)),
      startSec: Math.max(0, note.startTimeSeconds), durationSec: note.durationSeconds,
      velocity: note.amplitude, confidence: note.amplitude,
    };
  }).filter(note => Number.isFinite(note.startSec + note.durationSec + note.velocity) && note.durationSec > 0)
    .sort((a, b) => a.startSec - b.startSec || a.midi - b.midi);
  if (instrument === 'winds-section' && options.voiceCount) {
    return limitPolyphony(decoded, Math.max(1, Math.min(6, Math.round(options.voiceCount))));
  }
  return decoded;
}

/** Keep the strongest model activations while enforcing a simultaneous voice cap. */
export function limitPolyphony<T extends { startSec: number; durationSec: number; confidence?: number }>(
  notes: T[], maxVoices: number,
): T[] {
  const accepted: T[] = [];
  for (const candidate of [...notes].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))) {
    const boundaries = [candidate.startSec, ...accepted
      .filter(note => note.startSec < candidate.startSec + candidate.durationSec && candidate.startSec < note.startSec + note.durationSec)
      .flatMap(note => [Math.max(candidate.startSec, note.startSec), Math.min(candidate.startSec + candidate.durationSec, note.startSec + note.durationSec)])];
    const exceeds = boundaries.some(time => {
      const simultaneous = accepted.filter(note => note.startSec <= time && note.startSec + note.durationSec > time).length;
      return simultaneous >= maxVoices;
    });
    if (!exceeds) accepted.push(candidate);
  }
  return accepted.sort((a, b) => a.startSec - b.startSec);
}

export async function transcribePoly(
  signal: Float32Array, sampleRate: number, instrument: InstrumentKind,
  onProgress?: (p: number) => void, options: TranscriptionOptions = {},
): Promise<NoteEvent[]> {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('Invalid audio sample rate.');
  let peak = 0;
  for (const value of signal) {
    if (!Number.isFinite(value)) throw new Error('Audio contains invalid samples.');
    peak = Math.max(peak, Math.abs(value));
  }
  if (peak < 1e-7 || signal.length / sampleRate < 0.04) {
    onProgress?.(1);
    return [];
  }
  const audio = resampleForModel(signal, sampleRate);
  const predictor = await getPredictor();
  onProgress?.(0.04);
  const coreLength = CHUNK_SECONDS * MODEL_SAMPLE_RATE;
  const context = CONTEXT_SECONDS * MODEL_SAMPLE_RATE;
  const notes: NoteEvent[] = [];
  const duration = audio.length / MODEL_SAMPLE_RATE;

  for (let coreStart = 0; coreStart < audio.length; coreStart += coreLength) {
    const coreEnd = Math.min(audio.length, coreStart + coreLength);
    const start = Math.max(0, coreStart - context);
    const end = Math.min(audio.length, coreEnd + context);
    const frames: number[][] = [], onsets: number[][] = [], contours: number[][] = [];
    // Basic Pitch 1.0.1 does not dispose inference tensors itself.
    // A worker runs a single job, so an async scope is safe here.
    tf.engine().startScope();
    try {
      await predictor.evaluateModel(audio.subarray(start, end), (f, o, c) => {
        frames.push(...f); onsets.push(...o); contours.push(...c);
      }, p => onProgress?.(0.04 + 0.92 * (coreStart + p * (coreEnd - coreStart)) / audio.length));
    } finally {
      tf.engine().endScope();
    }
    const seam = coreStart / MODEL_SAMPLE_RATE;
    const coreEndSec = coreEnd / MODEL_SAMPLE_RATE;
    const decoded = decodeModelNotes(frames, onsets, contours, instrument, options);
    const owned = decoded.flatMap(note => {
      const noteStart = note.startSec + start / MODEL_SAMPLE_RATE;
      const noteEnd = Math.min(duration, noteStart + note.durationSec);
      // A seam-spanning note is owned by both chunks only at the seam and joined below.
      if (noteStart >= coreEndSec || noteEnd <= seam) return [];
      return [{ ...note, startSec: noteStart, durationSec: Math.min(coreEndSec, noteEnd) - noteStart }];
    });
    appendChunkNotes(notes, owned, seam);
  }

  const sorted = notes.filter(n => n.durationSec >= 0.04)
    .sort((a, b) => a.startSec - b.startSec || a.midi - b.midi);
  // Do not discard octave doublings or low-velocity notes using harmonic heuristics.
  sorted.forEach((note, index) => { note.id = 'n' + index; });
  estimateVelocities(sorted, signal, sampleRate);
  onProgress?.(1);
  return sorted;
}

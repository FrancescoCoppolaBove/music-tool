/// <reference lib="webworker" />
// Esegue transcribe() fuori dal main thread. Messaggi:
//   in:  { signal: Float32Array, sampleRate: number, instrument: InstrumentKind, voiceCount?: number }
//   out: { type: 'progress', progress } | { type: 'result', result } | { type: 'error', message }

import { transcribe } from './transcribe';
import type { InstrumentKind, TranscriptionOptions } from '../types';

interface WorkerRequest {
  signal: Float32Array;
  sampleRate: number;
  instrument: InstrumentKind;
  options?: TranscriptionOptions;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { signal, sampleRate, instrument, options } = e.data;
  try {
    const result = await transcribe(signal, sampleRate, instrument, progress => {
      self.postMessage({ type: 'progress', progress });
    }, options);
    self.postMessage({ type: 'result', result });
  } catch (err) {
    console.error('Transcription worker failed:', err);
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};

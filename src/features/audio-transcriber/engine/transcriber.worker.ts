/// <reference lib="webworker" />
// Esegue transcribe() fuori dal main thread. Messaggi:
//   in:  { signal: Float32Array, sampleRate: number, instrument: InstrumentKind, voiceCount?: number }
//   out: { type: 'progress', progress } | { type: 'result', result } | { type: 'error', message }

import { transcribe } from './transcribe';
import type { InstrumentKind } from '../types';

interface WorkerRequest {
  signal: Float32Array;
  sampleRate: number;
  instrument: InstrumentKind;
  voiceCount?: number;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { signal, sampleRate, instrument, voiceCount } = e.data;
  try {
    const result = transcribe(signal, sampleRate, instrument, progress => {
      self.postMessage({ type: 'progress', progress });
    }, { voiceCount });
    self.postMessage({ type: 'result', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};

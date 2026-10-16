// API promise-based per la UI. Il buffer audio viene TRASFERITO al worker
// (non copiato): dopo la chiamata il chiamante non deve più usare `signal`.

import type { InstrumentKind, TranscriptionResult } from '../types';

type WorkerMessage =
  | { type: 'progress'; progress: number }
  | { type: 'result'; result: TranscriptionResult }
  | { type: 'error'; message: string };

export function analyzeAudio(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./transcriber.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.progress);
      } else if (msg.type === 'result') {
        worker.terminate();
        resolve(msg.result);
      } else {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = err => {
      worker.terminate();
      reject(new Error(err.message || 'Worker error'));
    };
    try {
      worker.postMessage({ signal, sampleRate, instrument }, [signal.buffer]);
    } catch (err) {
      worker.terminate();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

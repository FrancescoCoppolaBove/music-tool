// API promise-based per la UI. Il buffer audio viene TRASFERITO al worker
// (non copiato): dopo la chiamata il chiamante non deve più usare `signal`.

import type { InstrumentKind, TranscriptionResult, TranscriptionOptions } from '../types';

type WorkerMessage =
  | { type: 'progress'; progress: number }
  | { type: 'result'; result: TranscriptionResult }
  | { type: 'error'; message: string };

export function analyzeAudio(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  options?: TranscriptionOptions & { signal?: AbortSignal },
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    if (options?.signal?.aborted) {
      reject(new DOMException('Analysis cancelled.', 'AbortError'));
      return;
    }
    const worker = new Worker(new URL('./transcriber.worker.ts', import.meta.url), {
      type: 'module',
    });
    const cleanup = () => {
      worker.terminate();
      options?.signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException('Analysis cancelled.', 'AbortError'));
    };
    options?.signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.progress);
      } else if (msg.type === 'result') {
        cleanup();
        resolve(msg.result);
      } else {
        cleanup();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = err => {
      cleanup();
      reject(new Error(err.message || 'Worker error'));
    };
    try {
      worker.postMessage(
        { signal, sampleRate, instrument, options: { voiceCount: options?.voiceCount, sensitivity: options?.sensitivity } },
        [signal.buffer],
      );
    } catch (err) {
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

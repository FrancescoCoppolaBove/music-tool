// src/features/audio-transcriber/engine/checks/check-onset.ts
import { detectOnsets } from '../onsetDetector';
import { SR, clicks, assert } from './synth';

// 8 click a 120 BPM → onset ogni 0.5s
const signal = clicks(120, 8);
const { onsets, flux, frameRate } = detectOnsets(signal, SR);

assert(onsets.length >= 7 && onsets.length <= 9, `expected ~8 onsets, got ${onsets.length}`);
for (let i = 1; i < Math.min(onsets.length, 8); i++) {
  const gap = onsets[i] - onsets[i - 1];
  assert(Math.abs(gap - 0.5) < 0.06, `gap ${i}: ${gap.toFixed(3)}s, expected ~0.5s`);
}
assert(flux.length > 0, 'flux curve empty');
assert(frameRate > 0, 'frameRate not positive');

console.log('OK check-onset —', onsets.length, 'onsets');

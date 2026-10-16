// src/features/audio-transcriber/engine/checks/check-tempo.ts
import { detectOnsets } from '../onsetDetector';
import { estimateTempo } from '../tempoEstimator';
import { SR, clicks, silence, assert } from './synth';

// 16 click a 120 BPM
const { flux, frameRate } = detectOnsets(clicks(120, 16), SR);
const tempo = estimateTempo(flux, frameRate);

assert(tempo.bpm !== null, 'bpm is null on a steady click track');
assert(Math.abs((tempo.bpm as number) - 120) < 3, `bpm ${tempo.bpm}, expected ~120`);
assert(tempo.confidence > 0.15, `confidence ${tempo.confidence}`);
assert(tempo.beatOffsetSec >= 0 && tempo.beatOffsetSec < 0.5, `offset ${tempo.beatOffsetSec}`);

// Silenzio → nessun tempo
const quiet = detectOnsets(silence(5), SR);
const noTempo = estimateTempo(quiet.flux, quiet.frameRate);
assert(noTempo.bpm === null, `expected null bpm on silence, got ${noTempo.bpm}`);

console.log('OK check-tempo —', tempo.bpm, 'BPM, confidence', tempo.confidence.toFixed(2));

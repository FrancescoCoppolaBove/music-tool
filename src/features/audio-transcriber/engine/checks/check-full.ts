// src/features/audio-transcriber/engine/checks/check-full.ts
import { transcribe } from '../transcribe';
import { SR, tone, mix, concat, assert } from './synth';

// Giro C-F-G-C ripetuto 3 volte: 12 accordi da 0.5s (=120 BPM in quarti), 6s totali.
// NB: servono >4s di audio perché estimateTempo rifiuta flux più corti di 4s.
const C = () => mix(tone(261.63, 0.48), tone(329.63, 0.48), tone(392.0, 0.48));
const F = () => mix(tone(349.23, 0.48), tone(440.0, 0.48), tone(523.25, 0.48));
const G = () => mix(tone(392.0, 0.48), tone(493.88, 0.48), tone(587.33, 0.48));
const pad = () => new Float32Array(Math.round(0.02 * SR));
const bar = (c: () => Float32Array) => concat(c(), pad());
const round = () => concat(bar(C), bar(F), bar(G), bar(C));
const signal = concat(round(), round(), round());

const progress: number[] = [];
const result = await transcribe(signal, SR, 'keyboard', p => progress.push(p));

assert(result.notes.length >= 12, `expected ≥12 notes, got ${result.notes.length}`);
assert(result.notes.some(n => n.midi === 60), 'missing C4 in notes');
assert(result.bpm !== null, 'bpm is null');
assert(Math.abs((result.bpm as number) - 120) < 6, `bpm ${result.bpm}, expected ~120`);
assert(result.key === 'C major', `key "${result.key}", expected "C major"`);
assert(result.chords.length >= 4, `expected ≥4 chords, got ${result.chords.length}`);
assert(result.notes.every(n => n.startBeat !== undefined), 'notes not quantized');
assert(result.timeSignature === '4/4', `timeSignature ${result.timeSignature}`);
assert(progress.length > 0 && progress[progress.length - 1] === 1, 'progress not reported');

console.log('OK check-full —', result.notes.length, 'notes,', result.chords.length,
  'chords, bpm', result.bpm, ', key', result.key);

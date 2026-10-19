// src/features/audio-transcriber/engine/checks/check-poly.ts
import { transcribePoly } from './legacyPolyTranscriber';
import { SR, tone, mix, concat, assert } from './synth';

// Triade C4-E4-G4 (1s) poi F4-A4-C5 (1s), timbro con 3 armonici
const chord1 = mix(tone(261.63, 1), tone(329.63, 1), tone(392.0, 1));
const chord2 = mix(tone(349.23, 1), tone(440.0, 1), tone(523.25, 1));
const signal = concat(chord1, chord2);

const notes = transcribePoly(signal, SR, 'keyboard');

const firstHalf = new Set(notes.filter(n => n.startSec < 0.9).map(n => n.midi));
const secondHalf = new Set(notes.filter(n => n.startSec >= 0.9).map(n => n.midi));

for (const m of [60, 64, 67]) assert(firstHalf.has(m), `missing midi ${m} in first chord; got ${[...firstHalf]}`);
for (const m of [65, 69, 72]) assert(secondHalf.has(m), `missing midi ${m} in second chord; got ${[...secondHalf]}`);

// Niente falsi positivi grossolani: max 1 nota spuria per metà
assert(firstHalf.size <= 4, `too many notes in first half: ${[...firstHalf]}`);
assert(secondHalf.size <= 4, `too many notes in second half: ${[...secondHalf]}`);

for (const n of notes) assert(n.velocity > 0 && n.velocity <= 1, `velocity ${n.velocity}`);

console.log('OK check-poly —', [...firstHalf].join(','), '|', [...secondHalf].join(','));

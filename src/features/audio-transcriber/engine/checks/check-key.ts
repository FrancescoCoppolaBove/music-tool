// src/features/audio-transcriber/engine/checks/check-key.ts
import { estimateKey } from '../keyEstimator';
import { assert } from './synth';

// Scala di Do maggiore, tonica con durata doppia
const cMajor = [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({
  midi,
  durationSec: i === 0 || i === 7 ? 1.0 : 0.5,
}));
assert(estimateKey(cMajor) === 'C major', `expected "C major", got "${estimateKey(cMajor)}"`);

// Scala di La minore armonica
const aMinor = [57, 59, 60, 62, 64, 65, 68, 69].map((midi, i) => ({
  midi,
  durationSec: i === 0 || i === 7 ? 1.0 : 0.5,
}));
assert(estimateKey(aMinor) === 'A minor', `expected "A minor", got "${estimateKey(aMinor)}"`);

assert(estimateKey([]) === null, 'expected null on empty input');

console.log('OK check-key');

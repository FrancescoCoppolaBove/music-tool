// src/features/audio-transcriber/engine/checks/check-chords.ts
import { analyzeChords } from '../chordAnalyzer';
import { assert } from './synth';
import type { NoteEvent } from '../../types';

const mk = (midi: number, startSec: number, durationSec = 1): NoteEvent => ({
  id: `${midi}-${startSec}`, midi, cents: 0, startSec, durationSec, velocity: 0.8,
});

// Cmaj7 close position fondamentale: C4 E4 G4 B4
const close = [mk(60, 0), mk(64, 0), mk(67, 0), mk(71, 0)];
const chords1 = analyzeChords(close);
assert(chords1.length === 1, `expected 1 chord, got ${chords1.length}`);
assert(/maj7/i.test(chords1[0].symbol) || /M7/.test(chords1[0].symbol), `symbol "${chords1[0].symbol}"`);
assert(chords1[0].voicing.includes('close'), `voicing "${chords1[0].voicing}"`);
assert(chords1[0].voicing.includes('fondamentale'), `voicing "${chords1[0].voicing}"`);
assert(close.every(n => n.chordId === chords1[0].id), 'chordId non assegnato alle note');

// Cmaj7 drop 2: G3 C4 E4 B4 (seconda voce dall'alto abbassata di ottava)
const drop2 = [mk(55, 2), mk(60, 2), mk(64, 2), mk(71, 2)];
const chords2 = analyzeChords(drop2);
assert(chords2.length === 1, `drop2: expected 1 chord, got ${chords2.length}`);
assert(chords2[0].voicing.includes('drop 2'), `drop2 voicing "${chords2[0].voicing}"`);

// Note melodiche non sovrapposte → nessun accordo
const melody = [mk(60, 4, 0.4), mk(62, 4.5, 0.4), mk(64, 5, 0.4)];
assert(analyzeChords(melody).length === 0, 'melody should produce no chords');

console.log('OK check-chords —', chords1[0].symbol, '·', chords1[0].voicing, '|', chords2[0].voicing);

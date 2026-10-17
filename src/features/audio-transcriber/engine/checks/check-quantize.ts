// src/features/audio-transcriber/engine/checks/check-quantize.ts
import { quantizeNotes } from '../quantizer';
import { assert } from './synth';
import type { NoteEvent } from '../../types';

const mk = (startSec: number, durationSec: number): NoteEvent => ({
  id: String(Math.random()), midi: 60, cents: 0, startSec, durationSec, velocity: 0.8,
});

// 120 BPM → beat = 0.5s. Nota a 0.26s ≈ 0.52 beat → snap a 0.5 (sedicesima griglia 0.25)
const notes = [mk(0, 0.5), mk(0.26, 0.24), mk(0.84, 0.16), mk(1.0, 0.33)];
quantizeNotes(notes, 120, 0);

assert(notes[0].startBeat === 0, `n0 startBeat ${notes[0].startBeat}`);
assert(notes[0].durationBeats === 1, `n0 durationBeats ${notes[0].durationBeats}`);
assert(notes[1].startBeat === 0.5, `n1 startBeat ${notes[1].startBeat}`);
assert(notes[1].durationBeats === 0.5, `n1 durationBeats ${notes[1].durationBeats}`);
// 0.84s = 1.68 beat → 1.75 (griglia 1/4)? no: 1.68 → più vicino a 1.75 (err .07) che a 5/3≈1.667 (err .013) → terzina
assert(Math.abs((notes[2].startBeat as number) - 5 / 3) < 1e-9, `n2 startBeat ${notes[2].startBeat}`);
// 0.33s = 0.66 beat → terzina 2/3 (err .007) batte 0.75 (err .09)
assert(Math.abs((notes[3].durationBeats as number) - 2 / 3) < 1e-9, `n3 durationBeats ${notes[3].durationBeats}`);
// offset: con beatOffsetSec=0.1, una nota a 0.6s → (0.6-0.1)/0.5 = 1 beat
const offsetNotes = [mk(0.6, 0.5)];
quantizeNotes(offsetNotes, 120, 0.1);
assert(offsetNotes[0].startBeat === 1, `offset startBeat ${offsetNotes[0].startBeat}`);

console.log('OK check-quantize');

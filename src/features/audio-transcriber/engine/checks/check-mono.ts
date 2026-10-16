// src/features/audio-transcriber/engine/checks/check-mono.ts
import { transcribeMono } from '../monoTranscriber';
import { SR, tone, concat, assert } from './synth';

// Sequenza A4 → C5 → E5, mezzo secondo ciascuna (strumento: voce)
const signal = concat(tone(440, 0.5), tone(523.25, 0.5), tone(659.25, 0.5));
const notes = transcribeMono(signal, SR, 'voice');

assert(notes.length === 3, `expected 3 notes, got ${notes.length}: ${notes.map(n => n.midi).join(',')}`);
assert(notes[0].midi === 69, `note 0: expected A4 (69), got ${notes[0].midi}`);
assert(notes[1].midi === 72, `note 1: expected C5 (72), got ${notes[1].midi}`);
assert(notes[2].midi === 76, `note 2: expected E5 (76), got ${notes[2].midi}`);
assert(Math.abs(notes[0].startSec - 0) < 0.1, `note 0 start ${notes[0].startSec}`);
assert(Math.abs(notes[1].startSec - 0.5) < 0.1, `note 1 start ${notes[1].startSec}`);
for (const n of notes) {
  assert(Math.abs(n.cents) < 15, `cents off: ${n.cents} on midi ${n.midi}`);
  assert(n.durationSec > 0.3 && n.durationSec < 0.7, `duration ${n.durationSec}`);
  assert(n.velocity > 0 && n.velocity <= 1, `velocity ${n.velocity}`);
}

// Registro basso: E1 (41.2 Hz) con finestra 4096 (strumento: basso)
const bassNotes = transcribeMono(tone(41.2, 0.8), SR, 'bass');
assert(bassNotes.length === 1, `bass: expected 1 note, got ${bassNotes.length}`);
assert(bassNotes[0].midi === 28, `bass: expected E1 (28), got ${bassNotes[0].midi}`);

console.log('OK check-mono —', notes.map(n => n.midi).join(','), '+ bass E1');

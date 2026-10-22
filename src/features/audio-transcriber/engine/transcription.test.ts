import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeChords } from './chordAnalyzer';
import { appendChunkNotes, estimateVelocities, rejectBroadbandNotes, resampleForModel } from './polyAudio';
import { decodeModelNotes, limitPolyphony } from './polyTranscriber';
import { transcribeMono } from './monoTranscriber';
import { tone, SR } from './checks/synth';
import type { NoteEvent } from '../types';

const note = (midi: number, startSec = 0, durationSec = 1, id = String(midi) + '-' + startSec): NoteEvent =>
  ({ id, midi, cents: 0, startSec, durationSec, velocity: 0.8 });

test('a held bass and a melody are not combined into a fictional chord', () => {
  assert.deepEqual(analyzeChords([note(48, 0, 3), note(60, 0, 0.8), note(64, 1, 0.8), note(67, 2, 0.8)]), []);
});

test('changing harmonies over a shared pedal remain separate chords', () => {
  const chords = analyzeChords([note(48, 0, 2), note(64), note(67), note(65, 1), note(69, 1)]);
  assert.equal(chords.length, 2);
  assert.match(chords[0].symbol, /^C/);
  assert.match(chords[1].symbol, /^F/);
  assert.equal(chords[1].startSec, 1);
});

test('a short octave doubling does not split a sustained chord region', () => {
  const notes = [note(60, 0, 0.8), note(64, 0, 0.8), note(67, 0, 0.8), note(72, 0, 0.12)];
  const chords = analyzeChords(notes);
  assert.equal(chords.length, 1);
  assert.match(chords[0].symbol, /^C/);
  assert.ok(Math.abs((chords[0].durationSec ?? 0) - 0.8) < 1e-6);
});

test('root position, inversion and drop voicings are described in English', () => {
  const close = analyzeChords([60, 64, 67, 71].map(m => note(m)))[0];
  assert.match(close.symbol, /C(M7|maj7)/);
  assert.match(close.voicing, /root position/);
  assert.match(analyzeChords([55, 60, 64, 71].map(m => note(m)))[0].voicing, /drop 2/);
  assert.match(analyzeChords([64, 67, 72].map(m => note(m)))[0].voicing, /1st inversion/);
});

test('deleting chord tones clears obsolete chord membership', () => {
  const notes = [60, 64, 67].map(m => note(m));
  analyzeChords(notes);
  assert.ok(notes[0].chordId);
  analyzeChords(notes.slice(0, 2));
  assert.equal(notes[0].chordId, undefined);
});

test('short overlaps between successive melody notes are not chords', () => {
  assert.deepEqual(analyzeChords([note(60, 0, 0.5), note(64, 0.45, 0.5), note(67, 0.48, 0.5)]), []);
});

test('chunk joins preserve sustained notes and repeated attacks at the seam', () => {
  const sustained = [note(60, 19, 1)];
  appendChunkNotes(sustained, [note(60, 19.5, 2)], 20);
  assert.equal(sustained.length, 1);
  assert.equal(sustained[0].durationSec, 2.5);
  const repeated = [note(60, 19, 1)];
  appendChunkNotes(repeated, [note(60, 20, 0.5)], 20);
  assert.equal(repeated.length, 2);
});

test('resampling preserves pitch, length and rejects high-frequency aliases', () => {
  const sr = 48000;
  const make = (frequency: number) => Float32Array.from({ length: sr }, (_, i) => Math.sin(2 * Math.PI * frequency * i / sr));
  const low = resampleForModel(make(440), sr);
  assert.equal(low.length, 22050);
  let crossings = 0;
  for (let i = 1; i < low.length; i++) if (low[i - 1] < 0 && low[i] >= 0) crossings++;
  assert.ok(Math.abs(crossings - 440) <= 1);
  const high = resampleForModel(make(18000), sr).slice(200, -200);
  assert.ok(Math.sqrt(high.reduce((s, v) => s + v * v, 0) / high.length) < 0.01);
  assert.throws(() => resampleForModel(low, 0), /sample rate/);
});

test('velocity follows audio energy, not normalized pitch salience', () => {
  const notes = [note(60, 0, 0.1), note(60, 0.2, 0.1)];
  const audio = Float32Array.from({ length: 4000 }, (_, i) => i < 1500 ? 0.1 : 0.8);
  estimateVelocities(notes, audio, 10000);
  assert.ok(notes[0].velocity < notes[1].velocity);
  assert.ok(notes.every(n => n.velocity > 0 && n.velocity <= 1));
});

function posterior(events: { midi: number; start: number; end: number }[]) {
  const frames = Array.from({ length: 100 }, () => Array(88).fill(0) as number[]);
  const onsets = frames.map(row => [...row]);
  for (const event of events) {
    onsets[event.start][event.midi - 21] = 0.95;
    for (let f = event.start; f < event.end; f++) frames[f][event.midi - 21] = 0.8;
  }
  return { frames, onsets };
}

test('polyphonic decoding preserves octave doublings', () => {
  const { frames, onsets } = posterior([60, 64, 67, 72].map(midi => ({ midi, start: 3, end: 60 })));
  const notes = decodeModelNotes(frames, onsets, [], 'keyboard');
  assert.deepEqual(notes.map(n => n.midi).sort((a, b) => a - b), [60, 64, 67, 72]);
});

test('polyphonic decoding preserves short octave doublings for manual review', () => {
  const { frames, onsets } = posterior([
    { midi: 60, start: 3, end: 60 },
    { midi: 72, start: 3, end: 10 },
  ]);
  for (let f = 3; f < 10; f++) frames[f][72 - 21] = 0.56;
  const notes = decodeModelNotes(frames, onsets, [], 'keyboard');
  assert.deepEqual(notes.map(n => n.midi).sort((a, b) => a - b), [60, 72]);
});

test('winds-section voice limit keeps the strongest simultaneous notes', () => {
  const notes = [
    { startSec: 0, durationSec: 1, midi: 60, confidence: 0.8 },
    { startSec: 0, durationSec: 1, midi: 64, confidence: 0.95 },
    { startSec: 0, durationSec: 1, midi: 67, confidence: 0.6 },
  ];
  assert.deepEqual(limitPolyphony(notes, 2).map(n => n.midi).sort(), [60, 64]);
});

test('polyphonic decoding preserves adjacent semitones in a voiced cluster', () => {
  const { frames, onsets } = posterior([60, 61, 67].map(midi => ({ midi, start: 3, end: 60 })));
  const notes = decodeModelNotes(frames, onsets, [], 'keyboard');
  assert.deepEqual(notes.map(n => n.midi).sort((a, b) => a - b), [60, 61, 67]);
});

test('polyphonic decoding splits repeated notes', () => {
  const { frames, onsets } = posterior([{ midi: 60, start: 3, end: 40 }, { midi: 60, start: 40, end: 80 }]);
  assert.equal(decodeModelNotes(frames, onsets, [], 'keyboard').length, 2);
});

test('a softer repeated key strike survives when frame energy rises after its onset', () => {
  const { frames, onsets } = posterior([{ midi: 55, start: 3, end: 80 }]);
  // The pitch remains above the sustain threshold, but the next key strike
  // renews its energy. Its onset is weaker than a loud isolated attack.
  const rise = [0.39, 0.36, 0.32, 0.30, 0.28, 0.27, 0.29, 0.32, 0.37, 0.44, 0.51, 0.57, 0.61, 0.64, 0.65];
  rise.forEach((v, i) => { frames[30 + i][55 - 21] = v; });
  onsets[40][55 - 21] = 0.61;
  for (const sensitivity of ['balanced', 'precise'] as const) {
    const notes = decodeModelNotes(frames, onsets, [], 'keyboard', { sensitivity });
    assert.equal(notes.length, 2);
    assert.ok(notes[1].startSec > notes[0].startSec);
  }
});

test('a moderate onset during a decaying tail does not create a repeated note', () => {
  const { frames, onsets } = posterior([{ midi: 55, start: 3, end: 80 }]);
  for (let f = 20; f < 80; f++) frames[f][55 - 21] = 0.8 - (f - 20) * 0.005;
  onsets[40][55 - 21] = 0.61;
  assert.equal(decodeModelNotes(frames, onsets, [], 'keyboard').length, 1);
});

test('balanced polyphonic detection rejects very short activation echoes but keeps short played notes', () => {
  const echo = posterior([{ midi: 60, start: 3, end: 40 }, { midi: 72, start: 3, end: 7 }]);
  assert.deepEqual(decodeModelNotes(echo.frames, echo.onsets, [], 'keyboard').map(n => n.midi), [60]);

  const shortPlayedNote = posterior([{ midi: 60, start: 3, end: 40 }, { midi: 72, start: 3, end: 11 }]);
  assert.deepEqual(decodeModelNotes(shortPlayedNote.frames, shortPlayedNote.onsets, [], 'keyboard').map(n => n.midi), [60, 72]);
});

test('silence produces no neural note events', () => {
  const { frames, onsets } = posterior([]);
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard'), []);
});

test('balanced recovers sustained quiet pitches without inventing notes from brief activity', () => {
  const { frames, onsets } = posterior([]);
  for (let f = 10; f < 40; f++) frames[f][64 - 21] = 0.44;
  for (let f = 15; f < 20; f++) frames[f][76 - 21] = 0.44;
  const recovered = decodeModelNotes(frames, onsets, [], 'keyboard');
  assert.deepEqual(recovered.map(n => n.midi), [64]);
  const reference = posterior([{ midi: 64, start: 10, end: 40 }]);
  const expected = decodeModelNotes(reference.frames, reference.onsets, [], 'keyboard')[0];
  assert.equal(recovered[0].startSec, expected.startSec);
  assert.equal(recovered[0].durationSec, expected.durationSec);
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard', { sensitivity: 'precise' }), []);
});

test('existing monophonic bass path still detects A2', () => {
  const notes = transcribeMono(tone(110, 1), SR, 'bass');
  assert.ok(notes.some(n => n.midi === 45));
});

test('weak short attacks between chords survive with pitch-specific onset and frame support', () => {
  const { frames, onsets } = posterior([60, 64, 67].flatMap(midi => [
    { midi, start: 3, end: 25 }, { midi, start: 65, end: 95 },
  ]));
  for (const [midi, start] of [[62, 30], [65, 39], [69, 48]]) {
    onsets[start][midi - 21] = 0.36;
    for (let f = start; f < start + 6; f++) frames[f][midi - 21] = 0.44;
  }
  const notes = decodeModelNotes(frames, onsets, [], 'keyboard');
  assert.equal(notes.length, 9);
  assert.deepEqual(notes.slice(3, 6).map(n => n.midi), [62, 65, 69]);
});

test('weak onset noise without a fresh pitch rise does not split sustained notes', () => {
  const { frames, onsets } = posterior([{ midi: 60, start: 3, end: 90 }]);
  onsets[40][60 - 21] = 0.36;
  onsets[40][72 - 21] = 0.36;
  frames[40][72 - 21] = 0.44;
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard').map(n => n.midi), [60]);
});

test('a double-peaked onset does not create a duplicate note', () => {
  const { frames, onsets } = posterior([{ midi: 60, start: 10, end: 80 }]);
  onsets[15][60 - 21] = 0.8;
  assert.equal(decodeModelNotes(frames, onsets, [], 'keyboard').length, 1);
});

test('a weak onset on a held bass does not split it when another voice enters', () => {
  const { frames, onsets } = posterior([{ midi: 48, start: 3, end: 95 }, { midi: 64, start: 45, end: 80 }]);
  onsets[45][48 - 21] = 0.5;
  const notes = decodeModelNotes(frames, onsets, [], 'keyboard');
  assert.deepEqual(notes.map(n => n.midi), [48, 64]);
});

test('a quiet independent melody is recovered over sustained chord tones', () => {
  const { frames, onsets } = posterior([48, 52, 55].map(midi => ({ midi, start: 3, end: 95 })));
  onsets[45][67 - 21] = 0.7;
  for (let f = 45; f < 55; f++) frames[f][67 - 21] = 0.25;
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard').map(n => n.midi), [48, 52, 55, 67]);
});

test('an isolated quiet staccato note does not also recover its weak octave echo', () => {
  const { frames, onsets } = posterior([]);
  for (const midi of [64, 76]) {
    onsets[10][midi - 21] = 0.8;
    for (let f = 10; f < 17; f++) frames[f][midi - 21] = 0.25;
  }
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard').map(n => n.midi), [64]);
});

test('quiet simultaneous harmonic candidates do not receive the independent-melody threshold', () => {
  const { frames, onsets } = posterior([{ midi: 48, start: 3, end: 80 }]);
  onsets[3][60 - 21] = 0.7;
  for (let f = 3; f < 30; f++) frames[f][60 - 21] = 0.25;
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard').map(n => n.midi), [48]);
});

test('inversions change when the bass changes even if pitch classes stay the same', () => {
  const chords = analyzeChords([note(48, 0, 0.5), note(52, 0, 1), note(55, 0, 1), note(60, 0, 1)]);
  assert.equal(chords.length, 2);
  assert.match(chords[0].voicing, /root position/);
  assert.match(chords[1].voicing, /1st inversion/);
  assert.equal(chords[1].startSec, 0.5);
});

test('a transient octave doubling does not make the stable voicing an open chord', () => {
  const chords = analyzeChords([note(60), note(64), note(67), note(84, 0, 0.1)]);
  assert.equal(chords.length, 1);
  assert.match(chords[0].voicing, /close position/);
});

test('broadband noise and silence do not confirm pitches, but quiet tones do', () => {
  let random = 12345;
  const noise = Float32Array.from({ length: 22050 }, () => {
    random = (Math.imul(1664525, random) + 1013904223) >>> 0;
    return (random / 2 ** 32 * 2 - 1) * 0.002;
  });
  const candidate = note(69, 0.2, 0.5);
  assert.deepEqual(rejectBroadbandNotes([candidate], noise, 22050), []);
  assert.deepEqual(rejectBroadbandNotes([candidate], new Float32Array(22050), 22050), []);
  const quietTone = Float32Array.from(noise, (v, i) => v + 0.005 * Math.sin(2 * Math.PI * 440 * i / 22050));
  assert.equal(rejectBroadbandNotes([candidate], quietTone, 22050).length, 1);
});

test('rounded piano frequency limits retain the full 88-key range', () => {
  const { frames, onsets } = posterior([21, 108].map(midi => ({ midi, start: 3, end: 80 })));
  assert.deepEqual(decodeModelNotes(frames, onsets, [], 'keyboard').map(n => n.midi), [21, 108]);
});

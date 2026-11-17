import { test } from 'node:test';
import assert from 'node:assert/strict';
import { concertKey, keyChangeInterval, keyFifths, nearestDirection, partInterval, writtenKey } from './intervals';
import { partInstrument as inst } from './partInstruments';

test('key change follows the chosen direction', () => {
  assert.equal(keyChangeInterval('Eb', 'G', 'up'), '3M');
  assert.equal(keyChangeInterval('Eb', 'G', 'down'), '-6m');
  assert.equal(keyChangeInterval('G', 'G', 'down'), '1P');
});

test('nearest direction: below a tritone goes up, a tritone or more goes down', () => {
  assert.equal(nearestDirection('Eb', 'G'), 'up');
  assert.equal(nearestDirection('C', 'F'), 'up');
  assert.equal(nearestDirection('C', 'F#'), 'down');
  assert.equal(nearestDirection('C', 'A'), 'down');
});

test('part interval = undo source, change key, apply target', () => {
  assert.equal(partInterval({ source: inst('keyboard'), target: inst('tenorsax'), keyChange: '3M', sourceFifths: -3 }), '11A');
  assert.equal(partInterval({ source: inst('trumpet'), target: inst('altosax'), keyChange: '1P', sourceFifths: -1 }), '5P');
  assert.equal(partInterval({ source: inst('keyboard'), target: inst('bass'), keyChange: '-6m', sourceFifths: -3 }), '3M');
});

test('written keys beyond 6 accidentals are respelled', () => {
  // Concert B → tenor: Db (5 flats), not C# (7 sharps)
  assert.equal(partInterval({ source: inst('keyboard'), target: inst('tenorsax'), keyChange: '1P', sourceFifths: 5 }), '10d');
  // Db + minor 2nd → D, not Ebb
  const fake = { ...inst('keyboard'), toWritten: '2m' };
  assert.equal(partInterval({ source: inst('keyboard'), target: fake, keyChange: '1P', sourceFifths: -5 }), '1A');
});

test('concert ↔ written keys and key signatures', () => {
  assert.deepEqual(concertKey({ tonic: 'F', minor: false }, inst('trumpet')), { tonic: 'Eb', minor: false });
  assert.deepEqual(writtenKey({ tonic: 'G', minor: true }, inst('tenorsax')), { tonic: 'A', minor: true });
  assert.equal(keyFifths({ tonic: 'C', minor: true }), -3);
  assert.equal(keyFifths({ tonic: 'D', minor: false }), 2);
});

test('written and concert keys stay within six accidentals', () => {
  // G#m + major 6th = E#m (8 sharps) → Fm
  assert.deepEqual(writtenKey({ tonic: 'G#', minor: true }, inst('altosax')), { tonic: 'F', minor: true });
  // Abm − major 6th = Cbm (10 flats) → Bm
  assert.deepEqual(concertKey({ tonic: 'Ab', minor: true }, inst('altosax')), { tonic: 'B', minor: true });
});

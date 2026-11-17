import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventTicks, parseTextScore } from './textScore';
import { EXAMPLE } from './fixtures';

test('parses headers, notes, rests, chords and chord-only bars', () => {
  const { score, errors } = parseTextScore(EXAMPLE);
  assert.deepEqual(errors, []);
  assert.ok(score);
  assert.equal(score.title, 'Esempio');
  assert.deepEqual(score.key, { tonic: 'Eb', minor: false });
  assert.deepEqual(score.time, { beats: 4, beatType: 4 });
  assert.equal(score.bars.length, 4);
  assert.equal(score.bars[0].events[0].pitch, 'Bb4');
  assert.equal(score.bars[0].events[0].chord, 'Ebmaj7');
  assert.equal(score.bars[1].events[0].dotted, true);
  assert.equal(score.bars[1].events[1].rest, true);
  assert.deepEqual(score.bars[2].chords, ['Fm7', 'Bb7']);
  assert.equal(score.bars[2].events.length, 0);
});

test('minor keys, bass clef, 6/8 and missing key', () => {
  const { score } = parseTextScore('key: F#m\ntime: 6/8\nclef: bass\n| F#3:q. C#3:q. |');
  assert.deepEqual(score?.key, { tonic: 'F#', minor: true });
  assert.equal(score?.clef, 'bass');
  assert.equal(parseTextScore('| C4:w |').score?.key, null);
});

test('triplets and ties, across bars and lines', () => {
  const { score, errors } = parseTextScore('| (3 C5:8 D5:8 E5:8) F5:q G5:h~ |\n| G5:q r:q r:h |');
  assert.deepEqual(errors, []);
  const [a, b] = score!.bars;
  assert.equal(a.events.filter(e => e.triplet).length, 3);
  assert.equal(eventTicks(a.events[0]), 8);
  assert.equal(a.events[4].tieStart, true);
  assert.equal(b.events[0].tieStop, true);
});

test('reports bar-level errors and returns no score', () => {
  const { score, errors } = parseTextScore('key: Eb\n| C4:q | C4:w D4:q | [Xyz] C4:w | Q9 | C4:w~ | D4:w | [C] [F] [G] | E4:w~ | [F7] | E4:w | B#3:w~ | C4:w | E4:w )');
  assert.equal(score, null);
  const messages = errors.map(e => e.message);
  const has = (predicate: (m: string) => boolean) => assert.ok(messages.some(predicate), messages.join('\n'));
  has(m => m.startsWith('Battuta 1: durata 1/4 invece di 4/4'));
  has(m => m.startsWith('Battuta 2: durata 5/4 invece di 4/4'));
  has(m => m.includes('sigla non riconosciuta «Xyz»'));
  has(m => m.includes('simbolo non riconosciuto «Q9»'));
  has(m => m.startsWith('Battuta 6: la legatura'));
  has(m => m.startsWith('Battuta 7: 3 sigle non dividono'));
  has(m => m.startsWith('Battuta 9: legatura ~ verso una battuta senza note'));
  has(m => m.startsWith('Battuta 12: la legatura'));
  has(m => m.includes('«)» senza «(3»'));
  assert.ok(!messages.some(m => m.startsWith('Battuta 4: battuta vuota')), messages.join('\n'));
});

test('header errors use bar 0', () => {
  const { errors } = parseTextScore('key: H\ntime: 5/3\nkey: Fb\n| C4:w |');
  assert.deepEqual(errors.map(e => e.bar), [0, 0, 0]);
});

test('accepts flat/sharp symbols, lowercase letters and CRLF', () => {
  const { score, errors } = parseTextScore('key: ebm\n| e♭4:w |');
  assert.deepEqual(errors, []);
  assert.deepEqual(score?.key, { tonic: 'Eb', minor: true });
  assert.equal(score?.bars[0].events[0].pitch, 'Eb4');
  const crlf = parseTextScore('key: C\r\n| C4:w |');
  assert.deepEqual(crlf.errors, []);
  assert.ok(crlf.score);
});

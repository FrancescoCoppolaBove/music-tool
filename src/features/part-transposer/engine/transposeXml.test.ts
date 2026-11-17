import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTextScore } from './textScore';
import { textToMusicXml } from './textToMusicXml';
import { pitchNames, testCodec } from './testXml';
import { toDisplayXml, transposePart } from './transposeXml';
import { all, child, childText } from './xmlDom';
import { partInstrument as inst } from './partInstruments';
import { EXAMPLE, SLASH_CHORD_MINOR } from './fixtures';

const xmlFor = (src: string) => testCodec.parse(textToMusicXml(parseTextScore(src).score!));
const roots = (doc: Document) => all(doc, 'root').map(r => `${childText(r, 'root-step')}${childText(r, 'root-alter') ?? ''}`);

test('Eb → G for keyboard: notes, chords and key signature', () => {
  const doc = xmlFor(EXAMPLE);
  transposePart(doc, { interval: '3M', target: inst('keyboard') });
  assert.deepEqual(pitchNames(doc), ['D5', 'B4', 'A4', 'G4', 'E5', 'G4']);
  assert.deepEqual(roots(doc), ['G', 'E', 'A', 'D', 'G']);
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '1');
  assert.equal(all(doc, 'transpose').length, 0);
  assert.equal(childText(all(doc, 'score-part')[0], 'part-name'), 'Keyboard');
});

test('tenor sax: written pitch, key, <transpose>', () => {
  const doc = xmlFor(EXAMPLE);
  transposePart(doc, { interval: '11A', target: inst('tenorsax') });
  assert.equal(pitchNames(doc)[0], 'E6');
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '3');
  const t = all(doc, 'transpose')[0];
  assert.deepEqual([childText(t, 'diatonic'), childText(t, 'chromatic'), childText(t, 'octave-change')], ['-1', '-2', '-1']);
  assert.equal(childText(all(doc, 'clef')[0], 'sign'), 'G');
});

test('bass: F clef, slash noteheads re-centred, out-of-range count', () => {
  const doc = xmlFor(EXAMPLE);
  const result = transposePart(doc, { interval: '10M', target: inst('bass') });
  const clef = all(doc, 'clef')[0];
  assert.deepEqual([childText(clef, 'sign'), childText(clef, 'line')], ['F', '4']);
  const slash = all(doc, 'note').find(n => childText(n, 'notehead') === 'slash')!;
  assert.deepEqual([childText(child(slash, 'pitch')!, 'step'), childText(child(slash, 'pitch')!, 'octave')], ['D', '3']);
  assert.deepEqual(result, { above: 6, below: 0 });
});

test('slash chords and minor key signatures', () => {
  const doc = testCodec.parse(SLASH_CHORD_MINOR);
  transposePart(doc, { interval: '3M', target: inst('keyboard') });
  const h = all(doc, 'harmony')[0];
  assert.equal(childText(child(h, 'root')!, 'root-step'), 'E');
  assert.equal(childText(child(h, 'bass')!, 'bass-step'), 'D');
  assert.equal(child(child(h, 'bass')!, 'bass-alter'), null);
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '1');
  assert.equal(childText(all(doc, 'key')[0], 'mode'), 'minor');
});

test('accidentals follow the new key signature', () => {
  const doc = xmlFor('key: F\n| E4:q Eb4:q Eb4:q Bb4:q |');
  transposePart(doc, { interval: '2M', target: inst('keyboard') });
  assert.deepEqual(all(doc, 'note').map(n => childText(n, 'accidental')), [null, 'natural', null, null]);
});

test('preview variant: chord words and out-of-range colour', () => {
  const doc = xmlFor(EXAMPLE);
  transposePart(doc, { interval: '10M', target: inst('bass') });
  toDisplayXml(doc, inst('bass').range);
  assert.equal(all(doc, 'harmony').length, 0);
  assert.deepEqual(all(doc, 'words').map(w => w.textContent), ['Gmaj7', 'Em7', 'Am7', 'D7', 'Gmaj7']);
  assert.equal(all(doc, 'note').filter(n => n.getAttribute('color')).length, 6);
});

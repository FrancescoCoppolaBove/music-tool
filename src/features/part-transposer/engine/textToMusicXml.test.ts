import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTextScore } from './textScore';
import { textToMusicXml } from './textToMusicXml';
import { testCodec } from './testXml';
import { all, child, childText } from './xmlDom';
import { EXAMPLE } from './fixtures';

const build = (src: string) => testCodec.parse(textToMusicXml(parseTextScore(src).score!));

test('builds a single-part MusicXML with key, time, harmony and notes', () => {
  const doc = build(EXAMPLE);
  assert.equal(all(doc, 'part').length, 1);
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '-3');
  assert.equal(childText(all(doc, 'attributes')[0], 'divisions'), '24');
  assert.equal(all(doc, 'measure').length, 4);
  const first = all(doc, 'note')[0];
  assert.equal(childText(child(first, 'pitch')!, 'step'), 'B');
  assert.equal(childText(child(first, 'pitch')!, 'alter'), '-1');
  assert.equal(childText(first, 'duration'), '24');
  const roots = all(doc, 'root').map(r => `${childText(r, 'root-step')}${childText(r, 'root-alter') ?? ''}`);
  assert.deepEqual(roots, ['E-1', 'C', 'F', 'B-1', 'E-1']);
  assert.equal(childText(all(doc, 'work')[0], 'work-title'), 'Esempio');
});

test('chord-only bars become slash beats split between the chords', () => {
  const notes = all(build('key: C\n| [F7] [Bb7] |'), 'note');
  assert.equal(notes.length, 4);
  assert.ok(notes.every(n => childText(n, 'notehead') === 'slash'));
});

test('triplets, ties, rests, minor key and bass clef', () => {
  const doc = build('key: Am\nclef: bass\n| (3 C3:8 D3:8 E3:8) F3:q G3:h~ | G3:q r:q r:h |');
  assert.equal(childText(all(doc, 'key')[0], 'mode'), 'minor');
  assert.equal(childText(all(doc, 'clef')[0], 'sign'), 'F');
  assert.deepEqual(all(doc, 'tuplet').map(t => t.getAttribute('type')), ['start', 'stop']);
  assert.equal(all(doc, 'time-modification').length, 3);
  assert.deepEqual(all(doc, 'tie').map(t => t.getAttribute('type')), ['start', 'stop']);
  assert.equal(all(doc, 'rest').length, 2);
});

test('adjacent triplet groups each get their own tuplet start and stop', () => {
  const doc = build('| (3 C5:8 D5:8 E5:8) (3 F5:8 G5:8 A5:8) F5:h |');
  assert.deepEqual(all(doc, 'tuplet').map(t => t.getAttribute('type')), ['start', 'stop', 'start', 'stop']);
});

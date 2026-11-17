import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Note } from 'tonal';
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

test('mid-piece key change is respelled for its own key', () => {
  const doc = xmlFor('key: Eb\n| E4:w | E4:w |');
  const second = all(doc, 'measure')[1];
  const attrs = doc.createElement('attributes');
  const key = doc.createElement('key');
  const fifths = doc.createElement('fifths');
  fifths.textContent = '4';
  key.appendChild(fifths);
  attrs.appendChild(key);
  second.insertBefore(attrs, second.firstChild);
  transposePart(doc, { interval: '11A', target: inst('tenorsax') });
  const keys = all(doc, 'key').map(k => Number(childText(k, 'fifths')));
  assert.ok(keys.every(f => Math.abs(f) <= 6), keys.join());
  const notes = all(doc, 'note');
  const last = child(notes[notes.length - 1], 'pitch')!;
  const alter = Number(childText(last, 'alter') ?? 0);
  // E + 11A (18 semitones) = Bb/A#, never spelled with a double accidental
  assert.ok(Math.abs(alter) <= 1);
  assert.equal(Note.chroma(`${childText(last, 'step')}${alter > 0 ? '#' : alter < 0 ? 'b' : ''}`), 10);
});

test('stale fingering is removed', () => {
  const doc = testCodec.parse(SLASH_CHORD_MINOR);
  const harmony = all(doc, 'harmony')[0];
  harmony.appendChild(doc.createElement('frame'));
  const note = all(doc, 'note')[0];
  const notations = doc.createElement('notations');
  const technical = doc.createElement('technical');
  technical.appendChild(doc.createElement('string'));
  technical.appendChild(doc.createElement('fret'));
  technical.appendChild(doc.createElement('up-bow'));
  notations.appendChild(technical);
  note.appendChild(notations);
  transposePart(doc, { interval: '3M', target: inst('guitar') });
  assert.equal(all(doc, 'frame').length, 0);
  assert.equal(all(doc, 'string').length + all(doc, 'fret').length, 0);
  assert.equal(all(doc, 'up-bow').length, 1);
});

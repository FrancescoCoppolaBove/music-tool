import { test } from 'node:test';
import assert from 'node:assert/strict';
import { all, child, childElements, childText, insertBeforeFirst, removeChildren, setChildText } from './xmlDom';
import { testCodec } from './testXml';
import { PART_INSTRUMENTS, partInstrument } from './partInstruments';

test('helpers read and write direct children only', () => {
  const doc = testCodec.parse('<note><pitch><step>C</step><octave>4</octave></pitch><type>quarter</type><notations/></note>');
  const note = doc.documentElement;
  assert.deepEqual(childElements(note).map(e => e.tagName), ['pitch', 'type', 'notations']);
  assert.equal(childText(note, 'step'), null);
  const pitch = child(note, 'pitch')!;
  setChildText(pitch, 'alter', '-1', ['octave']);
  assert.deepEqual(childElements(pitch).map(e => e.tagName), ['step', 'alter', 'octave']);
  insertBeforeFirst(note, doc.createElement('accidental'), ['notations']);
  assert.deepEqual(childElements(note).map(e => e.tagName), ['pitch', 'type', 'accidental', 'notations']);
  removeChildren(pitch, 'alter');
  assert.equal(all(doc, 'alter').length, 0);
});

test('codec rejects invalid XML and serializes with a declaration', () => {
  assert.throws(() => testCodec.parse('<a><b></a>'), /Invalid XML/);
  assert.match(testCodec.serialize(testCodec.parse('<a/>')), /^<\?xml/);
});

test('the tool offers the seven requested instruments', () => {
  assert.deepEqual(PART_INSTRUMENTS.map(i => i.id), ['keyboard', 'bass', 'guitar', 'tenorsax', 'altosax', 'sopsax', 'trumpet']);
  assert.throws(() => partInstrument('horn'));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAlter, recomputeAccidentals } from './accidentals';
import { testCodec } from './testXml';
import { all, childText } from './xmlDom';

/** A quarter note on octave 4; `extra` goes after <duration>, `tail` before </note>. */
const note = (step: string, alter: number, extra = '', tail = '') =>
  `<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>4</octave></pitch><duration>1</duration>${extra}<type>quarter</type>${tail}</note>`;
const part = (fifths: number, ...measures: string[][]) => testCodec.parse(
  `<part id="P1">${measures.map((notes, i) => `<measure number="${i + 1}">${i === 0 ? `<attributes><key><fifths>${fifths}</fifths></key></attributes>` : ''}${notes.join('')}</measure>`).join('')}</part>`,
);
const accidentals = (doc: Document) => all(doc, 'note').map(n => childText(n, 'accidental'));

test('key signature alterations', () => {
  assert.equal(keyAlter('F', 1), 1);
  assert.equal(keyAlter('C', 1), 0);
  assert.equal(keyAlter('B', -1), -1);
  assert.equal(keyAlter('A', -3), -1);
  assert.equal(keyAlter('D', -3), 0);
});

test('shown against the key and earlier notes in the bar, reset each bar', () => {
  const doc = part(1, [note('F', 1), note('F', 0), note('F', 0), note('C', 1)], [note('F', 0)]);
  recomputeAccidentals(doc.documentElement);
  assert.deepEqual(accidentals(doc), [null, 'natural', null, 'sharp', 'natural']);
});

test('stale accidentals are removed; tied continuations and slashes never show one', () => {
  const doc = part(0,
    [note('C', 0, '', '<accidental>sharp</accidental>'), note('F', 1, '<tie type="start"/>')],
    [note('F', 1, '<tie type="stop"/>'), note('B', -1, '', '<notehead>slash</notehead>')],
  );
  recomputeAccidentals(doc.documentElement);
  assert.deepEqual(accidentals(doc), [null, 'sharp', null, null]);
});

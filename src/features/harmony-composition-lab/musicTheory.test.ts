import assert from 'node:assert/strict';
import test from 'node:test';
import { getDiatonicSeventhChords, getKeyProfile, getScaleMaterial, transposeConcertToWritten, transposeProgression } from './musicTheory';

const expected: Array<[string, string]> = [
  ['major', 'C D E F G A B'],
  ['dorian', 'C D Eb F G A Bb'],
  ['phrygian', 'C Db Eb F G Ab Bb'],
  ['lydian', 'C D E F# G A B'],
  ['mixolydian', 'C D E F G A Bb'],
  ['minor', 'C D Eb F G Ab Bb'],
  ['locrian', 'C Db Eb F Gb Ab Bb'],
  ['melodic minor', 'C D Eb F G A B'],
  ['harmonic minor', 'C D Eb F G Ab B'],
  ['phrygian dominant', 'C Db E F G Ab Bb'],
  ['lydian dominant', 'C D E F# G A Bb'],
  ['altered', 'C Db D# E F# Ab Bb'],
  ['whole tone', 'C D E F# G# A#'],
  ['minor pentatonic', 'C Eb F G Bb'],
  ['minor blues', 'C Eb F Gb G Bb'],
];

test('scale material matches the required C scale and mode formulas', () => {
  for (const [mode, notes] of expected) {
    assert.equal(getScaleMaterial('C', mode).notes.join(' '), notes, mode);
  }
});

test('major and Dorian seventh chords are generated from their scale degrees', () => {
  assert.deepEqual(getDiatonicSeventhChords('C', 'major'), ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']);
  assert.deepEqual(getDiatonicSeventhChords('C', 'dorian'), ['Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5', 'Bbmaj7']);
});

test('pentatonic scales do not claim seven diatonic chords', () => {
  assert.deepEqual(getDiatonicSeventhChords('C', 'minor pentatonic'), []);
});

test('key profiles distinguish relative and parallel keys and minor scale forms', () => {
  const major = getKeyProfile('C', 'major');
  assert.equal(major.relative, 'A minor');
  assert.equal(major.parallel, 'C minor');
  assert.equal(major.keySignature, 'No sharps or flats');
  const minor = getKeyProfile('A', 'minor');
  assert.equal(minor.relative, 'C major');
  assert.deepEqual(minor.scale, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.deepEqual(minor.harmonicScale, ['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
  assert.deepEqual(minor.melodicScale, ['A', 'B', 'C', 'D', 'E', 'F#', 'G#']);
});

test('concert-to-written transpositions preserve the correct horn octave', () => {
  assert.equal(transposeConcertToWritten('C4', 'altoSax'), 'A4');
  assert.equal(transposeConcertToWritten('C4', 'tenorSax'), 'D5');
  assert.equal(transposeConcertToWritten('C4', 'trumpet'), 'D4');
  assert.equal(transposeConcertToWritten('Bb4', 'altoSax'), 'G5');
  assert.equal(transposeConcertToWritten('Bb4', 'tenorSax'), 'C6');
  assert.equal(transposeConcertToWritten('Bb4', 'trumpet'), 'C5');
  assert.equal(transposeConcertToWritten('Eb4', 'altoSax'), 'C5');
  assert.equal(transposeConcertToWritten('Eb4', 'tenorSax'), 'F5');
  assert.equal(transposeConcertToWritten('Eb4', 'trumpet'), 'F4');
});

test('progression transposition keeps chord qualities and relative structure', () => {
  assert.deepEqual(transposeProgression(['Cm7', 'F7', 'Bbmaj7'], 'C', 'D'), ['Dm7', 'G7', 'Cmaj7']);
  assert.deepEqual(transposeProgression(['Bb7', 'Ebmaj7'], 'Bb', 'C'), ['C7', 'Fmaj7']);
});

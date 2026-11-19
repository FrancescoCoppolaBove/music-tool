import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCALES, parseProgression } from './chordScales';
import { analyzeProgression, detectKey, type KeyChoice } from './progressionContext';

const analyze = (text: string, key?: KeyChoice) => analyzeProgression(parseProgression(text), key);
const scales = (text: string, key?: KeyChoice) => analyze(text, key).chords.map(c => c.scale.name);

test('key detection: major, minor, ii–V into a new tonic and the blues', () => {
  assert.deepEqual(detectKey(parseProgression('Dm7 G7 Cmaj7')), { tonic: 'C', mode: 'major' });
  assert.deepEqual(detectKey(parseProgression('Dm7b5 G7 Cm6')), { tonic: 'C', mode: 'minor' });
  assert.deepEqual(detectKey(parseProgression('Cm7b5 F7alt Bbmaj7')), { tonic: 'Bb', mode: 'major' });
  assert.deepEqual(detectKey(parseProgression('Fm7 Bb7 Cmaj7')), { tonic: 'C', mode: 'major' });
  assert.deepEqual(detectKey(parseProgression('C7 F7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7')), { tonic: 'C', mode: 'major' });
});

test('diatonic chords take the mode of their degree', () => {
  assert.deepEqual(scales('Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5'), [
    SCALES.ionian.name, SCALES.dorian.name, SCALES.phrygian.name, SCALES.lydian.name,
    SCALES.mixolydian.name, SCALES.aeolian.name, SCALES.locrian.name,
  ]);
  assert.deepEqual(analyze('Dm7 G7 Cmaj7').chords.map(c => c.roman), ['ii7', 'V7', 'IΔ7']);
});

test('secondary dominants take their tensions from the target', () => {
  const [, a7] = analyze('Cmaj7 A7 Dm7 G7 Cmaj7').chords;
  assert.equal(a7.scale.name, SCALES.phrygianDom.name);
  assert.equal(a7.role, 'V7/ii → minor');
  const [, d7] = analyze('Cmaj7 D7 G7 Cmaj7').chords;
  assert.equal(d7.scale.name, SCALES.mixolydian.name);
  assert.equal(d7.role, 'V7/V → major');
});

test('substitute and backdoor dominants are Lydian ♭7', () => {
  const [, db7] = analyze('Dm7 Db7 Cmaj7').chords;
  assert.equal(db7.scale.name, SCALES.lydianDom.name);
  assert.equal(db7.role, 'subV7 (tritone sub)');
  const [fm7, bb7] = analyze('Fm7 Bb7 Cmaj7').chords;
  assert.equal(fm7.scale.name, SCALES.dorian.name);
  assert.equal(bb7.scale.name, SCALES.lydianDom.name);
  assert.equal(bb7.role, '♭VII7 (backdoor)');
});

test('minor ii–V–i', () => {
  assert.deepEqual(scales('Dm7b5 G7 Cm6'), [SCALES.locrian.name, SCALES.mixolydianb9s9b13.name, SCALES.melodicMinor.name]);
  const v7 = analyze('Dm7b5 G7 Cm6').chords[1];
  // Derived card: on a dominant the 11 is the only avoid note
  assert.deepEqual(v7.scale.avoidNotes, [5]);
  assert.deepEqual(v7.scale.goodExtensions, [1, 3, 8]);
});

test('written tensions and altered symbols win over the context', () => {
  // A natural 13 where the context asks for ♭13: the chord's own scale stays
  const [, a13] = analyze('Cmaj7 A13 Dm7').chords;
  assert.equal(a13.contextual, false);
  const [, galt] = analyze('Dm7 G7alt Cmaj7').chords;
  assert.equal(galt.scale.name, SCALES.altered.name);
});

test('blues dominants stay Mixolydian', () => {
  assert.ok(scales('C7 F7 C7 G7 F7 C7').every(name => name === SCALES.mixolydian.name));
});

test('a leading-tone °7 into minor takes the target\'s harmonic minor', () => {
  const [, dim] = analyze('Cmaj7 G#dim7 Am7', { tonic: 'C', mode: 'major' }).chords;
  assert.ok(dim.scale.name.startsWith('Ultralocrian'));
});

test('a manual key overrides detection', () => {
  const chords = analyze('Dm7 G7 Cmaj7', { tonic: 'F', mode: 'major' }).chords;
  assert.equal(chords[0].roman, 'vi7');
  assert.equal(chords[0].scale.name, SCALES.aeolian.name);
});

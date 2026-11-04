import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORD_SCALE_DATA, SCALES, parseChordSymbol } from './chordScales';

const PARENTS: Record<string, number[]> = {
  'Major': SCALES.ionian.intervals,
  'Melodic Minor': SCALES.melodicMinor.intervals,
  'Harmonic Minor': SCALES.harmonicMinor.intervals,
  'Major Pentatonic': SCALES.majorPenta.intervals,
  'Minor Pentatonic': SCALES.minorPenta.intervals,
  'Blues Scale': SCALES.blues.intervals,
};

const pcs = (xs: number[]) => [...new Set(xs.map(x => ((x % 12) + 12) % 12))].sort((a, b) => a - b);

function allScales() {
  return CHORD_SCALE_DATA.flatMap(e => [e.primary, ...e.alternatives].map(s => ({ entry: e, scale: s })));
}

test('every entry has a primary scale and a unique quality', () => {
  const seen = new Set<string>();
  for (const e of CHORD_SCALE_DATA) {
    assert.ok(e.primary, `${e.quality} has no primary scale`);
    assert.ok(!seen.has(e.quality), `duplicate quality ${e.quality}`);
    seen.add(e.quality);
  }
});

test('coloured degrees belong to the scale and to the chord', () => {
  for (const { entry, scale } of allScales()) {
    const where = `${entry.quality} / ${scale.name}`;
    const inScale = (xs: number[], what: string) =>
      xs.forEach(x => assert.ok(scale.intervals.includes(x), `${where}: ${what} ${x} not in scale`));
    inScale(scale.chordTones, 'chord tone');
    inScale(scale.goodExtensions, 'extension');
    inScale(scale.avoidNotes, 'avoid note');
    scale.chordTones.forEach(t => assert.ok(entry.chordTones.includes(t), `${where}: ${t} is not a chord tone of ${entry.quality}`));
    scale.avoidNotes.forEach(t => assert.ok(!scale.chordTones.includes(t), `${where}: ${t} is both chord tone and avoid note`));
  }
});

test('a full (7+ note) scale contains every chord tone except an omittable P5', () => {
  for (const { entry, scale } of allScales()) {
    if (scale.intervals.length < 7) continue;
    entry.chordTones.filter(t => t !== 7).forEach(t =>
      assert.ok(scale.intervals.includes(t), `${entry.quality} / ${scale.name}: missing chord tone ${t}`));
  }
});

test('memorisation trick names the real parent scale', () => {
  for (const { entry, scale } of allScales()) {
    if (scale.trickSemitones === undefined || !scale.trickScaleName) continue;
    const parent = PARENTS[scale.trickScaleName];
    assert.ok(parent, `unknown parent ${scale.trickScaleName}`);
    assert.deepEqual(
      pcs(scale.intervals),
      pcs(parent.map(i => i + scale.trickSemitones!)),
      `${entry.quality} / ${scale.name}: ${scale.trickScaleName} ${scale.trickInterval} is not the parent`,
    );
  }
});

test('chord symbols resolve to their own entry', () => {
  const cases: Record<string, string> = {
    C: 'maj', Cm: 'm', Cmaj7: 'maj7', Cmaj9: 'maj9', Cmaj13: 'maj13', 'Cmaj7#11': 'maj7#11', 'Cmaj9#11': 'maj7#11',
    C6: 'maj6', Cmaj6: 'maj6', C69: '69', Cadd9: 'add9', 'Cmaj7#5': 'maj7#5',
    Cm7: 'm7', Cm9: 'm9', Cm11: 'm11', Cm13: 'm13', Cm6: 'm6', Cm69: 'm69', Cmadd9: 'madd9', CmMaj7: 'mMaj7', CmMaj9: 'mMaj9',
    C7: '7', C9: '9', C13: '13', 'C7#11': '7#11', 'C9#11': '7#11', 'C13#11': '7#11', C7b13: '7b13', C9b13: '9b13',
    C7alt: '7alt', Calt: '7alt', C7b9: '7b9', C13b9: '13b9', 'C7#9': '7#9', C7b9b13: '7b9b13', 'C7#5': '7#5', C7b5: '7b5',
    Csus2: 'sus2', Csus4: 'sus4', Csus: 'sus4', C7sus4: '7sus4', C7sus: '7sus4', C9sus4: '9sus4', C11: '9sus4', C13sus4: '13sus4', C7b9sus: '7b9sus',
    Cm7b5: 'm7b5', Cm9b5: 'm9b5', Cdim: 'dim', Cdim7: 'dim7', Caug: 'aug',
  };
  for (const [symbol, quality] of Object.entries(cases)) {
    assert.equal(parseChordSymbol(symbol)?.quality, quality, symbol);
  }
  assert.equal(parseChordSymbol('Ebmaj9')?.root, 'Eb');
  assert.equal(parseChordSymbol('nonsense'), null);
});

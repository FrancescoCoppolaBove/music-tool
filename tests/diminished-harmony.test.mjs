import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { Chord, Note } from 'tonal';

// Read the actual declarative catalogues without mounting React or mocking auth.
function catalogue(path, names) {
  const source = ts.createSourceFile(path, readFileSync(new URL('../' + path, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (names.includes(declaration.name.getText(source))) declarations.push('const ' + declaration.getText(source) + ';');
    }
  }
  assert.equal(declarations.length, names.length);
  const js = ts.transpileModule(declarations.join('\n') + '\nJSON.stringify({' + names.join(',') + '})', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return JSON.parse(runInNewContext(js));
}

test('dim7 palettes contain the diminished seventh, not a minor seventh', () => {
  const { CHORD_SCALE_DATA } = catalogue('src/features/scale-advisor/ScaleAdvisorFeature.tsx', ['SCALES', 'CHORD_SCALE_DATA']);
  const entry = CHORD_SCALE_DATA.find(x => x.quality === 'dim7');
  assert.equal(entry.primary.name, 'Whole-Half Diminished');
  for (const scale of [entry.primary, ...entry.alternatives]) {
    for (const tone of [0, 3, 6, 9]) assert.ok(scale.intervals.includes(tone), scale.name);
  }
  const half = CHORD_SCALE_DATA.find(x => x.quality === 'm7b5');
  const natural6 = half.alternatives.find(x => x.name === 'Locrian Natural 6');
  for (const tone of [0, 3, 6, 10]) assert.ok(natural6.intervals.includes(tone));
  assert.ok(natural6.intervals.includes(5));
});

test('new progressions have resolvable degrees, qualities and exact lengths', () => {
  const { TEMPLATES } = catalogue('src/features/chord-progression/services/templates.ts', ['TEMPLATES']);
  const { DEGREE_SEMITONE, CHORD_FORMULAS } = catalogue('src/shared/utils/musicTheory.ts', ['DEGREE_SEMITONE', 'CHORD_FORMULAS']);
  for (const template of TEMPLATES.slice(0, 4)) {
    assert.deepEqual(template.lengths, [template.chords.length]);
    for (const chord of template.chords) {
      assert.equal(typeof DEGREE_SEMITONE[chord.degree], 'number');
      assert.ok(CHORD_FORMULAS[chord.quality], chord.quality);
    }
  }
});

test('new landing approaches transpose into valid chords in all twelve keys', () => {
  const { APPROACHES } = catalogue('src/features/chord-landing/ChordLandingFeature.tsx', ['APPROACHES']);
  assert.equal(new Set(APPROACHES.map(a => a.id)).size, APPROACHES.length);
  for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
    for (const approach of APPROACHES.slice(0, 5)) {
      assert.ok(approach.steps.length >= 1 && approach.steps.length <= 5);
      for (const step of approach.steps) {
        const note = Note.transpose(root, step.interval);
        assert.ok(note);
        if (step.quality !== '7alt') assert.ok(!Chord.get(note + step.quality).empty, note + step.quality);
      }
    }
  }
});

test('new lessons have unique IDs, exercises and working tool destinations', () => {
  const { diminishedLessons } = catalogue('src/features/harmonia-course/data/diminishedLessons.ts', ['diminishedLessons']);
  assert.equal(new Set(diminishedLessons.map(l => l.id)).size, 3);
  for (const lesson of diminishedLessons) {
    assert.ok(lesson.esercizi.length >= 3);
    assert.ok(lesson.tools.every(t => ['landing', 'scaleadvisor'].includes(t.tabId)));
  }
});

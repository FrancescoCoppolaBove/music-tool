import assert from 'node:assert/strict';
import test from 'node:test';
import { appendCompositionVersion, compareCompositionSnapshots, createCompositionProject, duplicateCompositionProject, normalizeCompositionSections, restoreCompositionVersion } from './projectVersioning';

const initial = { title: 'Modal sketch', tonic: 'C', mode: 'dorian', bpm: 102, meter: '4/4', chords: ['Cm7', 'F7'] };
const ids = () => { let id = 0; return () => `id-${++id}`; };

test('saving a project creates a first revision and later saves append revisions', () => {
  const nextId = ids();
  const project = createCompositionProject(initial, nextId, '2026-10-11T10:00:00.000Z');
  const updated = appendCompositionVersion(project, { ...initial, bpm: 108 }, nextId, '2026-10-11T10:05:00.000Z');
  assert.equal(updated.id, project.id);
  assert.equal(updated.versions.length, 2);
  assert.equal(updated.versions[1].label, 'Revision 2');
  assert.equal(updated.bpm, 108);
});

test('a prior revision can be restored without mutating the stored project', () => {
  const nextId = ids();
  const project = createCompositionProject(initial, nextId, 't1');
  const updated = appendCompositionVersion(project, { ...initial, chords: ['Dm7', 'G7'] }, nextId, 't2');
  assert.deepEqual(restoreCompositionVersion(updated, project.versions[0].id), { ...initial, sections: [] });
  assert.equal(restoreCompositionVersion(updated, 'unknown'), null);
  assert.deepEqual(project.chords, initial.chords);
});

test('duplicating a project gives it a new identity and preserves its version history', () => {
  const nextId = ids();
  const project = appendCompositionVersion(createCompositionProject(initial, nextId, 't1'), { ...initial, bpm: 96 }, nextId, 't2');
  const copy = duplicateCompositionProject(project, nextId, 't3');
  assert.notEqual(copy.id, project.id);
  assert.equal(copy.title, 'Copy of Modal sketch');
  assert.equal(copy.versions.length, 2);
  assert.notEqual(copy.versions[0].id, project.versions[0].id);
});

test('comparing snapshots marks only fields that differ', () => {
  const rows = compareCompositionSnapshots(initial, { ...initial, tonic: 'F', mode: 'aeolian', chords: ['Fm7', 'Bb7'] });
  assert.deepEqual(rows.filter(row => row.changed).map(row => row.field), ['tonic', 'mode', 'chords']);
  assert.equal(rows.find(row => row.field === 'chords')?.right, 'Fm7 → Bb7');
});

test('composition sections are deep-copied into revisions and legacy snapshots normalize to an empty roadmap', () => {
  const sections = [{ id: 's1', kind: 'verse' as const, name: 'Verse', bars: 8, chords: ['Cm7', 'F7'], melody: ['C4', 'D4', 'Eb4', 'G4'] }];
  const project = createCompositionProject({ ...initial, sections }, ids(), 't1');
  sections[0].chords.push('G7');
  assert.deepEqual(project.sections?.[0].chords, ['Cm7', 'F7']);
  sections[0].melody[0] = 'D4';
  assert.equal(project.sections?.[0].melody?.[0], 'C4');
  const restored = restoreCompositionVersion(project, project.versions[0].id)?.sections ?? [];
  assert.deepEqual(restored[0], { ...sections[0], chords: ['Cm7', 'F7'], melody: ['C4', 'D4', 'Eb4', 'G4'] });
  assert.deepEqual(normalizeCompositionSections(undefined), []);
  assert.deepEqual(normalizeCompositionSections([{ id: 'bad', kind: 'unknown', name: 'Bad', bars: 8, chords: [] }]), []);
});

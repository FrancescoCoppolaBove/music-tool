import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readCompositions, saveComposition, readEditorRequest, EDITOR_REQUEST_KEY } from '../my-compositions/compositionRepository';
import { storageSet } from '../../shared/utils/storage';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) }, configurable: true });

test('editor saves keep project identity, legacy sections, melodies and earlier revisions', () => {
  store.clear();
  const original = saveComposition({ title: 'Song', tonic: 'C', mode: 'dorian', bpm: 100, meter: '4/4', chords: ['Cm7', 'F7'], sections: [{ id: 'a', name: 'Verse', kind: 'verse', bars: 8, chords: ['Cm7'], melody: ['C4', 'Eb4'], feel: 'open', energy: 3 }] });
  const edited = saveComposition({ ...original, sections: [{ ...original.sections![0], chords: ['Cm9', 'F13'] }] }, original.id);
  const loaded = readCompositions();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, original.id);
  assert.equal(loaded[0].versions.length, 2);
  assert.equal('versions' in loaded[0].versions[1].snapshot, false);
  assert.deepEqual(loaded[0].versions[0].snapshot.sections?.[0].chords, ['Cm7']);
  assert.deepEqual(loaded[0].sections?.[0].melody, ['C4', 'Eb4']);
  assert.equal(loaded[0].sections?.[0].energy, 3);
  storageSet(EDITOR_REQUEST_KEY, { target: 'melody', projectId: edited.id, snapshot: edited });
  assert.equal(readEditorRequest('architect'), null);
  assert.equal(readEditorRequest('melody')?.projectId, edited.id);
});

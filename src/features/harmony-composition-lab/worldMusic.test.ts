import assert from 'node:assert/strict';
import test from 'node:test';
import { WORLD_MUSIC_ENTRIES } from './worldMusic';

test('world music entries cover the requested traditions and core examples', () => {
  const ids = new Set(WORLD_MUSIC_ENTRIES.map(entry => entry.id));
  for (const id of ['maqam-hijaz', 'maqam-rast', 'maqam-bayati', 'maqam-nahawand', 'maqam-kurd', 'raga-bhairav', 'raga-kafi', 'japan-hirajoshi', 'japan-in-sen', 'ethiopia-tizita', 'ethiopia-bati', 'ethiopia-ambassel', 'ethiopia-anchihoye', 'armenia-utjayn']) {
    assert.ok(ids.has(id), `missing ${id}`);
  }
});

test('each entry has sources and cautions against flattening tradition to a scale label', () => {
  for (const entry of WORLD_MUSIC_ENTRIES) {
    assert.ok(entry.sources.length, `${entry.name} has no sources`);
    assert.ok(entry.sources.every(source => source.url.startsWith('https://')));
    assert.ok(entry.overview.length > 30);
    assert.ok(entry.tuning.length > 20);
  }
});

test('the explorer does not advertise a generic equal-tempered sketch as a traditional performance', () => {
  assert.ok(WORLD_MUSIC_ENTRIES.every(entry => !('etSketch' in entry)));
});

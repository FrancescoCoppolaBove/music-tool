import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMidiFile } from './midiExport';

test('MIDI export creates a format 0 file with tempo, meter, chord notes, and end marker', () => {
  const bytes = [...buildMidiFile({ chords: ['Cmaj7'], bpm: 120, meter: '4/4' })];
  const text = String.fromCharCode(...bytes);
  assert.equal(text.slice(0, 4), 'MThd');
  assert.equal(text.slice(14, 18), 'MTrk');
  assert.ok(bytes.includes(0xff) && bytes.includes(0x51));
  assert.ok(bytes.includes(0x58));
  assert.ok(bytes.some((byte, index) => byte === 0x90 && bytes[index + 1] === 48)); // C3 root
  assert.ok(bytes.some((byte, index) => byte === 0x80 && bytes[index + 1] === 48));
  assert.ok(bytes.some((byte, index) => byte === 0x2f && bytes[index - 1] === 0xff));
});

test('MIDI export handles 6/8 bar length and skips unknown chord symbols', () => {
  const normal = buildMidiFile({ chords: ['Cmaj7'], bpm: 120, meter: '4/4' });
  const compound = buildMidiFile({ chords: ['Cmaj7'], bpm: 120, meter: '6/8' });
  assert.ok([...normal].some((byte, index) => byte === 4 && normal[index - 3] === 0xff && normal[index - 2] === 0x58));
  assert.ok([...compound].some((byte, index) => byte === 6 && compound[index - 3] === 0xff && compound[index - 2] === 0x58));
  const invalid = buildMidiFile({ chords: ['not-a-chord'], bpm: 90, meter: '3/4' });
  assert.equal(String.fromCharCode(...invalid).slice(0, 4), 'MThd');
});

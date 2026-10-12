import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMusicXml } from './musicXmlExport';

test('MusicXML export preserves title, chord pitches, tempo, and time signature', () => {
  const xml = buildMusicXml({ title: 'Idea & Theme', chords: ['Cmaj7', 'F7'], bpm: 102, meter: '4/4' });
  assert.match(xml, /<work-title>Idea &amp; Theme<\/work-title>/);
  assert.match(xml, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(xml, /<per-minute>102<\/per-minute>/);
  assert.match(xml, /<step>C<\/step><octave>3<\/octave>/);
  assert.match(xml, /<chord\/><pitch>/);
});

test('MusicXML export writes compound meter and full-bar rests for invalid chords', () => {
  const xml = buildMusicXml({ title: 'Test', chords: ['invalid'], bpm: 80, meter: '6/8' });
  assert.match(xml, /<beats>6<\/beats><beat-type>8<\/beat-type>/);
  assert.match(xml, /<rest measure="yes"\/><duration>6<\/duration>/);
});

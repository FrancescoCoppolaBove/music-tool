import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBarTimeline, buildScore, normalizeEvents, normalizeScoreKey, validateSettings, type ScoreSettings } from '../score/scoreModel';
import { buildChartXml } from '../score/scoreXml';

const settings = (): ScoreSettings => ({ offset: 1, grid: 'eighth', mode: 'rhythm', key: 'C major', anchors: [],
  sections: [{ id: 'a', name: 'A', bars: 10, meter: '4/4', bpm: 120 }, { id: 'b', name: 'B', bars: 2, meter: '7/8', bpm: 120 }] });
const note = (midi: number, startSec: number, durationSec: number) => ({ id: `${midi}-${startSec}`, midi, startSec, durationSec, cents: 0, velocity: 0.8 });

test('ten 4/4 bars followed by 7/8 use quarter BPM and remain contiguous', () => {
  const bars = buildBarTimeline(settings());
  assert.equal(bars.length, 12);
  assert.equal(bars[9].endSec, 21);
  assert.equal(bars[10].startSec, 21);
  assert.equal(bars[10].endSec, 22.75);
  assert.equal(bars[10].ticks, 42);
  assert.equal(bars[10].section, 'B');
});

test('manual anchors interpolate expressive timing while retaining meter and later tempo', () => {
  const s = settings(); s.anchors = [{ bar: 5, seconds: 11 }, { bar: 11, seconds: 26 }];
  const bars = buildBarTimeline(s);
  assert.equal(bars[0].endSec, 3.5);
  assert.equal(bars[4].startSec, 11);
  assert.equal(bars[10].startSec, 26);
  assert.equal(bars[10].endSec, 27.75);
  assert.equal(bars[9].endSec, bars[10].startSec);
});

test('bad bar anchors, tempos and excessive structures are rejected', () => {
  const s = settings(); s.anchors = [{ bar: 2, seconds: 0.5 }];
  assert.throws(() => validateSettings(s), /increasing/);
  s.anchors = [{ bar: 2, seconds: 3 }, { bar: 2, seconds: 4 }];
  assert.throws(() => validateSettings(s), /distinct/);
  s.anchors = []; s.sections[0].bpm = 0;
  assert.throws(() => validateSettings(s), /BPM/);
  s.sections[0].bpm = 120; s.sections[0].bars = 513;
  assert.throws(() => validateSettings(s), /512/);
});

test('silence becomes rests and manual chord edits do not mutate detected pitches', () => {
  const s = settings();
  const notes = [note(60, 1, 0.5), note(64, 1.01, 0.48), note(67, 1.02, 0.48)];
  const original = structuredClone(notes);
  const chords = [{ id: 'c1', noteIds: notes.map(n => n.id), symbol: 'C', voicing: '', startSec: 1, durationSec: 0.5 }];
  const bars = buildScore(notes, chords, s);
  assert.equal(bars[0].events[0].symbol, 'C');
  assert.equal(bars[0].events[0].duration, 12);
  assert.ok(bars[1].events.every(e => e.rest));
  const edited = buildScore(notes, chords, s, { 1: [{ tick: 0, duration: 48, symbol: 'Db7', rest: false }] });
  assert.equal(edited[0].events[0].symbol, 'Db7');
  assert.deepEqual(notes, original);
});

test('mixed-meter bars have complete durations including silent gaps', () => {
  const bars = buildScore([note(60, 21.25, 0.4)], [], settings());
  for (const bar of bars) assert.equal(bar.events.reduce((sum, e) => sum + e.duration, 0), bar.ticks);
  assert.equal(bars[10].events[0].rest, true);
  assert.equal(bars[10].events[1].tick, 6);
});

test('sustained gestures split at barlines with ties', () => {
  const bars = buildScore([note(60, 2.5, 1)], [], settings());
  assert.ok(bars[0].events.some(e => e.tieOut));
  assert.ok(bars[1].events[0].tieIn);
});

test('bar editing fills gaps and rejects overlapping or out-of-bar events', () => {
  assert.equal(normalizeEvents([{ tick: 12, duration: 12, symbol: 'G7', rest: false }], 48).length, 3);
  assert.throws(() => normalizeEvents([{ tick: 40, duration: 12, symbol: '', rest: false }], 48), /fit/);
  assert.throws(() => normalizeEvents([{ tick: 0, duration: 24, symbol: '', rest: false }, { tick: 12, duration: 12, symbol: '', rest: false }], 48), /overlap/);
});

test('MusicXML exports exact measure lengths, changes, chords, bass and escaped text', () => {
  const s = settings(); s.key = 'C minor'; s.sections[1].bpm = 100; s.sections[1].name = 'B & solo';
  const bars = buildScore([], [], s, { 1: [{ tick: 0, duration: 48, symbol: 'F#m7b5/C#', rest: false }], 11: [{ tick: 0, duration: 42, symbol: 'Bb7alt', rest: false }] });
  const xml = buildChartXml(bars, '<My score>', s.key);
  assert.ok(xml.includes('&lt;My score&gt;'));
  assert.ok(xml.includes('B &amp; solo'));
  assert.ok(xml.includes('<fifths>-3</fifths>'));
  assert.ok(xml.includes('<beats>7</beats><beat-type>8</beat-type>'));
  assert.ok(xml.includes('<bass-step>C</bass-step><bass-alter>1</bass-alter>'));
  assert.ok(xml.includes('<kind text="7alt" use-symbols="no">other</kind>'));
  const measures = [...xml.matchAll(/<measure number="\d+">(.*?)<\/measure>/g)];
  measures.forEach((m, index) => assert.equal([...m[1].matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, d) => sum + Number(d[1]), 0), bars[index].ticks));
});

test('triplet rhythm exports time modification without altering the audio source', () => {
  const s = settings(); s.grid = 'triplet';
  const bars = buildScore([note(60, 1, 1 / 6), note(62, 1 + 1 / 6, 1 / 6), note(64, 1 + 1 / 3, 1 / 6)], [], s);
  assert.equal(bars[0].events[0].duration, 4);
  assert.ok(buildChartXml(bars, 'Triplets', 'C major').includes('<actual-notes>3</actual-notes>'));
});

test('enharmonic key normalization keeps valid signatures and display preserves custom chords', () => {
  assert.equal(normalizeScoreKey('Db minor'), 'C# minor');
  const s = settings();
  const bars = buildScore([], [], s, { 1: [{ tick: 0, duration: 48, symbol: 'Db7alt', rest: false }] });
  const exchange = buildChartXml(bars, 'Chart', normalizeScoreKey('Db minor'));
  assert.ok(exchange.includes('<fifths>4</fifths>'));
  assert.ok(exchange.includes('<kind text="7alt"'));
  const display = buildChartXml(bars, 'Chart', 'C minor', true);
  assert.ok(display.includes('>Db7alt</words>'));
  assert.ok(!display.includes('<harmony>'));
  assert.ok(display.includes('<step>B</step><alter>-1</alter>'));
});

test('exported page boundaries do not leave orphaned cross-bar ties', () => {
  const bars = buildScore([note(60, 2.5, 1)], [], settings());
  assert.ok(buildChartXml(bars, 'Ties', 'C major').includes('<tie type="start"/>'));
  const page = buildChartXml([bars[0]], 'Page', 'C major');
  assert.ok(!page.includes('<tie type="start"/>'));
  const next = buildChartXml([bars[1]], 'Next page', 'C major');
  assert.ok(!next.includes('<tie type="stop"/>'));
});

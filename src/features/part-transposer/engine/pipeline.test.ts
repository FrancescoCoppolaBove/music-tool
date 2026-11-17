import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPart } from './musicXmlIO';
import { displayXml, transposeParts, type PartRequest } from './pipeline';
import { pitchNames, testCodec } from './testXml';
import { all, child, childText } from './xmlDom';
import { partInstrument as inst } from './partInstruments';
import { TRUMPET } from './fixtures';
import { parseTextScore } from './textScore';
import { textToMusicXml } from './textToMusicXml';

const request = (overrides: Partial<PartRequest>): PartRequest => ({
  sourceXml: extractPart(testCodec, TRUMPET, 'P1'),
  source: inst('trumpet'),
  originalKey: { tonic: 'Eb', minor: false },
  newTonic: 'Eb',
  direction: 'up',
  targets: [inst('keyboard')],
  ...overrides,
});

test('trumpet part → alto sax and bass in the same concert key, MuseScore data kept', () => {
  const outputs = transposeParts(testCodec, request({ targets: [inst('altosax'), inst('bass')] }));

  const alto = testCodec.parse(outputs[0].xml);
  assert.deepEqual(pitchNames(alto), ['D5', 'E5', 'F5', 'G5']);
  assert.equal(childText(all(alto, 'key')[0], 'fifths'), '0');
  assert.equal(childText(all(alto, 'transpose')[0], 'chromatic'), '-9');
  assert.equal(childText(child(all(alto, 'harmony')[0], 'root')!, 'root-step'), 'C');
  assert.equal(all(alto, 'dynamics').length, 1);
  assert.equal(all(alto, 'lyric').length, 1);
  assert.equal(all(alto, 'score-instrument').length + all(alto, 'instrument').length, 0);
  assert.equal(childText(all(alto, 'score-part')[0], 'part-name'), 'Alto Sax in E♭');
  for (const tag of ['part-name-display', 'part-abbreviation', 'part-abbreviation-display', 'midi-device']) assert.equal(all(alto, tag).length, 0, tag);

  const bass = testCodec.parse(outputs[1].xml);
  assert.deepEqual(pitchNames(bass), ['F5', 'G5', 'Ab5', 'Bb5']);
  assert.equal(outputs[1].above, 4);
});

test('key change Eb → G', () => {
  // Trumpet G4 sounds F4; F4 + major 3rd = A4
  const [keyboard] = transposeParts(testCodec, request({ newTonic: 'G' }));
  assert.equal(pitchNames(testCodec.parse(keyboard.xml))[0], 'A4');
});

test('display XML replaces harmony with words and colours out-of-range notes', () => {
  const [bass] = transposeParts(testCodec, request({ targets: [inst('bass')] }));
  const doc = testCodec.parse(displayXml(testCodec, bass));
  assert.equal(all(doc, 'harmony').length, 0);
  assert.equal(all(doc, 'note').filter(n => n.getAttribute('color')).length, 4);
});

test('source without <key> gets one in the right place', () => {
  const noKey = request({}).sourceXml.replace(/<key>.*?<\/key>/, '');
  assert.ok(!noKey.includes('<key>'));
  const [alto] = transposeParts(testCodec, request({ sourceXml: noKey, targets: [inst('altosax')] }));
  const attrs = all(testCodec.parse(alto.xml), 'attributes')[0];
  const tags = Array.from({ length: attrs.childNodes.length }, (_, i) => (attrs.childNodes[i] as Element).tagName).filter(Boolean);
  assert.deepEqual(tags.slice(0, 3), ['divisions', 'key', 'time']);
});

test('tied notes are counted once in the range report', () => {
  const textXml = (src: string) => textToMusicXml(parseTextScore(src).score!);
  const run = (src: string) => transposeParts(testCodec, request({
    sourceXml: textXml(src), source: inst('keyboard'), originalKey: { tonic: 'C', minor: false }, newTonic: 'C', targets: [inst('trumpet')],
  }))[0].above;
  assert.equal(run('key: C\n| C7:h C7:h |'), 2);
  assert.equal(run('key: C\n| C7:h~ C7:h |'), 1);
});

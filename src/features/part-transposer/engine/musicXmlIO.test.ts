import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strToU8, zipSync } from 'fflate';
import { combineParts, decodeMusicXmlFile, detectInstrument, extractPart, listParts, readSourceInfo } from './musicXmlIO';
import { testCodec } from './testXml';
import { all, childText } from './xmlDom';
import { SLASH_CHORD_MINOR, TRUMPET } from './fixtures';

test('lists parts and reads key + source instrument from <transpose>', () => {
  assert.deepEqual(listParts(testCodec.parse(TRUMPET)), [{ id: 'P1', name: 'Trumpet in B♭' }, { id: 'P2', name: 'Piano' }]);
  const info = readSourceInfo(testCodec.parse(extractPart(testCodec, TRUMPET, 'P1')));
  assert.deepEqual(info, { key: { tonic: 'F', minor: false }, instrumentId: 'trumpet', semitones: -2 });
});

test('rejects timewise and non-MusicXML documents', () => {
  assert.throws(() => listParts(testCodec.parse('<score-timewise/>')), /timewise/);
  assert.throws(() => listParts(testCodec.parse('<html/>')), /MusicXML/);
});

test('extractPart keeps only the chosen part', () => {
  const doc = testCodec.parse(extractPart(testCodec, TRUMPET, 'P1'));
  assert.equal(all(doc, 'part').length, 1);
  assert.equal(all(doc, 'score-part').length, 1);
});

test('detects the source instrument by transposition, clef and name', () => {
  assert.equal(detectInstrument(0, 'G', 'piano'), 'keyboard');
  assert.equal(detectInstrument(-14, 'G', ''), 'tenorsax');
  assert.equal(detectInstrument(-9, 'G', ''), 'altosax');
  assert.equal(detectInstrument(-12, 'F', ''), 'bass');
  assert.equal(detectInstrument(-12, 'G', ''), 'guitar');
  assert.equal(detectInstrument(-2, 'G', 'soprano sax'), 'sopsax');
  assert.equal(detectInstrument(-2, 'G', 'trumpet in b♭'), 'trumpet');
  assert.equal(detectInstrument(-7, 'G', 'horn in f'), null);
});

test('decodes .mxl through META-INF/container.xml, and plain files', () => {
  const zip = zipSync({
    'META-INF/container.xml': strToU8('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>'),
    'score.xml': strToU8(TRUMPET),
  });
  assert.equal(decodeMusicXmlFile('song.mxl', zip), TRUMPET);
  assert.equal(decodeMusicXmlFile('song.musicxml', strToU8(TRUMPET)), TRUMPET);
  assert.throws(() => decodeMusicXmlFile('song.mxl', strToU8('not a zip')), /danneggiato/);
});

test('combineParts builds one multi-part score with unique ids', () => {
  const one = extractPart(testCodec, TRUMPET, 'P1');
  const two = extractPart(testCodec, TRUMPET, 'P2');
  const doc = testCodec.parse(combineParts(testCodec, [one, two]));
  assert.deepEqual(all(doc, 'score-part').map(p => p.getAttribute('id')), ['P1', 'P2']);
  assert.deepEqual(all(doc, 'part').map(p => p.getAttribute('id')), ['P1', 'P2']);
  assert.deepEqual(all(doc, 'score-part').map(p => childText(p, 'part-name')), ['Trumpet in B♭', 'Piano']);
});

test('listParts skips drum and TAB parts', () => {
  const drums = `<score-partwise><part-list><score-part id="P1"><part-name>A</part-name></score-part><score-part id="P2"><part-name>Drums</part-name></score-part><score-part id="P3"><part-name>Tab</part-name></score-part></part-list>
<part id="P1"><measure number="1"><attributes><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure></part>
<part id="P2"><measure number="1"><attributes><clef><sign>percussion</sign></clef></attributes><note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched><duration>4</duration></note></measure></part>
<part id="P3"><measure number="1"><attributes><clef><sign>TAB</sign><line>5</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
  assert.deepEqual(listParts(testCodec.parse(drums)).map(p => p.id), ['P1']);
});

test('zip bytes are detected regardless of extension; single-quoted full-path', () => {
  const zip = zipSync({
    'META-INF/container.xml': strToU8("<container><rootfiles><rootfile full-path='score.xml'/></rootfiles></container>"),
    'score.xml': strToU8(TRUMPET),
  });
  assert.equal(decodeMusicXmlFile('song.xml', zip), TRUMPET);
});

test('.mxl without container.xml falls back to the first xml; empty zip errors', () => {
  assert.equal(decodeMusicXmlFile('a.mxl', zipSync({ 'x.xml': strToU8(TRUMPET) })), TRUMPET);
  assert.throws(() => decodeMusicXmlFile('a.mxl', zipSync({ 'readme.txt': strToU8('hi') })), /Nessuna partitura/);
});

test('combineParts rejects an empty list', () => {
  assert.throws(() => combineParts(testCodec, []), /Nessuna parte/);
});

test('readSourceInfo reads a minor key', () => {
  const info = readSourceInfo(testCodec.parse(SLASH_CHORD_MINOR));
  assert.deepEqual(info.key, { tonic: 'C', minor: true });
});

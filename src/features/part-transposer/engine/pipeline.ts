import type { TransposingInstrument } from '../../../shared/utils/transposingInstruments';
import { keyChangeInterval, keyFifths, partInterval, writtenKey, type Direction, type KeySpec } from './intervals';
import { toDisplayXml, transposePart } from './transposeXml';
import { all, childText, insertBeforeFirst, type XmlCodec } from './xmlDom';

export interface PartRequest {
  /** Single-part MusicXML, written for `source`. */
  sourceXml: string;
  source: TransposingInstrument;
  /** Concert key of the source. */
  originalKey: KeySpec;
  /** New concert tonic; the mode stays the same. */
  newTonic: string;
  direction: Direction;
  targets: TransposingInstrument[];
}

export interface PartOutput { instrument: TransposingInstrument; xml: string; above: number; below: number }

// What may follow <key> in MusicXML <attributes>.
const AFTER_KEY = ['time', 'staves', 'part-symbol', 'instruments', 'clef', 'staff-details', 'transpose', 'for-part', 'directive', 'measure-style'];

function addKey(doc: Document, fifths: number): void {
  const attributes = all(doc, 'attributes')[0];
  if (!attributes) return;
  const key = doc.createElement('key');
  const f = doc.createElement('fifths');
  f.textContent = String(fifths);
  key.appendChild(f);
  insertBeforeFirst(attributes, key, AFTER_KEY);
}

/** One transposed MusicXML per target instrument. */
export function transposeParts(codec: XmlCodec, req: PartRequest): PartOutput[] {
  const keyChange = keyChangeInterval(req.originalKey.tonic, req.newTonic, req.direction);
  // Respell against the key signature the source notes are actually spelled in.
  const sourceKey = all(codec.parse(req.sourceXml), 'key')[0];
  const sourceFifths = sourceKey
    ? Number(childText(sourceKey, 'fifths') ?? 0)
    : keyFifths(writtenKey(req.originalKey, req.source));
  return req.targets.map(target => {
    const doc = codec.parse(req.sourceXml);
    if (!sourceKey) addKey(doc, sourceFifths);
    const interval = partInterval({ source: req.source, target, keyChange, sourceFifths });
    const { above, below } = transposePart(doc, { interval, target });
    return { instrument: target, xml: codec.serialize(doc), above, below };
  });
}

/** Preview rendition of an output (chord words, range colours). */
export function displayXml(codec: XmlCodec, output: PartOutput): string {
  const doc = codec.parse(output.xml);
  toDisplayXml(doc, output.instrument.range);
  return codec.serialize(doc);
}

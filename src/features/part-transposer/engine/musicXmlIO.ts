import { unzipSync } from 'fflate';
import { Note } from 'tonal';
import { fifthsTonic, type KeySpec } from './intervals';
import { PART_INSTRUMENTS } from './partInstruments';
import { all, childElements, childText, type XmlCodec } from './xmlDom';

export interface PartInfo { id: string; name: string }
export interface SourceInfo { key: KeySpec | null; instrumentId: string | null; semitones: number }

function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  return new TextDecoder().decode(bytes);
}

/** Text of an uploaded .musicxml/.xml, or of the root score inside a compressed .mxl. */
export function decodeMusicXmlFile(name: string, bytes: Uint8Array): string {
  if (!/\.mxl$/i.test(name)) return decodeText(bytes);
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error('File .mxl danneggiato');
  }
  const container = files['META-INF/container.xml'];
  const rootPath = container ? decodeText(container).match(/full-path="([^"]+)"/)?.[1] : undefined;
  const root = (rootPath && files[rootPath])
    || Object.entries(files).find(([path]) => !path.startsWith('META-INF/') && /\.(xml|musicxml)$/i.test(path))?.[1];
  if (!root) throw new Error('Nessuna partitura nel file .mxl');
  return decodeText(root);
}

/** Parts that contain notes or rests. */
export function listParts(doc: Document): PartInfo[] {
  const rootTag = doc.documentElement.tagName;
  if (rootTag === 'score-timewise') throw new Error('Formato "timewise" non supportato: esporta da MuseScore in MusicXML standard');
  if (rootTag !== 'score-partwise') throw new Error('Non è un file MusicXML');
  const scoreParts = all(doc, 'score-part');
  return all(doc, 'part')
    .filter(part => all(part, 'note').length > 0)
    .map(part => {
      const id = part.getAttribute('id') ?? '';
      const scorePart = scoreParts.find(s => s.getAttribute('id') === id);
      return { id, name: (scorePart && childText(scorePart, 'part-name')) || id };
    });
}

/** A copy of the score with only one part. */
export function extractPart(codec: XmlCodec, xml: string, partId: string): string {
  const doc = codec.parse(xml);
  for (const part of all(doc, 'part')) if (part.getAttribute('id') !== partId) part.parentNode!.removeChild(part);
  const partList = all(doc, 'part-list')[0];
  if (partList) for (const el of childElements(partList)) if (el.getAttribute('id') !== partId) partList.removeChild(el);
  return codec.serialize(doc);
}

const transposeSemitones = (t: { chromatic: number; octaveChange?: number } | undefined) =>
  t ? t.chromatic + 12 * (t.octaveChange ?? 0) : 0;

/** Which offered instrument a part's <transpose> (in semitones) belongs to; null if none. */
export function detectInstrument(semitones: number, clefSign: string | undefined, partName: string): string | null {
  const candidates = PART_INSTRUMENTS.filter(i => transposeSemitones(i.musicXmlTranspose) === semitones);
  if (candidates.length <= 1) return candidates[0]?.id ?? null;
  if (semitones === -12) return clefSign === 'F' ? 'bass' : 'guitar';
  if (semitones === -2) return /sax/i.test(partName) ? 'sopsax' : 'trumpet';
  return candidates[0].id;
}

/** Written key and probable instrument of a single-part score. */
export function readSourceInfo(doc: Document): SourceInfo {
  const key = all(doc, 'key')[0];
  const fifths = key ? childText(key, 'fifths') : null;
  const minor = key ? childText(key, 'mode') === 'minor' : false;
  const major = fifths !== null ? fifthsTonic(Number(fifths)) : null;
  const t = all(doc, 'transpose')[0];
  const semitones = t ? Number(childText(t, 'chromatic') ?? 0) + 12 * Number(childText(t, 'octave-change') ?? 0) : 0;
  const clefSign = all(doc, 'sign')[0]?.textContent?.trim();
  const partName = all(doc, 'part-name')[0]?.textContent ?? '';
  return {
    key: major ? { tonic: minor ? Note.transpose(major, '6M') : major, minor } : null,
    instrumentId: detectInstrument(semitones, clefSign, partName),
    semitones,
  };
}

/** One score with every single-part score as its own part (P1, P2, …), in order. */
export function combineParts(codec: XmlCodec, parts: string[]): string {
  const docs = parts.map(xml => codec.parse(xml));
  const [first] = docs;
  const partList = all(first, 'part-list')[0];
  docs.forEach((doc, i) => {
    const id = `P${i + 1}`;
    const scorePart = all(doc, 'score-part')[0];
    const part = all(doc, 'part')[0];
    scorePart.setAttribute('id', id);
    part.setAttribute('id', id);
    if (i === 0) return;
    partList.appendChild(first.importNode(scorePart, true));
    first.documentElement.appendChild(first.importNode(part, true));
  });
  return codec.serialize(first);
}

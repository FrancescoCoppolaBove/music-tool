import { Key, Note } from 'tonal';
import { KIND_SYMBOLS } from '../../../shared/utils/musicXmlHarmony';
import type { TransposingInstrument } from '../../../shared/utils/transposingInstruments';
import { recomputeAccidentals } from './accidentals';
import { fifthsTonic, respellForKey } from './intervals';
import { all, child, childElements, childText, insertBeforeFirst, removeChildren, setChildText } from './xmlDom';

export interface RangeReport { above: number; below: number }

// MusicXML <attributes> sequence: what may follow <clef> / <transpose>.
const AFTER_CLEF = ['staff-details', 'transpose', 'for-part', 'directive', 'measure-style'];
const AFTER_TRANSPOSE = ['for-part', 'directive', 'measure-style'];
const MIDDLE_LINE: Record<string, string> = { G: 'B4', F: 'D3' };
const OUT_OF_RANGE_COLOR = '#d97706';
// Would still tell MuseScore the part belongs to the source instrument.
const STALE_PART_LABELS = ['part-name-display', 'part-abbreviation', 'part-abbreviation-display'];
const STALE_INSTRUMENT_TAGS = ['score-instrument', 'midi-device', 'midi-instrument', 'instrument'];

const accidentalsOf = (alter: number) => alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
const readAlter = (parent: Element, tag: string) => Math.round(Number(childText(parent, tag) ?? 0));
const isSlash = (note: Element) => childText(note, 'notehead') === 'slash';
const isTiedOver = (note: Element) => childElements(note, 'tie').some(t => t.getAttribute('type') === 'stop');

function writeAlter(parent: Element, tag: string, alter: number, before: string[]): void {
  if (alter) setChildText(parent, tag, String(alter), before);
  else removeChildren(parent, tag);
}

function writePitch(pitch: Element, name: string): void {
  const n = Note.get(name);
  setChildText(pitch, 'step', n.letter);
  writeAlter(pitch, 'alter', n.alt, ['octave']);
  setChildText(pitch, 'octave', String(n.oct));
}

function pitchName(pitch: Element): string {
  return `${childText(pitch, 'step')}${accidentalsOf(readAlter(pitch, 'alter'))}${childText(pitch, 'octave')}`;
}

function transposeHarmonyPitch(parent: Element, stepTag: string, alterTag: string, interval: string): void {
  const n = Note.get(Note.transpose(`${childText(parent, stepTag)}${accidentalsOf(readAlter(parent, alterTag))}`, interval));
  setChildText(parent, stepTag, n.letter);
  writeAlter(parent, alterTag, n.alt, []);
}

/**
 * Transposes the (single) part of `doc` in place by `interval` and writes it
 * for `target`: pitches, chord symbols, key signatures, clefs, <transpose>,
 * part name and accidentals. Returns how many notes leave the written range.
 */
export function transposePart(doc: Document, opts: { interval: string; target: TransposingInstrument }): RangeReport {
  const { interval, target } = opts;
  const part = all(doc, 'part')[0];
  const low = target.range ? Note.midi(target.range.low)! : -Infinity;
  const high = target.range ? Note.midi(target.range.high)! : Infinity;
  const report: RangeReport = { above: 0, below: 0 };

  const firstKey = all(part, 'key').map(k => childText(k, 'fifths')).find(f => f !== null);
  let current = firstKey !== undefined && firstKey !== null ? respellForKey(interval, Number(firstKey)) : interval;

  const transposeNote = (note: Element) => {
    const pitch = child(note, 'pitch');
    if (!pitch) return;
    if (isSlash(note)) {
      if (target.clef) writePitch(pitch, MIDDLE_LINE[target.clef.sign]);
      return;
    }
    const name = Note.transpose(pitchName(pitch), current)!;
    writePitch(pitch, name);
    if (isTiedOver(note)) return;
    const midi = Note.midi(name)!;
    if (midi > high) report.above++;
    else if (midi < low) report.below++;
  };

  // Document order, so each key region is respelled for its own key signature.
  for (const measure of all(part, 'measure')) {
    for (const el of childElements(measure)) {
      if (el.tagName === 'note') transposeNote(el);
      else if (el.tagName === 'harmony') {
        for (const root of childElements(el, 'root')) transposeHarmonyPitch(root, 'root-step', 'root-alter', current);
        for (const bass of childElements(el, 'bass')) transposeHarmonyPitch(bass, 'bass-step', 'bass-alter', current);
        removeChildren(el, 'frame');
      } else if (el.tagName === 'attributes') {
        for (const key of childElements(el, 'key')) {
          const fifths = childText(key, 'fifths');
          if (fifths === null) continue;
          current = respellForKey(interval, Number(fifths));
          setChildText(key, 'fifths', String(Key.majorKey(Note.transpose(fifthsTonic(Number(fifths)), current)!).alteration));
        }
      }
    }
  }
  for (const technical of all(part, 'technical')) {
    removeChildren(technical, 'string');
    removeChildren(technical, 'fret');
  }

  const firstAttributes = all(part, 'attributes')[0];
  if (target.clef) {
    const clefs = all(part, 'clef');
    if (!clefs.length && firstAttributes) {
      const clef = doc.createElement('clef');
      insertBeforeFirst(firstAttributes, clef, AFTER_CLEF);
      clefs.push(clef);
    }
    for (const clef of clefs) {
      for (const c of childElements(clef)) clef.removeChild(c);
      setChildText(clef, 'sign', target.clef.sign);
      setChildText(clef, 'line', String(target.clef.line));
    }
  }

  for (const t of all(part, 'transpose')) t.parentNode!.removeChild(t);
  if (target.musicXmlTranspose && firstAttributes) {
    const { diatonic, chromatic, octaveChange } = target.musicXmlTranspose;
    const t = doc.createElement('transpose');
    setChildText(t, 'diatonic', String(diatonic));
    setChildText(t, 'chromatic', String(chromatic));
    if (octaveChange) setChildText(t, 'octave-change', String(octaveChange));
    insertBeforeFirst(firstAttributes, t, AFTER_TRANSPOSE);
  }

  for (const tag of STALE_INSTRUMENT_TAGS) for (const el of all(doc, tag)) el.parentNode!.removeChild(el);
  for (const scorePart of all(doc, 'score-part')) {
    for (const tag of STALE_PART_LABELS) removeChildren(scorePart, tag);
    setChildText(scorePart, 'part-name', target.name);
  }

  recomputeAccidentals(part);
  return report;
}

function harmonyLabel(harmony: Element): string {
  const kind = child(harmony, 'kind');
  const kindValue = (kind?.textContent ?? '').trim();
  if (kindValue === 'none') return 'N.C.';
  const root = child(harmony, 'root');
  const bass = child(harmony, 'bass');
  const quality = kind?.hasAttribute('text') ? kind.getAttribute('text')! : KIND_SYMBOLS[kindValue] ?? '';
  const rootName = root ? `${childText(root, 'root-step')}${accidentalsOf(readAlter(root, 'root-alter'))}` : '';
  const bassName = bass ? `/${childText(bass, 'bass-step')}${accidentalsOf(readAlter(bass, 'bass-alter'))}` : '';
  return `${rootName}${quality}${bassName}`;
}

/**
 * Preview-only changes: chord symbols as bold words (OSMD drops custom kind
 * text) and out-of-range notes coloured amber. Never used for exports.
 */
export function toDisplayXml(doc: Document, range?: { low: string; high: string }): void {
  for (const harmony of all(doc, 'harmony')) {
    const direction = doc.createElement('direction');
    direction.setAttribute('placement', 'above');
    const directionType = doc.createElement('direction-type');
    const words = doc.createElement('words');
    words.setAttribute('font-weight', 'bold');
    words.textContent = harmonyLabel(harmony);
    directionType.appendChild(words);
    direction.appendChild(directionType);
    harmony.parentNode!.replaceChild(direction, harmony);
  }
  if (!range) return;
  const low = Note.midi(range.low)!;
  const high = Note.midi(range.high)!;
  for (const note of all(doc, 'note')) {
    const pitch = child(note, 'pitch');
    if (!pitch || isSlash(note)) continue;
    const midi = Note.midi(pitchName(pitch))!;
    if (midi < low || midi > high) note.setAttribute('color', OUT_OF_RANGE_COLOR);
  }
}

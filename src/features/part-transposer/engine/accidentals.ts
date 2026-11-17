import { child, childElements, childText, insertBeforeFirst } from './xmlDom';

const SHARP_ORDER = 'FCGDAEB';
const ACCIDENTAL_NAMES: Record<number, string> = { [-2]: 'flat-flat', [-1]: 'flat', 0: 'natural', 1: 'sharp', 2: 'double-sharp' };
// Elements that follow <accidental> inside <note> (MusicXML sequence).
const AFTER_ACCIDENTAL = ['time-modification', 'stem', 'notehead', 'notehead-text', 'staff', 'beam', 'notations', 'lyric', 'play', 'listen'];

/** Alteration the key signature gives a step: +1, -1 or 0. */
export function keyAlter(step: string, fifths: number): number {
  const i = SHARP_ORDER.indexOf(step);
  if (fifths > 0) return i < fifths ? 1 : 0;
  if (fifths < 0) return 6 - i < -fifths ? -1 : 0;
  return 0;
}

/**
 * Rewrites every <accidental> of a part from its pitches: shown when the pitch
 * differs from the key signature or from an earlier note on the same staff
 * line in the bar, removed otherwise. Tied continuations and slash noteheads
 * never show one. (Voices on one staff share the bar's state, as in print.)
 */
export function recomputeAccidentals(part: Element): void {
  let fifths = 0;
  for (const measure of childElements(part, 'measure')) {
    const state = new Map<string, number>();
    for (const el of childElements(measure)) {
      if (el.tagName === 'attributes') {
        const key = child(el, 'key');
        const value = key ? childText(key, 'fifths') : null;
        if (value) fifths = Number(value);
        continue;
      }
      if (el.tagName !== 'note') continue;
      const pitch = child(el, 'pitch');
      if (!pitch) continue;
      const step = childText(pitch, 'step') ?? 'C';
      const alter = Math.round(Number(childText(pitch, 'alter') ?? 0));
      const line = `${childText(el, 'staff') ?? '1'}:${step}${childText(pitch, 'octave')}`;
      const tiedOver = childElements(el, 'tie').some(t => t.getAttribute('type') === 'stop');
      const slash = childText(el, 'notehead') === 'slash';
      const show = !tiedOver && !slash && alter !== (state.get(line) ?? keyAlter(step, fifths));
      if (!tiedOver && !slash) state.set(line, alter);

      const old = child(el, 'accidental');
      if (old) el.removeChild(old);
      if (show) {
        const accidental = el.ownerDocument!.createElement('accidental');
        accidental.textContent = ACCIDENTAL_NAMES[alter] ?? 'natural';
        insertBeforeFirst(el, accidental, AFTER_ACCIDENTAL);
      }
    }
  }
}

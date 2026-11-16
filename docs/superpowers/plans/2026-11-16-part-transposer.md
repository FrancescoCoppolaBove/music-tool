# Part Transposer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New Pro tool that changes the key of a part (text, MusicXML or photo input) and writes it for keyboard, bass, guitar, soprano/alto/tenor sax and B♭ trumpet, with on-screen preview and MusicXML export (single part or one multi-part file).

**Architecture:** MusicXML is the single internal format. Text and photo input share one plain-text syntax (`textScore.ts`) converted to MusicXML; uploaded MusicXML passes through untouched. A DOM-level transposer rewrites pitches, chord symbols, key signatures, clefs and `<transpose>` per target instrument. Engines take a `Document` / `XmlCodec`, so they run on the browser DOM and on `@xmldom/xmldom` under `node --test`.

**Tech Stack:** React 18 + TypeScript, `tonal` (intervals/keys/chords), `opensheetmusicdisplay` (preview, lazy), `fflate` (`.mxl` unzip), `@xmldom/xmldom` (tests only), Netlify Function + `@anthropic-ai/sdk` (photo).

**Spec:** `docs/superpowers/specs/2026-11-16-part-transposer-design.md`

**Ground rules for this repo**
- Files under `src/features/part-transposer/engine/` use **relative imports**: they run under `node --import tsx --test`.
- `@xmldom/xmldom` nodes have **no** `children`, `nextElementSibling` or `querySelector`. Use only the helpers in `engine/xmlDom.ts`.
- `npm run lint` allows zero new warnings and `react-hooks/exhaustive-deps` is an **error**; never add to `eslint-suppressions.json`.
- Test fixtures live in `engine/fixtures.ts`; never import one `*.test.ts` from another (its tests would run twice).
- Commit after each task on branch `feat/part-transposer`.

---

## File map

| File | Responsibility |
|---|---|
| `src/shared/utils/transposingInstruments.ts` (new) | Single instrument table: interval, clef, MusicXML `<transpose>`, range |
| `src/shared/utils/musicXmlHarmony.ts` (new) | Chord symbol ↔ MusicXML `<harmony>` (moved from audio-transcriber) |
| `src/features/transposing-instruments/TransposingInstrumentsFeature.tsx` (mod) | Uses the shared table |
| `src/features/audio-transcriber/score/scoreXml.ts` (mod) | Uses the shared harmony helpers |
| `src/features/part-transposer/engine/xmlDom.ts` | DOM helpers, `XmlCodec`, `browserCodec` |
| `src/features/part-transposer/engine/testXml.ts` | xmldom codec + pitch helper (tests only) |
| `src/features/part-transposer/engine/fixtures.ts` | Shared test fixtures (tests only) |
| `src/features/part-transposer/engine/partInstruments.ts` | The 7 instruments offered by the tool |
| `src/features/part-transposer/engine/textScore.ts` | Text syntax parser + bar-level errors |
| `src/features/part-transposer/engine/textToMusicXml.ts` | Parsed text → single-part MusicXML |
| `src/features/part-transposer/engine/intervals.ts` | Key change, concert/written keys, part interval + respelling |
| `src/features/part-transposer/engine/accidentals.ts` | Recompute `<accidental>` from pitches |
| `src/features/part-transposer/engine/transposeXml.ts` | Transpose one part for one instrument; preview variant |
| `src/features/part-transposer/engine/musicXmlIO.ts` | `.musicxml`/`.mxl` decode, parts, source info, combine |
| `src/features/part-transposer/engine/pipeline.ts` | Source + request → one output per instrument |
| `src/features/part-transposer/PartPreview.tsx` | OSMD preview (lazy) |
| `src/features/part-transposer/PartTransposerFeature.tsx` | 4-step UI |
| `netlify/lib/partScanPrompt.ts`, `netlify/functions/part-scan.ts` | Photo → text syntax |
| `tests/partScan.test.ts` | Endpoint guards + response cleaning |
| Registrations | `navigation.types.ts`, `featureRegistry.ts`, `App.tsx`, `plans.ts`, `src/api/server.ts`, `package.json` |

---

### Task 1: Dependencies and test scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
npm install fflate@0.8.2
npm install -D @xmldom/xmldom@0.9.8
```

- [ ] **Step 2: Scripts** — in `package.json` `scripts`, add after `"test:scales"`:

```json
"test:transposer": "node --import tsx --test src/features/part-transposer/engine/*.test.ts",
```

Append ` && npm run test:transposer` to the end of `"test"`. In `"test:guard"` add `tests/partScan.test.ts` after `tests/billing.test.ts`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(part-transposer): add fflate and xmldom, test script"
```

(`npm test` fails until Tasks 4 and 12 create the new test files; that is expected between tasks.)

---

### Task 2: Shared instrument table

**Files:**
- Create: `src/shared/utils/transposingInstruments.ts`
- Modify: `src/features/transposing-instruments/TransposingInstrumentsFeature.tsx` (lines 5–47: local `Instrument` interface, `INSTRUMENTS`, `GROUPS`)

- [ ] **Step 1: Create the shared table**

```ts
/**
 * Transposing instruments shared by Transposing Instruments (single notes) and
 * Part Transposer (whole parts). `toWritten` is the interval applied to a
 * CONCERT (sounding) pitch to obtain the WRITTEN pitch the player reads. A B♭
 * trumpet sounds a major 2nd lower than written, so written = concert + M2.
 */
export interface ClefSpec { sign: 'G' | 'F'; line: number }

export interface TransposingInstrument {
  id: string;
  name: string;
  pitch: string;        // "Bb", "Eb", "F", "A", "C"
  toWritten: string;    // Tonal interval: concert → written
  group: string;
  sounds: string;       // human description
  /** Clef of a written part. Omitted = keep the source clefs (keyboard). */
  clef?: ClefSpec;
  /** MusicXML <transpose> (written → sounding). Omitted for concert pitch. */
  musicXmlTranspose?: { diatonic: number; chromatic: number; octaveChange?: number };
  /** Practical written range, for out-of-range warnings. */
  range?: { low: string; high: string };
}

const TREBLE: ClefSpec = { sign: 'G', line: 2 };
const SAX_RANGE = { low: 'Bb3', high: 'F6' };

export const INSTRUMENTS: TransposingInstrument[] = [
  // Concert pitch (non-transposing)
  { id: 'keyboard', name: 'Keyboard', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  { id: 'flute',    name: 'Flute / Oboe', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  { id: 'cello',    name: 'Strings / Voice / Bassoon', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  // Octave instruments (written an octave above sounding)
  { id: 'bass',     name: 'Bass', pitch: 'C', toWritten: '8P', group: 'Octave (C)', sounds: 'Sounds an octave LOWER than written.',
    clef: { sign: 'F', line: 4 }, musicXmlTranspose: { diatonic: 0, chromatic: 0, octaveChange: -1 }, range: { low: 'E2', high: 'G4' } },
  { id: 'guitar',   name: 'Guitar', pitch: 'C', toWritten: '8P', group: 'Octave (C)', sounds: 'Sounds an octave LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: 0, chromatic: 0, octaveChange: -1 }, range: { low: 'E3', high: 'E6' } },
  // Bb instruments
  { id: 'trumpet',  name: 'Trumpet in B♭', pitch: 'Bb', toWritten: '2M', group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: -1, chromatic: -2 }, range: { low: 'F#3', high: 'C6' } },
  { id: 'clarinet', name: 'Clarinet in B♭', pitch: 'Bb', toWritten: '2M', group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.' },
  { id: 'sopsax',   name: 'Soprano Sax in B♭', pitch: 'Bb', toWritten: '2M', group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: -1, chromatic: -2 }, range: SAX_RANGE },
  { id: 'tenorsax', name: 'Tenor Sax in B♭', pitch: 'Bb', toWritten: '9M', group: 'B♭ instruments', sounds: 'Sounds a major 9th LOWER (octave + tone).',
    clef: TREBLE, musicXmlTranspose: { diatonic: -1, chromatic: -2, octaveChange: -1 }, range: SAX_RANGE },
  // Eb instruments
  { id: 'altosax',  name: 'Alto Sax in E♭', pitch: 'Eb', toWritten: '6M', group: 'E♭ instruments', sounds: 'Sounds a major 6th LOWER than written.',
    clef: TREBLE, musicXmlTranspose: { diatonic: -5, chromatic: -9 }, range: SAX_RANGE },
  { id: 'barisax',  name: 'Baritone Sax in E♭', pitch: 'Eb', toWritten: '13M', group: 'E♭ instruments', sounds: 'Sounds an octave + major 6th LOWER.' },
  { id: 'ebclar',   name: 'Clarinet in E♭', pitch: 'Eb', toWritten: '-3m', group: 'E♭ instruments', sounds: 'Sounds a minor 3rd HIGHER than written.' },
  // F instruments
  { id: 'horn',     name: 'French Horn in F', pitch: 'F', toWritten: '5P', group: 'F instruments', sounds: 'Sounds a perfect 5th LOWER than written.' },
  { id: 'enghorn',  name: 'English Horn in F', pitch: 'F', toWritten: '5P', group: 'F instruments', sounds: 'Sounds a perfect 5th LOWER than written.' },
  // A instrument
  { id: 'aclar',    name: 'Clarinet in A', pitch: 'A', toWritten: '3m', group: 'A instruments', sounds: 'Sounds a minor 3rd LOWER than written.' },
];
```

- [ ] **Step 2: Use it in the existing tool** — in `TransposingInstrumentsFeature.tsx`, delete the `// ── Instrument data` comment block, the local `interface Instrument` and the local `INSTRUMENTS` array. Add to the imports:

```ts
import { INSTRUMENTS } from '../../shared/utils/transposingInstruments';
```

Replace `GROUPS` with:

```ts
const GROUPS = ['Concert (C)', 'Octave (C)', 'B♭ instruments', 'E♭ instruments', 'F instruments', 'A instruments'];
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/utils/transposingInstruments.ts src/features/transposing-instruments/TransposingInstrumentsFeature.tsx
git commit -m "refactor(transpose): share the transposing instrument table"
```

---

### Task 3: Shared MusicXML harmony helpers

**Files:**
- Create: `src/shared/utils/musicXmlHarmony.ts`
- Modify: `src/features/audio-transcriber/score/scoreXml.ts` (lines 1–15: import, `escapeXml`, `KINDS`, `harmony`)

- [ ] **Step 1: Create the shared module** (content moved from `scoreXml.ts`)

```ts
/** Chord symbol ↔ MusicXML <harmony>, shared by the Audio Transcriber score and Part Transposer. */
export const escapeXml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

export const CHORD_KINDS: Record<string, string> = { '': 'major', M: 'major', m: 'minor', min: 'minor', '7': 'dominant', maj7: 'major-seventh', M7: 'major-seventh', m7: 'minor-seventh', '6': 'major-sixth', m6: 'minor-sixth', dim: 'diminished', dim7: 'diminished-seventh', m7b5: 'half-diminished', aug: 'augmented', sus4: 'suspended-fourth', sus2: 'suspended-second', '9': 'dominant-ninth', maj9: 'major-ninth', m9: 'minor-ninth', '13': 'dominant-13th' };

/** MusicXML kind → its first (preferred) symbol suffix in CHORD_KINDS. */
export const KIND_SYMBOLS: Record<string, string> = Object.entries(CHORD_KINDS).reduce<Record<string, string>>(
  (acc, [symbol, kind]) => (kind in acc ? acc : { ...acc, [kind]: symbol }), {},
);

export const CHORD_SYMBOL_RE = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/;

const alterXml = (tag: string, accidental: string) => accidental ? `<${tag}>${accidental === '#' ? 1 : -1}</${tag}>` : '';

/** Bold chord label as a text direction (OSMD drops custom kind text). */
export function chordWordsXml(symbol: string): string {
  return `<direction placement="above"><direction-type><words font-weight="bold">${escapeXml(symbol)}</words></direction-type></direction>`;
}

/** Exchange-file <harmony> for a chord symbol; custom qualities keep their text with kind "other". */
export function harmonyXml(symbol: string): string {
  const parsed = symbol.match(CHORD_SYMBOL_RE);
  if (!parsed) return `<direction placement="above"><direction-type><words>${escapeXml(symbol)}</words></direction-type></direction>`;
  const [, root, accidental, quality, bass, bassAccidental] = parsed;
  return `<harmony><root><root-step>${root}</root-step>${alterXml('root-alter', accidental)}</root><kind text="${escapeXml(quality)}" use-symbols="no">${CHORD_KINDS[quality] ?? 'other'}</kind>${bass ? `<bass><bass-step>${bass}</bass-step>${alterXml('bass-alter', bassAccidental)}</bass>` : ''}</harmony>`;
}
```

- [ ] **Step 2: Use it in the transcriber** — replace lines 1–15 of `scoreXml.ts` with:

```ts
import { CHORD_KINDS, CHORD_SYMBOL_RE, chordWordsXml, escapeXml, harmonyXml } from '../../../shared/utils/musicXmlHarmony';
import { DIVISIONS, KEY_SIGNATURES, type ScoreBar, type ScoreEvent } from './scoreModel';

export { escapeXml };

function harmony(symbol: string, display: boolean): string {
  const parsed = symbol.match(CHORD_SYMBOL_RE);
  // OSMD drops custom kind text. Keep the semantic harmony in the exchange
  // file, and use its exact written label in our display/print rendition.
  if (parsed && display && CHORD_KINDS[parsed[3]] === undefined) return chordWordsXml(symbol);
  return harmonyXml(symbol);
}
```

- [ ] **Step 3: Verify the transcriber output is unchanged**

Run: `npm run test:transcriber && npx tsc --noEmit -p tsconfig.app.json`
Expected: all transcriber tests PASS, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/utils/musicXmlHarmony.ts src/features/audio-transcriber/score/scoreXml.ts
git commit -m "refactor(transcriber): move MusicXML harmony helpers to shared"
```

---

### Task 4: DOM helpers, codecs, fixtures, instrument list

**Files:**
- Create: `src/features/part-transposer/engine/xmlDom.ts`
- Create: `src/features/part-transposer/engine/testXml.ts`
- Create: `src/features/part-transposer/engine/fixtures.ts`
- Create: `src/features/part-transposer/engine/partInstruments.ts`
- Test: `src/features/part-transposer/engine/xmlDom.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { all, child, childElements, childText, insertBeforeFirst, removeChildren, setChildText } from './xmlDom';
import { testCodec } from './testXml';
import { PART_INSTRUMENTS, partInstrument } from './partInstruments';

test('helpers read and write direct children only', () => {
  const doc = testCodec.parse('<note><pitch><step>C</step><octave>4</octave></pitch><type>quarter</type><notations/></note>');
  const note = doc.documentElement;
  assert.deepEqual(childElements(note).map(e => e.tagName), ['pitch', 'type', 'notations']);
  assert.equal(childText(note, 'step'), null);
  const pitch = child(note, 'pitch')!;
  setChildText(pitch, 'alter', '-1', ['octave']);
  assert.deepEqual(childElements(pitch).map(e => e.tagName), ['step', 'alter', 'octave']);
  insertBeforeFirst(note, doc.createElement('accidental'), ['notations']);
  assert.deepEqual(childElements(note).map(e => e.tagName), ['pitch', 'type', 'accidental', 'notations']);
  removeChildren(pitch, 'alter');
  assert.equal(all(doc, 'alter').length, 0);
});

test('codec rejects invalid XML and serializes with a declaration', () => {
  assert.throws(() => testCodec.parse('<a><b></a>'), /Invalid XML/);
  assert.match(testCodec.serialize(testCodec.parse('<a/>')), /^<\?xml/);
});

test('the tool offers the seven requested instruments', () => {
  assert.deepEqual(PART_INSTRUMENTS.map(i => i.id), ['keyboard', 'bass', 'guitar', 'tenorsax', 'altosax', 'sopsax', 'trumpet']);
  assert.throws(() => partInstrument('horn'));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./xmlDom`.

- [ ] **Step 3: Implement `xmlDom.ts`**

```ts
/**
 * Minimal DOM helpers that work on both the browser DOM and @xmldom/xmldom
 * (tests), which lacks `children`, `nextElementSibling` and `querySelector`.
 */
const ELEMENT_NODE = 1;

export interface XmlCodec {
  parse(xml: string): Document;
  serialize(doc: Document): string;
}

export function childElements(parent: Node, tag?: string): Element[] {
  const out: Element[] = [];
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === ELEMENT_NODE && (!tag || (n as Element).tagName === tag)) out.push(n as Element);
  }
  return out;
}

export function child(parent: Node, tag: string): Element | null {
  return childElements(parent, tag)[0] ?? null;
}

export function childText(parent: Node, tag: string): string | null {
  const el = child(parent, tag);
  return el ? (el.textContent ?? '').trim() : null;
}

/** All descendants with a tag name, as a static array (safe to mutate while iterating). */
export function all(root: Document | Element, tag: string): Element[] {
  return Array.from(root.getElementsByTagName(tag));
}

/** Inserts `el` before the first child whose tag is in `before`, or appends it. */
export function insertBeforeFirst(parent: Element, el: Element, before: string[]): void {
  parent.insertBefore(el, childElements(parent).find(c => before.includes(c.tagName)) ?? null);
}

/** Sets a child's text, creating it (before the first `before` sibling) when missing. */
export function setChildText(parent: Element, tag: string, value: string, before: string[] = []): Element {
  let el = child(parent, tag);
  if (!el) {
    el = parent.ownerDocument!.createElement(tag);
    insertBeforeFirst(parent, el, before);
  }
  el.textContent = value;
  return el;
}

export function removeChildren(parent: Element, tag: string): void {
  for (const el of childElements(parent, tag)) parent.removeChild(el);
}

export function withDeclaration(xml: string): string {
  return xml.startsWith('<?xml') ? xml : `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

export const browserCodec: XmlCodec = {
  parse(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML');
    return doc;
  },
  serialize: doc => withDeclaration(new XMLSerializer().serializeToString(doc)),
};
```

- [ ] **Step 4: Implement `testXml.ts`** (imported by tests only)

```ts
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { all, child, childText, withDeclaration, type XmlCodec } from './xmlDom';

export const testCodec: XmlCodec = {
  parse(xml) {
    try {
      return new DOMParser({ onError: () => {} }).parseFromString(xml, 'application/xml') as unknown as Document;
    } catch {
      throw new Error('Invalid XML');
    }
  },
  serialize: doc => withDeclaration(new XMLSerializer().serializeToString(doc as never)),
};

/** Written pitch names of every pitched, non-slash note, e.g. ['Bb4', 'G4']. */
export function pitchNames(doc: Document): string[] {
  return all(doc, 'note')
    .filter(n => child(n, 'pitch') && childText(n, 'notehead') !== 'slash')
    .map(n => {
      const p = child(n, 'pitch')!;
      const alter = Number(childText(p, 'alter') ?? 0);
      return `${childText(p, 'step')}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${childText(p, 'octave')}`;
    });
}
```

- [ ] **Step 5: Implement `fixtures.ts`** (imported by tests only; `TRUMPET` mirrors a MuseScore 4 export of a B♭ trumpet part)

```ts
export const EXAMPLE = `title: Esempio
key: Eb
time: 4/4
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [Fm7] [Bb7] | [Ebmaj7] Eb4:w |`;

export const TRUMPET = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>Blue Bossa</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Trumpet in B♭</part-name>
      <score-instrument id="P1-I1"><instrument-name>B♭ Trumpet</instrument-name></score-instrument>
      <midi-instrument id="P1-I1"><midi-program>57</midi-program></midi-instrument>
    </score-part>
    <score-part id="P2"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>-1</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef><transpose><diatonic>-1</diatonic><chromatic>-2</chromatic></transpose></attributes>
      <direction placement="below"><direction-type><dynamics><mf/></dynamics></direction-type></direction>
      <harmony><root><root-step>F</root-step></root><kind text="">major</kind></harmony>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type><lyric><text>la</text></lyric></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1"><attributes><divisions>1</divisions></attributes><note><rest measure="yes"/><duration>4</duration></note></measure>
  </part>
</score-partwise>`;

export const SLASH_CHORD_MINOR = `<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>X</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>-3</fifths><mode>minor</mode></key></attributes><harmony><root><root-step>C</root-step></root><kind text="m7">minor-seventh</kind><bass><bass-step>B</bass-step><bass-alter>-1</bass-alter></bass></harmony><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
```

- [ ] **Step 6: Implement `partInstruments.ts`**

```ts
import { INSTRUMENTS, type TransposingInstrument } from '../../../shared/utils/transposingInstruments';

/** Instruments offered by Part Transposer, in display order. */
const IDS = ['keyboard', 'bass', 'guitar', 'tenorsax', 'altosax', 'sopsax', 'trumpet'];

export const PART_INSTRUMENTS: TransposingInstrument[] = IDS.map(id => INSTRUMENTS.find(i => i.id === id)!);

export function partInstrument(id: string): TransposingInstrument {
  const found = PART_INSTRUMENTS.find(i => i.id === id);
  if (!found) throw new Error(`Unknown instrument: ${id}`);
  return found;
}
```

- [ ] **Step 7: Run tests**

Run: `npm run test:transposer`
Expected: 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/part-transposer/engine
git commit -m "feat(part-transposer): DOM helpers, XML codecs, fixtures, instrument list"
```

---

### Task 5: Text syntax parser

**Files:**
- Create: `src/features/part-transposer/engine/textScore.ts`
- Test: `src/features/part-transposer/engine/textScore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventTicks, parseTextScore } from './textScore';
import { EXAMPLE } from './fixtures';

test('parses headers, notes, rests, chords and chord-only bars', () => {
  const { score, errors } = parseTextScore(EXAMPLE);
  assert.deepEqual(errors, []);
  assert.ok(score);
  assert.equal(score.title, 'Esempio');
  assert.deepEqual(score.key, { tonic: 'Eb', minor: false });
  assert.deepEqual(score.time, { beats: 4, beatType: 4 });
  assert.equal(score.bars.length, 4);
  assert.equal(score.bars[0].events[0].pitch, 'Bb4');
  assert.equal(score.bars[0].events[0].chord, 'Ebmaj7');
  assert.equal(score.bars[1].events[0].dotted, true);
  assert.equal(score.bars[1].events[1].rest, true);
  assert.deepEqual(score.bars[2].chords, ['Fm7', 'Bb7']);
  assert.equal(score.bars[2].events.length, 0);
});

test('minor keys, bass clef, 6/8 and missing key', () => {
  const { score } = parseTextScore('key: F#m\ntime: 6/8\nclef: bass\n| F#3:q. C#3:q. |');
  assert.deepEqual(score?.key, { tonic: 'F#', minor: true });
  assert.equal(score?.clef, 'bass');
  assert.equal(parseTextScore('| C4:w |').score?.key, null);
});

test('triplets and ties, across bars and lines', () => {
  const { score, errors } = parseTextScore('| (3 C5:8 D5:8 E5:8) F5:q G5:h~ |\n| G5:q r:q r:h |');
  assert.deepEqual(errors, []);
  const [a, b] = score!.bars;
  assert.equal(a.events.filter(e => e.triplet).length, 3);
  assert.equal(eventTicks(a.events[0]), 8);
  assert.equal(a.events[4].tieStart, true);
  assert.equal(b.events[0].tieStop, true);
});

test('reports bar-level errors and returns no score', () => {
  const { score, errors } = parseTextScore('key: Eb\n| C4:q | C4:w D4:q | [Xyz] C4:w | Q9 | C4:w~ | D4:w | [C] [F] [G] |');
  assert.equal(score, null);
  const messages = errors.map(e => e.message);
  const has = (predicate: (m: string) => boolean) => assert.ok(messages.some(predicate), messages.join('\n'));
  has(m => m.startsWith('Battuta 1: durata 1/4 invece di 4/4'));
  has(m => m.startsWith('Battuta 2: durata 5/4 invece di 4/4'));
  has(m => m.includes('sigla non riconosciuta «Xyz»'));
  has(m => m.includes('simbolo non riconosciuto «Q9»'));
  has(m => m.startsWith('Battuta 6: la legatura'));
  has(m => m.startsWith('Battuta 7: 3 sigle non dividono'));
});

test('header errors use bar 0', () => {
  const { errors } = parseTextScore('key: H\ntime: 5/3\n| C4:w |');
  assert.deepEqual(errors.map(e => e.bar), [0, 0]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./textScore`.

- [ ] **Step 3: Implement `textScore.ts`**

```ts
import { Chord, Note } from 'tonal';

/**
 * Plain-text part syntax, used for manual input and as the photo reader's output:
 *   key: Eb / time: 4/4 / clef: treble / title: …
 *   | [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Fm7] [Bb7] |
 * Pitches are absolute (not relative to the key signature).
 */
export type DurationCode = 'w' | 'h' | 'q' | '8' | '16';

export interface ScoreEvent {
  rest: boolean;
  pitch: string;        // 'Eb4'; '' for rests
  dur: DurationCode;
  dotted: boolean;
  triplet: boolean;
  tieStart: boolean;
  tieStop: boolean;
  chord?: string;
}

/** A bar holds events, or only chord symbols (rendered as slash beats). */
export interface TextBar { events: ScoreEvent[]; chords: string[] }

export interface KeySpec { tonic: string; minor: boolean }

export interface TextScore {
  title: string;
  key: KeySpec | null;
  time: { beats: number; beatType: number };
  clef: 'treble' | 'bass';
  bars: TextBar[];
}

export interface ParseError { bar: number; message: string }

/** Ticks per quarter note: integer for dotted 16ths (9) and 16th triplets (4). */
export const DIVISIONS = 24;
const BASE_TICKS: Record<DurationCode, number> = { w: 96, h: 48, q: 24, '8': 12, '16': 6 };

export function eventTicks(e: Pick<ScoreEvent, 'dur' | 'dotted' | 'triplet'>): number {
  let ticks = BASE_TICKS[e.dur];
  if (e.dotted) ticks = ticks * 3 / 2;
  if (e.triplet) ticks = ticks * 2 / 3;
  return ticks;
}

export function barTicks(time: TextScore['time']): number {
  return time.beats * 96 / time.beatType;
}

const NOTE_RE = /^([A-G](?:##|#|bb|b)?)(\d):(w|h|q|8|16)(\.?)(~?)$/;
const REST_RE = /^r:(w|h|q|8|16)(\.?)$/;
const TOKEN_RE = /\[[^\]]*\]|\(3|\)|[^\s[\]()]+/g;
const TONIC_RE = /^([A-G](?:#|b)?)(m?)$/;
const HEADER_RE = /^(key|time|clef|title)\s*:\s*(.*)$/i;

function formatBeats(ticks: number, beatType: number): string {
  const beats = ticks / (96 / beatType);
  return Number.isInteger(beats) ? String(beats) : String(Number(beats.toFixed(2)));
}

/** Applies header lines to `score` and returns the remaining body lines. */
function parseHeaders(lines: string[], score: TextScore, errors: ParseError[]): string[] {
  const body: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const header = line.match(HEADER_RE);
    if (!header) {
      if (line) body.push(line);
      continue;
    }
    const value = header[2].trim();
    switch (header[1].toLowerCase()) {
      case 'title':
        score.title = value;
        break;
      case 'key': {
        const m = value.match(TONIC_RE);
        if (m) score.key = { tonic: m[1], minor: m[2] === 'm' };
        else errors.push({ bar: 0, message: `Tonalità non valida: «${value}» (es. Eb, Cm, F#m)` });
        break;
      }
      case 'time': {
        const m = value.match(/^(\d{1,2})\/(2|4|8|16)$/);
        if (m && Number(m[1]) > 0) score.time = { beats: Number(m[1]), beatType: Number(m[2]) };
        else errors.push({ bar: 0, message: `Tempo non valido: «${value}» (es. 4/4, 3/4, 6/8)` });
        break;
      }
      case 'clef': {
        const v = value.toLowerCase();
        if (v === 'treble' || v === 'bass') score.clef = v;
        else errors.push({ bar: 0, message: `Chiave non valida: «${value}» (treble o bass)` });
        break;
      }
    }
  }
  return body;
}

export function parseTextScore(source: string): { score: TextScore | null; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const score: TextScore = { title: '', key: null, time: { beats: 4, beatType: 4 }, clef: 'treble', bars: [] };
  const body = parseHeaders(source.split('\n'), score, errors);

  const segments = body.join(' ').split('|').map(s => s.trim()).filter(Boolean);
  if (!segments.length) errors.push({ bar: 0, message: 'Nessuna battuta: scrivi le battute tra | … |' });

  let openTie: number | null = null; // MIDI of a note waiting for its tied continuation
  segments.forEach((segment, i) => {
    const barNo = i + 1;
    const fail = (message: string) => errors.push({ bar: barNo, message: `Battuta ${barNo}: ${message}` });
    const bar: TextBar = { events: [], chords: [] };
    let pending: string[] = [];
    let tripletCount = -1; // -1 = outside a triplet group

    for (const token of segment.match(TOKEN_RE) ?? []) {
      if (token.startsWith('[')) {
        const symbol = token.slice(1, -1).trim();
        if (Chord.get(symbol).empty) fail(`sigla non riconosciuta «${symbol}»`);
        else pending.push(symbol);
        continue;
      }
      if (token === '(3') {
        if (tripletCount >= 0) fail('terzina annidata');
        tripletCount = 0;
        continue;
      }
      if (token === ')') {
        if (tripletCount !== 3) fail('una terzina deve contenere 3 valori');
        tripletCount = -1;
        continue;
      }
      const note = token.match(NOTE_RE);
      const rest = token.match(REST_RE);
      if (!note && !rest) {
        fail(`simbolo non riconosciuto «${token}»`);
        continue;
      }
      const triplet = tripletCount >= 0;
      const event: ScoreEvent = note
        ? { rest: false, pitch: `${note[1]}${note[2]}`, dur: note[3] as DurationCode, dotted: note[4] === '.', triplet, tieStart: note[5] === '~', tieStop: false }
        : { rest: true, pitch: '', dur: rest![1] as DurationCode, dotted: rest![2] === '.', triplet, tieStart: false, tieStop: false };
      if (triplet) tripletCount++;
      if (openTie !== null) {
        if (event.rest || Note.midi(event.pitch) !== openTie) fail('la legatura ~ deve collegare due note uguali');
        else event.tieStop = true;
        openTie = null;
      }
      if (event.tieStart) openTie = Note.midi(event.pitch);
      if (pending.length > 1) fail('più sigle sulla stessa nota');
      if (pending.length) event.chord = pending[0];
      pending = [];
      bar.events.push(event);
    }

    if (tripletCount >= 0) fail('terzina non chiusa: manca «)»');
    if (!bar.events.length) bar.chords = pending;
    else if (pending.length) fail('sigla senza nota dopo: mettila prima della nota');

    if (bar.events.length) {
      const total = bar.events.reduce((sum, e) => sum + eventTicks(e), 0);
      if (total !== barTicks(score.time)) {
        fail(`durata ${formatBeats(total, score.time.beatType)}/${score.time.beatType} invece di ${score.time.beats}/${score.time.beatType}`);
      }
    } else if (bar.chords.length) {
      if (score.time.beats % bar.chords.length) {
        fail(`${bar.chords.length} sigle non dividono una battuta da ${score.time.beats}/${score.time.beatType}: aggiungi le note`);
      }
    } else {
      fail('battuta vuota');
    }
    score.bars.push(bar);
  });
  if (openTie !== null) errors.push({ bar: segments.length, message: `Battuta ${segments.length}: legatura ~ senza nota successiva` });

  return { score: errors.length ? null : score, errors };
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/part-transposer/engine/textScore.ts src/features/part-transposer/engine/textScore.test.ts
git commit -m "feat(part-transposer): text part syntax parser with bar-level errors"
```

---

### Task 6: Text → MusicXML

**Files:**
- Create: `src/features/part-transposer/engine/intervals.ts` (only `keyFifths` for now; completed in Task 7)
- Create: `src/features/part-transposer/engine/textToMusicXml.ts`
- Test: `src/features/part-transposer/engine/textToMusicXml.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTextScore } from './textScore';
import { textToMusicXml } from './textToMusicXml';
import { testCodec } from './testXml';
import { all, child, childText } from './xmlDom';
import { EXAMPLE } from './fixtures';

const build = (src: string) => testCodec.parse(textToMusicXml(parseTextScore(src).score!));

test('builds a single-part MusicXML with key, time, harmony and notes', () => {
  const doc = build(EXAMPLE);
  assert.equal(all(doc, 'part').length, 1);
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '-3');
  assert.equal(childText(all(doc, 'attributes')[0], 'divisions'), '24');
  assert.equal(all(doc, 'measure').length, 4);
  const first = all(doc, 'note')[0];
  assert.equal(childText(child(first, 'pitch')!, 'step'), 'B');
  assert.equal(childText(child(first, 'pitch')!, 'alter'), '-1');
  assert.equal(childText(first, 'duration'), '24');
  const roots = all(doc, 'root').map(r => `${childText(r, 'root-step')}${childText(r, 'root-alter') ?? ''}`);
  assert.deepEqual(roots, ['E-1', 'C', 'F', 'B-1', 'E-1']);
  assert.equal(childText(all(doc, 'work')[0], 'work-title'), 'Esempio');
});

test('chord-only bars become slash beats split between the chords', () => {
  const notes = all(build('key: C\n| [F7] [Bb7] |'), 'note');
  assert.equal(notes.length, 4);
  assert.ok(notes.every(n => childText(n, 'notehead') === 'slash'));
});

test('triplets, ties, rests, minor key and bass clef', () => {
  const doc = build('key: Am\nclef: bass\n| (3 C3:8 D3:8 E3:8) F3:q G3:h~ | G3:q r:q r:h |');
  assert.equal(childText(all(doc, 'key')[0], 'mode'), 'minor');
  assert.equal(childText(all(doc, 'clef')[0], 'sign'), 'F');
  assert.deepEqual(all(doc, 'tuplet').map(t => t.getAttribute('type')), ['start', 'stop']);
  assert.equal(all(doc, 'time-modification').length, 3);
  assert.deepEqual(all(doc, 'tie').map(t => t.getAttribute('type')), ['start', 'stop']);
  assert.equal(all(doc, 'rest').length, 2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./textToMusicXml`.

- [ ] **Step 3: Create `intervals.ts` (first part)**

```ts
import { Key } from 'tonal';
import type { KeySpec } from './textScore';

export type { KeySpec };

/** Key signature (MusicXML fifths) of a major or minor key. */
export function keyFifths(key: KeySpec): number {
  return (key.minor ? Key.minorKey(key.tonic) : Key.majorKey(key.tonic)).alteration;
}
```

- [ ] **Step 4: Implement `textToMusicXml.ts`**

```ts
import { Note } from 'tonal';
import { escapeXml, harmonyXml } from '../../../shared/utils/musicXmlHarmony';
import { keyFifths } from './intervals';
import { DIVISIONS, barTicks, eventTicks, type ScoreEvent, type TextScore } from './textScore';

const NOTE_TYPES: Record<string, string> = { w: 'whole', h: 'half', q: 'quarter', '8': 'eighth', '16': '16th' };
const BEAT_TYPES: Record<number, string> = { 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th' };

function pitchXml(name: string): string {
  const n = Note.get(name);
  return `<pitch><step>${n.letter}</step>${n.alt ? `<alter>${n.alt}</alter>` : ''}<octave>${n.oct}</octave></pitch>`;
}

function noteXml(e: ScoreEvent, tuplet: 'start' | 'stop' | null): string {
  const ties = `${e.tieStop ? '<tie type="stop"/>' : ''}${e.tieStart ? '<tie type="start"/>' : ''}`;
  const tied = `${e.tieStop ? '<tied type="stop"/>' : ''}${e.tieStart ? '<tied type="start"/>' : ''}`;
  const notations = tied || tuplet ? `<notations>${tied}${tuplet ? `<tuplet type="${tuplet}"/>` : ''}</notations>` : '';
  const triplet = e.triplet ? '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>' : '';
  return `<note>${e.rest ? '<rest/>' : pitchXml(e.pitch)}<duration>${eventTicks(e)}</duration>${ties}<voice>1</voice><type>${NOTE_TYPES[e.dur]}</type>${e.dotted ? '<dot/>' : ''}${triplet}${notations}</note>`;
}

/** Single-part MusicXML for a parsed text score. Chord-only bars are written as slash beats. */
export function textToMusicXml(score: TextScore): string {
  const key = score.key ? `<key><fifths>${keyFifths(score.key)}</fifths><mode>${score.key.minor ? 'minor' : 'major'}</mode></key>` : '';
  const clef = score.clef === 'bass' ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
  const beatTicks = 96 / score.time.beatType;
  // Placeholder pitch on the middle line: slash noteheads only show the beat.
  const slash = `<note>${pitchXml(score.clef === 'bass' ? 'D3' : 'B4')}<duration>${beatTicks}</duration><voice>1</voice><type>${BEAT_TYPES[score.time.beatType]}</type><stem>none</stem><notehead>slash</notehead></note>`;

  const measures = score.bars.map((bar, i) => {
    const attributes = i === 0
      ? `<attributes><divisions>${DIVISIONS}</divisions>${key}<time><beats>${score.time.beats}</beats><beat-type>${score.time.beatType}</beat-type></time>${clef}</attributes>`
      : '';
    let content = '';
    if (bar.events.length) {
      let tripletRun = 0;
      for (const e of bar.events) {
        let tuplet: 'start' | 'stop' | null = null;
        if (e.triplet) {
          const position = tripletRun % 3;
          tuplet = position === 0 ? 'start' : position === 2 ? 'stop' : null;
          tripletRun++;
        } else {
          tripletRun = 0;
        }
        content += (e.chord ? harmonyXml(e.chord) : '') + noteXml(e, tuplet);
      }
    } else {
      const beatsPerChord = barTicks(score.time) / bar.chords.length / beatTicks;
      for (const symbol of bar.chords) content += harmonyXml(symbol) + slash.repeat(beatsPerChord);
    }
    return `<measure number="${i + 1}">${attributes}${content}</measure>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${escapeXml(score.title || 'Untitled')}</work-title></work><part-list><score-part id="P1"><part-name>Part</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
```

- [ ] **Step 5: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/part-transposer/engine
git commit -m "feat(part-transposer): convert text parts to MusicXML"
```

---

### Task 7: Intervals, keys and respelling

**Files:**
- Modify: `src/features/part-transposer/engine/intervals.ts`
- Test: `src/features/part-transposer/engine/intervals.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { concertKey, keyChangeInterval, keyFifths, nearestDirection, partInterval, writtenKey } from './intervals';
import { partInstrument as inst } from './partInstruments';

test('key change follows the chosen direction', () => {
  assert.equal(keyChangeInterval('Eb', 'G', 'up'), '3M');
  assert.equal(keyChangeInterval('Eb', 'G', 'down'), '-6m');
  assert.equal(keyChangeInterval('G', 'G', 'down'), '1P');
});

test('nearest direction: below a tritone goes up, a tritone or more goes down', () => {
  assert.equal(nearestDirection('Eb', 'G'), 'up');
  assert.equal(nearestDirection('C', 'F'), 'up');
  assert.equal(nearestDirection('C', 'F#'), 'down');
  assert.equal(nearestDirection('C', 'A'), 'down');
});

test('part interval = undo source, change key, apply target', () => {
  assert.equal(partInterval({ source: inst('keyboard'), target: inst('tenorsax'), keyChange: '3M', sourceFifths: -3 }), '11A');
  assert.equal(partInterval({ source: inst('trumpet'), target: inst('altosax'), keyChange: '1P', sourceFifths: -1 }), '5P');
  assert.equal(partInterval({ source: inst('keyboard'), target: inst('bass'), keyChange: '-6m', sourceFifths: -3 }), '3M');
});

test('written keys beyond 6 accidentals are respelled', () => {
  // Concert B → tenor: Db (5 flats), not C# (7 sharps)
  assert.equal(partInterval({ source: inst('keyboard'), target: inst('tenorsax'), keyChange: '1P', sourceFifths: 5 }), '10d');
  // Db + minor 2nd → D, not Ebb
  const fake = { ...inst('keyboard'), toWritten: '2m' };
  assert.equal(partInterval({ source: inst('keyboard'), target: fake, keyChange: '1P', sourceFifths: -5 }), '1A');
});

test('concert ↔ written keys and key signatures', () => {
  assert.deepEqual(concertKey({ tonic: 'F', minor: false }, inst('trumpet')), { tonic: 'Eb', minor: false });
  assert.deepEqual(writtenKey({ tonic: 'G', minor: true }, inst('tenorsax')), { tonic: 'A', minor: true });
  assert.equal(keyFifths({ tonic: 'C', minor: true }), -3);
  assert.equal(keyFifths({ tonic: 'D', minor: false }), 2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — `keyChangeInterval` is not exported.

- [ ] **Step 3: Replace `intervals.ts` with the full module**

```ts
import { Interval, Key, Note } from 'tonal';
import type { TransposingInstrument } from '../../../shared/utils/transposingInstruments';
import type { KeySpec } from './textScore';

export type { KeySpec };
export type Direction = 'up' | 'down';

/** Key signature (MusicXML fifths) of a major or minor key. */
export function keyFifths(key: KeySpec): number {
  return (key.minor ? Key.minorKey(key.tonic) : Key.majorKey(key.tonic)).alteration;
}

/** Major tonic of a key signature, e.g. -3 → Eb. */
export function fifthsTonic(fifths: number): string {
  return Note.transposeFifths('C', fifths);
}

const ascending = (from: string, to: string) => Interval.distance(Note.pitchClass(from), Note.pitchClass(to));
const semitonesMod12 = (ivl: string) => (((Interval.semitones(ivl) ?? 0) % 12) + 12) % 12;

/** Concert key-change interval between two tonics, in the given direction. */
export function keyChangeInterval(fromTonic: string, toTonic: string, direction: Direction): string {
  const up = ascending(fromTonic, toTonic);
  if (semitonesMod12(up) === 0) return '1P';
  return direction === 'up' ? up : Interval.subtract(up, '8P');
}

/** Direction with the smaller jump; a tritone goes down. */
export function nearestDirection(fromTonic: string, toTonic: string): Direction {
  return semitonesMod12(ascending(fromTonic, toTonic)) < 6 ? 'up' : 'down';
}

/** Concert key of a part written for `instrument`. */
export function concertKey(written: KeySpec, instrument: TransposingInstrument): KeySpec {
  return { tonic: Note.transpose(written.tonic, Interval.subtract('1P', instrument.toWritten)), minor: written.minor };
}

/** Written key of a concert key for `instrument`. */
export function writtenKey(concert: KeySpec, instrument: TransposingInstrument): KeySpec {
  return { tonic: Note.transpose(concert.tonic, instrument.toWritten), minor: concert.minor };
}

/**
 * Interval from the source written pitch to the target written pitch: undo
 * the source instrument, change key, apply the target instrument. When the
 * target's written key would need more than 6 accidentals, the interval is
 * respelled enharmonically (± diminished 2nd = same pitch, 12 fifths apart).
 */
export function partInterval(opts: {
  source: TransposingInstrument;
  target: TransposingInstrument;
  keyChange: string;
  sourceFifths: number;
}): string {
  let ivl = Interval.add(Interval.subtract(opts.keyChange, opts.source.toWritten), opts.target.toWritten);
  const fifths = Key.majorKey(Note.transpose(fifthsTonic(opts.sourceFifths), ivl)).alteration;
  if (fifths > 6) ivl = Interval.add(ivl, 'd2');
  else if (fifths < -6) ivl = Interval.subtract(ivl, 'd2');
  return ivl;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/part-transposer/engine/intervals.ts src/features/part-transposer/engine/intervals.test.ts
git commit -m "feat(part-transposer): key change and per-instrument intervals with respelling"
```

---

### Task 8: Accidentals

**Files:**
- Create: `src/features/part-transposer/engine/accidentals.ts`
- Test: `src/features/part-transposer/engine/accidentals.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAlter, recomputeAccidentals } from './accidentals';
import { testCodec } from './testXml';
import { all, childText } from './xmlDom';

/** A quarter note on octave 4; `extra` goes after <duration>, `tail` before </note>. */
const note = (step: string, alter: number, extra = '', tail = '') =>
  `<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>4</octave></pitch><duration>1</duration>${extra}<type>quarter</type>${tail}</note>`;
const part = (fifths: number, ...measures: string[][]) => testCodec.parse(
  `<part id="P1">${measures.map((notes, i) => `<measure number="${i + 1}">${i === 0 ? `<attributes><key><fifths>${fifths}</fifths></key></attributes>` : ''}${notes.join('')}</measure>`).join('')}</part>`,
);
const accidentals = (doc: Document) => all(doc, 'note').map(n => childText(n, 'accidental'));

test('key signature alterations', () => {
  assert.equal(keyAlter('F', 1), 1);
  assert.equal(keyAlter('C', 1), 0);
  assert.equal(keyAlter('B', -1), -1);
  assert.equal(keyAlter('A', -3), -1);
  assert.equal(keyAlter('D', -3), 0);
});

test('shown against the key and earlier notes in the bar, reset each bar', () => {
  const doc = part(1, [note('F', 1), note('F', 0), note('F', 0), note('C', 1)], [note('F', 0)]);
  recomputeAccidentals(doc.documentElement);
  assert.deepEqual(accidentals(doc), [null, 'natural', null, 'sharp', 'natural']);
});

test('stale accidentals are removed; tied continuations and slashes never show one', () => {
  const doc = part(0,
    [note('C', 0, '', '<accidental>sharp</accidental>'), note('F', 1, '<tie type="start"/>')],
    [note('F', 1, '<tie type="stop"/>'), note('B', -1, '', '<notehead>slash</notehead>')],
  );
  recomputeAccidentals(doc.documentElement);
  assert.deepEqual(accidentals(doc), [null, 'sharp', null, null]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./accidentals`.

- [ ] **Step 3: Implement `accidentals.ts`**

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/part-transposer/engine/accidentals.ts src/features/part-transposer/engine/accidentals.test.ts
git commit -m "feat(part-transposer): recompute accidentals from pitches"
```

---

### Task 9: Transpose a part for one instrument + preview variant

**Files:**
- Create: `src/features/part-transposer/engine/transposeXml.ts`
- Test: `src/features/part-transposer/engine/transposeXml.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTextScore } from './textScore';
import { textToMusicXml } from './textToMusicXml';
import { pitchNames, testCodec } from './testXml';
import { toDisplayXml, transposePart } from './transposeXml';
import { all, child, childText } from './xmlDom';
import { partInstrument as inst } from './partInstruments';
import { EXAMPLE, SLASH_CHORD_MINOR } from './fixtures';

const xmlFor = (src: string) => testCodec.parse(textToMusicXml(parseTextScore(src).score!));
const roots = (doc: Document) => all(doc, 'root').map(r => `${childText(r, 'root-step')}${childText(r, 'root-alter') ?? ''}`);

test('Eb → G for keyboard: notes, chords and key signature', () => {
  const doc = xmlFor(EXAMPLE);
  transposePart(doc, { interval: '3M', target: inst('keyboard') });
  assert.deepEqual(pitchNames(doc), ['D5', 'B4', 'A4', 'G4', 'E5', 'G4']);
  assert.deepEqual(roots(doc), ['G', 'E', 'A', 'D', 'G']);
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '1');
  assert.equal(all(doc, 'transpose').length, 0);
  assert.equal(childText(all(doc, 'score-part')[0], 'part-name'), 'Keyboard');
});

test('tenor sax: written pitch, key, <transpose>', () => {
  const doc = xmlFor(EXAMPLE);
  transposePart(doc, { interval: '11A', target: inst('tenorsax') });
  assert.equal(pitchNames(doc)[0], 'E6');
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '3');
  const t = all(doc, 'transpose')[0];
  assert.deepEqual([childText(t, 'diatonic'), childText(t, 'chromatic'), childText(t, 'octave-change')], ['-1', '-2', '-1']);
  assert.equal(childText(all(doc, 'clef')[0], 'sign'), 'G');
});

test('bass: F clef, slash noteheads re-centred, out-of-range count', () => {
  const doc = xmlFor(EXAMPLE);
  const result = transposePart(doc, { interval: '10M', target: inst('bass') });
  const clef = all(doc, 'clef')[0];
  assert.deepEqual([childText(clef, 'sign'), childText(clef, 'line')], ['F', '4']);
  const slash = all(doc, 'note').find(n => childText(n, 'notehead') === 'slash')!;
  assert.deepEqual([childText(child(slash, 'pitch')!, 'step'), childText(child(slash, 'pitch')!, 'octave')], ['D', '3']);
  assert.deepEqual(result, { above: 6, below: 0 });
});

test('slash chords and minor key signatures', () => {
  const doc = testCodec.parse(SLASH_CHORD_MINOR);
  transposePart(doc, { interval: '3M', target: inst('keyboard') });
  const h = all(doc, 'harmony')[0];
  assert.equal(childText(child(h, 'root')!, 'root-step'), 'E');
  assert.equal(childText(child(h, 'bass')!, 'bass-step'), 'D');
  assert.equal(child(child(h, 'bass')!, 'bass-alter'), null);
  assert.equal(childText(all(doc, 'key')[0], 'fifths'), '1');
  assert.equal(childText(all(doc, 'key')[0], 'mode'), 'minor');
});

test('accidentals follow the new key signature', () => {
  const doc = xmlFor('key: F\n| E4:q Eb4:q Eb4:q Bb4:q |');
  transposePart(doc, { interval: '2M', target: inst('keyboard') });
  assert.deepEqual(all(doc, 'note').map(n => childText(n, 'accidental')), [null, 'natural', null, null]);
});

test('preview variant: chord words and out-of-range colour', () => {
  const doc = xmlFor(EXAMPLE);
  transposePart(doc, { interval: '10M', target: inst('bass') });
  toDisplayXml(doc, inst('bass').range);
  assert.equal(all(doc, 'harmony').length, 0);
  assert.deepEqual(all(doc, 'words').map(w => w.textContent), ['Gmaj7', 'Em7', 'Am7', 'D7', 'Gmaj7']);
  assert.equal(all(doc, 'note').filter(n => n.getAttribute('color')).length, 6);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./transposeXml`.

- [ ] **Step 3: Implement `transposeXml.ts`**

```ts
import { Key, Note } from 'tonal';
import { KIND_SYMBOLS } from '../../../shared/utils/musicXmlHarmony';
import type { TransposingInstrument } from '../../../shared/utils/transposingInstruments';
import { recomputeAccidentals } from './accidentals';
import { fifthsTonic } from './intervals';
import { all, child, childElements, childText, insertBeforeFirst, removeChildren, setChildText } from './xmlDom';

export interface RangeReport { above: number; below: number }

// MusicXML <attributes> sequence: what may follow <clef> / <transpose>.
const AFTER_CLEF = ['staff-details', 'transpose', 'for-part', 'directive', 'measure-style'];
const AFTER_TRANSPOSE = ['for-part', 'directive', 'measure-style'];
const MIDDLE_LINE: Record<string, string> = { G: 'B4', F: 'D3' };
const OUT_OF_RANGE_COLOR = '#d97706';
// Would still tell MuseScore the part belongs to the source instrument.
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

  for (const note of all(part, 'note')) {
    const pitch = child(note, 'pitch');
    if (!pitch) continue;
    if (isSlash(note)) {
      if (target.clef) writePitch(pitch, MIDDLE_LINE[target.clef.sign]);
      continue;
    }
    const name = Note.transpose(pitchName(pitch), interval);
    writePitch(pitch, name);
    if (isTiedOver(note)) continue;
    const midi = Note.midi(name)!;
    if (midi > high) report.above++;
    else if (midi < low) report.below++;
  }

  for (const harmony of all(part, 'harmony')) {
    for (const root of childElements(harmony, 'root')) transposeHarmonyPitch(root, 'root-step', 'root-alter', interval);
    for (const bass of childElements(harmony, 'bass')) transposeHarmonyPitch(bass, 'bass-step', 'bass-alter', interval);
  }

  for (const key of all(part, 'key')) {
    const fifths = childText(key, 'fifths');
    if (fifths === null) continue;
    setChildText(key, 'fifths', String(Key.majorKey(Note.transpose(fifthsTonic(Number(fifths)), interval)).alteration));
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
  for (const scorePart of all(doc, 'score-part')) setChildText(scorePart, 'part-name', target.name);

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
```

- [ ] **Step 4: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/part-transposer/engine/transposeXml.ts src/features/part-transposer/engine/transposeXml.test.ts
git commit -m "feat(part-transposer): transpose a MusicXML part for an instrument"
```

---

### Task 10: MusicXML I/O

**Files:**
- Create: `src/features/part-transposer/engine/musicXmlIO.ts`
- Test: `src/features/part-transposer/engine/musicXmlIO.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strToU8, zipSync } from 'fflate';
import { combineParts, decodeMusicXmlFile, detectInstrument, extractPart, listParts, readSourceInfo } from './musicXmlIO';
import { testCodec } from './testXml';
import { all, childText } from './xmlDom';
import { TRUMPET } from './fixtures';

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./musicXmlIO`.

- [ ] **Step 3: Implement `musicXmlIO.ts`**

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/part-transposer/engine/musicXmlIO.ts src/features/part-transposer/engine/musicXmlIO.test.ts
git commit -m "feat(part-transposer): MusicXML/.mxl import, part extraction and multi-part export"
```

---

### Task 11: Pipeline

**Files:**
- Create: `src/features/part-transposer/engine/pipeline.ts`
- Test: `src/features/part-transposer/engine/pipeline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPart } from './musicXmlIO';
import { displayXml, transposeParts, type PartRequest } from './pipeline';
import { pitchNames, testCodec } from './testXml';
import { all, child, childText } from './xmlDom';
import { partInstrument as inst } from './partInstruments';
import { TRUMPET } from './fixtures';

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:transposer`
Expected: FAIL — cannot find module `./pipeline`.

- [ ] **Step 3: Implement `pipeline.ts`**

```ts
import type { TransposingInstrument } from '../../../shared/utils/transposingInstruments';
import { keyChangeInterval, keyFifths, partInterval, writtenKey, type Direction, type KeySpec } from './intervals';
import { toDisplayXml, transposePart } from './transposeXml';
import type { XmlCodec } from './xmlDom';

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

/** One transposed MusicXML per target instrument. */
export function transposeParts(codec: XmlCodec, req: PartRequest): PartOutput[] {
  const keyChange = keyChangeInterval(req.originalKey.tonic, req.newTonic, req.direction);
  const sourceFifths = keyFifths(writtenKey(req.originalKey, req.source));
  return req.targets.map(target => {
    const doc = codec.parse(req.sourceXml);
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
```

- [ ] **Step 4: Run tests**

Run: `npm run test:transposer`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/part-transposer/engine/pipeline.ts src/features/part-transposer/engine/pipeline.test.ts
git commit -m "feat(part-transposer): pipeline from source part to per-instrument outputs"
```

---

### Task 12: Photo endpoint

**Files:**
- Create: `netlify/lib/partScanPrompt.ts`
- Create: `netlify/functions/part-scan.ts`
- Modify: `src/api/server.ts` (imports, `FUNCTIONS` map)
- Test: `tests/partScan.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPartText } from '../netlify/lib/partScanPrompt';
import { handler } from '../netlify/functions/part-scan';

type Invoke = (event: unknown, context: unknown) => Promise<{ statusCode: number }>;
const call = (event: Record<string, unknown>) => (handler as unknown as Invoke)({ headers: {}, body: null, ...event }, {});

test('extractPartText strips code fences and whitespace', () => {
  assert.equal(extractPartText('```text\nkey: C\n| C4:w |\n```'), 'key: C\n| C4:w |');
  assert.equal(extractPartText('  key: C\n| C4:w |  '), 'key: C\n| C4:w |');
});

test('part-scan: preflight, method and origin guards', async () => {
  assert.equal((await call({ httpMethod: 'OPTIONS' })).statusCode, 204);
  assert.equal((await call({ httpMethod: 'GET' })).statusCode, 405);
  assert.equal((await call({ httpMethod: 'POST', headers: { origin: 'https://evil.example' }, body: '{}' })).statusCode, 403);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --import tsx --test tests/partScan.test.ts`
Expected: FAIL — cannot find module `../netlify/lib/partScanPrompt`.

- [ ] **Step 3: Implement `netlify/lib/partScanPrompt.ts`**

```ts
/** Prompt + model for Part Transposer photo reading, shared by the Netlify function and the Express dev server. */
export const PART_SCAN_MODEL = 'claude-opus-5-5';

export const PART_SCAN_PROMPT = `You are reading a photographed or scanned music part. Transcribe ONE staff into the plain-text format below.

Return ONLY the text — no markdown code fences, no explanation.

FORMAT
title: <title if printed; omit this line otherwise>
key: <tonic of the key signature as written, e.g. Eb, F#, Bb; add m for minor, e.g. Cm>
time: <time signature, e.g. 4/4, 3/4, 6/8>
clef: <treble or bass>
| bar 1 | bar 2 | ...

Inside a bar, space-separated tokens in order:
- Note: <letter><accidental><octave>:<duration>, e.g. Eb4:q, F#5:8, C4:h.
  * Pitch is ABSOLUTE: always write the accidental the note really has, including the ones from the key signature (in Eb major a written B is Bb4).
  * Middle C is C4.
  * Durations: w (whole) h (half) q (quarter) 8 (eighth) 16 (sixteenth); add "." for a dotted value (q.).
- Rest: r:<duration>, e.g. r:q, r:h.
- Tie to the next note: append ~ (C5:h~ | C5:q).
- Triplet: (3 C5:8 D5:8 E5:8)
- Chord symbol: in brackets immediately before the note or rest it sits above: [Ebmaj7] [F7#9] [Cm7/Bb].
- A bar with only chord symbols over slashes: write only the symbols, e.g. | [F7] [Bb7] |

RULES
- Transcribe pitches exactly as written on the page. Never transpose.
- With several staves, transcribe only the top staff (the melody) plus the chord symbols.
- The durations in every bar must add up to the time signature.
- Write out repeat signs (%) by copying the previous bar. Ignore dynamics, articulations and lyrics.
- Start a new line every 4 bars.
- If a passage is hard to read, write your best guess instead of skipping bars.

EXAMPLE
key: Eb
time: 4/4
clef: treble
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [Fm7] [Bb7] | [Ebmaj7] Eb4:w |`;

/** The model's answer without code fences or surrounding whitespace. */
export function extractPartText(raw: string): string {
  return raw.trim().replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
}
```

- [ ] **Step 4: Implement `netlify/functions/part-scan.ts`**

```ts
import type { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import {
  assertOrigin,
  authenticate,
  consumeQuota,
  corsHeaders,
  parseScoreInput,
  toErrorResponse,
} from '../lib/aiGuard';
import { getPlan } from '../lib/billing';
import { extractPartText, PART_SCAN_MODEL, PART_SCAN_PROMPT } from '../lib/partScanPrompt';

/** Part Transposer: reads one staff of a photographed part into the tool's text syntax. Shares the score quota. */
export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin;
  const CORS = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    assertOrigin(origin);
    const caller = await authenticate(event.headers.authorization);

    let body: unknown;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON', code: 'invalid_input' }) };
    }
    const images = parseScoreInput(body);

    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('part-scan: AI_API_KEY not configured');
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'AI service is not configured', code: 'ai_not_configured' }) };
    }

    await consumeQuota(caller, 'score', caller.anonymousDev || caller.owner ? 'pro' : await getPlan(caller.uid));

    const anthropic = new Anthropic({ apiKey });
    const imageContents: Anthropic.ImageBlockParam[] = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    }));

    const response = await anthropic.messages.create({
      model: PART_SCAN_MODEL,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [...imageContents, { type: 'text', text: PART_SCAN_PROMPT }],
      }],
    });

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: extractPartText(raw) }),
    };
  } catch (err) {
    const { status, body } = toErrorResponse(err, 'Part scan error');
    return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
  }
};
```

- [ ] **Step 5: Register in the dev server** — in `src/api/server.ts` add after the `score` import:

```ts
import { handler as partScan } from '../../netlify/functions/part-scan';
```

and change the map to:

```ts
const FUNCTIONS: Record<string, Handler> = { account, billing, buddy, 'paddle-webhook': paddleWebhook, 'part-scan': partScan, score };
```

- [ ] **Step 6: Run tests**

Run: `npm run test:guard`
Expected: all PASS, including the two new tests.

- [ ] **Step 7: Commit**

```bash
git add netlify/lib/partScanPrompt.ts netlify/functions/part-scan.ts src/api/server.ts tests/partScan.test.ts
git commit -m "feat(part-transposer): photo reading endpoint (score quota)"
```

---

### Task 13: Preview component

**Files:**
- Create: `src/features/part-transposer/PartPreview.tsx`

- [ ] **Step 1: Implement** (same lazy-OSMD pattern as `audio-transcriber/score/ScorePreview.tsx`; features stay self-contained)

```tsx
import { useEffect, useRef, useState } from 'react';

/** Renders a MusicXML string with OpenSheetMusicDisplay, loaded on first use. */
export default function PartPreview({ xml, label }: { xml: string; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(780);

  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(Math.max(280, Math.min(1000, Math.round(entry.contentRect.width))));
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;
    const element = document.createElement('div');
    element.style.width = `${width}px`;
    element.style.margin = '0 auto';
    host.current.replaceChildren(element);
    setLoading(true);
    setError('');
    (async () => {
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
        if (cancelled) return;
        const renderer = new OpenSheetMusicDisplay(element, { backend: 'svg', autoResize: false, pageFormat: 'Endless', drawTitle: true, drawPartNames: true });
        renderer.Zoom = 0.85;
        await renderer.load(xml);
        if (cancelled) return;
        renderer.render();
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Impossibile mostrare la parte.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; element.remove(); };
  }, [xml, width]);

  return (
    <div style={{ position: 'relative', background: 'white', color: '#111', borderRadius: 8, overflowX: 'auto', minHeight: 180 }}>
      {loading && <p role="status" style={{ padding: 16, margin: 0 }}>Preparo lo spartito…</p>}
      {error && <p role="alert" style={{ padding: 16, margin: 0, color: '#a11' }}>{error}</p>}
      <div ref={host} aria-label={label} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/part-transposer/PartPreview.tsx
git commit -m "feat(part-transposer): OSMD preview"
```

---

### Task 14: Feature UI

**Files:**
- Create: `src/features/part-transposer/PartTransposerFeature.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useMemo, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Note } from 'tonal';
import { aiFetch } from '../../shared/utils/aiFetch';
import PartPreview from './PartPreview';
import { concertKey, nearestDirection, writtenKey, type Direction, type KeySpec } from './engine/intervals';
import { combineParts, decodeMusicXmlFile, extractPart, listParts, readSourceInfo, type PartInfo } from './engine/musicXmlIO';
import { PART_INSTRUMENTS, partInstrument } from './engine/partInstruments';
import { displayXml, transposeParts, type PartOutput } from './engine/pipeline';
import { parseTextScore } from './engine/textScore';
import { textToMusicXml } from './engine/textToMusicXml';
import { browserCodec } from './engine/xmlDom';

const API_URL = import.meta.env.VITE_API_URL || '';
const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const MAX_IMAGES = 6;
const EXAMPLE = `title: Esempio
key: Eb
time: 4/4
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [Fm7] [Bb7] | [Ebmaj7] Eb4:w |`;

type InputTab = 'text' | 'xml' | 'photo';
interface XmlSource { name: string; xml: string; parts: PartInfo[]; partId: string }
interface PhotoImage { name: string; base64: string; mimeType: string }

const card: CSSProperties = { background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 };
const sectionLabel: CSSProperties = { fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 };
const field: CSSProperties = { background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8, padding: '6px 10px', fontSize: 13 };
const errorText: CSSProperties = { margin: 0, fontSize: 12.5, color: '#f87171' };
const hint: CSSProperties = { margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.6 };
const chip = (on: boolean): CSSProperties => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: on ? 600 : 400,
  background: on ? '#7c3aed20' : '#0d1117', border: `1px solid ${on ? '#7c3aed' : '#30363d'}`, color: on ? '#c4b5fd' : '#8b949e',
});
const button = (primary = false): CSSProperties => ({
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  background: primary ? '#7c3aed' : '#0d1117', border: `1px solid ${primary ? '#7c3aed' : '#30363d'}`, color: primary ? '#fff' : '#c4b5fd',
});

/** Spelling from the dropdown list with the same pitch (e.g. D# → Eb). */
function listTonic(tonic: string, minor: boolean): string {
  return (minor ? MINOR_TONICS : MAJOR_TONICS).find(t => Note.chroma(t) === Note.chroma(tonic)) ?? tonic;
}

function readImage(file: File): Promise<PhotoImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, base64: String(reader.result).split(',')[1], mimeType: file.type || 'image/png' });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function download(filename: string, xml: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) => s.toLowerCase().replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'parte';

function rangeWarning(o: PartOutput): string {
  const counts = [o.above && `${o.above} note sopra`, o.below && `${o.below} note sotto`].filter(Boolean).join(' e ');
  if (!counts) return '';
  return `${counts} il range di ${o.instrument.name}: prova a trasporre ${o.above >= o.below ? 'giù' : 'su'}.`;
}

export default function PartTransposerFeature() {
  const [tab, setTab] = useState<InputTab>('text');
  const [text, setText] = useState(EXAMPLE);
  const [xmlSource, setXmlSource] = useState<XmlSource | null>(null);
  const [xmlError, setXmlError] = useState('');
  const [sourceId, setSourceId] = useState('keyboard');
  const [sourceWarning, setSourceWarning] = useState('');
  // Key as written on the source part; the concert key is derived from it.
  const [writtenSourceKey, setWrittenSourceKey] = useState<KeySpec>({ tonic: 'Eb', minor: false });
  const [newTonic, setNewTonic] = useState('G');
  const [direction, setDirection] = useState<Direction | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>(PART_INSTRUMENTS.map(i => i.id));
  const [shownId, setShownId] = useState('keyboard');
  const [images, setImages] = useState<PhotoImage[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const source = partInstrument(sourceId);
  const originalKey = concertKey(writtenSourceKey, source);
  const shownDirection = direction ?? nearestDirection(originalKey.tonic, newTonic);
  const parsed = useMemo(() => parseTextScore(text), [text]);
  const usingXml = tab === 'xml';

  const sourceXml = useMemo(() => {
    if (usingXml) return xmlSource ? extractPart(browserCodec, xmlSource.xml, xmlSource.partId) : null;
    return parsed.score ? textToMusicXml({ ...parsed.score, key: writtenSourceKey }) : null;
  }, [usingXml, xmlSource, parsed, writtenSourceKey]);

  const result = useMemo((): { outputs: PartOutput[]; error: string } => {
    if (!sourceXml) return { outputs: [], error: '' };
    try {
      const fromKey = concertKey(writtenSourceKey, source);
      return {
        outputs: transposeParts(browserCodec, {
          sourceXml,
          source,
          originalKey: fromKey,
          newTonic,
          direction: direction ?? nearestDirection(fromKey.tonic, newTonic),
          targets: PART_INSTRUMENTS.filter(i => targetIds.includes(i.id)),
        }),
        error: '',
      };
    } catch (e) {
      return { outputs: [], error: e instanceof Error ? e.message : 'Trasposizione non riuscita' };
    }
  }, [sourceXml, source, writtenSourceKey, newTonic, direction, targetIds]);

  const shown = result.outputs.find(o => o.instrument.id === shownId) ?? result.outputs[0];
  const shownXml = useMemo(() => (shown ? displayXml(browserCodec, shown) : ''), [shown]);
  const title = usingXml ? slug(xmlSource?.name ?? '') : slug(parsed.score?.title ?? '');
  const tonics = originalKey.minor ? MINOR_TONICS : MAJOR_TONICS;
  const modeLabel = originalKey.minor ? 'minore' : 'maggiore';

  function updateText(value: string) {
    setText(value);
    const key = parseTextScore(value).score?.key;
    if (key) setWrittenSourceKey(key);
  }

  function choosePart(src: XmlSource) {
    setXmlSource(src);
    const info = readSourceInfo(browserCodec.parse(extractPart(browserCodec, src.xml, src.partId)));
    if (info.key) setWrittenSourceKey(info.key);
    if (info.instrumentId) setSourceId(info.instrumentId);
    setSourceWarning(info.instrumentId ? '' : `Strumento non riconosciuto (trasposizione di ${info.semitones} semitoni): scegli "Scritto per" a mano.`);
  }

  async function loadXmlFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const xml = decodeMusicXmlFile(file.name, new Uint8Array(await file.arrayBuffer()));
      const parts = listParts(browserCodec.parse(xml));
      if (!parts.length) throw new Error('Nessuna parte con note nel file');
      choosePart({ name: file.name, xml, parts, partId: parts[0].id });
      setXmlError('');
    } catch (err) {
      setXmlError(err instanceof Error && err.message !== 'Invalid XML' ? err.message : 'File non leggibile: esporta di nuovo il MusicXML da MuseScore');
    }
  }

  async function addImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    try {
      const read = await Promise.all(files.map(readImage));
      setImages(prev => [...prev, ...read].slice(0, MAX_IMAGES));
    } catch {
      setScanError('Impossibile leggere l’immagine');
    }
  }

  async function scan() {
    setScanning(true);
    setScanError('');
    try {
      const resp = await aiFetch(`${API_URL}/api/part-scan`, { images: images.map(({ base64, mimeType }) => ({ base64, mimeType })) });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Analisi non riuscita');
      if (!data.text) throw new Error('Nessuna nota riconosciuta: prova con una foto più nitida');
      updateText(data.text);
      setTab('text');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Analisi non riuscita');
    } finally {
      setScanning(false);
    }
  }

  function toggleTarget(id: string) {
    setTargetIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
  }

  function setConcertTonic(tonic: string) {
    setWrittenSourceKey(writtenKey({ tonic, minor: originalKey.minor }, source));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>Part Transposer</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Cambia la tonalità di una parte (melodia e accordi) e scrivila per ogni strumento della band.
        </p>
      </div>

      {/* 1 · Input */}
      <section style={card} aria-labelledby="pt-input">
        <span id="pt-input" style={sectionLabel}>1 · Parte</span>
        <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['text', 'Scrivi'], ['xml', 'MusicXML'], ['photo', 'Foto']] as const).map(([id, name]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={chip(tab === id)}>{name}</button>
          ))}
        </div>

        {tab === 'text' && (
          <>
            <textarea
              aria-label="Parte in formato testo"
              value={text}
              onChange={e => updateText(e.target.value)}
              spellCheck={false}
              rows={8}
              style={{ ...field, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical' }}
            />
            <p style={hint}>
              Note <code>Eb4:q</code> (durate <code>w h q 8 16</code>, punto <code>q.</code>), pause <code>r:h</code>, legatura <code>~</code>,
              terzine <code>(3 C5:8 D5:8 E5:8)</code>, sigle <code>[Cm7]</code> prima della nota. Battute tra <code>|</code>.
            </p>
            {parsed.errors.length > 0 && (
              <ul role="alert" style={{ margin: 0, paddingLeft: 18 }}>
                {parsed.errors.map((err, i) => <li key={i} style={errorText}>{err.message}</li>)}
              </ul>
            )}
          </>
        )}

        {tab === 'xml' && (
          <>
            <input type="file" accept=".musicxml,.xml,.mxl" onChange={loadXmlFile} aria-label="Carica MusicXML" style={{ color: '#8b949e', fontSize: 13 }} />
            <p style={hint}>Da MuseScore: File → Esporta → MusicXML, con "Concert pitch" spento.</p>
            {xmlSource && xmlSource.parts.length > 1 && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#e6edf3' }}>
                Parte
                <select style={field} value={xmlSource.partId} onChange={e => choosePart({ ...xmlSource, partId: e.target.value })}>
                  {xmlSource.parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            {xmlSource && <p style={{ margin: 0, fontSize: 12.5, color: '#06b6d4' }}>✓ {xmlSource.name}</p>}
            {xmlError && <p role="alert" style={errorText}>{xmlError}</p>}
          </>
        )}

        {tab === 'photo' && (
          <>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={addImages} aria-label="Carica foto dello spartito" style={{ color: '#8b949e', fontSize: 13 }} />
            {images.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#8b949e' }}>
                {images.map((img, i) => <li key={i}>{img.name}</li>)}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={button(true)} disabled={!images.length || scanning} onClick={scan}>{scanning ? 'Leggo lo spartito…' : 'Leggi con AI'}</button>
              {images.length > 0 && <button style={button()} onClick={() => setImages([])}>Svuota</button>}
            </div>
            <p style={hint}>Il risultato finisce in "Scrivi": controllalo prima di trasporre.</p>
            {scanError && <p role="alert" style={errorText}>{scanError}</p>}
          </>
        )}
      </section>

      {/* 2 · Origine · 3 · Destinazione */}
      <section style={card} aria-labelledby="pt-keys">
        <span id="pt-keys" style={sectionLabel}>2 · Origine e 3 · Destinazione</span>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: '#e6edf3' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Scritto per
            <select style={field} value={sourceId} onChange={e => setSourceId(e.target.value)}>
              {PART_INSTRUMENTS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Tonalità originale (concert)
            <select style={field} value={listTonic(originalKey.tonic, originalKey.minor)} onChange={e => setConcertTonic(e.target.value)}>
              {tonics.map(t => <option key={t} value={t}>{t} {modeLabel}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Nuova tonalità
            <select style={field} value={listTonic(newTonic, originalKey.minor)} onChange={e => setNewTonic(e.target.value)}>
              {tonics.map(t => <option key={t} value={t}>{t} {modeLabel}</option>)}
            </select>
          </label>
          <div role="group" aria-label="Direzione" style={{ display: 'flex', gap: 6 }}>
            {(['up', 'down'] as const).map(d => (
              <button key={d} aria-pressed={shownDirection === d} onClick={() => setDirection(d)} style={chip(shownDirection === d)}>
                {d === 'up' ? '↑ su' : '↓ giù'}
              </button>
            ))}
          </div>
        </div>
        {sourceWarning && <p role="alert" style={errorText}>{sourceWarning}</p>}
        <div role="group" aria-label="Strumenti di destinazione" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PART_INSTRUMENTS.map(i => (
            <button key={i.id} aria-pressed={targetIds.includes(i.id)} onClick={() => toggleTarget(i.id)} style={chip(targetIds.includes(i.id))}>{i.name}</button>
          ))}
        </div>
      </section>

      {/* 4 · Risultato */}
      <section style={card} aria-labelledby="pt-result">
        <span id="pt-result" style={sectionLabel}>4 · Parti</span>
        {result.error && <p role="alert" style={errorText}>{result.error}</p>}
        {!result.outputs.length && !result.error && (
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            {sourceXml ? 'Scegli almeno uno strumento.' : 'Inserisci una parte valida per vedere il risultato.'}
          </p>
        )}
        {shown && (
          <>
            <div role="tablist" aria-label="Parte mostrata" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {result.outputs.map(o => (
                <button key={o.instrument.id} role="tab" aria-selected={o === shown} onClick={() => setShownId(o.instrument.id)} style={chip(o === shown)}>
                  {o.instrument.name}{o.above + o.below ? ' ⚠' : ''}
                </button>
              ))}
            </div>
            {rangeWarning(shown) && <p role="status" style={{ margin: 0, fontSize: 12.5, color: '#d97706' }}>{rangeWarning(shown)}</p>}
            <PartPreview xml={shownXml} label={`Parte per ${shown.instrument.name}`} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={button()} onClick={() => download(`${title}-${shown.instrument.id}.musicxml`, shown.xml)}>⬇ MusicXML {shown.instrument.name}</button>
              <button style={button(true)} onClick={() => download(`${title}-parti.musicxml`, combineParts(browserCodec, result.outputs.map(o => o.xml)))}>
                ⬇ Tutte le parti ({result.outputs.length})
              </button>
            </div>
            <p style={hint}>In MuseScore apri "Tutte le parti" e usa Parti → Genera per i PDF separati.</p>
          </>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Lint and type-check**

Run: `npx eslint src/features/part-transposer && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors or warnings.

- [ ] **Step 3: Commit**

```bash
git add src/features/part-transposer/PartTransposerFeature.tsx
git commit -m "feat(part-transposer): four-step UI with text, MusicXML and photo input"
```

---

### Task 15: Register the tool (Pro)

**Files:**
- Modify: `src/shared/types/navigation.types.ts`
- Modify: `src/featureRegistry.ts`
- Modify: `src/App.tsx` (import list, Arrange `TabDef`s, render branches)
- Modify: `src/config/plans.ts`

- [ ] **Step 1: Tab type** — replace the final `| 'creative-sparks';` of the union with:

```ts
  | 'creative-sparks'
  | 'part-transposer';
```

- [ ] **Step 2: Registry** — in `featureRegistry.ts` after the `RhythmicDisplacementFeature` export:

```ts
export const PartTransposerFeature = lazyFeature(() => import('./features/part-transposer/PartTransposerFeature'));
```

and in `BY_TAB` after `'rhythmic-displacement': RhythmicDisplacementFeature,`:

```ts
  'part-transposer': PartTransposerFeature,
```

- [ ] **Step 3: App** — add `PartTransposerFeature,` to the `./featureRegistry` import list (after `RhythmicDisplacementFeature,`). After the `rhythmic-displacement` `TabDef` add:

```ts
      { id: 'part-transposer', label: 'Part Transposer', icon: '🎚️', desc: 'Cambia tonalità a una parte e scrivila per ogni strumento — testo, MusicXML o foto', subsection: 'Arrange' },
```

After `{activeTab === 'rhythmic-displacement' && <RhythmicDisplacementFeature />}` add:

```tsx
        {activeTab === 'part-transposer' && <PartTransposerFeature />}
```

- [ ] **Step 4: Pro** — in `plans.ts` change the Arrange line to:

```ts
  'riff', 'melody', 'mel-harm', 'architect', 'groove', 'arrangement', 'rhythmic-displacement', 'part-transposer',
```

- [ ] **Step 5: Verify**

Run: `npm run lint && npm run build`
Expected: lint clean; build succeeds; the output lists a separate `PartTransposerFeature-*.js` chunk; the entry chunk stays ≈105 KB gzipped (record the size before Task 15 with `npm run build` and compare); `fflate` code appears only in the Part Transposer chunk (`grep -l unzipSync dist/assets/*.js` lists only that chunk).

- [ ] **Step 6: Commit**

```bash
git add src/shared/types/navigation.types.ts src/featureRegistry.ts src/App.tsx src/config/plans.ts
git commit -m "feat(part-transposer): register the tool in Arrange (Pro)"
```

---

### Task 16: Full verification

- [ ] **Step 1: All unit tests**

Run: `npm test`
Expected: every suite PASS, including `test:transposer` and `test:guard`.

- [ ] **Step 2: Browser check** — `npm run dev`, open http://localhost:3000, open *Composition → Arrange → Part Transposer*, and verify:
  1. The example renders; Mib → Sol gives keyboard in G (Gmaj7 / Em7 / Am7 / D7), tenor sax in A starting on E6, bass in F clef with the ⚠ range warning.
  2. Deleting a note shows the bar error and clears the results; fixing it brings them back.
  3. A real MuseScore export (trumpet or alto sax part, Concert pitch OFF) is auto-detected in "Scritto per"; dynamics and lyrics survive. "Tutte le parti" opens in MuseScore with one part per instrument; toggling Concert pitch shows every part sounding in the new key; guitar and bass read an octave above sounding.
  4. A compressed `.mxl` export loads too.
  5. Photo: with `AI_API_KEY` set (and `AI_AUTH_DISABLED=true` locally), a lead-sheet photo lands in "Scrivi" with any bar errors highlighted.
  6. At 375 px width there is no horizontal page scroll; the preview scrolls inside its box.

- [ ] **Step 3: Finish the branch** — use superpowers:finishing-a-development-branch.

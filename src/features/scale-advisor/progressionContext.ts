import { Note } from 'tonal';
import { SCALES, getChordScaleEntry, type ChordScaleEntry, type ScaleInfo } from './chordScales';

// Chord scales chosen by harmonic function, after Mulholland & Hojnacki,
// "The Berklee Book of Jazz Harmony": the same m7 is Dorian as ii, Phrygian as iii
// and Aeolian as vi; a dominant takes its tensions from the chord it resolves to.

// ─── Types ──────────────────────────────────────────────────────────────────

export type KeyMode = 'major' | 'minor';

export interface KeyChoice {
  tonic: string;
  mode: KeyMode;
}

export interface ProgressionChord {
  root: string;
  quality: string;
  symbol: string;
}

export interface ContextualChord extends ProgressionChord {
  roman: string;
  role: string;
  scale: ScaleInfo;
  reason: string;
  /** false when no functional rule applied and the chord's own primary scale is shown */
  contextual: boolean;
}

export interface ProgressionAnalysis {
  key: KeyChoice;
  chords: ContextualChord[];
}

type Kind = 'major' | 'minor' | 'minorMajor' | 'dominant' | 'halfDim' | 'dim' | 'other';
type ScaleKey = keyof typeof SCALES;

interface Parsed { chord: ProgressionChord; entry: ChordScaleEntry; pc: number; kind: Kind }
interface Choice { scale: ScaleKey; role: string; reason: string }

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const NUMERALS = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const TENSION_NAMES = ['R', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♭13', '13', '♭7', '△7'];

const chroma = (note: string) => Note.chroma(note) ?? 0;
const mod12 = (n: number) => ((n % 12) + 12) % 12;
const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every(x => b.includes(x));
const lowerNumeral = (numeral: string) => numeral.replace(/[IV]+/, s => s.toLowerCase());

export function chordKind(entry: ChordScaleEntry): Kind {
  const has = (i: number) => entry.chordTones.includes(i);
  if (has(3)) {
    if (has(6)) return has(9) ? 'dim' : 'halfDim';
    return has(11) || (has(9) && !has(10)) ? 'minorMajor' : 'minor';
  }
  if (has(4)) {
    if (has(10)) return 'dominant';
    return has(8) && !has(7) ? 'other' : 'major';
  }
  return has(5) && has(10) ? 'dominant' : 'other';
}

const isMinorKind = (kind: Kind) => kind === 'minor' || kind === 'minorMajor' || kind === 'halfDim' || kind === 'dim';

/** Chord tones + the scale's other notes. A note a half step above a chord tone is an
 *  avoid note, except on dominants, where only the 11 against the 3rd is (Berklee). */
function deriveScaleInfo(entry: ChordScaleEntry, key: ScaleKey): ScaleInfo {
  const { name, intervals } = SCALES[key];
  const chordTones = intervals.filter(i => entry.chordTones.includes(i));
  const dominant = chordKind(entry) === 'dominant';
  const isAvoid = (i: number) =>
    (i === 4 && chordTones.includes(5)) // the 3rd on a sus chord
    || (dominant ? i === 5 && chordTones.includes(4) : chordTones.includes(mod12(i - 1)));
  const others = intervals.filter(i => !chordTones.includes(i));
  const avoidNotes = others.filter(isAvoid);
  const goodExtensions = others.filter(i => !isAvoid(i));
  const names = (xs: number[]) => xs.map(i => TENSION_NAMES[i]).join(', ');
  return {
    name,
    intervals,
    chordTones,
    goodExtensions,
    avoidNotes,
    description: `${name}: the chord tones plus the tensions this context supplies.`,
    extensionLabel: `Extensions: ${names(goodExtensions) || '—'}${avoidNotes.length ? ` · avoid: ${names(avoidNotes)}` : ''}`,
  };
}

/** The chord's own curated card for this scale, or a derived one when the scale holds every chord tone. */
function scaleFor(entry: ChordScaleEntry, key: ScaleKey): ScaleInfo | null {
  const target = SCALES[key].intervals;
  const curated = [entry.primary, ...entry.alternatives].find(s => sameSet(s.intervals, target));
  if (curated) return curated;
  return entry.chordTones.every(t => target.includes(t)) ? deriveScaleInfo(entry, key) : null;
}

function romanFor(offset: number, entry: ChordScaleEntry): string {
  const kind = chordKind(entry);
  const has = (i: number) => entry.chordTones.includes(i);
  const base = isMinorKind(kind) ? lowerNumeral(NUMERALS[offset]) : NUMERALS[offset];
  const suffix =
    kind === 'dominant' ? (has(4) ? '7' : '7sus4')
    : kind === 'halfDim' ? (has(10) ? 'ø7' : '°')
    : kind === 'dim' ? '°7'
    : kind === 'major' ? (has(11) ? 'Δ7' : has(9) ? '6' : '')
    : kind === 'minorMajor' ? (has(11) ? '(Δ7)' : '6')
    : kind === 'minor' ? (has(10) ? '7' : '')
    : has(8) ? '+' : has(5) ? 'sus4' : 'sus2';
  return base + suffix;
}

// ─── Key detection ──────────────────────────────────────────────────────────

const DIATONIC: Record<KeyMode, Record<number, Kind[]>> = {
  major: { 0: ['major'], 2: ['minor'], 4: ['minor'], 5: ['major'], 7: ['dominant', 'major'], 9: ['minor'], 11: ['halfDim'] },
  minor: { 0: ['minor', 'minorMajor'], 2: ['halfDim'], 3: ['major'], 5: ['minor'], 7: ['dominant'], 8: ['major'], 10: ['dominant', 'major'], 11: ['dim'] },
};

function scoreKey(parsed: Parsed[], tonicPc: number, mode: KeyMode): number {
  let score = 0;
  parsed.forEach((p, i) => {
    const offset = mod12(p.pc - tonicPc);
    const next = parsed[i + 1];
    if (DIATONIC[mode][offset]?.includes(p.kind)) {
      score += 2;
      // A tonic chord counts more, most of all as the last chord
      if (offset === 0) score += i === parsed.length - 1 ? 3 : 1;
    }
    if (p.kind !== 'dominant' || !next) return;
    if (offset === 7 && mod12(next.pc - tonicPc) === 0) score += 2;
    else if (mod12(next.pc - p.pc) === 5 && DIATONIC[mode][mod12(next.pc - tonicPc)]?.includes(next.kind)) score += 1;
  });
  return score;
}

function parse(chords: ProgressionChord[]): Parsed[] {
  return chords.flatMap(chord => {
    const entry = getChordScaleEntry(chord.quality);
    return entry ? [{ chord, entry, pc: chroma(chord.root), kind: chordKind(entry) }] : [];
  });
}

/** A blues: only dominants, starting on I7 and visiting IV7. Every I7 would otherwise score as V7 of IV. */
function bluesTonic(parsed: Parsed[]): number | null {
  const [first] = parsed;
  if (!first || !parsed.every(p => p.kind === 'dominant')) return null;
  return parsed.some(p => mod12(p.pc - first.pc) === 5) ? first.pc : null;
}

export function detectKey(chords: ProgressionChord[]): KeyChoice {
  const parsed = parse(chords);
  const blues = bluesTonic(parsed);
  let best = { pc: blues ?? 0, mode: 'major' as KeyMode, score: blues === null ? -1 : Infinity };
  for (let pc = 0; pc < 12; pc++) {
    for (const mode of ['major', 'minor'] as KeyMode[]) {
      const score = scoreKey(parsed, pc, mode);
      if (score > best.score) best = { pc, mode, score };
    }
  }
  const tonic = chords.find(c => chroma(c.root) === best.pc)?.root
    ?? (best.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS)[best.pc];
  return { tonic, mode: best.mode };
}

// ─── Functional chord scales ────────────────────────────────────────────────

function dominantChoice(p: Parsed, next: Parsed | undefined, offset: number, key: KeyChoice, blues: boolean): Choice {
  const minorKey = key.mode === 'minor';
  const interval = next ? mod12(next.pc - p.pc) : null;
  const targetOffset = next ? mod12(next.pc - chroma(key.tonic)) : 0;
  const target = next && isMinorKind(next.kind) ? lowerNumeral(NUMERALS[targetOffset]) : NUMERALS[targetOffset];

  if (blues && (offset === 0 || offset === 5 || offset === 7)) {
    return { scale: 'mixolydian', role: 'Blues dominant', reason: 'In a blues every I7, IV7 and V7 is a stable colour rather than a resolving dominant: Mixolydian, or the blues scale, over each.' };
  }
  if (interval === 5 && next) {
    if (targetOffset === 0 && minorKey) {
      return { scale: 'mixolydianb9s9b13', role: 'V7 → minor tonic', reason: 'V7 of a minor key: the natural minor of the tonic plus its leading tone gives ♭9, ♯9 and ♭13, all of which resolve into the tonic. Altered is the stronger option.' };
    }
    const label = targetOffset === 0 ? 'V7' : `V7/${target}`;
    return isMinorKind(next.kind)
      ? { scale: 'phrygianDom', role: `${label} → minor`, reason: 'Resolves to a minor chord, so its tensions come from the target\'s key: ♭9 and ♭13 (the ♭13 anticipates the target\'s ♭3). Mixolydian ♭9 ♭13; Altered for more tension.' }
      : { scale: 'mixolydian', role: `${label} → major`, reason: 'Resolves to a major chord: chord tones plus the natural 9 and 13 of the key. The 11 is the only avoid note on a dominant.' };
  }
  if (interval === 11 && next) {
    const label = targetOffset === 0 ? 'subV7' : `subV7/${target}`;
    return { scale: 'lydianDom', role: `${label} (tritone sub)`, reason: 'Resolves down a half step: a substitute dominant. Lydian ♭7 — its ♯11 is the root of the dominant it replaces, and it has no avoid notes.' };
  }
  if (offset === 10) {
    return minorKey
      ? { scale: 'mixolydian', role: '♭VII7 (Aeolian cadence)', reason: 'Subtonic dominant of natural minor: not a true dominant, so plain Mixolydian.' }
      : { scale: 'lydianDom', role: '♭VII7 (backdoor)', reason: 'Backdoor dominant borrowed from the parallel minor: Lydian ♭7, whose tensions 9, ♯11, 13 are the notes of the tonic triad.' };
  }
  if (offset === 7) {
    return minorKey
      ? { scale: 'mixolydianb9s9b13', role: 'V7 (unresolved)', reason: 'V7 of a minor key: natural minor plus the leading tone — ♭9, ♯9 and ♭13. Altered is the stronger option.' }
      : { scale: 'mixolydian', role: 'V7 (unresolved)', reason: 'Diatonic dominant of a major key: Mixolydian, avoid the 11.' };
  }
  if (minorKey && offset === 5) {
    return { scale: 'mixolydian', role: 'IV7 (Dorian minor)', reason: 'IV7 comes from the Dorian source (the natural 6th of the key): Mixolydian.' };
  }
  return { scale: 'lydianDom', role: 'Non-diatonic dominant', reason: 'A dominant that resolves neither down a 5th nor down a half step: Lydian ♭7 keeps every tension available and has no avoid notes.' };
}

function majorKeyChoice(p: Parsed, offset: number): Choice | null {
  switch (p.kind) {
    case 'major':
      if (offset === 0) return { scale: 'ionian', role: 'Tonic', reason: 'Diatonic I: Ionian, avoid the 11. Lydian is the modern alternative when the melody leaves the 4th alone (Russell hears Lydian as the true tonic scale).' };
      if (offset === 5) return { scale: 'lydian', role: 'Subdominant', reason: 'Diatonic IV: Lydian — its ♯11 is the 7th degree of the key, so there is no avoid note.' };
      if (offset === 7) return { scale: 'mixolydian', role: 'Dominant', reason: 'The V triad is a dominant even without its 7th: Mixolydian.' };
      return { scale: 'lydian', role: 'Borrowed major chord', reason: 'Modal-interchange maj7 chords (♭II, ♭III, ♭VI, ♭VII) all take Lydian; the ♯11 of each is a note of the home key.' };
    case 'minor':
      if (offset === 2) return { scale: 'dorian', role: 'Subdominant (ii)', reason: 'Diatonic ii: Dorian, every tension available.' };
      if (offset === 4) return { scale: 'phrygian', role: 'Tonic substitute (iii)', reason: 'Diatonic iii: Phrygian — ♭9 and ♭13 are avoid notes because each sits a half step above a chord tone.' };
      if (offset === 9) return { scale: 'aeolian', role: 'Tonic substitute (vi)', reason: 'Diatonic vi: Aeolian — the ♭13 is an avoid note.' };
      if (offset === 5) return { scale: 'dorian', role: 'Subdominant minor (iv)', reason: 'iv-7 borrowed from the parallel minor: Dorian, a displacement of its Aeolian source with no awkward intervals.' };
      return { scale: 'dorian', role: 'Related ii / borrowed minor', reason: 'Non-diatonic minor 7th: Dorian, the default for related ii chords.' };
    case 'minorMajor':
      return { scale: 'melodicMinor', role: offset === 5 ? 'Subdominant minor (iv)' : 'Borrowed minor', reason: 'Minor chord with a 6th or △7: melodic minor, which keeps the key\'s 3rd as a tension.' };
    case 'halfDim':
      return offset === 11
        ? { scale: 'locrian', role: 'Dominant substitute (viiø)', reason: 'Diatonic viiø: Locrian, ♭9 avoid.' }
        : { scale: 'locrian', role: offset === 2 ? 'Borrowed iiø' : 'Related iiø / borrowed', reason: 'Half-diminished from the parallel minor, or the related ii of a dominant going to minor: Locrian. Locrian ♮9 if the melody holds the natural 9.' };
    default:
      return null;
  }
}

function minorKeyChoice(p: Parsed, offset: number): Choice | null {
  switch (p.kind) {
    case 'minorMajor':
      return offset === 0
        ? { scale: 'melodicMinor', role: 'Tonic', reason: 'i-6 and i-(Δ7) come from melodic minor, which is also their chord scale.' }
        : { scale: 'melodicMinor', role: 'Minor with 6th / △7', reason: 'Minor chord with a 6th or △7: melodic minor.' };
    case 'minor':
      if (offset === 0) return { scale: 'dorian', role: 'Tonic', reason: 'i-7 in jazz: Dorian. Aeolian when the melody uses the ♭6.' };
      if (offset === 5) return { scale: 'dorian', role: 'Subdominant (iv)', reason: 'iv-7 from the Aeolian source: Dorian.' };
      if (offset === 7) return { scale: 'phrygian', role: 'v-7 (Aeolian cadence)', reason: 'Minor v is not a true dominant: Phrygian, from the natural minor.' };
      return { scale: 'dorian', role: 'Related ii', reason: 'Non-diatonic minor 7th: Dorian.' };
    case 'halfDim':
      if (offset === 2) return { scale: 'locrian', role: 'Subdominant (iiø)', reason: 'Diatonic iiø of minor: Locrian. Locrian ♮9 (Locrian ♯2) softens the ♭9.' };
      if (offset === 9) return { scale: 'locrianSharp2', role: 'viø (melodic minor)', reason: 'viø comes from melodic minor: Locrian ♮9.' };
      return { scale: 'locrian', role: 'Half-diminished', reason: 'Half-diminished: Locrian.' };
    case 'major':
      if (offset === 3) return { scale: 'ionian', role: 'Relative major (♭III)', reason: '♭IIIΔ7 belongs to the tonic group of minor: Ionian.' };
      if (offset === 8) return { scale: 'lydian', role: 'Subdominant (♭VI)', reason: '♭VIΔ7: Lydian — its ♯11 is the 2nd degree of the key.' };
      if (offset === 1) return { scale: 'lydian', role: 'Neapolitan (♭II)', reason: '♭IIΔ7 from Phrygian: Lydian.' };
      return { scale: 'lydian', role: 'Major chord in minor', reason: 'Non-diatonic maj7: Lydian.' };
    default:
      return null;
  }
}

// ─── Main entry point ───────────────────────────────────────────────────────

export function analyzeProgression(chords: ProgressionChord[], keyOverride?: KeyChoice): ProgressionAnalysis {
  const key = keyOverride ?? detectKey(chords);
  const tonicPc = chroma(key.tonic);
  const parsed = parse(chords);
  const offsetOf = (p: Parsed) => mod12(p.pc - tonicPc);
  const blues = parsed.some(p => p.kind === 'dominant' && offsetOf(p) === 0)
    && parsed.some(p => p.kind === 'dominant' && offsetOf(p) === 5);

  const result = parsed.map((p, i): ContextualChord => {
    const next = parsed[i + 1];
    const offset = offsetOf(p);
    const roman = romanFor(offset, p.entry);
    const own = (role: string, reason: string): ContextualChord =>
      ({ ...p.chord, roman, role, scale: p.entry.primary, reason, contextual: false });

    if (p.entry.quality === '7alt') {
      return own('Altered dominant', 'The symbol asks for altered tensions: the Altered scale, whatever the context.');
    }
    // Leading-tone °7 resolving up a half step into minor: the target's harmonic minor
    if (p.kind === 'dim' && next && mod12(next.pc - p.pc) === 1 && isMinorKind(next.kind)) {
      const leading = p.entry.alternatives.find(s => s.name.startsWith('Ultralocrian'));
      if (leading) {
        return { ...p.chord, roman, role: 'Leading-tone °7 → minor', scale: leading, contextual: true,
          reason: 'Resolves up a half step into a minor chord: the harmonic minor of the target, heard from the diminished chord.' };
      }
    }

    const choice = p.kind === 'dominant'
      ? dominantChoice(p, next, offset, key, blues)
      : key.mode === 'major' ? majorKeyChoice(p, offset) : minorKeyChoice(p, offset);
    if (!choice) return own(p.kind === 'dim' ? 'Diminished' : 'Colour chord', 'No functional rule for this chord: its own primary scale.');

    const scale = scaleFor(p.entry, choice.scale);
    if (!scale) return own(choice.role, `The written tensions do not fit ${SCALES[choice.scale].name}, so the chord's own scale wins.`);
    return { ...p.chord, roman, role: choice.role, scale, reason: choice.reason, contextual: true };
  });

  return { key, chords: result };
}

export const KEY_OPTIONS: KeyChoice[] = [
  ...MAJOR_TONICS.map(tonic => ({ tonic, mode: 'major' as KeyMode })),
  ...MINOR_TONICS.map(tonic => ({ tonic, mode: 'minor' as KeyMode })),
];

export const keyLabel = (key: KeyChoice) => `${key.tonic} ${key.mode}`;

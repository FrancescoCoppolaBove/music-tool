import {
  noteToSemitone,
  semitoneToNote,
  notePreferFlat,
  getChordNotes,
} from '@shared/utils/musicTheory';
import type { ResolvedChord, Technique, KeyMode } from '../types/progression.types';

// ─── RNG seedato ─────────────────────────────────────────────────────────────

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Contesto e helper ───────────────────────────────────────────────────────

export interface KeyContext {
  key: string;
  mode: KeyMode;
  keySemitone: number;
  preferFlat: boolean;
}

export function contextFor(key: string, mode: KeyMode): KeyContext {
  return { key, mode, keySemitone: noteToSemitone(key), preferFlat: notePreferFlat(key) };
}

export const MAJOR_Q = ['maj', 'maj7', 'maj9', '6', '6/9', 'maj7#11', 'maj9#11', 'add9', 'maj11', 'maj13'];
export const MINOR_Q = ['m', 'm7', 'm9', 'm11', 'm13', 'm6', 'm6/9', 'madd9'];
export const DOM_Q   = ['7', '9', '11', '13', '7b9', '7#9', '7alt', '7#11', '9#11', '7b5', '7#5', '7b5b9', '7#5#9', '7sus4'];

export function makeChord(
  semitone: number,
  quality: string,
  ctx: KeyContext,
  extra: Partial<ResolvedChord> = {},
): ResolvedChord {
  const sem = ((semitone % 12) + 12) % 12;
  const preferFlat = ctx.preferFlat || [1, 3, 6, 8, 10].includes(sem);
  const root = semitoneToNote(sem, preferFlat);
  const suffix = quality === 'maj' ? '' : quality;
  return {
    degree: '',
    symbol: `${root}${suffix}`,
    root,
    quality,
    notes: getChordNotes(root, quality),
    function: 'Color',
    ...extra,
  };
}

function isTouched(c: ResolvedChord): boolean {
  return !!c.inserted || !!c.transformOf;
}

// Inserzione ammessa prima dell'indice i: target intatto, non in apertura,
// e senza interrompere un V→target (o SubV→target) già presente.
function canInsertBefore(chords: ResolvedChord[], i: number): boolean {
  if (i === 0) return false;
  const target = chords[i];
  if (!target || isTouched(target)) return false;
  const prev = chords[i - 1];
  if (prev) {
    if (isTouched(prev)) return false;
    const rel = (noteToSemitone(prev.root) - noteToSemitone(target.root) + 12) % 12;
    if (DOM_Q.includes(prev.quality) && (rel === 7 || rel === 1)) return false;
  }
  return true;
}

// Sostituzione ammessa all'indice i: intatto, mai l'ultimo accordo,
// mai il V della cadenza finale, vicini intatti.
function canSubstitute(chords: ResolvedChord[], i: number): boolean {
  const c = chords[i];
  if (!c || isTouched(c)) return false;
  if (i === chords.length - 1) return false;
  if (i === chords.length - 2 && DOM_Q.includes(c.quality)) {
    const last = chords[chords.length - 1];
    const rel = (noteToSemitone(c.root) - noteToSemitone(last.root) + 12) % 12;
    if (rel === 7) return false;
  }
  if ([chords[i - 1], chords[i + 1]].some(n => n && isTouched(n))) return false;
  return true;
}

// ─── Interfaccia trasformazione ──────────────────────────────────────────────

export interface Transform {
  id: Technique;
  kind: 'insertion' | 'substitution' | 'decoration';
  label: string;
  explain: string;
  findTargets(chords: ResolvedChord[], ctx: KeyContext): number[];
  apply(chords: ResolvedChord[], idx: number, ctx: KeyContext, rng: Rng): ResolvedChord[] | null;
}

// ─── Trasformazioni ──────────────────────────────────────────────────────────

const secondaryDominant: Transform = {
  id: 'secondary_dominant',
  kind: 'insertion',
  label: 'Dominante secondaria',
  explain: 'V7 costruito una quinta sopra il target: crea attrazione verso l\'accordo di arrivo.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i => canInsertBefore(chords, i)),
  apply: (chords, idx, ctx) => {
    const target = chords[idx];
    const ins = makeChord(noteToSemitone(target.root) + 7, '7', ctx, {
      inserted: true,
      technique: 'secondary_dominant',
      techniqueLabel: 'Secondary Dominant',
      function: 'Dominant',
      transformLabel: 'V7/x',
      transformExplain: `V7 di ${target.symbol}: dominante secondaria che tira verso il target`,
      annotation: `V7 → ${target.symbol}`,
    });
    return [...chords.slice(0, idx), ins, ...chords.slice(idx)];
  },
};

const passingDim: Transform = {
  id: 'dim_pedal',
  kind: 'insertion',
  label: 'Dim di passaggio',
  explain: 'Dim7 un semitono sotto il target: la sensibile cromatica che conduce all\'accordo.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i => {
      if (!canInsertBefore(chords, i)) return false;
      const dimSem = (noteToSemitone(chords[i].root) + 11) % 12;
      const prev = chords[i - 1];
      return !prev || noteToSemitone(prev.root) !== dimSem;
    }),
  apply: (chords, idx, ctx) => {
    const target = chords[idx];
    const ins = makeChord(noteToSemitone(target.root) + 11, 'dim7', ctx, {
      inserted: true,
      technique: 'dim_pedal',
      techniqueLabel: 'Passing Diminished',
      function: 'Dominant',
      transformLabel: 'Passing dim',
      transformExplain: `dim7 un semitono sotto ${target.symbol}: approccio cromatico dal basso`,
      annotation: `°7 → ${target.symbol}`,
    });
    return [...chords.slice(0, idx), ins, ...chords.slice(idx)];
  },
};

const iiVMajor: Transform = {
  id: 'secondary_dominant',
  kind: 'insertion',
  label: 'ii–V del target',
  explain: 'IIm7–V7 del target maggiore: la cadenza jazz completa che prepara l\'arrivo.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i =>
      canInsertBefore(chords, i) && MAJOR_Q.includes(chords[i].quality)),
  apply: (chords, idx, ctx) => {
    const t = noteToSemitone(chords[idx].root);
    const two = makeChord(t + 2, 'm7', ctx, {
      inserted: true, technique: 'secondary_dominant', techniqueLabel: 'Related ii',
      function: 'Subdominant', transformLabel: 'ii/x',
      transformExplain: `IIm7 di ${chords[idx].symbol}: il ii della cadenza inserita`,
    });
    const five = makeChord(t + 7, '7', ctx, {
      inserted: true, technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant',
      function: 'Dominant', transformLabel: 'V/x',
      transformExplain: `V7 di ${chords[idx].symbol}: il V della cadenza inserita`,
      annotation: `ii–V → ${chords[idx].symbol}`,
    });
    return [...chords.slice(0, idx), two, five, ...chords.slice(idx)];
  },
};

const iiVMinor: Transform = {
  id: 'altered_dominant',
  kind: 'insertion',
  label: 'ii–V minore del target',
  explain: 'IIm7♭5–V7alt verso un target minore: mezzo diminuito + dominante alterata.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i =>
      canInsertBefore(chords, i) && MINOR_Q.includes(chords[i].quality)),
  apply: (chords, idx, ctx) => {
    const t = noteToSemitone(chords[idx].root);
    const two = makeChord(t + 2, 'm7b5', ctx, {
      inserted: true, technique: 'altered_dominant', techniqueLabel: 'Minor ii',
      function: 'Subdominant', transformLabel: 'iiø/x',
      transformExplain: `IIm7♭5 di ${chords[idx].symbol}: il ii del ii–V minore`,
    });
    const five = makeChord(t + 7, '7alt', ctx, {
      inserted: true, technique: 'altered_dominant', techniqueLabel: 'Altered Dominant',
      function: 'Dominant', transformLabel: 'V7alt/x',
      transformExplain: `V7alt di ${chords[idx].symbol}: massima tensione prima del minore`,
      annotation: `iiø–V7alt → ${chords[idx].symbol}`,
    });
    return [...chords.slice(0, idx), two, five, ...chords.slice(idx)];
  },
};

const subVApproach: Transform = {
  id: 'tritone_sub',
  kind: 'insertion',
  label: 'SubV del target',
  explain: 'Dominante un semitono sopra il target: il tritone sub che scende cromaticamente.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i => {
      if (!canInsertBefore(chords, i)) return false;
      const subSem = (noteToSemitone(chords[i].root) + 1) % 12;
      const prev = chords[i - 1];
      return !prev || noteToSemitone(prev.root) !== subSem;
    }),
  apply: (chords, idx, ctx) => {
    const target = chords[idx];
    const ins = makeChord(noteToSemitone(target.root) + 1, '7', ctx, {
      inserted: true, technique: 'tritone_sub', techniqueLabel: 'Tritone Sub',
      function: 'Dominant', transformLabel: 'SubV/x',
      transformExplain: `Dominante un semitono sopra ${target.symbol}: sub di tritono del suo V7`,
      annotation: `SubV → ${target.symbol}`,
    });
    return [...chords.slice(0, idx), ins, ...chords.slice(idx)];
  },
};

const backdoorIiV: Transform = {
  id: 'backdoor',
  kind: 'insertion',
  label: 'Backdoor ii–V',
  explain: 'IVm7–♭VII7 prima della tonica: la cadenza che entra "dalla porta sul retro".',
  findTargets: (chords, ctx) => {
    const last = chords.length - 1;
    if (!canInsertBefore(chords, last)) return [];
    const c = chords[last];
    const rel = (noteToSemitone(c.root) - ctx.keySemitone + 12) % 12;
    return rel === 0 && MAJOR_Q.includes(c.quality) ? [last] : [];
  },
  apply: (chords, idx, ctx) => {
    const ivm = makeChord(ctx.keySemitone + 5, 'm7', ctx, {
      inserted: true, technique: 'backdoor', techniqueLabel: 'Backdoor ii',
      function: 'Subdominant', degree: 'IVm', transformLabel: 'IVm7',
      transformExplain: 'IVm7: il ii della cadenza backdoor',
    });
    const bvii = makeChord(ctx.keySemitone + 10, '7', ctx, {
      inserted: true, technique: 'backdoor', techniqueLabel: 'Backdoor Dominant',
      function: 'Dominant', degree: 'bVII', transformLabel: '♭VII7',
      transformExplain: '♭VII7: il dominante backdoor che risolve alla tonica da sotto',
      annotation: `♭VII7 → ${chords[idx].symbol}`,
    });
    return [...chords.slice(0, idx), ivm, bvii, ...chords.slice(idx)];
  },
};

const chromaticApproach: Transform = {
  id: 'chromatic',
  kind: 'insertion',
  label: 'Approccio cromatico',
  explain: 'Stesso tipo di accordo un semitono sopra o sotto il target: planing cromatico gospel.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i => canInsertBefore(chords, i)),
  apply: (chords, idx, ctx, rng) => {
    const target = chords[idx];
    const dir = rng() < 0.5 ? 1 : -1;
    const ins = makeChord(noteToSemitone(target.root) + dir, target.quality, ctx, {
      inserted: true, technique: 'chromatic', techniqueLabel: 'Chromatic Approach',
      function: target.function, transformLabel: dir > 0 ? 'Chrom. da sopra' : 'Chrom. da sotto',
      transformExplain: `${target.quality} un semitono ${dir > 0 ? 'sopra' : 'sotto'} ${target.symbol}: scivolamento cromatico`,
    });
    return [...chords.slice(0, idx), ins, ...chords.slice(idx)];
  },
};

const susApproach: Transform = {
  id: 'sus',
  kind: 'insertion',
  label: 'Sospensione sus',
  explain: '7sus4 sulla stessa fondamentale prima del dominante: la sospensione che poi risolve.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i =>
      canInsertBefore(chords, i) && ['7', '9', '13', '7b9'].includes(chords[i].quality)),
  apply: (chords, idx, ctx) => {
    const target = chords[idx];
    const ins = makeChord(noteToSemitone(target.root), '7sus4', ctx, {
      inserted: true, technique: 'sus', techniqueLabel: 'Sus Suspension',
      function: 'Dominant', transformLabel: 'sus→3',
      transformExplain: `${target.root}7sus4 che risolve nel ${target.symbol}: quarta sospesa poi terza`,
    });
    return [...chords.slice(0, idx), ins, ...chords.slice(idx)];
  },
};

const tritoneSub: Transform = {
  id: 'tritone_sub',
  kind: 'substitution',
  label: 'Tritone sub',
  explain: 'Dominante sostituita con quella a un tritono: stessi 3ª e 7ª, basso cromatico.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i =>
      canSubstitute(chords, i) && DOM_Q.includes(chords[i].quality) && chords[i].quality !== '7sus4'),
  apply: (chords, idx, ctx, rng) => {
    const orig = chords[idx];
    const sub = makeChord(noteToSemitone(orig.root) + 6, rng() < 0.5 ? '7' : '9#11', ctx, {
      function: 'Dominant', technique: 'tritone_sub', techniqueLabel: 'Tritone Sub',
      transformOf: orig.symbol, transformLabel: 'SubV',
      transformExplain: `${orig.symbol} sostituito col dominante a un tritono: condividono 3ª e 7ª`,
      annotation: 'SubV',
    });
    return chords.map((c, i) => (i === idx ? sub : c));
  },
};

const vAlternatives: Transform = {
  id: 'backdoor',
  kind: 'substitution',
  label: 'Alternativa al V',
  explain: 'Il V7 sostituito con un derivato del diminuito: ♭VII7, IVm6, ♭VIm6 o IIm7♭5.',
  findTargets: (chords, ctx) =>
    chords.map((_, i) => i).filter(i =>
      canSubstitute(chords, i)
      && DOM_Q.includes(chords[i].quality)
      && (noteToSemitone(chords[i].root) - ctx.keySemitone + 12) % 12 === 7),
  apply: (chords, idx, ctx, rng) => {
    const orig = chords[idx];
    const options: Array<[number, string, string]> = [
      [ctx.keySemitone + 10, '9', '♭VII9 backdoor'],
      [ctx.keySemitone + 5, 'm6', 'IVm6'],
      [ctx.keySemitone + 8, 'm6', '♭VIm6'],
      [ctx.keySemitone + 2, 'm7b5', 'IIm7♭5'],
    ];
    const [sem, q, name] = options[Math.floor(rng() * options.length)];
    const sub = makeChord(sem, q, ctx, {
      function: 'Dominant', technique: 'backdoor', techniqueLabel: 'V Alternative',
      transformOf: orig.symbol, transformLabel: name,
      transformExplain: `${orig.symbol} sostituito con ${name}: stessa funzione dominante, colore dal diminuito`,
      annotation: `${name} → I`,
    });
    return chords.map((c, i) => (i === idx ? sub : c));
  },
};

const modalInterchange: Transform = {
  id: 'modal_interchange',
  kind: 'substitution',
  label: 'Modal interchange',
  explain: 'Accordo preso in prestito dal minore parallelo: IVm, ♭VImaj7, IIm7♭5.',
  findTargets: (chords, ctx) =>
    chords.map((_, i) => i).filter(i => {
      if (!canSubstitute(chords, i)) return false;
      const rel = (noteToSemitone(chords[i].root) - ctx.keySemitone + 12) % 12;
      const q = chords[i].quality;
      return (rel === 5 && MAJOR_Q.includes(q))
        || (rel === 9 && MINOR_Q.includes(q))
        || (rel === 2 && MINOR_Q.includes(q));
    }),
  apply: (chords, idx, ctx, rng) => {
    const orig = chords[idx];
    const rel = (noteToSemitone(orig.root) - ctx.keySemitone + 12) % 12;
    let sub: ResolvedChord;
    if (rel === 5) {
      sub = makeChord(ctx.keySemitone + 5, rng() < 0.5 ? 'm6' : 'm7', ctx,
        { degree: 'IVm', annotation: 'IVm — prestito dal minore' });
    } else if (rel === 9) {
      sub = makeChord(ctx.keySemitone + 8, 'maj7', ctx,
        { degree: 'bVI', annotation: '♭VImaj7 — prestito dal minore' });
    } else {
      sub = makeChord(ctx.keySemitone + 2, 'm7b5', ctx,
        { degree: 'iiø', annotation: 'IIm7♭5 — prestito dal minore' });
    }
    sub.technique = 'modal_interchange';
    sub.techniqueLabel = 'Modal Interchange';
    sub.function = orig.function;
    sub.transformOf = orig.symbol;
    sub.transformLabel = 'Borrowed';
    sub.transformExplain = `${orig.symbol} sostituito con un prestito dal minore parallelo`;
    return chords.map((c, i) => (i === idx ? sub : c));
  },
};

const COLOR_MAP: Record<string, string[]> = {
  maj: ['maj7', 'maj9', '6/9'],
  maj7: ['maj9', '6/9'],
  m: ['m7', 'm9'],
  m7: ['m9', 'm11'],
  '7': ['9', '13'],
};

const colorExtensions: Transform = {
  id: 'color',
  kind: 'decoration',
  label: 'Color / Estensioni',
  explain: 'Estensioni sull\'accordo: 9, 11, 13, 6/9. Colore senza cambiare funzione.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i =>
      !isTouched(chords[i]) && COLOR_MAP[chords[i].quality] !== undefined),
  apply: (chords, idx, ctx, rng) => {
    const orig = chords[idx];
    const opts = COLOR_MAP[orig.quality];
    const q = opts[Math.floor(rng() * opts.length)];
    const sub = makeChord(noteToSemitone(orig.root), q, ctx, {
      degree: orig.degree, function: orig.function,
      technique: orig.technique ?? 'color', techniqueLabel: orig.techniqueLabel,
      annotation: orig.annotation,
      transformOf: orig.symbol, transformLabel: 'Color',
      transformExplain: `${orig.symbol} arricchito a ${q}: stessa funzione, più colore`,
    });
    return chords.map((c, i) => (i === idx ? sub : c));
  },
};

const floatChord: Transform = {
  id: 'float_chord',
  kind: 'decoration',
  label: 'Float chord',
  explain: 'IVmaj7 sul basso del V (= V13sus): dominante sospesa senza tritono. Neo-soul.',
  findTargets: chords =>
    chords.map((_, i) => i).filter(i => {
      if (!canSubstitute(chords, i)) return false;
      const c = chords[i];
      const next = chords[i + 1];
      if (!DOM_Q.includes(c.quality) || c.quality === '7sus4' || !next) return false;
      return (noteToSemitone(next.root) - noteToSemitone(c.root) + 12) % 12 === 5;
    }),
  apply: (chords, idx, ctx) => {
    const orig = chords[idx];
    const bassSem = ((noteToSemitone(orig.root) % 12) + 12) % 12;
    const upperSem = (bassSem + 10) % 12;
    const bass = semitoneToNote(bassSem, ctx.preferFlat || [1, 3, 6, 8, 10].includes(bassSem));
    const upper = semitoneToNote(upperSem, ctx.preferFlat || [1, 3, 6, 8, 10].includes(upperSem));
    const sub: ResolvedChord = {
      degree: orig.degree,
      symbol: `${upper}maj7/${bass}`,
      root: bass,
      quality: '7sus4',
      notes: [bass, ...getChordNotes(upper, 'maj7')],
      function: 'Dominant',
      technique: 'float_chord',
      techniqueLabel: 'Float Chord',
      annotation: 'V13sus',
      transformOf: orig.symbol,
      transformLabel: 'Float',
      transformExplain: `${orig.symbol} sostituito con ${upper}maj7/${bass}: dominante sospesa senza tritono`,
    };
    return chords.map((c, i) => (i === idx ? sub : c));
  },
};

export const TRANSFORMS: Transform[] = [
  secondaryDominant,
  passingDim,
  iiVMajor,
  iiVMinor,
  subVApproach,
  backdoorIiV,
  chromaticApproach,
  susApproach,
  tritoneSub,
  vAlternatives,
  modalInterchange,
  colorExtensions,
  floatChord,
];

// Tecniche che agiscono da whitelist del motore (non filtrano i template)
export const TRANSFORM_TECHNIQUE_IDS: Technique[] = [
  'secondary_dominant', 'tritone_sub', 'altered_dominant', 'dim_pedal',
  'backdoor', 'chromatic', 'modal_interchange', 'sus', 'float_chord', 'color',
];

// ─── Motore ──────────────────────────────────────────────────────────────────

export interface EngineOptions {
  spice: number;          // 0–3
  allowed: Technique[];   // vuoto = tutte
  seed: number;
}

export interface EngineResult {
  chords: ResolvedChord[];
  applied: { label: string; explain: string }[];
}

export function applyTransforms(
  base: ResolvedChord[],
  key: string,
  mode: KeyMode,
  opts: EngineOptions,
): EngineResult {
  if (opts.spice <= 0 || base.length < 2) return { chords: base, applied: [] };
  const ctx = contextFor(key, mode);
  if (ctx.keySemitone < 0) return { chords: base, applied: [] };
  const rng = mulberry32(opts.seed);
  const budget = opts.spice === 1 ? 1
    : opts.spice === 2 ? 2 + Math.round(rng())
    : Math.ceil(base.length / 2);
  const pool = TRANSFORMS.filter(t => opts.allowed.length === 0 || opts.allowed.includes(t.id));
  let chords = base.map(c => ({ ...c }));
  const applied: EngineResult['applied'] = [];
  let attempts = 0;
  while (applied.length < budget && attempts < 40 && pool.length > 0) {
    attempts++;
    const t = pool[Math.floor(rng() * pool.length)];
    const targets = t.findTargets(chords, ctx);
    if (targets.length === 0) continue;
    const idx = targets[Math.floor(rng() * targets.length)];
    const next = t.apply(chords, idx, ctx, rng);
    if (!next) continue;
    chords = next;
    applied.push({ label: t.label, explain: t.explain });
  }
  return { chords, applied };
}


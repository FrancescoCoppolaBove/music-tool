# Chord Progression Transform Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare il Chord Progression Generator da libreria statica di template in un motore a trasformazioni con accordi di passaggio, slider Spice, Cicli di Modulazione e playback audio.

**Architecture:** I 214 template esistenti diventano "scheletri"; un nuovo motore puro e seedato (`transformEngine.ts`) li arricchisce con inserzioni (ii–V, dominanti secondarie, SubV, dim di passaggio, backdoor), sostituzioni (tritone sub, alternative al V, modal interchange) e decorazioni (float chord, estensioni). I Cicli di Modulazione sono generatori algoritmici separati. Il playback estrae il player Web Audio di ear-training in `shared/`.

**Tech Stack:** React + TypeScript + Vite, utils in `@shared/utils/musicTheory`, Web Audio (sample mp3 esistenti). Nessuna test suite nel repo (da CLAUDE.md): validazione = `npm run build` + `npm run lint` + smoke script `npx tsx` usa-e-getta + browser.

**Spec:** `docs/superpowers/specs/2026-07-26-chord-progression-transform-engine-design.md`

**Regole trasversali:**
- Ogni task termina con `npm run build` e `npm run lint` puliti prima del commit.
- Gli smoke script si creano in repo root (`smoke-progressions.ts`), si eseguono con `npx tsx smoke-progressions.ts` (tsx risolve i paths `@shared` dal tsconfig di root), e si **cancellano prima del commit**.
- Working dir: `/Users/astuser/Documents/Repos/music-tool`.

---

### Task 1: Estrarre i template in `services/templates.ts`

**Files:**
- Create: `src/features/chord-progression/services/templates.ts`
- Modify: `src/features/chord-progression/services/progressionGenerator.ts`

- [ ] **Step 1: Verificare i confini dell'array TEMPLATES**

Run: `grep -n "const TEMPLATES" src/features/chord-progression/services/progressionGenerator.ts && grep -n "function resolveDegree" src/features/chord-progression/services/progressionGenerator.ts`
Expected: `23:const TEMPLATES: ProgressionTemplate[] = [` e `3441:function resolveDegree`. Se i numeri differiscono, aggiornare i range degli step successivi di conseguenza. Verificare che la riga 3439 sia `];` con `sed -n '3439p' src/features/chord-progression/services/progressionGenerator.ts`.

- [ ] **Step 2: Creare `templates.ts` con l'array estratto**

```bash
{ echo "import type { ProgressionTemplate } from '../types/progression.types';"
  echo ""
  sed -n '23,3439p' src/features/chord-progression/services/progressionGenerator.ts | sed '1s/^const/export const/'
} > src/features/chord-progression/services/templates.ts
```

Verificare: la prima riga di codice è `export const TEMPLATES: ProgressionTemplate[] = [`, l'ultima è `];`.

- [ ] **Step 3: Rimuovere l'array dal generatore e importarlo**

In `progressionGenerator.ts`: cancellare le righe 20–3439 (dal commento `// ─── Progression Template Library ───` fino a `];` compreso, lasciando intatto `function resolveDegree`). Poi aggiungere all'inizio, dopo gli import esistenti:

```ts
import { TEMPLATES } from './templates';
```

Rimuovere dagli import di `../types/progression.types` i tipi rimasti inutilizzati (il build lo segnala: probabilmente `ProgressionTemplate` resta usato solo in `templates.ts`).

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: exit 0, nessun warning.

- [ ] **Step 5: Commit**

```bash
git add src/features/chord-progression/services/
git commit -m "refactor(chord-progression): extract TEMPLATES into services/templates.ts"
```

---

### Task 2: Estendere i tipi + nuova tecnica `color`

**Files:**
- Modify: `src/features/chord-progression/types/progression.types.ts`
- Modify: `src/features/chord-progression/services/progressionGenerator.ts`
- Modify: `src/features/chord-progression/components/ProgressionSettings.tsx:17-35`
- Modify: `src/features/chord-progression/components/ProgressionDisplay.tsx:124-142`

- [ ] **Step 1: Estendere `progression.types.ts`**

Aggiungere `'color'` alla union `Technique` (dopo `'flamenco'`):

```ts
  | 'flamenco'
  | 'color';
```

Estendere `ResolvedChord` con i campi del motore:

```ts
export interface ResolvedChord {
  degree: string;
  symbol: string;
  root: string;
  quality: string;
  notes: string[];
  technique?: Technique;
  techniqueLabel?: string;
  function: string;
  annotation?: string;
  inserted?: boolean;        // accordo di passaggio aggiunto dal motore
  transformOf?: string;      // simbolo originale se sostituito (es. "G7")
  transformLabel?: string;   // es. "SubV", "Passing dim"
  transformExplain?: string; // spiegazione della mossa per il tooltip
}
```

Estendere `GeneratedProgression`:

```ts
export interface GeneratedProgression {
  id: string;
  template: ProgressionTemplate;
  key: string;
  chords: ResolvedChord[];       // versione arricchita (== baseChords se spice 0)
  baseChords: ResolvedChord[];   // scheletro risolto
  seed: number;
  appliedTransforms: { label: string; explain: string }[];
  description: string;
}
```

- [ ] **Step 2: Aggiornare `generateProgressions` per compilare (placeholder)**

In `progressionGenerator.ts`, nel `results.push({...})`:

```ts
    results.push({
      id: String(id++),
      template,
      key,
      chords,
      baseChords: chords,
      seed: 0,
      appliedTransforms: [],
      description: template.description,
    });
```

E in `getAvailableTechniques()` aggiungere in coda:

```ts
    { id: 'color',             label: 'Color / Estensioni',     description: 'Arricchisce le qualità: maj7→maj9/6-9, m7→m9/m11, V7→13. Colore senza cambiare funzione.' },
```

- [ ] **Step 3: Aggiungere `color` alle mappe colori dei componenti**

In `ProgressionSettings.tsx` (oggetto `TECHNIQUE_COLORS`) e in `ProgressionDisplay.tsx` (oggetto `TECHNIQUE_COLORS`), aggiungere:

```ts
  color: '#eab308',
```

- [ ] **Step 4: Build + lint + commit**

Run: `npm run build && npm run lint`
Expected: exit 0.

```bash
git add src/features/chord-progression/
git commit -m "feat(chord-progression): extend types for transform engine + color technique"
```

---

### Task 3: Motore — infrastruttura + prime 2 trasformazioni + integrazione

**Files:**
- Create: `src/features/chord-progression/services/transformEngine.ts`
- Modify: `src/features/chord-progression/services/progressionGenerator.ts`
- Modify: `src/features/chord-progression/hooks/useChordProgression.ts`

- [ ] **Step 1: Creare `transformEngine.ts` con infrastruttura e 2 trasformazioni**

```ts
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

export const TRANSFORMS: Transform[] = [
  secondaryDominant,
  passingDim,
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
```

- [ ] **Step 2: Integrare il motore in `generateProgressions`**

In `progressionGenerator.ts`:

```ts
import { applyTransforms, TRANSFORM_TECHNIQUE_IDS } from './transformEngine';
```

Estendere il filtro:

```ts
export interface ProgressionFilter {
  key: string;
  mode: KeyMode;
  length: number;
  style: HarmonyStyle | 'both';
  techniques: Technique[];
  spice: number;
  seed: number;
}
```

Nel corpo di `generateProgressions`: le tecniche "trasformazione" non filtrano più i template (diventano whitelist del motore); il filtro template usa solo le tecniche di stile (blues, gospel, ecc.):

```ts
export function generateProgressions(filter: ProgressionFilter): GeneratedProgression[] {
  const { key, mode, length, style, techniques, spice, seed } = filter;

  if (noteToSemitone(key) < 0) return [];

  const templateFilterTechniques = techniques.filter(t => !TRANSFORM_TECHNIQUE_IDS.includes(t));

  const results: GeneratedProgression[] = [];
  let id = 0;

  for (const template of TEMPLATES) {
    if (!template.lengths.includes(length)) continue;

    const templateMode = template.mode ?? 'major';
    if (templateMode !== 'both' && templateMode !== mode) continue;

    if (style !== 'both' && template.style !== style) continue;

    if (templateFilterTechniques.length > 0) {
      const hasOverlap = template.techniques.some(t => templateFilterTechniques.includes(t));
      if (!hasOverlap) continue;
    }

    const baseChords = template.chords.map(c => resolveChord(key, c, mode));
    const { chords, applied } = applyTransforms(baseChords, key, mode, {
      spice,
      allowed: techniques,
      seed: seed + id,
    });

    results.push({
      id: String(id++),
      template,
      key,
      chords,
      baseChords,
      seed,
      appliedTransforms: applied,
      description: template.description,
    });
  }

  return results;
}
```

Aggiungere anche la funzione per rigenerare una singola card:

```ts
export function regenerateProgression(
  prog: GeneratedProgression,
  mode: KeyMode,
  techniques: Technique[],
  spice: number,
  newSeed: number,
): GeneratedProgression {
  const { chords, applied } = applyTransforms(prog.baseChords, prog.key, mode, {
    spice,
    allowed: techniques,
    seed: newSeed,
  });
  return { ...prog, chords, seed: newSeed, appliedTransforms: applied };
}
```

- [ ] **Step 3: Aggiornare l'hook per il nuovo filtro (senza UI)**

In `useChordProgression.ts`:

```ts
interface SessionState { key: string; mode: KeyMode; length: number; style: HarmonyStyle | 'both'; techniques: Technique[]; spice: number }
```

Dopo `const [techniques, setTechniques] = ...`:

```ts
  const [spice, setSpice] = useState<number>(saved.current?.spice ?? 1);
```

`generate` diventa:

```ts
  const generate = useCallback(() => {
    const filter: ProgressionFilter = {
      key, mode, length, style, techniques,
      spice,
      seed: Math.floor(Math.random() * 1_000_000_000),
    };
    const r = generateProgressions(filter);
    setResults(r);
    setSelectedId(r[0]?.id ?? null);
  }, [key, mode, length, style, techniques, spice]);
```

Persistenza — l'effect diventa:

```ts
  useEffect(() => {
    storageSet<SessionState>(SESSION_KEY, { key, mode, length, style, techniques, spice });
  }, [key, mode, length, style, techniques, spice]);
```

Nel `return` dell'hook aggiungere `spice, setSpice`.

- [ ] **Step 4: Smoke script**

Creare `smoke-progressions.ts` in repo root:

```ts
import { generateProgressions } from './src/features/chord-progression/services/progressionGenerator';

const filter = { key: 'C', mode: 'major' as const, length: 4, style: 'both' as const, techniques: [], spice: 2, seed: 42 };
const r1 = generateProgressions(filter);
const r2 = generateProgressions(filter);

console.log(`${r1.length} risultati`);
if (r1.length === 0) throw new Error('nessun risultato');
if (JSON.stringify(r1) !== JSON.stringify(r2)) throw new Error('non deterministico a parità di seed');

const transformed = r1.filter(p => p.appliedTransforms.length > 0);
console.log(`${transformed.length} arricchiti`);
if (transformed.length === 0) throw new Error('nessuna trasformazione applicata con spice 2');

for (const p of r1) {
  const lastBase = p.baseChords[p.baseChords.length - 1];
  const lastEnriched = p.chords[p.chords.length - 1];
  if (lastBase.root !== lastEnriched.root) throw new Error(`ultimo accordo cambiato in ${p.template.name}`);
  for (let i = 0; i < p.chords.length - 1; i++) {
    if ((p.chords[i].inserted || p.chords[i].transformOf) && (p.chords[i + 1].inserted || p.chords[i + 1].transformOf)) {
      throw new Error(`trasformazioni consecutive in ${p.template.name}`);
    }
  }
  // NB: questo check vale solo finché esistono solo inserzioni singole (Task 3).
  // Dal Task 4 i ii–V inseriscono coppie legittime di accordi adiacenti: rimuoverlo.
}

for (const p of transformed.slice(0, 5)) {
  console.log(`${p.template.name}: ${p.baseChords.map(c => c.symbol).join(' ')} → ${p.chords.map(c => c.symbol).join(' ')} [${p.appliedTransforms.map(t => t.label).join(', ')}]`);
}
console.log('OK');
```

Run: `npx tsx smoke-progressions.ts`
Expected: stampa i risultati e `OK`. (Se tsx non risolvesse `@shared`, verificare con `npm run build` e provare nel browser — ma tsx 4.x legge i paths dal tsconfig di root.)

- [ ] **Step 5: Build + lint, rimuovere lo smoke, commit**

```bash
npm run build && npm run lint
rm smoke-progressions.ts
git add src/features/chord-progression/
git commit -m "feat(chord-progression): transform engine core with secondary dominant + passing dim"
```

---

### Task 4: Trasformazioni di inserzione rimanenti

**Files:**
- Modify: `src/features/chord-progression/services/transformEngine.ts`

- [ ] **Step 1: Aggiungere le 5 trasformazioni di inserzione**

In `transformEngine.ts`, dopo `passingDim` e prima di `TRANSFORMS`:

```ts
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
```

Aggiornare il registro:

```ts
export const TRANSFORMS: Transform[] = [
  secondaryDominant,
  passingDim,
  iiVMajor,
  iiVMinor,
  subVApproach,
  backdoorIiV,
  chromaticApproach,
  susApproach,
];
```

- [ ] **Step 2: Smoke script**

Ricreare `smoke-progressions.ts` (stesso contenuto del Task 3 Step 4, **rimuovendo il check delle "trasformazioni consecutive"** — i ii–V inseriscono coppie adiacenti legittime — e aggiungendo questo blocco prima di `console.log('OK')`):

```ts
const labels = new Set(r1.flatMap(p => p.appliedTransforms.map(t => t.label)));
console.log('Trasformazioni viste:', Array.from(labels).join(' | '));
```

Run: `npx tsx smoke-progressions.ts`
Expected: `OK`, e con seed diversi (modificare `seed: 42` in più run) compaiono le nuove label.

- [ ] **Step 3: Build + lint, rimuovere lo smoke, commit**

```bash
npm run build && npm run lint
rm smoke-progressions.ts
git add src/features/chord-progression/services/transformEngine.ts
git commit -m "feat(chord-progression): insertion transforms (ii-V, subV, backdoor, chromatic, sus)"
```

---

### Task 5: Trasformazioni di sostituzione e decorazione

**Files:**
- Modify: `src/features/chord-progression/services/transformEngine.ts`

- [ ] **Step 1: Aggiungere le 5 trasformazioni**

Dopo `susApproach`, prima di `TRANSFORMS`:

```ts
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
    const preferFlat = ctx.preferFlat || [1, 3, 6, 8, 10].includes(upperSem);
    const bass = semitoneToNote(bassSem, ctx.preferFlat || [1, 3, 6, 8, 10].includes(bassSem));
    const upper = semitoneToNote(upperSem, preferFlat);
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
```

Registro finale:

```ts
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
```

- [ ] **Step 2: Smoke script**

Ricreare `smoke-progressions.ts` come al Task 4 Step 2 e aggiungere prima di `console.log('OK')`:

```ts
for (const p of r1) {
  for (const c of p.chords) {
    if (c.notes.length === 0) throw new Error(`accordo senza note: ${c.symbol} in ${p.template.name}`);
  }
}
const spice3 = generateProgressions({ ...filter, spice: 3, seed: 7 });
console.log('spice3 esempio:', spice3[0].chords.map(c => c.symbol).join(' '));
```

Run: `npx tsx smoke-progressions.ts`
Expected: `OK`, note presenti per ogni accordo (il float chord ha 5 note).

- [ ] **Step 3: Build + lint, rimuovere lo smoke, commit**

```bash
npm run build && npm run lint
rm smoke-progressions.ts
git add src/features/chord-progression/services/transformEngine.ts
git commit -m "feat(chord-progression): substitution + decoration transforms (subV, V-alternatives, borrowed, color, float)"
```

---

### Task 6: UI Settings — slider Spice + rigenerazione varianti

**Files:**
- Modify: `src/features/chord-progression/hooks/useChordProgression.ts`
- Modify: `src/features/chord-progression/components/ProgressionSettings.tsx`
- Modify: `src/features/chord-progression/ChordProgressionFeature.tsx`

- [ ] **Step 1: `regenerateVariant` nell'hook**

In `useChordProgression.ts`:

```ts
import { generateProgressions, regenerateProgression, getAvailableTechniques, type ProgressionFilter } from '../services/progressionGenerator';
```

Dopo `generate`:

```ts
  const regenerateVariant = useCallback((id: string) => {
    setResults(prev => prev.map(p => p.id === id
      ? regenerateProgression(p, mode, techniques, spice, Math.floor(Math.random() * 1_000_000_000))
      : p));
  }, [mode, techniques, spice]);
```

Aggiungere `regenerateVariant` al `return`.

- [ ] **Step 2: Slider Spice in `ProgressionSettings.tsx`**

Aggiungere alle props (interfaccia `Props` **e** destrutturazione nella firma del componente):

```ts
  spice: number;
  setSpice: (s: number) => void;
```

Costante in cima al file:

```ts
const SPICE_LEVELS = [
  { value: 0, label: 'Scheletro', emoji: '📄' },
  { value: 1, label: 'Leggero',  emoji: '🌶' },
  { value: 2, label: 'Medio',    emoji: '🌶🌶' },
  { value: 3, label: 'Massimo',  emoji: '🌶🌶🌶' },
];
```

Nuovo blocco JSX dopo il selettore Style (dentro Row 1) o come riga a sé prima dei Technique filters:

```tsx
      {/* Spice level */}
      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
          Spice <span style={{ color: '#4b5563' }}>(quante trasformazioni applica il motore)</span>
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SPICE_LEVELS.map(s => {
            const isOn = spice === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSpice(s.value)}
                style={{
                  padding: '6px 16px',
                  background: isOn ? '#dc262630' : '#0d1117',
                  border: `1px solid ${isOn ? '#ef4444' : '#30363d'}`,
                  borderRadius: 20,
                  color: isOn ? '#fca5a5' : '#6b7280',
                  fontSize: 13, cursor: 'pointer',
                  fontWeight: isOn ? 700 : 400,
                }}
              >
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>
      </div>
```

Aggiornare anche l'etichetta dei filtri tecnica per il nuovo significato:

```tsx
          <label style={{ fontSize: 12, color: '#8b949e' }}>
            Harmony Techniques <span style={{ color: '#4b5563' }}>(filtrano i template di stile e limitano le mosse del motore; nessuna = tutte)</span>
          </label>
```

- [ ] **Step 3: Collegare nel feature component**

In `ChordProgressionFeature.tsx`, destrutturare `spice, setSpice, regenerateVariant` dall'hook e passare `spice={spice} setSpice={setSpice}` a `ProgressionSettings`. (`regenerateVariant` verrà passato al display nel Task 7 — per ora basta destrutturarlo senza usarlo, oppure passarlo già se il Task 7 è imminente; per il build pulito con `noUnusedLocals: false` non è un problema.)

- [ ] **Step 4: Build + lint + verifica browser + commit**

Run: `npm run build && npm run lint`
Poi `npm run dev`, aprire http://localhost:3000, tab Chord Progression: verificare che lo slider Spice appaia, che Generate con Spice > 0 produca progressioni con accordi in più rispetto ai nomi dei template.

```bash
git add src/features/chord-progression/
git commit -m "feat(chord-progression): spice level UI + per-card variant regeneration hook"
```

---

### Task 7: UI Display — toggle Base/Arricchita, badge, ↻ varia

**Files:**
- Modify: `src/features/chord-progression/components/ProgressionDisplay.tsx`
- Modify: `src/features/chord-progression/ChordProgressionFeature.tsx`

- [ ] **Step 1: Estendere le props e il componente principale**

In `ProgressionDisplay.tsx`:

```ts
import { useState } from 'react';

interface ProgressionDisplayProps {
  results: GeneratedProgression[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRegenerate: (id: string) => void;
}

export default function ProgressionDisplay({ results, selectedId, onSelect, onRegenerate }: ProgressionDisplayProps) {
```

e passare `onRegenerate` a `ProgressionDetail`:

```tsx
      {selected && <ProgressionDetail progression={selected} onRegenerate={onRegenerate} />}
```

- [ ] **Step 2: Riscrivere `ProgressionDetail`**

Sostituire la funzione `ProgressionDetail` con:

```tsx
function ProgressionDetail({ progression, onRegenerate }: {
  progression: GeneratedProgression;
  onRegenerate: (id: string) => void;
}) {
  const { template, chords, baseChords, key, appliedTransforms } = progression;
  const [showEnriched, setShowEnriched] = useState(true);

  const hasTransforms = appliedTransforms.length > 0;
  const displayChords = hasTransforms && !showEnriched ? baseChords : chords;

  const uniqueTechniques = Array.from(new Set(
    displayChords.flatMap(c => c.techniqueLabel ? [c.techniqueLabel] : [])
  ));

  return (
    <div style={{
      background: '#161b22', border: '1px solid #7c3aed40',
      borderRadius: 12, padding: '20px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Key of {key} · {displayChords.length} chords · {template.style}</div>
          <h3 style={{ margin: 0, fontSize: 20, color: '#e6edf3' }}>{template.name}</h3>
          <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>{template.description}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Inspired by</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {template.artists.slice(0, 4).map(a => (
              <span key={a} style={{
                padding: '1px 7px', background: '#1c2128', border: '1px solid #30363d',
                borderRadius: 12, fontSize: 11, color: '#8b949e',
              }}>{a}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Feel + controlli variante */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{
          padding: '3px 10px', background: '#7c3aed20', border: '1px solid #7c3aed',
          borderRadius: 6, fontSize: 12, color: '#c4b5fd', fontStyle: 'italic',
        }}>
          🎭 {template.feel}
        </span>

        {hasTransforms && (
          <>
            <div style={{ display: 'flex', border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
              {(['Base', 'Arricchita'] as const).map(lbl => {
                const isOn = (lbl === 'Arricchita') === showEnriched;
                return (
                  <button
                    key={lbl}
                    onClick={() => setShowEnriched(lbl === 'Arricchita')}
                    style={{
                      padding: '4px 12px', fontSize: 12, cursor: 'pointer', border: 'none',
                      background: isOn ? '#7c3aed' : '#0d1117',
                      color: isOn ? '#fff' : '#6b7280', fontWeight: isOn ? 700 : 400,
                    }}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onRegenerate(progression.id)}
              title="Rigenera le trasformazioni con un nuovo seed"
              style={{
                padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 6, color: '#8b949e',
              }}
            >
              ↻ Varia
            </button>
          </>
        )}
      </div>

      {/* Chord blocks */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {displayChords.map((chord, i) => (
          <ChordBlock key={`${progression.seed}-${showEnriched}-${i}`} chord={chord} index={i + 1} total={displayChords.length} />
        ))}
      </div>

      {/* Mosse applicate dal motore */}
      {hasTransforms && showEnriched && (
        <div style={{ borderTop: '1px solid #30363d', paddingTop: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>🌶 Mosse del motore:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {appliedTransforms.map((t, i) => (
              <span key={i} title={t.explain} style={{
                padding: '3px 10px', background: '#dc262615', border: '1px solid #ef444455',
                borderRadius: 5, fontSize: 12, color: '#fca5a5', cursor: 'help',
              }}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Techniques used */}
      {uniqueTechniques.length > 0 && (
        <div style={{ borderTop: '1px solid #30363d', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Techniques used in this progression:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {uniqueTechniques.map(t => (
              <span key={t} style={{
                padding: '3px 10px', background: '#1c2128', border: '1px solid #30363d',
                borderRadius: 5, fontSize: 12, color: '#8b949e',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Scale suggestions ──────────────────────────────────────────────── */}
      <ScaleMap chords={displayChords} />

      {/* Chord tones */}
      <div style={{ borderTop: '1px solid #30363d', paddingTop: 12, marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Chord tones:</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {displayChords.map((chord, i) => (
            <div key={i} style={{ minWidth: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', fontFamily: 'monospace', marginBottom: 4 }}>
                {chord.symbol}
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {chord.notes.slice(0, 6).map((n, j) => (
                  <span key={j} style={{
                    padding: '1px 5px', background: '#1c2128', borderRadius: 3,
                    fontSize: 10, color: '#8b949e', fontFamily: 'monospace',
                  }}>{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Aggiornare `ChordBlock` per gli accordi trasformati**

Nella funzione `ChordBlock`, sostituire il container div di apertura e aggiungere i badge. Il nuovo inizio del componente:

```tsx
function ChordBlock({ chord, index, total }: { chord: ResolvedChord; index: number; total: number }) {
  const techniqueColor = chord.technique ? TECHNIQUE_COLORS[chord.technique] : undefined;
  const functionColor = FUNCTION_COLORS[chord.function] ?? '#6b7280';
  const scales = getScalesForQuality(chord.quality);
  const primaryScale = scales.find(s => s.isPrimary);
  const isTransformed = !!chord.inserted || !!chord.transformOf;

  return (
    <div
      title={chord.transformExplain}
      style={{
        flex: '1 1 100px', minWidth: 90, maxWidth: 160,
        background: chord.inserted ? '#0d111780' : '#0d1117',
        border: `1px ${chord.inserted ? 'dashed' : 'solid'} ${techniqueColor ?? '#30363d'}`,
        borderRadius: 10, padding: '12px 12px 10px',
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      {/* Index */}
      <div style={{ position: 'absolute', top: 6, left: 9, fontSize: 10, color: '#4b5563' }}>
        {index}/{total}
      </div>

      {/* Badge trasformazione */}
      {isTransformed && chord.transformLabel && (
        <div style={{
          position: 'absolute', top: 4, right: 6,
          fontSize: 9, fontWeight: 700, color: techniqueColor ?? '#fca5a5',
          background: '#161b22', border: `1px solid ${techniqueColor ?? '#ef4444'}55`,
          borderRadius: 8, padding: '1px 6px',
        }}>
          {chord.inserted ? `+ ${chord.transformLabel}` : chord.transformLabel}
        </div>
      )}

      {/* Degree */}
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>{chord.degree}</div>

      {/* Chord symbol */}
      <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace', lineHeight: 1 }}>
        {chord.symbol}
      </div>

      {/* Era... (per sostituzioni) */}
      {chord.transformOf && (
        <div style={{ fontSize: 10, color: '#6b7280', textDecoration: 'line-through' }}>
          era {chord.transformOf}
        </div>
      )}
```

Il resto del componente (function badge, annotation, scale hint, freccia) resta invariato.

- [ ] **Step 4: Collegare `onRegenerate` nel feature**

In `ChordProgressionFeature.tsx`:

```tsx
      <ProgressionDisplay
        results={results}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRegenerate={regenerateVariant}
      />
```

- [ ] **Step 5: Build + lint + verifica browser + commit**

Run: `npm run build && npm run lint`
Browser: card selezionata mostra toggle Base/Arricchita quando ci sono mosse; accordi inseriti tratteggiati con badge `+ V7/x` ecc.; hover mostra la spiegazione; ↻ Varia cambia le mosse; le mosse sono elencate sotto i blocchi.

```bash
git add src/features/chord-progression/
git commit -m "feat(chord-progression): base/enriched toggle, transform badges, per-card regenerate"
```

---

### Task 8: Player audio condiviso `chordAudio.ts`

**Files:**
- Create: `src/shared/utils/chordAudio.ts`
- Modify: `src/features/ear-training/utils/audio-player.ts` (diventa shim)

Nota: 17 file importano `audio-player` — lo shim evita di toccarli tutti.

- [ ] **Step 1: Spostare il player in shared**

```bash
cp src/features/ear-training/utils/audio-player.ts src/shared/utils/chordAudio.ts
```

- [ ] **Step 2: Ridurre il vecchio file a shim**

Sostituire l'intero contenuto di `src/features/ear-training/utils/audio-player.ts` con:

```ts
export { AudioPlayer, audioPlayer } from '@shared/utils/chordAudio';
```

- [ ] **Step 3: Aggiungere voicing + sequenza a `chordAudio.ts`**

In coda a `src/shared/utils/chordAudio.ts`:

```ts
// ─── Voicing e sequenza di accordi (usati da Chord Progression) ──────────────

import { noteToSemitone } from './musicTheory';

/**
 * Voicing semplice: fondamentale all'ottava 2, le altre note ascendenti dall'ottava 3.
 * Le pitch class arrivano senza ottava (output di getChordNotes).
 */
export function voiceChord(pitchClasses: string[], baseOctave = 3): string[] {
  const voiced: string[] = [];
  let prev = -1;
  for (let i = 0; i < pitchClasses.length; i++) {
    const sem = noteToSemitone(pitchClasses[i]);
    if (sem < 0) continue;
    let abs = (i === 0 ? baseOctave - 1 : baseOctave) * 12 + sem;
    while (abs <= prev) abs += 12;
    if (abs >= 6 * 12) abs -= 12;
    voiced.push(`${pitchClasses[i]}${Math.floor(abs / 12)}`);
    prev = abs;
  }
  return voiced;
}

export interface SequenceHandle { stop: () => void }

/** Suona una sequenza di accordi, uno per battuta in 4/4. */
export function playChordSequence(
  chords: { notes: string[] }[],
  bpm: number,
  onChordStart?: (index: number) => void,
  onEnd?: () => void,
): SequenceHandle {
  let stopped = false;
  const timers: number[] = [];
  const barMs = (60_000 / bpm) * 4;

  chords.forEach((c, i) => {
    timers.push(window.setTimeout(() => {
      if (stopped) return;
      onChordStart?.(i);
      void audioPlayer.playChord(voiceChord(c.notes.slice(0, 5)));
    }, i * barMs));
  });
  timers.push(window.setTimeout(() => {
    if (!stopped) onEnd?.();
  }, chords.length * barMs));

  return {
    stop: () => {
      stopped = true;
      timers.forEach(t => clearTimeout(t));
      audioPlayer.stopAll();
      onEnd?.();
    },
  };
}
```

- [ ] **Step 4: Build + lint + verifica ear-training + commit**

Run: `npm run build && npm run lint`
Browser: aprire Ear Training e verificare che gli esercizi suonino ancora (lo shim re-esporta lo stesso singleton).

```bash
git add src/shared/utils/chordAudio.ts src/features/ear-training/utils/audio-player.ts
git commit -m "refactor(audio): extract shared chordAudio player with voicing + chord sequence"
```

---

### Task 9: Playback nella card progressione

**Files:**
- Modify: `src/features/chord-progression/components/ProgressionDisplay.tsx`

- [ ] **Step 1: Import e stato playback in `ProgressionDetail`**

In cima a `ProgressionDisplay.tsx`:

```ts
import { useEffect, useRef, useState } from 'react';
import { playChordSequence, type SequenceHandle } from '@shared/utils/chordAudio';
```

Dentro `ProgressionDetail`, dopo `const [showEnriched, ...]`:

```tsx
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [bpm, setBpm] = useState(90);
  const handleRef = useRef<SequenceHandle | null>(null);

  useEffect(() => () => handleRef.current?.stop(), []);
  useEffect(() => { handleRef.current?.stop(); }, [progression.id, progression.seed, showEnriched]);

  const isPlaying = playingIndex !== null;

  function togglePlay() {
    if (isPlaying) {
      handleRef.current?.stop();
      return;
    }
    handleRef.current = playChordSequence(
      displayChords,
      bpm,
      i => setPlayingIndex(i),
      () => setPlayingIndex(null),
    );
  }
```

- [ ] **Step 2: Controlli play nel blocco "Feel + controlli variante"**

Dopo il bottone ↻ Varia (dentro lo stesso flex row, ma fuori dal blocco `hasTransforms &&` così il play c'è sempre):

```tsx
        <button
          onClick={togglePlay}
          style={{
            padding: '4px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 700,
            background: isPlaying ? '#dc2626' : '#10b98130',
            border: `1px solid ${isPlaying ? '#ef4444' : '#10b981'}`,
            borderRadius: 6, color: isPlaying ? '#fff' : '#6ee7b7',
          }}
        >
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
        <label style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
          BPM
          <input
            type="number" min={40} max={200} value={bpm}
            onChange={e => setBpm(Number(e.target.value) || 90)}
            style={{
              width: 54, padding: '3px 6px', background: '#0d1117',
              border: '1px solid #30363d', borderRadius: 4, color: '#e6edf3', fontSize: 12,
            }}
          />
        </label>
```

- [ ] **Step 3: Evidenziare l'accordo in riproduzione**

`ChordBlock` riceve una nuova prop:

```tsx
        {displayChords.map((chord, i) => (
          <ChordBlock
            key={`${progression.seed}-${showEnriched}-${i}`}
            chord={chord} index={i + 1} total={displayChords.length}
            playing={playingIndex === i}
          />
        ))}
```

Firma e bordo di `ChordBlock`:

```tsx
function ChordBlock({ chord, index, total, playing = false }: {
  chord: ResolvedChord; index: number; total: number; playing?: boolean;
}) {
```

e nel style del container:

```tsx
        border: playing
          ? '2px solid #10b981'
          : `1px ${chord.inserted ? 'dashed' : 'solid'} ${techniqueColor ?? '#30363d'}`,
        boxShadow: playing ? '0 0 12px #10b98155' : undefined,
```

- [ ] **Step 4: Build + lint + verifica browser + commit**

Run: `npm run build && npm run lint`
Browser: ▶ suona la progressione un accordo per battuta, il blocco corrente si illumina, ⏹ ferma, cambiare card ferma il playback.

```bash
git add src/features/chord-progression/components/ProgressionDisplay.tsx
git commit -m "feat(chord-progression): audio playback with per-chord highlight and BPM control"
```

---

### Task 10: Servizio Cicli di Modulazione

**Files:**
- Create: `src/features/chord-progression/services/modulationCycles.ts`

- [ ] **Step 1: Creare il servizio con i 9 cicli**

```ts
import { noteToSemitone, semitoneToNote, getChordNotes } from '@shared/utils/musicTheory';
import { makeChord, contextFor, type KeyContext } from './transformEngine';
import type { ResolvedChord } from '../types/progression.types';

export interface CycleStep {
  key: string;                 // tonalità attraversata in questo passo
  label: string;               // es. "ii–V–I in B♭"
  chords: ResolvedChord[];
}

export interface ModulationCycleResult {
  id: string;
  name: string;
  description: string;
  steps: CycleStep[];
}

export interface CycleDef {
  id: string;
  name: string;
  description: string;
  source: string;              // da quale drill/brano viene
  defaultCycles: number;
  maxCycles: number;
  generate(startKey: string, cycles: number): ModulationCycleResult;
}

function keyName(sem: number, ctx: KeyContext): string {
  const s = ((sem % 12) + 12) % 12;
  return semitoneToNote(s, ctx.preferFlat || [1, 3, 6, 8, 10].includes(s));
}

function slashChord(upperSem: number, upperQuality: string, bassSem: number, ctx: KeyContext): ResolvedChord {
  const upper = keyName(upperSem, ctx);
  const bass = keyName(bassSem, ctx);
  const suffix = upperQuality === 'maj' ? '' : upperQuality;
  return {
    degree: '',
    symbol: `${upper}${suffix}/${bass}`,
    root: bass,
    quality: upperQuality,
    notes: [bass, ...getChordNotes(upper, upperQuality)],
    function: 'Color',
  };
}

export const MODULATION_CYCLES: CycleDef[] = [
  {
    id: 'dominant-chain',
    name: 'Catena di dominanti',
    description: 'Ogni dominante risolve una quarta sopra sul dominante successivo. Il ciclo delle quinte in versione infinita.',
    source: 'Anthropology (Parker) — bridge',
    defaultCycles: 12, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `${keyName(sem, ctx)}7 → ${keyName(sem + 5, ctx)}`,
          chords: [makeChord(sem, '7', ctx, { function: 'Dominant' })],
        });
        sem += 5;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'augmented-climb',
    name: 'Salita aumentata',
    description: 'I → I aug → I6 → I7: la quinta sale cromaticamente fino a formare il dominante, che risolve una quarta sopra.',
    source: 'Drill 2 — chain of dominants, versione ascendente',
    defaultCycles: 6, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `salita in ${keyName(sem, ctx)} → ${keyName(sem + 5, ctx)}`,
          chords: [
            makeChord(sem, 'maj', ctx, { function: 'Tonic' }),
            makeChord(sem, 'aug', ctx, { function: 'Color' }),
            makeChord(sem, '6', ctx, { function: 'Tonic' }),
            makeChord(sem, '7', ctx, { function: 'Dominant' }),
          ],
        });
        sem += 5;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'french-6th-descent',
    name: 'Discesa French 6th',
    description: 'I → Imaj7 → I7 → I7♭5: il 7♭5 (sesta francese) risolve un semitono sotto. Discesa cromatica epica, alla Mozart.',
    source: 'Drill 3 — the epic french 6th descent',
    defaultCycles: 6, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `${keyName(sem, ctx)} → ${keyName(sem - 1, ctx)}`,
          chords: [
            makeChord(sem, 'maj', ctx, { function: 'Tonic' }),
            makeChord(sem, 'maj7', ctx, { function: 'Tonic' }),
            makeChord(sem, '7', ctx, { function: 'Dominant' }),
            makeChord(sem, '7b5', ctx, { function: 'Dominant' }),
          ],
        });
        sem -= 1;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'minor-one-equals-four',
    name: 'Minore 1 = 4',
    description: 'Il minore di arrivo diventa il iv della nuova tonalità: iv → V7 → i, salendo per quinte.',
    source: 'Drill 4 — minor I=IV V arpeggio (Chopin op.28 n.4)',
    defaultCycles: 12, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'minor');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        const newTonic = sem + 7;
        steps.push({
          key: `${keyName(newTonic, ctx)}m`,
          label: `iv–V7–i in ${keyName(newTonic, ctx)}m`,
          chords: [
            makeChord(sem, 'm7', ctx, { degree: 'iv', function: 'Subdominant' }),
            makeChord(sem + 2, '7', ctx, { degree: 'V', function: 'Dominant' }),
            makeChord(newTonic, 'm', ctx, { degree: 'i', function: 'Tonic' }),
          ],
        });
        sem = newTonic;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'beethoven-one-equals-two',
    name: 'Beethoven 1 = 2',
    description: 'ii–V–I dove il I diventa il nuovo ii: discesa per toni interi. Sinfonia n.7, Allegretto (e "Four" di Miles).',
    source: 'Drill 5 — Beethoven I=II V I',
    defaultCycles: 6, maxCycles: 6,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let two = ctx.keySemitone; // startKey è il primo accordo (il ii)
      for (let i = 0; i < cycles; i++) {
        const tonic = two - 2;
        steps.push({
          key: keyName(tonic, ctx),
          label: `ii–V–I in ${keyName(tonic, ctx)}`,
          chords: [
            makeChord(two, 'm7', ctx, { degree: 'ii', function: 'Subdominant' }),
            makeChord(two + 5, '7', ctx, { degree: 'V', function: 'Dominant' }),
            makeChord(tonic, 'maj', ctx, { degree: 'I', function: 'Tonic' }),
          ],
        });
        two = tonic;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'michelle-descent',
    name: 'Discesa Michelle',
    description: 'Basso cromatico discendente dal minore, poi il V7sus risolve sul minore costruito sulla sua terza: si scende di un semitono a ogni giro.',
    source: 'Michelle (Beatles), resa infinita',
    defaultCycles: 6, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'minor');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: `${keyName(sem, ctx)}m`,
          label: `discesa in ${keyName(sem, ctx)}m → ${keyName(sem - 1, ctx)}m`,
          chords: [
            makeChord(sem, 'm', ctx, { degree: 'i', function: 'Tonic' }),
            makeChord(sem - 1, 'aug', ctx, { function: 'Color' }),
            slashChord(sem + 3, 'maj', sem - 2, ctx),
            makeChord(sem - 3, 'm7b5', ctx, { function: 'Subdominant' }),
            makeChord(sem - 4, 'maj7', ctx, { degree: 'VI', function: 'Subdominant' }),
            makeChord(sem - 5, '7sus4', ctx, { degree: 'V', function: 'Dominant' }),
            makeChord(sem - 5, '7', ctx, { degree: 'V', function: 'Dominant' }),
          ],
        });
        sem -= 1;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'satie-thirds',
    name: 'Satie per terze',
    description: 'Da un maggiore: dominante un semitono sotto → risolve al minore una terza sopra. Dal minore: dominante un tono sotto → maggiore una terza sopra.',
    source: 'Drill 7 — Satie\'s fast track to heaven',
    defaultCycles: 8, maxCycles: 24,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      let isMajor = true;
      for (let i = 0; i < cycles; i++) {
        const domSem = isMajor ? sem - 1 : sem - 2;
        const nextSem = domSem + 5;
        const nextIsMajor = !isMajor;
        steps.push({
          key: isMajor ? keyName(sem, ctx) : `${keyName(sem, ctx)}m`,
          label: `${keyName(sem, ctx)}${isMajor ? '' : 'm'} → ${keyName(nextSem, ctx)}${nextIsMajor ? '' : 'm'}`,
          chords: [
            makeChord(sem, isMajor ? 'maj' : 'm', ctx, { function: 'Tonic' }),
            makeChord(domSem, '7', ctx, { function: 'Dominant' }),
          ],
        });
        sem = nextSem;
        isMajor = nextIsMajor;
      }
      steps.push({
        key: isMajor ? keyName(sem, ctx) : `${keyName(sem, ctx)}m`,
        label: 'arrivo',
        chords: [makeChord(sem, isMajor ? 'maj' : 'm', ctx, { function: 'Tonic' })],
      });
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'crimson-steps',
    name: 'Crimson a gradini',
    description: 'I → ♭VII → V7/ii → ii, e il ii diventa il nuovo I maggiore: salita per toni interi con sospensioni surreali.',
    source: 'Drill 8 — The Court of the Crimson King',
    defaultCycles: 6, maxCycles: 6,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `${keyName(sem, ctx)} → ${keyName(sem + 2, ctx)}`,
          chords: [
            makeChord(sem, 'maj', ctx, { degree: 'I', function: 'Tonic' }),
            makeChord(sem - 2, 'maj', ctx, { degree: 'bVII', function: 'Subdominant' }),
            makeChord(sem - 3, '7', ctx, { degree: 'VI7', function: 'Dominant', annotation: 'V7/ii' }),
            makeChord(sem + 2, 'm', ctx, { degree: 'ii', function: 'Tonic', annotation: 'ii = nuovo I' }),
          ],
        });
        sem += 2;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'ascending-thirds-251',
    name: '2–5–1 per terze ascendenti',
    description: 'ii–V–I maggiore e minore alternati, modulando ogni volta sulla terza dell\'accordo di arrivo. Il "goat" dei drill di modulazione.',
    source: 'Drill 9 — Maxence (Michel Legrand)',
    defaultCycles: 8, maxCycles: 24,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      let isMajor = true;
      for (let i = 0; i < cycles; i++) {
        if (isMajor) {
          steps.push({
            key: keyName(sem, ctx),
            label: `ii–V–I in ${keyName(sem, ctx)}`,
            chords: [
              makeChord(sem + 2, 'm7', ctx, { degree: 'ii', function: 'Subdominant' }),
              makeChord(sem + 7, '7', ctx, { degree: 'V', function: 'Dominant' }),
              makeChord(sem, 'maj7', ctx, { degree: 'I', function: 'Tonic' }),
            ],
          });
          sem += 4;
        } else {
          steps.push({
            key: `${keyName(sem, ctx)}m`,
            label: `iiø–V–i in ${keyName(sem, ctx)}m`,
            chords: [
              makeChord(sem + 2, 'm7b5', ctx, { degree: 'iiø', function: 'Subdominant' }),
              makeChord(sem + 7, '7', ctx, { degree: 'V', function: 'Dominant' }),
              makeChord(sem, 'm7', ctx, { degree: 'i', function: 'Tonic' }),
            ],
          });
          sem += 3;
        }
        isMajor = !isMajor;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
];

export function generateCycle(cycleId: string, startKey: string, cycles: number): ModulationCycleResult | null {
  const def = MODULATION_CYCLES.find(c => c.id === cycleId);
  if (!def || noteToSemitone(startKey) < 0) return null;
  const n = Math.max(1, Math.min(cycles, def.maxCycles));
  return def.generate(startKey, n);
}
```

- [ ] **Step 2: Smoke script**

Creare `smoke-progressions.ts`:

```ts
import { MODULATION_CYCLES, generateCycle } from './src/features/chord-progression/services/modulationCycles';

for (const def of MODULATION_CYCLES) {
  const r = generateCycle(def.id, 'C', def.defaultCycles);
  if (!r) throw new Error(`generate fallita: ${def.id}`);
  if (r.steps.length < def.defaultCycles) throw new Error(`step mancanti: ${def.id}`);
  for (const s of r.steps) {
    for (const c of s.chords) {
      if (!c.symbol || c.notes.length === 0) throw new Error(`accordo rotto in ${def.id}: ${JSON.stringify(c)}`);
    }
  }
  console.log(`${def.name}: ${r.steps[0].label} | ${r.steps[0].chords.map(c => c.symbol).join(' ')} … (${r.steps.length} step)`);
}
console.log('OK');
```

Run: `npx tsx smoke-progressions.ts`
Expected: una riga per ciclo e `OK`. Controllare a vista: la catena di dominanti da C parte con `C7` e il secondo step è in F; Beethoven da B parte con `Bm7 E7 A`.

- [ ] **Step 3: Build + lint, rimuovere lo smoke, commit**

```bash
npm run build && npm run lint
rm smoke-progressions.ts
git add src/features/chord-progression/services/modulationCycles.ts
git commit -m "feat(chord-progression): 9 algorithmic modulation cycles from the lessons"
```

---

### Task 11: Componente Cicli di Modulazione + wiring

**Files:**
- Create: `src/features/chord-progression/components/ModulationCycles.tsx`
- Modify: `src/features/chord-progression/ChordProgressionFeature.tsx`

- [ ] **Step 1: Creare il componente**

```tsx
import { useMemo, useRef, useState, useEffect } from 'react';
import { MODULATION_CYCLES, generateCycle } from '../services/modulationCycles';
import { playChordSequence, type SequenceHandle } from '@shared/utils/chordAudio';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function ModulationCycles() {
  const [cycleId, setCycleId] = useState(MODULATION_CYCLES[0].id);
  const [startKey, setStartKey] = useState('C');
  const def = MODULATION_CYCLES.find(c => c.id === cycleId)!;
  const [cycles, setCycles] = useState(def.defaultCycles);
  const [playingFlatIndex, setPlayingFlatIndex] = useState<number | null>(null);
  const [bpm, setBpm] = useState(100);
  const handleRef = useRef<SequenceHandle | null>(null);

  const result = useMemo(
    () => generateCycle(cycleId, startKey, cycles),
    [cycleId, startKey, cycles],
  );

  useEffect(() => () => handleRef.current?.stop(), []);
  useEffect(() => { handleRef.current?.stop(); }, [cycleId, startKey, cycles]);

  const flatChords = useMemo(
    () => (result ? result.steps.flatMap(s => s.chords) : []),
    [result],
  );

  const isPlaying = playingFlatIndex !== null;

  function togglePlay() {
    if (isPlaying) {
      handleRef.current?.stop();
      return;
    }
    handleRef.current = playChordSequence(
      flatChords,
      bpm,
      i => setPlayingFlatIndex(i),
      () => setPlayingFlatIndex(null),
    );
  }

  function selectCycle(id: string) {
    setCycleId(id);
    const d = MODULATION_CYCLES.find(c => c.id === id)!;
    setCycles(d.defaultCycles);
  }

  let flatOffset = 0;

  return (
    <details open style={{
      background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
      padding: '14px 16px',
    }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
        🔄 Cicli di Modulazione — sequenze che attraversano le tonalità
      </summary>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Selettore ciclo */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MODULATION_CYCLES.map(c => {
            const isOn = c.id === cycleId;
            return (
              <button
                key={c.id}
                onClick={() => selectCycle(c.id)}
                title={c.description}
                style={{
                  padding: '6px 14px',
                  background: isOn ? '#7c3aed30' : '#0d1117',
                  border: `1px solid ${isOn ? '#7c3aed' : '#30363d'}`,
                  borderRadius: 20,
                  color: isOn ? '#c4b5fd' : '#6b7280',
                  fontSize: 13, cursor: 'pointer', fontWeight: isOn ? 700 : 400,
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Descrizione + fonte */}
        <div style={{ fontSize: 12, color: '#8b949e' }}>
          {def.description}
          <span style={{ color: '#4b5563' }}> — {def.source}</span>
        </div>

        {/* Controlli */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6 }}>
            Parti da
            <select
              value={startKey}
              onChange={e => setStartKey(e.target.value)}
              style={{
                padding: '5px 10px', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 6, color: '#e6edf3', fontSize: 13,
              }}
            >
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6 }}>
            Cicli
            <input
              type="number" min={1} max={def.maxCycles} value={cycles}
              onChange={e => setCycles(Number(e.target.value) || def.defaultCycles)}
              style={{
                width: 54, padding: '5px 8px', background: '#0d1117',
                border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13,
              }}
            />
          </label>
          <button
            onClick={togglePlay}
            style={{
              padding: '5px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 700,
              background: isPlaying ? '#dc2626' : '#10b98130',
              border: `1px solid ${isPlaying ? '#ef4444' : '#10b981'}`,
              borderRadius: 6, color: isPlaying ? '#fff' : '#6ee7b7',
            }}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
          <label style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            BPM
            <input
              type="number" min={40} max={200} value={bpm}
              onChange={e => setBpm(Number(e.target.value) || 100)}
              style={{
                width: 54, padding: '3px 6px', background: '#0d1117',
                border: '1px solid #30363d', borderRadius: 4, color: '#e6edf3', fontSize: 12,
              }}
            />
          </label>
        </div>

        {/* Step */}
        {result && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.steps.map((step, si) => {
              const stepOffset = flatOffset;
              flatOffset += step.chords.length;
              return (
                <div key={si} style={{
                  background: '#0d1117', border: '1px solid #21262d', borderRadius: 8,
                  padding: '10px 12px', minWidth: 120,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
                    {step.key}
                    <span style={{ color: '#4b5563', fontWeight: 400 }}> · {step.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {step.chords.map((c, ci) => {
                      const playing = playingFlatIndex === stepOffset + ci;
                      return (
                        <span key={ci} style={{
                          fontFamily: 'monospace', fontSize: 14, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 5,
                          background: playing ? '#10b98130' : '#161b22',
                          border: `1px solid ${playing ? '#10b981' : '#30363d'}`,
                          color: playing ? '#6ee7b7' : '#e6edf3',
                        }}>
                          {c.symbol}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Wiring nel feature**

In `ChordProgressionFeature.tsx`:

```tsx
import ModulationCycles from './components/ModulationCycles';
```

e nel JSX, tra `<ProgressionDisplay …/>` e `<CustomRomanInput …/>`:

```tsx
      {/* Cicli di Modulazione */}
      <ModulationCycles />
```

- [ ] **Step 3: Build + lint + verifica browser + commit**

Run: `npm run build && npm run lint`
Browser: la sezione appare, cambiare ciclo/tonalità/cicli rigenera, ▶ suona evidenziando gli accordi, le tonalità sono etichettate su ogni step.

```bash
git add src/features/chord-progression/
git commit -m "feat(chord-progression): Cicli di Modulazione UI with playback"
```

---

### Task 12: Nuovi template dalle lezioni

**Files:**
- Modify: `src/features/chord-progression/services/templates.ts`

- [ ] **Step 1: Verificare i duplicati**

Run: `grep -n "id: '" src/features/chord-progression/services/templates.ts | grep -iE "736|landing|v-alt|two-five-of|crimson|augmented|minor-ii-V-alt"`
Expected: nessun match (se un id esiste già, saltare quel template).

- [ ] **Step 2: Aggiungere i 16 template**

In coda all'array `TEMPLATES` (prima di `];`):

```ts
  // ── DALLE LEZIONI: GOSPEL LANDING / TURNAROUND ───────────────────────────
  {
    id: 'gospel-736-turnaround',
    name: '7–3–6 Turnaround',
    chords: [
      { degree: 'VII', quality: 'm7b5', function: 'Subdominant', technique: 'gospel', techniqueLabel: 'Gospel', annotation: 'iiø/vi' },
      { degree: 'III', quality: '7b9',  function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7♭9/vi' },
      { degree: 'VI',  quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['gospel', 'secondary_dominant'],
    description: 'Il turnaround gospel 7–3–6: mezzo diminuito e dominante secondaria che atterrano sul vi. "If you don\'t know it, you need to know it."',
    artists: ['Kirk Franklin', 'Cory Henry', 'Robert Glasper'],
    feel: 'Gospel turnaround',
    lengths: [3],
  },
  {
    id: 'gospel-736-full',
    name: '7–3–6 esteso (con ii–V)',
    chords: [
      { degree: 'VII', quality: 'm7b5', function: 'Subdominant', technique: 'gospel', techniqueLabel: 'Gospel', annotation: 'iiø/vi' },
      { degree: 'III', quality: '7b9',  function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7♭9/vi' },
      { degree: 'VI',  quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II',  quality: 'm9',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: '13',   function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: '6/9',  function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['gospel', 'secondary_dominant'],
    description: '7–3–6 gospel completato dal ii–V–I con estensioni: il giro di chiusura dei culti e del neo-soul.',
    artists: ['Kirk Franklin', 'Snarky Puppy', 'Cory Henry'],
    feel: 'Gospel full circle',
    lengths: [6],
  },
  {
    id: 'gospel-landing-3',
    name: 'Landing sul 3 (melody on top)',
    chords: [
      { degree: 'III', quality: 'm7',   function: 'Tonic',       technique: 'gospel', techniqueLabel: 'Gospel' },
      { degree: 'VI',  quality: '7b9',  function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7♭9/ii' },
      { degree: 'II',  quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: '7',    function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['gospel', 'secondary_dominant'],
    description: 'Con la melodia in cima puoi atterrare dove vuoi: qui la frase parte dal iii invece che dal I. Tecnica gospel dei landing chords.',
    artists: ['Aretha Franklin', 'Sam Cooke', 'PJ Morton'],
    feel: 'Gospel reharmonization',
    lengths: [5],
  },
  {
    id: 'gospel-landing-6',
    name: 'Landing sul 6 (melody on top)',
    chords: [
      { degree: 'VI', quality: 'm7',  function: 'Tonic',       technique: 'gospel', techniqueLabel: 'Gospel' },
      { degree: 'II', quality: 'm9',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: '13',  function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',  quality: '6/9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['gospel'],
    description: 'Stessa melodia, partenza dal vi: il landing chord alternativo più usato nel gospel. Il 6–2–5–1 con estensioni.',
    artists: ['PJ Morton', 'Kirk Franklin', 'D\'Angelo'],
    feel: 'Gospel soul loop',
    lengths: [4],
  },
  {
    id: 'gospel-landing-2',
    name: 'Landing sul 2 (melody on top)',
    chords: [
      { degree: 'II',  quality: 'm9',  function: 'Subdominant', technique: 'gospel', techniqueLabel: 'Gospel' },
      { degree: 'V',   quality: '13',  function: 'Dominant',    technique: 'diatonic' },
      { degree: 'III', quality: 'm7',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: '7b9', function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7♭9/ii' },
      { degree: 'II',  quality: 'm7',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: '7b9', function: 'Dominant',    technique: 'altered_dominant', techniqueLabel: 'Altered Dominant' },
    ],
    style: 'modern', techniques: ['gospel', 'secondary_dominant', 'altered_dominant'],
    description: 'Partenza dal ii e giro 2–5–3–6 che non risolve mai: il vamp gospel che tiene la chiesa in piedi.',
    artists: ['Cory Henry', 'Kirk Franklin', 'Snarky Puppy'],
    feel: 'Gospel vamp',
    lengths: [6],
  },

  // ── DALLE LEZIONI: ALTERNATIVE AL V DAL DIMINUITO ────────────────────────
  {
    id: 'v-alt-backdoor-9',
    name: 'Cadenza backdoor ♭VII9',
    chords: [
      { degree: 'II',   quality: 'm7',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: '9',   function: 'Dominant',    technique: 'backdoor', techniqueLabel: 'Backdoor Dominant', annotation: '♭VII9 → I' },
      { degree: 'I',    quality: '6/9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['backdoor'],
    description: 'Il ♭VII9 al posto del V7: entra in tonica "dalla porta sul retro". Derivato dal diminuito costruito sul V.',
    artists: ['Stevie Wonder', 'Jacob Collier', 'Bill Evans'],
    feel: 'Backdoor resolution',
    lengths: [3],
  },
  {
    id: 'v-alt-ivm6',
    name: 'IVm6 come dominante',
    chords: [
      { degree: 'II', quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV', quality: 'm6',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Modal Interchange', annotation: 'IVm6 → I (minore plagale)' },
      { degree: 'I',  quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'IVm6 al posto del V: stesse note guida del V7♭9, sapore da cadenza plagale minore. Beatles e standard a volontà.',
    artists: ['The Beatles', 'Radiohead', 'Bill Evans'],
    feel: 'Minor plagal cadence',
    lengths: [3],
  },
  {
    id: 'v-alt-bvim6',
    name: '♭VIm6 come dominante',
    chords: [
      { degree: 'IV',  quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVI', quality: 'm6',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Modal Interchange', annotation: '♭VIm6 → I' },
      { degree: 'I',   quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: '♭VIm6 (= Fø rivoltato) che risolve in tonica: l\'alternativa al V più sorprendente derivata dal diminuito.',
    artists: ['Jacob Collier', 'Brad Mehldau'],
    feel: 'Surprise dominant',
    lengths: [3],
  },
  {
    id: 'v-alt-iim7b5',
    name: 'IIm7♭5 come dominante',
    chords: [
      { degree: 'IV', quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'II', quality: 'm7b5', function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Modal Interchange', annotation: 'IIø → I' },
      { degree: 'I',  quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Il mezzo diminuito sul II che risolve direttamente in tonica: funzione dominante senza dominante.',
    artists: ['Bill Evans', 'Brad Mehldau', 'Snarky Puppy'],
    feel: 'Soft dominant motion',
    lengths: [3],
  },
  {
    id: 'v-alt-dim7',
    name: 'VII°7 come dominante',
    chords: [
      { degree: 'II',  quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'VII', quality: 'dim7', function: 'Dominant',    technique: 'dim_pedal', techniqueLabel: 'Diminished', annotation: 'VII°7 = V7♭9 senza fondamentale' },
      { degree: 'I',   quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['dim_pedal'],
    description: 'Il diminuito sulla sensibile al posto del V: quattro possibili bassi, stessa attrazione verso la tonica.',
    artists: ['Bach', 'Art Tatum', 'Jacob Collier'],
    feel: 'Leading-tone pull',
    lengths: [3],
  },

  // ── DALLE LEZIONI: ii–V ALTERNATIVI ──────────────────────────────────────
  {
    id: 'minor-ii-V-alt',
    name: 'ii–V minore alterato',
    chords: [
      { degree: 'II', quality: 'm7b5', function: 'Subdominant', technique: 'diatonic', annotation: 'iiø' },
      { degree: 'V',  quality: '7alt', function: 'Dominant',    technique: 'altered_dominant', techniqueLabel: 'Altered Dominant', annotation: 'V7alt (♭9 ♭13)' },
      { degree: 'I',  quality: 'm9',   function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['altered_dominant'],
    description: 'Il ii–V minore da manuale: mezzo diminuito e dominante alterata con ♭13 e ♯9. Come nella lezione: "how nicely does that lead us to that A minor".',
    artists: ['Bill Evans', 'Chet Baker', 'Kenny Barron'],
    feel: 'Minor jazz cadence',
    lengths: [3],
    mode: 'minor',
  },
  {
    id: 'two-five-of-IV',
    name: 'ii–V del IV',
    chords: [
      { degree: 'I',  quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'm7',   function: 'Subdominant', technique: 'secondary_dominant', techniqueLabel: 'Related ii', annotation: 'ii/IV' },
      { degree: 'I',  quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7/IV' },
      { degree: 'IV', quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['secondary_dominant'],
    description: 'Vm7–I7 che porta al IV: il ii–V interno più usato nei standard (e nella lezione sulle strand).',
    artists: ['Gershwin', 'Charlie Parker', 'Tom Misch'],
    feel: 'Motion to the IV',
    lengths: [4],
  },
  {
    id: 'two-five-of-IV-backdoor-return',
    name: 'ii–V del IV + ritorno backdoor',
    chords: [
      { degree: 'V',    quality: 'm7',   function: 'Subdominant', technique: 'secondary_dominant', techniqueLabel: 'Related ii', annotation: 'ii/IV' },
      { degree: 'I',    quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7/IV' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV',   quality: 'm7',   function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Modal Interchange', annotation: 'IVm7 backdoor ii' },
      { degree: 'bVII', quality: '7',    function: 'Dominant',    technique: 'backdoor', techniqueLabel: 'Backdoor Dominant', annotation: '♭VII7 → I' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['secondary_dominant', 'backdoor', 'modal_interchange'],
    description: 'Andata al IV col suo ii–V, ritorno in tonica con la cadenza backdoor: il giro completo delle strand in sei accordi.',
    artists: ['Stevie Wonder', 'Jobim', 'Snarky Puppy'],
    feel: 'There-and-back journey',
    lengths: [6],
  },

  // ── DALLE LEZIONI: MOVIMENTI CROMATICI IN TONALITÀ ───────────────────────
  {
    id: 'crimson-move',
    name: 'Crimson Move (I–♭VII–VI7–ii)',
    chords: [
      { degree: 'I',    quality: 'maj',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Modal Interchange', annotation: '♭VII borrowed' },
      { degree: 'VI',   quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7/ii' },
      { degree: 'II',   quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'secondary_dominant'],
    description: 'I → ♭VII → V7/ii → ii: il gradino armonico di "In the Court of the Crimson King". Con le sospensioni in melodia diventa surreale.',
    artists: ['King Crimson', 'Radiohead', 'Beatles'],
    feel: 'Prog step-up',
    lengths: [4],
  },
  {
    id: 'augmented-climb-to-IV',
    name: 'Salita aumentata verso il IV',
    chords: [
      { degree: 'I',  quality: 'maj',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'I',  quality: 'aug',  function: 'Color',       technique: 'chromatic', techniqueLabel: 'Chromatic', annotation: 'quinta che sale' },
      { degree: 'I',  quality: '6',    function: 'Tonic',       technique: 'chromatic', techniqueLabel: 'Chromatic' },
      { degree: 'I',  quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', techniqueLabel: 'Secondary Dominant', annotation: 'V7/IV' },
      { degree: 'IV', quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['chromatic', 'secondary_dominant'],
    description: 'La quinta del I sale cromaticamente (5 → ♯5 → 6 → ♭7) fino a farne il dominante del IV. Linea interna irresistibile.',
    artists: ['Beatles', 'Queen', 'Stevie Wonder'],
    feel: 'Rising inner line',
    lengths: [5],
  },
  {
    id: 'michelle-in-key',
    name: 'Discesa Michelle (in tonalità)',
    chords: [
      { degree: 'I',    quality: 'm',     function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VII',  quality: 'aug',   function: 'Color',       technique: 'chromatic', techniqueLabel: 'Chromatic', annotation: 'basso cromatico' },
      { degree: 'bIII', quality: 'maj',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',    quality: '7sus4', function: 'Dominant',    technique: 'sus', techniqueLabel: 'Sus Chord' },
      { degree: 'V',    quality: '7',     function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['chromatic', 'sus'],
    description: 'Il giro di "Michelle": basso che scende cromaticamente dal minore, sospensione sul V che poi risolve.',
    artists: ['The Beatles', 'Half Moon Run'],
    feel: 'Chromatic descent',
    lengths: [6],
    mode: 'minor',
  },
```

- [ ] **Step 3: Smoke script**

Creare `smoke-progressions.ts`:

```ts
import { generateProgressions } from './src/features/chord-progression/services/progressionGenerator';

const ids = ['gospel-736-turnaround', 'v-alt-ivm6', 'crimson-move', 'minor-ii-V-alt', 'michelle-in-key'];
for (const len of [3, 4, 5, 6]) {
  for (const mode of ['major', 'minor'] as const) {
    const r = generateProgressions({ key: 'C', mode, length: len, style: 'both', techniques: [], spice: 0, seed: 1 });
    for (const p of r) {
      if (ids.includes(p.template.id)) {
        console.log(`${p.template.id} [${mode}/${len}]: ${p.chords.map(c => c.symbol).join(' ')}`);
        for (const c of p.chords) {
          if (c.notes.length === 0) throw new Error(`accordo senza note: ${c.symbol} in ${p.template.id}`);
        }
      }
    }
  }
}
console.log('OK');
```

Run: `npx tsx smoke-progressions.ts`
Expected: i 5 template campione appaiono con simboli sensati (es. `gospel-736-turnaround` in C: `Bm7b5 E7b9 Am7`) e `OK`.

- [ ] **Step 4: Build + lint, rimuovere lo smoke, commit**

```bash
npm run build && npm run lint
rm smoke-progressions.ts
git add src/features/chord-progression/services/templates.ts
git commit -m "feat(chord-progression): 16 new templates from gospel/diminished/strand lessons"
```

---

### Task 13: Validazione finale

**Files:**
- Modify: `docs/superpowers/specs/2026-07-26-chord-progression-transform-engine-design.md` (riga Stato)

- [ ] **Step 1: Build + lint completi**

Run: `npm run build && npm run lint`
Expected: exit 0, zero warning.

- [ ] **Step 2: Giro completo nel browser**

`npm run dev` → http://localhost:3000 → Chord Progression:
1. Spice 0 → risultati identici al comportamento pre-refactor (soli scheletri).
2. Spice 2 → card con accordi tratteggiati, badge, mosse elencate; toggle Base/Arricchita funziona; ↻ Varia cambia le mosse.
3. ▶ Play su una card → suona con evidenziazione; BPM cambia il tempo.
4. Cicli di Modulazione → provare "Catena di dominanti" e "2–5–1 per terze"; playback ok.
5. Tecniche selezionate (es. solo Tritone Sub) → il motore applica solo quelle.
6. Ear Training → un esercizio suona ancora (verifica shim audio).
7. Tonalità con bemolli (Eb, Ab) e modo minore → simboli coerenti.

- [ ] **Step 3: Aggiornare lo stato della spec e commit finale**

Nella spec cambiare `**Stato:** Design approvato (in attesa di review scritta)` in `**Stato:** Implementato (2026-07-26)`.

```bash
git add docs/superpowers/specs/2026-07-26-chord-progression-transform-engine-design.md
git commit -m "docs: mark chord-progression transform engine spec as implemented"
```

---

## Note per l'esecutore

- **Nessuna test suite**: non creare framework di test; gli smoke script sono usa-e-getta e vanno cancellati prima di ogni commit.
- **Lint a zero warning**: `noUnusedLocals` è disattivato nel tsconfig ma ESLint è `--max-warnings 0`; rimuovere davvero gli import inutilizzati.
- **Semantica filtro tecniche (cambiata di proposito)**: le tecniche "trasformazione" (`TRANSFORM_TECHNIQUE_IDS`) non filtrano più i template — limitano le mosse del motore. Le tecniche di stile (blues, gospel, bossa_nova, flamenco, quartal, float_chord…) continuano a filtrare i template se non sono nella lista trasformazioni. Questo è il comportamento voluto dalla spec (whitelist).
- **Lunghezza**: con spice > 0 la progressione arricchita supera la lunghezza nominale selezionata: è intenzionale (gli accordi di passaggio si aggiungono allo scheletro).
- **`this` nei CycleDef**: i metodi `generate` usano `this.id/this.name` — sono method shorthand su object literal, funziona; se ESLint si lamenta, sostituire con i literal del def corrente.

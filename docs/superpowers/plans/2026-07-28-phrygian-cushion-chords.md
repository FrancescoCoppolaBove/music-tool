# Phrygian Cushion Chords Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~20 Phrygian Cushion Chord templates to the Chord Progression Generator and a Phrygian Cushion Explorer panel to the Modal Interchange feature.

**Architecture:** Templates extend `src/features/chord-progression/services/templates.ts` using existing degree/quality encoding. The Explorer is a new component + pure-function service inside `src/features/modal-interchange/`, mounted at the bottom of the existing `ModalInterchangeFeature.tsx`. No new types, no nav changes, no new routes.

**Tech Stack:** React + TypeScript, inline styles (no CSS modules), `@shared/utils/musicTheory` utilities (`noteToSemitone`, `semitoneToNote`, `notePreferFlat`, `getScaleNotes`, `MAJOR_DIATONIC_QUALITY`), `useGlobalKey()` context.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/features/chord-progression/services/templates.ts` | Modify | Add 20 new templates at the end of the `TEMPLATES` array |
| `src/features/modal-interchange/services/phrygianCushion.ts` | Create | Pure computation: parse degrees, compute cushion variants for all 3 levels |
| `src/features/modal-interchange/components/PhrygianCushionExplorer.tsx` | Create | UI: input field, preset buttons, 4-column grid (Original + Dorian + Aeolian + Phrygian) |
| `src/features/modal-interchange/ModalInterchangeFeature.tsx` | Modify | Import and mount `<PhrygianCushionExplorer />` above the `<details>` block at line ~282 |

---

## Theory Reference (for implementers)

The cushion formula: keep the **I chord** in the home key; take the same **diatonic ordinal position** of all other chords from a parallel flat-major source key.

| Cushion Level | Source key offset (below tonic) | Example (C major) | Mode name |
|---|---|---|---|
| Dorian   | T − 2 semitones | from Bb major | C Dorian |
| Aeolian  | T − 9 semitones | from Eb major | C Aeolian |
| Phrygian | T − 4 semitones | from Ab major | C Phrygian |

In C: Bb(IV)=Eb(♭III), Bb(V)=F(IV); Eb(IV)=Ab(♭VI), Eb(V)=Bb(♭VII); Ab(IV)=Db(♭II), Ab(V)=Eb(♭III).

For templates, cushion chords used as "IV/V substitutes" keep **major** quality; cushion chords used as "ii substitutes" get **m7** quality; cushion "V substitutes" get **7** quality.

---

## Task 1 — Tier 1 Templates: Direct Cushion Substitutions (12 templates)

**Files:**
- Modify: `src/features/chord-progression/services/templates.ts` (append to TEMPLATES array)

- [ ] **Step 1: Append the 12 Tier 1 templates**

Add the following block at the very end of the `TEMPLATES` array, just before the closing `];`:

```ts
  // ── PHRYGIAN CUSHION CHORDS ───────────────────────────────────────────────
  // Tier 1: Direct formula — keep I in home key, borrow IV and V from a
  // parallel flat-major source key (Bb=Dorian, Eb=Aeolian, Ab=Phrygian).

  // ── I–IV–V–I variants ──
  {
    id: 'cushion-i-iv-v-i-dorian',
    name: 'I–♭III–IV–I (Cushion Dorico)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bIII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭III prestato da Bb maggiore (IV di Bb) — Dorico' },
      { degree: 'IV',   quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'IV come V di Bb maggiore — funzione dominante cushion' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Cushion Dorico: IV e V vengono da Bb maggiore. ♭III (Eb) scurisce il colore, IV7 (F) risolve al tono. Effetto chiaroscuro tipico del video.',
    artists: ['Vulfpeck', 'Jacob Collier', 'Tom Misch', 'Cory Henry'],
    feel: 'Chiaroscuro Dorico',
    lengths: [4],
  },
  {
    id: 'cushion-i-iv-v-i-aeolian',
    name: 'I–♭VI–♭VII–I (Cushion Eolico)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VI prestato da Eb maggiore (IV di Eb) — Eolico' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VII come V di Eb maggiore — funzione dominante cushion' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Cushion Eolico: IV e V vengono da Eb maggiore. ♭VI (Ab) e ♭VII (Bb) creano un colore più scuro e cinematico rispetto al Dorico.',
    artists: ['Radiohead', 'Hans Zimmer', 'Thom Yorke', 'Bon Iver'],
    feel: 'Cinematico Eolico',
    lengths: [4],
  },
  {
    id: 'cushion-i-iv-v-i-phrygian',
    name: 'I–♭II–♭III–I (Cushion Frigio)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bII',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭II prestato da Ab maggiore (IV di Ab) — Frigio' },
      { degree: 'bIII', quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭III come V di Ab maggiore — colore massimamente scuro' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Cushion Frigio: IV e V vengono da Ab maggiore. ♭II (Db) è l\'accordo più drammatico — frigio puro, flamenco-jazz, prima risoluzione cromatica.',
    artists: ['Paco de Lucía', 'Chick Corea', 'Miles Davis', 'Tigran Hamasyan'],
    feel: 'Drammatico Frigio',
    lengths: [4],
  },

  // ── II–V–I variants (cushion IV as ii-sub, cushion V as V-sub) ──
  {
    id: 'cushion-ii-v-i-dorian',
    name: '♭IIIm7–IV7–I (Cushion Dorico II–V)',
    chords: [
      { degree: 'bIII', quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭IIIm7 = IV di Bb come sostituto ii — Dorico' },
      { degree: 'IV',   quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'IV7 = V di Bb come sostituto V — Dorico' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'II–V–I con cushion Dorico: ii (Dm) → ♭IIIm7 (Ebm7), V (G7) → IV7 (F7). Il cambio di colore è sottile — da Dorian/Vulfpeck.',
    artists: ['Vulfpeck', 'Cory Henry', 'Jacob Collier', 'Scary Pockets'],
    feel: 'Dorico ii–V riarmonizzato',
    lengths: [3],
  },
  {
    id: 'cushion-ii-v-i-aeolian',
    name: '♭VIm7–♭VII7–I (Cushion Eolico II–V)',
    chords: [
      { degree: 'bVI',  quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VIm7 = IV di Eb come sostituto ii — Eolico' },
      { degree: 'bVII', quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VII7 = V di Eb come sostituto V — Eolico' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'II–V–I con cushion Eolico: ii → ♭VIm7 (Abm7), V → ♭VII7 (Bb7). Si trova in molti standard — una delle sostituzioni più efficaci.',
    artists: ['Snarky Puppy', 'Ghost-Note', 'Anderson .Paak', 'D\'Angelo'],
    feel: 'Eolico ii–V funk-jazz',
    lengths: [3],
  },
  {
    id: 'cushion-ii-v-i-phrygian',
    name: '♭IIm7–♭III7–I (Cushion Frigio II–V)',
    chords: [
      { degree: 'bII',  quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭IIm7 = IV di Ab come sostituto ii — Frigio' },
      { degree: 'bIII', quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭III7 = V di Ab come sostituto V — Frigio' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'II–V–I con cushion Frigio: ii → ♭IIm7 (Dbm7), V → ♭III7 (Eb7). Colore frigio/spagnolo massimo — risoluzione cromatica dalla seconda piatta.',
    artists: ['Tigran Hamasyan', 'Chick Corea', 'Herbie Hancock', 'Iiro Rantala'],
    feel: 'Frigio ii–V drammatico',
    lengths: [3],
  },

  // ── I–V–vi–IV variants ──
  {
    id: 'cushion-pop-dorian',
    name: 'I–IV7–vi–♭IIImaj7 (Cushion Dorico Pop)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',   quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'V di Bb come sostituto del V originale — cushion Dorico' },
      { degree: 'VI',   quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bIII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'IV di Bb come sostituto del IV originale — cushion Dorico' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'I–V–vi–IV con cushion Dorico: V→IV7 (F7) e IV→♭IIImaj7 (Ebmaj7). Il giro pop acquista un colore funk-soul.',
    artists: ['Tom Misch', 'Cory Henry', 'Vulfpeck', 'Scary Pockets'],
    feel: 'Pop giro con colore Dorico',
    lengths: [4],
  },
  {
    id: 'cushion-pop-aeolian',
    name: 'I–♭VII7–vi–♭VImaj7 (Cushion Eolico Pop)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'V di Eb come sostituto del V originale — cushion Eolico' },
      { degree: 'VI',   quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'IV di Eb come sostituto del IV originale — cushion Eolico' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'I–V–vi–IV con cushion Eolico: V→♭VII7 (Bb7) e IV→♭VImaj7 (Abmaj7). Radiohead-territory — il giro pop diventa cinematico.',
    artists: ['Radiohead', 'Bon Iver', 'Frank Ocean', 'Sufjan Stevens'],
    feel: 'Pop giro cinematico Eolico',
    lengths: [4],
  },
  {
    id: 'cushion-pop-phrygian',
    name: 'I–♭III7–vi–♭IImaj7 (Cushion Frigio Pop)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bIII', quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'V di Ab come sostituto del V originale — cushion Frigio' },
      { degree: 'VI',   quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bII',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'IV di Ab come sostituto del IV originale — cushion Frigio' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'I–V–vi–IV con cushion Frigio: V→♭III7 (Eb7) e IV→♭IImaj7 (Dbmaj7). Colore neapolitano-frigio massimo nel giro pop.',
    artists: ['Tigran Hamasyan', 'Chick Corea', 'Iiro Rantala'],
    feel: 'Pop giro Frigio estremo',
    lengths: [4],
  },

  // ── Turnaround variants (ascending cushion ii-chains) ──
  {
    id: 'cushion-turnaround-dorian',
    name: '♭IIIm7–♭VIm7–IV7–I (Cushion Turnaround Dorico)',
    chords: [
      { degree: 'bIII', quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Dorico ii-sub (IV di Bb)' },
      { degree: 'bVI',  quality: 'm7',  function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Eolico ii-sub (IV di Eb) — catena discendente' },
      { degree: 'IV',   quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Dorico V-sub (V di Bb) — risolve al tono' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Turnaround con doppio ii-sub cushion (Dorico + Eolico) poi V cushion Dorico verso I. Catena cromatica discendente Eb–Ab–F–C.',
    artists: ['Jacob Collier', 'Vulfpeck', 'Snarky Puppy', 'Brad Mehldau'],
    feel: 'Turnaround cushion multi-livello',
    lengths: [4],
  },
  {
    id: 'cushion-turnaround-aeolian',
    name: '♭VIm7–♭IIm7–♭VII7–I (Cushion Turnaround Eolico)',
    chords: [
      { degree: 'bVI',  quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Eolico ii-sub (IV di Eb)' },
      { degree: 'bII',  quality: 'm7',  function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Frigio ii-sub (IV di Ab) — catena discendente' },
      { degree: 'bVII', quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Eolico V-sub (V di Eb)' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Turnaround con catena Eolico→Frigio poi V Eolico. Moto cromatico discendente Ab–Db–Bb–C con massimo scurimento prima del ritorno.',
    artists: ['Radiohead', 'Bon Iver', 'Kendrick Lamar', 'Flying Lotus'],
    feel: 'Turnaround Eolico oscuro',
    lengths: [4],
  },
  {
    id: 'cushion-turnaround-phrygian',
    name: '♭IIm7–♭Vm7–♭III7–I (Cushion Turnaround Frigio)',
    chords: [
      { degree: 'bII',  quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Frigio ii-sub (IV di Ab)' },
      { degree: 'bV',   quality: 'm7',  function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭V = tritone cushion — massima tensione' },
      { degree: 'bIII', quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Frigio V-sub (V di Ab) — risolve al tono' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Turnaround Frigio estremo: ♭IIm7–♭Vm7 (relazione di tritono!) poi ♭III7 → I. Tensione massima con accordo sul triton prima della risoluzione.',
    artists: ['Tigran Hamasyan', 'Brad Mehldau', 'Iiro Rantala', 'Craig Taborn'],
    feel: 'Turnaround Frigio estremo',
    lengths: [4],
  },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: `✓ built in` with no TypeScript errors. If you see `error TS...`, check that all `degree` values are strings present in `DEGREE_SEMITONE` (`'I'`, `'bII'`, `'II'`, `'bIII'`, `'III'`, `'IV'`, `'bV'`, `'V'`, `'bVI'`, `'VI'`, `'bVII'`, `'VII'`) and that `quality` strings are valid (e.g. `'maj7'`, `'m7'`, `'7'`).

- [ ] **Step 3: Commit**

```bash
git add src/features/chord-progression/services/templates.ts
git commit -m "feat(chord-progression): add Tier 1 Phrygian Cushion Chord templates (12)"
```

---

## Task 2 — Tier 2 Templates: Advanced & Elaborate Patterns (8 templates)

**Files:**
- Modify: `src/features/chord-progression/services/templates.ts` (continue appending)

- [ ] **Step 1: Append the 8 Tier 2 templates** (immediately after the Tier 1 block, before `];`)

```ts
  // ── Tier 2: Advanced cushion patterns ────────────────────────────────────

  {
    id: 'cushion-cascade-double',
    name: '♭VIm7–♭II7–♭IIIm7–IV7–Imaj9 (Doppia Catena Cushion)',
    chords: [
      { degree: 'bVI',  quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Frigio ii-sub (IV di Ab) — apre la catena' },
      { degree: 'bII',  quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Frigio V-sub (V di Ab) — chiude il primo II–V' },
      { degree: 'bIII', quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Dorico ii-sub (IV di Bb) — secondo II–V inizia' },
      { degree: 'IV',   quality: '7',   function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Dorico V-sub (V di Bb) — risolve al tono' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'II–V Frigio (♭VIm7–♭II7) che alimenta un II–V Dorico (♭IIIm7–IV7) verso Imaj9. Doppia catena di sostituzioni cushion — Jacob Collier / Brad Mehldau territory.',
    artists: ['Jacob Collier', 'Brad Mehldau', 'Vulfpeck', 'Robert Glasper'],
    feel: 'Doppia catena cushion multi-livello',
    lengths: [5],
  },
  {
    id: 'cushion-cinematic-descent',
    name: 'I–♭VI–♭III–♭VII7–I (Discesa Cinematica)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VI da Eb maggiore — Eolico' },
      { degree: 'bIII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭III da Bb maggiore — Dorico' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VII7 — Eolico V verso tono' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Discesa epica attraverso ♭VI (Eolico) → ♭III (Dorico) → ♭VII7 → I. Tre accordi prestati da due livelli diversi creano una curva emotiva cinematica. Hans Zimmer / film score territory.',
    artists: ['Hans Zimmer', 'Ennio Morricone', 'John Powell', 'Bon Iver'],
    feel: 'Discesa cinematica multi-cushion',
    lengths: [5],
  },
  {
    id: 'cushion-phrygian-drama',
    name: '♭IIm7–♭IIImaj7–IV–I (Apertura Frigia)',
    chords: [
      { degree: 'bII',  quality: 'm7',  function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭IIm7 = apertura Frigia — massima oscurità' },
      { degree: 'bIII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭III si alleggerisce — transizione Frigio→Dorico' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Apre con il colore più scuro (♭IIm7 frigio), poi si alleggerisce gradualmente: ♭IIImaj7 (misto Dorico/Frigio) → IVmaj7 diatonico → I. Come un nuvola che si dirada.',
    artists: ['Tigran Hamasyan', 'Chick Corea', 'Keith Jarrett', 'Vijay Iyer'],
    feel: 'Apertura frigia che si schiarisce',
    lengths: [4],
  },
  {
    id: 'cushion-neo-soul-sus',
    name: 'Imaj9–♭VImaj7–♭VII7sus4–Imaj9 (Neo-Soul Cushion Sus)',
    chords: [
      { degree: 'I',    quality: 'maj9',  function: 'Tonic',  technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7',  function: 'Color',  technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VI Eolico — scurisce' },
      { degree: 'bVII', quality: '7sus4', function: 'Color',  technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VII7sus4 — tensione sospesa prima del ritorno' },
      { degree: 'I',    quality: 'maj9',  function: 'Tonic',  technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'sus'],
    description: 'Loop neo-soul con cushion Eolico: ♭VI (Ab) scurisce, ♭VII7sus4 (Bb7sus) crea tensione flottante prima del ritorno al maj9. Anderson .Paak / D\'Angelo.',
    artists: ['Anderson .Paak', 'D\'Angelo', 'SiR', 'Ari Lennox'],
    feel: 'Neo-soul cushion sospeso',
    lengths: [4],
  },
  {
    id: 'cushion-dorian-extensions',
    name: '♭IIIm9–IV7sus4–Imaj9 (Dorico con Estensioni)',
    chords: [
      { degree: 'bIII', quality: 'm9',   function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭IIIm9 = Dorico ii-sub con nona' },
      { degree: 'IV',   quality: '7sus4', function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'IV7sus4 = Dorico V-sub con quarta sospesa' },
      { degree: 'I',    quality: 'maj9',  function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'sus', 'color'],
    description: 'II–V–I Dorico con estensioni ricche: ♭IIIm9 (Ebm9) e IV7sus4 (F7sus4) verso Imaj9. Colore Snarky Puppy / Yussef Dayes — tensioni aperte senza il 3°.',
    artists: ['Snarky Puppy', 'Yussef Dayes', 'Alfa Mist', 'GoGo Penguin'],
    feel: 'Dorico ii–V con tensioni aperte',
    lengths: [3],
  },
  {
    id: 'cushion-all-three-levels',
    name: 'Imaj9–♭VImaj7–♭IIIm9–♭VII7–Imaj9 (Tutti e Tre i Livelli)',
    chords: [
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VI Eolico (IV di Eb)' },
      { degree: 'bIII', quality: 'm9',   function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭IIIm9 Dorico (IV di Bb come ii-sub)' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VII Eolico (V di Eb) — risolve al maj9' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'color'],
    description: 'Un giro che tocca tutti e tre i livelli cushion: ♭VI (Eolico) → ♭IIIm9 (Dorico come ii) → ♭VII (Eolico come V) → I. Il compendio visivo dell\'interscambio cushion.',
    artists: ['Jacob Collier', 'Robert Glasper', 'Thundercat', 'Flying Lotus'],
    feel: 'Giro che tocca tutti i livelli cushion',
    lengths: [5],
  },
  {
    id: 'cushion-snarky-groove',
    name: '♭IIIm7–♭VIm7–♭VII7sus4–Imaj9 (Snarky Cushion Groove)',
    chords: [
      { degree: 'bIII', quality: 'm7',   function: 'Subdominant', technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Dorico ii-sub — groove aperto' },
      { degree: 'bVI',  quality: 'm7',   function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Eolico ii-sub — scurisce ulteriormente' },
      { degree: 'bVII', quality: '7sus4', function: 'Dominant',    technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: 'Eolico V sospeso — massima tensione modale' },
      { degree: 'I',    quality: 'maj9',  function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'sus'],
    description: 'Pattern groove fusion: Dorico → Eolico → sus dominante Eolico → maj9. Tre accordi borrowati in fila prima della risoluzione. Snarky Puppy / Lettuce.',
    artists: ['Snarky Puppy', 'Lettuce', 'Ghost-Note', 'Yussef Dayes'],
    feel: 'Groove fusion cushion triplo',
    lengths: [4],
  },
  {
    id: 'cushion-backdoor-hybrid',
    name: 'IIm9–♭VImaj7–♭VII7–Imaj9 (Cushion + Backdoor)',
    chords: [
      { degree: 'II',   quality: 'm9',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', techniqueLabel: 'Phrygian Cushion', annotation: '♭VI Eolico — colore cinematico sul ii' },
      { degree: 'bVII', quality: '7',    function: 'Dominant',    technique: 'backdoor', techniqueLabel: 'Backdoor + Cushion', annotation: '♭VII7 backdoor — Eolico V che risolve per via indiretta' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'backdoor'],
    description: 'IIm9 diatonico → ♭VI cushion Eolico → ♭VII7 backdoor dominant → Imaj9. Ibrido tra cushion e backdoor: colore eolico con risoluzione indiretta dal basso.',
    artists: ['Tom Misch', 'Anderson .Paak', 'Snarky Puppy', 'Cory Henry'],
    feel: 'Cushion Eolico con backdoor',
    lengths: [4],
  },
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: zero TypeScript errors. `bV` is a valid key in `DEGREE_SEMITONE` (value 6 = F# / Gb).

- [ ] **Step 3: Commit**

```bash
git add src/features/chord-progression/services/templates.ts
git commit -m "feat(chord-progression): add Tier 2 advanced Phrygian Cushion templates (8)"
```

---

## Task 3 — Create `phrygianCushion.ts` service

**Files:**
- Create: `src/features/modal-interchange/services/phrygianCushion.ts`

- [ ] **Step 1: Create the file with the complete implementation**

```ts
import {
  noteToSemitone,
  semitoneToNote,
  notePreferFlat,
  getScaleNotes,
  MAJOR_DIATONIC_QUALITY,
} from '@shared/utils/musicTheory';

export type CushionLevel = 'dorian' | 'aeolian' | 'phrygian';

export interface CushionChord {
  inputDegree: string;
  symbol: string;
  root: string;
  quality: string;
  isBorrowed: boolean;
  sourceKey: string | null;
}

export interface CushionVariant {
  level: CushionLevel;
  label: string;
  sourceKey: string;
  color: string;
  chords: CushionChord[];
}

export interface CushionResult {
  original: CushionChord[];
  variants: CushionVariant[];
}

// How many semitones BELOW the tonic each source key lives
const CUSHION_OFFSETS: Record<CushionLevel, { offset: number; label: string; color: string }> = {
  dorian:   { offset: 2, label: 'Dorico',  color: '#06b6d4' },
  aeolian:  { offset: 9, label: 'Eolico',  color: '#ef4444' },
  phrygian: { offset: 4, label: 'Frigio',  color: '#f59e0b' },
};

// Map diatonic ordinal (1–7) ↔ DEGREE_SEMITONE key
const ORDINAL_TO_DEGREE_KEY: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII',
};

// Recognized diatonic degree tokens → ordinal 1–7
const DEGREE_ORDINAL: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
};

function normalizeDegree(token: string): string {
  return token
    .replace(/♭/g, 'b')
    .toUpperCase()
    .replace(/(MIN|MAJ|DIM|AUG|M)$/, '');
}

export function parseDegrees(input: string): string[] {
  return input
    .split(/[\s\-,/]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(normalizeDegree)
    .filter(t => DEGREE_ORDINAL[t] !== undefined);
}

function chordSymbol(root: string, quality: string): string {
  return quality === 'maj' ? root : `${root}${quality}`;
}

function resolveInKey(key: string, degree: string): CushionChord {
  const ordinal = DEGREE_ORDINAL[degree];
  const scaleNotes = getScaleNotes(key, 'major');
  const root = scaleNotes[ordinal - 1];
  const quality = MAJOR_DIATONIC_QUALITY[ORDINAL_TO_DEGREE_KEY[ordinal]] ?? 'maj7';
  return { inputDegree: degree, symbol: chordSymbol(root, quality), root, quality, isBorrowed: false, sourceKey: null };
}

function resolveInCushion(degree: string, homeKey: string, level: CushionLevel): CushionChord {
  if (degree === 'I') {
    return { ...resolveInKey(homeKey, 'I'), isBorrowed: false, sourceKey: null };
  }
  const ordinal = DEGREE_ORDINAL[degree];
  const { offset } = CUSHION_OFFSETS[level];
  const homeKeySemitone = noteToSemitone(homeKey);
  const sourceKeySemitone = ((homeKeySemitone - offset) % 12 + 12) % 12;
  const preferFlat = notePreferFlat(homeKey) || [1, 3, 6, 8, 10].includes(sourceKeySemitone);
  const sourceKey = semitoneToNote(sourceKeySemitone, preferFlat);
  const scaleNotes = getScaleNotes(sourceKey, 'major');
  const root = scaleNotes[ordinal - 1];
  const quality = MAJOR_DIATONIC_QUALITY[ORDINAL_TO_DEGREE_KEY[ordinal]] ?? 'maj7';
  const homeNotes = new Set(getScaleNotes(homeKey, 'major'));
  return {
    inputDegree: degree,
    symbol: chordSymbol(root, quality),
    root,
    quality,
    isBorrowed: !homeNotes.has(root),
    sourceKey,
  };
}

export function computeCushionVariants(degrees: string[], key: string): CushionResult {
  const original = degrees.map(d => resolveInKey(key, d));
  const levels: CushionLevel[] = ['dorian', 'aeolian', 'phrygian'];
  const variants: CushionVariant[] = levels.map(level => {
    const { label, color, offset } = CUSHION_OFFSETS[level];
    const homeKeySemitone = noteToSemitone(key);
    const sourceKeySemitone = ((homeKeySemitone - offset) % 12 + 12) % 12;
    const preferFlat = notePreferFlat(key) || [1, 3, 6, 8, 10].includes(sourceKeySemitone);
    const sourceKey = semitoneToNote(sourceKeySemitone, preferFlat);
    return {
      level,
      label: `${label} (da ${sourceKey})`,
      sourceKey,
      color,
      chords: degrees.map(d => resolveInCushion(d, key, level)),
    };
  });
  return { original, variants };
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: zero errors. If you get "cannot find module '@shared/utils/musicTheory'" check that `vite.config.ts` has the `@shared` alias (it does — verified in codebase).

- [ ] **Step 3: Commit**

```bash
git add src/features/modal-interchange/services/phrygianCushion.ts
git commit -m "feat(modal-interchange): add phrygianCushion service (computeCushionVariants)"
```

---

## Task 4 — Create `PhrygianCushionExplorer.tsx` component

**Files:**
- Create: `src/features/modal-interchange/components/PhrygianCushionExplorer.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState, useMemo } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { parseDegrees, computeCushionVariants } from '../services/phrygianCushion';
import type { CushionChord } from '../services/phrygianCushion';

const PRESETS = ['I IV V I', 'II V I', 'I V VI IV', 'I VI IV V'];

export default function PhrygianCushionExplorer() {
  const { globalKey } = useGlobalKey();
  const [input, setInput] = useState('I IV V I');

  const degrees = useMemo(() => parseDegrees(input), [input]);

  const result = useMemo(
    () => (degrees.length > 0 ? computeCushionVariants(degrees, globalKey) : null),
    [degrees, globalKey]
  );

  const columns = result
    ? [
        { label: 'Originale', sublabel: `${globalKey} maggiore`, color: '#10b981', chords: result.original },
        ...result.variants.map(v => ({
          label: v.label.split(' ')[0],
          sublabel: v.label,
          color: v.color,
          chords: v.chords,
        })),
      ]
    : [];

  const showError = input.trim() !== '' && degrees.length === 0;

  return (
    <div style={{
      background: '#161b22', border: '1px solid #30363d',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header */}
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#e6edf3' }}>
          🎹 Phrygian Cushion Explorer
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          Digita una progressione in gradi romani e vedi le tre varianti cushion affiancate.
          Usa la chiave globale selezionata in cima.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setInput(p)}
            style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 5, cursor: 'pointer',
              background: input === p ? '#1d4ed820' : 'none',
              border: `1px solid ${input === p ? '#3b82f6' : '#30363d'}`,
              color: input === p ? '#93c5fd' : '#6b7280',
              fontFamily: 'monospace',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="es. I IV V I   oppure   II V I"
          style={{
            flex: 1, padding: '8px 12px', fontSize: 14, fontFamily: 'monospace',
            background: '#0d1117', border: `1px solid ${showError ? '#ef4444' : '#30363d'}`,
            borderRadius: 6, color: '#e6edf3', outline: 'none',
          }}
        />
        {showError && (
          <span style={{ fontSize: 12, color: '#ef4444', whiteSpace: 'nowrap' }}>
            Gradi non riconosciuti
          </span>
        )}
      </div>

      {/* Grid */}
      {result && columns.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns.length}, minmax(110px, 1fr))`,
            gap: 8,
            minWidth: 380,
          }}>
            {/* Header row */}
            {columns.map((col, ci) => (
              <div key={`h-${ci}`} style={{
                textAlign: 'center', padding: '6px 4px',
                borderBottom: `2px solid ${col.color}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: col.color }}>
                  {col.label}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {col.sublabel}
                </div>
              </div>
            ))}

            {/* Chord cells — flatMap gives row-major order that CSS grid fills left→right */}
            {degrees.flatMap((degree, rowIdx) =>
              columns.map((col, colIdx) => {
                const chord: CushionChord = col.chords[rowIdx];
                const isAnchor = degree === 'I';
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    style={{
                      padding: '8px 6px', borderRadius: 8, textAlign: 'center',
                      background: chord.isBorrowed ? `${col.color}12` : '#0d1117',
                      border: `1px solid ${isAnchor ? '#10b981' : chord.isBorrowed ? col.color : '#21262d'}`,
                      boxShadow: chord.isBorrowed ? `0 0 7px ${col.color}20` : 'none',
                    }}
                  >
                    <div style={{
                      fontSize: 10, marginBottom: 2,
                      color: isAnchor ? '#10b981' : chord.isBorrowed ? col.color : '#4b5563',
                    }}>
                      {degree}
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#e6edf3',
                    }}>
                      {chord.symbol}
                    </div>
                    {chord.isBorrowed && (
                      <div style={{ fontSize: 9, color: col.color, marginTop: 2 }}>
                        da {chord.sourceKey}
                      </div>
                    )}
                    {isAnchor && colIdx === 0 && (
                      <div style={{ fontSize: 9, color: '#10b981', marginTop: 2 }}>
                        ancora
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Theory note */}
      {result && (
        <div style={{
          fontSize: 12, color: '#6b7280', padding: '10px 12px',
          background: '#0d1117', borderRadius: 8, lineHeight: 1.6,
        }}>
          <strong style={{ color: '#8b949e' }}>Come funziona:</strong>{' '}
          Il grado <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>I</strong> resta
          ancorato a <strong style={{ color: '#10b981' }}>{globalKey} maggiore</strong>.
          Gli altri gradi vengono prelevati dalla stessa posizione diatonica nella chiave sorgente
          (Dorico da {globalKey === 'C' ? 'Bb' : '−2 semitoni'},
          Eolico da {globalKey === 'C' ? 'Eb' : '−9 semitoni'},
          Frigio da {globalKey === 'C' ? 'Ab' : '−4 semitoni'}).
          Il colore scuro–chiaro nasce dall'abbassamento progressivo delle note rispetto alla tonalità di partenza.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: zero errors. If you get a type error on `CushionChord`, check that the import path matches the file created in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/features/modal-interchange/components/PhrygianCushionExplorer.tsx
git commit -m "feat(modal-interchange): add PhrygianCushionExplorer component"
```

---

## Task 5 — Mount Explorer in ModalInterchangeFeature + final verification

**Files:**
- Modify: `src/features/modal-interchange/ModalInterchangeFeature.tsx`

- [ ] **Step 1: Add the import at the top of ModalInterchangeFeature.tsx**

In the import section (after the existing imports at the top of the file), add:

```ts
import PhrygianCushionExplorer from './components/PhrygianCushionExplorer';
```

- [ ] **Step 2: Mount the component**

In `ModalInterchangeFeature.tsx`, find the `<details>` element that contains the "📖 Most Common Borrowed Chords Guide" section. It starts around line 282 and looks like:

```tsx
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📖 Most Common Borrowed Chords Guide
        </summary>
```

Insert `<PhrygianCushionExplorer />` **immediately before** that `<details>` element:

```tsx
      {/* Phrygian Cushion Explorer */}
      <PhrygianCushionExplorer />

      {/* Common borrowed chords guide */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: zero TypeScript errors, `✓ built in`.

- [ ] **Step 4: Run dev and verify in browser**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run dev
```

Navigate to **Modal Interchange** in the app. Scroll to the bottom — you should see the **🎹 Phrygian Cushion Explorer** panel above the "Most Common Borrowed Chords Guide" collapsible.

Verify these behaviors:
1. Default preset `I IV V I` in key C shows: Original (C-F-G-C), Dorico (C-Eb-F-C), Eolico (C-Ab-Bb-C), Frigio (C-Db-Eb-C)
2. The I chord cells all have a green border (`#10b981`) across all columns
3. Borrowed cells (non-I in cushion columns) have the column's color border + glow + "da Bb/Eb/Ab" label
4. Switching the global key (e.g. to G) updates all columns correctly: Dorian should show G-Bb-C-G
5. Preset buttons switch the input and recompute instantly
6. Typing an invalid degree (e.g. `foo bar`) shows the "Gradi non riconosciuti" error and no grid

Also navigate to **Chord Progression Generator** and verify:
7. The new Phrygian Cushion templates appear when `Modal Interchange` technique is selected
8. Templates have `Phrygian Cushion` as technique label in the display (check the chord annotations)

- [ ] **Step 5: Final commit**

```bash
git add src/features/modal-interchange/ModalInterchangeFeature.tsx
git commit -m "feat(modal-interchange): mount PhrygianCushionExplorer panel"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Tier 1 templates (12): I-IV-V-I × 3, II-V-I × 3, I-V-vi-IV × 3, Turnaround × 3
- ✅ Tier 2 templates (8): Cascata doppia, Discesa cinematica, Apertura frigia, Neo-soul sus, Estensioni Doriche, Tutti i livelli, Snarky groove, Backdoor ibrido
- ✅ `phrygianCushion.ts` service with `computeCushionVariants`, `parseDegrees`, types
- ✅ `PhrygianCushionExplorer.tsx` with 4-column grid, presets, error state, theory note
- ✅ Mounted above "Common Borrowed Chords Guide" `<details>` in `ModalInterchangeFeature.tsx`
- ✅ No audio in Explorer (out of scope per spec)
- ✅ No new Technique type (uses `techniqueLabel: 'Phrygian Cushion'` on existing `modal_interchange`)
- ✅ No nav/routing changes

**Placeholder scan:** none found.

**Type consistency:**
- `CushionChord`, `CushionVariant`, `CushionResult`, `CushionLevel` defined in Task 3 and imported in Task 4 ✅
- `parseDegrees` and `computeCushionVariants` defined in Task 3, imported in Task 4 ✅
- Template `degree` values all in `DEGREE_SEMITONE`: `'I'`, `'bII'`, `'bIII'`, `'IV'`, `'bV'`, `'bVI'`, `'VI'`, `'bVII'` ✅

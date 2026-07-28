# Phrygian Cushion Chords — Design Spec

**Date:** 2026-07-28  
**Feature scope:** Chord Progression Generator + Modal Interchange feature  
**Approach:** Approach A — Templates + Explorer integrato

---

## Background & Theory

"Phrygian cushion chords" (accordi cuscinetto frigi) are a named application of modal interchange. The rule:

- Keep the **I chord** anchored in the home key (it is the tonic, the "arrival" point)
- Take the **IV and V** (or the **II and V** in a II–V–I context) from a **parallel flat-major key**: Bb, Eb, or Ab relative to C major
- These three sources correspond to three minor modes on C:
  - **C Dorian** → borrows from Bb major → IV = Eb, V = F (offset: T − 2 semitones)
  - **C Aeolian** → borrows from Eb major → IV = Ab, V = Bb (offset: T − 9 semitones)
  - **C Phrygian** → borrows from Ab major → IV = Db, V = Eb (offset: T − 4 semitones)

The three source keys (Bb, Eb, Ab from C) correspond to the flat accidentals of C natural minor and appear in the order of flat key signatures, which is why they are the "natural" borrowing choices.

The substituted chords create a chiaroscuro (light–dark) curve: the borrowed chords feel darker/unexpected, then resolution to I restores brightness.

---

## Part 1 — New Templates in the Chord Progression Generator

### Where

`src/features/chord-progression/services/templates.ts`

### Template count

~20 new templates across two tiers:

#### Tier 1 — Direct Cushion (basic formula, 4 base progressions × 3 levels = 12 templates)

All use `technique: 'modal_interchange'` and `techniqueLabel: 'Phrygian Cushion'`.

| Base progression | Dorian level | Aeolian level | Phrygian level |
|---|---|---|---|
| I–IV–V–I | I–♭III–IV–I | I–♭VI–♭VII–I | I–♭II–♭III–I |
| II–V–I | ♭IIIm7–IV7–I | ♭VIm7–♭VII7–I | ♭IIm7–♭III7–I |
| I–V–vi–IV | I–IV–vi–♭III | I–♭VII–vi–♭VI | I–♭III–vi–♭II |
| Turnaround ii–V–I (extended) | ♭IIIm7–♭VIm7–IV7–I | ♭VIm7–♭IIm7–♭VII7–I | ♭IIm7–♭Vm7–♭III7–I |

Each template carries:
- `annotation` on each borrowed chord: `"prestito da [Key] maggiore — [Mode] cushion"`
- `style: 'modern'`
- `lengths`: matching the chord count
- `artists`: e.g. `['Jacob Collier', 'Vulfpeck', 'Snarky Puppy']` for Dorian; `['Hans Zimmer', 'Radiohead']` for Aeolian; `['Paco de Lucía', 'Flamenco Jazz']` for Phrygian

#### Tier 2 — Advanced Cushion (elaborate/hybrid patterns, ~8 templates)

More sophisticated progressions that mix cushion levels or combine with other techniques already in the engine:

1. **Cascading cushion II–V chain** — `♭VIm7 – ♭II7 – ♭IIIm7 – IV7 – I`  
   Phrygian II–V feeds into Dorian II–V resolving to I. Very Jacob Collier / Vulfpeck.

2. **Cinematic borrowed descent** — `I – ♭VI – ♭III – ♭VII – I`  
   Descending chain through Aeolian and Dorian borrowed chords. Film-score, Hans Zimmer territory.

3. **Phrygian drama opener** — `♭IIm7 – ♭IIImaj7 – IV – I`  
   Opens with stark Phrygian color that lightens toward Dorian before resolving.

4. **Neo-soul sus cushion** — `I – vi – ♭VImaj7 – ♭VIIsus4 – I`  
   Pop/neo-soul feel; suspended ♭VII cushion creates floating tension before I.

5. **Dorian cushion with extensions** — `♭IIIm9 – IV7sus4 – Imaj9`  
   3-chord Dorian II–V with 9th and sus4 tensions. Yussef Dayes / Snarky Puppy.

6. **All-three-levels in one giro** — `Imaj9 – ♭VImaj7 – ♭IIIm9 – ♭VII7 – Imaj9`  
   5-chord progression touching Aeolian (♭VI), Dorian (♭III), Aeolian again (♭VII) before I. Extended form.

7. **Cushion + secondary dominant hybrid** — `I – ♭VImaj7 – ♭VII7 – I`  
   Aeolian cushion setup; the transform engine can inject a secondary dominant before the final I at high spice levels.

8. **Snarky Puppy modal groove** — `♭IIIm7 – ♭VIm7 – ♭VII7sus4 – Imaj9`  
   4-chord modern fusion: Dorian + Aeolian cushion into a sus dominant resolving to maj9.

### Degree encoding

All cushion degrees are encoded using the existing relative-degree system already used by the template engine (`♭III`, `♭VI`, `♭VII`, `♭II`, etc.). No new degree types needed — `resolveDegree` already handles these via `DEGREE_SEMITONE`.

---

## Part 2 — Phrygian Cushion Explorer (Modal Interchange feature)

### Where

- New component: `src/features/modal-interchange/components/PhrygianCushionExplorer.tsx`
- New service: `src/features/modal-interchange/services/phrygianCushion.ts`
- Mounted at the **bottom** of `ModalInterchangeFeature.tsx`, above the "Common Borrowed Chords Guide" `<details>` block

### Service — `phrygianCushion.ts`

Pure helper, no React, no side-effects.

```ts
// Cushion offsets relative to tonic (in semitones below tonic key)
// Dorian source: T − 2  (e.g. C → Bb major)
// Aeolian source: T − 9  (e.g. C → Eb major)
// Phrygian source: T − 4  (e.g. C → Ab major)

export type CushionLevel = 'dorian' | 'aeolian' | 'phrygian';

export interface CushionVariant {
  level: CushionLevel;
  sourceKey: string;       // e.g. "Bb"
  chords: CushionChord[];
}

export interface CushionChord {
  originalDegree: string;  // e.g. "IV"
  symbol: string;          // e.g. "Eb"
  isBorrowed: boolean;     // false for I chords (anchor)
  sourceKey: string | null; // null for non-borrowed
}

export interface CushionResult {
  original: CushionChord[];
  variants: CushionVariant[];  // [dorian, aeolian, phrygian]
}

export function computeCushionVariants(degrees: string[], key: string): CushionResult
```

**Parsing:** `parseDegrees(input: string): string[]` — accepts space/dash/comma-separated degrees. Normalises `b` → `♭`, lowercases roman numerals, strips invalid tokens. Returns empty array for unparseable input.

**Resolution logic:**

The algorithm for each cushion variant:
1. Compute `sourceKeySemitone = (tonicSemitone - offset + 12) % 12` where offset is 2 (Dorian), 9 (Aeolian), or 4 (Phrygian)
2. For each input degree, compute its semitone relative to the home tonic using `DEGREE_SEMITONE[degree]`
3. Resolve that absolute semitone as a root note (`semitoneToNote`) — this gives the cushion chord name
4. Quality: use the diatonic quality of that degree within the source key's major harmonisation (I=maj, II=m, III=m, IV=maj, V=dom7/maj, VI=m, VII=dim)
5. `isBorrowed`: true if the resolved root is NOT in the home key's diatonic set

- Resolution uses the same `noteToSemitone` / `semitoneToNote` / `DEGREE_SEMITONE` utilities from `@shared/utils/musicTheory` already used by the progression engine
- For degree tokens that are `I` (case-insensitive) → skip cushion substitution, resolve directly to tonic in all variants

### Component — `PhrygianCushionExplorer.tsx`

**State:**
```ts
const [input, setInput] = useState('I IV V I');
const [parsed, setParsed] = useState<string[]>(['I', 'IV', 'V', 'I']);
const [error, setError] = useState<string | null>(null);
```

Key is read from `useGlobalKey()` — no local key selector needed.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ 🎹 Phrygian Cushion Explorer                        │
│ Digita una progressione in gradi romani...          │
│                                                     │
│ [  I  IV  V  I          ] [Analizza]               │
│                                                     │
│  ORIGINALE   DORICO      EOLICO      FRIGIO         │
│  (C major)   (da Bb maj) (da Eb maj) (da Ab maj)   │
│  ┌───┐       ┌───┐       ┌───┐       ┌───┐         │
│  │ C │       │ C │       │ C │       │ C │  ← I    │
│  └───┘       └───┘       └───┘       └───┘         │
│  ┌───┐       ┌───┐       ┌───┐       ┌───┐         │
│  │ F │       │Eb*│       │Ab*│       │Db*│  ← IV   │
│  └───┘       └───┘       └───┘       └───┘         │
│  ┌───┐       ┌───┐       ┌───┐       ┌───┐         │
│  │ G │       │ F*│       │Bb*│       │Eb*│  ← V    │
│  └───┘       └───┘       └───┘       └───┘         │
│  ┌───┐       ┌───┐       ┌───┐       ┌───┐         │
│  │ C │       │ C │       │ C │       │ C │  ← I    │
│  └───┘       └───┘       └───┘       └───┘         │
│                                                     │
│ * accordo borrowato — non appartiene a C maggiore   │
│                                                     │
│ ℹ In Dorico, C usa la scala di Bb maggiore come    │
│   sorgente. Le note abbassate (Bb, Eb) creano      │
│   l'effetto chiaroscuro descritto dal video.        │
└─────────────────────────────────────────────────────┘
```

- I chord cells: `border: 1px solid #10b981` (verde = anchor)  
- Borrowed cells: `border: 1px solid [level color]` + glow, small "borrowed" badge below  
- Columns share the same color scheme as the existing mode rows in the feature (cyan = Dorian, red = Aeolian, amber = Phrygian)
- Error state (invalid input): inline message below the input field, no crash

**No audio in the Explorer** — the progression generator already handles playback; the Explorer is purely visual/educational. This keeps the component simple and avoids reimplementing the audio stack.

---

## File changes summary

| File | Change |
|---|---|
| `src/features/chord-progression/services/templates.ts` | Add ~20 new templates (Tier 1 + Tier 2) |
| `src/features/modal-interchange/ModalInterchangeFeature.tsx` | Import and mount `<PhrygianCushionExplorer />` above the `<details>` block |
| `src/features/modal-interchange/components/PhrygianCushionExplorer.tsx` | New file — Explorer component |
| `src/features/modal-interchange/services/phrygianCushion.ts` | New file — pure computation helper |

No changes to: types, navigation, context, shared utilities, Netlify functions, or the transform engine.

---

## Out of scope

- Audio playback in the Explorer
- Saving/exporting cushion progressions from the Explorer
- Applying cushion substitution to existing user progressions (reharmonization flow)
- New Technique type (`phrygian_cushion`) — templates use `techniqueLabel` instead, keeping types unchanged

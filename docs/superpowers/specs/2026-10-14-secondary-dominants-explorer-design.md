# Secondary Dominants Explorer — Design Spec

**Date:** 2026-10-14
**Status:** Approved

---

## Overview

A standalone feature that, given the active global key (major or minor), displays all secondary dominants available in that tonal context. For each diatonic degree the user sees the V7/X, its tritone substitution, and the ii–V pair — all playable via the existing shared audio infrastructure.

**Goal:** give the composer an instant, interactive reference for all secondary dominant options in a key, without having to work them out manually.

---

## Feature placement

- **Nav group:** Composition
- **Tab ID:** `secondary-dominants`
- **Label:** `Secondary Dominants`
- **Entry file:** `src/features/secondary-dominants/SecondaryDominantsFeature.tsx`

The feature reads the tonic and mode from `GlobalKeyContext` — no local key selector needed.

---

## File structure

```
src/features/secondary-dominants/
├── SecondaryDominantsFeature.tsx   ← entry component, layout, playback state
├── utils/
│   └── secondaryDominants.ts      ← pure computation, no React
└── components/
    └── DegreeCard.tsx              ← card for a single diatonic degree
```

---

## Data model

### `DegreeData` (from `secondaryDominants.ts`)

```ts
interface ChordInfo {
  name: string;
  notes: string[];  // pitch classes, e.g. ["A", "C#", "E", "G"]
}

interface DegreeData {
  degree: string;        // "II", "III", "IV", "V", "VI", "VII"
  targetChord: string;   // diatonic chord name, e.g. "Dm7"
  secDom: ChordInfo;     // V7/X, e.g. A7
  tritoneSub: ChordInfo; // SubV7, e.g. Eb7
  iiChord: ChordInfo;    // ii of the secondary dominant
}
```

### `getSecondaryDominants(tonic: string, mode: 'major' | 'minor'): DegreeData[]`

Returns one entry per degree that has a secondary dominant (II through VII — I is excluded since V/I is the regular dominant).

**Tonal sources:**
- Chord names: `Key.majorKey(tonic).secondaryDominants` / `Key.minorKey(tonic).secondaryDominants` — tonal returns these as a 7-element array, with index 0 (I) empty.
- Chord notes: `Chord.get(chordName).notes`
- Tritone sub root: `Note.transpose(secDomRoot, '4A')` (augmented fourth = tritone), quality `7`
- ii chord: half-diminished (`m7b5`) when the target degree is minor or diminished; minor 7 (`m7`) when the target is major

---

## Components

### `SecondaryDominantsFeature.tsx`

- Reads `{ key, mode }` from `GlobalKeyContext`
- Calls `getSecondaryDominants(key, mode)` to get the `DegreeData[]`
- Manages `playingId: string | null` — the ID of whichever chord/sequence is currently playing, used to highlight the active play button
- Renders a page header (key badge from GlobalKeyContext) and a responsive card grid (`grid-template-columns: repeat(3, 1fr)`, collapsing on small screens)
- Passes `playingId` and an `onPlay(id, notes)` callback down to each `DegreeCard`

### `DegreeCard.tsx`

Props: `{ data: DegreeData; playingId: string | null; setPlayingId: (id: string | null) => void }`

`DegreeCard` owns its audio calls directly (calls `audioPlayer.playChord` and `playChordSequence` internally). It uses `setPlayingId` only to synchronise highlight state with the parent.

Each card contains:
- **Header:** degree badge (circle) + diatonic chord name + "target" label
- **Three chord rows:**
  - `V/X` (yellow) — secondary dominant: plays `voiceChord(secDom.notes)` on click
  - `SubV` (teal) — tritone substitution: plays `voiceChord(tritoneSub.notes)` on click
  - `ii–V` (pink) — the ii chord name + "–" + V chord name: plays ii then V in sequence
  - Each row shows: label | chord name | notes (small, muted) | ▶ play button
- **Footer button:** "suona ii–V–I verso [chord]" — plays ii → V → target in sequence via `playChordSequence`

Row IDs follow the pattern `${degree}-secdom`, `${degree}-tritone`, `${degree}-iiv`, `${degree}-seq` so `playingId` can highlight the correct button.

---

## Audio

No new audio infrastructure. Reuse from `@shared/utils/chordAudio`:

| Action | Call |
|--------|------|
| Single chord | `audioPlayer.playChord(voiceChord(notes))` |
| ii–V–I sequence | `playChordSequence([{ notes: iiNotes }, { notes: vNotes }, { notes: targetNotes }])` |

Notes arrive as pitch classes from tonal (no octave). `voiceChord(pitchClasses)` assigns octaves for a good voicing before passing to `playChord`.

---

## Navigation (App.tsx)

1. Add to `GROUPS` in the Composition group:
   ```ts
   { id: 'secondary-dominants', label: 'Secondary Dominants', icon: '🎯' }
   ```
2. Add render branch in `<main>`:
   ```tsx
   case 'secondary-dominants':
     return <SecondaryDominantsFeature />;
   ```

---

## Constraints and non-goals

- **No backend** — fully client-side, tonal does all computation
- **No new dependencies** — tonal, chordAudio, and GlobalKeyContext are already present
- **No persistence** — reference tool only, nothing to save
- **Minor key support** — uses `Key.minorKey()` and the natural minor scale for degree names; altered degrees (raised 6th/7th) are out of scope
- **I degree excluded** — V/I is the regular dominant; showing it here would be redundant

---

## Open questions (resolved)

| Question | Decision |
|----------|----------|
| Standalone or embedded? | Standalone feature |
| Key selector? | Use GlobalKeyContext |
| Major only? | Both major and minor |
| Scope of content? | V7/X + tritone sub + ii–V |
| Layout? | Card per degree (option B) |

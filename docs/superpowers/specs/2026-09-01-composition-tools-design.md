# Composition Tools — Design Spec
**Date:** 2026-09-01  
**Status:** Approved

## Overview

Five new composition-focused tools integrated into the *tonic* app. Target styles: Snarky Puppy, Ghost Note, Vulfpeck, Yussef Dayes. All tools follow existing app patterns: dark theme CSS variables, `tonal` for music theory, `useGlobalKey` for key context, self-contained feature modules.

**Integration strategy:** expandable sections within existing host features (Approach A), except Rhythmic Displacement which is standalone.

---

## Feature 1: Pentatonic Superimposition Map

**Host:** `src/features/scale-advisor/ScaleAdvisorFeature.tsx`  
**Integration:** New expandable section "Pentatonic Colors" appended below the existing scales grid. Uses the same chord input already present (root + quality) — no additional input needed.

### Behaviour
- Triggered by the same chord selection in Scale Advisor.
- Displays a table of pentatonic scales that work over the selected chord type.
- Each row: pentatonic name, constituent notes (in selected key), harmonic color label, artist/style tip.
- Data source: static lookup table keyed by chord quality (~15 types: maj7, maj7#11, m7, 7, 7alt, m7b5, dim7, sus4, 7sus4, maj9, m9, 9, 6, m6, add9).
- Notes rendered in the current global key via transposition.

### Lookup table structure (per chord quality)
```ts
interface PentatonicEntry {
  name: string;          // e.g. "E minor pentatonic"
  rootInterval: string;  // interval from chord root, e.g. "3M"
  color: string;         // e.g. "Lidiante — bright, #11 colour"
  tip: string;           // e.g. "Cory Henry sound over maj7#11"
}
```

### Chord types covered
`maj7`, `maj7#11`, `m7`, `7` (dominant), `7alt`, `m7b5`, `dim7`, `sus4`, `7sus4`, `maj9`, `m9`, `9`, `6`, `m6`, `add9`

### UI
- Section header "Pentatonic Colors" with collapse toggle.
- Table: 4 columns — Pentatonic | Notes | Color | Tip.
- Notes column renders actual note names transposed to the global key.
- Accent color matches existing Scale Advisor style (purple `#7c3aed`).

---

## Feature 2: Guide Tone Lines

**Host:** `src/features/voice-leading/VoiceLeadingFeature.tsx`  
**Integration:** New expandable section "Guide Tone Lines" below the existing two-chord voice-leading content. Has its own separate text input for a multi-chord progression.

### Behaviour
- Input: free-text chord progression (e.g. `Cmaj7 Am7 Dm7 G7`), parsed with the same regex pattern used in ReharmonizationFeature.
- Extracts the 3rd and 7th of each chord using `tonal` (`Chord.get()`).
- Displays a horizontal grid showing how 3rds and 7ths move chord-by-chord.
- Calculates semitone distance between consecutive guide tones (shortest path, signed).
- Color-codes movement: green ≤ 2 semitones (smooth), yellow 3–4, red ≥ 5 (leap).
- Shows a suggested horn line label based on the smoothest voice trajectory.

### Visual layout
- SVG grid: chords on X axis, pitch on Y axis (chromatic, fixed range).
- 3rd line: purple dots + connecting line.
- 7th line: orange dots + connecting line.
- Semitone distance label on each segment.
- Below grid: text summary — "Smoothest line: 7th (B→G→C→F)" + horn tip.

### Parsing
Reuses the same `parseChord` / `parseProgression` logic from ReharmonizationFeature (can be extracted to `src/shared/utils/musicTheory.ts` if not already there).

### Error states
- Invalid chord name: skip with a grey placeholder cell and "?" label.
- Empty input: section shows placeholder text only.

---

## Feature 3: Motif Transformer

**Host:** `src/features/melody-architect/MelodyArchitectFeature.tsx`  
**Integration:** New expandable section "Motif Lab" below the existing contour/melody content.

### Behaviour
- Input: scale degrees as text (`1 3 5 b7`) or note names (`C E G Bb`). Both formats accepted; detection via regex (note names contain A–G letters).
- Uses global key to convert degrees → actual note names.
- Seven transformations displayed simultaneously in a vertical list:
  1. **Inversione** — invert each interval around the first note
  2. **Retrogrado** — reverse the sequence
  3. **Retrogrado Inverso** — reverse then invert
  4. **Sequenza +1°** — transpose each note up one diatonic step (in global key's major scale)
  5. **Sequenza –3°** — transpose each note down a diatonic third
  6. **Augmentation** — show rhythmic doubling (×2 symbol per note)
  7. **Diminution** — show rhythmic halving (÷2 symbol per note)

- Augmentation/Diminution display only relative rhythmic values (symbols), not audio.
- All 7 transformations visible simultaneously — no active selection state.

### Degree parsing
- `b7` → semitone 10 from root, `#4` → semitone 6, etc.
- Maps to actual note via `transposeNote()` from `src/shared/utils/musicTheory.ts`.
- Diatonic sequence uses the major scale intervals of the global key.

### UI
- Input field + "Analizza" button.
- Results: vertical card list, one card per transformation. Card shows transformation name + note sequence as pill badges.
- Composition tip at bottom linking the technique to the target styles.

---

## Feature 4: Song Energy / Form Map

**Host:** `src/features/song-architect/SongArchitectFeature.tsx`  
**Integration:** New expandable section "Form & Energy" below the existing harmonic section content. Independent state — does not share data with the harmonic sections above.

### Behaviour
- User adds sections via "+ Sezione" button. Each section has:
  - **Name** — free text (A, B, Verse, Chorus, Solo, Bridge, Outro, etc.)
  - **Bars** — numeric input (integer)
  - **Feel** — free text label (e.g. "funk pocket", "sparse", "open modal")
  - **Energy** — 1–5 selector (rendered as filled/empty dots ●●●○○)
- Sections displayed as a table (rows), reorderable via Up/Down arrow buttons, deletable.
- **Energy curve** — SVG mini bar chart below the table, one bar per section, height proportional to energy level (1–5). Updates live.
- **Total bars** counter shown below the chart.
- **Quick templates** — 4 preset buttons that pre-populate the table:
  - `AABA` — 4 sections (A 8b ●●●○○, A 8b ●●●●○, B 8b ●●●●●, A 8b ●●●○○)
  - `Verse-Chorus` — 5 sections (Intro 4b ●●○○○, Verse 8b ●●●○○, Chorus 8b ●●●●●, Verse 8b ●●●○○, Chorus 8b ●●●●●)
  - `Modal Vamp` — 3 sections (Intro 4b ●●○○○, Vamp 16b ●●●○○, Peak 8b ●●●●●)
  - `Through-Composed` — 4 sections (A 8b ●●○○○, B 8b ●●●○○, C 8b ●●●●○, D 8b ●●●●●)
- Applying a template replaces the current table (with confirmation if table is non-empty).

### State
Local `useState` within the section — no persistence, no Firebase.

### UI
- Table with inline editable cells (controlled inputs).
- SVG chart: fixed height 60px, bars colored by energy (low = muted, high = accent purple).
- Template buttons styled as secondary chip buttons.

---

## Feature 5: Rhythmic Displacement

**Host:** New standalone feature  
**Files:** `src/features/rhythmic-displacement/RhythmicDisplacementFeature.tsx`  
**Nav entry:** Composition group, Arrange subsection  
```ts
{ id: 'rhythmic-displacement', label: 'Rhythmic Displacement', icon: '⟳', desc: 'Displace a rhythmic pattern by any subdivision — polyrhythm visualizer', subsection: 'Arrange' }
```

### Behaviour
- **Pattern grid:** 16 clickable cells representing 1 bar in 4/4 (each cell = 1/16 note). Click to toggle a hit (filled) or rest (empty).
- **Displacement controls:** 4 toggle buttons: +1/16, +1/8, +3/16, +1/4 (1, 2, 3, 4 cells). Multiple can be active simultaneously.
- **Display:** Original pattern row + one row per active displacement, shown as cell grids with ● and · symbols. Each row labeled with its offset.
- **Polyrhythm mode:** Toggle button. When active, shows a second sub-grid for a 3-against-2 or 4-against-3 pattern:
  - `3:2` — 12-cell grid (triplets) vs 8-cell grid (duplets) in the same bar
  - `4:3` — 16-cell grid vs 12-cell grid
  - Each voice rendered in a different accent color.
- **Style tip:** Static tip shown at bottom, linked to the active pattern type (e.g. "Yussef Dayes: displace a 3-2 son clave by +1/16 for behind-the-beat tension").

### State
- `pattern: boolean[16]` — the 16-cell grid
- `activeDisplacements: Set<number>` — offsets in 1/16 units (1, 2, 4)
- `polyrhythmMode: '3:2' | '4:3' | null`

### Nav registration
Add entry to `GROUPS` in `App.tsx` and add render branch in `<main>`.

---

## App.tsx changes

- Import `RhythmicDisplacementFeature` from `src/features/rhythmic-displacement/RhythmicDisplacementFeature.tsx` and add render branch.
- Add nav entry for `rhythmic-displacement` in Composition > Arrange subsection.
- No changes needed to other nav entries — the 4 integrated features extend existing pages.

## Shared utils

- `parseChord` / `parseProgression` — not present in `musicTheory.ts`; must be extracted from `ReharmonizationFeature.tsx` and added to `musicTheory.ts` as the first step of Feature 2 implementation.
- `transposeNote` — already in `musicTheory.ts`, used by Motif Transformer.
- No new shared context needed.

---

## Out of scope

- Audio playback for any of the 5 features.
- Firebase persistence for any of the 5 features.
- MIDI export.
- Mobile-specific layout optimization (follows existing responsive patterns).

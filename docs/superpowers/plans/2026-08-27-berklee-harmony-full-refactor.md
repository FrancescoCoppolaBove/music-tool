# Berklee Harmony Full Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all tonic app features with Berklee harmony pedagogy (5 books: Jazz Harmony Mulholland/Hojnacki, Jazz Composition Pease, Modern Jazz Voicings Pease/Pullig, Reharmonization Techniques, Arranging 2 Pease/Freeman), fix all P0/P1 bugs, and add missing harmonic content.

**Architecture:** Each task is self-contained. No shared state between features. Changes are mostly data + UI additions within existing feature files. Build validation: `npm run build` from `/Users/astuser/Documents/Repos/music-tool` after each group. No test suite — validate in browser with `npm run dev`.

**Tech Stack:** React + TypeScript + Vite, tonal.js, feature-based architecture in `src/features/`

---

## GROUP A — P0 + P1: Bug fixes & Quick UX (do first, independent)

### Task A1: Remove dead EarTrainingFeature reference

**Files:**
- Modify: `src/App.tsx:995`

- [ ] In `src/App.tsx`, remove the orphaned render line (line 995):
  ```tsx
  // DELETE THIS LINE — 'ear' tab id doesn't exist in GROUPS, feature is unreachable:
  {activeTab === 'ear'           && <EarTrainingFeature />}
  ```
  Also remove its import at line 14:
  ```tsx
  // DELETE THIS LINE:
  import EarTrainingFeature from './features/ear-training/EarTrainingFeature';
  ```

- [ ] Run `npm run build` from repo root — expect zero errors.

- [ ] Commit:
  ```bash
  git add src/App.tsx
  git commit -m "fix(app): remove unreachable EarTrainingFeature dead code"
  ```

---

### Task A2: Fix Italian strings in non-AFAM context

**Files:**
- Modify: `src/App.tsx` (line 682 — "Il mio profilo")
- Modify: `src/features/chord-progression/ChordProgressionFeature.tsx` (Italian Spice labels)
- Modify: `src/features/chord-progression/services/templates.ts` (Italian descriptions)

- [ ] In `src/App.tsx` line 682, change:
  ```tsx
  // BEFORE:
  👤 Il mio profilo
  // AFTER:
  👤 My profile
  ```

- [ ] In the Chord Progression feature file, search for and replace Italian Spice labels:
  ```tsx
  // Find: 'Scheletro', 'Leggero', 'Medio', 'Massimo'
  // Replace with: 'Skeleton', 'Light', 'Medium', 'Maximum'
  ```
  Run: `grep -rn "Scheletro\|Leggero\|Medio\|Massimo" src/features/chord-progression/`

- [ ] In `templates.ts`, find all descriptions in Italian (search for "Il form", "battute", "accordi") and translate to English. Example:
  ```ts
  // BEFORE:
  description: 'Il form blues fondamentale: 12 battute, tutti accordi settima di dominante. Alla base di jazz, R&B, rock e country. In C: C7–C7–C7–C7 | F7–F7–C7–C7 | G7–F7–C7–G7.',
  // AFTER:
  description: 'The foundational blues form: 12 bars, all dominant seventh chords. The backbone of jazz, R&B, rock, and country. In C: C7–C7–C7–C7 | F7–F7–C7–C7 | G7–F7–C7–G7.',
  ```
  Search: `grep -n "battute\|accordi\|Il form\|forma\|progressione" src/features/chord-progression/services/templates.ts`

- [ ] Run `npm run build` — expect zero errors.

- [ ] Commit:
  ```bash
  git add src/App.tsx src/features/chord-progression/
  git commit -m "fix(i18n): translate remaining Italian strings to English in non-AFAM context"
  ```

---

### Task A3: Fix "HALFDIMINISHED" label in Chord Landing

**Files:**
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx`

- [ ] Search for the label:
  ```bash
  grep -n "HALFDIMINISHED\|halfdiminished\|Half.*Dim" src/features/chord-landing/ChordLandingFeature.tsx
  ```

- [ ] Replace with:
  ```tsx
  // BEFORE: 'HALFDIMINISHED' or similar
  // AFTER: 'Half Diminished'
  ```

- [ ] Run `npm run build` — zero errors.

- [ ] Commit:
  ```bash
  git add src/features/chord-landing/ChordLandingFeature.tsx
  git commit -m "fix(chord-landing): correct 'HALFDIMINISHED' label casing"
  ```

---

### Task A4: Fix Locrian extensionLabel in Scale Advisor

**Files:**
- Modify: `src/features/scale-advisor/ScaleAdvisorFeature.tsx` (~line 388)

- [ ] Find the Locrian entry under m7b5 alternatives (around line 383-390). Update:
  ```ts
  // BEFORE:
  extensionLabel: 'Extensions: 11 (b9 is very tense)',
  // AFTER:
  extensionLabel: 'Extensions: T11, T♭13 · avoid: S♭2',
  ```
  Also add `8` to `goodExtensions` for Locrian (to reflect T♭13 from Berklee table):
  ```ts
  // BEFORE:
  goodExtensions: [5],
  // AFTER:
  goodExtensions: [5, 8],
  ```

- [ ] Run `npm run build` — zero errors.

- [ ] Commit:
  ```bash
  git add src/features/scale-advisor/ScaleAdvisorFeature.tsx
  git commit -m "fix(scale-advisor): correct Locrian extension label and add T♭13"
  ```

---

## GROUP B — Scale Advisor: Tonal/Modal context + 3 dominant cases

**Files:**
- Modify: `src/features/scale-advisor/ScaleAdvisorFeature.tsx`

### Task B1: Add "Tonal / Modal" context badge to each scale entry

The Berklee rule: avoid notes (S) apply in tonal contexts only. In modal contexts, S-notes become **characteristic notes** defining the mode. The Scale Advisor must communicate this distinction.

- [ ] Add a `modalContext?: boolean` field to the `ScaleInfo` interface (~line 12):
  ```ts
  interface ScaleInfo {
    name: string;
    intervals: number[];
    chordTones: number[];
    goodExtensions: number[];
    avoidNotes: number[];
    description: string;
    extensionLabel: string;
    trickSemitones?: number;
    trickScaleName?: string;
    trickInterval?: string;
    modalContext?: boolean;        // true = avoid notes are characteristic in modal use
    characteristicNote?: string;   // e.g. '♯4 (Lydian)', '♭2 (Phrygian)', 'nat. 6 (Dorian)'
  }
  ```

- [ ] Mark relevant scales. For each scale that represents a mode, add `characteristicNote` and set `modalContext: true` where appropriate. Apply to:
  - Dorian entry (primary for m7): `characteristicNote: 'nat. 6 — the Dorian signature'`, `modalContext: true`
  - Phrygian (alternative for m7): `characteristicNote: '♭2 — defines Phrygian; freely voice in modal context'`, `modalContext: true`
  - Aeolian (alternative for m7): `characteristicNote: '♭6 — Aeolian colour; avoid note in tonal cadences'`
  - Lydian (primary for maj7): `characteristicNote: '♯4 — the Lydian signature'`, `modalContext: true`
  - Mixolydian (alternative for dom7): `characteristicNote: '♭7 — Mixolydian signature'`, `modalContext: true`
  - Locrian sharp 2 (primary for m7b5): `characteristicNote: 'nat. 9 — distinguishes from plain Locrian'`

- [ ] In the UI rendering section, find where scale cards are rendered (search for `extensionLabel` being displayed). Add a small badge below the extension label:
  ```tsx
  {scale.characteristicNote && (
    <div style={{
      marginTop: 6, fontSize: 11, color: '#a78bfa',
      fontFamily: "'DM Mono', monospace",
    }}>
      ✦ {scale.characteristicNote}
    </div>
  )}
  ```

- [ ] For scales with `avoidNotes` length > 0, add a context note in the description if not already present. In the rendering, after the avoid-note dots, show:
  ```tsx
  {scale.avoidNotes.length > 0 && scale.modalContext && (
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
      Avoid note in tonal context — characteristic in modal context
    </div>
  )}
  ```

- [ ] Run `npm run build` — zero errors. Check in browser: load Scale Advisor, select Cmaj7, verify Lydian card shows "✦ ♯4 — the Lydian signature".

- [ ] Commit:
  ```bash
  git add src/features/scale-advisor/ScaleAdvisorFeature.tsx
  git commit -m "feat(scale-advisor): add tonal/modal context badge and characteristic note per scale"
  ```

---

### Task B2: Add 3 dominant chord-scale cases (subV7, sec. dom to minor, sec. dom to major)

The Berklee rule:
- **V7 resolving down a 5th to major** → Mixolydian (T9, S4, T13)
- **V7 resolving down a 5th to minor** → Mixolydian ♭9 ♭13 (Harmonic Minor 5-5 of target)
- **SubV7 (tritone sub, resolving down a half-step)** → Lydian ♭7 (T9, T♯11, T13, NO S4)

Currently the dominant 7th section shows Lydian Dominant as primary and Mixolydian as "diatonic choice". We need to add a contextual info panel.

- [ ] After the main chord-type buttons, for the `'7'` quality, add a "Context" subsection in the UI. Find where quality `'7'` is rendered as the active chord type (search for `quality === '7'` or similar conditional in the render). Add below the scale cards:

  ```tsx
  {/* --- Dominant 7th context guide --- */}
  <div style={{
    background: '#161b22', border: '1px solid #30363d',
    borderRadius: 10, padding: 16, marginTop: 12,
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
      Which dominant scale? — Berklee guide
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { label: 'V7 → major (diatonic)', scale: 'Mixolydian', detail: 'T9, S4, T13 — natural tensions, avoid the 11th', color: '#8b5cf6' },
        { label: 'V7 → minor (sec. dom)', scale: 'Mixolydian ♭9 ♭13', detail: 'T♭9, T♯9(pass), T♭13 — from Harmonic Minor of target', color: '#ec4899' },
        { label: 'subV7 (tritone sub)', scale: 'Lydian ♭7', detail: 'T9, T♯11, T13 — no avoid notes, descends by half-step', color: '#f97316' },
        { label: 'Non-resolving / blues', scale: 'Mixolydian or Blues', detail: 'Free palette — treat as tonic', color: '#10b981' },
      ].map(({ label, scale, detail, color }) => (
        <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 3, background: color, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3' }}>{label}</span>
            <span style={{ fontSize: 12, color: '#a78bfa', marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{scale}</span>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{detail}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
  ```

- [ ] Run `npm run build` — zero errors. In browser: select `7` (Dominant 7th) chord type, scroll down to see the new "Which dominant scale?" guide panel.

- [ ] Commit:
  ```bash
  git add src/features/scale-advisor/ScaleAdvisorFeature.tsx
  git commit -m "feat(scale-advisor): add 3-case dominant chord-scale guide (Berklee)"
  ```

---

## GROUP C — Modal Interchange: Source mode, characteristic note, chord scale, Neapolitan, IV-6

**Files:**
- Modify: `src/features/modal-interchange/ModalInterchangeFeature.tsx`

### Task C1: Expand COMMON_BORROWED with source mode, characteristic note, chord scale

The current `COMMON_BORROWED` has 5 entries with limited info. Expand it to include all standard borrowed chords with full Berklee data.

- [ ] Replace the `COMMON_BORROWED` constant (lines 42-48) with an expanded version:

  ```ts
  const COMMON_BORROWED: Record<string, {
    from: string;
    characteristicNote: string;
    chordScale: string;
    description: string;
  }> = {
    // bVII
    '♭VII_major_Mixolydian': {
      from: 'Aeolian / Mixolydian',
      characteristicNote: '♭7 (nat. 7th of home key becomes ♭7)',
      chordScale: 'Lydian ♭7',
      description: '♭VII major — the most common borrowed chord in jazz, rock, and R&B. V of IV tonality. E.g., B♭Maj7 in C major.',
    },
    '♭VI_major_Aeolian': {
      from: 'Aeolian',
      characteristicNote: '♭6 (Aeolian characteristic)',
      chordScale: 'Lydian',
      description: '♭VI major — dark cinematic color, classic in film scores and neo-soul. E.g., A♭Maj7 in C major.',
    },
    '♭III_major_Aeolian': {
      from: 'Aeolian',
      characteristicNote: '♭3 (parallel minor root)',
      chordScale: 'Lydian',
      description: '♭III major — borrowed from the parallel minor. Warm, melancholic color. E.g., E♭Maj7 in C major.',
    },
    'iv_minor_Aeolian': {
      from: 'Aeolian / Dorian',
      characteristicNote: '♭6 of IV creates iv quality',
      chordScale: 'Dorian',
      description: 'iv minor — replaces IV major with a darker subdominant. The ♭3 of iv (♭6 of home key) is the key color. E.g., Fm7 in C major.',
    },
    'iv_minor6_Dorian': {
      from: 'Dorian',
      characteristicNote: 'nat. 6 of IV = Dorian sound',
      chordScale: 'Dorian',
      description: 'IV minor with major 6 (IV-6) — the Dorian borrowed chord. The maj6 gives it warmth vs. plain iv minor. Classic in jazz-funk.',
    },
    'II_major_Lydian': {
      from: 'Lydian',
      characteristicNote: '♯4 → II chord root',
      chordScale: 'Lydian',
      description: '♯IV (II of Lydian) — bright, floating Lydian color. E.g., D major or DMaj7 in C major.',
    },
    '♭II_major_Phrygian': {
      from: 'Phrygian',
      characteristicNote: '♭2 — the Neapolitan chord',
      chordScale: 'Lydian',
      description: '♭IIMaj7 — the Neapolitan chord. Half-step above tonic, creates strong downward pull. E.g., D♭Maj7 in C major. Very common in jazz reharmonization.',
    },
    'I_minor_Phrygian': {
      from: 'Phrygian / Aeolian',
      characteristicNote: '♭3 replaces major 3rd of tonic',
      chordScale: 'Dorian',
      description: 'I minor — the tonic minor swap. The strongest modal interchange. Switches the home chord from major to minor instantly. E.g., Cm7 in C major.',
    },
  };
  ```

- [ ] In the chord card rendering (find where borrowed chords are displayed — look for `isBorrowed` usage in the JSX), add a tooltip or expanded info panel showing the `from`, `characteristicNote`, and `chordScale` data. Look for where `COMMON_BORROWED` is currently consumed and add:

  ```tsx
  // Below the chord symbol display, when a borrowed annotation exists:
  {annotation && (
    <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.5 }}>
      <div style={{ color: '#a78bfa', fontWeight: 600 }}>
        ← {annotation.from}
      </div>
      <div style={{ color: '#f97316', fontFamily: "'DM Mono', monospace" }}>
        ✦ {annotation.characteristicNote}
      </div>
      <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
        Scale: {annotation.chordScale}
      </div>
    </div>
  )}
  ```

- [ ] Read the Modal Interchange file to find how `COMMON_BORROWED` is looked up (the key format). The current keys like `'♭VII_major_Mixolydian'` need to match whatever lookup pattern is in the code. Check the file around line 80-150 for the lookup logic and adjust the key format if needed.

- [ ] Run `npm run build` — zero errors. In browser: open Modal Interchange with key C, enable Aeolian mode, hover over a borrowed chord to see source mode + characteristic note.

- [ ] Commit:
  ```bash
  git add src/features/modal-interchange/ModalInterchangeFeature.tsx
  git commit -m "feat(modal-interchange): add source mode, characteristic note, chord scale per borrowed chord (Berklee)"
  ```

---

### Task C2: Add Neapolitan (♭IIMaj7) to Modal Interchange

Currently the Neapolitan is in Song Architect but missing from Modal Interchange.

- [ ] Read the file to understand how the mode list and chord display works (lines 58-130). The modes are applied by displaying all 7 diatonic chords of each parallel mode. The Neapolitan (♭II) comes from Phrygian mode — degree 2 of Phrygian from C = Db.

- [ ] Ensure 'phrygian' is in the active modes list and that the ♭IIMaj7 gets the `COMMON_BORROWED` annotation. The key lookup needs to match `'♭II_major_Phrygian'` — verify the lookup logic generates this key correctly.

- [ ] If the Phrygian mode is not displayed by default, add it to the default active set or add a note in the UI that says "Enable Phrygian to see the Neapolitan (♭IIMaj7)".

- [ ] Commit:
  ```bash
  git add src/features/modal-interchange/ModalInterchangeFeature.tsx
  git commit -m "feat(modal-interchange): ensure Neapolitan (bIIMaj7) is annotated from Phrygian"
  ```

---

## GROUP D — Chord Progressions: Backdoor Dominant + minor ii-V-i

**Files:**
- Modify: `src/features/chord-progression/services/templates.ts`
- Modify: `src/features/chord-progression/ChordProgressionFeature.tsx` (Harmony Techniques list)

### Task D1: Add Backdoor Dominant templates

The backdoor dominant is ♭VII7 → I — resolves up a whole step instead of down a fifth. Very common in jazz/R&B. Currently missing from the Harmony Techniques filter.

- [ ] In `src/features/chord-progression/ChordProgressionFeature.tsx`, find the `Harmony Techniques` filter buttons list. Add 'Backdoor II–V' if not present (search: `grep -n "Backdoor\|backdoor" src/features/chord-progression/ChordProgressionFeature.tsx`). If it exists but doesn't trigger templates, proceed to step below. If missing:
  ```tsx
  // Add to the techniques list:
  { id: 'backdoorII-V', label: 'Backdoor II–V' },
  ```

- [ ] In `templates.ts`, add these templates (after existing ii-V-I variants):
  ```ts
  {
    id: 'backdoor-ii-V-I',
    name: '♭II–♭VII7–I (Backdoor)',
    chords: [
      { degree: '♭II', quality: 'major', function: 'Subdominant', technique: 'backdoorII-V' },
      { degree: '♭VII', quality: 'dominant', function: 'Dominant', technique: 'backdoorII-V' },
      { degree: 'I', quality: 'diatonic', function: 'Tonic', technique: 'backdoorII-V' },
    ],
    style: 'modern', techniques: ['backdoorII-V'],
    description: 'The backdoor dominant cadence: ♭VII7 resolves up a whole step to I instead of down a fifth. The ♭VII7 takes Mixolydian (no altered tensions needed — it resolves by step, not by tritone). Very common in jazz and R&B.',
    artists: ['Herbie Hancock', 'Bill Evans', 'Earth Wind & Fire'],
    feel: 'Smooth jazz cadence',
    lengths: [3],
  },
  {
    id: 'backdoor-IV-bVII-I',
    name: 'IV–♭VII7–I (Backdoor with IV)',
    chords: [
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'backdoorII-V' },
      { degree: '♭VII', quality: 'dominant', function: 'Dominant', technique: 'backdoorII-V' },
      { degree: 'I', quality: 'diatonic', function: 'Tonic', technique: 'backdoorII-V' },
    ],
    style: 'classic', techniques: ['backdoorII-V'],
    description: 'IV → ♭VII7 → I — the "Fly Me to the Moon" turnaround approach. IV sets up the backdoor dominant for a warm, gospel-soul resolution. The ♭VII7 takes Lydian ♭7 (same as subV7) in this context.',
    artists: ['Frank Sinatra', 'Stevie Wonder', 'Yussef Dayes'],
    feel: 'Gospel soul resolution',
    lengths: [3],
  },
  ```

- [ ] Run `npm run build` — zero errors. In browser: open Chord Progressions, enable "Backdoor II–V" technique, generate, verify templates appear.

- [ ] Commit:
  ```bash
  git add src/features/chord-progression/services/templates.ts src/features/chord-progression/ChordProgressionFeature.tsx
  git commit -m "feat(chord-progressions): add Backdoor Dominant (bVII7-I) templates and technique filter"
  ```

---

### Task D2: Add minor ii-V-i templates (with correct chord qualities)

The minor ii-V-i uses m7♭5 (half-diminished) for the ii and often 7alt or Phrygian Dom for the V7.

- [ ] In `templates.ts`, add:
  ```ts
  {
    id: 'minor-ii-V-i',
    name: 'ii∅–V7alt–i (minor ii–V–i)',
    chords: [
      { degree: 'II', quality: 'm7b5', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'dominant', function: 'Dominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'minor',    function: 'Tonic',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'The minor ii–V–i: ii is half-diminished (m7♭5), V7 resolves to minor tonic. The V7 chord scale is Phrygian Dominant (5th mode of Harmonic Minor) — note the ♭9 and ♭13 vs. plain Mixolydian. E.g., in C minor: Dm7♭5 → G7(♭9) → Cm.',
    artists: ['Bill Evans', 'John Coltrane', 'Charlie Parker'],
    feel: 'Minor cadence',
    lengths: [3],
  },
  {
    id: 'minor-turnaround',
    name: 'i–VI–ii∅–V7alt (minor turnaround)',
    chords: [
      { degree: 'I',   quality: 'minor', function: 'Tonic', technique: 'diatonic' },
      { degree: 'VI',  quality: 'major', function: 'Tonic', technique: 'diatonic' },
      { degree: 'II',  quality: 'm7b5',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'dominant', function: 'Dominant', technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Classic minor turnaround. The VI major (♭VI in minor) sets up the half-diminished ii before the altered dominant. Standard in jazz standards and bossa nova. E.g., in C minor: Cm → A♭ → Dm7♭5 → G7(♭9).',
    artists: ['Antonio Carlos Jobim', 'Bill Evans', 'Miles Davis'],
    feel: 'Minor jazz standard',
    lengths: [4],
  },
  ```

- [ ] Run `npm run build` — zero errors.

- [ ] Commit:
  ```bash
  git add src/features/chord-progression/services/templates.ts
  git commit -m "feat(chord-progressions): add minor ii-V-i templates with correct m7b5 quality"
  ```

---

## GROUP E — Harmonic Analysis: Backdoor dom detection, borrowed chord labels, dim7 as Dom7b9

**Files:**
- Modify: `src/features/harmonic-analysis/HarmonicAnalysisFeature.tsx`

### Task E1: Detect and label Backdoor Dominant (♭VII7 → I)

- [ ] Read `src/features/harmonic-analysis/HarmonicAnalysisFeature.tsx` lines 1-100 to understand the pattern detection structure. Search for `PATTERNS` or `patterns` array.

- [ ] In the patterns detection logic, add:
  ```ts
  {
    id: 'backdoor-dominant',
    name: 'Backdoor Dominant',
    test: (chords: ParsedChord[], i: number, detectedKey: string) => {
      if (i < 0 || i >= chords.length - 1) return false;
      const curr = chords[i];
      const next = chords[i + 1];
      // curr must be ♭VII7 relative to key, next must be I
      const keyChroma = Note.get(detectedKey).chroma ?? 0;
      const currChroma = Note.get(curr.root).chroma ?? 0;
      const nextChroma = Note.get(next.root).chroma ?? 0;
      const currDegree = (currChroma - keyChroma + 12) % 12;
      const nextDegree = (nextChroma - keyChroma + 12) % 12;
      // ♭VII = semitone 10, I = semitone 0, curr must be dominant quality
      return currDegree === 10 && nextDegree === 0 && curr.quality?.includes('7');
    },
    description: 'Backdoor dominant: ♭VII7 → I — resolves up a whole step. The ♭VII7 takes Lydian ♭7 or Mixolydian. Common in jazz and R&B.',
    label: 'backdoor-V7',
  }
  ```

- [ ] Test in browser: enter `Bb7 Cmaj7` in Harmonic Analysis (key C), verify "Backdoor Dominant" pattern is detected.

- [ ] Commit:
  ```bash
  git add src/features/harmonic-analysis/HarmonicAnalysisFeature.tsx
  git commit -m "feat(harmonic-analysis): detect Backdoor Dominant (bVII7->I) pattern"
  ```

---

### Task E2: Label modal interchange chords with source mode

- [ ] In the chord function analysis section (where chords are given T/SD/D labels), add logic to detect borrowed chords and label with source mode. Look for where chord functions are assigned.

- [ ] Add a `borrowedFrom` field to the chord analysis output. Use this mapping:
  ```ts
  const BORROWED_CHORD_SOURCES: Record<number, string> = {
    // semitone offset of chord root from home key → source description
    10: '♭VII — from Aeolian/Mixolydian',
    8:  '♭VI — from Aeolian',
    3:  '♭III — from Aeolian',
    // iv minor: check quality too
    5:  'IV min — from Aeolian/Dorian (if minor quality)',
    1:  '♭II (Neapolitan) — from Phrygian',
    // I minor: same root, minor quality
    0:  'I min — from Phrygian/Aeolian (if minor quality)',
  };
  ```

- [ ] Display the source mode label below the function badge in the chord card:
  ```tsx
  {chord.borrowedFrom && (
    <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 3, fontStyle: 'italic' }}>
      ← {chord.borrowedFrom}
    </div>
  )}
  ```

- [ ] Commit:
  ```bash
  git add src/features/harmonic-analysis/HarmonicAnalysisFeature.tsx
  git commit -m "feat(harmonic-analysis): label borrowed chords with source parallel mode"
  ```

---

### Task E3: Detect dim7 as rootless Dom7♭9

- [ ] In the chord analysis logic, when a diminished 7th chord (°7) is detected, add an annotation:
  ```ts
  // A dim7 chord = rootless Dom7b9. B°7 = G7b9 (root G missing).
  // The root of the Dom7b9 is a major 3rd below the dim7 root.
  if (chord.quality === 'dim7') {
    const rootChroma = Note.get(chord.root).chroma ?? 0;
    const dominantRoot = NOTE_NAMES[(rootChroma - 4 + 12) % 12]; // maj 3rd below
    chord.dim7Annotation = `= ${dominantRoot}7♭9 (rootless)`;
  }
  ```

- [ ] Display below the chord name:
  ```tsx
  {chord.dim7Annotation && (
    <div style={{ fontSize: 10, color: '#f97316', fontFamily: "'DM Mono', monospace" }}>
      {chord.dim7Annotation}
    </div>
  )}
  ```

- [ ] Test: enter `B°7 Cmaj7` in Harmonic Analysis, verify "= G7♭9 (rootless)" appears.

- [ ] Commit:
  ```bash
  git add src/features/harmonic-analysis/HarmonicAnalysisFeature.tsx
  git commit -m "feat(harmonic-analysis): annotate dim7 chords as rootless Dom7b9"
  ```

---

## GROUP F — Reharmonization Lab: 6 Berklee techniques

**Files:**
- Modify: `src/features/reharmonization/ReharmonizationFeature.tsx`

### Task F1: Expand to 6 Berklee reharmonization techniques

Currently shows 4 Jeff Schneider techniques (Float Chord, Secondary Dominant, Tritone Sub, Minor Plagal). Replace/expand to the 6 Berklee categories.

- [ ] Read `src/features/reharmonization/ReharmonizationFeature.tsx` lines 1-100 to understand the technique card data structure.

- [ ] Find the technique definitions (search for 'FLOAT CHORD', 'SECONDARY DOMINANT', 'TRITONE SUB', 'MINOR PLAGAL' in the file). Replace with:
  ```ts
  const TECHNIQUES = [
    {
      id: 'diatonic-sub',
      name: 'Diatonic Substitution',
      color: '#06b6d4',
      shortDesc: 'Replace a chord with a diatonic chord sharing 2+ common tones.',
      detail: 'Tonic substitutes: I → III-7 or VI-7 (both share 3rd and 5th with I). Subdominant substitutes: IV → II-7. These share melody notes and chord tones, making the substitution transparent.',
      example: 'Cmaj7 → Em7 or Am7 | Fmaj7 → Dm7',
    },
    {
      id: 'secondary-dominant',
      name: 'Secondary Dominant',
      color: '#8b5cf6',
      shortDesc: 'V7 of any diatonic chord — brief tonicization.',
      detail: 'Every diatonic chord can be preceded by its own V7. The secondary dominant creates a brief pull toward its target before resolving. Takes Mixolydian chord scale (when targeting a major chord) or Mixolydian ♭9 ♭13 (when targeting a minor chord).',
      example: 'A7 → Dm7 (V7/II) | E7 → Am7 (V7/VI) | D7 → G7 (V7/V)',
    },
    {
      id: 'related-ii',
      name: 'Related II–7 Insertion',
      color: '#10b981',
      shortDesc: 'Add the II-7 of any dominant 7th to create a ii–V approach.',
      detail: 'Before any dominant 7th chord, insert its related II-7 chord (a perfect 5th above the dominant). Turns a single dominant into a full ii–V. The II-7 can replace or precede the dominant.',
      example: 'G7 → Cmaj7 becomes Dm7 → G7 → Cmaj7',
    },
    {
      id: 'tritone-sub',
      name: 'Tritone Substitution (subV7)',
      color: '#f59e0b',
      shortDesc: 'Replace any V7 with the dominant 7th a tritone away.',
      detail: 'The subV7 shares the tritone (3rd and ♭7th) of the original V7. It resolves down by half step instead of down a fifth. Always takes Lydian ♭7 chord scale (T9, T♯11, T13 — no avoid notes). Bass descends chromatically.',
      example: 'G7 → Cmaj7 becomes D♭7 → Cmaj7 | Full chain: Dm7 → D♭7 → Cmaj7',
    },
    {
      id: 'modal-interchange',
      name: 'Modal Interchange',
      color: '#ef4444',
      shortDesc: 'Borrow a chord from the parallel mode.',
      detail: 'Replace a diatonic chord with its parallel mode equivalent. The most impactful: I→Im7 (tonic minor swap), IV→IVm (dark subdominant), ♭VIIMaj7 (backdoor dominant setup), ♭VIMaj7 (cinematic color).',
      example: 'Cmaj7 → Cm7 | Fmaj7 → Fm7 | Cmaj7 → B♭maj7',
    },
    {
      id: 'chromatic-approach',
      name: 'Chromatic Approach Chord',
      color: '#ec4899',
      shortDesc: 'Insert a chord a half step above or below the target.',
      detail: 'A dominant 7th or diminished chord a half step above or below the destination creates chromatic voice leading tension. The approach chord is always momentary (one beat to half a bar). Also: dim7 as rootless Dom7♭9 (B°7 = G7♭9).',
      example: '... D♭7 → Cmaj7 (half-step above) | B°7 → Cmaj7 (B°7 = G7♭9)',
    },
  ];
  ```

- [ ] Re-render the technique cards using this new data. Each card should show: colored accent bar, name, shortDesc, detail, example.

- [ ] Keep the "Add Journey Chords" progression tool functional — just update the technique selection to use the new IDs.

- [ ] Run `npm run build` — zero errors. In browser: open Reharmonization Lab, verify 6 technique cards appear.

- [ ] Commit:
  ```bash
  git add src/features/reharmonization/ReharmonizationFeature.tsx
  git commit -m "feat(reharmonization): expand to 6 Berklee techniques with examples and chord scales"
  ```

---

### Task F2: Add tritone substitution chain visualization

- [ ] After the technique cards, add a "Full Tritone Chain" example visualization:
  ```tsx
  <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, marginTop: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
      Tritone Sub Chain — complete II–V–I reharmonization
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {[
        { chord: 'Dm7', label: 'II-7', color: '#06b6d4' },
        { chord: '→', label: '', color: 'transparent' },
        { chord: 'A♭7', label: 'subV7/V', color: '#f59e0b', note: '(= D♭7 is subV of G)' },
        { chord: '→', label: '', color: 'transparent' },
        { chord: 'D♭7', label: 'subV7', color: '#f59e0b' },
        { chord: '→', label: '', color: 'transparent' },
        { chord: 'Cmaj7', label: 'I', color: '#10b981' },
      ].map(({ chord, label, color, note }, i) => (
        chord === '→' ? (
          <span key={i} style={{ color: '#4b5563', fontSize: 20 }}>→</span>
        ) : (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Syne', sans-serif" }}>{chord}</div>
            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{label}</div>
            {note && <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 1 }}>{note}</div>}
          </div>
        )
      ))}
    </div>
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>
      All bass motion is by half step ↓. All chord scales are Lydian ♭7.
    </div>
  </div>
  ```

- [ ] The visualization should be transposable based on the current progression's detected key (use the key of the destination chord I as reference).

- [ ] Commit:
  ```bash
  git add src/features/reharmonization/ReharmonizationFeature.tsx
  git commit -m "feat(reharmonization): add tritone substitution chain visualization"
  ```

---

## GROUP G — Voice Leading Lab: Guide tone tracking, minor 9th warning, parallel motion flags

**Files:**
- Modify: `src/features/voice-leading/VoiceLeadingFeature.tsx`

### Task G1: Highlight guide tones (3rd and 7th) in voice movement

The 3rd and 7th are the guide tones — they define the chord quality and move most smoothly in ii–V–I progressions.

- [ ] Read lines 1-100 of `src/features/voice-leading/VoiceLeadingFeature.tsx` to understand the voice data structure (LEAD, ALTO, TENOR, BASS rows and their FROM/TO/interval display).

- [ ] For each voice row, determine if the FROM note is the 3rd or 7th of chord A, and if the TO note is the 3rd or 7th of chord B. Add a `isGuideTone` flag and display it:
  ```tsx
  // When displaying each voice row, add after the note name:
  {voice.isFromGuideTone && (
    <span style={{
      fontSize: 9, background: '#7c3aed22', color: '#a78bfa',
      border: '1px solid #7c3aed40', borderRadius: 4, padding: '1px 4px', marginLeft: 4,
    }}>
      GT
    </span>
  )}
  ```

- [ ] Below the voice movement table, add a guide tone section:
  ```tsx
  <div style={{ marginTop: 14, padding: '10px 14px', background: '#0d1117', borderRadius: 8, border: '1px solid #21262d' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      Guide Tone Movement (3rd &amp; 7th)
    </div>
    <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.7 }}>
      The 3rd and 7th define chord quality and voice lead smoothly between chords.
      In a ii–V–I: the 7th of II-7 becomes the 3rd of V7; the 3rd of II-7 is a common tone with the 7th of V7.
    </div>
  </div>
  ```

- [ ] Commit:
  ```bash
  git add src/features/voice-leading/VoiceLeadingFeature.tsx
  git commit -m "feat(voice-leading): highlight guide tones (3rd and 7th) in voice movement table"
  ```

---

### Task G2: Add minor 9th interval warning between adjacent voices

The rule (Modern Jazz Voicings p. 34): a minor 9th (13 semitones) between any two adjacent chord voices creates harsh dissonance in tonal voicings — always avoid.

- [ ] In the voicing calculation logic, after generating all voice positions (LEAD, ALTO, TENOR, BASS), check each adjacent pair for a minor 9th interval. A minor 9th = 13 semitones.

- [ ] Add a warning badge to the voicing display:
  ```tsx
  {voicing.hasMinorNinth && (
    <div style={{
      marginTop: 8, padding: '6px 10px',
      background: '#7f1d1d22', border: '1px solid #ef4444',
      borderRadius: 6, fontSize: 11, color: '#ef4444',
    }}>
      ⚠️ Minor 9th interval between voices — avoid in tonal contexts (Modern Jazz Voicings rule)
    </div>
  )}
  ```

- [ ] Commit:
  ```bash
  git add src/features/voice-leading/VoiceLeadingFeature.tsx
  git commit -m "feat(voice-leading): warn on minor 9th interval between adjacent voices"
  ```

---

### Task G3: Flag parallel 5ths and octaves

- [ ] In the voice movement data, for each pair of voices (LEAD+ALTO, ALTO+TENOR, TENOR+BASS), check if both voices move from a perfect 5th to a perfect 5th (or octave to octave) in parallel motion. Parallel = both voices move in the same direction.

- [ ] Flag with:
  ```tsx
  {voicing.parallelFifths?.length > 0 && (
    <div style={{ marginTop: 8, padding: '6px 10px', background: '#7f1d1d22', border: '1px solid #f59e0b', borderRadius: 6, fontSize: 11, color: '#f59e0b' }}>
      ⚠️ Parallel 5ths: {voicing.parallelFifths.join(', ')} — avoid in tonal voice leading
    </div>
  )}
  ```

- [ ] Commit:
  ```bash
  git add src/features/voice-leading/VoiceLeadingFeature.tsx
  git commit -m "feat(voice-leading): flag parallel perfect 5ths and octaves"
  ```

---

## GROUP H — Piano Voicings: Minor 9th warning, tritone rule, UST theory

**Files:**
- Modify: `src/features/chord-voicings/` (hooks/useChordVoicings.ts or VoicingResults component)

### Task H1: Add minor 9th check per voicing

- [ ] Read `src/features/chord-voicings/components/VoicingResults.tsx` to understand how individual voicings are rendered.

- [ ] For each voicing, compute intervals between adjacent notes (sorted by pitch). If any adjacent pair is 13 semitones apart, flag `hasMinorNinth: true`.

- [ ] Display warning in the voicing card:
  ```tsx
  {voicing.hasMinorNinth && (
    <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>
      ⚠️ Minor 9th between voices — avoid in tonal voicings
    </div>
  )}
  ```

- [ ] Commit:
  ```bash
  git add src/features/chord-voicings/
  git commit -m "feat(piano-voicings): warn on minor 9th interval in voicings"
  ```

---

### Task H2: Add tritone rule display for dominant 7th voicings

The rule: any dominant 7th voicing must contain both the 3rd AND the ♭7th (the tritone). Without both, the chord loses dominant function.

- [ ] In the voicing card rendering, for dominant 7th chords (`voicing.chordType === 'dom7'` or similar), check if both the 3rd (4 semitones from root) and ♭7th (10 semitones) are present. If either is missing, flag:
  ```tsx
  {isDominant && voicing.missingTritone && (
    <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>
      ⚠️ Missing tritone — {voicing.missingNote} absent. Dominant function weakened.
    </div>
  )}
  ```

- [ ] For dominant voicings that DO contain the tritone, add a small confirmation:
  ```tsx
  {isDominant && !voicing.missingTritone && (
    <span style={{ fontSize: 10, color: '#10b981', marginLeft: 6 }}>✓ tritone</span>
  )}
  ```

- [ ] Commit:
  ```bash
  git add src/features/chord-voicings/
  git commit -m "feat(piano-voicings): add tritone presence check for dominant 7th voicings"
  ```

---

### Task H3: Add Upper Structure Triad theory panel

Upper structure triads (UST) = major or minor triad in close position placed above a 3-note basic sound (1-3-7). The triad must contain at least one tension. Separation from lower structure: min. a major 3rd.

- [ ] In `VoicingResults.tsx` (or `ChordVoicingsFeature.tsx`), add an "Upper Structure Triads" info section for dominant and major 7th chords. Show below the voicing cards when the `Upper Structure` style is selected:
  ```tsx
  {activeStyles.includes('Upper Structure') && (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Upper Structure Triad — construction rules
      </div>
      <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.7 }}>
        <strong style={{ color: '#e6edf3' }}>Lower structure:</strong> Root, 3rd, 7th (the "shell voicing" — defines chord quality)<br />
        <strong style={{ color: '#e6edf3' }}>Upper structure:</strong> Close-position major or minor triad — must contain at least one tension (9, ♯11, 13, etc.)<br />
        <strong style={{ color: '#e6edf3' }}>Separation rule:</strong> Upper triad must sit at least a major 3rd above the top note of the lower structure<br />
        <strong style={{ color: '#e6edf3' }}>Common USTs on G7:</strong> A major triad (9, ♯11, 13), B major (3, ♯5, 7), F♯ minor (♯11, 13, 7), B♭ minor (♭9, ♭13, ♭7)
      </div>
    </div>
  )}
  ```

- [ ] Commit:
  ```bash
  git add src/features/chord-voicings/
  git commit -m "feat(piano-voicings): add Upper Structure Triad construction guide panel"
  ```

---

## Final validation

- [ ] Run `npm run build` from repo root — zero TypeScript errors, zero lint warnings.
- [ ] Run `npm run dev` and test each changed feature in the browser:
  - Scale Advisor: Phrygian shows 2 avoid notes, dominant shows 3-case guide, characteristic notes visible
  - Modal Interchange: borrowed chords show source mode + char. note + chord scale
  - Chord Progressions: Backdoor Dominant in techniques, minor ii-V-i templates available
  - Harmonic Analysis: `Bb7 Cmaj7` detects backdoor, `B°7 Cmaj7` shows G7♭9 annotation
  - Reharmonization Lab: 6 technique cards visible
  - Voice Leading: guide tones marked GT, minor 9th warnings appear
  - Piano Voicings: minor 9th flags, tritone confirmation on dom7, UST guide shows

- [ ] Final commit:
  ```bash
  git add -A
  git commit -m "feat: Berklee harmony full refactor — all features aligned with Jazz Harmony, Jazz Composition, Modern Jazz Voicings"
  ```

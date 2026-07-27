# Chord Progression — Playback Fix + Per-Chord Voicing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix audio playback bugs in chord-progression (some chords silent/deformed) and add a per-chord voicing style selector (Closed, Drop 2, Shell, etc.) with a `<select>` dropdown integrated in each chord block.

**Architecture:** Two bug fixes in `chordAudio.ts` and `ProgressionDisplay.tsx` restore reliable Web Audio API usage. The voicing feature adds a `chordVoicingStyles` state map in `ProgressionDetail`, a module-level `getVoicedNotes()` helper that delegates to the existing `generateVoicings()` from `chord-voicings`, and a `<select>` UI element in `ChordBlock`. A `prevoiced` flag on `playChordSequence` lets the caller pass already-voiced notes without double-processing.

**Tech Stack:** React 18, TypeScript, Web Audio API, `@features/chord-voicings/services/voicingGenerator` (existing)

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/shared/utils/chordAudio.ts` | Modify | `playNote()` self-inits AudioContext; `playChordSequence()` gets `prevoiced` param |
| `src/features/chord-progression/components/ProgressionDisplay.tsx` | Modify | Preload on mount, voicing state, `getVoicedNotes()`, updated `togglePlay`, voicing UI in `ChordBlock` |

---

## Task 1: Fix `playNote()` — self-initialise AudioContext

**Files:**
- Modify: `src/shared/utils/chordAudio.ts:165`

**Why:** `resumeAudioContext()` is a no-op when `this.audioContext === null`. Adding `initAudioContext()` before it guarantees the Web Audio path is always taken. `initAudioContext()` has no `await` in its own body so the AudioContext is assigned synchronously before the function yields — safe to call from a setTimeout.

- [ ] **Step 1: Edit `playNote()` — add self-init as first line**

In `src/shared/utils/chordAudio.ts`, locate `playNote` (line ~165). The current opening is:

```ts
async playNote(note: string, volume = 1.0): Promise<void> {
  await this.resumeAudioContext();
```

Change it to:

```ts
async playNote(note: string, volume = 1.0): Promise<void> {
  if (!this.audioContext) await this.initAudioContext();
  await this.resumeAudioContext();
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: no new errors related to `chordAudio.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/chordAudio.ts
git commit -m "fix(chord-progression): playNote self-initialises AudioContext when null"
```

---

## Task 2: Add `prevoiced` param to `playChordSequence()`

**Files:**
- Modify: `src/shared/utils/chordAudio.ts:254`

**Why:** `ModulationCycles.tsx` also calls `playChordSequence` and passes pitch classes (no octave). The new caller (`ProgressionDisplay`) will pass already-voiced notes (with octave). A `prevoiced` boolean lets `playChordSequence` skip its internal `voiceChord()` call for pre-voiced input, without breaking `ModulationCycles`.

- [ ] **Step 1: Edit `playChordSequence()` — add `prevoiced` parameter**

In `src/shared/utils/chordAudio.ts`, locate `playChordSequence` (line ~254). Replace the current signature and the internal `playChord` call:

Current:
```ts
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
```

Replace with:
```ts
export function playChordSequence(
  chords: { notes: string[] }[],
  bpm: number,
  onChordStart?: (index: number) => void,
  onEnd?: () => void,
  prevoiced = false,
): SequenceHandle {
  let stopped = false;
  const timers: number[] = [];
  const barMs = (60_000 / bpm) * 4;

  chords.forEach((c, i) => {
    timers.push(window.setTimeout(() => {
      if (stopped) return;
      onChordStart?.(i);
      void audioPlayer.playChord(prevoiced ? c.notes : voiceChord(c.notes.slice(0, 5)));
    }, i * barMs));
  });
```

- [ ] **Step 2: TypeScript check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors. `ModulationCycles` still compiles because the new parameter has a default value.

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/chordAudio.ts
git commit -m "feat(chord-audio): add prevoiced param to playChordSequence"
```

---

## Task 3: Fix `ProgressionDisplay` — preload on mount + init in `togglePlay`

**Files:**
- Modify: `src/features/chord-progression/components/ProgressionDisplay.tsx:2,243,253`

- [ ] **Step 1: Update import line**

Current line 2:
```ts
import { playChordSequence, type SequenceHandle } from '@shared/utils/chordAudio';
```

Replace with:
```ts
import { playChordSequence, voiceChord, audioPlayer, type SequenceHandle } from '@shared/utils/chordAudio';
```

- [ ] **Step 2: Preload samples on mount**

In `ProgressionDetail` (line ~243), after the existing `useEffect` lines, add:

```ts
useEffect(() => { void audioPlayer.preloadAllNotes(); }, []);
```

The existing effects look like:
```ts
useEffect(() => () => handleRef.current?.stop(), []);
useEffect(() => { handleRef.current?.stop(); }, [progression.id, progression.seed, showEnriched]);
```

Add the new line immediately after them:
```ts
useEffect(() => { void audioPlayer.preloadAllNotes(); }, []);
```

- [ ] **Step 3: Add `initAudioContext()` call in `togglePlay`**

Current `togglePlay` (line ~253):
```ts
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

Replace with:
```ts
function togglePlay() {
  if (isPlaying) {
    handleRef.current?.stop();
    return;
  }
  void audioPlayer.initAudioContext();
  handleRef.current = playChordSequence(
    displayChords,
    bpm,
    i => setPlayingIndex(i),
    () => setPlayingIndex(null),
  );
}
```

- [ ] **Step 4: TypeScript check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/chord-progression/components/ProgressionDisplay.tsx
git commit -m "fix(chord-progression): preload audio samples on mount, init AudioContext on play"
```

---

## Task 4: Add `getVoicedNotes()` helper and voicing state

**Files:**
- Modify: `src/features/chord-progression/components/ProgressionDisplay.tsx`

- [ ] **Step 1: Add new imports at top of file**

After the existing imports, add:
```ts
import { generateVoicings } from '@features/chord-voicings/services/voicingGenerator';
import type { ParsedChord } from '@features/chord-voicings/types/chord.types';
```

- [ ] **Step 2: Add `getVoicedNotes()` at module level**

Add this function immediately after all import statements (before the `QUALITY_SCALES` constant or any other top-level declarations):

```ts
function getVoicedNotes(chord: ResolvedChord, style: string): string[] {
  if (style === 'auto') return voiceChord(chord.notes.slice(0, 5));
  const parsed: ParsedChord = { root: chord.root, chordType: chord.quality, bass: null };
  const voicings = generateVoicings(parsed);
  const match = voicings.find(v => v.style === style);
  if (!match || match.notes.length === 0) return voiceChord(chord.notes.slice(0, 5));
  return match.notes.map(n => `${n.note}${n.octave}`);
}
```

- [ ] **Step 3: Add voicing state to `ProgressionDetail`**

Inside `ProgressionDetail`, after the existing `useState` declarations (after `const [bpm, setBpm] = useState(90);`), add:

```ts
const [chordVoicingStyles, setChordVoicingStyles] = useState<Record<number, string>>({});
```

- [ ] **Step 4: Add reset effect for voicing state**

After the existing `useEffect` that stops on progression/seed/showEnriched change, add:

```ts
useEffect(() => { setChordVoicingStyles({}); }, [progression.id, showEnriched]);
```

This resets per-chord voicing choices when the user switches progressions or toggles Base/Arricchita.

- [ ] **Step 5: Update `togglePlay` to use `getVoicedNotes`**

Replace the current `togglePlay` (which you edited in Task 3) with:

```ts
function togglePlay() {
  if (isPlaying) {
    handleRef.current?.stop();
    return;
  }
  void audioPlayer.initAudioContext();
  const voicedChords = displayChords.map((c, i) => ({
    notes: getVoicedNotes(c, chordVoicingStyles[i] ?? 'auto'),
  }));
  handleRef.current = playChordSequence(
    voicedChords,
    bpm,
    i => setPlayingIndex(i),
    () => setPlayingIndex(null),
    true,
  );
}
```

- [ ] **Step 6: TypeScript check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors. If TypeScript complains about `ParsedChord.bass`, check its type in `src/features/chord-voicings/types/chord.types.ts` — it should be `string | null`.

- [ ] **Step 7: Commit**

```bash
git add src/features/chord-progression/components/ProgressionDisplay.tsx
git commit -m "feat(chord-progression): add per-chord voicing state and getVoicedNotes helper"
```

---

## Task 5: Add voicing selector UI to `ChordBlock`

**Files:**
- Modify: `src/features/chord-progression/components/ProgressionDisplay.tsx:521`

- [ ] **Step 1: Add voicing options constant**

At module level (near the top, after imports), add:

```ts
const VOICING_OPTIONS = [
  { value: 'auto',           label: 'Auto' },
  { value: 'closed',         label: 'Closed' },
  { value: 'drop2',          label: 'Drop 2' },
  { value: 'drop3',          label: 'Drop 3' },
  { value: 'shell',          label: 'Shell' },
  { value: 'rootless',       label: 'Rootless' },
  { value: 'open',           label: 'Open' },
  { value: 'spread',         label: 'Spread' },
  { value: 'quartal',        label: 'Quartal' },
  { value: 'upperStructure', label: 'Upper Str.' },
] as const;
```

- [ ] **Step 2: Add props to `ChordBlock`**

Locate the `ChordBlock` function signature (line ~521):

```ts
function ChordBlock({ chord, index, total, playing = false }: {
  chord: ResolvedChord; index: number; total: number; playing?: boolean;
}) {
```

Replace with:

```ts
function ChordBlock({ chord, index, total, playing = false, voicingStyle = 'auto', onVoicingChange }: {
  chord: ResolvedChord; index: number; total: number; playing?: boolean;
  voicingStyle?: string; onVoicingChange?: (style: string) => void;
}) {
```

- [ ] **Step 3: Add voicing selector row inside the chord block**

Inside `ChordBlock`, locate the Scale section (the `<div>` with `borderTop: '1px solid #21262d'` and "Scale" label). Add a new voicing row **after** the Scale section div, before the closing of the main block `<div>`:

```tsx
{/* Voicing selector */}
<div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid #21262d' }}>
  <div style={{
    fontSize: 9, color: voicingStyle !== 'auto' ? '#a78bfa' : '#4b5563',
    letterSpacing: '0.06em', marginBottom: 3, textTransform: 'uppercase',
  }}>
    Voicing
  </div>
  <select
    value={voicingStyle}
    onChange={e => { e.stopPropagation(); onVoicingChange?.(e.target.value); }}
    onClick={e => e.stopPropagation()}
    style={{
      width: '100%', background: '#0d1117',
      border: '1px solid #30363d', borderRadius: 3,
      color: '#c4b5fd', fontSize: 10, padding: '2px 4px', cursor: 'pointer',
    }}
  >
    {VOICING_OPTIONS.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 4: Pass voicing props from `ProgressionDetail` to `ChordBlock`**

In `ProgressionDetail`, locate the chord blocks render (the `displayChords.map` inside the "Chord blocks" div, around line ~362):

```tsx
{displayChords.map((chord, i) => (
  <ChordBlock
    key={`${progression.seed}-${showEnriched}-${i}`}
    chord={chord} index={i + 1} total={displayChords.length}
    playing={playingIndex === i}
  />
))}
```

Replace with:

```tsx
{displayChords.map((chord, i) => (
  <ChordBlock
    key={`${progression.seed}-${showEnriched}-${i}`}
    chord={chord} index={i + 1} total={displayChords.length}
    playing={playingIndex === i}
    voicingStyle={chordVoicingStyles[i] ?? 'auto'}
    onVoicingChange={style => setChordVoicingStyles(prev => ({ ...prev, [i]: style }))}
  />
))}
```

- [ ] **Step 5: TypeScript check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/chord-progression/components/ProgressionDisplay.tsx
git commit -m "feat(chord-progression): add per-chord voicing selector to chord blocks"
```

---

## Task 6: Browser verification

**Files:** none (testing only)

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open http://localhost:3000, navigate to **Chord Progression**.

- [ ] **Step 2: Verify bug fix — playback**

1. Generate a progression (click "Genera").
2. Click **▶ Play** — all chords should play cleanly with correct polyphony. No silent chords.
3. Switch to a different progression in the list, click ▶ Play — should work immediately.
4. Open DevTools Console — no `NotAllowedError` or audio-related errors.

- [ ] **Step 3: Verify voicing selectors appear**

Each chord block should show a "VOICING" label + `<select>` dropdown at the bottom with 10 options (Auto → Upper Str.).

- [ ] **Step 4: Verify voicing selection affects playback**

1. Set chord 1 to "Shell" and chord 2 to "Drop 2", leave rest on "Auto".
2. Click **▶ Play** — chord 1 should sound sparse (3 notes: root + 3rd + 7th), chord 2 spread (drop-2 position), rest in open voicing.
3. The "VOICING" label should turn purple when a non-auto style is selected.

- [ ] **Step 5: Verify reset on progression switch**

1. Set some chord voicings.
2. Click a different progression in the list — voicing selectors should reset to "Auto".

- [ ] **Step 6: Verify ModulationCycles unaffected**

Navigate to **Chord Progression → Cicli di Modulazione** tab (if present). Play a cycle — should still work correctly (the `prevoiced=false` default keeps the old behaviour).

- [ ] **Step 7: Final build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: `✓ built in Xs` with zero TypeScript errors.

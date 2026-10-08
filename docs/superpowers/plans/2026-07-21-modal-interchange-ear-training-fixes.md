# Modal Interchange Minor Modes + Ear Training Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 12 parallel modes from harmonic/melodic minor to Modal Interchange, and fix 4 audio UX bugs (button lock, auto-play, isPlaying tracking, audio overlap) across all standard ear training exercises.

**Architecture:** Two independent workstreams. Modal Interchange: extend the `Mode` union type, add data records, update `modeOrder`, and add CSS group dividers in `ModeTable`. Ear Training: extend `AudioPlayer` with `stopAll()`, then apply the same 4-point fix pattern to each of the 6 affected exercises.

**Tech Stack:** React 18, TypeScript, Web Audio API, Vite. No test suite — validate with `npm run build` then manual browser test.

---

## File Map

| File | Change |
|---|---|
| `src/features/modal-interchange/types/modalInterchange.types.ts` | Extend `Mode` union with 12 new identifiers |
| `src/features/modal-interchange/services/modalInterchangeData.ts` | Add `MODE_INTERVALS`, `MODE_QUALITIES`, `MODE_LABELS` for 12 modes; update `modeOrder` |
| `src/features/modal-interchange/components/ModeTable.tsx` | Add group divider rows between diatonic / HM / MM sections |
| `src/features/modal-interchange/styles/_modal-interchange.css` | Add `.mode-group-divider` style |
| `src/features/ear-training/utils/audio-player.ts` | Add `activeSources` tracking + `stopAll()` method |
| `src/features/ear-training/components/IntervalsExercise.tsx` | Bugs A+B+C+D |
| `src/features/ear-training/components/ChordsExercise.tsx` | Bugs A+B+C+D |
| `src/features/ear-training/components/ScalesExercise.tsx` | Bugs A+B+C+D |
| `src/features/ear-training/components/ScaleDegreesExercise.tsx` | Bugs A+B+C+D |
| `src/features/ear-training/components/IntervalsInContextExercise.tsx` | Bugs A+B+C+D |
| `src/features/ear-training/components/ChordProgressionsExercise.tsx` | Bugs A+B+C+D |

---

## Task 1: Extend Mode union type

**Files:**
- Modify: `src/features/modal-interchange/types/modalInterchange.types.ts`

- [ ] **Replace the `Mode` type** on line 3 with the extended union:

```typescript
export type Mode =
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian'
  | 'harmonic-minor' | 'melodic-minor'
  | 'locrian-natural6' | 'ionian-sharp5' | 'dorian-sharp4' | 'phrygian-dominant' | 'lydian-sharp2' | 'altered-diminished'
  | 'dorian-b2' | 'lydian-augmented' | 'lydian-dominant' | 'mixolydian-b6' | 'locrian-natural2' | 'altered';
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep -E "error|Mode"
```

Expected: no type errors for `Mode`. (Other errors may appear because data records haven't been updated yet — that's fine.)

---

## Task 2: Add harmonic minor mode data

**Files:**
- Modify: `src/features/modal-interchange/services/modalInterchangeData.ts`

- [ ] **Add harmonic minor mode entries to `MODE_QUALITIES`** (after the `'melodic-minor'` entry):

```typescript
  // Harmonic Minor derived modes
  'locrian-natural6':    ['m7b5', 'maj7#5', 'm7', '7',    'maj7', 'dim7',   'mMaj7'  ],
  'ionian-sharp5':       ['maj7#5', 'm7',  '7',   'maj7', 'dim7', 'mMaj7',  'm7b5'   ],
  'dorian-sharp4':       ['m7',   '7',    'maj7', 'dim7', 'mMaj7', 'm7b5',  'maj7#5' ],
  'phrygian-dominant':   ['7',    'maj7', 'dim7', 'mMaj7','m7b5', 'maj7#5', 'm7'     ],
  'lydian-sharp2':       ['maj7', 'dim7', 'mMaj7','m7b5', 'maj7#5','m7',    '7'      ],
  'altered-diminished':  ['dim7', 'mMaj7','m7b5', 'maj7#5','m7',  '7',      'maj7'   ],
```

- [ ] **Add melodic minor mode entries to `MODE_QUALITIES`** (immediately after the harmonic minor block):

```typescript
  // Melodic Minor derived modes
  'dorian-b2':        ['m7',    'maj7#5', '7',     '7',     'm7b5',  'm7b5',  'mMaj7'  ],
  'lydian-augmented': ['maj7#5','7',      '7',     'm7b5',  'm7b5',  'mMaj7', 'm7'     ],
  'lydian-dominant':  ['7',     '7',      'm7b5',  'm7b5',  'mMaj7', 'm7',    'maj7#5' ],
  'mixolydian-b6':    ['7',     'm7b5',   'm7b5',  'mMaj7', 'm7',    'maj7#5','7'      ],
  'locrian-natural2': ['m7b5',  'm7b5',   'mMaj7', 'm7',    'maj7#5','7',     '7'      ],
  'altered':          ['m7b5',  'mMaj7',  'm7',    'maj7#5','7',     '7',     'm7b5'   ],
```

- [ ] **Add harmonic minor mode entries to `MODE_LABELS`** (after `'melodic-minor'` entry):

```typescript
  'locrian-natural6':   'Locrian ♮6 (HM mode 2)',
  'ionian-sharp5':      'Ionian #5 (HM mode 3)',
  'dorian-sharp4':      'Dorian #4 / Ukrainian Dorian (HM mode 4)',
  'phrygian-dominant':  'Phrygian Dominant (HM mode 5)',
  'lydian-sharp2':      'Lydian #2 (HM mode 6)',
  'altered-diminished': 'Altered Diminished (HM mode 7)',
  'dorian-b2':          'Dorian ♭2 / Phrygian ♮6 (MM mode 2)',
  'lydian-augmented':   'Lydian Augmented (MM mode 3)',
  'lydian-dominant':    'Lydian Dominant (MM mode 4)',
  'mixolydian-b6':      'Mixolydian ♭6 / Hindu (MM mode 5)',
  'locrian-natural2':   'Locrian ♮2 / Half-Diminished (MM mode 6)',
  'altered':            'Altered / Super Locrian (MM mode 7)',
```

- [ ] **Add all 12 new entries to `MODE_INTERVALS`** (after `'melodic-minor'` entry):

```typescript
  'locrian-natural6':   [0, 1, 3, 5, 6, 9, 10],
  'ionian-sharp5':      [0, 2, 4, 5, 8, 9, 11],
  'dorian-sharp4':      [0, 2, 3, 6, 7, 9, 10],
  'phrygian-dominant':  [0, 1, 4, 5, 7, 8, 10],
  'lydian-sharp2':      [0, 3, 4, 6, 7, 9, 11],
  'altered-diminished': [0, 1, 3, 4, 6, 8,  9],
  'dorian-b2':          [0, 1, 3, 5, 7, 9, 10],
  'lydian-augmented':   [0, 2, 4, 6, 8, 9, 11],
  'lydian-dominant':    [0, 2, 4, 6, 7, 9, 10],
  'mixolydian-b6':      [0, 2, 4, 5, 7, 8, 10],
  'locrian-natural2':   [0, 2, 3, 5, 6, 8, 10],
  'altered':            [0, 1, 3, 4, 6, 8, 10],
```

- [ ] **Update `modeOrder` inside `generateModalInterchangeTable`** — replace the existing array literals:

```typescript
const modeOrder: Mode[] =
  tonality === 'major'
    ? [
        'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian',
        'harmonic-minor', 'locrian-natural6', 'ionian-sharp5', 'dorian-sharp4',
        'phrygian-dominant', 'lydian-sharp2', 'altered-diminished',
        'melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant',
        'mixolydian-b6', 'locrian-natural2', 'altered',
      ]
    : [
        'aeolian', 'dorian', 'phrygian', 'ionian', 'lydian', 'mixolydian', 'locrian',
        'harmonic-minor', 'locrian-natural6', 'ionian-sharp5', 'dorian-sharp4',
        'phrygian-dominant', 'lydian-sharp2', 'altered-diminished',
        'melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant',
        'mixolydian-b6', 'locrian-natural2', 'altered',
      ];
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

Expected: zero TypeScript errors.

---

## Task 3: Add group dividers to ModeTable

**Files:**
- Modify: `src/features/modal-interchange/components/ModeTable.tsx`
- Modify: `src/features/modal-interchange/styles/_modal-interchange.css`

- [ ] **Add helper constants and function at the top of `ModeTable.tsx`** (before the `ModeTable` component function):

```typescript
const HM_MODES = new Set<Mode>([
  'harmonic-minor', 'locrian-natural6', 'ionian-sharp5', 'dorian-sharp4',
  'phrygian-dominant', 'lydian-sharp2', 'altered-diminished',
]);
const MM_MODES = new Set<Mode>([
  'melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant',
  'mixolydian-b6', 'locrian-natural2', 'altered',
]);

function getModeGroup(mode: Mode): 'diatonic' | 'harmonic-minor' | 'melodic-minor' {
  if (HM_MODES.has(mode)) return 'harmonic-minor';
  if (MM_MODES.has(mode)) return 'melodic-minor';
  return 'diatonic';
}

const GROUP_LABELS: Record<'diatonic' | 'harmonic-minor' | 'melodic-minor', string> = {
  'diatonic': 'Diatonic Modes',
  'harmonic-minor': 'Harmonic Minor Modes',
  'melodic-minor': 'Melodic Minor Modes',
};
```

- [ ] **Replace the `<tbody>` content** in `ModeTable.tsx` (the existing `table.modes.map(...)` block) with a version that inserts group divider rows:

```tsx
<tbody>
  {table.modes.map((modeRow, index) => {
    const currentGroup = getModeGroup(modeRow.mode);
    const prevGroup = index > 0 ? getModeGroup(table.modes[index - 1].mode) : null;
    const isDiatonic = modeRow.mode === diatonicMode;

    return (
      <React.Fragment key={modeRow.mode}>
        {currentGroup !== prevGroup && (
          <tr className="mode-group-divider">
            <td colSpan={8}>{GROUP_LABELS[currentGroup]}</td>
          </tr>
        )}
        <tr className={isDiatonic ? 'diatonic-row' : ''}>
          <td className='mode-name'>
            {modeRow.label}
            {isDiatonic && <span className='diatonic-badge'>Diatonic</span>}
          </td>
          {modeRow.chords.map((chord, i) => (
            <td key={i} className={`chord-cell quality-${chord.quality}`}>
              <div className='chord-content'>
                <span className='chord-root'>{chord.root}</span>
                <span className='chord-quality-symbol'>{getQualitySymbol(chord.quality)}</span>
                <span className='chord-numeral'>{chord.numeral}</span>
              </div>
            </td>
          ))}
        </tr>
      </React.Fragment>
    );
  })}
</tbody>
```

- [ ] **Add the divider CSS** to `src/features/modal-interchange/styles/_modal-interchange.css` (append at the end of the file):

```css
/* Mode group section dividers */
.mode-group-divider td {
  background: var(--surface-2, #f1f5f9);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-3, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.35rem 0.75rem;
  border-top: 2px solid var(--border, #e2e8f0);
}
```

- [ ] **Build and verify in browser:**

```bash
npm run build && npm run dev
```

Open Modal Interchange in the browser. Select any key. Confirm:
1. The table has 21 data rows (7 diatonic + 7 HM + 7 MM)
2. Three group divider rows appear with labels "Diatonic Modes", "Harmonic Minor Modes", "Melodic Minor Modes"
3. Phrygian Dominant row shows `I7 ♭IImaj7 III°7 ivmMaj7 vm7♭5 ♭VImaj7#5 ♭viim7` for C major
4. Lydian Dominant row shows `I7 II7 iiim7♭5 #ivm7♭5 vmMaj7 vim7 ♭VIImaj7#5` for C major

- [ ] **Commit modal interchange work:**

```bash
git add src/features/modal-interchange/types/modalInterchange.types.ts \
        src/features/modal-interchange/services/modalInterchangeData.ts \
        src/features/modal-interchange/components/ModeTable.tsx \
        src/features/modal-interchange/styles/_modal-interchange.css
git commit -m "feat(modal-interchange): add 12 parallel modes from harmonic and melodic minor"
```

---

## Task 4: Add AudioPlayer.stopAll()

**Files:**
- Modify: `src/features/ear-training/utils/audio-player.ts`

- [ ] **Add `activeSources` field** to the `AudioPlayer` class (after `bufferCache`):

```typescript
private activeSources: Set<AudioBufferSourceNode> = new Set();
```

- [ ] **Track source nodes in `playNote()`** — inside the `if (this.audioContext && this.masterGain)` block, AFTER `source.connect(gainNode)` and BEFORE `source.start(0)`, add:

```typescript
this.activeSources.add(source);
source.onended = () => this.activeSources.delete(source);
```

The complete updated section inside `playNote` looks like:

```typescript
const source = this.audioContext.createBufferSource();
source.buffer = buffer;
source.playbackRate.value = playbackRate;

const gainNode = this.audioContext.createGain();
gainNode.gain.value = Math.max(0, Math.min(1, volume));
source.connect(gainNode);
gainNode.connect(this.masterGain);

// Track active source so stopAll() can cancel it
this.activeSources.add(source);
source.onended = () => this.activeSources.delete(source);

source.start(0);
```

- [ ] **Add `stopAll()` method** to the `AudioPlayer` class (after the `delay` method):

```typescript
/** Stop all currently playing Web Audio sources immediately. */
stopAll(): void {
  this.activeSources.forEach(src => {
    try { src.stop(); } catch { /* already stopped or never started */ }
  });
  this.activeSources.clear();
}
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

Expected: zero errors.

- [ ] **Commit:**

```bash
git add src/features/ear-training/utils/audio-player.ts
git commit -m "feat(ear-training): add AudioPlayer.stopAll() for clean question transitions"
```

---

## Task 5: Fix IntervalsExercise

**Files:**
- Modify: `src/features/ear-training/components/IntervalsExercise.tsx`

- [ ] **Replace `playInterval`** with the fixed version (stopAll + proper async isPlaying):

```typescript
const playInterval = useCallback(async () => {
  audioPlayer.stopAll();
  setIsPlaying(true);
  try {
    await audioPlayer.playSequence([currentQuestion.rootNote, currentQuestion.secondNote], 600, 0.8);
    await audioPlayer.delay(700);
  } catch (error: any) {
    console.error('Error playing interval:', error);
  }
  setIsPlaying(false);
}, [currentQuestion]);
```

- [ ] **Add auto-play effect** — add these two hooks after the existing `useAutoRepeat` line:

```typescript
const playIntervalRef = useRef(playInterval);
useEffect(() => { playIntervalRef.current = playInterval; }, [playInterval]);

// Auto-play when question changes
useEffect(() => {
  const timer = setTimeout(() => playIntervalRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

Note: `useRef` is already imported via React. If it isn't, add it to the React import: `import React, { useState, useCallback, useEffect, useRef } from 'react';`

- [ ] **Disable answer buttons during playback** — in the `answer-grid` map, change the `isDisabled` line from:

```typescript
const isDisabled = isCorrect || attempts.has(interval.name);
```

to:

```typescript
const isDisabled = isPlaying || isCorrect || attempts.has(interval.name);
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

- [ ] **Browser test:** Open Ear Training → Interval Recognition. Verify:
  1. Sound plays automatically when the exercise loads
  2. Sound plays automatically when a new question appears
  3. Answer buttons are greyed out while sound is playing
  4. Clicking "Skip Question" immediately plays the new interval
  5. After a correct answer, new question auto-plays after 1 second

- [ ] **Commit:**

```bash
git add src/features/ear-training/components/IntervalsExercise.tsx
git commit -m "fix(ear-training): auto-play + button lock during playback in IntervalsExercise"
```

---

## Task 6: Fix ChordsExercise

**Files:**
- Modify: `src/features/ear-training/components/ChordsExercise.tsx`

- [ ] **Replace `playChord`** function body:

```typescript
const playChord = useCallback(async () => {
  if (!currentQuestion) return;
  audioPlayer.stopAll();
  setIsPlaying(true);
  try {
    await audioPlayer.playChord(currentQuestion.notes);
    await audioPlayer.delay(1500);
  } catch (error: any) {
    console.error('Error playing chord:', error);
  }
  setIsPlaying(false);
}, [currentQuestion]);
```

- [ ] **Add auto-play effect** — after the existing `useAutoRepeat` line:

```typescript
const playChordRef = useRef(playChord);
useEffect(() => { playChordRef.current = playChord; }, [playChord]);

useEffect(() => {
  if (!currentQuestion) return;
  const timer = setTimeout(() => playChordRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

Add `useRef` to the React import if not already present.

- [ ] **Disable answer buttons during playback** — in the `answer-grid` map, change:

```typescript
const isDisabled = isCorrect || attempts.has(chordType.name);
```

to:

```typescript
const isDisabled = isPlaying || isCorrect || attempts.has(chordType.name);
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

- [ ] **Browser test:** Open Ear Training → Chord Recognition. Confirm auto-play on load, on new question, and button lock during playback.

- [ ] **Commit:**

```bash
git add src/features/ear-training/components/ChordsExercise.tsx
git commit -m "fix(ear-training): auto-play + button lock during playback in ChordsExercise"
```

---

## Task 7: Fix ScalesExercise

**Files:**
- Modify: `src/features/ear-training/components/ScalesExercise.tsx`

- [ ] **Replace `playScale`** function body:

```typescript
const playScale = useCallback(async () => {
  if (!currentQuestion) return;
  audioPlayer.stopAll();
  setIsPlaying(true);
  try {
    await audioPlayer.playSequence(currentQuestion.notes, 400, 0.5);
    await audioPlayer.delay(600);
  } catch (error: any) {
    console.error('Error playing scale:', error);
  }
  setIsPlaying(false);
}, [currentQuestion]);
```

- [ ] **Add auto-play effect** — after the existing `useAutoRepeat` line:

```typescript
const playScaleRef = useRef(playScale);
useEffect(() => { playScaleRef.current = playScale; }, [playScale]);

useEffect(() => {
  if (!currentQuestion) return;
  const timer = setTimeout(() => playScaleRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

Add `useRef` to the React import if not already present.

- [ ] **Disable answer buttons during playback** — in the `answer-grid` map, change:

```typescript
const isDisabled = isCorrect || attempts.has(scaleName);
```

to:

```typescript
const isDisabled = isPlaying || isCorrect || attempts.has(scaleName);
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

- [ ] **Browser test:** Open Ear Training → Scale Recognition. Confirm auto-play and button lock.

- [ ] **Commit:**

```bash
git add src/features/ear-training/components/ScalesExercise.tsx
git commit -m "fix(ear-training): auto-play + button lock during playback in ScalesExercise"
```

---

## Task 8: Fix ScaleDegreesExercise

**Files:**
- Modify: `src/features/ear-training/components/ScaleDegreesExercise.tsx`

- [ ] **Replace `playContextAndNote`** function body (this exercise already uses correct async pattern; add stopAll + decay):

```typescript
const playContextAndNote = useCallback(async () => {
  if (!currentQuestion) return;
  audioPlayer.stopAll();
  setIsPlaying(true);
  try {
    for (const chord of currentQuestion.contextProgression.chords) {
      await audioPlayer.playChord(chord);
      await audioPlayer.delay(600);
    }
    await audioPlayer.delay(500);
    await audioPlayer.playNote(currentQuestion.targetNote, 0.8);
    await audioPlayer.delay(800);
  } catch (error: any) {
    console.error('Error playing context + note:', error);
  }
  setIsPlaying(false);
}, [currentQuestion]);
```

- [ ] **Add auto-play effect** — after the existing `useAutoRepeat` line:

```typescript
const playContextRef = useRef(playContextAndNote);
useEffect(() => { playContextRef.current = playContextAndNote; }, [playContextAndNote]);

useEffect(() => {
  if (!currentQuestion) return;
  const timer = setTimeout(() => playContextRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

Add `useRef` to the React import if not already present.

- [ ] **Disable answer buttons during playback** — in the `answer-grid` map, change:

```typescript
const isDisabled = isCorrect || attempts.has(degree.name);
```

to:

```typescript
const isDisabled = isPlaying || isCorrect || attempts.has(degree.name);
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

- [ ] **Browser test:** Open Ear Training → Scale Degrees. Confirm auto-play and button lock.

- [ ] **Commit:**

```bash
git add src/features/ear-training/components/ScaleDegreesExercise.tsx
git commit -m "fix(ear-training): auto-play + button lock during playback in ScaleDegreesExercise"
```

---

## Task 9: Fix IntervalsInContextExercise

**Files:**
- Modify: `src/features/ear-training/components/IntervalsInContextExercise.tsx`

- [ ] **Replace `playContextAndNotes`** function body:

```typescript
const playContextAndNotes = useCallback(async () => {
  if (!currentQuestion) return;
  audioPlayer.stopAll();
  setIsPlaying(true);
  try {
    for (const chord of currentQuestion.contextProgression.chords) {
      await audioPlayer.playChord(chord);
      await audioPlayer.delay(600);
    }
    await audioPlayer.delay(500);
    await audioPlayer.playNote(currentQuestion.firstNote, 0.8);
    await audioPlayer.delay(500);
    await audioPlayer.playNote(currentQuestion.secondNote, 0.8);
    await audioPlayer.delay(800);
  } catch (error: any) {
    console.error('Error:', error);
  }
  setIsPlaying(false);
}, [currentQuestion]);
```

- [ ] **Add auto-play effect** — after the `useAutoRepeat` line:

```typescript
const playContextNotesRef = useRef(playContextAndNotes);
useEffect(() => { playContextNotesRef.current = playContextAndNotes; }, [playContextAndNotes]);

useEffect(() => {
  if (!currentQuestion) return;
  const timer = setTimeout(() => playContextNotesRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

Add `useRef` to the React import if not already present.

- [ ] **Disable answer buttons during playback** — this exercise has three separate answer grids. For all three, add `isPlaying ||` to the `disabled` prop:

  **First note grid** — change:
  ```tsx
  disabled={isFirstCorrect === true || isWrong}
  ```
  to:
  ```tsx
  disabled={isPlaying || isFirstCorrect === true || isWrong}
  ```

  **Second note grid** — change:
  ```tsx
  disabled={isSecondCorrect === true || isWrong}
  ```
  to:
  ```tsx
  disabled={isPlaying || isSecondCorrect === true || isWrong}
  ```

  **Interval grid** — change:
  ```tsx
  disabled={isIntervalCorrect === true || isWrong}
  ```
  to:
  ```tsx
  disabled={isPlaying || isIntervalCorrect === true || isWrong}
  ```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

- [ ] **Browser test:** Open Ear Training → Intervals in Context. Confirm auto-play and that all three answer grids are locked while playing.

- [ ] **Commit:**

```bash
git add src/features/ear-training/components/IntervalsInContextExercise.tsx
git commit -m "fix(ear-training): auto-play + button lock during playback in IntervalsInContextExercise"
```

---

## Task 10: Fix ChordProgressionsExercise

**Files:**
- Modify: `src/features/ear-training/components/ChordProgressionsExercise.tsx`

- [ ] **Replace `playProgression`** function body (add stopAll + decay; the existing function already uses correct async pattern):

```typescript
const playProgression = useCallback(async () => {
  if (!currentQuestion) return;
  audioPlayer.stopAll();
  setIsPlaying(true);
  try {
    for (const chord of currentQuestion.chords) {
      await audioPlayer.playChord(chord);
      await audioPlayer.delay(800);
    }
    await audioPlayer.delay(1000);
  } catch (error: any) {
    console.error('Error playing progression:', error);
  }
  setIsPlaying(false);
}, [currentQuestion]);
```

- [ ] **Add auto-play effect** — after the existing `useAutoRepeat` line:

```typescript
const playProgressionRef = useRef(playProgression);
useEffect(() => { playProgressionRef.current = playProgression; }, [playProgression]);

useEffect(() => {
  if (!currentQuestion) return;
  const timer = setTimeout(() => playProgressionRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

Add `useRef` to the React import if not already present.

- [ ] **Disable answer buttons during playback** — in the progressions answer grid, change:

```typescript
const isDisabled = isCorrect || attempts.has(progression.name);
```

to:

```typescript
const isDisabled = isPlaying || isCorrect || attempts.has(progression.name);
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error"
```

- [ ] **Browser test:** Open Ear Training → Chord Progressions. Confirm auto-play and button lock.

- [ ] **Final commit:**

```bash
git add src/features/ear-training/components/ChordProgressionsExercise.tsx
git commit -m "fix(ear-training): auto-play + button lock during playback in ChordProgressionsExercise"
```

---

## Self-Review Checklist (completed)

- **Spec coverage:** All items covered — 12 new modes ✓, MODE_INTERVALS ✓, MODE_QUALITIES ✓, MODE_LABELS ✓, modeOrder ✓, ModeTable dividers ✓, AudioPlayer.stopAll() ✓, button lock (Bug A) ✓, auto-play on new question (Bug B) ✓, isPlaying tracking (Bug C) ✓, audio overlap (Bug D) ✓. All 6 exercises addressed.
- **No placeholders:** All code blocks are complete and self-contained.
- **Type consistency:** `Mode` extended in Task 1 before data records in Task 2. `audioPlayer.stopAll()` added in Task 4 before any exercise uses it in Tasks 5-10. `useRef`/`useEffect` patterns are identical across all 6 exercises.

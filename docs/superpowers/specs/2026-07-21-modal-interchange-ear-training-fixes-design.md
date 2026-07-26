# Design: Modal Interchange Minor Modes + Ear Training Fixes

**Date:** 2026-07-21  
**Scope:** Two independent workstreams: (1) add 12 new parallel modes from harmonic/melodic minor to Modal Interchange, (2) fix audio UX bugs across all standard ear training exercises.

---

## 1. Modal Interchange — 12 New Parallel Modes

### Goal
Add all modes derived from Harmonic Minor and Melodic Minor as parallel borrowing sources. Currently the app has `harmonic-minor` and `melodic-minor` as parallel scales; this adds their 6 derived modes each (minus the root mode already present).

### Affected files
- `src/features/modal-interchange/types/modalInterchange.types.ts`
- `src/features/modal-interchange/services/modalInterchangeData.ts`
- `src/features/modal-interchange/components/ModeTable.tsx`

### New Mode identifiers and data

All intervals are semitones from root. All harmonizations are 7th chords.  
Rotation property: modes within a family share the same 7 chord qualities, just starting from a different degree.

**Harmonic Minor base harmonization:** `[mMaj7, m7b5, maj7#5, m7, 7, maj7, dim7]`

| Mode ID | Label | Intervals | Harmonization (I→VII) |
|---|---|---|---|
| `locrian-natural6` | Locrian ♮6 (HM mode 2) | 0,1,3,5,6,9,10 | m7b5, maj7#5, m7, 7, maj7, dim7, mMaj7 |
| `ionian-sharp5` | Ionian #5 (HM mode 3) | 0,2,4,5,8,9,11 | maj7#5, m7, 7, maj7, dim7, mMaj7, m7b5 |
| `dorian-sharp4` | Dorian #4 / Ukrainian Dorian (HM mode 4) | 0,2,3,6,7,9,10 | m7, 7, maj7, dim7, mMaj7, m7b5, maj7#5 |
| `phrygian-dominant` | Phrygian Dominant (HM mode 5) | 0,1,4,5,7,8,10 | 7, maj7, dim7, mMaj7, m7b5, maj7#5, m7 |
| `lydian-sharp2` | Lydian #2 (HM mode 6) | 0,3,4,6,7,9,11 | maj7, dim7, mMaj7, m7b5, maj7#5, m7, 7 |
| `altered-diminished` | Altered Diminished (HM mode 7) | 0,1,3,4,6,8,9 | dim7, mMaj7, m7b5, maj7#5, m7, 7, maj7 |

**Melodic Minor base harmonization:** `[mMaj7, m7, maj7#5, 7, 7, m7b5, m7b5]`

| Mode ID | Label | Intervals | Harmonization (I→VII) |
|---|---|---|---|
| `dorian-b2` | Dorian ♭2 / Phrygian ♮6 (MM mode 2) | 0,1,3,5,7,9,10 | m7, maj7#5, 7, 7, m7b5, m7b5, mMaj7 |
| `lydian-augmented` | Lydian Augmented (MM mode 3) | 0,2,4,6,8,9,11 | maj7#5, 7, 7, m7b5, m7b5, mMaj7, m7 |
| `lydian-dominant` | Lydian Dominant (MM mode 4) | 0,2,4,6,7,9,10 | 7, 7, m7b5, m7b5, mMaj7, m7, maj7#5 |
| `mixolydian-b6` | Mixolydian ♭6 / Hindu (MM mode 5) | 0,2,4,5,7,8,10 | 7, m7b5, m7b5, mMaj7, m7, maj7#5, 7 |
| `locrian-natural2` | Locrian ♮2 / Half-Diminished (MM mode 6) | 0,2,3,5,6,8,10 | m7b5, m7b5, mMaj7, m7, maj7#5, 7, 7 |
| `altered` | Altered / Super Locrian (MM mode 7) | 0,1,3,4,6,8,10 | m7b5, mMaj7, m7, maj7#5, 7, 7, m7b5 |

### UI change — ModeTable grouping

With 21 rows (7 diatonic + 2 base minors + 12 new modes), the table needs section dividers. Add `<tr>` separator rows with a group label:
- `── Diatonic Modes ──` before Ionian row
- `── Harmonic Minor Modes ──` before `harmonic-minor` row
- `── Melodic Minor Modes ──` before `melodic-minor` row

Separators are display-only rows with `colspan="8"` and a distinct CSS class.

### modeOrder update

`generateModalInterchangeTable` must include all 21 modes in order:

**Major tonality order:**
ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian,
harmonic-minor, locrian-natural6, ionian-sharp5, dorian-sharp4, phrygian-dominant, lydian-sharp2, altered-diminished,
melodic-minor, dorian-b2, lydian-augmented, lydian-dominant, mixolydian-b6, locrian-natural2, altered

**Minor tonality order:**
aeolian, dorian, phrygian, ionian, lydian, mixolydian, locrian,
harmonic-minor, locrian-natural6, ionian-sharp5, dorian-sharp4, phrygian-dominant, lydian-sharp2, altered-diminished,
melodic-minor, dorian-b2, lydian-augmented, lydian-dominant, mixolydian-b6, locrian-natural2, altered

---

## 2. Ear Training — Audio UX Fixes

### Goal
Fix 4 bugs present in all standard exercises: answer buttons clickable during playback, no auto-play on new question, imprecise `isPlaying` tracking, and audio overlap between questions.

### Affected exercises (same pattern, same fix)
- `IntervalsExercise.tsx`
- `ChordsExercise.tsx`
- `ScalesExercise.tsx`
- `ScaleDegreesExercise.tsx`
- `IntervalsInContextExercise.tsx`
- `ChordProgressionsExercise.tsx`

Not affected: `PerfectPitchExercise`, `MelodicDictationExercise`, `RhythmRecognitionExercise`, `BpmRecognitionExercise` (different structure).

### Bug A — Answer buttons active during playback

**Current:** `disabled={isCorrect || attempts.has(name)}`  
**Fix:** `disabled={isPlaying || isCorrect || attempts.has(name)}`

Applies to every answer `<button>` in the answer grid of all 6 exercises. For `IntervalsInContextExercise`, applies to all three grids (first note, second note, interval).

### Bug B — No auto-play on new question

**Fix:** Add a `useEffect` in each exercise that triggers the play function when `currentQuestion` changes. Use a `useRef` to hold the play function (avoids stale closures), and a 200ms delay to let any previous audio start fading.

```ts
const playFnRef = useRef(playXxx); // playInterval, playChord, etc.
useEffect(() => { playFnRef.current = playXxx; }, [playXxx]);

useEffect(() => {
  if (!currentQuestion) return;
  const timer = setTimeout(() => playFnRef.current(), 200);
  return () => clearTimeout(timer);
}, [currentQuestion]);
```

The `currentQuestion` dependency ensures this fires only when the question changes, not on every render.

### Bug C — Imprecise `isPlaying` tracking

**Current:** `setTimeout(() => setIsPlaying(false), hardcodedMs)` — can be too short (buttons re-enable while audio still plays) or inconsistent.

**Fix:** Use async/await properly and add an explicit decay wait:

```ts
// IntervalsExercise
setIsPlaying(true);
await audioPlayer.playSequence([root, second], 600, 0.8);
await audioPlayer.delay(700); // decay time for last note
setIsPlaying(false);

// ChordsExercise
setIsPlaying(true);
await audioPlayer.playChord(notes);
await audioPlayer.delay(1500); // chord decay
setIsPlaying(false);

// ScalesExercise
setIsPlaying(true);
await audioPlayer.playSequence(notes, 400, 0.5);
await audioPlayer.delay(600); // last note decay
setIsPlaying(false);
```

`ScaleDegreesExercise` already sets `setIsPlaying(false)` after the async chain; it only needs the decay delay added.

### Bug D — Audio overlap between questions

**Current:** `AudioPlayer` does not track active sources; old audio continues playing when a new question starts.

**Fix:** Add `stopAll()` to `AudioPlayer` that stores all created `AudioBufferSourceNode`s in a `Set` and calls `.stop()` on each when invoked.

```ts
private activeSources: Set<AudioBufferSourceNode> = new Set();

// In playNote(), after source.connect(gainNode):
this.activeSources.add(source);
source.onended = () => this.activeSources.delete(source);

stopAll(): void {
  this.activeSources.forEach(src => {
    try { src.stop(); } catch { /* already stopped */ }
  });
  this.activeSources.clear();
}
```

Call `audioPlayer.stopAll()` at the start of each play function (before `setIsPlaying(true)`).

### Root cause of the "wrong correct answer" logic bug

With Bug A fixed (buttons disabled during `isPlaying`) and Bug B fixed (auto-play makes it clear what question the user is on), the race condition that allowed clicking during the wrong question is eliminated. No additional logic change needed.

---

## Out of scope

- Changes to `PerfectPitchExercise`, `MelodicDictationExercise`, `RhythmRecognitionExercise`, `BpmRecognitionExercise`
- Changes to `EarTrainingProFeature` or `IntervalQuizFeature`
- Changes to `CadenceTrainerFeature`
- Changes to `BorrowedChordHighlighter`, `CommonProgressions`, or `progressionLibrary` in Modal Interchange
- Emotional colors / jazz contexts for the 12 new modes (can be added later)

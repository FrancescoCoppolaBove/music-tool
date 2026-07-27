# Chord Progression — Playback Bug Fix + Per-Chord Voicing Selection

**Date:** 2026-07-27  
**Feature area:** `src/features/chord-progression/`  
**Scope:** Fix audio playback bugs + add voicing style selector per chord

---

## Problem Statement

Two distinct issues in the chord-progression playback:

1. **Bug — AudioContext not initialized:** `AudioPlayer.playNote()` calls `resumeAudioContext()` which is a no-op when `this.audioContext === null`. The chord-progression feature never calls `initAudioContext()` or `preloadAllNotes()` on mount, so the first playback falls through to the HTML5 Audio fallback. HTML5 Audio does not guarantee synchronised polyphony — some chords play partially or not at all.

2. **Bug — Buffer cache cold on first play:** MP3 buffers are fetched lazily inside `playNote()`. On the first Play click, all fetches happen in parallel with playback, causing timing drift on the first chord(s).

3. **Feature request:** For each chord in the displayed progression, the user wants to choose which voicing style to hear (closed, drop 2, shell, etc.) via a dropdown integrated directly into the chord block.

---

## Architecture

### Files to change

| File | Change |
|---|---|
| `src/shared/utils/chordAudio.ts` | Fix `playNote()` — self-initialise AudioContext |
| `src/features/chord-progression/components/ProgressionDisplay.tsx` | Preload on mount, voicing state, `getVoicedNotes()`, UI |

No new files needed.

---

## Bug Fix — `chordAudio.ts`

**`AudioPlayer.playNote()`:** add self-initialisation as the first line:

```ts
if (!this.audioContext) await this.initAudioContext();
```

`initAudioContext()` has no `await` in its own body (the `await` only lives inside the `unlockAudio` callback), so the AudioContext is assigned synchronously before the function yields. This means calling it from a `setTimeout` callback (post-user-gesture) is safe — Chrome/Firefox allow AudioContext creation once the user has interacted with the page.

---

## Bug Fix — `ProgressionDisplay.tsx` (ProgressionDetail)

**Preload on mount:**

```ts
import { playChordSequence, voiceChord, audioPlayer, type SequenceHandle } from '@shared/utils/chordAudio';

useEffect(() => { void audioPlayer.preloadAllNotes(); }, []);
```

**Init during Play gesture:**  
In `togglePlay()`, before `playChordSequence()`:

```ts
void audioPlayer.initAudioContext(); // sync AudioContext creation during user click
```

This ensures the context is created while the browser user-gesture is active, before the `setTimeout` callbacks fire.

---

## Feature — Per-Chord Voicing Selection

### State

```ts
const [chordVoicingStyles, setChordVoicingStyles] = useState<Record<number, string>>({});
```

Located in `ProgressionDetail`. Resets to `{}` when the displayed progression changes:

```ts
useEffect(() => { setChordVoicingStyles({}); }, [progression.id, showEnriched]);
```

### Voicing helper

```ts
import { generateVoicings } from '@features/chord-voicings/services/voicingGenerator';
import type { ParsedChord } from '@features/chord-voicings/types/chord.types';

function getVoicedNotes(chord: ResolvedChord, style: string): string[] {
  if (style === 'auto') return voiceChord(chord.notes.slice(0, 5));
  const parsed: ParsedChord = { root: chord.root, chordType: chord.quality, bass: null };
  const voicings = generateVoicings(parsed);
  const match = voicings.find(v => v.style === style);
  if (!match || match.notes.length === 0) return voiceChord(chord.notes.slice(0, 5));
  return match.notes.map(n => `${n.note}${n.octave}`);
}
```

Fallback to `voiceChord` when `generateVoicings` returns nothing for the requested style (e.g., `upperStructure` on a triad that has too few intervals).

### Modified `togglePlay()`

```ts
function togglePlay() {
  if (isPlaying) { handleRef.current?.stop(); return; }
  void audioPlayer.initAudioContext();
  const voicedChords = displayChords.map((c, i) => ({
    notes: getVoicedNotes(c, chordVoicingStyles[i] ?? 'auto'),
  }));
  handleRef.current = playChordSequence(
    voicedChords, bpm,
    i => setPlayingIndex(i),
    () => setPlayingIndex(null),
  );
}
```

Voicings are computed once at play-start, not re-computed per bar.

### UI — `ChordBlock`

New props added to `ChordBlock`:

```ts
voicingStyle: string;
onVoicingChange: (style: string) => void;
```

A new row is appended after the "Scale" section inside each chord block:

```
[ Voicing label ]
[ <select> Auto / Closed / Drop 2 / Drop 3 / Shell / Rootless / Open / Spread / Quartal ]
```

Styling:
- Label: `font-size:9px`, `text-transform:uppercase`, `color:#4b5563` when `'auto'`; `color:#a78bfa` when any other style (purple indicator)
- `<select>`: `background:#0d1117`, `border:1px solid #30363d`, `color:#c4b5fd`, `font-size:10px`, full width
- `onChange` calls `onVoicingChange(e.target.value)` and stops event propagation to avoid interfering with parent click handlers

### Voicing styles offered

| Value | Label | Source in voicingGenerator |
|---|---|---|
| `auto` | Auto (open) | `voiceChord()` in chordAudio |
| `closed` | Closed | `style === 'closed'`, root position |
| `drop2` | Drop 2 | `style === 'drop2'`, first voicing |
| `drop3` | Drop 3 | `style === 'drop3'` |
| `shell` | Shell | `style === 'shell'`, "Root + 3rd + 7th" |
| `rootless` | Rootless | `style === 'rootless'` |
| `open` | Open | `style === 'open'` |
| `spread` | Spread | `style === 'spread'` |
| `quartal` | Quartal | `style === 'quartal'` |
| `upperStructure` | Upper Str. | `style === 'upperStructure'` |

---

## Data flow summary

```
User changes voicing select on chord i
  → setChordVoicingStyles({ ...prev, [i]: style })

User clicks Play
  → void audioPlayer.initAudioContext()  (sync, during user gesture)
  → displayChords.map(c, i) → getVoicedNotes(c, chordVoicingStyles[i] ?? 'auto')
       → if 'auto': voiceChord(c.notes)
       → else: generateVoicings({root, chordType, bass:null}).find(style).notes → string[]
  → playChordSequence(voicedChords, bpm, ...)
       → setTimeout per bar → audioPlayer.playChord(notes)
            → playNote() → initAudioContext() if null → Web Audio API
```

---

## Out of scope

- Persisting voicing choices across page refreshes or progression switches
- Voicing preview (hearing a single chord without starting the full sequence)
- Upper Structure Triad with `upperStructure` style is included if `generateVoicings` returns it; no custom handling needed

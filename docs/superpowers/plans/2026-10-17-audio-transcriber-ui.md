# Audio Transcriber UI — Implementation Plan (Piano 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full UI layer for the audio transcriber: file upload, instrument selector, piano roll canvas, note table, playback transport, and editing with undo/redo.

**Architecture:** `AudioTranscriberFeature.tsx` owns all state (state machine, notes, chords, playback refs, undo stacks). Canvas-based `PianoRoll.tsx` draws via a stable `drawAll(canvas, state)` function called from both `useLayoutEffect` (prop changes) and a `requestAnimationFrame` loop (playhead animation). `TransportBar`, `NoteTable`, and `ExportBar` are pure presentational components fed from the parent.

**Tech Stack:** React + TypeScript, Web Audio API (`AudioContext`, `AudioBufferSourceNode`), Canvas 2D, `tonal` (`Note.fromMidi`), `analyzeAudio` from `engine/workerClient.ts`, `analyzeChords` from `engine/chordAnalyzer.ts`.

**Engine dependency (Piano 1):** All engine files (`engine/workerClient.ts`, `engine/transcriber.worker.ts`, `engine/transcribe.ts`, and all sub-modules) are already implemented and committed. Do NOT modify them.

---

## File structure

**New files:**
- `src/features/audio-transcriber/AudioTranscriberFeature.tsx` — entry component, state machine, file upload + decode, analysis wire-up, undo/redo
- `src/features/audio-transcriber/components/PianoRoll.tsx` — canvas piano roll: pitch Y-axis, time X-axis, chord colors, cents micro-bar, playhead, editing
- `src/features/audio-transcriber/components/NoteTable.tsx` — table (Nota | Cents | Accordo | Posizione | Durata | Velocity)
- `src/features/audio-transcriber/components/TransportBar.tsx` — play/pause/stop, time display, loop A-B
- `src/features/audio-transcriber/components/ExportBar.tsx` — progress bar during analysis, disabled MIDI/PDF buttons

**Modified files:**
- `src/shared/types/navigation.types.ts` — add `'audio-transcriber'` literal to Tab union
- `src/App.tsx` — import, TabDef in theory group, render branch, full-bleed layout exception

---

## Task 1: App registration + stub

**Files:**
- Modify: `src/shared/types/navigation.types.ts`
- Create: `src/features/audio-transcriber/AudioTranscriberFeature.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add tab literal to navigation types**

In `src/shared/types/navigation.types.ts`, add `| 'audio-transcriber'` before the closing semicolon:

```ts
export type Tab =
  | 'home'
  | 'voicings'
  | 'scales'
  | 'dictionary'
  | 'ear'
  | 'circle'
  | 'harmonization'
  | 'modal'
  | 'progressions'
  | 'scaleadvisor'
  | 'analysis'
  | 'riff'
  | 'melody'
  | 'mel-harm'
  | 'quiz'
  | 'score'
  | 'landing'
  | 'architect'
  | 'journal'
  | 'songs'
  | 'daily'
  | 'chorddetect'
  | 'nailpitch'
  | 'profile'
  | 'voiceleading'
  | 'groove'
  | 'arrangement'
  | 'cadence'
  | 'transpose'
  | 'eartrainingpro'
  | 'solfeggiocan'
  | 'setticlavio'
  | 'examtemplates'
  | 'teacherdashboard'
  | 'harmonia'
  | 'reharm'
  | 'cycles'
  | 'chordfinder'
  | 'rhythmic-displacement'
  | 'harmony-lab'
  | 'harmony-cheat-sheet'
  | 'secondary-dominants'
  | 'audio-transcriber';
```

- [ ] **Step 2: Create stub feature file**

Create `src/features/audio-transcriber/AudioTranscriberFeature.tsx`:

```tsx
export default function AudioTranscriberFeature() {
  return (
    <div style={{ padding: 40, color: '#8b949e', fontFamily: "'DM Sans', sans-serif" }}>
      Audio Transcriber — coming soon
    </div>
  );
}
```

- [ ] **Step 3: Add import to App.tsx**

At the top of `src/App.tsx`, after the last import, add:

```ts
import AudioTranscriberFeature from './features/audio-transcriber/AudioTranscriberFeature';
```

- [ ] **Step 4: Add TabDef to the theory group in App.tsx**

In the `theory` group's `tabs` array (inside `GROUPS`), after the `nailpitch` entry, add:

```ts
{ id: 'audio-transcriber', label: 'Audio Transcriber', icon: '🎙️', desc: 'Upload audio → detect notes, chords, BPM, key — Melodyne-style piano roll' },
```

- [ ] **Step 5: Add render branch and full-bleed exception in App.tsx**

In the `<main>` element, replace the `maxWidth` / `padding` logic with:

```tsx
<main style={{
  flex: 1,
  maxWidth: activeTab === 'home' || activeTab === 'audio-transcriber' ? '100%' : 1200,
  width: '100%',
  margin: '0 auto',
  padding: activeTab === 'home' || activeTab === 'audio-transcriber' ? '0' : '24px 16px',
  boxSizing: 'border-box',
}}>
```

Then add the render branch inside `<main>`, after the `nailpitch` branch:

```tsx
{activeTab === 'audio-transcriber' && <AudioTranscriberFeature />}
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/astuser/Documents/Repos/music-tool/.claude/worktrees/audio-transcriber-engine
npm run build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/shared/types/navigation.types.ts \
        src/features/audio-transcriber/AudioTranscriberFeature.tsx \
        src/App.tsx
git commit -m "feat(audio-transcriber): register tab, add stub feature component"
```

---

## Task 2: File upload + state machine

**Files:**
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx`

This task replaces the stub with the full state machine, file dropzone, instrument pills, and audio decode. No analysis yet — that comes in Task 3.

- [ ] **Step 1: Write the full AudioTranscriberFeature.tsx**

Replace `src/features/audio-transcriber/AudioTranscriberFeature.tsx` with:

```tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import type { InstrumentKind, NoteEvent, ChordEvent, TranscriptionResult } from './types';

type AppState = 'idle' | 'loaded' | 'analyzing' | 'ready' | 'error';

const INSTRUMENTS: { id: InstrumentKind; label: string; icon: string }[] = [
  { id: 'keyboard', label: 'Tastiera', icon: '🎹' },
  { id: 'bass',     label: 'Basso',    icon: '🎸' },
  { id: 'guitar',   label: 'Chitarra', icon: '🪕' },
  { id: 'voice',    label: 'Voce',     icon: '🎤' },
  { id: 'winds',    label: 'Fiati',    icon: '🎺' },
];

const LARGE_FILE_BYTES = 50 * 1024 * 1024;  // 50 MB
const LARGE_DURATION_SEC = 600;              // 10 min

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
  const len = buffer.length;
  const out = new Float32Array(len);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  const norm = 1 / buffer.numberOfChannels;
  for (let i = 0; i < len; i++) out[i] *= norm;
  return out;
}

export default function AudioTranscriberFeature() {
  const [appState, setAppState]         = useState<AppState>('idle');
  const [instrument, setInstrument]     = useState<InstrumentKind>('keyboard');
  const [fileName, setFileName]         = useState('');
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [analysisProgress, setProgress] = useState(0);
  const [result, setResult]             = useState<TranscriptionResult | null>(null);
  const [notes, setNotes]               = useState<NoteEvent[]>([]);
  const [chords, setChords]             = useState<ChordEvent[]>([]);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  const audioCtxRef    = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => { audioCtxRef.current?.close(); };
  }, []);

  async function decodeFile(file: File) {
    if (hasUnsavedEdits && appState === 'ready') {
      if (!window.confirm('Ci sono modifiche non esportate. Caricare un nuovo file le perderà. Continuare?')) return;
    }
    audioCtxRef.current?.close();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    setErrorMsg(null);
    setAppState('loaded');
    setFileName(file.name.replace(/\.[^.]+$/, ''));
    setResult(null);
    setNotes([]);
    setChords([]);
    setSelectedIds(new Set());
    setHasUnsavedEdits(false);
    audioBufferRef.current = null;

    if (file.size > LARGE_FILE_BYTES) {
      if (!window.confirm(`Il file è grande (${(file.size / 1024 / 1024).toFixed(0)} MB). L'analisi potrebbe essere lenta. Continuare?`)) {
        setAppState('idle');
        return;
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      if (audioBuffer.duration > LARGE_DURATION_SEC) {
        if (!window.confirm(`La traccia dura ${(audioBuffer.duration / 60).toFixed(0)} min. Continuare?`)) {
          setAppState('idle');
          return;
        }
      }

      audioBufferRef.current = audioBuffer;
      setAppState('loaded');
    } catch {
      setErrorMsg('Impossibile decodificare il file. Formati supportati: WAV, MP3, OGG, M4A/AAC, FLAC.');
      setAppState('error');
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) decodeFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) decodeFile(file);
  }

  const canAnalyze = appState === 'loaded' || appState === 'ready';

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 16px',
        borderBottom: '1px solid #21262d',
        background: '#161b22',
      }}>
        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={btnStyle('#30363d', '#8b949e')}
        >
          📂 Carica file
        </button>

        {/* File chip */}
        {fileName && (
          <span style={{ fontSize: 13, color: '#8b949e', background: '#21262d', borderRadius: 6, padding: '4px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🎵 {fileName}
          </span>
        )}

        {/* Instrument pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {INSTRUMENTS.map(ins => (
            <button
              key={ins.id}
              onClick={() => setInstrument(ins.id)}
              style={btnStyle(
                instrument === ins.id ? '#7c3aed' : '#21262d',
                instrument === ins.id ? '#e6edf3' : '#8b949e',
              )}
            >
              {ins.icon} {ins.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Analyze button */}
        <button
          onClick={() => {/* wired in Task 3 */}}
          disabled={!canAnalyze}
          style={btnStyle(canAnalyze ? '#7c3aed' : '#21262d', canAnalyze ? '#fff' : '#4b5563')}
        >
          {appState === 'analyzing' ? '⏳ Analisi…' : '🔍 Analizza'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

        {/* Idle: dropzone */}
        {(appState === 'idle' || appState === 'error') && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#7c3aed' : '#30363d'}`,
              borderRadius: 16, padding: '60px 80px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(124,58,237,0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
              Carica una traccia audio
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              WAV · MP3 · OGG · M4A/AAC · FLAC
            </div>
            {errorMsg && (
              <div style={{ marginTop: 16, padding: '10px 16px', background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, fontSize: 13, color: '#fca5a5' }}>
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Loaded / ready / analyzing: split layout placeholder */}
        {(appState === 'loaded' || appState === 'analyzing' || appState === 'ready') && (
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 0' }}>
            <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 400 }}>
              {/* Piano roll placeholder */}
              <div style={{ flex: 3, background: '#161b22', border: '1px solid #21262d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: 14 }}>
                {appState === 'loaded' ? 'Clicca Analizza per avviare la trascrizione' : appState === 'analyzing' ? `Analisi… ${Math.round(analysisProgress * 100)}%` : 'Piano roll — Task 5'}
              </div>
              {/* Note table placeholder */}
              <div style={{ flex: 2, background: '#161b22', border: '1px solid #21262d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: 14 }}>
                Note table — Task 8
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 8,
    padding: '6px 14px', fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
    transition: 'opacity 0.15s', whiteSpace: 'nowrap',
  };
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): file upload, state machine, instrument selector"
```

---

## Task 3: Analysis integration + toolbar

**Files:**
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx`

This task wires `analyzeAudio()` from the engine, adds the progress bar, error handling, "Rianalizza" button, and an editable BPM field that re-quantizes.

- [ ] **Step 1: Add the analyze function**

In `AudioTranscriberFeature.tsx`, add import at top:

```ts
import { analyzeAudio } from './engine/workerClient';
import { quantizeNotes } from './engine/quantizer';
import { analyzeChords } from './engine/chordAnalyzer';
```

Then add the `runAnalysis` callback inside the component (before the `return`):

```ts
const [editedBpm, setEditedBpm] = useState<string>('');
const [bpmEditActive, setBpmEditActive] = useState(false);
const tempoRef = useRef<{ bpm: number; beatOffsetSec: number } | null>(null);

const runAnalysis = useCallback(async () => {
  const buf = audioBufferRef.current;
  if (!buf) return;
  setAppState('analyzing');
  setProgress(0);
  setSelectedIds(new Set());
  try {
    const signal = downmixToMono(buf);
    const res = await analyzeAudio(signal, buf.sampleRate, instrument, setProgress);
    if (res.notes.length === 0) {
      setErrorMsg('Nessuna nota rilevata. Prova a selezionare un altro strumento o verificare il file audio.');
      setAppState('error');
      return;
    }
    tempoRef.current = res.bpm !== null
      ? { bpm: res.bpm, beatOffsetSec: 0 }
      : null;
    setEditedBpm(res.bpm !== null ? res.bpm.toFixed(1) : '');
    setResult(res);
    setNotes([...res.notes]);
    setChords([...res.chords]);
    setHasUnsavedEdits(false);
    setAppState('ready');
  } catch (err) {
    setErrorMsg(`Errore durante l'analisi: ${err instanceof Error ? err.message : String(err)}`);
    setAppState('error');
  }
}, [instrument]);
```

- [ ] **Step 2: Wire the Analyze button**

Replace the `onClick={() => {/* wired in Task 3 */}}` on the Analyze button with:

```tsx
onClick={() => runAnalysis()}
```

- [ ] **Step 3: Add BPM edit field and Rianalizza button to toolbar**

After the `Analizza` button in the toolbar JSX, add:

```tsx
{/* BPM display / edit */}
{result !== null && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ fontSize: 12, color: '#6b7280' }}>BPM</span>
    <input
      value={editedBpm}
      onChange={e => setEditedBpm(e.target.value)}
      onFocus={() => setBpmEditActive(true)}
      onBlur={() => {
        setBpmEditActive(false);
        const parsed = parseFloat(editedBpm);
        if (!isNaN(parsed) && parsed > 0 && tempoRef.current) {
          tempoRef.current = { bpm: parsed, beatOffsetSec: tempoRef.current.beatOffsetSec };
          const updated = notes.map(n => ({ ...n }));
          quantizeNotes(updated, parsed, tempoRef.current.beatOffsetSec);
          const updatedChords = analyzeChords(updated);
          setNotes(updated);
          setChords(updatedChords);
          setHasUnsavedEdits(true);
          setResult(r => r ? { ...r, bpm: parsed } : r);
        }
      }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      style={{
        width: 64, background: bpmEditActive ? '#1c2128' : '#0d1117',
        border: '1px solid #30363d', borderRadius: 6,
        color: '#e6edf3', fontSize: 13, padding: '3px 8px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    />
  </div>
)}

{/* Rianalizza */}
{appState === 'ready' && (
  <button onClick={() => runAnalysis()} style={btnStyle('#21262d', '#8b949e')}>
    🔄 Rianalizza
  </button>
)}

{/* Key display */}
{result?.key && (
  <span style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 600 }}>
    🎵 {result.key}
  </span>
)}
```

- [ ] **Step 4: Show progress bar during analysis**

Inside the `{(appState === 'loaded' || appState === 'analyzing' || appState === 'ready') && ...}` block, directly below the toolbar, add a progress bar that only shows during analysis:

```tsx
{appState === 'analyzing' && (
  <div style={{ height: 3, background: '#21262d', margin: '0 16px' }}>
    <div style={{ height: '100%', width: `${Math.round(analysisProgress * 100)}%`, background: '#7c3aed', transition: 'width 0.1s' }} />
  </div>
)}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): wire analyzeAudio, progress bar, BPM edit, Rianalizza"
```

---

## Task 4: ExportBar

**Files:**
- Create: `src/features/audio-transcriber/components/ExportBar.tsx`
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx` (add ExportBar below split layout)

- [ ] **Step 1: Create ExportBar**

Create `src/features/audio-transcriber/components/ExportBar.tsx`:

```tsx
interface ExportBarProps {
  appState: 'idle' | 'loaded' | 'analyzing' | 'ready' | 'error';
  progress: number;
  fileName: string;
  hasNotes: boolean;
}

export default function ExportBar({ appState, progress, fileName, hasNotes }: ExportBarProps) {
  const showButtons = appState === 'ready';
  const showProgress = appState === 'analyzing';

  return (
    <div style={{
      borderTop: '1px solid #21262d',
      background: '#161b22',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>

      {showProgress && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: '#21262d', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: '#7c3aed', borderRadius: 2, transition: 'width 0.1s' }} />
          </div>
          <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}

      {showButtons && (
        <>
          <span style={{ fontSize: 12, color: '#4b5563', flex: 1 }}>
            {fileName && `${fileName}_transcription`}
          </span>
          <div title={!hasNotes ? 'Nessuna nota da esportare' : 'Export MIDI — disponibile in Piano 3'}>
            <button
              disabled={!hasNotes}
              style={{
                background: '#21262d', color: hasNotes ? '#8b949e' : '#4b5563',
                border: '1px solid #30363d', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: hasNotes ? 'not-allowed' : 'not-allowed',
                opacity: hasNotes ? 0.7 : 0.4,
              }}
            >
              ⬇ MIDI
            </button>
          </div>
          <div title={!hasNotes ? 'Nessuna nota da esportare' : 'Export PDF — disponibile in Piano 3'}>
            <button
              disabled={!hasNotes}
              style={{
                background: '#21262d', color: hasNotes ? '#8b949e' : '#4b5563',
                border: '1px solid #30363d', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'not-allowed',
                opacity: hasNotes ? 0.7 : 0.4,
              }}
            >
              ⬇ PDF
            </button>
          </div>
        </>
      )}

      {!showProgress && !showButtons && (
        <span style={{ fontSize: 12, color: '#4b5563' }}>
          Carica un file e avvia l'analisi per esportare
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire ExportBar into the feature**

In `AudioTranscriberFeature.tsx`, add import:

```ts
import ExportBar from './components/ExportBar';
```

Replace the closing `</div>` of the outer container with:

```tsx
      {/* ExportBar always visible at bottom */}
      <ExportBar
        appState={appState}
        progress={analysisProgress}
        fileName={fileName}
        hasNotes={notes.length > 0}
      />
    </div>
  );
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/audio-transcriber/components/ExportBar.tsx \
        src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): ExportBar with progress + disabled MIDI/PDF buttons"
```

---

## Task 5: PianoRoll — base rendering

**Files:**
- Create: `src/features/audio-transcriber/components/PianoRoll.tsx`
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx` (replace left placeholder)

- [ ] **Step 1: Create PianoRoll with static canvas rendering**

Create `src/features/audio-transcriber/components/PianoRoll.tsx`:

```tsx
import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import type { NoteEvent, ChordEvent } from '../types';

export interface PianoRollProps {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;
  duration: number;
  selectedIds: Set<string>;
  isPlaying: boolean;
  getPlayheadSec: () => number;
  onSelectNote: (id: string, addToSelection: boolean) => void;
  onSeek: (sec: number) => void;
  editMode: boolean;
  onEditNote: (id: string, changes: Partial<Pick<NoteEvent, 'midi' | 'startSec' | 'durationSec'>>) => void;
  onDeleteNotes: (ids: string[]) => void;
  onCreateNote: (note: Omit<NoteEvent, 'id' | 'chordId' | 'startBeat' | 'durationBeats' | 'velocity'>) => void;
}

const CHORD_PALETTE = [
  '#7c3aed','#9333ea','#a855f7','#c084fc',
  '#8b5cf6','#6d28d9','#7e22ce','#d946ef',
];
const BLACK_PCS = new Set([1,3,6,8,10]);
const GUTTER = 44;   // left label column
const MIN_ROWS = 12; // minimum pitch rows visible

interface RollState {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;
  duration: number;
  selectedIds: Set<string>;
  zoomX: number;
  scrollX: number;
  playheadSec: number;
  editMode: boolean;
}

function drawAll(canvas: HTMLCanvasElement, s: RollState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  // Compute midi range
  let minMidi = 60, maxMidi = 72;
  if (s.notes.length > 0) {
    minMidi = Math.min(...s.notes.map(n => n.midi));
    maxMidi = Math.max(...s.notes.map(n => n.midi));
  }
  minMidi -= 3;
  maxMidi += 3;
  const numRows = Math.max(MIN_ROWS, maxMidi - minMidi + 1);
  maxMidi = minMidi + numRows - 1;
  const rowH = H / numRows;

  // ── Background: piano keys ─────────────────────────────────
  for (let m = minMidi; m <= maxMidi; m++) {
    const isBlack = BLACK_PCS.has(m % 12);
    const y = (maxMidi - m) * rowH;
    ctx.fillStyle = isBlack ? '#0c0f14' : '#161b22';
    ctx.fillRect(0, y, W, rowH);
    // row separator
    ctx.fillStyle = '#1a1f27';
    ctx.fillRect(0, y + rowH - 1, W, 1);
  }

  // ── Gutter ────────────────────────────────────────────────
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, GUTTER, H);
  ctx.fillStyle = '#21262d';
  ctx.fillRect(GUTTER - 1, 0, 1, H);

  // Note labels on C notes
  ctx.font = `10px "DM Sans", sans-serif`;
  ctx.textBaseline = 'middle';
  for (let m = minMidi; m <= maxMidi; m++) {
    if (m % 12 === 0) {
      const y = (maxMidi - m) * rowH + rowH / 2;
      ctx.fillStyle = '#4b5563';
      ctx.fillText(`C${Math.floor(m / 12) - 1}`, 4, y);
    }
  }

  // ── Time grid ─────────────────────────────────────────────
  if (s.bpm !== null) {
    const beatSec = 60 / s.bpm;
    const beatPx = beatSec * s.zoomX;
    if (beatPx >= 3) {
      const firstBeat = Math.max(0, Math.floor(s.scrollX / beatPx));
      const lastBeat = Math.ceil((s.scrollX + W - GUTTER) / beatPx) + 1;
      for (let b = firstBeat; b <= lastBeat; b++) {
        const x = GUTTER + b * beatPx - s.scrollX;
        if (x < GUTTER || x > W) continue;
        ctx.fillStyle = b % 4 === 0 ? '#2d3340' : '#1e2430';
        ctx.fillRect(x, 0, 1, H);
      }
    }
  } else {
    // Second ticks
    const secPx = s.zoomX;
    if (secPx >= 4) {
      for (let t = 0; t * secPx < s.duration * secPx; t++) {
        const x = GUTTER + t * secPx - s.scrollX;
        if (x < GUTTER || x > W) continue;
        ctx.fillStyle = '#1e2430';
        ctx.fillRect(x, 0, 1, H);
      }
    }
  }

  // ── Notes ─────────────────────────────────────────────────
  for (const note of s.notes) {
    const chordIdx = s.chords.findIndex(c => c.id === note.chordId);
    const color = chordIdx >= 0
      ? CHORD_PALETTE[chordIdx % CHORD_PALETTE.length]
      : '#4b5563';
    const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
    const w = Math.max(4, note.durationSec * s.zoomX);
    const y = (maxMidi - note.midi) * rowH + 1;
    const h = rowH - 2;

    if (x + w < GUTTER || x > W) continue;

    const isSelected = s.selectedIds.has(note.id);
    ctx.fillStyle = color;
    ctx.globalAlpha = isSelected ? 1 : 0.75;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    }

    // Cents micro-bar (bottom 2px)
    const a = Math.abs(note.cents);
    ctx.fillStyle = a < 15 ? '#34d399' : a < 30 ? '#fbbf24' : '#f87171';
    ctx.fillRect(x, y + h - 2, w, 2);
  }

  // ── Playhead ──────────────────────────────────────────────
  const phX = GUTTER + s.playheadSec * s.zoomX - s.scrollX;
  if (phX >= GUTTER && phX <= W) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(phX, 0);
    ctx.lineTo(phX, H);
    ctx.stroke();
    // Triangle head
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(phX - 5, 0);
    ctx.lineTo(phX + 5, 0);
    ctx.lineTo(phX, 8);
    ctx.closePath();
    ctx.fill();
  }
}

export default function PianoRoll(props: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<RollState>({
    notes: [], chords: [], bpm: null, duration: 0,
    selectedIds: new Set(), zoomX: 120, scrollX: 0,
    playheadSec: 0, editMode: false,
  });

  // Sync props into stateRef and redraw
  useLayoutEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      notes: props.notes,
      chords: props.chords,
      bpm: props.bpm,
      duration: props.duration,
      selectedIds: props.selectedIds,
      editMode: props.editMode,
    };
    if (canvasRef.current) drawAll(canvasRef.current, stateRef.current);
  });

  // rAF loop for playhead when playing
  useEffect(() => {
    if (!props.isPlaying) {
      stateRef.current.playheadSec = props.getPlayheadSec();
      if (canvasRef.current) drawAll(canvasRef.current, stateRef.current);
      return;
    }
    let raf: number;
    function tick() {
      stateRef.current.playheadSec = props.getPlayheadSec();
      if (canvasRef.current) drawAll(canvasRef.current, stateRef.current);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [props.isPlaying, props.getPlayheadSec]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = el.clientWidth;
      canvas.height = el.clientHeight;
      drawAll(canvas, stateRef.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', borderRadius: 12 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
```

- [ ] **Step 2: Wire PianoRoll into AudioTranscriberFeature**

In `AudioTranscriberFeature.tsx`, add import:

```ts
import PianoRoll from './components/PianoRoll';
```

Add state variables at the top of the component:

```ts
const [editMode, setEditMode] = useState(false);
```

Add placeholder handlers before the `return`:

```ts
const getPlayheadSec = useCallback(() => 0, []);
function handleSelectNote(id: string, addToSelection: boolean) {
  setSelectedIds(prev => {
    const next = addToSelection ? new Set(prev) : new Set<string>();
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
}
function handleSeek(_sec: number) { /* wired in Task 6 */ }
function handleEditNote(_id: string, _changes: Partial<Pick<NoteEvent, 'midi' | 'startSec' | 'durationSec'>>) {
  /* wired in Task 9 */
}
function handleDeleteNotes(_ids: string[]) { /* wired in Task 9 */ }
function handleCreateNote(_note: Omit<NoteEvent, 'id' | 'chordId' | 'startBeat' | 'durationBeats' | 'velocity'>) {
  /* wired in Task 9 */
}
```

Replace the piano roll placeholder div with:

```tsx
<div style={{ flex: 3, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
  {/* Edit mode toggle */}
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
    <button
      onClick={() => setEditMode(m => !m)}
      style={btnStyle(editMode ? '#7c3aed' : '#21262d', editMode ? '#fff' : '#8b949e')}
    >
      ✏️ {editMode ? 'Modifica attiva' : 'Modifica'}
    </button>
  </div>
  <div style={{ flex: 1 }}>
    <PianoRoll
      notes={notes}
      chords={chords}
      bpm={result?.bpm ?? null}
      duration={audioBufferRef.current?.duration ?? 0}
      selectedIds={selectedIds}
      isPlaying={false}
      getPlayheadSec={getPlayheadSec}
      onSelectNote={handleSelectNote}
      onSeek={handleSeek}
      editMode={editMode}
      onEditNote={handleEditNote}
      onDeleteNotes={handleDeleteNotes}
      onCreateNote={handleCreateNote}
    />
  </div>
</div>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/audio-transcriber/components/PianoRoll.tsx \
        src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): PianoRoll base canvas rendering"
```

---

## Task 6: TransportBar + AudioContext playback

**Files:**
- Create: `src/features/audio-transcriber/components/TransportBar.tsx`
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx`

- [ ] **Step 1: Create TransportBar**

Create `src/features/audio-transcriber/components/TransportBar.tsx`:

```tsx
function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TransportBarProps {
  isPlaying: boolean;
  playheadSec: number;
  duration: number;
  loopA: number | null;
  loopB: number | null;
  disabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onClearLoop: () => void;
}

export default function TransportBar({
  isPlaying, playheadSec, duration, loopA, loopB,
  disabled, onPlay, onPause, onStop, onClearLoop,
}: TransportBarProps) {
  const pct = duration > 0 ? (playheadSec / duration) * 100 : 0;

  return (
    <div style={{
      borderTop: '1px solid #21262d',
      background: '#161b22',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={disabled}
        style={tbBtn(!disabled)}
        title={isPlaying ? 'Pausa (Space)' : 'Play (Space)'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Stop */}
      <button onClick={onStop} disabled={disabled} style={tbBtn(!disabled)} title="Stop">
        ⏹
      </button>

      {/* Progress bar */}
      <div style={{ flex: 1, height: 4, background: '#21262d', borderRadius: 2, position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#7c3aed', borderRadius: 2 }} />
      </div>

      {/* Time */}
      <span style={{ fontSize: 12, color: '#8b949e', fontFamily: 'monospace', flexShrink: 0 }}>
        {fmtTime(playheadSec)} / {fmtTime(duration)}
      </span>

      {/* Loop indicator */}
      {(loopA !== null || loopB !== null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#a78bfa' }}>
            Loop {loopA !== null ? fmtTime(loopA) : '?'} → {loopB !== null ? fmtTime(loopB) : '?'}
          </span>
          <button onClick={onClearLoop} style={tbBtn(true)} title="Rimuovi loop">✕</button>
        </div>
      )}

      <span style={{ fontSize: 11, color: '#4b5563' }}>A/B: loop</span>
    </div>
  );
}

function tbBtn(enabled: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? '#e6edf3' : '#4b5563', fontSize: 16,
    padding: '4px 8px', borderRadius: 6,
  };
}
```

- [ ] **Step 2: Add playback state and handlers to AudioTranscriberFeature**

In `AudioTranscriberFeature.tsx`, add imports:

```ts
import TransportBar from './components/TransportBar';
```

Add playback state and refs inside the component:

```ts
const [isPlaying, setIsPlaying]     = useState(false);
const [playheadSec, setPlayheadSec] = useState(0);
const [loopA, setLoopA]             = useState<number | null>(null);
const [loopB, setLoopB]             = useState<number | null>(null);
const sourceRef      = useRef<AudioBufferSourceNode | null>(null);
const startTimeRef   = useRef(0);  // audioCtx.currentTime when play started
const pausePositionRef = useRef(0); // position in seconds to resume from
const rafRef         = useRef(0);

const getPlayheadSecCb = useCallback((): number => {
  const ctx = audioCtxRef.current;
  if (!isPlaying || !ctx) return pausePositionRef.current;
  return ctx.currentTime - startTimeRef.current;
}, [isPlaying]);

function stopSource() {
  try { sourceRef.current?.stop(); } catch { /* already stopped */ }
  sourceRef.current = null;
  cancelAnimationFrame(rafRef.current);
}

function handleStop() {
  stopSource();
  pausePositionRef.current = 0;
  setIsPlaying(false);
  setPlayheadSec(0);
}

function handlePlay() {
  const ctx = audioCtxRef.current;
  const buf = audioBufferRef.current;
  if (!ctx || !buf) return;
  if (ctx.state === 'suspended') ctx.resume();
  stopSource();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  if (loopA !== null && loopB !== null && loopB > loopA) {
    src.loop = true;
    src.loopStart = loopA;
    src.loopEnd = loopB;
  }
  src.connect(ctx.destination);
  const offset = Math.min(pausePositionRef.current, buf.duration);
  startTimeRef.current = ctx.currentTime - offset;
  src.start(0, offset);
  sourceRef.current = src;
  src.onended = () => {
    if (sourceRef.current === src) {
      pausePositionRef.current = 0;
      setIsPlaying(false);
      setPlayheadSec(0);
    }
  };
  setIsPlaying(true);
  function tick() {
    const sec = ctx.currentTime - startTimeRef.current;
    setPlayheadSec(Math.min(sec, buf.duration));
    rafRef.current = requestAnimationFrame(tick);
  }
  rafRef.current = requestAnimationFrame(tick);
}

function handlePause() {
  const ctx = audioCtxRef.current;
  if (!ctx) return;
  pausePositionRef.current = ctx.currentTime - startTimeRef.current;
  stopSource();
  setIsPlaying(false);
}

// Spacebar and A/B loop keys
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === ' ') {
      e.preventDefault();
      isPlaying ? handlePause() : handlePlay();
    }
    if (e.key === 'a' || e.key === 'A') {
      const ctx = audioCtxRef.current;
      if (ctx) setLoopA(ctx.currentTime - startTimeRef.current);
    }
    if (e.key === 'b' || e.key === 'B') {
      const ctx = audioCtxRef.current;
      if (ctx) setLoopB(ctx.currentTime - startTimeRef.current);
    }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});

// Cleanup on unmount
useEffect(() => {
  return () => { stopSource(); audioCtxRef.current?.close(); };
}, []);
```

Note: the `stopSource` cleanup in the unmount effect shadows the existing one — merge them by removing the earlier `useEffect` that only calls `audioCtxRef.current?.close()` and replacing with this combined version.

- [ ] **Step 3: Replace `getPlayheadSec` stub and wire `handleSeek`**

Replace the earlier stub:
```ts
const getPlayheadSec = useCallback(() => 0, []);
```
with:
```ts
const getPlayheadSec = getPlayheadSecCb;
```

Replace `function handleSeek(_sec: number) { /* wired in Task 6 */ }` with:
```ts
function handleSeek(sec: number) {
  pausePositionRef.current = Math.max(0, Math.min(sec, audioBufferRef.current?.duration ?? 0));
  if (isPlaying) handlePlay();
  else setPlayheadSec(pausePositionRef.current);
}
```

- [ ] **Step 4: Update PianoRoll props and add TransportBar to JSX**

Update the `PianoRoll` JSX to pass `isPlaying` and `getPlayheadSec`:

```tsx
<PianoRoll
  notes={notes}
  chords={chords}
  bpm={result?.bpm ?? null}
  duration={audioBufferRef.current?.duration ?? 0}
  selectedIds={selectedIds}
  isPlaying={isPlaying}
  getPlayheadSec={getPlayheadSec}
  onSelectNote={handleSelectNote}
  onSeek={handleSeek}
  editMode={editMode}
  onEditNote={handleEditNote}
  onDeleteNotes={handleDeleteNotes}
  onCreateNote={handleCreateNote}
/>
```

Add `<TransportBar>` inside the `{(appState === 'loaded' || appState === 'analyzing' || appState === 'ready') && ...}` block, between the split layout `</div>` and the `ExportBar`:

```tsx
<TransportBar
  isPlaying={isPlaying}
  playheadSec={playheadSec}
  duration={audioBufferRef.current?.duration ?? 0}
  loopA={loopA}
  loopB={loopB}
  disabled={appState !== 'ready'}
  onPlay={handlePlay}
  onPause={handlePause}
  onStop={handleStop}
  onClearLoop={() => { setLoopA(null); setLoopB(null); }}
/>
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/audio-transcriber/components/TransportBar.tsx \
        src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): AudioContext playback, TransportBar, spacebar, loop A-B"
```

---

## Task 7: PianoRoll — interaction (zoom, scroll, seek, selection)

**Files:**
- Modify: `src/features/audio-transcriber/components/PianoRoll.tsx`

- [ ] **Step 1: Add wheel zoom**

Inside the `PianoRoll` component, add this event handler and attach it to the canvas via a `useEffect`:

```ts
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const s = stateRef.current;
    const delta = e.deltaY > 0 ? 0.85 : 1 / 0.85;
    const mouseX = e.offsetX - GUTTER;
    // Zoom around mouse cursor
    const timeBefore = (mouseX + s.scrollX) / s.zoomX;
    s.zoomX = Math.max(20, Math.min(2000, s.zoomX * delta));
    s.scrollX = Math.max(0, timeBefore * s.zoomX - mouseX);
    drawAll(canvas, s);
  }
  canvas.addEventListener('wheel', onWheel, { passive: false });
  return () => canvas.removeEventListener('wheel', onWheel);
}, []);
```

- [ ] **Step 2: Add drag scroll**

```ts
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  let dragging = false;
  let lastX = 0;

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    // Only start scroll drag on empty area (no note hit)
    dragging = true;
    lastX = e.clientX;
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    stateRef.current.scrollX = Math.max(0, stateRef.current.scrollX - dx);
    drawAll(canvas, stateRef.current);
  }
  function onMouseUp() { dragging = false; }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  return () => {
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
}, []);
```

- [ ] **Step 3: Add note hit-test helper and click-to-select / click-to-seek**

Add the hit-test function inside `PianoRoll` (above the `return`):

```ts
function hitTestNote(mouseX: number, mouseY: number): NoteEvent | null {
  const s = stateRef.current;
  const numRows = Math.max(MIN_ROWS,
    (s.notes.length === 0 ? 12 : Math.max(...s.notes.map(n => n.midi)) - Math.min(...s.notes.map(n => n.midi)) + 7));
  const maxMidi = (s.notes.length === 0 ? 72 : Math.max(...s.notes.map(n => n.midi))) + 3;
  const H = canvasRef.current!.height;
  const rowH = H / numRows;
  for (let i = s.notes.length - 1; i >= 0; i--) {
    const note = s.notes[i];
    const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
    const w = Math.max(4, note.durationSec * s.zoomX);
    const y = (maxMidi - note.midi) * rowH;
    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + rowH) return note;
  }
  return null;
}
```

Add a combined mouse-click handler (replacing the simple scroll drag above — integrate them):

```ts
// Extend the mousedown handler to handle note selection and seek
function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const hit = hitTestNote(mx, my);
  if (hit) {
    props.onSelectNote(hit.id, e.shiftKey || e.metaKey);
    return; // don't start drag-scroll on note click
  }
  // Click on timeline area (above first row): seek
  if (my < 12 && mx > GUTTER) {
    const sec = (mx - GUTTER + stateRef.current.scrollX) / stateRef.current.zoomX;
    props.onSeek(sec);
    return;
  }
  dragging = true;
  lastX = e.clientX;
}
```

Note: `props` needs to be accessible inside the `useEffect`. Pass them via `propsRef`:

```ts
const propsRef = useRef(props);
useLayoutEffect(() => { propsRef.current = props; });
```

Then use `propsRef.current.onSelectNote(...)` and `propsRef.current.onSeek(...)` inside the effects.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/audio-transcriber/components/PianoRoll.tsx
git commit -m "feat(audio-transcriber): PianoRoll zoom, scroll, note selection, playhead seek"
```

---

## Task 8: NoteTable

**Files:**
- Create: `src/features/audio-transcriber/components/NoteTable.tsx`
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx` (replace right placeholder)

- [ ] **Step 1: Create NoteTable with formatting helpers**

Create `src/features/audio-transcriber/components/NoteTable.tsx`:

```tsx
import type { NoteEvent, ChordEvent } from '../types';

const CHORD_PALETTE = [
  '#7c3aed','#9333ea','#a855f7','#c084fc',
  '#8b5cf6','#6d28d9','#7e22ce','#d946ef',
];

function midiToNoteName(midi: number): string {
  const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(midi / 12) - 1;
  return NAMES[midi % 12] + octave;
}

function beatsToRhythm(beats: number | undefined): string {
  if (beats === undefined) return '—';
  if (Math.abs(beats - 4)   < 0.06) return '𝅝';
  if (Math.abs(beats - 2)   < 0.06) return '𝅗𝅥';
  if (Math.abs(beats - 1)   < 0.06) return '♩';
  if (Math.abs(beats - 0.5) < 0.06) return '♪';
  if (Math.abs(beats - 0.25) < 0.06) return '♬';
  if (Math.abs(beats - 2/3) < 0.06) return '♩₃';
  if (Math.abs(beats - 1/3) < 0.06) return '♪₃';
  return beats.toFixed(2) + 'b';
}

function formatPosition(startBeat: number | undefined): string {
  if (startBeat === undefined) return '—';
  const measure = Math.floor(startBeat / 4) + 1;
  const beat = (startBeat % 4) + 1;
  return `${measure}.${beat.toFixed(1)}`;
}

interface NoteTableProps {
  notes: NoteEvent[];
  chords: ChordEvent[];
  selectedIds: Set<string>;
  onSelectNote: (id: string, addToSelection: boolean) => void;
}

const COL: React.CSSProperties = {
  padding: '6px 10px', fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  borderBottom: '1px solid #1a1f27',
  whiteSpace: 'nowrap',
};

const HDR: React.CSSProperties = {
  ...COL, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#4b5563', background: '#0d1117',
  position: 'sticky', top: 0,
};

export default function NoteTable({ notes, chords, selectedIds, onSelectNote }: NoteTableProps) {
  const sorted = [...notes].sort((a, b) => a.startSec - b.startSec);

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HDR}>Nota</th>
            <th style={HDR}>Cents</th>
            <th style={{ ...HDR, maxWidth: 120 }}>Accordo</th>
            <th style={HDR}>Pos.</th>
            <th style={HDR}>Dur.</th>
            <th style={HDR}>Vel.</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(note => {
            const chordIdx = chords.findIndex(c => c.id === note.chordId);
            const chord = chordIdx >= 0 ? chords[chordIdx] : null;
            const chordColor = chordIdx >= 0 ? CHORD_PALETTE[chordIdx % CHORD_PALETTE.length] : undefined;
            const isSelected = selectedIds.has(note.id);
            const a = Math.abs(note.cents);
            const centsColor = a < 15 ? '#34d399' : a < 30 ? '#fbbf24' : '#f87171';

            return (
              <tr
                key={note.id}
                onClick={e => onSelectNote(note.id, e.shiftKey || e.metaKey)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(124,58,237,0.12)' : 'transparent',
                  borderLeft: `2px solid ${isSelected ? '#7c3aed' : 'transparent'}`,
                }}
              >
                <td style={{ ...COL, fontWeight: 700, color: '#e6edf3' }}>
                  {midiToNoteName(note.midi)}
                </td>
                <td style={{ ...COL, color: centsColor, fontVariantNumeric: 'tabular-nums' }}>
                  {note.cents > 0 ? '+' : ''}{note.cents.toFixed(0)}
                </td>
                <td style={{ ...COL, maxWidth: 120 }}>
                  {chord ? (
                    <span style={{
                      display: 'inline-block', background: chordColor + '22',
                      border: `1px solid ${chordColor}55`, borderRadius: 4,
                      padding: '1px 6px', fontSize: 11, color: chordColor,
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {chord.symbol}
                    </span>
                  ) : <span style={{ color: '#4b5563' }}>—</span>}
                </td>
                <td style={{ ...COL, color: '#8b949e', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPosition(note.startBeat)}
                </td>
                <td style={{ ...COL, color: '#8b949e' }}>
                  {beatsToRhythm(note.durationBeats)}
                </td>
                <td style={{ ...COL }}>
                  <div style={{
                    width: 32, height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{ width: `${Math.round(note.velocity * 100)}%`, height: '100%', background: '#7c3aed' }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
          Nessuna nota rilevata
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire NoteTable into AudioTranscriberFeature**

Add import:
```ts
import NoteTable from './components/NoteTable';
```

Replace the note table placeholder div with:

```tsx
<div style={{
  flex: 2, background: '#161b22', border: '1px solid #21262d',
  borderRadius: 12, overflow: 'hidden', minHeight: 400,
}}>
  <NoteTable
    notes={notes}
    chords={chords}
    selectedIds={selectedIds}
    onSelectNote={handleSelectNote}
  />
</div>
```

- [ ] **Step 3: Mobile layout — stack below roll**

Wrap the split-screen `<div style={{ flex: 1, display: 'flex', gap: 12 }}>` in a media-query-aware wrapper. Since we use inline styles, use a responsive breakpoint via a small hook or just accept the side-by-side layout. Add a CSS rule to handle the column-to-row switch:

At the top of `AudioTranscriberFeature.tsx`, add a style injection:

```tsx
const ROLL_CSS = `
  .at-split { display: flex; gap: 12px; flex: 1; min-height: 400px; }
  @media (max-width: 768px) {
    .at-split { flex-direction: column; }
  }
`;
```

And inside the `return`, before the root `<div>`:
```tsx
<style>{ROLL_CSS}</style>
```

Replace `<div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 400 }}>` with `<div className="at-split">`.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/audio-transcriber/components/NoteTable.tsx \
        src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): NoteTable with note name, cents, chord badge, position, rhythm"
```

---

## Task 9: PianoRoll editing + undo/redo

**Files:**
- Modify: `src/features/audio-transcriber/components/PianoRoll.tsx`
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx`

- [ ] **Step 1: Add undo/redo state and handlers to AudioTranscriberFeature**

In `AudioTranscriberFeature.tsx`, add:

```ts
const [undoStack, setUndoStack] = useState<NoteEvent[][]>([]);
const [redoStack, setRedoStack] = useState<NoteEvent[][]>([]);

function pushUndo(snapshot: NoteEvent[]) {
  setUndoStack(s => [...s.slice(-99), snapshot]);
  setRedoStack([]);
}

function handleUndo() {
  setUndoStack(s => {
    if (!s.length) return s;
    const prev = s[s.length - 1];
    setRedoStack(r => [notes, ...r]);
    const updated = prev;
    setNotes(updated);
    setChords(analyzeChords(updated));
    return s.slice(0, -1);
  });
}

function handleRedo() {
  setRedoStack(s => {
    if (!s.length) return s;
    const next = s[0];
    setUndoStack(u => [...u, notes]);
    setNotes(next);
    setChords(analyzeChords(next));
    return s.slice(1);
  });
}
```

Add a `useEffect` for keyboard shortcuts (merge with the existing spacebar / A/B handler or add alongside it):

```ts
// In the same keydown useEffect, add before the existing key checks:
if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); handleUndo(); return; }
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); handleRedo(); return; }
if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
  e.preventDefault();
  handleDeleteNotesImpl([...selectedIds]);
}
```

Replace the existing placeholder `handleEditNote`, `handleDeleteNotes`, `handleCreateNote` stubs:

```ts
function handleEditNote(id: string, changes: Partial<Pick<NoteEvent, 'midi' | 'startSec' | 'durationSec'>>) {
  setNotes(prev => {
    pushUndo(prev);
    const updated = prev.map(n => n.id === id ? { ...n, ...changes } : n);
    setChords(analyzeChords(updated));
    setHasUnsavedEdits(true);
    return updated;
  });
}

function handleDeleteNotesImpl(ids: string[]) {
  setNotes(prev => {
    pushUndo(prev);
    const updated = prev.filter(n => !ids.includes(n.id));
    setChords(analyzeChords(updated));
    setSelectedIds(new Set());
    setHasUnsavedEdits(true);
    return updated;
  });
}

function handleDeleteNotes(ids: string[]) {
  handleDeleteNotesImpl(ids);
}

function handleCreateNote(note: Omit<NoteEvent, 'id' | 'chordId' | 'startBeat' | 'durationBeats' | 'velocity'>) {
  const newNote: NoteEvent = {
    ...note,
    id: Math.random().toString(36).slice(2),
    velocity: 0.7,
  };
  setNotes(prev => {
    pushUndo(prev);
    const updated = [...prev, newNote].sort((a, b) => a.startSec - b.startSec);
    setChords(analyzeChords(updated));
    setHasUnsavedEdits(true);
    return updated;
  });
}
```

Add undo/redo buttons to toolbar (after the `editMode` toggle button):

```tsx
{editMode && (
  <>
    <button onClick={handleUndo} disabled={!undoStack.length} style={btnStyle('#21262d', undoStack.length ? '#8b949e' : '#4b5563')} title="Undo (⌘Z)">↩</button>
    <button onClick={handleRedo} disabled={!redoStack.length} style={btnStyle('#21262d', redoStack.length ? '#8b949e' : '#4b5563')} title="Redo (⌘⇧Z)">↪</button>
  </>
)}
```

- [ ] **Step 2: Add edit-mode mouse handling to PianoRoll**

In `PianoRoll.tsx`, the drag-scroll `useEffect` needs to be extended to handle editing when `editMode` is true. Add a new `useEffect` for edit interactions:

```ts
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  type DragOp =
    | { kind: 'pitch'; note: NoteEvent; startY: number; origMidi: number }
    | { kind: 'time';  note: NoteEvent; startX: number; origStart: number }
    | { kind: 'dur';   note: NoteEvent; startX: number; origDur: number };

  let drag: DragOp | null = null;

  function getRowH(): number {
    const s = stateRef.current;
    const notes = s.notes;
    const numRows = Math.max(MIN_ROWS, notes.length === 0 ? 12
      : (Math.max(...notes.map(n => n.midi)) - Math.min(...notes.map(n => n.midi)) + 7));
    return canvas.height / numRows;
  }

  function getMaxMidi(): number {
    const s = stateRef.current;
    return s.notes.length === 0 ? 72 : Math.max(...s.notes.map(n => n.midi)) + 3;
  }

  function hitTestEdit(mx: number, my: number): { note: NoteEvent; region: 'edge' | 'body' } | null {
    const s = stateRef.current;
    const rowH = getRowH();
    const maxMidi = getMaxMidi();
    for (let i = s.notes.length - 1; i >= 0; i--) {
      const note = s.notes[i];
      const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
      const w = Math.max(4, note.durationSec * s.zoomX);
      const y = (maxMidi - note.midi) * rowH;
      if (mx >= x && mx <= x + w && my >= y && my <= y + rowH) {
        const edgeW = Math.min(8, w * 0.3);
        return { note, region: mx >= x + w - edgeW ? 'edge' : 'body' };
      }
    }
    return null;
  }

  function onMouseDown(e: MouseEvent) {
    if (!propsRef.current.editMode) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTestEdit(mx, my);
    if (!hit) {
      // Double-click → create note
      return;
    }
    e.stopPropagation(); // prevent scroll drag
    const { note, region } = hit;
    if (region === 'edge') {
      drag = { kind: 'dur', note, startX: e.clientX, origDur: note.durationSec };
    } else {
      // vertical drag = pitch, horizontal drag = time — decide on first move
      drag = { kind: 'time', note, startX: e.clientX, origStart: note.startSec };
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!drag) return;
    const s = stateRef.current;
    const dx = e.clientX - ('startX' in drag ? drag.startX : 0);
    if (drag.kind === 'dur') {
      const newDur = Math.max(0.02, drag.origDur + dx / s.zoomX);
      propsRef.current.onEditNote(drag.note.id, { durationSec: newDur });
    } else if (drag.kind === 'time') {
      const newStart = Math.max(0, drag.origStart + dx / s.zoomX);
      propsRef.current.onEditNote(drag.note.id, { startSec: newStart });
    }
  }

  function onMouseUp() { drag = null; }

  function onDblClick(e: MouseEvent) {
    if (!propsRef.current.editMode) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTestEdit(mx, my);
    if (hit) return; // don't create on existing note
    const s = stateRef.current;
    const rowH = getRowH();
    const maxMidi = getMaxMidi();
    const sec = Math.max(0, (mx - GUTTER + s.scrollX) / s.zoomX);
    const midi = Math.round(maxMidi - my / rowH);
    propsRef.current.onCreateNote({ midi, cents: 0, startSec: sec, durationSec: 0.5 });
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('dblclick', onDblClick);
  return () => {
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('dblclick', onDblClick);
  };
}, []);
```

- [ ] **Step 3: Update canvas cursor based on editMode and hover**

Add a `mousemove` listener that updates cursor:

```ts
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  function onMove(e: MouseEvent) {
    if (!propsRef.current.editMode) { canvas.style.cursor = 'default'; return; }
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = stateRef.current;
    const rowH = canvas.height / Math.max(MIN_ROWS, s.notes.length === 0 ? 12 : Math.max(...s.notes.map(n => n.midi)) - Math.min(...s.notes.map(n => n.midi)) + 7);
    const maxMidi = s.notes.length === 0 ? 72 : Math.max(...s.notes.map(n => n.midi)) + 3;
    for (let i = s.notes.length - 1; i >= 0; i--) {
      const note = s.notes[i];
      const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
      const w = Math.max(4, note.durationSec * s.zoomX);
      const y = (maxMidi - note.midi) * rowH;
      if (mx >= x && mx <= x + w && my >= y && my <= y + rowH) {
        const edgeW = Math.min(8, w * 0.3);
        canvas.style.cursor = mx >= x + w - edgeW ? 'ew-resize' : 'grab';
        return;
      }
    }
    canvas.style.cursor = 'crosshair';
  }
  canvas.addEventListener('mousemove', onMove);
  return () => canvas.removeEventListener('mousemove', onMove);
}, []);
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/audio-transcriber/components/PianoRoll.tsx \
        src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(audio-transcriber): Piano 2 complete — editing mode, undo/redo, drag notes"
```

---

## Post-implementation: manual browser test

After all 9 tasks are committed:

```bash
npm run dev
```

Open `http://localhost:3000`, navigate to **Armonia → Audio Transcriber** and verify:

1. **Idle state**: dropzone renders, drag-and-drop zone is visible
2. **File load**: WAV/MP3 decodes, instrument pills active, Analizza enabled
3. **Analysis**: progress bar advances, result renders in piano roll
4. **Piano roll**: notes visible with chord colors, cents micro-bar, beat grid
5. **Transport**: Play/Pause (spacebar), stop, time counter, playhead moves
6. **Zoom**: mouse wheel zooms, drag scrolls
7. **NoteTable**: rows appear, correct note names (C4, D#3), cents coloring
8. **Selection**: click note in roll → highlights in table, and vice versa
9. **BPM edit**: change BPM input → notes re-quantize (Posizione changes)
10. **Edit mode**: toggle → drag note pitch/time/duration → note moves
11. **Undo/redo**: Cmd+Z reverts last edit, Cmd+Shift+Z re-applies
12. **ExportBar**: MIDI/PDF buttons visible but disabled

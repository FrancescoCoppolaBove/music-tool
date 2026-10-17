# Audio Transcriber — Polyphonic Engine + Sezione Fiati — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere un tipo strumento "Sezione Fiati" (poli), fixare l'energy gate mancante nel poly transcriber, e permettere all'utente di scegliere il numero di voci simultanee via dropdown.

**Architecture:** Stesso schema 3-pass del mono engine v2 — energy gate con isteresi → Klapuri solo nelle regioni attive → tracking temporale. `voiceCount` selezionato dall'utente viene passato come `MAX_POLY` a runtime attraverso la catena: UI → workerClient → worker → transcribe → transcribePoly.

**Tech Stack:** TypeScript, pitchy (non toccato), Web Worker, React.

---

## File structure

| File | Azione |
|---|---|
| `src/features/audio-transcriber/types.ts` | Aggiunge `winds-section` a `InstrumentKind` e `INSTRUMENT_CONFIG` |
| `src/features/audio-transcriber/engine/polyTranscriber.ts` | Energy gate pass 1, `voiceCount` param → `MAX_POLY`, fix ID counter, flush tracks a fine regione |
| `src/features/audio-transcriber/engine/transcribe.ts` | Aggiunge `options?: { voiceCount?: number }` alla firma, passa a `transcribePoly` |
| `src/features/audio-transcriber/engine/workerClient.ts` | Aggiunge `options?` alla firma, passa `voiceCount` nel postMessage |
| `src/features/audio-transcriber/engine/transcriber.worker.ts` | Aggiunge `voiceCount?` al `WorkerRequest`, lo destruttura e passa a `transcribe` |
| `src/features/audio-transcriber/AudioTranscriberFeature.tsx` | Aggiunge "Sezione Fiati" alla lista strumenti, aggiunge `voiceCount` state e dropdown condizionale |

---

## Task 1 — Aggiungere `winds-section` a `types.ts`

**Files:**
- Modify: `src/features/audio-transcriber/types.ts`

- [ ] **Step 1: Aggiungere `winds-section` all'union type e alla config**

Sostituire il contenuto di `src/features/audio-transcriber/types.ts` con:

```typescript
// src/features/audio-transcriber/types.ts

export type InstrumentKind = 'bass' | 'voice' | 'winds' | 'winds-section' | 'keyboard' | 'guitar';

export interface NoteEvent {
  id: string;
  midi: number;          // pitch MIDI intero
  cents: number;         // deviazione media dal temperamento, -50..+50
  startSec: number;      // tempo raw rilevato
  durationSec: number;
  velocity: number;      // 0..1 stimata dall'energia
  startBeat?: number;    // posizione in beat dal downbeat (dopo quantizzazione)
  durationBeats?: number;
  chordId?: string;      // gruppo accordo di appartenenza
}

export interface ChordEvent {
  id: string;
  noteIds: string[];
  symbol: string;        // es. "Cmaj7"
  voicing: string;       // es. "drop 2, 1° rivolto"
  startSec: number;
}

export interface TranscriptionResult {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;    // null se confidence sotto soglia
  bpmConfidence: number;
  beatOffsetSec: number; // offset del primo beat (per ri-quantizzare)
  key: string | null;    // "C major", "B minor"
  timeSignature: string; // default "4/4"
}

export interface InstrumentConfig {
  poly: boolean;
  minF0: number;   // Hz
  maxF0: number;   // Hz
  windowSize: number;
}

export const INSTRUMENT_CONFIG: Record<InstrumentKind, InstrumentConfig> = {
  bass:           { poly: false, minF0: 30,   maxF0: 400,  windowSize: 4096 },
  voice:          { poly: false, minF0: 65,   maxF0: 1200, windowSize: 2048 },
  winds:          { poly: false, minF0: 100,  maxF0: 2000, windowSize: 2048 },
  'winds-section':{ poly: true,  minF0: 65,   maxF0: 2000, windowSize: 4096 },
  keyboard:       { poly: true,  minF0: 27.5, maxF0: 2000, windowSize: 8192 },
  guitar:         { poly: true,  minF0: 73,   maxF0: 1320, windowSize: 8192 },
};
```

- [ ] **Step 2: Verifica TypeScript**

```bash
cd /Users/astuser/Documents/Repos/music-tool/.claude/worktrees/audio-transcriber-engine
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori. Se ci sono errori, indicano file che usano `InstrumentKind` come exhaustive switch — aggiungi il caso `winds-section` mancante.

- [ ] **Step 3: Commit**

```bash
git add src/features/audio-transcriber/types.ts
git commit -m "feat(transcriber): add winds-section instrument kind — poly, minF0=65, windowSize=4096"
```

---

## Task 2 — Riscrivere `polyTranscriber.ts` con energy gate + voiceCount + fix IDs

**Files:**
- Modify: `src/features/audio-transcriber/engine/polyTranscriber.ts`

- [ ] **Step 1: Sostituire l'intero file con la versione aggiornata**

```typescript
// src/features/audio-transcriber/engine/polyTranscriber.ts
// Multi-pitch stile Klapuri: STFT → whitening spettrale → salience function
// (somma pesata 1/h dell'energia alle posizioni armoniche) → stima iterativa
// con sottrazione del pettine armonico → tracking temporale con isteresi.
//
// Pass 1: energy gate con isteresi → regioni attive
// Pass 2: Klapuri (STFT + salience + comb) solo nelle regioni attive
// Pass 3: tracking temporale — invariato rispetto alla versione precedente

import { hannWindow, magnitudeSpectrum, parabolicBin, freqToMidi, midiToFreq, rms } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

let _noteIdCounter = 0;

const HOP = 1024;
const HARMONICS = 10;
const SALIENCE_RATIO = 0.5;
const SALIENCE_FLOOR = 0.5;
const MIN_FRAMES = 3;        // isteresi: una nota esiste se vista in ≥3 frame
const MAX_GAP = 2;           //            e sopravvive a 2 frame di assenza
const SUBTRACT_FACTOR = 0.1; // attenuazione dei bin armonici dopo ogni estrazione

const GATE_LOOKAHEAD = 2;
const MIN_REGION_FRAMES = 4;

const POLY_GATE: Partial<Record<InstrumentKind, { open: number; close: number }>> = {
  keyboard:        { open: 0.07, close: 0.025 },
  guitar:          { open: 0.07, close: 0.025 },
  'winds-section': { open: 0.05, close: 0.020 },
};
const DEFAULT_POLY_GATE = { open: 0.07, close: 0.025 };

interface FramePitch { midi: number; cents: number; salience: number; }

interface Track {
  midi: number;
  startFrame: number;
  lastFrame: number;
  count: number;
  salSum: number;
  centsSum: number;
  gap: number;
}

/** Max locale su 3 bin attorno a b. */
function peakNear(spec: Float32Array, b: number): number {
  return Math.max(spec[b - 1] ?? 0, spec[b] ?? 0, spec[b + 1] ?? 0);
}

/** Whitening: divide ogni bin per la media locale (prefix sum, finestra crescente col bin). */
function whiten(mag: Float32Array): void {
  const n = mag.length;
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + mag[i];
  for (let i = 0; i < n; i++) {
    const w = Math.max(10, i >> 3);
    const a = Math.max(0, i - w);
    const b = Math.min(n, i + w + 1);
    mag[i] = mag[i] / ((pre[b] - pre[a]) / (b - a) + 1e-6);
  }
}

function findPitchesInFrame(
  mag: Float32Array,
  binHz: number,
  minMidi: number,
  maxMidi: number,
  maxPoly: number,
): FramePitch[] {
  const spec = Float32Array.from(mag);
  let mx = 0;
  for (let i = 0; i < spec.length; i++) if (spec[i] > mx) mx = spec[i];
  if (mx < 1e-6) return [];
  for (let i = 0; i < spec.length; i++) spec[i] /= mx;

  const out: FramePitch[] = [];
  let firstSal = 0;

  for (let iter = 0; iter < maxPoly; iter++) {
    let bestMidi = -1, bestSal = 0;
    for (let m = minMidi; m <= maxMidi; m++) {
      const f0 = midiToFreq(m);
      const fundBin = Math.round(f0 / binHz);
      if (fundBin < 1 || fundBin >= spec.length - 1) continue;
      if (peakNear(spec, fundBin) < 0.05) continue;
      let isHarmonicOfFound = false;
      for (const found of out) {
        const fLow = midiToFreq(found.midi);
        const ratio = f0 / fLow;
        const nearestInt = Math.round(ratio);
        if (nearestInt >= 3 && Math.abs(ratio - nearestInt) < 0.05) {
          isHarmonicOfFound = true;
          break;
        }
      }
      if (isHarmonicOfFound) continue;
      let hasSubharmonicFundamental = false;
      for (let h = 3; h <= HARMONICS; h++) {
        const subF = f0 / h;
        const subBin = Math.round(subF / binHz);
        if (subBin < 1) break;
        const subMidi = Math.round(freqToMidi(subF));
        if (subMidi < minMidi || subMidi > maxMidi) continue;
        if (peakNear(spec, subBin) > 0.05) { hasSubharmonicFundamental = true; break; }
      }
      if (hasSubharmonicFundamental) continue;
      let sal = 0;
      for (let h = 1; h <= HARMONICS; h++) {
        const b = Math.round((h * f0) / binHz);
        if (b >= spec.length - 1) break;
        sal += peakNear(spec, b) / h;
      }
      if (sal > bestSal) { bestSal = sal; bestMidi = m; }
    }
    if (bestMidi < 0) break;
    if (iter === 0) firstSal = bestSal;
    if (bestSal < SALIENCE_RATIO * firstSal || bestSal < SALIENCE_FLOOR) break;

    const f0 = midiToFreq(bestMidi);
    const fb = Math.round(f0 / binHz);
    const refinedFreq = parabolicBin(spec, fb) * binHz;
    const centsRaw = (freqToMidi(refinedFreq) - bestMidi) * 100;
    const cents = Number.isFinite(centsRaw) ? Math.max(-50, Math.min(50, centsRaw)) : 0;

    out.push({ midi: bestMidi, cents, salience: bestSal });

    for (let h = 1; h <= HARMONICS; h++) {
      const b = Math.round((h * f0) / binHz);
      if (b >= spec.length - 1) break;
      if (b > 0) spec[b - 1] *= SUBTRACT_FACTOR;
      spec[b] *= SUBTRACT_FACTOR;
      spec[b + 1] *= SUBTRACT_FACTOR;
    }
  }
  return out;
}

export function transcribePoly(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  voiceCount = 6,
): NoteEvent[] {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const gate = POLY_GATE[instrument] ?? DEFAULT_POLY_GATE;
  const windowSize = cfg.windowSize;
  const binHz = sampleRate / windowSize;
  const win = hannWindow(windowSize);
  const nFrames = Math.max(0, Math.floor((signal.length - windowSize) / HOP));
  const minMidi = Math.ceil(freqToMidi(cfg.minF0));
  const maxMidi = Math.floor(freqToMidi(cfg.maxF0));

  // ── Pass 1: energy gate con isteresi ──────────────────────────────────────
  const tmpFrame = new Float32Array(windowSize);
  const frameRms = new Float32Array(nFrames);
  for (let i = 0; i < nFrames; i++) {
    tmpFrame.set(signal.subarray(i * HOP, i * HOP + windowSize));
    frameRms[i] = rms(tmpFrame);
  }

  const sortedRms = Float32Array.from(frameRms).sort();
  const peakRms = sortedRms[Math.floor(sortedRms.length * 0.97)] ?? 0;
  if (peakRms === 0) return [];

  const gateOpen = peakRms * gate.open;
  const gateClose = peakRms * gate.close;
  const activeRegions: Array<{ start: number; end: number }> = [];
  let gateIsOpen = false;
  let regionStart = 0;
  let prevRegionEnd = 0;

  for (let i = 0; i < nFrames; i++) {
    if (!gateIsOpen && frameRms[i] >= gateOpen) {
      gateIsOpen = true;
      regionStart = Math.max(prevRegionEnd, i - GATE_LOOKAHEAD);
    } else if (gateIsOpen && frameRms[i] < gateClose) {
      gateIsOpen = false;
      if (i - regionStart >= MIN_REGION_FRAMES) {
        activeRegions.push({ start: regionStart, end: i });
        prevRegionEnd = i;
      }
    }
  }
  if (gateIsOpen && nFrames - regionStart >= MIN_REGION_FRAMES) {
    activeRegions.push({ start: regionStart, end: nFrames });
  }

  // ── Pass 2 + 3: Klapuri + tracking solo nelle regioni attive ──────────────
  const open = new Map<number, Track>();
  const notes: NoteEvent[] = [];
  let globalMaxSal = 1e-9;

  const closeTrack = (t: Track) => {
    if (t.count >= MIN_FRAMES) {
      notes.push({
        id: `n${_noteIdCounter++}`,
        midi: t.midi,
        cents: Math.max(-50, Math.min(50, t.centsSum / t.count)),
        startSec: (t.startFrame * HOP) / sampleRate,
        durationSec: ((t.lastFrame - t.startFrame + 1) * HOP) / sampleRate,
        velocity: t.salSum / t.count,
      });
    }
  };

  const totalActiveFrames = activeRegions.reduce((s, r) => s + r.end - r.start, 0);
  let processedFrames = 0;

  const frame = new Float32Array(windowSize);
  for (const region of activeRegions) {
    for (let f = region.start; f < region.end; f++) {
      frame.set(signal.subarray(f * HOP, f * HOP + windowSize));
      const mag = magnitudeSpectrum(frame, win);
      whiten(mag);
      const found = findPitchesInFrame(mag, binHz, minMidi, maxMidi, voiceCount);

      const seen = new Set<number>();
      for (const p of found) {
        globalMaxSal = Math.max(globalMaxSal, p.salience);
        const t = open.get(p.midi);
        if (t) {
          t.lastFrame = f; t.count++; t.salSum += p.salience; t.centsSum += p.cents; t.gap = 0;
        } else {
          open.set(p.midi, {
            midi: p.midi, startFrame: f, lastFrame: f,
            count: 1, salSum: p.salience, centsSum: p.cents, gap: 0,
          });
        }
        seen.add(p.midi);
      }
      for (const [midi, t] of open) {
        if (!seen.has(midi)) {
          t.gap++;
          if (t.gap > MAX_GAP) { closeTrack(t); open.delete(midi); }
        }
      }

      processedFrames++;
      if (onProgress && processedFrames % 20 === 0) {
        onProgress(processedFrames / (totalActiveFrames || 1));
      }
    }
    // Flush tracce aperte a fine regione: il silenzio tra regioni resetta lo stato
    for (const t of open.values()) closeTrack(t);
    open.clear();
  }

  for (const n of notes) n.velocity = Math.min(1, n.velocity / globalMaxSal);
  return notes.sort((a, b) => a.startSec - b.startSec);
}
```

- [ ] **Step 2: Verifica TypeScript**

```bash
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori. Se `rms` non è esportato da dsp.ts, verificare con:
```bash
grep "export.*rms" src/features/audio-transcriber/engine/dsp.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/features/audio-transcriber/engine/polyTranscriber.ts
git commit -m "feat(poly-transcriber): 3-pass energy gate, voiceCount param, monotonic IDs, flush at region end"
```

---

## Task 3 — Thread `voiceCount` attraverso la catena API

**Files:**
- Modify: `src/features/audio-transcriber/engine/transcribe.ts`
- Modify: `src/features/audio-transcriber/engine/transcriber.worker.ts`
- Modify: `src/features/audio-transcriber/engine/workerClient.ts`

- [ ] **Step 1: Aggiornare `transcribe.ts` — aggiungere `options` e passarlo a `transcribePoly`**

Sostituire la firma e il routing in `transcribe.ts`:

```typescript
// src/features/audio-transcriber/engine/transcribe.ts
// Orchestratore della pipeline: trascrizione (mono|poli) → onset/BPM →
// snap degli attacchi agli onset → quantizzazione → tonalità → accordi.

import { transcribeMono } from './monoTranscriber';
import { transcribePoly } from './polyTranscriber';
import { detectOnsets } from './onsetDetector';
import { estimateTempo } from './tempoEstimator';
import { estimateKey } from './keyEstimator';
import { quantizeNotes } from './quantizer';
import { analyzeChords } from './chordAnalyzer';
import { INSTRUMENT_CONFIG, type InstrumentKind, type TranscriptionResult } from '../types';

const ONSET_SNAP_SEC = 0.08;
const MIN_NOTE_SEC = 0.05;

export function transcribe(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  options?: { voiceCount?: number },
): TranscriptionResult {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const sub = (a: number, b: number) => (p: number) => onProgress?.(a + p * (b - a));

  let notes = cfg.poly
    ? transcribePoly(signal, sampleRate, instrument, sub(0, 0.6), options?.voiceCount)
    : transcribeMono(signal, sampleRate, instrument, sub(0, 0.6));
  onProgress?.(0.6);

  const { flux, frameRate, onsets } = detectOnsets(signal, sampleRate);
  onProgress?.(0.75);
  const tempo = estimateTempo(flux, frameRate);

  for (const n of notes) {
    let best = -1, bestDist = ONSET_SNAP_SEC;
    for (const o of onsets) {
      const d = Math.abs(o - n.startSec);
      if (d < bestDist) { bestDist = d; best = o; }
    }
    if (best >= 0) {
      const end = n.startSec + n.durationSec;
      n.startSec = best;
      n.durationSec = Math.max(MIN_NOTE_SEC, end - best);
    }
  }

  let beatOffsetSec = tempo.beatOffsetSec;
  if (tempo.bpm !== null && notes.length > 0) {
    const beatDur = 60 / tempo.bpm;
    const firstStart = notes[0].startSec;
    while (beatOffsetSec > firstStart + 1e-6) beatOffsetSec -= beatDur;
  }

  if (tempo.bpm !== null) quantizeNotes(notes, tempo.bpm, beatOffsetSec);
  const key = estimateKey(notes);
  const chords = analyzeChords(notes);
  onProgress?.(1);

  return {
    notes,
    chords,
    bpm: tempo.bpm,
    bpmConfidence: tempo.confidence,
    beatOffsetSec,
    key,
    timeSignature: '4/4',
  };
}
```

- [ ] **Step 2: Aggiornare `transcriber.worker.ts` — aggiungere `voiceCount` al `WorkerRequest`**

```typescript
/// <reference lib="webworker" />
// Esegue transcribe() fuori dal main thread. Messaggi:
//   in:  { signal: Float32Array, sampleRate: number, instrument: InstrumentKind, voiceCount?: number }
//   out: { type: 'progress', progress } | { type: 'result', result } | { type: 'error', message }

import { transcribe } from './transcribe';
import type { InstrumentKind } from '../types';

interface WorkerRequest {
  signal: Float32Array;
  sampleRate: number;
  instrument: InstrumentKind;
  voiceCount?: number;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { signal, sampleRate, instrument, voiceCount } = e.data;
  try {
    const result = transcribe(signal, sampleRate, instrument, progress => {
      self.postMessage({ type: 'progress', progress });
    }, { voiceCount });
    self.postMessage({ type: 'result', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
```

- [ ] **Step 3: Aggiornare `workerClient.ts` — aggiungere `options` alla firma e al postMessage**

```typescript
// API promise-based per la UI. Il buffer audio viene TRASFERITO al worker
// (non copiato): dopo la chiamata il chiamante non deve più usare `signal`.

import type { InstrumentKind, TranscriptionResult } from '../types';

type WorkerMessage =
  | { type: 'progress'; progress: number }
  | { type: 'result'; result: TranscriptionResult }
  | { type: 'error'; message: string };

export function analyzeAudio(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  options?: { voiceCount?: number },
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./transcriber.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.progress);
      } else if (msg.type === 'result') {
        worker.terminate();
        resolve(msg.result);
      } else {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = err => {
      worker.terminate();
      reject(new Error(err.message || 'Worker error'));
    };
    try {
      worker.postMessage(
        { signal, sampleRate, instrument, voiceCount: options?.voiceCount },
        [signal.buffer],
      );
    } catch (err) {
      worker.terminate();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
```

- [ ] **Step 4: Verifica TypeScript**

```bash
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori.

- [ ] **Step 5: Commit**

```bash
git add src/features/audio-transcriber/engine/transcribe.ts \
        src/features/audio-transcriber/engine/transcriber.worker.ts \
        src/features/audio-transcriber/engine/workerClient.ts
git commit -m "feat(transcriber): thread voiceCount through API chain — UI → worker → transcribePoly"
```

---

## Task 4 — UI: aggiungere "Sezione Fiati" e voice count dropdown

**Files:**
- Modify: `src/features/audio-transcriber/AudioTranscriberFeature.tsx`

- [ ] **Step 1: Aggiungere "Sezione Fiati" alla lista strumenti**

Trovare la costante `INSTRUMENTS` (righe 27–33) e aggiungere la voce dopo `winds`:

```typescript
const INSTRUMENTS: { id: InstrumentKind; label: string; icon: string }[] = [
  { id: 'keyboard',       label: 'Tastiera',      icon: '🎹' },
  { id: 'bass',           label: 'Basso',          icon: '🎸' },
  { id: 'guitar',         label: 'Chitarra',       icon: '🪕' },
  { id: 'voice',          label: 'Voce',           icon: '🎤' },
  { id: 'winds',          label: 'Fiati',          icon: '🎺' },
  { id: 'winds-section',  label: 'Sezione Fiati',  icon: '🎷' },
];
```

- [ ] **Step 2: Aggiungere `voiceCount` state dentro il componente**

Aggiungere subito dopo `const [instrument, setInstrument] = useState<InstrumentKind>('keyboard');` (riga 53):

```typescript
const [voiceCount, setVoiceCount]         = useState(4);
```

- [ ] **Step 3: Aggiungere il dropdown condizionale dopo i pill strumenti nella toolbar**

Il blocco dei pill strumenti termina con `</div>` (la div con `display: 'flex', gap: 6`). Aggiungere subito dopo quella chiusura, prima del `<div style={{ flex: 1 }} />`:

```tsx
{instrument === 'winds-section' && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ fontSize: 12, color: '#6b7280' }}>Voci</span>
    <select
      value={voiceCount}
      onChange={e => setVoiceCount(Number(e.target.value))}
      style={{
        background: '#21262d', color: '#e6edf3',
        border: '1px solid #30363d', borderRadius: 8,
        padding: '5px 10px', fontSize: 13,
        fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
      }}
    >
      {[2, 3, 4, 5, 6].map(n => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 4: Passare `voiceCount` ad `analyzeAudio` dentro `runAnalysis`**

In `runAnalysis` (riga ~170), cambiare la chiamata ad `analyzeAudio`:

```typescript
const res = await analyzeAudio(
  signal,
  buf.sampleRate,
  instrument,
  setProgress,
  instrument === 'winds-section' ? { voiceCount } : undefined,
);
```

Aggiornare i deps di `useCallback`:

```typescript
}, [instrument, voiceCount]);
```

- [ ] **Step 5: Verifica TypeScript**

```bash
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/features/audio-transcriber/AudioTranscriberFeature.tsx
git commit -m "feat(ui): add Sezione Fiati instrument with voice count dropdown (2–6)"
```

---

## Task 5 — Verifica browser

**Files:** nessuna modifica — solo verifica.

- [ ] **Step 1: Avvia il dev server**

```bash
npm run dev
```

Apri `http://localhost:3000` nel browser, naviga al feature "Audio Transcriber".

- [ ] **Step 2: Check strumento "Sezione Fiati" appare nel selector**

Verifica che il pill "🎷 Sezione Fiati" sia visibile nella toolbar.
Cliccalo: deve apparire il dropdown "Voci" con opzioni 2–6 e default 4.
Cambia strumento a "Tastiera" o "Basso": il dropdown deve sparire.

- [ ] **Step 3: Check regressione — Tastiera (poly esistente)**

1. Carica un file audio con accordi di pianoforte.
2. Seleziona "Tastiera".
3. Clicca "Analizza".
4. Verifica che:
   - Nessuna nota nelle sezioni silenziose (gate attivo).
   - Il numero di note è ragionevole.
   - `voiceCount` non è passato → `transcribePoly` usa default `6` (comportamento invariato).

- [ ] **Step 4: Check "Sezione Fiati" con voiceCount variabile**

1. Carica un file con almeno 2 strumenti a fiato.
2. Seleziona "Sezione Fiati", imposta Voci = 2.
3. Analizza. Annota il numero di note rilevate.
4. Rianalizza con Voci = 5. Atteso: più tracce rilevate.

- [ ] **Step 5: Check regressione mono — Basso**

1. Carica `/Users/astuser/Desktop/bass.mp3`.
2. Seleziona "Basso".
3. Analizza.
4. Verifica che nessuna nota cada nelle sezioni silenziose (path mono invariato).

- [ ] **Step 6: Push**

```bash
git push origin master
```

Netlify avvia il deploy automatico sui 4 commit appena pushati.

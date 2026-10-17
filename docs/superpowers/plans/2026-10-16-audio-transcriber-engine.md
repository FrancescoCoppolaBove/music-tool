# Audio Transcriber — Piano 1: Engine di analisi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pipeline di trascrizione audio→note completa e verificata: mono (pitchy), poli (salience iterativa), onset/BPM/tonalità, quantizzazione, analisi accordi/voicing, Web Worker.

**Architecture:** Funzioni pure su `Float32Array` + sampleRate (niente Web Audio nell'engine → verificabile in Node con tsx). Orchestratore `transcribe()` eseguito in un Web Worker. Spec: `docs/superpowers/specs/2026-10-16-audio-transcriber-design.md`.

**Tech Stack:** TypeScript, `pitchy` (già installato), `tonal` (già installato), FFT custom radix-2. Zero nuove dipendenze npm.

**Validazione:** niente test suite nel progetto (da CLAUDE.md). Ogni task ha uno script di verifica in `src/features/audio-transcriber/engine/checks/` eseguito con `npx tsx <file>`: genera audio sintetico (sinusoidi con armonici, click ritmici) e fa assert sul risultato, `process.exit(1)` se fallisce. Gli script vengono committati (documentazione vivente). `npm run build` a ogni task per il type-check (tsx non type-checka).

---

## File structure

```
src/features/audio-transcriber/
├── types.ts                      # Task 1 — NoteEvent, ChordEvent, TranscriptionResult, INSTRUMENT_CONFIG
└── engine/
    ├── dsp.ts                    # Task 2 — FFT, Hann, magnitudeSpectrum, helpers matematici
    ├── monoTranscriber.ts        # Task 3 — basso/voce/fiati via pitchy
    ├── onsetDetector.ts          # Task 4 — spectral flux + peak picking
    ├── tempoEstimator.ts         # Task 5 — BPM da autocorrelazione
    ├── keyEstimator.ts           # Task 6 — Krumhansl-Schmuckler
    ├── polyTranscriber.ts        # Task 7 — salience iterativa stile Klapuri
    ├── quantizer.ts              # Task 8 — snap alla griglia ritmica
    ├── chordAnalyzer.ts          # Task 9 — simboli + voicing via tonal
    ├── transcribe.ts             # Task 10 — orchestratore
    ├── transcriber.worker.ts     # Task 11 — Web Worker
    ├── workerClient.ts           # Task 11 — API promise-based per la UI
    └── checks/
        ├── synth.ts              # Task 3 — generatori audio sintetico condivisi
        ├── check-fft.ts          # Task 2
        ├── check-mono.ts         # Task 3
        ├── check-onset.ts        # Task 4
        ├── check-tempo.ts        # Task 5
        ├── check-key.ts          # Task 6
        ├── check-poly.ts         # Task 7
        ├── check-quantize.ts     # Task 8
        ├── check-chords.ts       # Task 9
        └── check-full.ts         # Task 10
```

---

### Task 1: Tipi e configurazione strumenti

**Files:**
- Create: `src/features/audio-transcriber/types.ts`

- [ ] **Step 1: Scrivi types.ts**

```ts
// src/features/audio-transcriber/types.ts

export type InstrumentKind = 'bass' | 'voice' | 'winds' | 'keyboard' | 'guitar';

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
  bass:     { poly: false, minF0: 30,   maxF0: 400,  windowSize: 4096 },
  voice:    { poly: false, minF0: 65,   maxF0: 1200, windowSize: 2048 },
  winds:    { poly: false, minF0: 100,  maxF0: 2000, windowSize: 2048 },
  keyboard: { poly: true,  minF0: 27.5, maxF0: 2000, windowSize: 8192 },
  guitar:   { poly: true,  minF0: 73,   maxF0: 1320, windowSize: 8192 },
};
```

- [ ] **Step 2: Verifica il build**

Run: `npm run build`
Expected: exit 0, nessun errore TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/features/audio-transcriber/types.ts
git commit -m "feat(audio-transcriber): add core types and instrument config"
```

---

### Task 2: DSP — FFT, finestratura, helpers

**Files:**
- Create: `src/features/audio-transcriber/engine/dsp.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-fft.ts`

- [ ] **Step 1: Scrivi il check (fallirà: modulo mancante)**

```ts
// src/features/audio-transcriber/engine/checks/check-fft.ts
import { hannWindow, magnitudeSpectrum } from '../dsp';

function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

const SR = 44100;
const N = 4096;
const freq = 1000;
const signal = new Float32Array(N);
for (let i = 0; i < N; i++) signal[i] = Math.sin((2 * Math.PI * freq * i) / SR);

const mag = magnitudeSpectrum(signal, hannWindow(N));

let peakBin = 0;
for (let i = 1; i < mag.length; i++) if (mag[i] > mag[peakBin]) peakBin = i;

const expectedBin = Math.round(freq / (SR / N)); // ≈ 93
assert(Math.abs(peakBin - expectedBin) <= 1, `peak bin ${peakBin}, expected ~${expectedBin}`);
assert(mag.length === N / 2, `mag length ${mag.length}, expected ${N / 2}`);

console.log('OK check-fft — peak bin', peakBin);
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-fft.ts`
Expected: errore "Cannot find module '../dsp'".

- [ ] **Step 3: Implementa dsp.ts**

```ts
// src/features/audio-transcriber/engine/dsp.ts
// FFT radix-2 iterativa (Cooley-Tukey) + helpers matematici condivisi dall'engine.

export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if ((n & (n - 1)) !== 0) throw new Error('FFT size must be a power of 2');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const aRe = re[i + k], aIm = im[i + k];
        const bRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const bIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = aRe + bRe; im[i + k] = aIm + bIm;
        re[i + k + len / 2] = aRe - bRe; im[i + k + len / 2] = aIm - bIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
}

export function hannWindow(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

/** Spettro di magnitudine (prima metà) di un frame finestrato. */
export function magnitudeSpectrum(frame: Float32Array, win: Float32Array): Float32Array {
  const n = frame.length;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = frame[i] * win[i];
  fft(re, im);
  const half = n >> 1;
  const mag = new Float32Array(half);
  for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

/** Interpolazione parabolica del picco attorno al bin b; ritorna il bin frazionario. */
export function parabolicBin(spec: Float32Array, b: number): number {
  if (b <= 0 || b >= spec.length - 1) return b;
  const a = spec[b - 1], m = spec[b], c = spec[b + 1];
  const denom = a - 2 * m + c;
  if (Math.abs(denom) < 1e-12) return b;
  return b + (0.5 * (a - c)) / denom;
}

const A4 = 440;
export function freqToMidi(freq: number): number { return 69 + 12 * Math.log2(freq / A4); }
export function midiToFreq(midi: number): number { return A4 * Math.pow(2, (midi - 69) / 12); }

export function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function mean(arr: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return arr.length ? s / arr.length : 0;
}

export function rms(arr: Float32Array): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i] * arr[i];
  return Math.sqrt(s / arr.length);
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-fft.ts`
Expected: `OK check-fft — peak bin 93`

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/dsp.ts src/features/audio-transcriber/engine/checks/check-fft.ts
git commit -m "feat(audio-transcriber): add DSP core (FFT, windowing, math helpers)"
```

---

### Task 3: Synth helpers + trascrittore monofonico

**Files:**
- Create: `src/features/audio-transcriber/engine/checks/synth.ts`
- Create: `src/features/audio-transcriber/engine/monoTranscriber.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-mono.ts`

- [ ] **Step 1: Scrivi i generatori di audio sintetico**

```ts
// src/features/audio-transcriber/engine/checks/synth.ts
// Generatori di segnali di test per gli script di verifica dell'engine.

export const SR = 44100;

/** Tono con armonici (ampiezze relative) e breve fade in/out anti-click. */
export function tone(
  freq: number,
  durSec: number,
  harmonics: number[] = [1, 0.5, 0.25],
  amp = 0.4,
): Float32Array {
  const n = Math.round(durSec * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let h = 0; h < harmonics.length; h++) {
      v += harmonics[h] * Math.sin((2 * Math.PI * freq * (h + 1) * i) / SR);
    }
    const fade = Math.min(1, i / (0.01 * SR), (n - i) / (0.01 * SR));
    out[i] = amp * v * fade;
  }
  return out;
}

export function silence(durSec: number): Float32Array {
  return new Float32Array(Math.round(durSec * SR));
}

export function concat(...sigs: Float32Array[]): Float32Array {
  const total = sigs.reduce((s, x) => s + x.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const s of sigs) { out.set(s, off); off += s.length; }
  return out;
}

export function mix(...sigs: Float32Array[]): Float32Array {
  const len = Math.max(...sigs.map(s => s.length));
  const out = new Float32Array(len);
  for (const s of sigs) for (let i = 0; i < s.length; i++) out[i] += s[i];
  return out;
}

/** Burst di rumore (20ms) a intervalli regolari — simula click ritmici. */
export function clicks(bpm: number, count: number): Float32Array {
  const beatSec = 60 / bpm;
  const out = new Float32Array(Math.round(count * beatSec * SR));
  const burst = Math.round(0.02 * SR);
  for (let c = 0; c < count; c++) {
    const start = Math.round(c * beatSec * SR);
    for (let i = 0; i < burst && start + i < out.length; i++) {
      out[start + i] = (Math.random() * 2 - 1) * 0.8 * (1 - i / burst);
    }
  }
  return out;
}

export function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}
```

- [ ] **Step 2: Scrivi il check mono (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-mono.ts
import { transcribeMono } from '../monoTranscriber';
import { SR, tone, concat, assert } from './synth';

// Sequenza A4 → C5 → E5, mezzo secondo ciascuna (strumento: voce)
const signal = concat(tone(440, 0.5), tone(523.25, 0.5), tone(659.25, 0.5));
const notes = transcribeMono(signal, SR, 'voice');

assert(notes.length === 3, `expected 3 notes, got ${notes.length}: ${notes.map(n => n.midi).join(',')}`);
assert(notes[0].midi === 69, `note 0: expected A4 (69), got ${notes[0].midi}`);
assert(notes[1].midi === 72, `note 1: expected C5 (72), got ${notes[1].midi}`);
assert(notes[2].midi === 76, `note 2: expected E5 (76), got ${notes[2].midi}`);
assert(Math.abs(notes[0].startSec - 0) < 0.1, `note 0 start ${notes[0].startSec}`);
assert(Math.abs(notes[1].startSec - 0.5) < 0.1, `note 1 start ${notes[1].startSec}`);
for (const n of notes) {
  assert(Math.abs(n.cents) < 15, `cents off: ${n.cents} on midi ${n.midi}`);
  assert(n.durationSec > 0.3 && n.durationSec < 0.7, `duration ${n.durationSec}`);
  assert(n.velocity > 0 && n.velocity <= 1, `velocity ${n.velocity}`);
}

// Registro basso: E1 (41.2 Hz) con finestra 4096 (strumento: basso)
const bassNotes = transcribeMono(tone(41.2, 0.8), SR, 'bass');
assert(bassNotes.length === 1, `bass: expected 1 note, got ${bassNotes.length}`);
assert(bassNotes[0].midi === 28, `bass: expected E1 (28), got ${bassNotes[0].midi}`);

console.log('OK check-mono —', notes.map(n => n.midi).join(','), '+ bass E1');
```

- [ ] **Step 3: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-mono.ts`
Expected: errore "Cannot find module '../monoTranscriber'".

- [ ] **Step 4: Implementa monoTranscriber.ts**

```ts
// src/features/audio-transcriber/engine/monoTranscriber.ts
// Trascrizione monofonica (basso/voce/fiati): pitch per frame con pitchy (MPM),
// poi segmentazione in note su pitch stabile. Stessa famiglia di tecniche del
// PitchTracker di Nail the Pitch, ma offline su tutto il file.

import { PitchDetector } from 'pitchy';
import { freqToMidi, median, mean, rms } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

const CLARITY_MIN = 0.75;
const MIN_FRAMES = 3;        // una nota deve durare almeno 3 frame
const MAX_UNVOICED_RUN = 2;  // frame non intonati tollerati dentro una nota
const SEMITONE_TOL = 0.6;    // in semitoni: oltre, è una nuova nota

interface OpenSeg {
  midis: number[];
  rmsVals: number[];
  startFrame: number;
  unvoicedRun: number;
}

export function transcribeMono(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): NoteEvent[] {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const windowSize = cfg.windowSize;
  const hop = windowSize / 4;
  const detector = PitchDetector.forFloat32Array(windowSize);
  detector.minVolumeDecibels = -50;

  const nFrames = Math.floor((signal.length - windowSize) / hop);
  const notes: NoteEvent[] = [];
  const frame = new Float32Array(windowSize);
  let seg: OpenSeg | null = null;

  const close = () => {
    if (!seg) return;
    if (seg.midis.length >= MIN_FRAMES) {
      const med = median(seg.midis);
      const midi = Math.round(med);
      notes.push({
        id: crypto.randomUUID(),
        midi,
        cents: Math.max(-50, Math.min(50, (med - midi) * 100)),
        startSec: (seg.startFrame * hop) / sampleRate,
        durationSec: (seg.midis.length * hop) / sampleRate,
        velocity: Math.min(1, mean(seg.rmsVals) * 2.5),
      });
    }
    seg = null;
  };

  for (let i = 0; i < nFrames; i++) {
    frame.set(signal.subarray(i * hop, i * hop + windowSize));
    const [pitch, clarity] = detector.findPitch(frame, sampleRate);
    const voiced = pitch >= cfg.minF0 && pitch <= cfg.maxF0 && clarity >= CLARITY_MIN;

    if (voiced) {
      const midi = freqToMidi(pitch);
      if (seg && Math.abs(midi - median(seg.midis)) <= SEMITONE_TOL) {
        seg.midis.push(midi);
        seg.rmsVals.push(rms(frame));
        seg.unvoicedRun = 0;
      } else {
        close();
        seg = { midis: [midi], rmsVals: [rms(frame)], startFrame: i, unvoicedRun: 0 };
      }
    } else if (seg) {
      seg.unvoicedRun++;
      if (seg.unvoicedRun > MAX_UNVOICED_RUN) close();
    }

    if (onProgress && i % 50 === 0) onProgress(i / nFrames);
  }
  close();
  return notes;
}
```

- [ ] **Step 5: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-mono.ts`
Expected: `OK check-mono — 69,72,76 + bass E1`

- [ ] **Step 6: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/monoTranscriber.ts src/features/audio-transcriber/engine/checks/synth.ts src/features/audio-transcriber/engine/checks/check-mono.ts
git commit -m "feat(audio-transcriber): add monophonic transcriber (pitchy-based)"
```

---

### Task 4: Onset detector (spectral flux)

**Files:**
- Create: `src/features/audio-transcriber/engine/onsetDetector.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-onset.ts`

- [ ] **Step 1: Scrivi il check (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-onset.ts
import { detectOnsets } from '../onsetDetector';
import { SR, clicks, assert } from './synth';

// 8 click a 120 BPM → onset ogni 0.5s
const signal = clicks(120, 8);
const { onsets, flux, frameRate } = detectOnsets(signal, SR);

assert(onsets.length >= 7 && onsets.length <= 9, `expected ~8 onsets, got ${onsets.length}`);
for (let i = 1; i < Math.min(onsets.length, 8); i++) {
  const gap = onsets[i] - onsets[i - 1];
  assert(Math.abs(gap - 0.5) < 0.06, `gap ${i}: ${gap.toFixed(3)}s, expected ~0.5s`);
}
assert(flux.length > 0, 'flux curve empty');
assert(frameRate > 0, 'frameRate not positive');

console.log('OK check-onset —', onsets.length, 'onsets');
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-onset.ts`
Expected: errore "Cannot find module '../onsetDetector'".

- [ ] **Step 3: Implementa onsetDetector.ts**

```ts
// src/features/audio-transcriber/engine/onsetDetector.ts
// Spectral flux: somma delle differenze positive tra spettri di frame adiacenti.
// Picchi sopra soglia adattiva (media locale) = attacchi di nota.

import { hannWindow, magnitudeSpectrum } from './dsp';

export interface OnsetResult {
  flux: Float32Array;   // curva di flux, un valore per frame
  frameRate: number;    // frame al secondo (sampleRate / hop)
  onsets: number[];     // tempi degli attacchi, in secondi
}

const LOCAL_MAX_RADIUS = 3;
const THRESHOLD_WINDOW = 10;
const THRESHOLD_FACTOR = 1.5;
const MIN_ONSET_GAP_SEC = 0.05;

export function detectOnsets(
  signal: Float32Array,
  sampleRate: number,
  windowSize = 2048,
  hop = 512,
): OnsetResult {
  const win = hannWindow(windowSize);
  const n = Math.max(0, Math.floor((signal.length - windowSize) / hop));
  const frameRate = sampleRate / hop;
  const flux = new Float32Array(n);
  const frame = new Float32Array(windowSize);
  let prev: Float32Array | null = null;

  for (let i = 0; i < n; i++) {
    frame.set(signal.subarray(i * hop, i * hop + windowSize));
    const mag = magnitudeSpectrum(frame, win);
    if (prev) {
      let s = 0;
      for (let b = 0; b < mag.length; b++) {
        const d = mag[b] - prev[b];
        if (d > 0) s += d;
      }
      flux[i] = s;
    }
    prev = mag;
  }

  const onsets: number[] = [];
  for (let i = LOCAL_MAX_RADIUS; i < n - LOCAL_MAX_RADIUS; i++) {
    let isMax = true;
    for (let k = -LOCAL_MAX_RADIUS; k <= LOCAL_MAX_RADIUS; k++) {
      if (flux[i] < flux[i + k]) { isMax = false; break; }
    }
    if (!isMax) continue;
    let s = 0, c = 0;
    for (let j = Math.max(0, i - THRESHOLD_WINDOW); j < Math.min(n, i + THRESHOLD_WINDOW); j++) {
      s += flux[j]; c++;
    }
    if (flux[i] > (s / c) * THRESHOLD_FACTOR + 1e-4) {
      const t = (i * hop) / sampleRate;
      if (onsets.length === 0 || t - onsets[onsets.length - 1] > MIN_ONSET_GAP_SEC) {
        onsets.push(t);
      }
    }
  }

  return { flux, frameRate, onsets };
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-onset.ts`
Expected: `OK check-onset — 8 onsets` (7 o 9 accettati).

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/onsetDetector.ts src/features/audio-transcriber/engine/checks/check-onset.ts
git commit -m "feat(audio-transcriber): add spectral flux onset detector"
```

---

### Task 5: Stima del tempo (BPM)

**Files:**
- Create: `src/features/audio-transcriber/engine/tempoEstimator.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-tempo.ts`

- [ ] **Step 1: Scrivi il check (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-tempo.ts
import { detectOnsets } from '../onsetDetector';
import { estimateTempo } from '../tempoEstimator';
import { SR, clicks, silence, assert } from './synth';

// 16 click a 120 BPM
const { flux, frameRate } = detectOnsets(clicks(120, 16), SR);
const tempo = estimateTempo(flux, frameRate);

assert(tempo.bpm !== null, 'bpm is null on a steady click track');
assert(Math.abs((tempo.bpm as number) - 120) < 3, `bpm ${tempo.bpm}, expected ~120`);
assert(tempo.confidence > 0.15, `confidence ${tempo.confidence}`);
assert(tempo.beatOffsetSec >= 0 && tempo.beatOffsetSec < 0.5, `offset ${tempo.beatOffsetSec}`);

// Silenzio → nessun tempo
const quiet = detectOnsets(silence(5), SR);
const noTempo = estimateTempo(quiet.flux, quiet.frameRate);
assert(noTempo.bpm === null, `expected null bpm on silence, got ${noTempo.bpm}`);

console.log('OK check-tempo —', tempo.bpm, 'BPM, confidence', tempo.confidence.toFixed(2));
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-tempo.ts`
Expected: errore "Cannot find module '../tempoEstimator'".

- [ ] **Step 3: Implementa tempoEstimator.ts**

```ts
// src/features/audio-transcriber/engine/tempoEstimator.ts
// BPM per autocorrelazione della curva di spectral flux, con peso log-gaussiano
// centrato su 120 BPM per risolvere l'ambiguità di ottava del tempo (ISMIR 2004).
// La fase del beat (offset del downbeat) massimizza il flux campionato sul comb.

import { mean } from './dsp';

export interface TempoResult {
  bpm: number | null;
  confidence: number;    // 0..1 — autocorrelazione normalizzata al lag scelto
  beatOffsetSec: number; // offset del primo beat dall'inizio del segnale
}

const BPM_MIN = 40;
const BPM_MAX = 200;
const CONFIDENCE_FLOOR = 0.15;
const OCTAVE_SIGMA = 0.9; // larghezza del peso log-gaussiano

const NO_TEMPO: TempoResult = { bpm: null, confidence: 0, beatOffsetSec: 0 };

export function estimateTempo(flux: Float32Array, frameRate: number): TempoResult {
  const n = flux.length;
  if (n < frameRate * 4) return NO_TEMPO; // servono almeno ~4 secondi

  const x = Float32Array.from(flux);
  const m = mean(x);
  for (let i = 0; i < n; i++) x[i] = Math.max(0, x[i] - m);

  let e0 = 0;
  for (let i = 0; i < n; i++) e0 += x[i] * x[i];
  if (e0 <= 0) return NO_TEMPO;

  const minLag = Math.round((frameRate * 60) / BPM_MAX);
  const maxLag = Math.min(n - 1, Math.round((frameRate * 60) / BPM_MIN));

  let bestLag = -1, bestScore = 0, bestAcf = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acf = 0;
    for (let i = 0; i < n - lag; i++) acf += x[i] * x[i + lag];
    acf /= e0;
    const bpm = (60 * frameRate) / lag;
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / OCTAVE_SIGMA, 2));
    const score = acf * w;
    if (score > bestScore) { bestScore = score; bestLag = lag; bestAcf = acf; }
  }
  if (bestLag < 0) return NO_TEMPO;

  const confidence = Math.min(1, bestAcf);
  if (confidence < CONFIDENCE_FLOOR) return { bpm: null, confidence, beatOffsetSec: 0 };

  // Fase: l'offset nel periodo che massimizza il flux sommato sul comb di beat.
  let bestOff = 0, bestSum = -1;
  for (let off = 0; off < bestLag; off++) {
    let s = 0;
    for (let i = off; i < n; i += bestLag) s += flux[i];
    if (s > bestSum) { bestSum = s; bestOff = off; }
  }

  return {
    bpm: Math.round(((60 * frameRate) / bestLag) * 10) / 10,
    confidence,
    beatOffsetSec: bestOff / frameRate,
  };
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-tempo.ts`
Expected: `OK check-tempo — 120 BPM, confidence 0.xx` (bpm in 117–123).

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/tempoEstimator.ts src/features/audio-transcriber/engine/checks/check-tempo.ts
git commit -m "feat(audio-transcriber): add BPM estimator (autocorrelation + octave weighting)"
```

---

### Task 6: Stima della tonalità (Krumhansl-Schmuckler)

**Files:**
- Create: `src/features/audio-transcriber/engine/keyEstimator.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-key.ts`

- [ ] **Step 1: Scrivi il check (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-key.ts
import { estimateKey } from '../keyEstimator';
import { assert } from './synth';

// Scala di Do maggiore, tonica con durata doppia
const cMajor = [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({
  midi,
  durationSec: i === 0 || i === 7 ? 1.0 : 0.5,
}));
assert(estimateKey(cMajor) === 'C major', `expected "C major", got "${estimateKey(cMajor)}"`);

// Scala di La minore armonica
const aMinor = [57, 59, 60, 62, 64, 65, 68, 69].map((midi, i) => ({
  midi,
  durationSec: i === 0 || i === 7 ? 1.0 : 0.5,
}));
assert(estimateKey(aMinor) === 'A minor', `expected "A minor", got "${estimateKey(aMinor)}"`);

assert(estimateKey([]) === null, 'expected null on empty input');

console.log('OK check-key');
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-key.ts`
Expected: errore "Cannot find module '../keyEstimator'".

- [ ] **Step 3: Implementa keyEstimator.ts**

```ts
// src/features/audio-transcriber/engine/keyEstimator.ts
// Krumhansl-Schmuckler: istogramma dei pitch class pesato per durata,
// correlato (Pearson) con i 24 profili maggiore/minore.

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

export function estimateKey(notes: { midi: number; durationSec: number }[]): string | null {
  if (notes.length === 0) return null;
  const hist = new Array<number>(12).fill(0);
  for (const n of notes) hist[((n.midi % 12) + 12) % 12] += n.durationSec;

  let best = '', bestR = -Infinity;
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = hist.map((_, i) => hist[(i + tonic) % 12]);
    const rMajor = pearson(rotated, MAJOR_PROFILE);
    const rMinor = pearson(rotated, MINOR_PROFILE);
    if (rMajor > bestR) { bestR = rMajor; best = `${KEY_NAMES[tonic]} major`; }
    if (rMinor > bestR) { bestR = rMinor; best = `${KEY_NAMES[tonic]} minor`; }
  }
  return best;
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-key.ts`
Expected: `OK check-key`

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/keyEstimator.ts src/features/audio-transcriber/engine/checks/check-key.ts
git commit -m "feat(audio-transcriber): add Krumhansl-Schmuckler key estimator"
```

---

### Task 7: Trascrittore polifonico (salience iterativa)

**Files:**
- Create: `src/features/audio-transcriber/engine/polyTranscriber.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-poly.ts`

- [ ] **Step 1: Scrivi il check (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-poly.ts
import { transcribePoly } from '../polyTranscriber';
import { SR, tone, mix, concat, assert } from './synth';

// Triade C4-E4-G4 (1s) poi F4-A4-C5 (1s), timbro con 3 armonici
const chord1 = mix(tone(261.63, 1), tone(329.63, 1), tone(392.0, 1));
const chord2 = mix(tone(349.23, 1), tone(440.0, 1), tone(523.25, 1));
const signal = concat(chord1, chord2);

const notes = transcribePoly(signal, SR, 'keyboard');

const firstHalf = new Set(notes.filter(n => n.startSec < 0.9).map(n => n.midi));
const secondHalf = new Set(notes.filter(n => n.startSec >= 0.9).map(n => n.midi));

for (const m of [60, 64, 67]) assert(firstHalf.has(m), `missing midi ${m} in first chord; got ${[...firstHalf]}`);
for (const m of [65, 69, 72]) assert(secondHalf.has(m), `missing midi ${m} in second chord; got ${[...secondHalf]}`);

// Niente falsi positivi grossolani: max 1 nota spuria per metà
assert(firstHalf.size <= 4, `too many notes in first half: ${[...firstHalf]}`);
assert(secondHalf.size <= 4, `too many notes in second half: ${[...secondHalf]}`);

for (const n of notes) assert(n.velocity > 0 && n.velocity <= 1, `velocity ${n.velocity}`);

console.log('OK check-poly —', [...firstHalf].join(','), '|', [...secondHalf].join(','));
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-poly.ts`
Expected: errore "Cannot find module '../polyTranscriber'".

- [ ] **Step 3: Implementa polyTranscriber.ts**

```ts
// src/features/audio-transcriber/engine/polyTranscriber.ts
// Multi-pitch stile Klapuri: STFT → whitening spettrale → salience function
// (somma pesata 1/h dell'energia alle posizioni armoniche) → stima iterativa
// con sottrazione del pettine armonico → tracking temporale con isteresi.
// Il fondamentale deve essere presente nello spettro: elimina i subarmonici
// fantasma (es. C3 "spiegato" da C4+G4).

import { hannWindow, magnitudeSpectrum, parabolicBin, freqToMidi, midiToFreq } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

const HOP = 1024;
const HARMONICS = 10;
const MAX_POLY = 6;          // max note simultanee
const SALIENCE_RATIO = 0.35; // stop quando la salience scende sotto questa frazione della prima
const SALIENCE_FLOOR = 0.3;  // floor assoluto (spettro normalizzato a max=1)
const MIN_FRAMES = 3;        // isteresi: una nota esiste se vista in ≥3 frame
const MAX_GAP = 2;           //            e sopravvive a 2 frame di assenza
const SUBTRACT_FACTOR = 0.1; // attenuazione dei bin armonici dopo ogni estrazione

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
): FramePitch[] {
  const spec = Float32Array.from(mag);
  // normalizza a max=1; frame quasi silenziosi → niente note
  let mx = 0;
  for (let i = 0; i < spec.length; i++) if (spec[i] > mx) mx = spec[i];
  if (mx < 1e-6) return [];
  for (let i = 0; i < spec.length; i++) spec[i] /= mx;

  const out: FramePitch[] = [];
  let firstSal = 0;

  for (let iter = 0; iter < MAX_POLY; iter++) {
    let bestMidi = -1, bestSal = 0;
    for (let m = minMidi; m <= maxMidi; m++) {
      const f0 = midiToFreq(m);
      const fundBin = Math.round(f0 / binHz);
      if (fundBin < 1 || fundBin >= spec.length - 1) continue;
      if (peakNear(spec, fundBin) < 0.02) continue; // fondamentale assente → scarta
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

    // cents dal picco raffinato (interpolazione parabolica al fondamentale)
    const f0 = midiToFreq(bestMidi);
    const fb = Math.round(f0 / binHz);
    const refinedFreq = parabolicBin(spec, fb) * binHz;
    const centsRaw = (freqToMidi(refinedFreq) - bestMidi) * 100;
    const cents = Number.isFinite(centsRaw) ? Math.max(-50, Math.min(50, centsRaw)) : 0;

    out.push({ midi: bestMidi, cents, salience: bestSal });

    // sottrazione del pettine armonico
    for (let h = 1; h <= HARMONICS; h++) {
      const b = Math.round((h * f0) / binHz);
      if (b >= spec.length - 1) break;
      spec[b - 1] *= SUBTRACT_FACTOR;
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
): NoteEvent[] {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const windowSize = cfg.windowSize;
  const binHz = sampleRate / windowSize;
  const win = hannWindow(windowSize);
  const nFrames = Math.max(0, Math.floor((signal.length - windowSize) / HOP));
  const minMidi = Math.ceil(freqToMidi(cfg.minF0));
  const maxMidi = Math.floor(freqToMidi(cfg.maxF0));

  const open = new Map<number, Track>();
  const notes: NoteEvent[] = [];
  let globalMaxSal = 1e-9;

  const closeTrack = (t: Track) => {
    if (t.count >= MIN_FRAMES) {
      notes.push({
        id: crypto.randomUUID(),
        midi: t.midi,
        cents: Math.max(-50, Math.min(50, t.centsSum / t.count)),
        startSec: (t.startFrame * HOP) / sampleRate,
        durationSec: ((t.lastFrame - t.startFrame + 1) * HOP) / sampleRate,
        velocity: t.salSum / t.count, // normalizzata a fine funzione
      });
    }
  };

  const frame = new Float32Array(windowSize);
  for (let f = 0; f < nFrames; f++) {
    frame.set(signal.subarray(f * HOP, f * HOP + windowSize));
    const mag = magnitudeSpectrum(frame, win);
    whiten(mag);
    const found = findPitchesInFrame(mag, binHz, minMidi, maxMidi);

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

    if (onProgress && f % 20 === 0) onProgress(f / nFrames);
  }
  for (const t of open.values()) closeTrack(t);

  for (const n of notes) n.velocity = Math.min(1, n.velocity / globalMaxSal);
  return notes.sort((a, b) => a.startSec - b.startSec);
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-poly.ts`
Expected: `OK check-poly — 60,64,67 | 65,69,72` (ordine nel set libero).

Se fallisce: i parametri da tarare sono `SALIENCE_RATIO` (falsi negativi → abbassa, falsi positivi → alza), `SALIENCE_FLOOR` e la soglia fondamentale `0.02`. Non cambiare la struttura dell'algoritmo.

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/polyTranscriber.ts src/features/audio-transcriber/engine/checks/check-poly.ts
git commit -m "feat(audio-transcriber): add polyphonic transcriber (iterative salience)"
```

---

### Task 8: Quantizzatore ritmico

**Files:**
- Create: `src/features/audio-transcriber/engine/quantizer.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-quantize.ts`

- [ ] **Step 1: Scrivi il check (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-quantize.ts
import { quantizeNotes } from '../quantizer';
import { assert } from './synth';
import type { NoteEvent } from '../../types';

const mk = (startSec: number, durationSec: number): NoteEvent => ({
  id: String(Math.random()), midi: 60, cents: 0, startSec, durationSec, velocity: 0.8,
});

// 120 BPM → beat = 0.5s. Nota a 0.26s ≈ 0.52 beat → snap a 0.5 (sedicesima griglia 0.25)
const notes = [mk(0, 0.5), mk(0.26, 0.24), mk(0.84, 0.16), mk(1.0, 0.33)];
quantizeNotes(notes, 120, 0);

assert(notes[0].startBeat === 0, `n0 startBeat ${notes[0].startBeat}`);
assert(notes[0].durationBeats === 1, `n0 durationBeats ${notes[0].durationBeats}`);
assert(notes[1].startBeat === 0.5, `n1 startBeat ${notes[1].startBeat}`);
assert(notes[1].durationBeats === 0.5, `n1 durationBeats ${notes[1].durationBeats}`);
// 0.84s = 1.68 beat → 1.75 (griglia 1/4)? no: 1.68 → più vicino a 1.75 (err .07) che a 5/3≈1.667 (err .013) → terzina
assert(Math.abs((notes[2].startBeat as number) - 5 / 3) < 1e-9, `n2 startBeat ${notes[2].startBeat}`);
// 0.33s = 0.66 beat → terzina 2/3 (err .007) batte 0.75 (err .09)
assert(Math.abs((notes[3].durationBeats as number) - 2 / 3) < 1e-9, `n3 durationBeats ${notes[3].durationBeats}`);
// offset: con beatOffsetSec=0.1, una nota a 0.6s → (0.6-0.1)/0.5 = 1 beat
const offsetNotes = [mk(0.6, 0.5)];
quantizeNotes(offsetNotes, 120, 0.1);
assert(offsetNotes[0].startBeat === 1, `offset startBeat ${offsetNotes[0].startBeat}`);

console.log('OK check-quantize');
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-quantize.ts`
Expected: errore "Cannot find module '../quantizer'".

- [ ] **Step 3: Implementa quantizer.ts**

```ts
// src/features/audio-transcriber/engine/quantizer.ts
// Snap di start/durata alla suddivisione più vicina tra sedicesimi (1/4 di beat)
// e terzine di croma (1/6 di beat). Muta i NoteEvent settando startBeat/durationBeats.

import type { NoteEvent } from '../types';

const GRIDS = [1 / 4, 1 / 6];

function snap(beats: number): number {
  let best = beats, err = Infinity;
  for (const g of GRIDS) {
    const s = Math.round(beats / g) * g;
    const e = Math.abs(s - beats);
    if (e < err) { err = e; best = s; }
  }
  return best;
}

export function quantizeNotes(notes: NoteEvent[], bpm: number, beatOffsetSec: number): void {
  const beatDur = 60 / bpm;
  for (const n of notes) {
    n.startBeat = snap(Math.max(0, (n.startSec - beatOffsetSec) / beatDur));
    const db = snap(n.durationSec / beatDur);
    n.durationBeats = db > 0 ? db : GRIDS[0];
  }
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-quantize.ts`
Expected: `OK check-quantize`

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/quantizer.ts src/features/audio-transcriber/engine/checks/check-quantize.ts
git commit -m "feat(audio-transcriber): add rhythmic quantizer (16ths + triplets)"
```

---

### Task 9: Analisi accordi e voicing

**Files:**
- Create: `src/features/audio-transcriber/engine/chordAnalyzer.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-chords.ts`

- [ ] **Step 1: Scrivi il check (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-chords.ts
import { analyzeChords } from '../chordAnalyzer';
import { assert } from './synth';
import type { NoteEvent } from '../../types';

const mk = (midi: number, startSec: number, durationSec = 1): NoteEvent => ({
  id: `${midi}-${startSec}`, midi, cents: 0, startSec, durationSec, velocity: 0.8,
});

// Cmaj7 close position fondamentale: C4 E4 G4 B4
const close = [mk(60, 0), mk(64, 0), mk(67, 0), mk(71, 0)];
const chords1 = analyzeChords(close);
assert(chords1.length === 1, `expected 1 chord, got ${chords1.length}`);
assert(/maj7/i.test(chords1[0].symbol) || /M7/.test(chords1[0].symbol), `symbol "${chords1[0].symbol}"`);
assert(chords1[0].voicing.includes('close'), `voicing "${chords1[0].voicing}"`);
assert(chords1[0].voicing.includes('fondamentale'), `voicing "${chords1[0].voicing}"`);
assert(close.every(n => n.chordId === chords1[0].id), 'chordId non assegnato alle note');

// Cmaj7 drop 2: G3 C4 E4 B4 (seconda voce dall'alto abbassata di ottava)
const drop2 = [mk(55, 2), mk(60, 2), mk(64, 2), mk(71, 2)];
const chords2 = analyzeChords(drop2);
assert(chords2.length === 1, `drop2: expected 1 chord, got ${chords2.length}`);
assert(chords2[0].voicing.includes('drop 2'), `drop2 voicing "${chords2[0].voicing}"`);

// Note melodiche non sovrapposte → nessun accordo
const melody = [mk(60, 4, 0.4), mk(62, 4.5, 0.4), mk(64, 5, 0.4)];
assert(analyzeChords(melody).length === 0, 'melody should produce no chords');

console.log('OK check-chords —', chords1[0].symbol, '·', chords1[0].voicing, '|', chords2[0].voicing);
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-chords.ts`
Expected: errore "Cannot find module '../chordAnalyzer'".

- [ ] **Step 3: Implementa chordAnalyzer.ts**

```ts
// src/features/audio-transcriber/engine/chordAnalyzer.ts
// Raggruppa note temporalmente sovrapposte (>50% della durata più corta),
// risolve il simbolo con tonal e descrive il voicing: spacing (close/open/
// drop 2/drop 3) + rivolto dal pitch class del basso.

import { Chord, Note } from 'tonal';
import type { ChordEvent, NoteEvent } from '../types';

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const OVERLAP_MIN = 0.5;

function overlapRatio(group: NoteEvent[], n: NoteEvent): number {
  const gs = Math.min(...group.map(x => x.startSec));
  const ge = Math.max(...group.map(x => x.startSec + x.durationSec));
  const s = Math.max(gs, n.startSec);
  const e = Math.min(ge, n.startSec + n.durationSec);
  const ov = Math.max(0, e - s);
  return ov / Math.min(ge - gs, n.durationSec);
}

/**
 * Rango di drop: se rialzando di un'ottava la nota più grave il set risultante
 * è in posizione stretta e la nota rialzata è la k-esima voce dall'alto → drop k+1.
 * Ritorna 1 per drop 2, 2 per drop 3, -1 altrimenti.
 */
function dropRank(pitches: number[]): number {
  if (pitches.length < 4) return -1;
  const raised = pitches[0] + 12;
  const rest = pitches.slice(1);
  if (raised > rest[rest.length - 1]) return -1;
  const merged = [...rest, raised].sort((a, b) => a - b);
  if (merged[merged.length - 1] - merged[0] > 12) return -1;
  const above = merged.filter(p => p > raised).length;
  return above === 1 || above === 2 ? above : -1;
}

function describeVoicing(pitches: number[], symbol: string): string {
  const parts: string[] = [];

  const rank = dropRank(pitches);
  if (rank === 1) parts.push('drop 2');
  else if (rank === 2) parts.push('drop 3');
  else {
    const span = pitches[pitches.length - 1] - pitches[0];
    parts.push(span <= 12 ? 'close position' : 'open position');
  }

  const info = Chord.get(symbol);
  if (info.tonic) {
    const rootPc = Note.chroma(info.tonic);
    const bassPc = ((pitches[0] % 12) + 12) % 12;
    if (rootPc === bassPc) {
      parts.push('fondamentale');
    } else {
      const idx = info.notes.findIndex(nn => Note.chroma(nn) === bassPc);
      if (idx > 0) parts.push(`${idx}° rivolto`);
    }
  }
  return parts.join(', ');
}

export function analyzeChords(notes: NoteEvent[]): ChordEvent[] {
  const sorted = [...notes].sort((a, b) => a.startSec - b.startSec);
  const groups: NoteEvent[][] = [];
  for (const n of sorted) {
    const g = groups[groups.length - 1];
    if (g && overlapRatio(g, n) > OVERLAP_MIN) g.push(n);
    else groups.push([n]);
  }

  const chords: ChordEvent[] = [];
  for (const g of groups) {
    const pitches = [...new Set(g.map(x => x.midi))].sort((a, b) => a - b);
    if (pitches.length < 3) continue;

    const orderedPcs: string[] = [];
    for (const p of pitches) {
      const name = NOTE_NAMES[((p % 12) + 12) % 12];
      if (!orderedPcs.includes(name)) orderedPcs.push(name);
    }
    if (orderedPcs.length < 3) continue;

    const detected = Chord.detect(orderedPcs);
    if (detected.length === 0) continue;
    const symbol = detected[0];

    const id = crypto.randomUUID();
    for (const x of g) x.chordId = id;
    chords.push({
      id,
      noteIds: g.map(x => x.id),
      symbol,
      voicing: describeVoicing(pitches, symbol),
      startSec: Math.min(...g.map(x => x.startSec)),
    });
  }
  return chords;
}
```

- [ ] **Step 4: Esegui il check**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-chords.ts`
Expected: `OK check-chords — <symbol> · close position, fondamentale | drop 2, ...`

Nota: `Chord.detect` di tonal può restituire "CM7" o "Cmaj7" a seconda della versione — il check accetta entrambi. Se `describeVoicing` riceve un simbolo con slash (es. "CM7/G"), `Chord.get` lo gestisce; se `info.tonic` è null il voicing resta solo spacing — accettabile.

- [ ] **Step 5: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/chordAnalyzer.ts src/features/audio-transcriber/engine/checks/check-chords.ts
git commit -m "feat(audio-transcriber): add chord/voicing analyzer (tonal-based)"
```

---

### Task 10: Orchestratore `transcribe()`

**Files:**
- Create: `src/features/audio-transcriber/engine/transcribe.ts`
- Create: `src/features/audio-transcriber/engine/checks/check-full.ts`

- [ ] **Step 1: Scrivi il check end-to-end (fallirà)**

```ts
// src/features/audio-transcriber/engine/checks/check-full.ts
import { transcribe } from '../transcribe';
import { SR, tone, mix, concat, assert } from './synth';

// Giro C-F-G-C ripetuto 3 volte: 12 accordi da 0.5s (=120 BPM in quarti), 6s totali.
// NB: servono >4s di audio perché estimateTempo rifiuta flux più corti di 4s.
const C = () => mix(tone(261.63, 0.48), tone(329.63, 0.48), tone(392.0, 0.48));
const F = () => mix(tone(349.23, 0.48), tone(440.0, 0.48), tone(523.25, 0.48));
const G = () => mix(tone(392.0, 0.48), tone(493.88, 0.48), tone(587.33, 0.48));
const pad = () => new Float32Array(Math.round(0.02 * SR));
const bar = (c: () => Float32Array) => concat(c(), pad());
const round = () => concat(bar(C), bar(F), bar(G), bar(C));
const signal = concat(round(), round(), round());

const progress: number[] = [];
const result = transcribe(signal, SR, 'keyboard', p => progress.push(p));

assert(result.notes.length >= 12, `expected ≥12 notes, got ${result.notes.length}`);
assert(result.notes.some(n => n.midi === 60), 'missing C4 in notes');
assert(result.bpm !== null, 'bpm is null');
assert(Math.abs((result.bpm as number) - 120) < 6, `bpm ${result.bpm}, expected ~120`);
assert(result.key === 'C major', `key "${result.key}", expected "C major"`);
assert(result.chords.length >= 4, `expected ≥4 chords, got ${result.chords.length}`);
assert(result.notes.every(n => n.startBeat !== undefined), 'notes not quantized');
assert(result.timeSignature === '4/4', `timeSignature ${result.timeSignature}`);
assert(progress.length > 0 && progress[progress.length - 1] === 1, 'progress not reported');

console.log('OK check-full —', result.notes.length, 'notes,', result.chords.length,
  'chords, bpm', result.bpm, ', key', result.key);
```

- [ ] **Step 2: Esegui per verificare che fallisca**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-full.ts`
Expected: errore "Cannot find module '../transcribe'".

- [ ] **Step 3: Implementa transcribe.ts**

```ts
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

const ONSET_SNAP_SEC = 0.08; // attacco nota agganciato all'onset più vicino entro 80ms
const MIN_NOTE_SEC = 0.05;

export function transcribe(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): TranscriptionResult {
  const cfg = INSTRUMENT_CONFIG[instrument];
  const sub = (a: number, b: number) => (p: number) => onProgress?.(a + p * (b - a));

  const notes = cfg.poly
    ? transcribePoly(signal, sampleRate, instrument, sub(0, 0.6))
    : transcribeMono(signal, sampleRate, instrument, sub(0, 0.6));
  onProgress?.(0.6);

  const { flux, frameRate, onsets } = detectOnsets(signal, sampleRate);
  onProgress?.(0.75);
  const tempo = estimateTempo(flux, frameRate);

  // Gli onset dal flux sono più precisi del pitch tracking sugli attacchi.
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

  if (tempo.bpm !== null) quantizeNotes(notes, tempo.bpm, tempo.beatOffsetSec);
  const key = estimateKey(notes);
  const chords = analyzeChords(notes);
  onProgress?.(1);

  return {
    notes,
    chords,
    bpm: tempo.bpm,
    bpmConfidence: tempo.confidence,
    key,
    timeSignature: '4/4',
  };
}
```

- [ ] **Step 4: Esegui il check end-to-end**

Run: `npx tsx src/features/audio-transcriber/engine/checks/check-full.ts`
Expected: `OK check-full — N notes, M chords, bpm ~120, key C major`

- [ ] **Step 5: Esegui TUTTI i check in sequenza**

Run:
```bash
for f in src/features/audio-transcriber/engine/checks/check-*.ts; do npx tsx "$f" || exit 1; done
```
Expected: tutte le righe `OK check-*`, exit 0.

- [ ] **Step 6: Build e commit**

Run: `npm run build` → exit 0.

```bash
git add src/features/audio-transcriber/engine/transcribe.ts src/features/audio-transcriber/engine/checks/check-full.ts
git commit -m "feat(audio-transcriber): add transcription pipeline orchestrator"
```

---

### Task 11: Web Worker + client

**Files:**
- Create: `src/features/audio-transcriber/engine/transcriber.worker.ts`
- Create: `src/features/audio-transcriber/engine/workerClient.ts`

Il worker non è verificabile in Node: la validazione qui è il type-check (`npm run build`); la verifica in browser avviene nel Piano 2 (UI), che è il primo consumer reale.

- [ ] **Step 1: Implementa il worker**

```ts
// src/features/audio-transcriber/engine/transcriber.worker.ts
// Esegue transcribe() fuori dal main thread. Messaggi:
//   in:  { signal: Float32Array, sampleRate: number, instrument: InstrumentKind }
//   out: { type: 'progress', progress } | { type: 'result', result } | { type: 'error', message }

import { transcribe } from './transcribe';
import type { InstrumentKind } from '../types';

interface WorkerRequest {
  signal: Float32Array;
  sampleRate: number;
  instrument: InstrumentKind;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { signal, sampleRate, instrument } = e.data;
  try {
    const result = transcribe(signal, sampleRate, instrument, progress => {
      self.postMessage({ type: 'progress', progress });
    });
    self.postMessage({ type: 'result', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
```

- [ ] **Step 2: Implementa il client**

```ts
// src/features/audio-transcriber/engine/workerClient.ts
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
    worker.postMessage({ signal, sampleRate, instrument }, [signal.buffer]);
  });
}
```

- [ ] **Step 3: Build e lint**

Run: `npm run build` → exit 0.
Run: `npm run lint` → exit 0, zero warning.

Se il build fallisce su `self.postMessage` nel worker: verificare che `tsconfig` includa `"WebWorker"` nelle lib oppure usare `(self as unknown as Worker).postMessage` — preferire la prima se non rompe altro.

- [ ] **Step 4: Commit**

```bash
git add src/features/audio-transcriber/engine/transcriber.worker.ts src/features/audio-transcriber/engine/workerClient.ts
git commit -m "feat(audio-transcriber): add Web Worker wrapper for transcription engine"
```

---

### Task 12: Verifica finale del piano

- [ ] **Step 1: Tutti i check in sequenza**

Run:
```bash
for f in src/features/audio-transcriber/engine/checks/check-*.ts; do npx tsx "$f" || exit 1; done
```
Expected: 8 righe `OK check-*`, exit 0.

- [ ] **Step 2: Build + lint completi**

Run: `npm run build && npm run lint`
Expected: exit 0, zero warning.

- [ ] **Step 3: Commit finale (solo se ci sono fix residui)**

```bash
git status --short
# se ci sono modifiche: git add -A src/features/audio-transcriber && git commit -m "fix(audio-transcriber): engine plan finalization"
```

---

## Fuori scope di questo piano (→ Piano 2 e 3)

- UI: upload, toolbar, piano roll, tabella note, playback, editing, registrazione in `App.tsx` (Piano 2)
- Verifica del worker in browser (Piano 2, primo consumer reale)
- Export MIDI e PDF (Piano 3)
- Suggerimento "segnale sembra polifonico" su strumento mono (Piano 2 — logica UI basata su statistiche già disponibili nei NoteEvent)

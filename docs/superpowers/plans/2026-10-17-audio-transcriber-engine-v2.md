# Audio Transcriber Engine Mono V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Riscrivere il mono transcriber con un pipeline a 3 passi (noise gate → pitch curve → segmentazione) che elimina i falsi positivi causati dall'assenza di energy gating.

**Architecture:** Pass 1 calcola la curva energetica e produce regioni attive con isteresi (ispirato all'ampiezza-blob di Melodyne). Pass 2 esegue pitchy solo dentro le regioni attive. Pass 3 segmenta la pitch curve in note usando mediana mobile + CREPE Notes boundary detection. `postProcess.ts` viene rimosso.

**Tech Stack:** TypeScript, pitchy (PitchDetector), zero nuove dipendenze npm.

---

## File structure

| File | Azione |
|---|---|
| `src/features/audio-transcriber/engine/dsp.ts` | Modifica — aggiunge `rollingMedian` |
| `src/features/audio-transcriber/engine/monoTranscriber.ts` | Riscrittura completa |
| `src/features/audio-transcriber/engine/transcribe.ts` | Modifica — rimuove `cleanMonoNotes` |
| `src/features/audio-transcriber/engine/postProcess.ts` | Eliminazione |

---

## Task 1 — Aggiungere `rollingMedian` a `dsp.ts`

**Files:**
- Modify: `src/features/audio-transcriber/engine/dsp.ts`

- [ ] **Step 1: Aggiungere la funzione in fondo a `dsp.ts`**

Aggiungere dopo l'ultima funzione esistente (`rms`):

```typescript
/** Mantiene un buffer circolare di al massimo `size` valori e ritorna la
 *  mediana corrente. Muta `buf` in-place — il chiamante alloca l'array vuoto
 *  e lo riusa frame per frame. */
export function rollingMedian(buf: number[], newVal: number, size: number): number {
  buf.push(newVal);
  if (buf.length > size) buf.shift();
  return median(buf);
}
```

- [ ] **Step 2: Verifica TypeScript**

```bash
cd /Users/astuser/Documents/Repos/music-tool/.claude/worktrees/audio-transcriber-engine
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/features/audio-transcriber/engine/dsp.ts
git commit -m "feat(dsp): add rollingMedian helper for pitch curve segmentation"
```

---

## Task 2 — Riscrivere `monoTranscriber.ts`

**Files:**
- Modify: `src/features/audio-transcriber/engine/monoTranscriber.ts`

L'interfaccia pubblica rimane identica: `transcribeMono(signal, sampleRate, instrument, onProgress?) → NoteEvent[]`.

- [ ] **Step 1: Sostituire l'intero contenuto del file**

```typescript
// src/features/audio-transcriber/engine/monoTranscriber.ts
// Pipeline a 3 passi ispirata a Melodyne + CREPE Notes:
// 1. Energy curve + noise gate con isteresi → regioni attive
// 2. Pitch curve (pitchy) solo dentro le regioni attive
// 3. Segmentazione della pitch curve → NoteEvent[]

import { PitchDetector } from 'pitchy';
import { freqToMidi, median, mean, rms, rollingMedian } from './dsp';
import { INSTRUMENT_CONFIG, type InstrumentKind, type NoteEvent } from '../types';

// ─── Soglie globali ──────────────────────────────────────────────────────────
const CLARITY_MIN        = 0.82;  // più selettivo del precedente 0.75
const PITCH_JUMP_ST      = 0.7;   // semitoni: sopra = boundary di nota
const UNVOICED_TOLERANCE = 3;     // frame null consecutivi tollerati in nota
const MIN_FRAMES         = 4;     // frame minimi per validare una nota
const MEDIAN_WINDOW      = 8;     // finestra mediana mobile (stabilizza vibrato)
const MIN_REGION_FRAMES  = 4;     // scarta regioni attive troppo brevi
const MIN_NOTE_SEC       = 0.06;  // durata minima nota finale
const MERGE_GAP_SEC      = 0.04;  // fondi note adiacenti con gap ≤ 40ms …
const MERGE_PITCH_ST     = 0.5;   // … se diff di pitch ≤ 0.5 semitoni
const GATE_LOOKAHEAD     = 2;     // frame di anticipo all'apertura del gate

// ─── Soglie noise gate per strumento ────────────────────────────────────────
const GATE: Record<InstrumentKind, { open: number; close: number }> = {
  bass:     { open: 0.07,  close: 0.025 },
  voice:    { open: 0.04,  close: 0.015 },
  winds:    { open: 0.05,  close: 0.020 },
  keyboard: { open: 0.07,  close: 0.025 }, // fallback (path poly)
  guitar:   { open: 0.07,  close: 0.025 }, // fallback (path poly)
};

interface PitchFrame { midi: number; clarity: number; rmsVal: number }

interface OpenSeg {
  midis: number[];
  rmsVals: number[];
  startFrame: number;
  medBuf: number[];
  unvoicedRun: number;
}

export function transcribeMono(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
): NoteEvent[] {
  const cfg  = INSTRUMENT_CONFIG[instrument];
  const gate = GATE[instrument];
  const windowSize = cfg.windowSize;
  const hop        = windowSize >> 2; // windowSize / 4

  const nFrames = Math.floor((signal.length - windowSize) / hop);
  if (nFrames < 1) return [];

  const frame = new Float32Array(windowSize);

  // ── Passo 1: energy curve + noise gate con isteresi ────────────────────────
  const frameRms = new Float32Array(nFrames);
  let peakRms = 0;
  for (let i = 0; i < nFrames; i++) {
    frame.set(signal.subarray(i * hop, i * hop + windowSize));
    frameRms[i] = rms(frame);
    if (frameRms[i] > peakRms) peakRms = frameRms[i];
  }

  const gateOpen  = peakRms * gate.open;
  const gateClose = peakRms * gate.close;
  const activeRegions: Array<{ start: number; end: number }> = [];
  let gateIsOpen = false;
  let regionStart = 0;

  for (let i = 0; i < nFrames; i++) {
    if (!gateIsOpen && frameRms[i] >= gateOpen) {
      gateIsOpen  = true;
      regionStart = Math.max(0, i - GATE_LOOKAHEAD);
    } else if (gateIsOpen && frameRms[i] < gateClose) {
      gateIsOpen = false;
      if (i - regionStart >= MIN_REGION_FRAMES) {
        activeRegions.push({ start: regionStart, end: i });
      }
    }
  }
  if (gateIsOpen && nFrames - regionStart >= MIN_REGION_FRAMES) {
    activeRegions.push({ start: regionStart, end: nFrames });
  }

  onProgress?.(0.2);

  // ── Passo 2: pitch curve dentro le regioni attive ──────────────────────────
  const pitchCurve: Array<PitchFrame | null> = new Array(nFrames).fill(null);
  const detector = PitchDetector.forFloat32Array(windowSize);
  detector.minVolumeDecibels = -20;

  const totalActiveFrames = activeRegions.reduce((s, r) => s + r.end - r.start, 0);
  let processedFrames = 0;

  for (const region of activeRegions) {
    for (let i = region.start; i < region.end; i++) {
      frame.set(signal.subarray(i * hop, i * hop + windowSize));
      const [pitch, clarity] = detector.findPitch(frame, sampleRate);
      const voiced =
        pitch >= cfg.minF0 &&
        pitch <= cfg.maxF0 &&
        clarity >= CLARITY_MIN &&
        frameRms[i] > peakRms * gate.close;
      if (voiced) {
        pitchCurve[i] = { midi: freqToMidi(pitch), clarity, rmsVal: frameRms[i] };
      }
      processedFrames++;
      if (onProgress && processedFrames % 50 === 0) {
        onProgress(0.2 + (processedFrames / (totalActiveFrames || 1)) * 0.7);
      }
    }
  }

  // ── Passo 3: segmentazione pitch curve → note ──────────────────────────────
  const candidates: NoteEvent[] = [];
  let seg: OpenSeg | null = null;

  const closeSeg = (endFrame: number) => {
    if (!seg || seg.midis.length < MIN_FRAMES) { seg = null; return; }
    const med  = median(seg.midis);
    const midi = Math.round(med);
    candidates.push({
      id:          Math.random().toString(36).slice(2),
      midi,
      cents:       Math.max(-50, Math.min(50, (med - midi) * 100)),
      startSec:    (seg.startFrame * hop) / sampleRate,
      durationSec: ((endFrame - seg.startFrame) * hop) / sampleRate,
      velocity:    mean(seg.rmsVals),
    });
    seg = null;
  };

  for (let i = 0; i < nFrames; i++) {
    const pf = pitchCurve[i];

    if (pf === null) {
      if (seg) {
        seg.unvoicedRun++;
        if (seg.unvoicedRun > UNVOICED_TOLERANCE) closeSeg(i - seg.unvoicedRun);
      }
      continue;
    }

    if (seg === null) {
      seg = { midis: [pf.midi], rmsVals: [pf.rmsVal], startFrame: i,
              medBuf: [pf.midi], unvoicedRun: 0 };
    } else {
      seg.unvoicedRun = 0;
      const stableMed = rollingMedian(seg.medBuf, pf.midi, MEDIAN_WINDOW);
      if (Math.abs(pf.midi - stableMed) > PITCH_JUMP_ST) {
        closeSeg(i);
        seg = { midis: [pf.midi], rmsVals: [pf.rmsVal], startFrame: i,
                medBuf: [pf.midi], unvoicedRun: 0 };
      } else {
        seg.midis.push(pf.midi);
        seg.rmsVals.push(pf.rmsVal);
      }
    }
  }
  closeSeg(nFrames);

  // ── Post-filtering ──────────────────────────────────────────────────────────
  let notes = candidates.filter(n => n.durationSec >= MIN_NOTE_SEC);
  if (notes.length === 0) return notes;

  // Normalizza velocity relativa al picco del file (non assoluta)
  let peakNoteRms = 0;
  for (const n of notes) if (n.velocity > peakNoteRms) peakNoteRms = n.velocity;
  if (peakNoteRms > 0) {
    for (const n of notes) n.velocity = Math.min(1, n.velocity / peakNoteRms);
  }

  // Scarta note sotto il 5° percentile energetico (risonanze residue)
  const byVel = [...notes].sort((a, b) => a.velocity - b.velocity);
  const p5    = byVel[Math.floor(byVel.length * 0.05)]?.velocity ?? 0;
  notes = notes.filter(n => n.velocity > p5);

  // Fondi note adiacenti con stesso pitch e gap breve
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < notes.length - 1; i++) {
      const a = notes[i], b = notes[i + 1];
      const gap = b.startSec - (a.startSec + a.durationSec);
      if (gap <= MERGE_GAP_SEC && Math.abs(a.midi - b.midi) <= MERGE_PITCH_ST) {
        notes[i] = {
          ...a,
          durationSec: b.startSec + b.durationSec - a.startSec,
          velocity:    Math.max(a.velocity, b.velocity),
        };
        notes.splice(i + 1, 1);
        merged = true;
      }
    }
  }

  // Monofonia stretta: tronca ogni nota all'attacco della successiva
  for (let i = 0; i < notes.length - 1; i++) {
    const a = notes[i], b = notes[i + 1];
    if (a.startSec + a.durationSec > b.startSec) {
      a.durationSec = Math.max(0.05, b.startSec - a.startSec);
    }
  }

  onProgress?.(1);
  return notes;
}
```

- [ ] **Step 2: Verifica TypeScript**

```bash
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/features/audio-transcriber/engine/monoTranscriber.ts
git commit -m "feat(mono-transcriber): 3-pass engine — noise gate + pitch curve + CREPE Notes segmentation"
```

---

## Task 3 — Aggiornare `transcribe.ts` e rimuovere `postProcess.ts`

**Files:**
- Modify: `src/features/audio-transcriber/engine/transcribe.ts`
- Delete: `src/features/audio-transcriber/engine/postProcess.ts`

- [ ] **Step 1: Rimuovere l'import di `cleanMonoNotes` da `transcribe.ts`**

Rimuovere la riga:
```typescript
import { cleanMonoNotes } from './postProcess';
```

- [ ] **Step 2: Rimuovere la chiamata a `cleanMonoNotes` da `transcribe.ts`**

Rimuovere il blocco:
```typescript
  // Lo snap può incollare frammenti allo stesso onset: pulizia solo mono.
  if (!cfg.poly) notes = cleanMonoNotes(notes);
```

Dopo questa modifica il file `transcribe.ts` deve contenere `let notes = ...` (non `const`, già modificato in precedenza) senza nessun riferimento a `postProcess` o `cleanMonoNotes`.

- [ ] **Step 3: Eliminare `postProcess.ts`**

```bash
git rm src/features/audio-transcriber/engine/postProcess.ts
```

- [ ] **Step 4: Verifica TypeScript**

```bash
npm run build 2>&1 | grep -E "(error|warning|✓)"
```

Atteso: `✓ built in ...` senza errori TypeScript. In particolare non deve esserci `Cannot find module './postProcess'`.

- [ ] **Step 5: Commit**

```bash
git add src/features/audio-transcriber/engine/transcribe.ts
git commit -m "refactor(transcribe): remove postProcess — logic now in monoTranscriber v2"
```

---

## Task 4 — Verifica browser con `bass.mp3`

**Files:** nessuna modifica — solo verifica

- [ ] **Step 1: Avvia il dev server**

```bash
npm run dev
```

Apri `http://localhost:3000` nel browser.

- [ ] **Step 2: Test primario — no note nel silenzio**

1. Vai alla feature "Audio Transcriber".
2. Carica `/Users/astuser/Desktop/bass.mp3`.
3. Seleziona strumento **Basso**.
4. Clicca **Analizza**.
5. Dopo l'analisi: verifica che il piano roll non mostri note nelle sezioni silenziose all'inizio/fine della traccia.
6. Verifica che il numero totale di note sia ragionevole (ordine di grandezza decine/poche centinaia, non migliaia).

- [ ] **Step 3: Test play-along**

1. Clicca **Play**.
2. Ascolta la prima battuta mentre guardi il piano roll.
3. Verifica che le note evidenziate in rosso corrispondano a quelle che senti.

- [ ] **Step 4: Test regressione voce (opzionale)**

Se disponibile un file vocale `.mp3` o `.wav`:

1. Seleziona strumento **Voce**.
2. Analizza.
3. Verifica che il numero di note non sia esploso rispetto a prima.

- [ ] **Step 5: Push**

```bash
git push origin master
```

Atteso: i 3 commit precedenti vengono spinti; Netlify avvia il deploy automatico.

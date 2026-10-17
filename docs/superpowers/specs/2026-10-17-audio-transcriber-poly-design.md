# Audio Transcriber — Polyphonic Engine + Sezione Fiati

**Data:** 2026-10-17
**Stato:** approvato per implementazione

---

## Problema

Il `polyTranscriber.ts` esegue l'algoritmo di Klapuri su ogni frame dell'intero file
audio, senza mai verificare se c'è energia sufficiente. Stesso bug radice risolto nel
mono: pitchy/STFT restituiscono sempre output, anche nel silenzio, generando tracce
fantasma. Inoltre:

- `Math.random()` per gli ID delle note non è collision-safe su file lunghi
- `MAX_POLY` è fisso a 6: non adatto a sezioni di 2–3 ottoni
- Non esiste un tipo strumento per una sezione fiati (più strumenti simultanei)

---

## Ispirazione

Stesso approccio del mono engine v2: energy gate con isteresi → algoritmo armonico
solo nelle regioni attive. Il Klapuri (salience + comb subtraction) resta invariato
nella logica interna; il gate è un wrapper esterno.

---

## Architettura — 3 passi

```
signal (Float32Array)
    │
    ▼
[ Pass 1 ]  Energy curve + noise gate con isteresi
    │          → activeRegions: Array<{ start: number; end: number }>
    ▼
[ Pass 2 ]  Klapuri (STFT + salience + comb) solo nelle regioni attive
    │          → tracce candidate per frame
    ▼
[ Pass 3 ]  Tracking temporale → NoteEvent[]
               (logica invariata rispetto all'attuale)
```

---

## Pass 1 — Energy gate con isteresi

### Logica

Identica al mono engine v2:

1. Calcola `rms(frame)` per ogni frame (hop = windowSize / 4).
2. `peakRms` = 97° percentile di `frameRms` (robusto contro transienti isolati).
3. Noise gate con isteresi:
   - Apre quando `rms ≥ peakRms × open`
   - Chiude quando `rms < peakRms × close`
4. Lookahead di 2 frame all'apertura.
5. Scarta regioni più brevi di `MIN_REGION_FRAMES = 4`.

### Parametri gate per strumento polifonico

| Strumento | `open` | `close` | Note |
|---|---|---|---|
| `keyboard` | 0.07 | 0.025 | Attacchi percussivi, dynamic range alto |
| `guitar` | 0.07 | 0.025 | Pluck secco, decay naturale |
| `winds-section` | 0.05 | 0.020 | Attacchi soffiati, breath noise tra le note |

---

## Pass 2 — Klapuri nelle regioni attive

L'algoritmo interno (STFT → spectral whitening → salience armonica Σ A/k →
estrazione iterativa con harmonic comb subtraction) resta **invariato**.

La sola modifica strutturale: il loop esterno itera su `activeRegions` invece che
su tutti i frame. I frame fuori dalle regioni attive non vengono mai processati.

`MAX_POLY` = `voiceCount` ricevuto come parametro (vedi API changes). Default: `4`.

---

## Pass 3 — Tracking temporale

Invariato rispetto all'implementazione attuale.

**Fix ID:** sostituisce `Math.random().toString(36).slice(2)` con un counter
monotono `_noteIdCounter++` (same pattern del mono transcriber).

---

## Nuovo tipo strumento — `winds-section`

### `types.ts`

```typescript
export type InstrumentKind =
  | 'bass' | 'voice' | 'winds' | 'winds-section' | 'keyboard' | 'guitar';

export const INSTRUMENT_CONFIG: Record<InstrumentKind, InstrumentConfig> = {
  // ... esistenti invariati ...
  winds:         { poly: false, minF0: 100,  maxF0: 2000, windowSize: 2048 },
  'winds-section': { poly: true,  minF0: 65,   maxF0: 2000, windowSize: 4096 },
  // ...
};
```

`windowSize: 4096` — risoluzione frequenziale sufficiente per separare linee
armonicamente dense; compromesso tra risoluzione e latenza (keyboard = 8192,
winds mono = 2048).

`minF0: 65` Hz — copre trombone basso (Bb2 ≈ 58 Hz, sicuro a 65 Hz con margine).

---

## Catena API — `voiceCount`

### `transcribe.ts`

Aggiunge un terzo parametro opzionale:

```typescript
export async function transcribeAudio(
  buffer: ArrayBuffer,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  options?: { voiceCount?: number },
): Promise<NoteEvent[]>
```

Quando `cfg.poly === true`, passa `options?.voiceCount` a `transcribePoly`.
Per `keyboard` e `guitar` (poly senza dropdown UI), il valore è `undefined` →
`transcribePoly` usa il default interno `4`.

### `polyTranscriber.ts`

```typescript
export function transcribePoly(
  signal: Float32Array,
  sampleRate: number,
  instrument: InstrumentKind,
  onProgress?: (p: number) => void,
  voiceCount = 4,
): NoteEvent[]
```

`voiceCount` diventa `MAX_POLY` a runtime.

---

## UI — `AudioTranscriberFeature.tsx`

### Instrument selector

Aggiunge `{ value: 'winds-section', label: 'Sezione Fiati' }` alla lista strumenti
esistente, dopo `winds`.

### Voice count dropdown

Appare condizionalmente solo quando `instrument === 'winds-section'`.
Posizionato inline accanto al selector strumento (stessa riga / stesso row).

```
Strumento: [ Sezione Fiati ▼ ]   Voci: [ 4 ▼ ]
```

Opzioni: 2, 3, 4, 5, 6.
Stato locale: `voiceCount: number`, default `4`.
Reset a `4` quando si cambia strumento a `winds-section` da un altro strumento.

Quando `instrument !== 'winds-section'`, `voiceCount` non viene passato
a `transcribeAudio` (il parametro `options` viene omesso o è `undefined`).

---

## File modificati

| File | Azione |
|---|---|
| `src/features/audio-transcriber/types.ts` | Aggiunge `winds-section` a `InstrumentKind` e `INSTRUMENT_CONFIG` |
| `src/features/audio-transcriber/engine/transcribe.ts` | Aggiunge `options?: { voiceCount?: number }` alla firma; passa a `transcribePoly` |
| `src/features/audio-transcriber/engine/polyTranscriber.ts` | Energy gate (pass 1), `voiceCount` param → `MAX_POLY`, fix ID counter |
| `src/features/audio-transcriber/AudioTranscriberFeature.tsx` | "Sezione Fiati" nel selector, voice count dropdown condizionale |

Nessuna nuova dipendenza npm.

---

## Testing

No test suite automatica. Verifica manuale con `npm run dev`:

1. Seleziona **Sezione Fiati**, imposta voci = 3 o 4.
2. Carica un file con più strumenti a fiato.
3. **Check primario:** nessuna nota nelle sezioni silenziose.
4. **Check voiceCount:** variare da 2 a 6 e verificare che il numero di tracce
   rilevate cambi in modo coerente.
5. **Check regressione:** analizzare con Tastiera (poly esistente) — assicurarsi
   che il comportamento non peggiori.
6. **Check mono regressione:** analizzare con Basso/Voce/Fiati — percorso mono
   deve essere invariato.

---

## Vincoli e non-obiettivi

- Non si modifica il path mono (`monoTranscriber.ts`) — invariato.
- Non si estrae `detectActiveRegions()` in `dsp.ts` — YAGNI per ora.
- Non si cambia la logica Klapuri interna — solo wrapper gate esterno.
- La progressione (`onProgress`) continua a essere chiamata invariata.

# Audio Transcriber — Engine Mono V2

**Data:** 2026-10-17
**Stato:** approvato per implementazione

---

## Problema

Il mono transcriber attuale (`monoTranscriber.ts`) chiama pitchy su ogni frame
dell'intero file audio, senza mai verificare se c'è energia sufficiente in quel
punto. Pitchy restituisce *sempre* una coppia `(frequenza, clarity)` — anche nel
silenzio o nel rumore di fondo — e se `clarity >= 0.75` e la frequenza cade nel
range dello strumento, il frame viene accettato come nota. Il risultato: note
rilevate dove non ce ne sono.

`postProcess.ts` tenta di correggere il danno a valle (artefatti brevi, duplicati),
ma non risolve la causa: il gate sull'energia manca.

**Causa radice:** assenza di gating sull'energia assoluta del segnale.

---

## Ispirazione

| Fonte | Principio adottato |
|---|---|
| **Melodyne "Melodic algorithm"** | Il blob di nota nasce solo in una regione con ampiezza sufficiente. Pitch e amplitude sono curve separate; non esiste nota senza envelope. |
| **CREPE Notes (Dixon, 2023)** | Segmentazione della pitch curve combinando `\|Δpitch\|` (gradiente) × `(1 − confidence)`. Una nota finisce quando il pitch "salta" O quando la confidence crolla. |

---

## Architettura nuova — 3 passi

```
signal (Float32Array)
    │
    ▼
[ Passo 1 ]  Energy curve + noise gate con isteresi
    │          → maschera "regioni attive" (array di intervalli [startFrame, endFrame])
    ▼
[ Passo 2 ]  Pitch curve solo nelle regioni attive
    │          → per ogni frame: { midi: float, clarity: float, rms: float } | null
    ▼
[ Passo 3 ]  Segmentazione pitch curve → note
               → NoteEvent[]
```

Il file `postProcess.ts` viene rimosso: la sua logica (de-duplicazione attacchi,
monofonia stretta) entra in Passo 3 dove c'è già il contesto per decidere meglio.

---

## Passo 1 — Energy curve + noise gate con isteresi

### Logica

1. Calcola `rms(frame)` per ogni frame (windowSize / 4 hop, stesso del passo 2).
2. Trova `peakRms = max(rmsVals)` sull'intero file.
3. Applica un noise gate con **isteresi** (evita flutter al confine della soglia):
   - Gate si **apre** quando `rms > peakRms × GATE_OPEN_RATIO`
   - Gate si **chiude** quando `rms < peakRms × GATE_CLOSE_RATIO`
   - `GATE_OPEN_RATIO = 0.07` (~−23 dB relativo al picco)
   - `GATE_CLOSE_RATIO = 0.025` (~−32 dB relativo al picco)
4. Applica un **lookahead** di 2 frame: il gate si apre 2 frame prima del
   superamento della soglia (cattura l'attacco del pluck che, essendo transitorio,
   ha un centroide energetico leggermente in ritardo rispetto all'onset reale).
5. Produce un array di regioni attive: `Array<{ startFrame: number; endFrame: number }>`.
6. Scarta regioni più brevi di `MIN_REGION_FRAMES = 4` (artefatti di impulsivi brevi).

### Parametri per strumento

| Strumento | `GATE_OPEN_RATIO` | `GATE_CLOSE_RATIO` | Note |
|---|---|---|---|
| bass | 0.07 | 0.025 | Basso ha dynamic range alto, pluck molto evidente |
| voice | 0.04 | 0.015 | Voce ha attacchi più soffici, serve soglia più bassa |
| winds | 0.05 | 0.02 | Fiati: attacchi secchi ma breath noise tra le note |

---

## Passo 2 — Pitch curve nelle regioni attive

### Logica

Gira pitchy **solo** all'interno delle regioni attive prodotte dal passo 1.

```
per ogni regione [startFrame, endFrame]:
  per ogni frame i in [startFrame, endFrame]:
    frame = signal[i*hop .. i*hop+windowSize]
    [pitch, clarity] = detector.findPitch(frame, sampleRate)
    voiced = pitch >= cfg.minF0
           && pitch <= cfg.maxF0
           && clarity >= CLARITY_MIN
           && rms(frame) > peakRms * GATE_CLOSE_RATIO   // doppio check
    pitchCurve[i] = voiced ? { midi: freqToMidi(pitch), clarity, rms } : null
```

**Differenze rispetto all'attuale:**
- `minVolumeDecibels` di pitchy sale da `−50` a `−20` (filtro interno aggiuntivo)
- `CLARITY_MIN` sale da `0.75` a `0.82` (soglia più selettiva)
- I frame `null` (unvoiced) dentro una regione attiva sono possibili: l'attacco
  percussivo del pluck ha pitch ambiguo, ma è dentro la regione — viene gestito
  in Passo 3.

### Output

Array sparso `pitchCurve: Array<PitchFrame | null>` con lunghezza `= nFrames`.
I frame fuori dalle regioni attive sono sempre `null` (mai eseguiti).

---

## Passo 3 — Segmentazione pitch curve → note

### Logica

Percorre `pitchCurve` e gestisce uno stato per nota corrente.

**Inizio nota:**
- Transizione `null → PitchFrame` (ingresso in regione attiva con pitch valido).
- Oppure pitch jump rispetto alla mediana mobile: `|midi_corrente − rollingMedian| > PITCH_JUMP_ST`.

**Fine nota:**
- `UNVOICED_TOLERANCE` frame `null` consecutivi superati (fine regione o clarity drop).
- Pitch jump rilevato (la nota corrente finisce, la nuova inizia).
- Fine regione attiva.

**Mediana mobile:**
Calcolata sugli ultimi `MEDIAN_WINDOW = 8` frame voiced. Stabilizza il confronto
rispetto a vibrato e micro-variazioni (non spezza il vibrato in note separate).

**Parametri di segmentazione:**

| Parametro | Valore | Motivazione |
|---|---|---|
| `PITCH_JUMP_ST` | `0.7` semitoni | Tolera vibrato (±0.4 st) ma intercetta salti melodici reali |
| `UNVOICED_TOLERANCE` | `3` frame | ~70ms a hop=1024/44100 Hz: gestisce brevi oscurazioni (pizzicato decay) |
| `MIN_FRAMES` | `4` | Durata minima nota: ~93ms a hop=1024/44100 — elimina click d'attacco |
| `MEDIAN_WINDOW` | `8` frame | ~185ms a hop=1024/44100: copre un ciclo di vibrato moderato (5 Hz) |

### Post-segmentazione

Dopo aver raccolto tutte le note candidate:

1. **Scarta note troppo brevi:** `durationSec < MIN_NOTE_SEC = 0.06`
2. **Percentile energetico:** calcola `meanRms` per ogni nota; scarta note sotto il
   **5° percentile** dell'intero set (risonanze residue e riflessi di sala).
3. **Merge note adiacenti di uguale pitch:** se due note consecutive differiscono
   di ≤ `0.5` semitoni e il gap tra loro è ≤ `40ms`, fondile in una sola (gestisce
   il "re-bow" di archi o la doppia rilevazione di una nota con un piccolo dip
   nell'inviluppo).
4. **Monofonia stretta:** tronca ogni nota al più tardi all'inizio della successiva
   (`max(MIN_DUR, nextStart − thisStart)`).
5. **Cents:** calcolato come `(medianMidi − round(medianMidi)) × 100`.
6. **Velocity:** `min(1, meanRms / peakNoteRms)` — relativa al picco del file,
   non assoluta. Evita che la prima nota di un file silenzioso abbia velocity = 1.

---

## File modificati

| File | Azione |
|---|---|
| `engine/monoTranscriber.ts` | **Riscrittura completa** secondo questo spec |
| `engine/dsp.ts` | Aggiunta di `rollingMedian(buf: number[], newVal: number, size: number): number` — mantiene un buffer circolare interno; ritorna la mediana degli ultimi `size` valori |
| `engine/postProcess.ts` | **Rimosso** — logica integrata nel nuovo passo 3 |
| `engine/transcribe.ts` | Rimuovi import `cleanMonoNotes` e la chiamata dopo l'onset snap |

Il resto della pipeline (`onsetDetector`, `quantizer`, `tempoEstimator`,
`keyEstimator`, `chordAnalyzer`) resta invariato. L'interfaccia pubblica di
`monoTranscriber.ts` rimane identica: `transcribeMono(signal, sampleRate, instrument, onProgress?) → NoteEvent[]`.

---

## Testing

No test suite automatica. Verifica manuale con `npm run dev` sul file
`/Users/astuser/Desktop/bass.mp3`:

1. Seleziona "Basso", clicca Analizza.
2. **Check primario:** nessuna nota nella prima e ultima sezione silenziosa della
   traccia (silenzio all'inizio/fine registrazione).
3. **Check secondario:** le note rilevate corrispondono a quelle suonate (verifica
   a orecchio durante il play-along con il piano roll).
4. **Check regressione:** analizza anche con "Voce" su un file vocale — assicurati
   che il comportamento non peggiori rispetto all'attuale.

---

## Vincoli e non-obiettivi

- Non si introduce nessuna dipendenza npm nuova.
- Non si modifica il path polifonico (`polyTranscriber.ts`).
- Non si cambia l'UI o il piano roll — solo l'engine.
- La progressione (`onProgress`) continua a essere chiamata invariata.

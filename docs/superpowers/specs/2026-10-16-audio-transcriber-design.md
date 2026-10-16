# Audio Transcriber — Design Spec

**Data:** 2026-10-16
**Stato:** approvato dal product owner (brainstorming interattivo con mockup browser)

## Obiettivo

Nuova feature di punta per tonic: l'utente carica una traccia audio di uno strumento
(basso, voce, fiati, tastiera, chitarra) e il tool:

1. Rileva **tutte le note suonate** — sequenze melodiche per strumenti monofonici,
   note individuali degli accordi con voicing per strumenti polifonici — e le
   visualizza in una griglia piano-roll allineata ritmicamente alle battute.
2. Esporta la trascrizione come **PDF lead sheet** (stile jazz: rigo + sigle, come
   i lead sheet scritti a mano) e come **file MIDI**.

Riferimento visivo per il PDF: lead sheet jazz manoscritto (rigo singolo, sigle
sopra il rigo, slash notation per i comping, sezioni Intro/Verse/Hook/Bridge).

## Decisioni di prodotto (dal brainstorming)

- **Layout:** split-screen Melodyne-style dopo l'analisi — piano roll a sinistra
  (3/5), tabella note a destra (2/5). Export come step separato nel footer, non
  partitura renderizzata nell'app.
- **Strumenti supportati:** basso, voce, fiati, tastiera, chitarra — selezione
  manuale obbligatoria (niente auto-detect). Priorità implementativa: tastiera e
  basso prima.
- **Formati export:** PDF e MIDI (MusicXML in futuro).
- **Funzionalità pro incluse:** playback sincronizzato con loop A–B, intonazione
  in cents per nota (Melodyne-style), rilevamento BPM + tonalità con griglia a
  battute e quantizzazione ritmica, analisi voicing avanzata (rivolti, drop 2/3,
  close/open), correzione manuale delle note con undo/redo, trasposizione per
  strumenti traspositori nell'export PDF.
- **Escluse (v1):** risintesi A/B, indicatore di confidenza per nota, auto-detect
  strumento, MusicXML.

## Decisione architetturale chiave

**Approccio A — Web Audio API pura, tutto client-side, zero nuove dipendenze
npm per l'analisi.** Scelto dall'utente rispetto a: (B) Basic Pitch WASM (ML in
browser, ~15MB modello) e (C) backend Python. Motivazioni: coerenza con il
codebase (client-heavy, `pitchy` già in uso), nessun peso sul bundle, privacy
(l'audio non lascia il browser), funziona offline.

**Fallback pianificato:** se la salience function custom non desse risultati
accettabili su piano reale, innestare `essentia.js` (WASM) solo nel percorso
polifonico, dietro la stessa interfaccia del Worker — l'architettura non cambia.

## Architettura

### Posizione e struttura

```
src/features/audio-transcriber/
├── AudioTranscriberFeature.tsx    # entry, orchestrazione UI e stato
├── engine/
│   ├── monoTranscriber.ts         # basso/voce/fiati — pitchy frame-by-frame
│   ├── polyTranscriber.ts         # tastiera/chitarra — salience iterativa
│   ├── onsetDetector.ts           # spectral flux
│   ├── tempoEstimator.ts          # BPM da autocorrelazione degli onset
│   ├── keyEstimator.ts            # Krumhansl-Schmuckler
│   ├── chordAnalyzer.ts           # gruppi di note → simbolo + voicing (tonal)
│   └── quantizer.ts               # snap alla griglia ritmica
├── export/
│   ├── midiExport.ts              # SMF type-0 writer binario, zero deps
│   └── pdfExport.ts               # lead sheet su canvas → PDF
├── components/
│   ├── PianoRoll.tsx              # canvas griglia + playhead + editing
│   ├── NoteTable.tsx              # tabella pannello destro
│   ├── TransportBar.tsx           # play/pausa/loop A–B
│   └── ExportBar.tsx              # footer export + progress analisi
└── types.ts                       # NoteEvent, ChordEvent, TranscriptionResult
```

Registrazione in `App.tsx`: `TabDef` nel gruppo con Chord Detection / Nail the
Pitch, più render branch in `<main>`.

### Modello dati centrale

```ts
interface NoteEvent {
  id: string;
  midi: number;          // pitch MIDI intero
  cents: number;         // deviazione media dal temperamento, -50..+50
  startSec: number;      // tempo raw rilevato
  durationSec: number;
  velocity: number;      // 0..1 stimata dall'energia
  // dopo quantizzazione:
  startBeat?: number;    // posizione in beat dal downbeat
  durationBeats?: number;
  chordId?: string;      // gruppo accordo di appartenenza
}

interface ChordEvent {
  id: string;
  noteIds: string[];
  symbol: string;        // "Cmaj7"
  voicing: string;       // "drop 2, 1° rivolto" / "close position" / …
  startSec: number;
}

interface TranscriptionResult {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;    // null se confidence sotto soglia
  bpmConfidence: number;
  key: string | null;    // "Eb major", "B minor"
  timeSignature: string; // default "4/4", editabile
}
```

Tutta la UI (piano roll, tabella, export) legge da questo unico stato. L'editing
manuale lo modifica e tutto si aggiorna; gli accordi vengono ricalcolati solo per
i gruppi toccati.

### Macchina a stati UI

`idle` → `loaded` (file + strumento) → `analyzing` (worker, progress) → `ready`.
"Rianalizza" torna ad `analyzing` mantenendo il file. Nuovo upload resetta con
conferma se esistono modifiche manuali non esportate.

## Pipeline di analisi

Decodifica: `AudioContext.decodeAudioData` → downmix mono → `Float32Array`
44.1kHz. L'intera analisi gira in un **Web Worker** con progress callback.

### Percorso MONO (basso, voce, fiati)

1. Finestratura: frame 2048 campioni (4096 per basso — risoluzione low-end),
   hop 25%.
2. Pitch per frame con `pitchy` (McLeod/MPM) — riuso del `PitchTracker` di Nail
   the Pitch con range per strumento: basso 30–400Hz, voce 65–1200Hz, fiati
   100–2000Hz.
3. Segmentazione: frame consecutivi con pitch stabile (±50 cents) = una nota;
   salto di semitono o silenzio chiude la nota. Cents medi calcolati per nota.

### Percorso POLI (tastiera, chitarra) — salience iterativa stile Klapuri

1. STFT con finestre 8192 campioni, hop 1024.
2. Whitening spettrale per normalizzare il timbro.
3. Salience function: per ogni candidato f0 (27.5Hz–2kHz, griglia semitonale),
   somma dell'energia alle posizioni armoniche n·f0 con peso 1/n.
4. Stima iterativa: f0 a salience massima → sottrazione del pettine armonico
   dallo spettro → ripeti fino a soglia (max 6 note simultanee).
5. Tracking temporale con isteresi: una nota esiste se presente in ≥3 frame
   consecutivi, sopravvive a 2 frame di assenza (elimina falsi positivi da
   riverbero e decay).

Motivazione (dalla ricerca): FFT naive con peak-picking perde ~41% degli onset
di piano (dato PitchPlease); il metodo salience+sottrazione è la stessa famiglia
di tecniche di Melodyne DNA (separazione fondamentali/armonici con rating dei
parziali); harmonic NMF documenta F-measure 87% su piano come riferimento della
classe non-ML.

### Pipeline comune (post-trascrizione)

1. **Onset detection** via spectral flux (somma differenze positive tra frame
   STFT) — raffina gli attacchi, più precisi dal flux che dal pitch tracking.
2. **BPM**: autocorrelazione della curva di flux con peso log-gaussiano centrato
   su 120 BPM (risolve l'ambiguità di ottava del tempo). Produce anche una
   confidence; sotto soglia → `bpm: null`.
3. **Tonalità**: Krumhansl-Schmuckler — istogramma pitch class pesato per
   durata, correlazione con i 24 profili maggiore/minore.
4. **Quantizzazione**: con BPM e downbeat, snap di ogni nota alla suddivisione
   più vicina fino alla sedicesima, terzine incluse → valori ritmici per il PDF.
5. **Analisi accordi**: note sovrapposte per >50% della durata → gruppo →
   `tonal` risolve il simbolo → ordine delle note dal basso determina il voicing
   (rivolto, drop 2/3, close/open, raddoppi).

## UI e interazione

### Piano roll (canvas, pannello sinistro)

- Y = pitch, range auto dalle note ±3 semitoni; righe scure/chiare per tasti
  neri/bianchi.
- X = tempo: griglia a battute/movimenti se BPM affidabile (linee marcate sul
  battere), fallback a secondi.
- Note = rettangoli; colore per gruppo-accordo (palette ciclica sui viola del
  tema). Micro-barra cents sul bordo inferiore di ogni nota.
- Zoom orizzontale con rotella, scroll con drag, pinch su trackpad.
- Ridisegno via requestAnimationFrame solo quando serve.

### Playback

- `AudioBufferSourceNode` per l'originale; playhead sincronizzato a
  `audioContext.currentTime`.
- Transport: play/pausa (spacebar), stop, tempo corrente/totale.
- Click su nota → seek. Drag su timeline → scrub. Drag sulla riga temporale →
  loop A–B.
- `AudioContext` sospeso da autoplay policy → resume al primo gesto.

### Editing manuale (toggle "Modifica")

- Click → selezione (sincronizzata con la tabella).
- Drag verticale → pitch a semitoni; orizzontale → tempo (snap, libero con Alt);
  bordo destro → durata.
- Canc → elimina; doppio click su vuoto → crea nota.
- Ricalcolo accordi solo per i gruppi coinvolti.
- Undo/redo Cmd+Z / Cmd+Shift+Z, history max 100 operazioni.

### Tabella note (pannello destro)

- Colonne: Nota | Cents | Accordo+voicing | Posizione (battuta.movimento) |
  Durata (valore ritmico) | Velocity.
- Selezione bidirezionale con il piano roll.
- Badge voicing per gruppo (es. "Cmaj7 · drop 2, 1° rivolto").
- Mobile: tabella collassa sotto il roll (split verticale).

### Toolbar

- Pillole strumento (voce/tastiera/basso/fiati/chitarra), file chip, BPM
  editabile a mano (riquantizza), Rianalizza, Carica file.

### Export (footer)

- **MIDI**: SMF type-0, tempo track con BPM, velocity, checkbox "quantizza"
  (timing quantizzato vs raw). Download diretto.
- **PDF**: dialog con titolo, trasposizione (concert/Bb/Eb — riuso logica
  Transposing Instruments), modalità "melodia + sigle" (mono) o "sigle + slash
  notation" (poli). Rendering pentagramma su canvas (chiave, armatura dalla
  tonalità, stanghette, teste di nota, sigle) → PDF.
- Scelta canvas-a-mano vs VexFlow rinviata alla fase di piano con benchmark
  concreto; entrambe leggono `TranscriptionResult`, architettura invariata.
- Nomi file dal nome traccia: `<nome>_transcription.mid`, `<nome>_leadsheet.pdf`.

## Gestione errori e casi limite

| Caso | Comportamento |
|---|---|
| Formato non decodificabile | Errore chiaro con lista formati supportati (WAV, MP3, OGG, M4A/AAC, FLAC) |
| File >50MB o >10 min | Avviso lentezza, opzione di procedere |
| Stereo | Downmix mono automatico |
| Silenzio in testa/coda | Trim per la griglia, offset conservato per playback |
| Nessuna nota rilevata | Stato vuoto esplicativo (materiale non intonato / strumento sbagliato) |
| Mono selezionato su segnale poli | Molti frame con pitch instabile → suggerimento non bloccante "prova Tastiera" |
| BPM inaffidabile (rubato) | Griglia in secondi, PDF non quantizzato con avviso, BPM inseribile a mano |
| Worker error / OOM | Catch, errore recuperabile, file resta caricato |
| Modifiche non esportate + reset | Dialog di conferma |
| Export con zero note | Bottone disabilitato con tooltip |

Nessun permesso microfono richiesto (solo file upload). API usate: Web Audio,
Web Worker, Canvas — tutte standard.

## Validazione

Nessuna test suite nel progetto. Validazione come da CLAUDE.md: `npm run build`
(errori TypeScript) + `npm run lint` + test manuale in browser con `npm run dev`.
Per la pipeline di analisi: file audio di riferimento noti (scala suonata, giro
di accordi registrato) con risultato atteso verificabile a orecchio e contro il
MIDI esportato.

## Fonti della ricerca

- Melodyne DNA / audio algorithms — helpcenter.celemony.com, soundonsound.com
  (intervista Neubäcker)
- PitchPlease (limiti FFT naive su piano) — github.com/markusstrasser/pitchplease
- Harmonic/inharmonic NMF per trascrizione piano (F-measure 87%) — ResearchGate
- Essentia.js, ISMIR 2020 (fallback WASM) — archives.ismir.net
- Tempo and beat estimation of musical signals, ISMIR 2004 — archives.ismir.net
- Modified Harmonic Product Spectrum per multi-pitch — ResearchGate

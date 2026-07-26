# Chord Progression 2.0 — Transform Engine, Cicli di Modulazione, Playback

**Data:** 2026-07-26
**Feature:** `src/features/chord-progression/`
**Stato:** Design approvato (in attesa di review scritta)

## Obiettivo

Trasformare il Chord Progression Generator da libreria statica di template (214 template
fissi, output deterministico) in un vero strumento compositivo: variegato, ricco, moderno,
mai banale. Deve funzionare come "coltellino svizzero" per scrivere brani per la band
dell'utente (riferimenti: Snarky Puppy, Ghost-Note, Vulfpeck, Yussef Dayes).

Fonti teoriche: lezioni fornite dall'utente su secondary dominants, modal interchange,
ii–V (maggiore/minore/backdoor/tritone), tritone substitutions, diminished chords e
alternative al V, gospel reharmonization ("melody on top", landing chords, turnaround
7–3–6), drill di modulazione infinita (catene di dominanti, salita aumentata, French 6th,
minor 1=4, Beethoven 1=2, Michelle, Satie, Crimson, 2–5–1 per terze ascendenti).

## Decisioni prese col committente

1. **Architettura:** motore a trasformazioni sopra i template esistenti (non solo nuovi template).
2. **Accordi di passaggio:** visivamente distinti (bordo tratteggiato + badge tecnica) con
   toggle Base/Arricchita per confrontare scheletro e variante.
3. **Controllo:** slider "Spice" 0–3 + i filtri tecnica esistenti come whitelist delle
   trasformazioni ammesse.
4. **Drill di modulazione:** categoria dedicata "Cicli di Modulazione" con generazione algoritmica.
5. **Playback:** sì, riusando/estraendo il player Web Audio di ear-training.

## Architettura

### Componenti

```
src/features/chord-progression/
├── ChordProgressionFeature.tsx        (orchestratore UI, + sezione Cicli di Modulazione)
├── components/
│   ├── ProgressionSettings.tsx        (+ slider Spice)
│   ├── ProgressionDisplay.tsx         (+ toggle Base/Arricchita, badge inserted, ▶, ↻)
│   └── ModulationCycles.tsx                (NUOVO — sezione drill di modulazione)
├── services/
│   ├── progressionGenerator.ts        (orchestratore: filtra template → applica engine)
│   ├── templates.ts                   (NUOVO — i 214 template attuali + ~20 nuovi, estratti)
│   ├── transformEngine.ts             (NUOVO — motore a trasformazioni)
│   └── modulationCycles.ts                    (NUOVO — generatori algoritmici dei cicli)
├── hooks/useChordProgression.ts       (+ spice, seed, regenerateVariant)
└── types/progression.types.ts         (tipi estesi)

src/shared/utils/chordAudio.ts         (NUOVO — player accordi estratto da ear-training)
```

`progressionGenerator.ts` (oggi 3559 righe) viene spezzato: i template vanno in
`templates.ts`, la logica di risoluzione resta nel generatore, che diventa l'orchestratore
della pipeline: `template → resolve → transformEngine.apply(spice, techniques, seed)`.

### Il motore a trasformazioni (`transformEngine.ts`)

Ogni trasformazione è una funzione pura:

```ts
interface Transform {
  id: Technique;              // riusa i Technique esistenti come whitelist
  kind: 'insertion' | 'substitution' | 'decoration';
  label: string;              // es. "SubV/ii"
  explain: string;            // spiegazione mostrata nel tooltip
  findTargets(chords: ResolvedChord[], ctx: KeyContext): number[];
  apply(chords: ResolvedChord[], targetIdx: number, ctx: KeyContext, rng: Rng): ResolvedChord[];
}
```

RNG **seedato** (mulberry32 o simile): stesso seed → stessa variante. "Rigenera" cambia
seed. Il seed è salvato in `GeneratedProgression` così ogni card è riproducibile.

**Trasformazioni di inserzione** (creano accordi marcati `inserted: true`):

| Trasformazione | Regola | Fonte lezione |
|---|---|---|
| ii–V maggiore | IIm7–V7 del target davanti a target maggiore | strand 4 |
| ii–V minore | IIm7♭5–V7alt davanti a target minore | strand 4 |
| Dominante secondaria | V7/x davanti a qualsiasi accordo non-tonica | strand 2 |
| SubV del secondario | dominante 7 un semitono sopra il target | strand 5 |
| Dim7 di passaggio | dim7 un semitono sotto il target (leading-tone), oppure ♯I°7 tra I e ii | strand 6 |
| Backdoor ii–V | IVm7–♭VII7 davanti al I | strand 4/7 |
| Approach cromatico | stesso tipo di accordo un semitono sopra o sotto il target | gospel lesson |

**Trasformazioni di sostituzione:**

| Trasformazione | Regola | Fonte lezione |
|---|---|---|
| Tritone sub | V7 → ♭II7 | strand 5 |
| Alternative al V dal diminuito | V7 → ♭VII7, IIm7♭5, IVm6 o ♭VIm6 | strand 7 |
| Modal interchange swap | IV→IVm6/IVm7, I→Im, vi→♭VImaj7, II→IIm7♭5, ♭IImaj7, ♭IIImaj7, ♭VII7 | strand 3 |
| Colore/estensioni | maj7→maj9/6-9, m7→m9/m11, V7→13, 7→7sus4→7 | pratica moderna |

**Decorazioni:**

- Float chord: V → IVmaj7/V (V13sus, Jeff Schneider — tecnica `float_chord` esistente)
- Sospensione sus che risolve sul chord tone

**Vincoli anti-pasticcio:**

1. Inserzioni solo davanti a target funzionali (accordi con funzione Tonic/Subdominant/
   Dominant, non davanti ad altri accordi inseriti).
2. Mai trasformare due posizioni consecutive: dopo ogni trasformazione, la posizione
   adiacente è bloccata (respiro musicale).
3. La cadenza finale del template conserva sempre la risoluzione: l'ultimo movimento
   V→I (o equivalente modale) non viene sostituito, al massimo colorato.
4. Ogni inserzione deve creare moto di semitono o di quinta verso il target (voice-leading
   check sul basso).
5. Le sostituzioni rispettano la whitelist: se l'utente ha selezionato tecniche, solo
   quelle trasformazioni sono ammesse; senza selezione, tutte.

**Slider Spice 0–3:**

- 0 = solo scheletro (comportamento attuale)
- 1 = 1 trasformazione
- 2 = 2–3 trasformazioni
- 3 = massimo: fino a ⌈n/2⌉ punti trasformati (n = lunghezza scheletro), rispettando i vincoli

### Tipi estesi (`progression.types.ts`)

```ts
interface ResolvedChord {
  // ...campi esistenti...
  inserted?: boolean;        // accordo aggiunto dal motore (di passaggio)
  transformOf?: string;      // simbolo originale se sostituito (es. "G7" per un Db7 subV)
  transformLabel?: string;   // es. "SubV", "Passing dim"
  transformExplain?: string; // spiegazione della mossa per il tooltip
}

interface GeneratedProgression {
  // ...campi esistenti...
  baseChords: ResolvedChord[];        // scheletro risolto
  chords: ResolvedChord[];            // versione arricchita (== baseChords se spice 0)
  seed: number;
  appliedTransforms: { label: string; explain: string }[];
}
```

### Cicli di Modulazione (`modulationCycles.ts` + `ModulationCycles.tsx`)

Generatori **algoritmici** (non template fissi): ogni ciclo è una funzione
`(startKey, cycles, options) => ModulationCycleResult` dove `ModulationCycleResult` contiene gruppi di
accordi etichettati con la tonalità attraversata.

```ts
interface CycleStep { key: string; chords: ResolvedChord[]; label: string } // es. "ii–V–I in Bb"
interface ModulationCycleResult { id: string; name: string; steps: CycleStep[]; description: string }
```

Cicli inclusi (tutti dalle lezioni sui modulating drills):

1. **Catena di dominanti** — C7→F7→B♭7… ciclo di quinte discendente
2. **Salita aumentata** — I → I aug → I6 → I7 → risolve una quarta sopra, ripete
3. **French 6th descent** — I → Imaj7 → I7 → I7♭5 → risolve un semitono sotto
4. **Minor 1=4** — i(=iv) → V7 → nuovo i, ciclo
5. **Beethoven 1=2** — 2–5–1, l'1 diventa il nuovo 2 (discesa per toni; nota: copre 6
   tonalità, l'utente può ripartire un semitono sopra per le altre 6)
6. **Michelle descent** — im → V+/… discesa cromatica del basso → V7sus → nuovo im sulla terza
7. **Satie thirds** — 5–1, poi modula una terza sopra (magg./min. alternate)
8. **Crimson** — I → ♭VII (con sospensioni) → V/ii → ii = nuovo I (salita per toni)
9. **2–5–1 per terze (Maxence)** — 2–5–1 maggiore e minore alternati, modulando sulla
   terza del precedente

UI: blocco dedicato sotto i risultati (stessa pagina, pattern `<details>` già usato dal
resolver di numerali) con selettore del ciclo, tonalità di
partenza, numero di cicli (default: giro completo), tonalità corrente mostrata sopra ogni
gruppo, playback incluso.

### Nuovi template (~20 in `templates.ts`)

Dalle lezioni, come template normali in tonalità singola:

- Gospel turnaround 7–3–6 (VIIm7♭5/V7alt → III7 → vi)
- Gospel landing chords: stessa cadenza che parte dal 3, dal 6, dal 2 ("melody on top")
- Backdoor ii–V come cadenza completa (IVm7–♭VII7–Imaj7)
- Minor ii–V con dominante alterata (IIm7♭5–V7alt–im)
- Cadenze col V sostituito dal diminuito: ♭VII7, IVm6, ♭VIm6, IIm7♭5 → I
- ii–V "alternativi" verso il IV (dalla strand 4)
- Gospel 2–5–1 con approach cromatici

### Playback (`shared/utils/chordAudio.ts`)

Estrazione del player Web Audio esistente in `src/features/ear-training/utils/audio-player.ts`
in un modulo condiviso. API minima:

```ts
playChordSequence(chords: { notes: string[] }[], bpm: number, onChordStart?: (i) => void): { stop(): void }
```

- Un accordo per battuta (4/4), BPM regolabile (default 90)
- `onChordStart` evidenzia la card dell'accordo corrente
- Bottone ▶/⏹ per card; un solo playback attivo alla volta
- ear-training viene aggiornato per importare dal modulo condiviso (nessun cambio di comportamento)

### UI riepilogo

- **ProgressionSettings:** slider Spice 🌶 0–3 con etichette (Scheletro / Leggero / Medio / Massimo)
- **Card progressione:**
  - toggle "Base / Arricchita" (default: Arricchita se spice > 0)
  - accordi inseriti: bordo tratteggiato + badge tecnica; sostituiti: badge + tooltip con
    `transformOf` ("era G7") e spiegazione
  - lista `appliedTransforms` in calce alla card ("Mosse applicate: SubV/ii, passing dim…")
  - ▶ playback, ↻ varia (nuovo seed per quella card)
- **Cicli di Modulazione:** sezione dedicata come sopra

## Error handling

- Chiavi non riconosciute: comportamento attuale (return []) invariato.
- Il motore non deve mai produrre accordi irrisolvibili: se `findTargets` non trova
  posizioni valide, la trasformazione è saltata (la card mostra meno mosse, mai errori).
- Playback: se AudioContext non disponibile, il bottone ▶ è disabilitato con tooltip.

## Testing / validazione

Il repo non ha test suite (da CLAUDE.md): validazione = `npm run build` (errori TS),
`npm run lint` (zero warning), prova in browser con `npm run dev`.
In aggiunta: il motore è puro e seedato → smoke-script node (`tsx`) usa
`generateProgressions` con seed fissi e verifica invarianti (lunghezze, vincoli 1–5,
cadenza finale intatta). Lo script è usa-e-getta (directory temporanea), non committato.

## Fuori scope

- Export MIDI / iReal Pro (possibile evoluzione futura)
- Voicing avanzati nel playback (drop 2, spread) — playback con voicing semplici
- Controllo per-accordo delle trasformazioni (menu contestuale) — scartato in favore
  dello slider
- Melody-on-top / armonizzazione melodica della lezione gospel (richiede input melodia)

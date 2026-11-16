# Part Transposer — cambio tonalità e parti per strumento

**Data:** 2026-11-16
**Stato:** approvato per implementazione
**Branch:** `feat/part-transposer`
**Piano:** `docs/superpowers/plans/2026-11-16-part-transposer.md`

---

## Problema

Il cantante chiede il brano in un'altra tonalità (es. da Mib a Sol) e serve trasporre
tutta la parte — armonia **e** melodia/linee — e poi scriverla per ogni strumento della
band. Oggi `transpose` (Transposing Instruments) traspone solo una nota alla volta ed è
didattico; `score` (Score → iReal Pro) legge le foto ma estrae solo accordi.

## Obiettivo

Nuovo tool **Part Transposer** (`part-transposer`): una parte entra (testo, MusicXML o
foto), si sceglie la nuova tonalità concert e gli strumenti, escono le parti scritte per
ciascuno, visibili a schermo ed esportabili in MusicXML.

Strumenti v1: tastiera, basso, chitarra, sax tenore, sax contralto, sax soprano, tromba.

## Non-obiettivi (v1)

- Stampa/PDF dall'app (si stampa da MuseScore dopo l'export).
- Zip di file separati per strumento (si esporta un file unico multi-parte).
- Doppio pentagramma da testo o foto (solo da MusicXML).
- Trasposizione di più parti sorgente insieme (si sceglie una parte del file).
- Spostamenti d'ottava automatici per il range.
- OMR dedicato (Audiveris, homr): Java/Python, non eseguibili nelle Netlify Functions.

---

## Posizione e piano

- Tab `part-transposer`, label "Part Transposer", gruppo *Composition → Arrange*.
- **Pro** (`PRO_TABS`). La foto consuma la quota AI `score` esistente
  (Free 0, Pro 10/giorno): nessun nuovo bucket né variabile d'ambiente.
- `transpose` resta com'è; la sua tabella strumenti si sposta nel modulo condiviso.

## Flusso utente (una pagina, 4 passi)

1. **Input** — tre schede:
   - *Scrivi*: editor di testo (sintassi sotto) con validazione e anteprima live.
   - *MusicXML*: upload `.musicxml` / `.xml` / `.mxl`. Se il file ha più parti, menu a
     tendina per sceglierne una.
   - *Foto*: upload JPEG/PNG/WebP (stesse regole di Score). Il risultato dell'AI finisce
     nell'editor *Scrivi* per revisione prima della trasposizione.
2. **Origine** — tonalità originale (letta da `<key>` del MusicXML, altrimenti dall'header
   `key:` del testo) e **"scritto per"** (default Concert; precompilato da `<transpose>`
   del MusicXML).
3. **Destinazione** — nuova tonalità concert, direzione **su / giù** (default: la più
   vicina, ≤ tritono; a parità, giù), checkbox strumenti.
4. **Risultato** — selettore strumento + anteprima OSMD; export **MusicXML della parte**
   e **"Tutte le parti"** = un file MusicXML con una `<score-part>` per strumento
   (in MuseScore: *Parti → Genera*).

---

## Regole di trasposizione

Pipeline: `sorgente scritta` → (inverso dello strumento sorgente) → `concert originale`
→ (intervallo tonalità) → `concert nuovo` → (strumento destinazione) → `scritto`.

**Per intervallo, non per semitoni**: si usa `tonal` (`Note.transpose`, `Interval`) così
la grafia segue la tonalità (Mib → Sol = 3M: Ab → C, Db → F, non enarmonici).

### Cambio tonalità
Intervallo = da tonica originale a tonica nuova, nella direzione scelta (es. Mib → Sol:
su 3M, giù 6m).

### Tabella strumenti (`src/shared/utils/transposingInstruments.ts`)

| Strumento | concert → scritto | Chiave | `<transpose>` (diatonic/chromatic/octave-change) |
|---|---|---|---|
| Tastiera | 1P | chiavi del sorgente | — |
| Basso | +8P | F4 | 0 / 0 / -1 |
| Chitarra | +8P | G2 (chiave di Sol come nei real book; l'ottava è in `<transpose>`) | 0 / 0 / -1 |
| Sax soprano | +2M | G2 | -1 / -2 |
| Tromba in Sib | +2M | G2 | -1 / -2 |
| Sax contralto | +6M | G2 | -5 / -9 |
| Sax tenore | +9M | G2 | -1 / -2 / -1 |

Ogni voce ha anche il **range pratico scritto** (per gli avvisi). La tabella include le
voci già usate da `transpose`, che la importa al posto dell'array locale.

### Cosa viene trasformato nel MusicXML
- `<pitch>` (`step`, `alter`, `octave`) di ogni nota; `<unpitched>` e pause invariati.
- `<harmony>`: `root-step/root-alter` e `bass-step/bass-alter`; `kind` invariato.
- `<key>`: `fifths` ricalcolato; `mode` conservato (minore resta minore).
- `<clef>` e `<transpose>` impostati per lo strumento destinazione (rimossi per Concert).
- `<accidental>` esplicite: ricalcolate sulla nuova altezza (o rimosse se non più
  necessarie rispetto all'armatura e alle alterazioni precedenti nella battuta).
- `<part-name>` = nome strumento; `<score-instrument>`, `<midi-instrument>`,
  `<midi-device>` e i riferimenti `<instrument>` nelle note vengono rimossi (indicherebbero
  ancora lo strumento sorgente a MuseScore). Tutto il resto (dinamiche, legature, testo,
  voci, layout) resta intatto.
- Note con testa `slash` (barre ritmiche): non trasposte; per strumenti con chiave propria
  vengono ricentrate sulla linea centrale (B4 in Sol, D3 in Fa).

### Armature oltre 6 alterazioni
Se la tonalità **scritta** risultante ha `|fifths| > 6`, si sostituisce l'intervallo con
il suo enarmonico (stesso numero di semitoni, grado diatonico adiacente) in modo che
`fifths` torni in [-6, 6] (es. concert Si → sax tenore: Do# 7# → Reb 5b). A ±6 si tiene
il risultato.

### Avvisi di range
Le note fuori dal range pratico scritto dello strumento sono colorate in ambra
nell'anteprima (attributo `color` sulla nota, solo nella variante di visualizzazione) con
un riepilogo: "3 note sopra il range del sax tenore — prova a trasporre giù".

---

## Sintassi di testo (input manuale e output della foto)

```
key: Eb
time: 4/4
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [F7] [Bb7] |
```

- Header: `key:` (tonica, `m` per minore, es. `Cm`), `time:` (default 4/4),
  `clef:` (`treble` | `bass`, default treble), `title:` opzionale.
- Note **ad altezza assoluta** (non relative all'armatura): `<nota><ottava>:<durata>`;
  durate `w h q 8 16`, punto `q.`.
- Pause `r:<durata>`; legatura di valore `~` dopo la nota (`C5:h~ | C5:q`);
  terzine `(3 C5:8 D5:8 E5:8)`.
- Sigle tra `[...]`, agganciate alla nota successiva; validate con `tonal` `Chord.get`.
- Battuta di soli accordi: gli accordi si dividono la battuta in parti uguali e sono
  resi con barre ritmiche (slash noteheads), come in iReal.
- Validazione: somma durate = metro, nota/sigla riconosciute; errori per battuta e
  posizione ("Battuta 3: 5/4 invece di 4/4"). Con errori la trasposizione è bloccata.

Scartata **ABC notation** come sintassi: le alterazioni sono relative all'armatura
(in `K:Eb` `B` vale Sib), fonte di errori per chi scrive a mano, e servirebbe comunque
un convertitore ABC → MusicXML.

---

## Foto — backend

- `netlify/functions/part-scan.ts` + `netlify/lib/partScanPrompt.ts`
  (prompt + `PART_SCAN_MODEL = 'claude-opus-5-5'`); registrata in `FUNCTIONS`
  di `src/api/server.ts`.
- Stessa catena di `score.ts`: `assertOrigin` → `authenticate` → `parseScoreInput` →
  `consumeQuota(caller, 'score', plan)` → Anthropic con immagini + prompt.
- Il prompt descrive la sintassi sopra con esempi e chiede **solo** il testo.
  La risposta viene restituita come `{ text }`; il parsing avviene nel client.
- `score.ts` non viene toccato.
- Client: `aiFetch`, stessa preparazione immagini di Score → iReal Pro.

## Errori

| Caso | Comportamento |
|---|---|
| Quota esaurita / 429 | messaggio con limite giornaliero; scheda *Scrivi* disponibile |
| AI non configurata (503) | messaggio; foto disabilitata, altri input funzionano |
| Immagine illeggibile / testo AI con errori | testo comunque nell'editor con errori evidenziati |
| XML malformato / `.mxl` corrotto / nessuna parte con note | errore esplicito, stato corrente conservato |
| Tonalità sorgente mancante (testo senza `key:`) | campo obbligatorio nel passo 2 |

---

## Struttura file

```
src/shared/utils/transposingInstruments.ts   tabella unica strumenti
src/features/part-transposer/
  PartTransposerFeature.tsx    UI 4 passi
  PartPreview.tsx              OSMD lazy (pattern di audio-transcriber/score/ScorePreview)
  engine/textScore.ts          parser sintassi → modello + errori
  engine/textToMusicXml.ts     modello → MusicXML
  engine/musicXmlIO.ts         lettura .musicxml/.mxl (fflate), elenco/estrazione parti,
                               file multi-parte, serializzazione
  engine/transposeXml.ts       cambio tonalità + strumento + range
  engine/*.test.ts
netlify/functions/part-scan.ts
netlify/lib/partScanPrompt.ts
tests/partScan.test.ts         validazione input / errori dell'endpoint
```

Registrazioni: tipo `Tab`, `GROUPS` (`App.tsx`), `featureRegistry.ts` (`lazyFeature` +
`BY_TAB`), `PRO_TABS`, render branch in `<main>`, `FUNCTIONS` in `server.ts`.

Gli engine ricevono un `Document` e non dipendono dal DOM globale: nel browser
`DOMParser`/`XMLSerializer` nativi, nei test `@xmldom/xmldom`.

## Dipendenze

- `fflate` (runtime, ~8 KB gz, solo nel chunk del tool): decompressione `.mxl`
  (zip con `META-INF/container.xml` che indica il file radice).
- `@xmldom/xmldom` (devDependency): DOM XML per `node --test`.
- Valutate e scartate: `musicxml-io` (API dichiarata instabile), `webmscore`
  (WASM pesante, nessuna API di trasposizione+export), OMR open source (non eseguibili
  serverless).

## Test

Script `test:transposer` (`node --import tsx --test src/features/part-transposer/engine/*.test.ts`)
aggiunto a `npm test` e quindi alla CI.

- **Parser**: durate, punti, terzine, legature, sigle, header, errori per battuta.
- **Trasposizione**: Mib → Sol (grafia), su/giù, sigle con basso (`Cm7/Bb` → `Em7/D`),
  minore, cambio enarmonico oltre 6 alterazioni, ogni strumento (intervallo, chiave,
  `<transpose>`), sorgente non-concert (tromba → sax contralto), alterazioni esplicite,
  avvisi di range.
- **I/O**: fixture MusicXML stile MuseScore con parte di tromba e `<transpose>`
  (round-trip, elementi non musicali conservati), `.mxl`, estrazione parte, multi-parte.
- **Backend**: `tests/partScan.test.ts` per input non valido, metodo, origine.
- **Verifica**: `npm run lint`, `npm run build` (first load ≈ 105 KB invariato),
  prova manuale in browser con un export reale di MuseScore.

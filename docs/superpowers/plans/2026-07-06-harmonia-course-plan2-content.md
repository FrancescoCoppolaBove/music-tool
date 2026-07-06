# Sezione Armonia — Piano 2: Contenuto Completo (18 Livelli)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire tutti gli stub nei livelli 1, 3–17 di `src/features/harmonia-course/data/levels.ts` con contenuto teorico completo in italiano.

**Architecture:** Modifica diretta di un singolo file (`levels.ts`). Ogni task sostituisce le chiamate `stubLevel()` con costanti `Level` complete. I livelli 0 e 2 già nel file sono il modello di stile da seguire.

**Tech Stack:** TypeScript puro — niente React, niente componenti. Solo oggetti dati.

---

## Guida di stile per il contenuto

Ogni subsection deve avere:
- **`teoria`** (600–1000 caratteri): spiegazione in italiano del concetto. Usa `**bold**` per termini tecnici e `` `code inline` `` per sigle di accordi. Paragrafi separati da `\n\n`. Tono didattico, diretto, mai elenchi puntati semplici — argomenta il "perché".
- **`esempi`** (300–600 caratteri): progressioni ed esempi concreti in almeno una tonalità (preferibilmente Do/La). Include note degli accordi o sigle specifiche. Formato plain text con `**` e `` ` ``.
- **`esercizi`** (4–6 voci): array di stringhe. Mix di: esercizi scritti, pratici su strumento, ear training, creativi/compositivi.
- **`obiettivo`** (1–2 frasi): cosa lo studente deve saper fare al termine. Concreto, misurabile.
- **`tools`**: già definiti negli stub — copiare il `toolTab`, `toolLabel`, `toolIcon` dallo stub e aggiungere `desc` contestuale (perché quel tool è utile per *questo* argomento).

**Fonte primaria:** `/Users/astuser/Downloads/programma_armonia_jazz_moderna.txt` — leggerlo per ogni livello prima di scrivere il contenuto.

**Modello di stile:** `level0` e `level2` già in `levels.ts` — leggere prima di scrivere.

**IMPORTANTE:** Non alterare la struttura delle `tools` degli stub, solo aggiungere `desc`. Non cambiare l'ordine dei livelli in `ALL_LEVELS`. Non modificare i tipi in `types.ts`.

---

## File da modificare

| File | Azione |
|---|---|
| `src/features/harmonia-course/data/levels.ts` | Sostituisce stub con Level completi |

---

## Come sostituire uno stub

**Prima (stub):**
```typescript
const level1: Level = {
  id: 1, phase: 1, title: 'Armonia Tonale di Base',
  subsections: [
    { id: '1.1', title: 'Funzioni Armoniche', topics: [...], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: '...', tools: [...] },
    ...
  ],
};
```

**Dopo (completo):**
```typescript
const level1: Level = {
  id: 1, phase: 1, title: 'Armonia Tonale di Base',
  subsections: [
    {
      id: '1.1',
      title: 'Funzioni Armoniche',
      topics: ['Tonica', 'Sottodominante', 'Dominante', 'Cadenze'],
      teoria: `[testo completo in italiano]`,
      esempi: `[esempi con accordi]`,
      esercizi: ['...', '...', '...', '...'],
      obiettivo: '[frase obiettivo]',
      tools: [{ tabId: 'cadence', label: 'Cadence Trainer', icon: '🎓', desc: '[descrizione contestuale]' }],
    },
    ...
  ],
};
```

---

### Task 1: Livelli 1 e 3

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezioni `LIVELLO 1` e `LIVELLO 3` del file txt.

Livello 1 — Armonia Tonale di Base:
- 1.1 Funzioni Armoniche (Tonica, Sottodominante, Dominante, cadenze, tensione/risoluzione)
- 1.2 Accordi di Settima (Maj7, m7, 7dom, m7b5, dim7, mMaj7, sus4, 6, m6)
- 1.3 Armonizzazione della Scala Maggiore a 4 Voci (Imaj7 → viim7b5)

Livello 3 — Dominanti, Tensioni e Alterazioni:
- 3.1 Accordi Dominanti (primaria, secondaria, estesa, sostituta, backdoor, altered, sus)
- 3.2 Tensioni Disponibili (9, b9, #9, 11, #11, 13, b13, avoid notes)
- 3.3 Chord-Scale Theory (Ionian, Dorian, Mixolydian, Altered, Lydian dominant, Diminished, Whole tone, Bebop)

Tools dagli stub esistenti:
- 1.1: `cadence` (Cadence Trainer)
- 1.2: `harmonization` (Scale Harmony)
- 1.3: `harmonization` (Scale Harmony)
- 3.1: `landing` (Chord Landing)
- 3.2: `scaleadvisor` (Scale Advisor)
- 3.3: `scaleadvisor` (Scale Advisor)

- [ ] **Step 1.1: Sostituisci `level1` in `levels.ts`**

Trova il blocco `const level1: Level = { ... }` (circa riga 220 del file) e sostituiscilo con un Level completo. Teoria per 1.1 deve spiegare le 3 funzioni armoniche (T, S, D) con esempi in Do, descrivere tensione/risoluzione, le 4 cadenze. Teoria per 1.2 deve spiegare ogni tipo di accordo di settima con note. Teoria per 1.3 deve mostrare tutta la scala maggiore armonizzata a 4 voci con gradi in numeri romani.

- [ ] **Step 1.2: Sostituisci `level3` in `levels.ts`**

Trova `const level3 = stubLevel(3, ...)` e sostituiscilo con un `const level3: Level = { ... }` completo.

- [ ] **Step 1.3: Verifica TypeScript**

```bash
npx tsc --noEmit
```

Atteso: un solo errore sul modulo `HarmoniaCourseFeature` (il dev server è già attivo su 3001). Zero altri errori.

---

### Task 2: Livello 4

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezione `LIVELLO 4 - VOICING JAZZ`.

- 4.1 Shell Voicings (fondamentale + terza + settima, omissione quinta, voice leading)
- 4.2 Rootless Voicings (posizione A e B, stile Bill Evans, mano sinistra)
- 4.3 Drop 2, Drop 3 e Block Chords (disposizione chiusa/aperta, harmonized melody)
- 4.4 Upper Structure Triads (triadi sopra dominanti, polychord notation, esempi su G7)

Tools: tutti `voicings` (Piano Voicings) per 4.1/4.2/4.3/4.4. Per 4.3 aggiungere anche `voiceleading` (Voice Leading Lab).

- [ ] **Step 2.1: Sostituisci `level4` in `levels.ts`**

Trova `const level4 = stubLevel(4, ...)` e sostituiscilo con `const level4: Level = { ... }` completo.

Per 4.4, la teoria sugli Upper Structure Triads deve includere la tabella degli esempi su G7 dal programma (Ab/G7, A/G7, Bb/G7, Db/G7, Eb/G7 con le tensioni che producono).

- [ ] **Step 2.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 3: Livelli 5 e 6

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezioni `LIVELLO 5` e `LIVELLO 6`.

Livello 5 — Blues, Rhythm Changes e Forme Jazz:
- 5.1 Blues Jazz (blues base in F, versione jazz, quick change, bebop blues, Parker blues)
- 5.2 Rhythm Changes (forma AABA, bridge a dominanti, sostituzioni bebop)
- 5.3 Standard Jazz (repertorio base/intermedio/avanzato, cosa analizzare per ogni brano)

Livello 6 — Armonia Minore Avanzata:
- 6.1 Minore Naturale, Armonico e Melodico (accordi derivati, differenze funzionali, colori dorico/eolio/melodico)
- 6.2 Accordi Diminuiti (passing chord, leading-tone, dominant, scala diminuita, simmetria)

Tools dagli stub:
- 5.1: `progressions` (Chord Progressions)
- 5.3: `analysis` (Harmonic Analysis)
- 6.1: `harmonization` (Scale Harmony)
- 6.2: `harmonization` (Scale Harmony)

- [ ] **Step 3.1: Sostituisci `level5` e `level6` in `levels.ts`**

Per 5.1, includi la progressione blues base in F e la versione più jazz dal programma.
Per 5.3, la teoria deve spiegare *cosa analizzare* in uno standard (forma, modulazioni, II-V-I, dominanti secondarie, tritone sub, punti tensione) con esempi su Autumn Leaves.

- [ ] **Step 3.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 4: Livello 7

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezione `LIVELLO 7 - SOSTITUZIONI ARMONICHE`.

- 7.1 Tritone Substitution (Sub V, movimento basso cromatico, rapporto con Lydian dominant)
- 7.2 Dominanti Secondarie e Catene di Dominanti (V/V, V/ii, backcycling, ciclo quinte)
- 7.3 Modal Interchange (prestito modale, bVII, bVI, ivm, backdoor, colore cinematografico)
- 7.4 Sostituzioni Funzionali (relative minor, medianti cromatiche, approach chords, side-slipping)

Tools dagli stub:
- 7.1: `progressions`
- 7.3: `modal`
- 7.2 e 7.4: nessuno (aggiungi `progressions` per 7.2 e `landing` per 7.4)

- [ ] **Step 4.1: Sostituisci `level7` in `levels.ts`**

Per 7.1, includi l'esempio dal programma: `Dm7 - G7 - Cmaj7` → `Dm7 - Db7 - Cmaj7` con spiegazione del tritono Fa–Si condiviso.
Per 7.3, includi gli esempi in Do maggiore dal programma: `Cmaj7 - Abmaj7 - Dbmaj7`, `Cmaj7 - Fm6`, `Cmaj7 - Bb7`.

- [ ] **Step 4.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 5: Livello 8

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezione `LIVELLO 8 - REHARMONIZATION`.

- 8.1 Reharmonization di Base (7 passi del programma, mantenere melodia, cambiare funzione/basso)
- 8.2 Reharmonization Intermedia (slash chords, pivot chords, II-V concatenati, deceptive resolutions)
- 8.3 Reharmonization Avanzata (Coltrane changes, constant structure, parallel harmony, planing)

Tools dagli stub: nessuno. Aggiungi:
- 8.1: `progressions` (Chord Progressions) + `analysis` (Harmonic Analysis)
- 8.2: `voicings` (Piano Voicings)
- 8.3: `progressions`

- [ ] **Step 5.1: Sostituisci `level8` in `levels.ts`**

Per 8.1, la teoria deve includere la procedura in 7 passi dal programma (identifica nota melodica → accordi alternativi → basso → funzione → voice leading → verifica melodia). Gli esercizi devono includere "Riarmonizzare 8 battute di Autumn Leaves".

Per 8.2, includi l'esempio dal programma:
```
Cmaj7 - Am7 - Dm7 - G7
→ Cmaj9 - Eb7#11 - Dm9 - Db7#11
oppure Cmaj7/E - Ebdim7 - Dm9 - G13b9
```

- [ ] **Step 5.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 6: Livello 9

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezione `LIVELLO 9 - ARMONIA MODALE`.

- 9.1 Modi della Scala Maggiore (7 modi con note caratteristiche, vamp, pedali, ostinati)
- 9.2 Modi della Minore Melodica (altered, lydian dominant, locrian natural 2, applicazioni)
- 9.3 Armonia Modale Moderna (slash chords, accordi quartali, sus, triadi sovrapposte)

Tools dagli stub:
- 9.1: `modal`
- 9.2: `scaleadvisor`
- 9.3: nessuno → aggiungi `progressions`

- [ ] **Step 6.1: Sostituisci `level9` in `levels.ts`**

Per 9.1, includi gli esempi modali dal programma (D Dorian, F Lydian, G Mixolydian) e la nota chiave: "evitare cadenze V-I per restare nel pensiero modale". Esempi brani: So What (Miles Davis), Maiden Voyage (Herbie Hancock).

Per 9.2, includi la mappa chord-scale: C melodic minor → CmMaj7, F Lydian dominant → F7#11, B altered → B7alt.

Per 9.3, includi gli esempi slash chords dal programma: C/D, D13sus, Fmaj7/G, Eb/F, Bbmaj7#11/C.

- [ ] **Step 6.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 7: Livello 10

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezione `LIVELLO 10 - ARMONIA CROMATICA E NON FUNZIONALE`.

- 10.1 Chromatic Mediants (accordi a distanza di terza, uso cinematografico/fusion)
- 10.2 Constant Structure Harmony (parallel maj7, parallel m9, planing)
- 10.3 Polychords e Slash Chords Avanzati (ambiguità tonale, basso indipendente)
- 10.4 Armonia Negativa (inversione intervalli attorno a asse, Ernst Levy, Jacob Collier)

Tools dagli stub: `voicings` e `progressions`.

**NOTA per 10.4 (Armonia Negativa):** Questo argomento NON è nel file del programma — fu aggiunto su richiesta dell'utente. Per il contenuto fare riferimento a: Ernst Levy "A Theory of Harmony", e le applicazioni di Jacob Collier. Il concetto: riflettere ogni intervallo di un accordo attorno a un asse (tipicamente la quinta giusta C–G come asse). In questo sistema C maggiore (C-E-G) diventa F minore (F-Ab-C). Collier usa questa tecnica in "Moon River" e "With the Beatles".

- [ ] **Step 7.1: Sostituisci `level10` in `levels.ts`**

Per 10.1, includi esempi di chromatic mediants dal programma: `Cmaj7 - Ebmaj7`, `Cmaj7 - Abmaj7`, `Cmaj7 - Emaj7`, `Cm9 - Em9`.

Per 10.2, includi gli esempi di constant structure: `Cmaj7 - Ebmaj7 - Gbmaj7 - Amaj7` (divisione ottava in terze minori), `Dm9 - Fm9 - Abm9 - Bm9`.

Per 10.3, includi classificazione slash chords dal programma: D/C = C13#11, Bb/C = C9sus, G/A = A11sus, F#/G = colore cinematico/atonale.

Per 10.4, scrivi una teoria chiara sull'armonia negativa: definizione asse di riflessione, come calcolare il "negativo" di un accordo (specula gli intervalli), esempi pratici (C maggiore → F minore, G7 → Dm), applicazione armonica (Jacob Collier), relazione con il sistema di Ernst Levy.

- [ ] **Step 7.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 8: Livelli 11 e 12

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezioni `LIVELLO 11` e `LIVELLO 12`.

Livello 11 — Coltrane Changes e Simmetria:
- 11.1 Giant Steps e Cicli Simmetrici (divisione ottava in terze maggiori, tre centri B-G-Eb, Countdown)
- 11.2 Scale Simmetriche (diminuita, esatonale, augmented, triadi aumentate)

Livello 12 — Neo-soul, Gospel, Fusion e Contemporary Jazz:
- 12.1 Neo-soul Harmony (6/9, 13sus, minor plagal cadence, quartal voicings, inner voice)
- 12.2 Gospel Harmony (plagal movement, shout chords, walk-up/walk-down, cluster)
- 12.3 Fusion e Contemporary Jazz (triadic pairs, meters dispari, tensioni non risolte)

Tools dagli stub:
- 11.1: `voicings`
- 11.2: `dictionary`
- 12.1: nessuno → aggiungi `voicings` + `modal`
- 12.2: nessuno → aggiungi `progressions`
- 12.3: nessuno → aggiungi `progressions` + `modal`

- [ ] **Step 8.1: Sostituisci `level11` e `level12` in `levels.ts`**

Per 11.1, includi l'esempio semplificato dal programma: `Bmaj7 - D7 - Gmaj7 - Bb7 - Ebmaj7`. Spiega perché funziona: ogni dominante si muove per quinta verso il prossimo tonal center; i tre centri (B, G, Eb) dividono l'ottava in terze maggiori uguali.

Per 12.1, includi gli esempi dal programma: `Cmaj9 - E7#9 - Am9 - Gm9 C13` e `Fmaj9 - Fm9 - Em7 - A7alt - Dm9 - G13`.

- [ ] **Step 8.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 9: Livelli 13 e 14

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezioni `LIVELLO 13` e `LIVELLO 14`.

Livello 13 — Armonizzazione Melodica:
- 13.1 Harmonizing a Melody (nota come fondamentale/terza/quinta/settima/nona/tensione)
- 13.2 Armonizzazione a 4, 5 e 6 Parti (SATB, drop voicings, line cliché, cluster controllati)

Livello 14 — Analisi Armonica Avanzata:
- 14.1 Analisi di Standard (Autumn Leaves, Giant Steps, Dolphin Dance, Body and Soul)
- 14.2 Analisi di Brani Moderni (Wayne Shorter, Herbie Hancock, Jacob Collier, Snarky Puppy)

Tools dagli stub:
- 13.1: nessuno → aggiungi `voicings` + `harmonization`
- 13.2: nessuno → aggiungi `voicings` + `voiceleading`
- 14.1: `analysis`
- 14.2: nessuno → aggiungi `analysis`

- [ ] **Step 9.1: Sostituisci `level13` e `level14` in `levels.ts`**

Per 13.1, includi l'esempio dal programma: la nota E può essere fondamentale di E, terza di C, quinta di A, settima di Fmaj7, nona di D, tredicesima di G7, #11 di Bbmaj7, b9 di Eb7.

Per 14.1, la teoria deve dare una metodologia di analisi armonica per standard: forma → tonalità → II-V-I → dominanti secondarie → tritone sub → modal interchange → accordi ambigui → punti tensione/riposo.

Per 14.2, includi la lista artisti dal programma (Wayne Shorter, Herbie Hancock, Chick Corea, Pat Metheny, Brad Mehldau, Robert Glasper, Jacob Collier, Snarky Puppy, Yussef Dayes, Hiatus Kaiyote) con una breve nota sul carattere armonico di ognuno.

- [ ] **Step 9.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 10: Livelli 15, 16 e 17

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

**Fonte nel programma:** sezioni `LIVELLO 15`, `LIVELLO 16`, `LIVELLO 17`.

Livello 15 — Ear Training Armonico:
- 15.1 Riconoscimento Accordi (Maj7, m7, 7, m7b5, dim7, sus, 7alt, mMaj7, 13sus)
- 15.2 Riconoscimento Progressioni (II-V-I, blues, rhythm changes, Coltrane changes)

Livello 16 — Composizione e Applicazione Pratica:
- 16.1 Scrittura di Progressioni (10 passi dal programma: diatonica → neo-soul → fusion → outside)
- 16.2 Riarmonizzare un Brano Proprio (4 versioni: semplice, jazz, moderna, estrema)

Livello 17 — Arrangiamento Armonico per Band:
- 17.1 Distribuzione Armonica tra Strumenti (basso, piano/Rhodes, chitarra, fiati, voce)
- 17.2 Armonia per Sezione Fiati (drop 2, solis, background figures, shout chorus)

Tools dagli stub:
- 15.1: `eartrainingpro`
- 15.2: `cadence`
- 16.1: `progressions`
- 16.2: nessuno → aggiungi `modal` + `progressions`
- 17.1: `arrangement`
- 17.2: nessuno → aggiungi `voicings` + `voiceleading`

- [ ] **Step 10.1: Sostituisci `level15`, `level16`, `level17` in `levels.ts`**

Per 16.1, includi i 10 step dal programma come struttura degli esercizi: ogni step è un esercizio progressivo (dalla progressione diatonica fino a "torna a qualcosa di semplice ma più bello").

Per 17.1, includi l'esempio pratico dal programma su Cmaj9:
- Basso: C
- Rhodes: E B D
- Chitarra: G D E oppure voicing spezzato
- Fiati: A, D, F# se vuoi colore Lydian
- Voce: melodia

- [ ] **Step 10.2: Verifica TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 11: Build finale e commit

**Files:** nessuno — verifica

- [ ] **Step 11.1: Build completo**

```bash
npm run build
```

Atteso: `✓ built in X.XXs` — zero errori TypeScript.

- [ ] **Step 11.2: Verifica visiva spot-check**

Con `npm run dev` (già attivo su port 3001), verifica:
1. Apri Livello 1 → sezione 1.1 → Teoria: testo completo, non "Contenuto in arrivo".
2. Apri Livello 7 → sezione 7.1 → Esempi: esempio tritone sub presente.
3. Apri Livello 10 → sezione 10.4 → Teoria: testo armonia negativa presente.
4. Apri Livello 17 → sezione 17.1 → Strumenti: Arrangement Blueprint con desc contestuale.

- [ ] **Step 11.3: Commit**

```bash
git add src/features/harmonia-course/data/levels.ts
git commit -m "$(cat <<'EOF'
feat(harmonia-course): complete content for all 18 levels

Replace all stubs with full Italian theory content for levels 1, 3–17.
Each subsection has teoria (600–1000 chars), esempi, 4–6 esercizi, and
obiettivo. Covers: tonal harmony, jazz language, voicing, blues/rhythm
changes, modal interchange, reharmonization, chromatic mediants, Coltrane
changes, neo-soul/gospel/fusion, melodic harmonization, ear training,
composition, and band arrangement.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- ✅ Livelli 1, 3–17 completati (Livelli 0 e 2 già completi da Piano 1)
- ✅ Contenuto in italiano
- ✅ Ogni subsection: teoria + esempi + esercizi + obiettivo + tools con desc
- ✅ Armonia negativa (Lv 10.4) inclusa
- ✅ Livello 10.4 usa fonti: Ernst Levy, Jacob Collier

**Type consistency:**
- Tutti i `tabId` nelle `tools` usano valori `Tab` validi (vedi `navigation.types.ts`)
- I tools aggiunti rispetto agli stub sono: `progressions` (Lv 7.2, 7.4, 8.1, 8.3, 9.3, 12.2, 12.3, 16.2), `modal` (Lv 12.1, 12.3, 16.2), `analysis` (Lv 14.2), `voicings` (Lv 8.1, 12.1, 13.1, 13.2, 17.2), `voiceleading` (Lv 4.3, 13.2, 17.2), `landing` (Lv 7.4), `harmonization` (Lv 13.1)

---

*Fine Piano 2. Dopo il completamento, il corso di armonia sarà completamente funzionale per tutti i 18 livelli.*

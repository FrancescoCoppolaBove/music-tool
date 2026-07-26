# Design: Sezione Armonia — Corso Completo di Armonia Jazz Moderna

**Data:** 2026-07-06  
**Stato:** Approvato  

---

## Obiettivo

Aggiungere a tonic una sezione "Armonia" che implementa un corso completo di armonia jazz moderna, dal livello zero fino agli argomenti avanzati (Coltrane changes, armonia cromatica, neo-soul, arrangiamento per band). Il corso è in italiano. I tool teorici già esistenti (Scale Harmony, Modal Interchange, Piano Voicings, ecc.) vengono integrati nel corso come risorse pratiche per ogni lezione.

---

## Decisioni di Design

| Decisione | Scelta |
|---|---|
| Formato | Dashboard a card con tab Teoria / Esempi / Esercizi / Strumenti |
| Layout dashboard | 4 macro-fasi del programma con griglia di card livelli |
| Integrazione tool esistenti | Riorganizza: gruppo "Theory" → "Armonia"; tool restano nel nav + linkati nelle lezioni |
| Tab Strumenti | Card con pulsante "Apri →" che naviga al tool |
| Scope | Tutti e 18 i livelli (0–17) completi al lancio |
| Lingua | Italiano |
| Progress tracking | localStorage (no Firebase, funziona in local mode) |

---

## Navigazione

Il gruppo **"Theory"** nella navbar viene rinominato **"Armonia"**. Si aggiunge una nuova voce "Corso di Armonia" come primo item del gruppo. Tutti i tool esistenti rimangono nello stesso gruppo.

```
Armonia (gruppo nav)
├── 📚 Corso di Armonia        ← NUOVO (tab id: 'harmonia')
├── 🎶 Scale Harmony           ← esistente (invariato)
├── 🔄 Modal Interchange       ← esistente (invariato)
├── 🎹 Piano Voicings          ← esistente (invariato)
├── 🔵 Circle of Fifths        ← esistente (invariato)
├── 🎓 Cadence Trainer         ← esistente (invariato)
├── 🎺 Transposing Instruments ← esistente (invariato)
├── 🎯 Scale Degree Quiz       ← esistente (invariato)
├── 🎙️ Chord Detection         ← esistente (invariato)
└── 🎤 Nail the Pitch          ← esistente (invariato)
```

---

## Struttura File

```
src/features/harmonia-course/
├── HarmoniaCourseFeature.tsx    ← entry point; gestisce routing interno (dashboard ↔ lezione)
├── HarmoniaDashboard.tsx         ← homepage con le 4 fasi + griglia card livelli
├── LessonView.tsx                ← vista singola lezione con tab switcher
└── data/
    └── levels.ts                 ← tutti i contenuti (18 livelli, in italiano)
```

---

## Tipi TypeScript

```typescript
interface ToolLink {
  tabId: Tab;        // id del tab app esistente (es. 'voicings')
  label: string;     // es. "Piano Voicings"
  icon: string;      // emoji
  desc: string;      // descrizione breve del perché è utile per questa lezione
}

interface Subsection {
  id: string;        // es. "2.1"
  title: string;     // es. "Il II-V-I Maggiore"
  topics: string[];  // lista argomenti (usata come preview nella card del livello)
  teoria: string;    // testo in italiano — plain text con **bold**, *italic*, `code` e \n per paragrafi; renderizzato come styled HTML
  esempi: string;    // testo in italiano con esempi notati (stesso formato di teoria)
  esercizi: string[]; // lista esercizi numerati
  obiettivo: string; // frase obiettivo del livello
  tools: ToolLink[]; // tool esistenti collegati
}

interface Level {
  id: number;           // 0–17
  phase: 1 | 2 | 3 | 4;
  title: string;        // es. "Primo Linguaggio Jazz"
  subsections: Subsection[];
  completed?: boolean;  // gestito via localStorage
}
```

---

## Dashboard — 4 Macro-Fasi

| Fase | Livelli | Durata consigliata |
|---|---|---|
| 1 — Fondamenta Solide | Lv 0, 1, 2, 3 | 2-3 mesi |
| 2 — Linguaggio Jazz Funzionale | Lv 4, 5, 6, 7 | 3-4 mesi |
| 3 — Colore Moderno e Reharmonization | Lv 8, 9, 10, 11 | 4-6 mesi |
| 4 — Armonia Avanzata e Linguaggio Personale | Lv 12, 13, 14, 15, 16, 17 | 6+ mesi |

Ogni card livello mostra: numero, titolo, preview argomenti principali, badge tool collegati, barra di progresso verde se completata.

---

## Vista Lezione — 4 Tab

### Tab Teoria
Spiegazione in italiano: concetti, regole, il "perché" musicale. Testo con esempi di sigle in `code inline` e blocchi teoria evidenziati. Include sempre un box verde "Obiettivo".

### Tab Esempi
Progressioni ed esempi in almeno una tonalità (Do maggiore per default). Per i livelli avanzati: varianti in più tonalità, confronti tra versioni semplici e complesse.

### Tab Esercizi
Lista numerata degli esercizi del programma, divisi per tipo: scritti, strumentali (su tastiera/chitarra), ear training, creativi. Ogni categoria ha un'etichetta visiva.

### Tab Strumenti
Card per ogni tool esistente rilevante. Ogni card: icona, nome, descrizione contestuale ("perché è utile per questo argomento"), pulsante "Apri →" che naviga al tool tramite la prop `onNavigate`.

### Bottone "Segna come completato"
Presente in ogni lezione, salva l'id della lezione in `localStorage` alla chiave `tonic_harmonia_progress`.

---

## Mappa Completa Livelli

### Fase 1 — Fondamenta Solide

**Livello 0 — Alfabetizzazione Musicale Assoluta**
- 0.1 Suono, Altezza e Intervalli
- 0.2 Scala Maggiore e Scale Minori
- 0.3 Triadi
- Tool: Circle of Fifths, Scale Degree Quiz, Scale Recognition, Scale Dictionary

**Livello 1 — Armonia Tonale di Base**
- 1.1 Funzioni Armoniche (Tonica, Sottodominante, Dominante, Cadenze)
- 1.2 Accordi di Settima (maj7, m7, 7, m7b5, dim7, mMaj7, sus4, 6, m6)
- 1.3 Armonizzazione della Scala Maggiore a Quattro Voci
- Tool: Scale Harmony, Cadence Trainer

**Livello 2 — Primo Linguaggio Jazz**
- 2.1 Il II-V-I Maggiore (guide tones, voice leading)
- 2.2 Il II-V-I Minore (scala minore armonica/melodica, dominante alterata)
- 2.3 Turnaround (dominanti secondarie, ciclo delle quinte, passing chords)
- Tool: Chord Progressions, Voice Leading Lab

**Livello 3 — Dominanti, Tensioni e Alterazioni**
- 3.1 Accordi Dominanti (primaria, secondaria, estesa, sostituta, backdoor, altered, sus)
- 3.2 Tensioni Disponibili (9, b9, #9, 11, #11, 13, b13, avoid notes)
- 3.3 Chord-Scale Theory (modi, altered, lydian dominant, diminished, whole tone, bebop)
- Tool: Scale Advisor, Chord Landing, Scale Dictionary

### Fase 2 — Linguaggio Jazz Funzionale

**Livello 4 — Voicing Jazz**
- 4.1 Shell Voicings (fondamentale, terza, settima)
- 4.2 Rootless Voicings (posizione A e B, stile Bill Evans)
- 4.3 Drop 2, Drop 3 e Block Chords
- 4.4 Upper Structure Triads
- Tool: Piano Voicings, Voice Leading Lab, Scale Harmony

**Livello 5 — Blues, Rhythm Changes e Forme Jazz**
- 5.1 Blues Jazz (jazz blues, quick change, bebop blues, Parker blues)
- 5.2 Rhythm Changes (forma AABA, bridge a dominanti, sostituzioni bebop)
- 5.3 Standard Jazz (repertorio progressivo base/intermedio/avanzato)
- Tool: Chord Progressions, Harmonic Analysis

**Livello 6 — Armonia Minore Avanzata**
- 6.1 Minore Naturale, Armonico e Melodico (accordi derivati, colore dorico/eolio/melodico)
- 6.2 Accordi Diminuiti (passing chord, leading-tone, dominant, scala diminuita)
- Tool: Scale Harmony, Scale Dictionary

**Livello 7 — Sostituzioni Armoniche**
- 7.1 Tritone Substitution (Sub V, movimento cromatico del basso)
- 7.2 Dominanti Secondarie e Catene di Dominanti (V/V, backcycling)
- 7.3 Modal Interchange (prestito modale, bVII, bVI, ivm, backdoor progression)
- 7.4 Sostituzioni Funzionali (relative minor, medianti cromatiche, approach chords, side-slipping)
- Tool: Modal Interchange, Chord Progressions, Chord Landing

### Fase 3 — Colore Moderno e Reharmonization

**Livello 8 — Reharmonization**
- 8.1 Reharmonization di Base (procedura 7 passi: melodia → funzione → basso)
- 8.2 Reharmonization Intermedia (slash chords, pivot chords, deceptive resolutions)
- 8.3 Reharmonization Avanzata (Coltrane changes, constant structure, parallel harmony, planing)
- Tool: Chord Progressions, Harmonic Analysis, Piano Voicings

**Livello 9 — Armonia Modale**
- 9.1 Modi della Scala Maggiore (note caratteristiche, vamp, pedali, ostinati)
- 9.2 Modi della Minore Melodica (altered, lydian dominant, locrian natural 2)
- 9.3 Armonia Modale Moderna (slash chords, accordi quartali, accordi sus, triadi sovrapposte)
- Tool: Modal Interchange, Scale Advisor, Scale Dictionary

**Livello 10 — Armonia Cromatica e Non Funzionale**
- 10.1 Chromatic Mediants (accordi a distanza di terza, uso cinematografico e fusion)
- 10.2 Constant Structure Harmony (parallel maj7, parallel m9, planing)
- 10.3 Polychords e Slash Chords Avanzati (ambiguità tonale, basso indipendente)
- 10.4 Armonia Negativa (negative harmony — riflessione degli intervalli attorno a un asse, Ernst Levy, Jacob Collier)
- Tool: Piano Voicings, Chord Progressions

**Livello 11 — Coltrane Changes e Simmetria**
- 11.1 Giant Steps e Cicli Simmetrici (divisione ottava in terze maggiori, tre centri tonali)
- 11.2 Scale Simmetriche (diminuita, esatonale, augmented, triadi aumentate)
- Tool: Piano Voicings, Scale Dictionary

### Fase 4 — Armonia Avanzata e Linguaggio Personale

**Livello 12 — Neo-soul, Gospel, Fusion e Contemporary Jazz**
- 12.1 Neo-soul Harmony (6/9, 13sus, minor plagal cadence, quartal voicings, inner voice)
- 12.2 Gospel Harmony (plagal movement, shout chords, cluster, call and response armonico)
- 12.3 Fusion e Contemporary Jazz (triadic pairs, metros dispari, tensioni non risolte)
- Tool: Piano Voicings, Chord Progressions, Modal Interchange

**Livello 13 — Armonizzazione Melodica**
- 13.1 Harmonizing a Melody (nota come fondamentale, terza, quinta, settima, nona, tensione)
- 13.2 Armonizzazione a 4, 5 e 6 Parti (SATB, drop voicings, line cliché, cluster controllati)
- Tool: Piano Voicings, Voice Leading Lab, Scale Harmony

**Livello 14 — Analisi Armonica Avanzata**
- 14.1 Analisi di Standard (Autumn Leaves, Giant Steps, Dolphin Dance, ecc.)
- 14.2 Analisi di Brani Moderni (Wayne Shorter, Herbie Hancock, Jacob Collier, Snarky Puppy, ecc.)
- Tool: Harmonic Analysis, Chord Progressions

**Livello 15 — Ear Training Armonico**
- 15.1 Riconoscimento Accordi (maj7, m7, 7, m7b5, dim7, sus, 7alt, mMaj7, 13sus)
- 15.2 Riconoscimento Progressioni (II-V-I, blues, rhythm changes, Coltrane changes)
- Tool: Ear Training Pro, Cadence Trainer, Chord Detection

**Livello 16 — Composizione e Applicazione Pratica**
- 16.1 Scrittura di Progressioni (da diatonica a modale, neo-soul, fusion, outside)
- 16.2 Riarmonizzare un Brano Proprio (4 versioni: semplice, jazz, moderna, estrema)
- Tool: Chord Progressions, Modal Interchange, Piano Voicings

**Livello 17 — Arrangiamento Armonico per Band**
- 17.1 Distribuzione Armonica tra Strumenti (basso, piano, Rhodes, chitarra, fiati, voce)
- 17.2 Armonia per Sezione Fiati (drop 2, solis, background figures, shout chorus)
- Tool: Arrangement Blueprint, Piano Voicings, Voice Leading Lab

---

## Progress Tracking

- Chiave localStorage: `tonic_harmonia_progress`
- Formato: array di stringhe con gli id delle lezioni completate (es. `["2.1", "2.2", "3.1"]`)
- Ogni card livello mostra una barra verde se almeno una subsection è completata; barra completa se tutte completate
- Nessuna dipendenza da Firebase — funziona in local mode

---

## Modifiche ad App.tsx

1. Aggiungere `'harmonia'` al tipo `Tab`
2. Aggiungere `import HarmoniaCourseFeatue from './features/harmonia-course/HarmoniaCourseFeatue'`
3. Nel `GROUPS` array: rinominare il gruppo `id: 'theory'` in `label: 'Armonia'`, aggiungere come primo tab `{ id: 'harmonia', label: 'Corso di Armonia', icon: '📚', desc: 'Percorso completo da zero agli argomenti avanzati' }`
4. Nella sezione `<main>`: aggiungere `{activeTab === 'harmonia' && <HarmoniaCourseFeature onNavigate={handleSelectTab} />}`  
   — la prop `onNavigate: (tab: Tab) => void` è la stessa `handleSelectTab` già usata da tutti gli altri tab

---

## Note sull'accuratezza dei contenuti

Il contenuto teorico di ogni lezione sarà verificato rispetto a fonti di riferimento standard (Mark Levine — The Jazz Theory Book; Barrie Nettles / Richard Graf — The Chord Scale Theory & Jazz Harmony; David Berkman — The Jazz Harmony Book). Per l'armonia negativa si fa riferimento a Ernst Levy — A Theory of Harmony e alle trascrizioni di Jacob Collier. Prima della scrittura del contenuto sarà condotta ricerca web per verificare accuratezza di argomenti specifici (Coltrane changes, negative harmony, scale simmetriche).

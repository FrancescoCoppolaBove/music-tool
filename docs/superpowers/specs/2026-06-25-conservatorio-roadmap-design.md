# Tonic — Conservatorio Roadmap Design

**Data:** 2026-06-25
**Stato:** Approvato
**Modello di revenue:** B2B istituzionale — licenza per conservatorio
**Ispirazione didattica:** solfeggioinrete.altervista.org (Conservatorio Marenzio, Brescia)

---

## Contesto e obiettivo

Tonic si posiziona come strumento AI-first per i conservatori italiani (sistema AFAM). L'obiettivo è vendere licenze istituzionali ai conservatori coprendo il curriculum ufficiale con un'esperienza moderna, interattiva e tracciabile — qualcosa che strumenti statici come solfeggioinrete non possono offrire.

Il pitch: *"I tuoi studenti studiano su Tonic. Tu vedi chi è indietro, assegni esercizi mirati, esporti i report per la commissione."*

---

## Gap analysis — cosa manca a Tonic vs curricolo AFAM

| Modulo | Sito riferimento | Tonic oggi |
|---|---|---|
| Ear Training — Intervalli | 40 esercizi (melodici + armonici) | Solo "Interval Quiz" (gradi scala, non intervalli) |
| Ear Training — Accordi | Triadi + settime con rivolti (~65 esercizi) | Assente |
| Ear Training — Funzioni tonali | 20 esercizi | Assente |
| Solfeggio cantato strutturato | 158 esercizi con audio + progressione | Solo "Nail the Pitch" (pitch libero) |
| Setticlavio | Chiavi di C: contralto, tenore, soprano | Assente |
| Dashboard docente | — | Assente |
| Prove d'esame simulate | Esami reali 2006–2018 | Assente |
| Lettura ritmica | 57+ esercizi | Assente |
| Teoria interattiva | 35 lezioni (corso inferiore + medio) | Assente |
| Dettato melodico | 1.365 esercizi 1–4 voci | Assente |

---

## Piano in tre sprint

### Sprint 1 — Gruppo "Solfeggio" (5 settimane)

Crea il gruppo nav dedicato al curricolo conservatorio e implementa le tre feature core.

### Sprint 2 — Layer istituzionale (4 settimane)

Multi-role auth, dashboard docente, prove d'esame simulate.

### Sprint 3 — Completamento (4+ settimane, post-feedback)

Lettura ritmica, teoria interattiva, SVG staff upgrade, dettato melodico opzionale.

---

## Navigazione

Viene aggiunto un quinto gruppo nav **"Solfeggio"** accanto a Composition / Scale / Theory / Practice.

```
Solfeggio 🎓
├── Ear Training Pro   👂  (rinomina + refactor del tab esistente)
├── Solfeggio Cantato  🎵  (nuovo)
├── Setticlavio        🗝️  (nuovo)
── Sprint 3 ──────────────────────
├── Lettura Ritmica    🥁  (nuovo)
└── Dettato            📝  (nuovo)
```

Il gruppo Theory si alleggerisce: Ear Training (vecchio) viene rimosso e sostituito da Ear Training Pro nel gruppo Solfeggio. Cadence Trainer rimane in Theory — è uno strumento teorico, non un esercizio di ascolto strutturato.

**Cambio in `App.tsx`:**
- Nuovo `Tab` per `eartrainingpro`, `solfeggiocan`, `setticlavio`
- Nuovo `GroupDef` `solfeggio` inserito prima di `theory` nell'array `GROUPS`
- Rimuovere `ear` dal gruppo `theory`

---

## Sprint 1 — Feature nel dettaglio

### 1. Ear Training Pro

**File:** `src/features/ear-training-pro/`

Refactor completo dell'`EarTrainingFeature` esistente. L'entry point mostra un selettore di modulo + difficoltà + modalità prima di entrare nell'esercizio.

#### Moduli

| Modulo | Esercizi | Note |
|---|---|---|
| Intervalli melodici | 20 (3 livelli) | Due note in sequenza, identifica intervallo |
| Intervalli armonici | 20 (3 livelli) | Due note simultanee, identifica intervallo |
| Triadi | 15 (root position + inversioni) | Identifica tipo (magg/min/dim/aug) e rivolto |
| Settime | 26 (4 specie × rivolti) | Dom7, min7, maj7, dim7 + rivolti |
| Funzioni tonali | 20 | Tonica / Dominante / Sottodominante in contesto |
| Cadenze | 6 tipi | Integra logica del Cadence Trainer esistente |

#### Modalità

**Allenamento:**
- Esercizi infiniti con estrazione casuale pesata (più sbagli → più appare)
- Feedback immediato dopo ogni risposta: verde/rosso + spiegazione + mnemonic hint
- Hint esempio: *"La quinta giusta → pensa a 'Star Wars'"*
- Nessun salvataggio obbligatorio in Firestore; aggiorna StatsContext locale

**Esame:**
- Sessione da 10 domande, timer visibile
- Nessun feedback durante la sessione
- Al termine: score totale + dettaglio risposta per risposta
- Risultato salvato in Firestore sotto `submissions/{userId}/{sessionId}` (se Firebase abilitato)
- Assegnabile dal docente (vedi Dashboard)

#### Audio

`AudioContext` nativo — nessuna libreria aggiuntiva. Oscillatori semplici (sine/triangle) con envelope ADSR minimale. Funzione `playNote(midi: number, duration: number)` condivisa in `src/shared/utils/audio.ts`. Accordi: note suonate in simultanea o con spread di 20ms (armonico vs melodico).

#### Struttura dati esercizi

```ts
// src/features/ear-training-pro/data/intervals.ts
export interface EarExercise {
  id: string;
  type: 'interval' | 'chord' | 'tonal-function' | 'cadence';
  level: 1 | 2 | 3;
  notes: number[];        // MIDI numbers da suonare
  answer: string;         // es. "P5", "maj-root", "dominant"
  distractors: string[];  // 3 risposte sbagliate
  hint?: string;          // mnemonic hint
}
```

File JSON statici in `src/features/ear-training-pro/data/` — uno per modulo. Facile da espandere senza toccare codice.

---

### 2. Solfeggio Cantato

**File:** `src/features/solfeggio-cantato/`

#### Meccanica — Echo mode

1. L'app mostra il nome dell'esercizio e un pulsante **▶ Ascolta modello**
2. Riproduce la sequenza di note via `AudioContext`
3. Pulsante **🎤 Canta** — avvia `pitchy` sul microfono
4. Pitchy campiona la frequenza a ~10Hz; per ciascuna nota target controlla se la frequenza rilevata è entro ±50 cent per almeno 300ms
5. Ogni nota riceve uno stato: `correct` | `sharp` | `flat` | `missed`
6. A fine frase: schermata risultati con pallini colorati per nota + % accuratezza complessiva + feedback testuale AI (`Forte su DO e RE, lavora sulla quinta`)

#### Libreria esercizi (Sprint 1 — ~80 esercizi)

```ts
export interface SolfeggioExercise {
  id: string;
  title: string;
  level: 'propedeutico' | 'facile' | 'medio';
  category: 'scale' | 'intervallo' | 'frammento';
  notes: Array<{ midi: number; label: string; duration: number }>;
}
```

Categorie Sprint 1:
- **Scale** (12): Do magg., Sol magg., Fa magg., Re min., La min., Sol min. + le stesse discendenti
- **Intervalli cantati** (18): seconda, terza, quarta, quinta, sesta, settima × ascendente/discendente
- **Frammenti facili** (30): melodie di 4–8 note, range C4–C5
- **Frammenti medi** (20): melodie di 8–12 note, con cromatismi semplici

#### Componenti

```
SolfeggioCantatoFeature.tsx   ← entry point, selettore categoria/livello
ExercisePlayer.tsx             ← playback audio + display note target
MicRecorder.tsx                ← wrapper pitchy, emette { midi, confidence }[]
ResultCard.tsx                 ← note colorate + score + feedback
```

`MicRecorder` è estratto da `NailThePitchFeature` (già esiste, basta generalizzarlo).

---

### 3. Setticlavio

**File:** `src/features/setticlavio/`

#### Meccanica

Esercizio puramente visivo (no audio):
1. SVG staff con C-clef posizionata sulla linea target (III per contralto, IV per tenore)
2. Una nota evidenziata sul rigo
3. 4 scelte multiple (nome nota: Do, Re, Mi…)
4. Feedback immediato: corretto/sbagliato + spiegazione posizione

#### Chiavi implementate in Sprint 1

| Chiave | Linea centrale | Uso tipico |
|---|---|---|
| Contralto | III | Viola |
| Tenore | IV | Violoncello, trombone, fagotto |

Soprano e mezzosoprano aggiunti in Sprint 3 (meno comuni).

#### Progressione esercizi (60 totali)

- **Liv. 1 (20)**: solo note naturali Do–Si, posizioni centrali del rigo
- **Liv. 2 (20)**: alterazioni (#/b), note fuori rigo (max 2 tagli)
- **Liv. 3 (20)**: frammenti di 3–5 note consecutive da leggere in ordine

#### SVG staff

Disegnato a mano in React con coordinate fisse — nessuna libreria. La chiave di C è un carattere Unicode (𝄡 + posizione verticale). Le note sono `<ellipse>` con gambo `<line>`. Componente riusabile `Staff` che accetta `{ clef, notes, highlightIndex }`.

---

## Sprint 2 — Layer istituzionale

### 4. Multi-role auth

**Estensione Firebase** — campo `role: 'student' | 'teacher'` in `Firestore/users/{uid}`.

Il docente viene promosso via console Firebase (MVP) o tramite codice invito generato dall'app (v2). Nessun pannello admin separato in Sprint 2.

**Firestore schema nuovo:**

```
users/{uid}
  role: 'student' | 'teacher'
  displayName: string
  conservatory?: string

classes/{classId}
  teacherId: string
  name: string
  studentIds: string[]

assignments/{assignmentId}
  classId: string
  teacherId: string
  moduleId: string          // es. 'intervals-melodic'
  level: 1 | 2 | 3
  mode: 'training' | 'exam'
  dueDate: Timestamp
  createdAt: Timestamp

submissions/{submissionId}
  userId: string
  assignmentId?: string     // null se sessione libera
  moduleId: string
  score: number             // 0–100
  answers: Array<{ questionId: string; given: string; expected: string; isCorrect: boolean }>
  completedAt: Timestamp
  durationMs: number
```

### 5. Dashboard Docente

**File:** `src/features/teacher-dashboard/`

Accessibile solo se `user.role === 'teacher'`. Aggiunto come tab nascosto (non compare nel menu pubblico) — visibile solo dopo login con ruolo teacher.

#### Layout — vista unificata (scelta C)

**Sezione Alert (top):**
- Badge rosso se ci sono studenti inattivi (0 sessioni negli ultimi 7 giorni)
- Badge arancione se un compito scade entro 48 ore con completamento < 50%
- CTA "Invia promemoria" → genera link copiabile (per WhatsApp/email manuale) — MVP; email automatica richiede Firebase Cloud Functions (Sprint 3+)

**Sezione Compiti attivi:**
- Card per ogni assignment: nome modulo + livello + barra n/tot studenti + giorni alla scadenza
- Pulsante "+ Nuovo compito" → modal: seleziona classe / modulo / livello / modalità / scadenza

**Sezione Roster:**
- Lista studenti ordinabile per: nome / % accuratezza / sessioni questa settimana
- Per ogni studente: avatar iniziali + % media + n sessioni + alert individuale se inattivo
- Click studente → drawer laterale con dettaglio storico sessioni + grafico lineare accuratezza nel tempo

**Export:**
- Pulsante "Esporta CSV" → `submissions` filtrate per classe + periodo → download file `tonic-report-{classe}-{data}.csv`

### 6. Prove d'esame simulate

**Aggiunta al gruppo Solfeggio** come quarta voce (dopo Setticlavio).

**Struttura di una prova:**
```ts
interface ExamTemplate {
  id: string;
  title: string;            // es. "Simulazione Esame — Livello Intermedio"
  sections: Array<{
    moduleId: string;
    questionCount: number;
    level: 1 | 2 | 3;
    timeLimitSeconds: number;
  }>;
}
```

**Sprint 1 templates (3 prove):**
- Prova Base: 5 intervalli melodici L1 + 5 triadi L1 → 10 min
- Prova Intermedia: 5 intervalli armonici L2 + 5 settime L2 + 3 cadenze → 15 min
- Prova Avanzata: 10 esercizi misti L3 + 5 funzioni tonali → 20 min

Assegnabile dal docente come compito speciale. Report finale salvato in Firestore con breakout per sezione.

---

## Sprint 3 — Completamento (dopo feedback reale)

### Lettura Ritmica

Esercizi di tapping su pattern ritmici visualizzati come blocchi colorati. L'utente batte la barra spaziatrice (o tocca lo schermo su mobile) e l'app misura la deviazione in ms rispetto al tempo ideale. Punteggio: % di colpi entro ±50ms dal beat corretto.

50 pattern progressivi: da semplici note in 4/4 a legature, terzine, sincopi.

### Teoria Interattiva

20 lezioni del corso medio AFAM (circolo delle quinte, accordi, cadenze, abbellimenti, trasporto, ecc.) come pagine React con testo + SVG esempi + mini-quiz integrato alla fine di ogni lezione. Contenuto scritto da zero in italiano, allineato al programma AFAM.

### SVG Staff upgrade per Solfeggio Cantato

Sostituisce l'Echo mode con la visualizzazione su pentagramma: note in sequenza sul rigo che si evidenziano mentre lo studente canta. Usa il componente `Staff` già costruito per Setticlavio.

### Dettato melodico (condizionale)

Solo se richiesto dal feedback conservatori. Richiede un sistema di input notazione (VexFlow o simile) — valutare in base alla domanda reale.

---

## Dipendenze tecniche

| Feature | Dipendenza nuova | Note |
|---|---|---|
| Ear Training Pro audio | nessuna | `AudioContext` nativo |
| Solfeggio Cantato | nessuna | `pitchy` già presente |
| Setticlavio SVG | nessuna | SVG a mano |
| Dashboard docente | nessuna | Firebase già presente |
| Lettura Ritmica | nessuna | `AudioContext` per timing |
| Teoria interattiva | nessuna | Contenuto statico React |
| Dettato melodico | VexFlow o OpenSheetMusicDisplay | Valutare a Sprint 3 |

**Nessuna nuova dipendenza npm nei primi due sprint.**

---

## Considerazioni UI / UX trasversali

- Tutte le nuove feature seguono il design system esistente (variabili CSS `--color-*`, font DM Sans / Syne, dark mode `#0d1117` base)
- Ogni feature ha una schermata iniziale di "selezione" (modulo + livello + modalità) prima dell'esercizio — pattern coerente
- Esercizi in modalità Esame mostrano sempre un timer
- Su mobile: i controlli microfono richiedono `getUserMedia` con gestione errori esplicita (permesso negato, browser non supportato)
- Feature cloud-dipendenti (Dashboard Docente, salvataggio submissions) mostrano `LocalModeNotice` se Firebase non è configurato — già pattern consolidato in Tonic

---

## Metriche di successo (KPI per la demo ai conservatori)

- Studente completa una sessione Ear Training Pro in < 5 minuti
- Docente vede in < 10 secondi quanti studenti hanno completato il compito assegnato
- Score medio della classe su Intervalli Melodici tracciabile settimana su settimana
- Export CSV funzionante e leggibile in Excel

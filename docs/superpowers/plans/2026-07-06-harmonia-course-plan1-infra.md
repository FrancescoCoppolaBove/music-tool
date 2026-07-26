# Sezione Armonia — Piano 1: Infrastruttura

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire lo shell completo della sezione Armonia: navigazione, tutti i componenti React, localStorage progress tracking, e 2 livelli campione per verificare l'architettura.

**Architecture:** Nuova feature `harmonia-course` con un componente entry che gestisce il routing interno dashboard ↔ lezione. I dati di contenuto sono oggetti TypeScript tipizzati. `Tab` viene esportato da App.tsx per callback di navigazione type-safe. Piano 2 aggiungerà i contenuti completi di tutti i 18 livelli sostituendo gli stub.

**Tech Stack:** React 18, TypeScript, inline styles (convenzione del progetto), localStorage.

---

## File da creare / modificare

| File | Azione | Responsabilità |
|---|---|---|
| `src/App.tsx` | Modifica | Esporta `Tab`, aggiunge `'harmonia'`, rinomina Theory→Armonia, aggiunge nav entry e render branch |
| `src/features/harmonia-course/data/types.ts` | Crea | Tipi TypeScript: `ToolLink`, `Subsection`, `Level`, `PHASE_META` |
| `src/features/harmonia-course/data/levels.ts` | Crea | 18 livelli stub + contenuto completo per Lv 0 e Lv 2 |
| `src/features/harmonia-course/LessonView.tsx` | Crea | Vista singola lezione con 4 tab + progress marking |
| `src/features/harmonia-course/HarmoniaDashboard.tsx` | Crea | Dashboard a 4 fasi con griglia card livelli |
| `src/features/harmonia-course/HarmoniaCourseFeature.tsx` | Crea | Entry point; gestisce stato selectedLesson |

---

### Task 1: Esporta `Tab` da App.tsx e aggiungi `'harmonia'`

**Files:**
- Modify: `src/App.tsx:154-187`

- [ ] **Step 1.1: Aggiungi `export` al tipo Tab e `'harmonia'` all'unione**

Trova la riga `type Tab =` (circa riga 154) e modificala così:

```typescript
export type Tab =
  | 'home'
  | 'voicings'
  | 'scales'
  | 'dictionary'
  | 'ear'
  | 'circle'
  | 'harmonization'
  | 'modal'
  | 'progressions'
  | 'scaleadvisor'
  | 'analysis'
  | 'riff'
  | 'melody'
  | 'quiz'
  | 'score'
  | 'landing'
  | 'architect'
  | 'journal'
  | 'songs'
  | 'daily'
  | 'chorddetect'
  | 'nailpitch'
  | 'profile'
  | 'voiceleading'
  | 'groove'
  | 'arrangement'
  | 'cadence'
  | 'transpose'
  | 'eartrainingpro'
  | 'solfeggiocan'
  | 'setticlavio'
  | 'examtemplates'
  | 'teacherdashboard'
  | 'harmonia';
```

- [ ] **Step 1.2: Aggiungi l'import di HarmoniaCourseFeature**

Dopo l'ultima riga import (circa riga 41), aggiungi:

```typescript
import HarmoniaCourseFeature from './features/harmonia-course/HarmoniaCourseFeature';
```

- [ ] **Step 1.3: Rinomina il gruppo Theory → Armonia e aggiungi il tab Corso**

Trova il gruppo `id: 'theory'` nel GROUPS array (circa riga 247) e sostituiscilo con:

```typescript
{
  id: 'theory',
  label: 'Armonia',
  icon: '📖',
  tabs: [
    { id: 'harmonia',      label: 'Corso di Armonia',       icon: '📚', desc: 'Percorso completo da zero agli argomenti avanzati' },
    { id: 'harmonization', label: 'Scale Harmony',          icon: '🎶', desc: 'See how chords relate to their scale' },
    { id: 'modal',         label: 'Modal Interchange',      icon: '🔄', desc: 'Borrow chords from parallel modes' },
    { id: 'voicings',      label: 'Piano Voicings',         icon: '🎹', desc: 'Visualize drop 2, quartal & upper structures' },
    { id: 'circle',        label: 'Circle of Fifths',       icon: '🔵', desc: 'Explore key relationships at a glance' },
    { id: 'cadence',       label: 'Cadence Trainer',        icon: '🎓', desc: 'Recognise authentic, plagal, half & deceptive cadences by ear' },
    { id: 'transpose',     label: 'Transposing Instruments', icon: '🎺', desc: 'Written vs sounding pitch for B♭, E♭, F & A instruments' },
    { id: 'quiz',          label: 'Scale Degree Quiz',      icon: '🎯', desc: 'Train your knowledge of major scale degrees' },
    { id: 'chorddetect',   label: 'Chord Detection',        icon: '🎙️', desc: 'Play a chord — app identifies it in real time' },
    { id: 'nailpitch',     label: 'Nail the Pitch',         icon: '🎤', desc: 'Sing and see which notes you hit, Melodyne-style' },
  ],
},
```

- [ ] **Step 1.4: Aggiungi il render branch in `<main>`**

Nel blocco main (subito prima di `{activeTab === 'voiceleading'...}`), aggiungi:

```typescript
{activeTab === 'harmonia'       && <HarmoniaCourseFeature onNavigate={handleSelectTab} />}
```

- [ ] **Step 1.5: Verifica build TypeScript**

```bash
npm run build
```

Atteso: nessun errore TypeScript. Se vedi `Module not found: HarmoniaCourseFeature`, è normale — il file non esiste ancora. Procedi al Task 2.

---

### Task 2: Tipi TypeScript

**Files:**
- Create: `src/features/harmonia-course/data/types.ts`

- [ ] **Step 2.1: Crea il file dei tipi**

```typescript
import type { Tab } from '../../../App';

export interface ToolLink {
  tabId: Tab;
  label: string;
  icon: string;
  desc: string;
}

export interface Subsection {
  id: string;
  title: string;
  topics: string[];
  teoria: string;
  esempi: string;
  esercizi: string[];
  obiettivo: string;
  tools: ToolLink[];
}

export interface Level {
  id: number;
  phase: 1 | 2 | 3 | 4;
  title: string;
  subsections: Subsection[];
}

export const PHASE_META: Record<1 | 2 | 3 | 4, { title: string; duration: string; levelRange: string }> = {
  1: { title: 'Fondamenta Solide',                       duration: '2-3 mesi', levelRange: 'Lv 0-3' },
  2: { title: 'Linguaggio Jazz Funzionale',              duration: '3-4 mesi', levelRange: 'Lv 4-7' },
  3: { title: 'Colore Moderno e Reharmonization',        duration: '4-6 mesi', levelRange: 'Lv 8-11' },
  4: { title: 'Armonia Avanzata e Linguaggio Personale', duration: '6+ mesi',  levelRange: 'Lv 12-17' },
};

export const PROGRESS_KEY = 'tonic_harmonia_progress';

export function getCompletedLessons(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markLessonComplete(subsectionId: string): void {
  const completed = getCompletedLessons();
  completed.add(subsectionId);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
}

export function markLessonIncomplete(subsectionId: string): void {
  const completed = getCompletedLessons();
  completed.delete(subsectionId);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
}
```

---

### Task 3: Dati dei livelli — stub + 2 livelli completi

**Files:**
- Create: `src/features/harmonia-course/data/levels.ts`

Questo file contiene tutti i 18 livelli. I Livelli 0 e 2 hanno contenuto completo (per testare la UI). Gli altri sono stub con titolo e argomenti. Il **Piano 2** sostituirà tutti gli stub con il contenuto completo.

- [ ] **Step 3.1: Crea `src/features/harmonia-course/data/levels.ts`**

```typescript
import type { Level } from './types';

// ─── Livello 0 — Alfabetizzazione Musicale Assoluta ─────────────────────────

const level0: Level = {
  id: 0,
  phase: 1,
  title: 'Alfabetizzazione Musicale Assoluta',
  subsections: [
    {
      id: '0.1',
      title: 'Suono, Altezza e Intervalli',
      topics: ['Note naturali', 'Diesis e bemolli', 'Tono e semitono', 'Intervalli melodici e armonici', 'Intervalli giusti, maggiori, minori, aumentati, diminuiti'],
      teoria: `La musica è organizzazione del suono nel tempo. Il primo strumento di un musicista è la capacità di nominare e misurare le altezze.

**Le sette note naturali** sono: Do, Re, Mi, Fa, Sol, La, Si. Sull'ottava cromatica ci sono 12 suoni, ottenuti aggiungendo diesis (♯, alzano di un semitono) e bemolli (♭, abbassano di un semitono).

Un **semitono** è la distanza minima tra due note consecutive (ad esempio Do→Do♯). Un **tono** vale due semitoni (Do→Re).

Un **intervallo** è la distanza tra due note. Si misura contando le note incluse e qualificandolo:
- **Intervalli giusti:** unisono, quarta (5 semitoni), quinta (7 semitoni), ottava (12 semitoni)
- **Intervalli maggiori:** seconda (2), terza (4), sesta (9), settima (11 semitoni)
- **Intervalli minori:** seconda (1), terza (3), sesta (8), settima (10 semitoni)
- **Intervalli aumentati/diminuiti:** ottenuti allargando o restringendo di un semitono

**Consonanza e dissonanza:** la quinta giusta e la terza maggiore sono consonanti (suono stabile). Il tritono (6 semitoni, Do→Fa♯) è la massima dissonanza — crea tensione che chiede risoluzione.

**Il rivoltare un intervallo** significa spostare la nota più bassa un'ottava sopra. La regola: maggiore↔minore, aumentato↔diminuito, giusto rimane giusto. La somma vale sempre 9 (una terza maggiore rivoltata = sesta minore).`,
      esempi: `**Intervalli da Do (C):**

- Do→Re = Seconda maggiore (2 semitoni)
- Do→Mi = Terza maggiore (4 semitoni)
- Do→Mi♭ = Terza minore (3 semitoni)
- Do→Fa = Quarta giusta (5 semitoni)
- Do→Fa♯ = Tritono / Quarta aumentata (6 semitoni)
- Do→Sol = Quinta giusta (7 semitoni)
- Do→La = Sesta maggiore (9 semitoni)
- Do→Si♭ = Settima minore (10 semitoni)
- Do→Si = Settima maggiore (11 semitoni)

**Rivolti:**
- Terza maggiore (Do→Mi) rivoltata = Sesta minore (Mi→Do)
- Quinta giusta (Do→Sol) rivoltata = Quarta giusta (Sol→Do)
- Settima minore (Do→Si♭) rivoltata = Seconda maggiore (Si♭→Do)`,
      esercizi: [
        'Costruisci tutti gli intervalli (dalla seconda minore all\'ottava) partendo da ogni nota cromatica.',
        'Rivolta ogni intervallo: scrivi il tipo di intervallo risultante.',
        'Al pianoforte o sulla chitarra, suona e canta: terza maggiore, terza minore, quinta giusta, tritono.',
        'Ear training: ascolta 20 intervalli isolati e identificali senza vedere la tastiera.',
        'Scrivi 5 melodie di 4 note usando solo terze (maggiori o minori).',
      ],
      obiettivo: 'Sapere che Do–Mi è una terza maggiore, Do–Mi♭ è una terza minore, Do–Sol è una quinta giusta e Do–Si♭ è una settima minore, senza dover cercare riferimenti.',
      tools: [
        { tabId: 'quiz',   label: 'Scale Degree Quiz',  icon: '🎯', desc: 'Allena il riconoscimento dei gradi e degli intervalli' },
        { tabId: 'circle', label: 'Circle of Fifths',   icon: '🔵', desc: 'Visualizza le distanze tra note e tonalità' },
      ],
    },
    {
      id: '0.2',
      title: 'Scala Maggiore e Scale Minori',
      topics: ['Struttura della scala maggiore', 'Tonalità e armatura di chiave', 'Circolo delle quinte', 'Scala minore naturale', 'Scala minore armonica', 'Scala minore melodica', 'Relativa maggiore/minore'],
      teoria: `La **scala maggiore** è la spina dorsale di tutta l'armonia occidentale. La sua struttura in toni (T) e semitoni (S) è:

T – T – S – T – T – T – S

In Do maggiore: Do Re Mi Fa Sol La Si Do. Notare che i semitoni cadono tra il 3°–4° grado (Mi–Fa) e il 7°–8° grado (Si–Do).

**Ogni nota può essere la tonica di una scala maggiore.** Costruire Do maggiore non richiede alterazioni; Sol maggiore richiede un Fa♯; Re maggiore Fa♯ e Do♯, e così via. Il **circolo delle quinte** organizza queste relazioni: ogni passo in senso orario aggiunge un diesis, ogni passo antiorario aggiunge un bemolle.

**La scala minore** ha tre varianti:
- **Minore naturale** (o eolio): T–S–T–T–S–T–T. La relativa minore di Do maggiore è La minore naturale (stesse note, tonica diversa).
- **Minore armonica**: come la naturale ma con il 7° grado alzato di un semitono (La–Si♭–Do–Re–Mi–Fa–Sol♯–La in La minore armonica). Questo crea la sensibile che vuole risolvere sulla tonica.
- **Minore melodica** (jazz): come la naturale ma con 6° e 7° alzati nella direzione ascendente. In discesa torna alla naturale nella tradizione classica; nel jazz si usa la forma ascendente anche in discesa — diventa la base di molte scale avanzate.

**Parallela e relativa:** Do maggiore e Do minore sono **parallele** (stessa tonica, armature diverse). Do maggiore e La minore sono **relative** (stessa armatura, toniche diverse).`,
      esempi: `**Scale in Do:**
- Do maggiore: Do Re Mi Fa Sol La Si Do
- La minore naturale: La Si Do Re Mi Fa Sol La
- La minore armonica: La Si Do Re Mi Fa Sol♯ La
- La minore melodica (jazz): La Si Do Re Mi Fa♯ Sol♯ La

**Circolo delle quinte — tonalità con diesis:**
Do (0♯) → Sol (1♯: Fa♯) → Re (2♯: +Do♯) → La → Mi → Si → Fa♯/Sol♭

**Circolo delle quinte — tonalità con bemolli:**
Do (0♭) → Fa (1♭: Si♭) → Si♭ (2♭: +Mi♭) → Mi♭ → La♭ → Re♭ → Sol♭`,
      esercizi: [
        'Costruisci la scala maggiore partendo da tutte e 12 le note cromatiche.',
        'Per ogni scala maggiore, trova la sua relativa minore.',
        'Costruisci la scala minore armonica e melodica a partire da Do, Re, Mi, Fa, Sol.',
        'Memorizza il circolo delle quinte: quanti diesis/bemolli ha ogni tonalità?',
        'Canta la scala maggiore per gradi (Do-Re-Mi-Fa-Sol-La-Si-Do) in almeno 3 tonalità.',
      ],
      obiettivo: 'Costruire qualsiasi scala maggiore o minore senza cercare riferimenti esterni, e capire la relazione tra tonalità attraverso il circolo delle quinte.',
      tools: [
        { tabId: 'scales',     label: 'Scale Recognition', icon: '🔍', desc: 'Identifica una scala dalle sue note' },
        { tabId: 'dictionary', label: 'Scale Dictionary',  icon: '📚', desc: 'Consulta tutte le scale con i loro gradi' },
        { tabId: 'circle',     label: 'Circle of Fifths',  icon: '🔵', desc: 'Esplora visivamente le relazioni tra tonalità' },
      ],
    },
    {
      id: '0.3',
      title: 'Triadi',
      topics: ['Triade maggiore', 'Triade minore', 'Triade diminuita', 'Triade aumentata', 'Rivolti', 'Triadi sui gradi della scala maggiore'],
      teoria: `Una **triade** è un accordo di tre note costruito sovrapponendo due terze. Il tipo di triade dipende dalla combinazione di terze:

- **Triade maggiore:** terza maggiore + terza minore (es. Do–Mi–Sol)
- **Triade minore:** terza minore + terza maggiore (es. Do–Mi♭–Sol)
- **Triade diminuita:** terza minore + terza minore (es. Do–Mi♭–Sol♭)
- **Triade aumentata:** terza maggiore + terza maggiore (es. Do–Mi–Sol♯)

**I rivolti:** una triade può presentarsi in tre posizioni:
- **Stato fondamentale:** la fondamentale al basso (Do–Mi–Sol)
- **Primo rivolto:** la terza al basso (Mi–Sol–Do)
- **Secondo rivolto:** la quinta al basso (Sol–Do–Mi)

**Triadi sui gradi della scala di Do maggiore:**
- I grado: Do maggiore (C)
- II grado: Re minore (Dm)
- III grado: Mi minore (Em)
- IV grado: Fa maggiore (F)
- V grado: Sol maggiore (G) ← la dominante
- VI grado: La minore (Am)
- VII grado: Si diminuita (Bdim)

Questa distribuzione non è arbitraria: nasce direttamente dalla struttura della scala. Solo con triadi si possono già costruire le progressioni più iconiche della musica pop e del jazz di base.`,
      esempi: `**Quattro triadi da Do:**
- C (maggiore): Do Mi Sol
- Cm (minore): Do Mi♭ Sol
- Cdim (diminuita): Do Mi♭ Sol♭
- Caug (aumentata): Do Mi Sol♯

**Progressione I–IV–V–I in Do maggiore:**
C – F – G – C

**Progressione I–vi–ii–V in Do maggiore:**
C – Am – Dm – G

**Progressione ii–V–I in Sol maggiore:**
Am – D – G`,
      esercizi: [
        'Costruisci le quattro triadi (maggiore, minore, diminuita, aumentata) partendo da tutte e 12 le note.',
        'Armonizza la scala di Do maggiore: costruisci la triade su ogni grado.',
        'Suona I–IV–V–I in tutte le tonalità.',
        'Suona I–vi–ii–V in tutte le tonalità.',
        'Impara a riconoscere a orecchio la differenza tra triade maggiore e minore.',
        'Analizza 3 canzoni pop semplici: quali triadi usa? Quali gradi?',
      ],
      obiettivo: 'Capire che gli accordi non sono sigle casuali, ma nascono da scale e intervalli. Saper costruire e suonare qualsiasi triade in qualsiasi tonalità.',
      tools: [
        { tabId: 'harmonization', label: 'Scale Harmony',  icon: '🎶', desc: 'Vedi le triadi su ogni grado di ogni scala' },
        { tabId: 'cadence',       label: 'Cadence Trainer', icon: '🎓', desc: 'Riconosci progressioni armoniche di base' },
      ],
    },
  ],
};

// ─── Livello 2 — Primo Linguaggio Jazz ──────────────────────────────────────

const level2: Level = {
  id: 2,
  phase: 1,
  title: 'Primo Linguaggio Jazz',
  subsections: [
    {
      id: '2.1',
      title: 'Il II-V-I Maggiore',
      topics: ['Funzione del II', 'Funzione del V', 'Risoluzione sul I', 'Guide tones', 'Voice leading minimale'],
      teoria: `Il **II-V-I** è la progressione più importante del jazz tonale. Ogni standard, ogni chorus di blues, ogni cadenza jazz contiene questa sequenza nella sua forma base o in varianti.

In **Do maggiore**: `Dm7 — G7 — Cmaj7`

Perché funziona? Ogni accordo ha una **funzione armonica** specifica:
- **II (Dm7):** funzione di sottodominante — crea movimento verso la dominante
- **V (G7):** funzione di dominante — massima tensione, vuole risolvere sul I
- **I (Cmaj7):** funzione di tonica — riposo, risoluzione

**Le guide tones** sono la terza e la settima di ogni accordo. Sono le note che definiscono la qualità dell'accordo e creano il movimento interno:

- Dm7: terza = **Fa**, settima = **Do**
- G7: settima = **Fa**, terza = **Si** ← il tritono (Fa–Si) crea la tensione
- Cmaj7: terza = **Mi**, settima = **Si**

Osserva cosa succede nel movimento: la **settima di G7 (Fa)** scende di un semitono alla **terza di Cmaj7 (Mi)**. La **terza di G7 (Si)** rimane sul posto come **settima di Cmaj7**. Questo è il **voice leading minimale**: le voci si muovono del minimo possibile.

Il tritono Fa–Si nel G7 è instabile e cerca risoluzione: Fa→Mi (discesa) e Si→Do (salita) oppure Si rimane. Questo dualismo è il motore del jazz tonale.`,
      esempi: `**II-V-I in Do maggiore:**
Dm7 (Re Fa La Do) → G7 (Sol Si Re Fa) → Cmaj7 (Do Mi Sol Si)

**Guide tones del II-V-I in Do:**
Dm7: Fa–Do → G7: Fa–Si → Cmaj7: Mi–Si

**II-V-I in Fa maggiore:**
Gm7 → C7 → Fmaj7

**II-V-I in Si♭ maggiore:**
Cm7 → F7 → B♭maj7

**II-V-I in Sol maggiore:**
Am7 → D7 → Gmaj7

**Shell voicings (fondamentale + terza + settima) in Do:**
Dm7: Re–Fa–Do | G7: Sol–Si–Fa | Cmaj7: Do–Mi–Si`,
      esercizi: [
        'Suona il II-V-I in tutte e 12 le tonalità, usando solo accordi allo stato fondamentale.',
        'Suona solo le guide tones (terza e settima) per ogni accordo del II-V-I — senti il movimento.',
        'Componi 12 frasi melodiche di 4 note che si muovano sulle guide tones di un II-V-I in Do.',
        'Scrivi 3 voicing diversi per ogni accordo del II-V-I (stato fondamentale, primo rivolto, shell voicing).',
        'Trascrivi il II-V-I di "Autumn Leaves" nelle tonalità presenti nel brano.',
      ],
      obiettivo: 'Capire il movimento interno degli accordi, non solo le fondamentali. Sentire come le guide tones si risolvono e creare frasi che ne seguono il movimento.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci e ascolta II-V-I in tutte le tonalità' },
        { tabId: 'voiceleading', label: 'Voice Leading Lab',  icon: '↔️', desc: 'Studia il movimento ottimale delle voci nel II-V-I' },
      ],
    },
    {
      id: '2.2',
      title: 'Il II-V-I Minore',
      topics: ['Scala minore armonica', 'Accordo semidiminuito (m7b5)', 'Dominante alterata in minore', 'mMaj7 e m6 come risoluzione'],
      teoria: `Il **II-V-I minore** usa accordi derivati dalla **scala minore armonica**, e ha un carattere molto diverso dalla versione maggiore — più teso, più ambiguo, più espressivo.

In **Do minore**: `Dm7♭5 — G7 — CmMaj7` oppure `Dm7♭5 — G7♭9 — Cm6`

- **II (Dm7♭5 o Dø):** accordo semidiminuito — nasce dal II grado della scala minore armonica. Ha la quinta diminuita che intensifica la tensione verso la dominante.
- **V (G7, spesso G7♭9 o G7alt):** la scala minore armonica produce un accordo dominante con la nona bemolle (G7♭9), che suona molto più tagliente del G7 diatonico maggiore.
- **I (CmMaj7 o Cm6 o Cm):** la risoluzione minore ha diverse opzioni. `CmMaj7` (Do–Mi♭–Sol–Si) è ricco e ambiguo; `Cm6` (Do–Mi♭–Sol–La) è più luminoso; `Cm7` è più neutro.

**Il dominante alterato:** G7♭9 o G7alt contiene tensioni alterate (♭9, ♯9, ♭13) che creano un senso di urgenza verso la tonica minore. In improvvisazione si usa la **scala alterata** (VII modo della minore melodica) su questi accordi.

La differenza tra jazz minore e pop/blues minore è proprio qui: il jazz usa il dominante alterato e il semidiminuito, creando una tensione cromatica molto più sofisticata.`,
      esempi: `**II-V-I in Do minore (varianti):**
Dm7♭5 → G7♭9 → CmMaj7
Dm7♭5 → G7alt → Cm6
Dm7♭5 → G7 → Cm7

**Note degli accordi:**
- Dm7♭5: Re–Fa–La♭–Do
- G7♭9: Sol–Si–Re–Fa–La♭
- CmMaj7: Do–Mi♭–Sol–Si
- Cm6: Do–Mi♭–Sol–La

**II-V-I minore in La minore:**
Bm7♭5 → E7♭9 → AmMaj7

**II-V-I minore in Re minore:**
Em7♭5 → A7♭9 → DmMaj7`,
      esercizi: [
        'Costruisci il II-V-I minore in tutte e 12 le tonalità.',
        'Confronta: suona Cm7, Cm6 e CmMaj7 come accordi di risoluzione. Ascolta la differenza di colore.',
        'Improvvisa su un II-V-I minore usando solo arpeggi degli accordi.',
        'Analizza "Autumn Leaves" bb. 1-8: identifica i II-V-I minori e maggiori.',
        'Scrivi 4 finali minori diversi per la stessa melodia usando accordi di risoluzione diversi.',
      ],
      obiettivo: 'Distinguere il minore pop/blues dal minore jazz. Capire perché il dominante alterato e il semidiminuito sono fondamentali nel linguaggio jazz.',
      tools: [
        { tabId: 'progressions',  label: 'Chord Progressions', icon: '🎸', desc: 'Ascolta II-V-I maggiori e minori a confronto' },
        { tabId: 'harmonization', label: 'Scale Harmony',      icon: '🎶', desc: 'Vedi gli accordi della scala minore armonica' },
      ],
    },
    {
      id: '2.3',
      title: 'Turnaround',
      topics: ['I–vi–ii–V', 'Dominanti secondarie nel turnaround', 'Accordi diminuiti di passaggio', 'Cromatismi del basso'],
      teoria: `Il **turnaround** è una progressione di 2–4 accordi che si usa per tornare all'inizio di un brano, di un chorus o di una sezione. Nell'armonia jazz il turnaround è anche un laboratorio per sperimentare sostituzioni e varianti.

**Turnaround base in Do maggiore:**
`Cmaj7 — Am7 — Dm7 — G7`  (I–vi–ii–V)

Questa progressione usa il ciclo delle quinte: ogni accordo si muove una quinta sotto (o una quarta sopra) rispetto al successivo. Am7→Dm7 = quinta sotto, Dm7→G7 = quinta sotto, G7→Cmaj7 = quinta sotto.

**Varianti con dominanti secondarie:** sostituendo il vi con un accordo dominante si aggiunge tensione cromatica:
`Cmaj7 — A7 — Dm7 — G7`  (I–VI7–ii–V)
Qui A7 è una dominante secondaria: V7/ii (il quinto grado di Dm). La terza alzata (Do♯) crea un movimento cromatico Do♯→Re.

**Accordi diminuiti di passaggio:**
`Cmaj7 — C♯dim7 — Dm7 — G7`
Il C♯dim7 (Do♯–Mi–Sol–Si♭) si inserisce cromaticamente tra I e II. Funziona come accordo di passaggio perché condivide 3 note con A7♭9 (Do♯–Mi–Sol–Si♭ = A7♭9 senza la fondamentale).

**Cromatismo del basso:** una tecnica efficace è costruire turnaround con basso cromaticamente discendente:
C–B–B♭–A (basso) → Cmaj7–G7/B–Gm7–Gb7–Fmaj7 (esempio di backdoor progressivo).`,
      esempi: `**5 turnaround in Do maggiore:**
1. Cmaj7 – Am7 – Dm7 – G7 (base)
2. Cmaj7 – A7 – Dm7 – G7 (con dominante secondaria)
3. Cmaj7 – C♯dim7 – Dm7 – G7 (con diminuito di passaggio)
4. Cmaj7 – E7 – Am7 – D7 – Dm7 – G7 (espanso)
5. Cmaj7 – A7 – D7 – G7 (catena di dominanti)

**Turnaround da "Autumn Leaves" (in Sol maggiore):**
Gmaj7 – Em7 – Am7 – D7`,
      esercizi: [
        'Scrivi 5 turnaround diversi in Do maggiore. Trasportali poi in tutte le tonalità.',
        'Suona ogni turnaround a tempo di metronomo: prima lento (♩=60), poi a tempo jazz (♩=120).',
        'Crea un\'intro di 4 battute e un finale di 4 battute usando turnaround diversi.',
        'Analizza i turnaround di "Autumn Leaves", "Blue Bossa" e "Satin Doll".',
        'Improvvisa su un turnaround I–vi–ii–V usando solo le note degli accordi (arpeggi).',
      ],
      obiettivo: 'Saper creare movimento armonico interessante anche su due sole battute. Capire come le dominanti secondarie e i diminuiti di passaggio aggiungono direzione.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci turnaround con dominanti secondarie' },
        { tabId: 'landing',      label: 'Chord Landing',      icon: '🎯', desc: 'Trova i migliori approcci cromatici verso ogni accordo' },
      ],
    },
  ],
};

// ─── Livelli 1, 3-17 — Stub (contenuto completo in Piano 2) ─────────────────

const level1: Level = {
  id: 1, phase: 1, title: 'Armonia Tonale di Base',
  subsections: [
    { id: '1.1', title: 'Funzioni Armoniche', topics: ['Tonica', 'Sottodominante', 'Dominante', 'Cadenze'], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: 'Capire tensione e risoluzione.', tools: [{ tabId: 'cadence', label: 'Cadence Trainer', icon: '🎓', desc: 'Riconosci le cadenze' }] },
    { id: '1.2', title: 'Accordi di Settima', topics: ['Maj7', 'm7', '7 dominante', 'm7b5', 'dim7', 'mMaj7'], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: 'Leggere una sigla jazz senza paura.', tools: [{ tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: 'Vedi gli accordi di settima nei vari modi' }] },
    { id: '1.3', title: 'Armonizzazione della Scala Maggiore', topics: ['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viim7b5'], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: 'Vedere la tonalità come sistema di accordi collegati.', tools: [{ tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: '' }] },
  ],
};

function stubLevel(id: number, phase: 1|2|3|4, title: string, subs: Array<{id:string; title:string; topics:string[]; toolTab?: import('./types').Tab; toolLabel?: string; toolIcon?: string}>): Level {
  return {
    id, phase, title,
    subsections: subs.map(s => ({
      id: s.id, title: s.title, topics: s.topics,
      teoria: '// Contenuto completo nel Piano 2',
      esempi: '', esercizi: [],
      obiettivo: 'Vedi Piano 2 per il contenuto completo.',
      tools: s.toolTab ? [{ tabId: s.toolTab, label: s.toolLabel ?? '', icon: s.toolIcon ?? '🔧', desc: '' }] : [],
    })),
  };
}

const level3  = stubLevel(3,  1, 'Dominanti, Tensioni e Alterazioni',
  [{ id:'3.1', title:'Accordi Dominanti',           topics:['Dominante primaria','Dominante secondaria','Backdoor dominant','Altered'], toolTab:'landing', toolLabel:'Chord Landing', toolIcon:'🎯' },
   { id:'3.2', title:'Tensioni Disponibili',         topics:['9','b9','#9','11','#11','13','b13','Avoid notes'], toolTab:'scaleadvisor', toolLabel:'Scale Advisor', toolIcon:'🧭' },
   { id:'3.3', title:'Chord-Scale Theory',           topics:['Modi','Altered','Lydian dominant','Diminished','Whole tone','Bebop'], toolTab:'scaleadvisor', toolLabel:'Scale Advisor', toolIcon:'🧭' }]);

const level4  = stubLevel(4,  2, 'Voicing Jazz',
  [{ id:'4.1', title:'Shell Voicings',               topics:['Fondamentale','Terza','Settima','Omissione quinta'], toolTab:'voicings', toolLabel:'Piano Voicings', toolIcon:'🎹' },
   { id:'4.2', title:'Rootless Voicings',            topics:['Posizione A e B','Stile Bill Evans','Mano sinistra'], toolTab:'voicings', toolLabel:'Piano Voicings', toolIcon:'🎹' },
   { id:'4.3', title:'Drop 2, Drop 3 e Block Chords',topics:['Disposizione aperta','Drop 2','Harmonized melody'], toolTab:'voicings', toolLabel:'Piano Voicings', toolIcon:'🎹' },
   { id:'4.4', title:'Upper Structure Triads',       topics:['Triadi sopra dominanti','Polychord notation'], toolTab:'voicings', toolLabel:'Piano Voicings', toolIcon:'🎹' }]);

const level5  = stubLevel(5,  2, 'Blues, Rhythm Changes e Forme Jazz',
  [{ id:'5.1', title:'Blues Jazz',                   topics:['Jazz blues','Quick change','Bebop blues','Parker blues'], toolTab:'progressions', toolLabel:'Chord Progressions', toolIcon:'🎸' },
   { id:'5.2', title:'Rhythm Changes',               topics:['Forma AABA','Bridge a dominanti','Sostituzioni bebop'] },
   { id:'5.3', title:'Standard Jazz',                topics:['Autumn Leaves','All The Things You Are','Giant Steps'], toolTab:'analysis', toolLabel:'Harmonic Analysis', toolIcon:'🔬' }]);

const level6  = stubLevel(6,  2, 'Armonia Minore Avanzata',
  [{ id:'6.1', title:'Minore Naturale, Armonico e Melodico', topics:['Accordi da minore armonico','Accordi da minore melodico','MinMaj7'], toolTab:'harmonization', toolLabel:'Scale Harmony', toolIcon:'🎶' },
   { id:'6.2', title:'Accordi Diminuiti',            topics:['Passing chord','Leading-tone','Scala diminuita'], toolTab:'harmonization', toolLabel:'Scale Harmony', toolIcon:'🎶' }]);

const level7  = stubLevel(7,  2, 'Sostituzioni Armoniche',
  [{ id:'7.1', title:'Tritone Substitution',         topics:['Sub V','Movimento cromatico del basso','Lydian dominant'], toolTab:'progressions', toolLabel:'Chord Progressions', toolIcon:'🎸' },
   { id:'7.2', title:'Dominanti Secondarie',         topics:['V/V','V/ii','Backcycling','Ciclo delle quinte'] },
   { id:'7.3', title:'Modal Interchange',            topics:['Prestito modale','bVIImaj7','bVImaj7','ivm','Backdoor'], toolTab:'modal', toolLabel:'Modal Interchange', toolIcon:'🔄' },
   { id:'7.4', title:'Sostituzioni Funzionali',      topics:['Relative minor','Medianti cromatiche','Side-slipping'] }]);

const level8  = stubLevel(8,  3, 'Reharmonization',
  [{ id:'8.1', title:'Reharmonization di Base',      topics:['Procedura 7 passi','Note melodica come guida'] },
   { id:'8.2', title:'Reharmonization Intermedia',   topics:['Slash chords','Pivot chords','II-V concatenati'] },
   { id:'8.3', title:'Reharmonization Avanzata',     topics:['Coltrane changes','Constant structure','Parallel harmony'] }]);

const level9  = stubLevel(9,  3, 'Armonia Modale',
  [{ id:'9.1', title:'Modi della Scala Maggiore',    topics:['Ionian','Dorian','Phrygian','Lydian','Mixolydian','Aeolian','Locrian'], toolTab:'modal', toolLabel:'Modal Interchange', toolIcon:'🔄' },
   { id:'9.2', title:'Modi della Minore Melodica',   topics:['Altered','Lydian dominant','Locrian natural 2'], toolTab:'scaleadvisor', toolLabel:'Scale Advisor', toolIcon:'🧭' },
   { id:'9.3', title:'Armonia Modale Moderna',       topics:['Slash chords','Accordi quartali','Accordi sus','Triadi sovrapposte'] }]);

const level10 = stubLevel(10, 3, 'Armonia Cromatica e Non Funzionale',
  [{ id:'10.1', title:'Chromatic Mediants',           topics:['Accordi a distanza di terza','Uso cinematografico','Fusion'] },
   { id:'10.2', title:'Constant Structure Harmony',   topics:['Parallel maj7','Parallel m9','Planing'] },
   { id:'10.3', title:'Polychords e Slash Chords',    topics:['Ambiguità tonale','Basso indipendente'] },
   { id:'10.4', title:'Armonia Negativa',             topics:['Inversione degli intervalli','Asse di riflessione','Ernst Levy','Jacob Collier'] }]);

const level11 = stubLevel(11, 3, 'Coltrane Changes e Simmetria',
  [{ id:'11.1', title:'Giant Steps e Cicli Simmetrici', topics:['Tre centri tonali','Terze maggiori','Countdown'] },
   { id:'11.2', title:'Scale Simmetriche',              topics:['Scala diminuita','Scala esatonale','Triadi aumentate'] }]);

const level12 = stubLevel(12, 4, 'Neo-soul, Gospel, Fusion e Contemporary Jazz',
  [{ id:'12.1', title:'Neo-soul Harmony',             topics:['6/9','13sus','Minor plagal cadence','Quartal voicings'] },
   { id:'12.2', title:'Gospel Harmony',               topics:['Plagal movement','Shout chords','Walk-up/down'] },
   { id:'12.3', title:'Fusion e Contemporary Jazz',   topics:['Triadic pairs','Armonia modale','Tensioni non risolte'] }]);

const level13 = stubLevel(13, 4, 'Armonizzazione Melodica',
  [{ id:'13.1', title:'Harmonizing a Melody',         topics:['Nota come fondamentale','Terza','Quinta','Settima','Tensione'] },
   { id:'13.2', title:'Armonizzazione a 4, 5 e 6 Parti', topics:['SATB','Drop voicings','Line cliché','Cluster'] }]);

const level14 = stubLevel(14, 4, 'Analisi Armonica Avanzata',
  [{ id:'14.1', title:'Analisi di Standard',          topics:['Autumn Leaves','Giant Steps','Dolphin Dance','Body and Soul'], toolTab:'analysis', toolLabel:'Harmonic Analysis', toolIcon:'🔬' },
   { id:'14.2', title:'Analisi di Brani Moderni',     topics:['Wayne Shorter','Jacob Collier','Snarky Puppy','Robert Glasper'] }]);

const level15 = stubLevel(15, 4, 'Ear Training Armonico',
  [{ id:'15.1', title:'Riconoscimento Accordi',       topics:['Maj7','m7','7','m7b5','dim7','sus','7alt'], toolTab:'eartrainingpro', toolLabel:'Ear Training Pro', toolIcon:'👂' },
   { id:'15.2', title:'Riconoscimento Progressioni',  topics:['II-V-I','Blues','Rhythm changes','Coltrane changes'], toolTab:'cadence', toolLabel:'Cadence Trainer', toolIcon:'🎓' }]);

const level16 = stubLevel(16, 4, 'Composizione e Applicazione Pratica',
  [{ id:'16.1', title:'Scrittura di Progressioni',   topics:['Da diatonica a modale','Neo-soul','Fusion','Outside'], toolTab:'progressions', toolLabel:'Chord Progressions', toolIcon:'🎸' },
   { id:'16.2', title:'Riarmonizzare un Brano Proprio', topics:['4 versioni: semplice, jazz, moderna, estrema'] }]);

const level17 = stubLevel(17, 4, 'Arrangiamento Armonico per Band',
  [{ id:'17.1', title:'Distribuzione Armonica tra Strumenti', topics:['Basso','Piano/Rhodes','Chitarra','Fiati','Voce'], toolTab:'arrangement', toolLabel:'Arrangement Blueprint', toolIcon:'🎼' },
   { id:'17.2', title:'Armonia per Sezione Fiati',   topics:['Drop 2 per fiati','Solis','Background figures','Shout chorus'] }]);

// ─── Export ──────────────────────────────────────────────────────────────────

export const ALL_LEVELS: Level[] = [
  level0, level1, level2, level3, level4, level5, level6,
  level7, level8, level9, level10, level11, level12, level13,
  level14, level15, level16, level17,
];
```

---

### Task 4: Componente LessonView

**Files:**
- Create: `src/features/harmonia-course/LessonView.tsx`

- [ ] **Step 4.1: Crea `LessonView.tsx`**

```typescript
import { useState } from 'react';
import type { Level, Subsection } from './data/types';
import { getCompletedLessons, markLessonComplete, markLessonIncomplete } from './data/types';

type LessonTab = 'teoria' | 'esempi' | 'esercizi' | 'strumenti';

interface Props {
  level: Level;
  subsection: Subsection;
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

function renderContent(text: string) {
  if (!text || text.startsWith('//')) return (
    <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Contenuto in arrivo — Piano 2.</p>
  );
  return text.split('\n\n').map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} style={{ marginBottom: '1em', lineHeight: 1.85 }}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('`') && part.endsWith('`'))
            return (
              <code key={j} style={{
                background: 'rgba(124,58,237,0.12)', color: '#c4b5fd',
                padding: '1px 7px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: '0.9em',
              }}>{part.slice(1, -1)}</code>
            );
          return part;
        })}
      </p>
    );
  });
}

export default function LessonView({ level, subsection, onBack, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<LessonTab>('teoria');
  const [completed, setCompleted] = useState(() => getCompletedLessons().has(subsection.id));

  function toggleComplete() {
    if (completed) {
      markLessonIncomplete(subsection.id);
    } else {
      markLessonComplete(subsection.id);
    }
    setCompleted(c => !c);
  }

  const tabs: { id: LessonTab; label: string; badge?: number }[] = [
    { id: 'teoria',    label: 'Teoria' },
    { id: 'esempi',    label: 'Esempi' },
    { id: 'esercizi',  label: 'Esercizi', badge: subsection.esercizi.length || undefined },
    { id: 'strumenti', label: 'Strumenti', badge: subsection.tools.length || undefined },
  ];

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6b7280', fontSize: 13, marginBottom: 20, padding: 0,
        }}
      >
        ← Tutti i livelli
      </button>

      {/* Header */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 16,
        overflow: 'hidden', marginBottom: 0,
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #21262d' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#7c3aed',
            letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Livello {level.id} · {level.title}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            {subsection.id} — {subsection.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {subsection.topics.map(t => (
              <span key={t} style={{
                background: '#1c2128', border: '1px solid #30363d',
                borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#8b949e',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #21262d',
          background: '#161b22', overflowX: 'auto',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#7c3aed' : 'transparent'}`,
                color: activeTab === tab.id ? '#c4b5fd' : '#6b7280',
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color .15s',
              }}
            >
              {tab.label}
              {tab.badge ? (
                <span style={{
                  background: '#7c3aed', color: '#fff',
                  fontSize: 10, padding: '1px 5px', borderRadius: 10,
                }}>{tab.badge}</span>
              ) : null}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Complete toggle */}
          <button
            onClick={toggleComplete}
            style={{
              margin: '8px 16px',
              padding: '5px 14px',
              background: completed ? 'rgba(16,185,129,.15)' : 'rgba(124,58,237,.08)',
              border: `1px solid ${completed ? 'rgba(16,185,129,.4)' : 'rgba(124,58,237,.3)'}`,
              borderRadius: 8, cursor: 'pointer',
              color: completed ? '#10b981' : '#8b949e',
              fontSize: 11, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            {completed ? '✓ Completato' : 'Segna come completato'}
          </button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px', fontSize: 14, color: '#e6edf3', minHeight: 300 }}>
          {activeTab === 'teoria' && (
            <div>{renderContent(subsection.teoria)}</div>
          )}

          {activeTab === 'esempi' && (
            <div>
              {subsection.esempi
                ? renderContent(subsection.esempi)
                : <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Esempi in arrivo — Piano 2.</p>
              }
            </div>
          )}

          {activeTab === 'esercizi' && (
            <div>
              {subsection.esercizi.length === 0
                ? <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Esercizi in arrivo — Piano 2.</p>
                : (
                  <ol style={{ paddingLeft: 20 }}>
                    {subsection.esercizi.map((e, i) => (
                      <li key={i} style={{ marginBottom: 12, lineHeight: 1.7 }}>{e}</li>
                    ))}
                  </ol>
                )
              }
            </div>
          )}

          {activeTab === 'strumenti' && (
            <div>
              {subsection.tools.length === 0
                ? <p style={{ color: '#4b5563' }}>Nessuno strumento collegato per questo argomento.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      {subsection.tools.length} strument{subsection.tools.length === 1 ? 'o collegato' : 'i collegati'} a questo argomento:
                    </p>
                    {subsection.tools.map(tool => (
                      <div key={tool.tabId} style={{
                        background: '#1c2128', border: '1px solid #30363d', borderRadius: 12,
                        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{tool.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{tool.label}</div>
                          {tool.desc && (
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{tool.desc}</div>
                          )}
                        </div>
                        <button
                          onClick={() => onNavigate(tool.tabId)}
                          style={{
                            background: '#7c3aed', color: '#fff',
                            border: 'none', borderRadius: 8,
                            padding: '7px 16px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Apri →
                        </button>
                      </div>
                    ))}
                  </div>
                )
              }
              {/* Obiettivo */}
              {subsection.obiettivo && (
                <div style={{
                  marginTop: 24, padding: '12px 16px',
                  background: 'rgba(16,185,129,.08)',
                  border: '1px solid rgba(16,185,129,.25)',
                  borderRadius: 10, fontSize: 13, color: '#10b981',
                }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Obiettivo</strong>
                  {subsection.obiettivo}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Obiettivo box (always visible on teoria tab) */}
      {activeTab === 'teoria' && subsection.obiettivo && (
        <div style={{
          marginTop: 16, padding: '12px 18px',
          background: 'rgba(16,185,129,.08)',
          border: '1px solid rgba(16,185,129,.25)',
          borderRadius: 10, fontSize: 13, color: '#10b981',
        }}>
          <strong>Obiettivo:</strong> {subsection.obiettivo}
        </div>
      )}
    </div>
  );
}
```

---

### Task 5: Componente HarmoniaDashboard

**Files:**
- Create: `src/features/harmonia-course/HarmoniaDashboard.tsx`

- [ ] **Step 5.1: Crea `HarmoniaDashboard.tsx`**

```typescript
import { useState, useEffect } from 'react';
import type { Level } from './data/types';
import { ALL_LEVELS, PHASE_META, getCompletedLessons } from './data/types';

interface Props {
  onSelectLesson: (level: Level, subsectionIdx: number) => void;
}

function LevelCard({ level, onSelect, completedIds }: {
  level: Level;
  onSelect: (subsectionIdx: number) => void;
  completedIds: Set<string>;
}) {
  const totalSubs = level.subsections.length;
  const completedCount = level.subsections.filter(s => completedIds.has(s.id)).length;
  const isFullyDone = completedCount === totalSubs && totalSubs > 0;
  const isPartial = completedCount > 0 && !isFullyDone;

  const toolTabs = [...new Set(
    level.subsections.flatMap(s => s.tools.map(t => ({ icon: t.icon, label: t.label })))
  )].slice(0, 3);

  return (
    <div
      onClick={() => onSelect(0)}
      style={{
        background: '#1c2128',
        border: `1px solid ${isFullyDone ? 'rgba(16,185,129,.4)' : '#30363d'}`,
        borderRadius: 12, padding: '14px', cursor: 'pointer',
        transition: 'border-color .15s, transform .1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = isFullyDone ? 'rgba(16,185,129,.4)' : '#30363d')}
    >
      <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 700, marginBottom: 4 }}>
        Livello {level.id}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#e6edf3',
        lineHeight: 1.4, marginBottom: 6,
      }}>
        {level.title}
      </div>
      <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>
        {level.subsections.slice(0, 3).map(s => s.title).join(' · ')}
        {level.subsections.length > 3 ? ' …' : ''}
      </div>
      {toolTabs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {toolTabs.map((t, i) => (
            <span key={i} style={{
              background: 'rgba(124,58,237,.1)', color: '#c4b5fd',
              fontSize: 9, padding: '2px 6px', borderRadius: 8,
            }}>{t.icon} {t.label}</span>
          ))}
        </div>
      )}
      {/* Progress bar */}
      <div style={{ background: '#21262d', borderRadius: 2, height: 3 }}>
        <div style={{
          height: 3, borderRadius: 2,
          background: isFullyDone ? '#10b981' : isPartial ? '#7c3aed' : 'transparent',
          width: `${totalSubs > 0 ? (completedCount / totalSubs) * 100 : 0}%`,
          transition: 'width .3s',
        }} />
      </div>
    </div>
  );
}

export default function HarmoniaDashboard({ onSelectLesson }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompletedIds(getCompletedLessons());
    const handler = () => setCompletedIds(getCompletedLessons());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const phases = ([1, 2, 3, 4] as const);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#e6edf3',
          fontFamily: "'Syne', sans-serif", margin: '0 0 8px',
        }}>
          Corso di Armonia Jazz Moderna
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
          Percorso progressivo in 18 livelli — dal solfeggio di base ai Coltrane changes,<br />
          armonia modale, neo-soul, reharmonization e arrangiamento per band.
        </p>
      </div>

      {/* Phases */}
      {phases.map(phase => {
        const meta = PHASE_META[phase];
        const levels = ALL_LEVELS.filter(l => l.phase === phase);
        const totalSubs = levels.flatMap(l => l.subsections).length;
        const completedSubs = levels.flatMap(l => l.subsections).filter(s => completedIds.has(s.id)).length;

        return (
          <div key={phase} style={{ marginBottom: 36 }}>
            {/* Phase header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              marginBottom: 14,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#7c3aed',
                letterSpacing: '.1em', textTransform: 'uppercase',
              }}>
                ◆ Fase {phase} — {meta.title}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>
                {meta.levelRange} · {meta.duration}
              </div>
              {completedSubs > 0 && (
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>
                  {completedSubs}/{totalSubs} sezioni completate
                </div>
              )}
            </div>

            {/* Level cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(levels.length, 4)}, 1fr)`,
              gap: 10,
            }}>
              {levels.map(level => (
                <LevelCard
                  key={level.id}
                  level={level}
                  completedIds={completedIds}
                  onSelect={idx => onSelectLesson(level, idx)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Resources footer */}
      <div style={{
        marginTop: 16, padding: '16px 20px',
        background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
        fontSize: 12, color: '#4b5563', lineHeight: 1.8,
      }}>
        <strong style={{ color: '#6b7280' }}>Libri di riferimento:</strong>{' '}
        Mark Levine — The Jazz Theory Book · Barrie Nettles / Richard Graf — The Chord Scale Theory & Jazz Harmony · David Berkman — The Jazz Harmony Book · Randy Felts — Reharmonization Techniques
      </div>
    </div>
  );
}
```

---

### Task 6: Entry Point HarmoniaCourseFeature

**Files:**
- Create: `src/features/harmonia-course/HarmoniaCourseFeature.tsx`

- [ ] **Step 6.1: Crea `HarmoniaCourseFeature.tsx`**

```typescript
import { useState } from 'react';
import type { Tab } from '../../App';
import type { Level, Subsection } from './data/types';
import HarmoniaDashboard from './HarmoniaDashboard';
import LessonView from './LessonView';

interface Props {
  onNavigate: (tab: Tab) => void;
}

interface ActiveLesson {
  level: Level;
  subsection: Subsection;
}

export default function HarmoniaCourseFeature({ onNavigate }: Props) {
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);

  function handleSelectLesson(level: Level, subsectionIdx: number) {
    const subsection = level.subsections[subsectionIdx];
    if (subsection) setActiveLesson({ level, subsection });
  }

  function handleBack() {
    setActiveLesson(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (activeLesson) {
    return (
      <LessonView
        level={activeLesson.level}
        subsection={activeLesson.subsection}
        onBack={handleBack}
        onNavigate={tab => onNavigate(tab as Tab)}
      />
    );
  }

  return <HarmoniaDashboard onSelectLesson={handleSelectLesson} />;
}
```

---

### Task 7: Build finale e verifica browser

**Files:** nessuno — verifica

- [ ] **Step 7.1: Build TypeScript**

```bash
npm run build
```

Atteso: `✓ built in X.XXs` — nessun errore TypeScript, nessun warning ESLint.

Se vedi errori di tipo su `Tab`, verifica che in `App.tsx` il tipo sia `export type Tab = ...` (con `export`).

Se vedi `Cannot find module './data/types'`, verifica i path in `HarmoniaCourseFeature.tsx` e `LessonView.tsx`.

- [ ] **Step 7.2: Avvia il dev server**

```bash
npm run dev
```

- [ ] **Step 7.3: Checklist browser**

Apri http://localhost:3000 e verifica:

1. **Navigazione:** il menu "Theory" si chiama ora "Armonia". Come primo item appare "Corso di Armonia 📚".
2. **Dashboard:** cliccando "Corso di Armonia" si vede la dashboard con le 4 fasi e le card dei 18 livelli.
3. **Livello 0:** la card del Livello 0 è cliccabile. Apre la sezione 0.1 con contenuto completo (Teoria / Esempi / Esercizi / Strumenti visibili e funzionanti).
4. **Livello 2:** la card del Livello 2 apre la sezione 2.1 (II-V-I Maggiore) con contenuto completo.
5. **Tab switch:** passare tra Teoria, Esempi, Esercizi, Strumenti funziona correttamente.
6. **Strumenti:** cliccando "Apri →" su un tool card (es. Chord Progressions) si naviga al tool corretto.
7. **Progress:** cliccando "Segna come completato" su Lv 0.1, tornando alla dashboard, la barra progress del Livello 0 diventa verde.
8. **Refresh:** il progresso persiste dopo refresh della pagina (localStorage).
9. **Altri livelli:** le card degli altri livelli (es. Lv 5) mostrano il messaggio "Contenuto in arrivo — Piano 2."

- [ ] **Step 7.4: Commit**

```bash
git add src/App.tsx src/features/harmonia-course/
git commit -m "$(cat <<'EOF'
feat(harmonia-course): add Armonia section shell with 18-level dashboard

New feature: full harmony course navigator. Navigation group Theory renamed
to Armonia with new Corso di Armonia entry. Dashboard shows 4 macro-phases
with all 18 level cards, localStorage progress tracking, and full lesson
view (Teoria/Esempi/Esercizi/Strumenti tabs). Levels 0 and 2 have complete
Italian content; remaining levels are stubs pending Piano 2.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- ✅ Navigazione Theory→Armonia con Corso di Armonia come primo item
- ✅ Dashboard 4 fasi con griglia card livelli
- ✅ Lesson view con 4 tab (Teoria/Esempi/Esercizi/Strumenti)
- ✅ Tab Strumenti con card "Apri →"
- ✅ Progress tracking localStorage
- ✅ `onNavigate` prop `(tab: Tab) => void`
- ✅ 18 livelli presenti (stub + 2 completi)
- ⏳ Contenuto completo dei 18 livelli → Piano 2

**Placeholder scan:** nessun TODO/TBD — gli stub usano il commento `// Contenuto completo nel Piano 2` che è una nota tecnica, non un placeholder di design.

**Type consistency:**
- `Level`, `Subsection`, `ToolLink` definiti in `types.ts` e usati coerentemente in tutti i componenti
- `getCompletedLessons` / `markLessonComplete` / `markLessonIncomplete` importati da `types.ts` con firme consistenti
- `Tab` esportato da `App.tsx`, importato in `HarmoniaCourseFeature.tsx` e `types.ts`

---

*Fine Piano 1. Il Piano 2 coprirà il contenuto completo di tutti i 18 livelli.*

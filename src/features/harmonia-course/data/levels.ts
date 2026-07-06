import type { Level } from './types';
import type { Tab } from '@shared/types/navigation.types';

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
        { tabId: 'harmonization', label: 'Scale Harmony',   icon: '🎶', desc: 'Vedi le triadi su ogni grado di ogni scala' },
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

In **Do maggiore**: \`Dm7 — G7 — Cmaj7\`

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

In **Do minore**: \`Dm7♭5 — G7 — CmMaj7\` oppure \`Dm7♭5 — G7♭9 — Cm6\`

- **II (Dm7♭5 o Dø):** accordo semidiminuito — nasce dal II grado della scala minore armonica. Ha la quinta diminuita che intensifica la tensione verso la dominante.
- **V (G7, spesso G7♭9 o G7alt):** la scala minore armonica produce un accordo dominante con la nona bemolle (G7♭9), che suona molto più tagliente del G7 diatonico maggiore.
- **I (CmMaj7 o Cm6 o Cm):** la risoluzione minore ha diverse opzioni. \`CmMaj7\` (Do–Mi♭–Sol–Si) è ricco e ambiguo; \`Cm6\` (Do–Mi♭–Sol–La) è più luminoso; \`Cm7\` è più neutro.

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
\`Cmaj7 — Am7 — Dm7 — G7\`  (I–vi–ii–V)

Questa progressione usa il ciclo delle quinte: ogni accordo si muove una quinta sotto (o una quarta sopra) rispetto al successivo. Am7→Dm7 = quinta sotto, Dm7→G7 = quinta sotto, G7→Cmaj7 = quinta sotto.

**Varianti con dominanti secondarie:** sostituendo il vi con un accordo dominante si aggiunge tensione cromatica:
\`Cmaj7 — A7 — Dm7 — G7\`  (I–VI7–ii–V)
Qui A7 è una dominante secondaria: V7/ii (il quinto grado di Dm). La terza alzata (Do♯) crea un movimento cromatico Do♯→Re.

**Accordi diminuiti di passaggio:**
\`Cmaj7 — C♯dim7 — Dm7 — G7\`
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
  id: 1,
  phase: 1,
  title: 'Armonia Tonale di Base',
  subsections: [
    {
      id: '1.1',
      title: 'Funzioni Armoniche',
      topics: ['Tonica', 'Sottodominante', 'Dominante', 'Cadenze'],
      teoria: `Le **funzioni armoniche** sono i ruoli che ogni accordo svolge all'interno di una tonalità. Non è il nome dell'accordo a contare, ma la sua relazione con la tonica.

In una tonalità ci sono tre funzioni fondamentali:
- **Tonica (T):** stabilità, riposo, "casa". In Do maggiore: \`Cmaj7\`, \`Em7\`, \`Am7\`. Questi accordi condividono note chiave con la tonica e non creano tensione interna.
- **Sottodominante (SD):** movimento e transizione. In Do: \`Dm7\`, \`Fmaj7\`. Allontanano dalla tonica senza creare tensione risoluta verso di essa.
- **Dominante (D):** massima tensione, vuole risolvere sulla tonica. In Do: \`G7\`, \`Bm7b5\`. Il tritono interno (Si–Fa) è il motore della risoluzione.

Le **cadenze** sono i movimenti che definiscono la punteggiatura armonica:
- **Perfetta (V→I):** la più forte, conclude una sezione
- **Plagale (IV→I):** morbida e conclusiva, tipica del gospel
- **Evitata (V→VI):** sorpresa, mantiene il movimento in sospeso
- **Sospesa (I→V):** apre una domanda senza rispondervi

Il **movimento per quarte e quinte** è alla base dell'armonia funzionale: gli accordi si muovono in modo più naturale quando le fondamentali si spostano di una quarta sopra o di una quinta sotto.`,
      esempi: `**Funzioni armoniche in Do maggiore:**
- Tonica: \`Cmaj7\` (Do Mi Sol Si), \`Em7\` (Mi Sol Si Re), \`Am7\` (La Do Mi Sol)
- Sottodominante: \`Dm7\` (Re Fa La Do), \`Fmaj7\` (Fa La Do Mi)
- Dominante: \`G7\` (Sol Si Re Fa), \`Bm7b5\` (Si Re Fa La)

**Cadenze in Do maggiore:**
- Perfetta: G7 → Cmaj7
- Plagale: Fmaj7 → Cmaj7
- Evitata: G7 → Am7
- Sospesa: Cmaj7 → G7

**Movimento per quinte:**
G7 → Cmaj7 → Fmaj7 → B♭maj7 (ogni accordo scende di quinta)`,
      esercizi: [
        'Analizza 3 brani pop o jazz: assegna la funzione armonica (T, SD, D) a ogni accordo.',
        'Suona le quattro cadenze (perfetta, plagale, evitata, sospesa) in Do, Sol, Fa e Re maggiore.',
        'Ear training: ascolta 10 cadenze e identifica il tipo senza guardare la partitura.',
        'Scrivi una progressione di 8 battute usando le tre funzioni nell\'ordine T → SD → D → T.',
        'Improvvisa sopra un vamp G7–Cmaj7 ripetuto: senti come la melodia cerca la tonica.',
      ],
      obiettivo: 'Assegnare la funzione armonica (tonica, sottodominante, dominante) a qualsiasi accordo diatonico e riconoscere a orecchio le quattro cadenze fondamentali.',
      tools: [
        { tabId: 'cadence', label: 'Cadence Trainer', icon: '🎓', desc: 'Allenati a riconoscere cadenze perfette, plagali, evitate e sospese in tempo reale, collegando l\'ascolto alla teoria' },
      ],
    },
    {
      id: '1.2',
      title: 'Accordi di Settima',
      topics: ['Maj7', 'm7', '7 dominante', 'm7b5', 'dim7', 'mMaj7'],
      teoria: `Un **accordo di settima** è una triade con una quarta nota aggiunta: la settima. La qualità della settima combinata con la qualità della triade genera sei tipi fondamentali — la grammatica di base del jazz.

- \`Maj7\` (Do–Mi–Sol–Si): triade maggiore + settima maggiore. Suono caldo e luminoso. Funzione di tonica nel jazz.
- \`m7\` (Do–Mi♭–Sol–Si♭): triade minore + settima minore. Morbido e versatile, il più comune nel jazz.
- \`7dom\` (Do–Mi–Sol–Si♭): triade maggiore + settima minore. Il tritono Mi–Si♭ crea la tensione dominante caratteristica.
- \`m7♭5\` (Do–Mi♭–Sol♭–Si♭): triade diminuita + settima minore. Il semidiminuito, tipico del II grado in tonalità minore.
- \`dim7\` (Do–Mi♭–Sol♭–La): triade diminuita + settima diminuita. Completamente simmetrico (solo terze minori), usato come accordo di passaggio.
- \`mMaj7\` (Do–Mi♭–Sol–Si): triade minore + settima maggiore. Ambiguo e teso, tipico della scala minore armonica.

**Tipi addizionali:** \`7sus4\` (quarta al posto della terza), \`6\` e \`m6\` (sesta al posto della settima), \`add9\` (nona senza settima).`,
      esempi: `**Sei tipi di accordi di settima da Do:**
- \`Cmaj7\`: Do–Mi–Sol–Si
- \`Cm7\`: Do–Mi♭–Sol–Si♭
- \`C7\`: Do–Mi–Sol–Si♭ (dominante)
- \`Cm7♭5\`: Do–Mi♭–Sol♭–Si♭ (semidiminuito)
- \`Cdim7\`: Do–Mi♭–Sol♭–La (simmetrico)
- \`CmMaj7\`: Do–Mi♭–Sol–Si

**Come riconoscere a orecchio:**
\`Cmaj7\` ha la settima che brilla sopra. \`C7\` suona teso e vuole risolvere. \`Cm7♭5\` è cupo e instabile. \`Cdim7\` crea tensione in tutte le direzioni. \`CmMaj7\` è inquietante e ambiguo.`,
      esercizi: [
        'Costruisci tutti e sei i tipi di accordo di settima partendo da ogni nota cromatica (72 accordi totali).',
        'Al pianoforte: suona Cmaj7, Cm7, C7, Cm7b5, Cdim7, CmMaj7 in successione. Descrivi con una parola il colore di ciascuno.',
        'Ear training: ascolta 20 esempi randomizzati dei sei tipi e identifica la qualità senza vedere la tastiera.',
        'Trasporta Dm7–G7–Cmaj7 in tutte e 12 le tonalità, costruendo ogni accordo nota per nota.',
        'Scrivi una progressione di 8 accordi che usi almeno 5 dei 6 tipi di accordo di settima.',
      ],
      obiettivo: 'Costruire, suonare e riconoscere a orecchio tutti i sei tipi fondamentali di accordo di settima, sapendo quali intervalli li definiscono e quale colore sonoro esprimono.',
      tools: [
        { tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: 'Esplora gli accordi di settima generati su ogni grado di scala, inclusi i tipi esotici come mMaj7 e m7♭5' },
      ],
    },
    {
      id: '1.3',
      title: 'Armonizzazione della Scala Maggiore',
      topics: ['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viim7b5'],
      teoria: `**Armonizzare la scala maggiore** significa costruire un accordo di settima su ogni grado usando esclusivamente le note della scala. Il risultato è un sistema di sette accordi collegati, ognuno con una funzione armonica precisa.

In **Do maggiore**, la formula è fissa e si trasporta identica in tutte le 12 tonalità:
\`Imaj7 – IIm7 – IIIm7 – IVmaj7 – V7 – VIm7 – VIIm7♭5\`

- **I (Cmaj7):** tonica principale, punto di riposo
- **II (Dm7):** sottodominante, prepara la dominante
- **III (Em7):** funzione di tonica (condivide tre note con Cmaj7)
- **IV (Fmaj7):** sottodominante — attenzione: la 4ª (Fa) è avoid note su Imaj7
- **V (G7):** l'unico accordo dominante diatonico della tonalità
- **VI (Am7):** tonica relativa minore, ottimo punto di fuga
- **VII (Bm7♭5):** funzione di dominante senza fondamentale, raramente stabile

Memorizzare questa formula è il primo passo per improvvisare e comporre con consapevolezza tonale. Ogni accordo non è isolato — è un nodo di una rete in cui tensione e riposo si alternano.`,
      esempi: `**Armonizzazione di Do maggiore:**
- I: \`Cmaj7\` – Do Mi Sol Si
- II: \`Dm7\` – Re Fa La Do
- III: \`Em7\` – Mi Sol Si Re
- IV: \`Fmaj7\` – Fa La Do Mi
- V: \`G7\` – Sol Si Re Fa
- VI: \`Am7\` – La Do Mi Sol
- VII: \`Bm7♭5\` – Si Re Fa La

**Progressioni diatoniche in Do maggiore:**
- I–IV–V–I: Cmaj7 → Fmaj7 → G7 → Cmaj7
- I–vi–ii–V: Cmaj7 → Am7 → Dm7 → G7
- iii–vi–ii–V: Em7 → Am7 → Dm7 → G7`,
      esercizi: [
        'Armonizza tutte le 12 scale maggiori: scrivi i 7 accordi di settima per ognuna.',
        'Suona l\'armonizzazione di Do maggiore con rivolti: I stato fondamentale, II primo rivolto, III secondo rivolto, ecc.',
        'Canta la fondamentale di ogni accordo mentre suoni l\'armonizzazione al pianoforte.',
        'Scrivi 4 progressioni di 4 accordi usando solo accordi diatonici di Do maggiore. Analizzale con i numeri romani.',
        'Ear training: ascolta una progressione diatonica e identifica i gradi romani.',
        'Improvvisa su I–vi–ii–V usando solo arpeggi (nessuna scala): entra dentro il colore di ogni accordo.',
      ],
      obiettivo: 'Sapere a memoria la formula Imaj7–IIm7–IIIm7–IVmaj7–V7–VIm7–VIIm7♭5 e costruirla in qualsiasi tonalità, riconoscendo la funzione armonica di ogni grado.',
      tools: [
        { tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: 'Visualizza gli accordi di settima su ogni grado di qualsiasi scala maggiore e verifica la formula diatonica in tutte le tonalità' },
      ],
    },
  ],
};

function stubLevel(
  id: number,
  phase: 1 | 2 | 3 | 4,
  title: string,
  subs: Array<{ id: string; title: string; topics: string[]; toolTab?: Tab; toolLabel?: string; toolIcon?: string }>,
): Level {
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

const level3: Level = {
  id: 3,
  phase: 1,
  title: 'Dominanti, Tensioni e Alterazioni',
  subsections: [
    {
      id: '3.1',
      title: 'Accordi Dominanti',
      topics: ['Dominante primaria', 'Dominante secondaria', 'Backdoor dominant', 'Altered'],
      teoria: `La **dominante** non è solo \`G7\` in Do maggiore. Esiste un'intera famiglia di accordi dominanti, ognuno con funzione e colore sonoro propri.

**Dominante primaria:** il V7 diatonico della tonalità. In Do: \`G7 → Cmaj7\`. Il tritono Si–Fa risolve su Mi–Do.

**Dominante secondaria:** un V7 applicato temporaneamente a qualsiasi grado diatonico. \`A7 → Dm7\` (V7/ii), \`E7 → Am7\` (V7/vi). Ogni accordo della tonalità può avere il proprio dominante — questo crea cromatismi locali e direzione armonica.

**Sostituto di tritono (Sub V):** ogni dominante può essere sostituito dall'accordo a distanza di tritono. \`G7 → D♭7\`. Le guide tones si scambiano: Si–Fa di G7 diventano Fa–Do♭(=Si) di D♭7. Il basso si muove per cromatismo invece che per quinta.

**Backdoor dominant:** \`B♭7 → Cmaj7\`. Proviene dal IV della scala misolidia minore di Do. Non usa il tritono diatonico — è una risoluzione per semitono dal basso, con sapore modale e neo-soul.

**Dominante altered:** \`G7alt\` contiene ♭9, ♯9, ♭13 — massima tensione cromatica verso la tonica.`,
      esempi: `**Dominanti verso Cmaj7:**
- Primaria: G7 → Cmaj7 (quinta sopra)
- Sostituto tritono: D♭7 → Cmaj7 (basso cromatico)
- Backdoor: B♭7 → Cmaj7 (quarta sopra)

**Dominanti secondarie in Do maggiore:**
- A7 → Dm7 (V7/ii)
- B7 → Em7 (V7/iii)
- C7 → Fmaj7 (V7/IV)
- D7 → G7 (V7/V)
- E7 → Am7 (V7/vi)

**Catena di dominanti:**
E7 → A7 → D7 → G7 → Cmaj7`,
      esercizi: [
        'In Do maggiore, scrivi tutti i dominanti secondari e a quale accordo diatonico risolvono.',
        'Trasporta G7 → Cmaj7 in tutte le 12 tonalità.',
        'Sostituisci ogni dominante con il suo sostituto di tritono: G7→D♭7, D7→A♭7, A7→E♭7, ecc.',
        'Scrivi una progressione di 8 battute usando solo accordi dominanti (catena a ciclo di quinte).',
        'Confronta a orecchio G7 → Cmaj7 vs B♭7 → Cmaj7: descrivi la differenza di colore.',
        'Trasforma il giro I–vi–ii–V inserendo dominanti secondari: Cmaj7 – E7 – Am7 – A7 – Dm7 – D7 – G7 – Cmaj7.',
      ],
      obiettivo: 'Identificare e costruire dominanti primarie, secondarie, sostituti di tritono e backdoor dominants in qualsiasi tonalità, capendo il meccanismo di risoluzione di ciascuno.',
      tools: [
        { tabId: 'landing', label: 'Chord Landing', icon: '🎯', desc: 'Trova i migliori accordi dominanti di approccio per ogni tonica, inclusi sostituti di tritono e backdoor dominants' },
      ],
    },
    {
      id: '3.2',
      title: 'Tensioni Disponibili',
      topics: ['9', 'b9', '#9', '11', '#11', '13', 'b13', 'Avoid notes'],
      teoria: `Le **tensioni disponibili** (available tensions) sono le note aggiuntive che arricchiscono un accordo di settima senza distruggerlo. Non tutte le note della scala sono disponibili: alcune creano dissonanze troppo aspre.

**Regola base:** una tensione è disponibile se si trova a distanza di almeno una seconda maggiore (2 semitoni) da ogni nota dell'accordo. Le note a semitono da una nota dell'accordo sono dette **avoid notes** e vanno evitate come tensioni di lunga durata.

**Su \`Cmaj7\` (scala ionica):**
- Disponibili: 9 = Re ✓, ♯11 = Fa♯ ✓, 13 = La ✓
- Avoid: 11 = Fa ✗ (è a un semitono dalla terza Mi)

**Su \`G7\` (naturale o alterato):**
- Naturale: 9 = La ✓, 13 = Mi ✓
- Alterato: ♭9 = La♭, ♯9 = Si♭, ♯11 = Do♯, ♭13 = Mi♭ (tutte disponibili in contesto altered)

**Su \`Dm7\` (scala dorica):**
- Disponibili: 9 = Mi ✓, 11 = Sol ✓
- Avoid: 13 = Si ✗ in contesto diatonico (a semitono dalla ♭7)

Padroneggiare le tensioni significa passare da accordi di settima a voicing jazz ricchi e sofisticati, sapendo esattamente quale nota aggiungere e quale evitare.`,
      esempi: `**Tensioni su Cmaj7:**
- \`Cmaj9\`: Do–Mi–Sol–Si–Re
- \`Cmaj7♯11\`: Do–Mi–Sol–Si–Fa♯ (colore lydian)
- \`Cmaj13\`: Do–Mi–Sol–Si–La

**Tensioni su G7:**
- \`G9\`: Sol–Si–Re–Fa–La
- \`G7♭9\`: Sol–Si–Re–Fa–La♭ (colore scuro, minore)
- \`G7♯9\`: Sol–Si–Re–Fa–Si♭ (il "Hendrix chord")
- \`G7alt\`: Sol–Si–Fa–Mi♭–La♭ (massima tensione)

**Confronto cromatico:**
\`Cmaj7\` → \`Cmaj9\` → \`Cmaj7♯11\`: ogni tensione aggiunge luminosità`,
      esercizi: [
        'Per ogni tipo di accordo (maj7, m7, 7dom, m7b5) in Do, scrivi le tensioni disponibili e le avoid notes.',
        'Costruisci Cmaj9, Cmaj7♯11, Cmaj13 al pianoforte: ascolta come cambia il colore.',
        'Su G7 suona una alla volta: G9, G7♭9, G7♯9, G7♭13. Identifica quale tensione crea più senso di urgenza.',
        'Ear training: ascolta Cmaj7, Cmaj9, Cmaj7♯11. Riconosci a orecchio quale tensione è aggiunta.',
        'Riscrivi 4 battute di uno standard: sostituisci ogni accordo di settima con una versione estesa coerente.',
      ],
      obiettivo: 'Sapere quali tensioni sono disponibili su ogni tipo di accordo di settima ed estendere accordi semplici in voicing jazz senza creare avoid-note conflicts.',
      tools: [
        { tabId: 'scaleadvisor', label: 'Scale Advisor', icon: '🧭', desc: 'Verifica le tensioni disponibili su ogni tipo di accordo e visualizza le avoid notes nella scala selezionata' },
      ],
    },
    {
      id: '3.3',
      title: 'Chord-Scale Theory',
      topics: ['Modi', 'Altered', 'Lydian dominant', 'Diminished', 'Whole tone', 'Bebop'],
      teoria: `La **chord-scale theory** associa ogni tipo di accordo a una scala compatibile: le note della scala diventano il vocabolario melodico disponibile per improvvisare su quell'accordo.

Il principio fondamentale non è suonare scale meccanicamente — è usarle come serbatoio da cui estrarre **frasi musicali**.

**Accordo → Scala principale:**
- \`Cmaj7\`: Ionica (o Lidia se si vuole ♯11)
- \`Dm7\`: Dorica (II modo della scala maggiore)
- \`G7\`: Misolidia (inside) / Alterata (outside) / Diminuita H-W (bebop)
- \`Cm7\`: Dorica o Eolia
- \`CmMaj7\`: Minore melodica (I modo)
- \`C7♯11\`: Lidia dominante (IV modo minore melodica)
- \`Cm7♭5\`: Locria nat.2 (VI modo minore melodica)
- \`G7alt\`: Scala alterata (VII modo minore melodica)

**Tre opzioni per G7:**
1. **Misolidia:** tensioni naturali (9, 13) — suono diatonico e stabile
2. **Alterata:** ♭9, ♯9, ♭13 — tensione cromatica massima, suono "fuori"
3. **Diminuita H-W:** combina tensioni naturali e alterate — caratteristica del bebop

La scelta della scala dipende dal contesto, dal gusto e dallo stile — non da regole rigide.`,
      esempi: `**Scale per ogni grado di Do maggiore:**
- \`Cmaj7\`: Do Re Mi Fa Sol La Si (Ionica)
- \`Dm7\`: Re Mi Fa Sol La Si Do (Dorica)
- \`Em7\`: Mi Fa Sol La Si Do Re (Frigia)
- \`Fmaj7\`: Fa Sol La Si Do Re Mi (Lidia)
- \`G7\`: Sol La Si Do Re Mi Fa (Misolidia)
- \`Am7\`: La Si Do Re Mi Fa Sol (Eolia)
- \`Bm7♭5\`: Si Do Re Mi Fa Sol La (Locria)

**G7 con tre scale diverse:**
- Misolidia: Sol La Si Do Re Mi Fa
- Alterata: Sol La♭ Si♭ Si Re♭ Mi♭ Fa
- Diminuita H-W: Sol La♭ La Si Do♯ Re Mi Fa♯`,
      esercizi: [
        'Per ogni accordo della scala di Do maggiore, scrivi la scala modale corrispondente e identifica il modo.',
        'Improvvisa su Dm7–G7–Cmaj7 usando Dorica → Misolidia → Ionica. Poi ripeti con Alterata su G7.',
        'Suona la stessa frase di 4 note su G7 prima con Misolidia poi con Alterata: nota la differenza espressiva.',
        'Ear training: ascolta un\'improvvisazione jazz e identifica se il solista usa Misolidia o Alterata sul dominante.',
        'Componi una frase di 8 note su G7 che inizia e finisce sulle guide tones (Si e Fa). Trasportala in 3 tonalità.',
      ],
      obiettivo: 'Associare automaticamente una scala appropriata a ogni tipo di accordo di settima e scegliere consapevolmente tra opzioni "inside" e "outside" in base al contesto musicale.',
      tools: [
        { tabId: 'scaleadvisor', label: 'Scale Advisor', icon: '🧭', desc: 'Trova la scala corrispondente a qualsiasi tipo di accordo, incluse le opzioni modali per dominanti e accordi esotici' },
      ],
    },
  ],
};

const level4: Level = {
  id: 4,
  phase: 2,
  title: 'Voicing Jazz',
  subsections: [
    {
      id: '4.1',
      title: 'Shell Voicings',
      topics: ['Fondamentale', 'Terza', 'Settima', 'Omissione quinta'],
      teoria: `Lo **shell voicing** è il nucleo minimo di un accordo: **fondamentale, terza e settima**. La quinta viene omessa perché è la nota armonicamente più neutra — non contribuisce alla qualità dell'accordo né alla sua tensione funzionale. Ciò che rimane è l'identità dell'accordo nella sua forma essenziale.

Questo concetto è rivoluzionario per il pianismo jazz: invece di suonare accordi densi e difficili da spostare, si usa un voicing leggero, mobile e trasparente. La **terza** definisce la qualità (maggiore o minore), la **settima** definisce la funzione (dominante, major, minor). Insieme bastano a rendere inequivocabile ogni accordo.

Gli shell voicings si suonano nella **mano sinistra** del pianista, lasciando la mano destra libera per la melodia o l'improvvisazione. Esistono due disposizioni: terza sotto e settima sopra (\`E–B\` per \`Cmaj7\`), oppure settima sotto e terza sopra (\`B–E\` per \`Cmaj7\`). Questa alternanza produce un **voice leading** fluido tra accordi successivi: spesso basta spostare una singola nota di un semitono per passare da un accordo all'altro.

Su chitarra, gli shell voicings corrispondono ai classici accordi jazz a 3 note sul gruppo di corde medio-acute. In arrangiamento, definiscono la struttura armonica affidata alle voci intermedie (tenore e alto).`,
      esempi: `**Shell voicings in Do maggiore — due disposizioni:**
- \`Cmaj7\` (terza–settima): E–B / (settima–terza): B–E
- \`G7\` (terza–settima): B–F / (settima–terza): F–B
- \`Dm7\` (terza–settima): F–C / (settima–terza): C–F

**Voice leading II–V–I con shell voicings:**
- \`Dm7\`: F–C (terza–settima)
- \`G7\`: F–B (la settima Fa rimane, la terza scende di un semitono: Do→Si)
- \`Cmaj7\`: E–B (il Si rimane, il Fa risolve su Mi)

Solo due note cambiano, e spesso solo di un semitono: questo è il voice leading minimo.`,
      esercizi: [
        'Suona il giro II–V–I (Dm7–G7–Cmaj7) usando solo shell voicings in tutte e 12 le tonalità.',
        'Pratica entrambe le disposizioni (terza–settima e settima–terza) per ogni accordo del giro.',
        'Riduci ulteriormente: suona solo terza e settima senza fondamentale. Verifica che l\'accordo sia ancora riconoscibile.',
        'Scrivi un accompagnamento pianistico di 8 battute su un brano semplice usando esclusivamente shell voicings nella mano sinistra.',
        'Ear training: ascolta una progressione e identifica il tipo di accordo (maj7, 7, m7) basandoti solo sulla qualità terza–settima.',
        'Crea un arrangiamento per quartetto jazz assegnando gli shell voicings alle voci intermedie (tenore e alto).',
      ],
      obiettivo: 'Suonare qualsiasi progressione jazz con shell voicings nelle due disposizioni, realizzando voice leading fluido con movimenti minimi tra accordi successivi.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Visualizza e ascolta shell voicings per ogni tipo di accordo, esplorando le due disposizioni e il loro voice leading su progressioni II–V–I' },
      ],
    },
    {
      id: '4.2',
      title: 'Rootless Voicings',
      topics: ['Posizione A e B', 'Stile Bill Evans', 'Mano sinistra'],
      teoria: `I **rootless voicings** sono voicings senza fondamentale: non contengono la nota di basso dell'accordo. Questo è possibile nel jazz perché la fondamentale è affidata al contrabbassista — il pianista è libero di costruire voicings più ricchi e colorati usando **terza, settima, nona e tredicesima**.

L'eliminazione della fondamentale non impoverisce il suono: lo arricchisce. Senza la nota grave, il voicing risulta più **aperto, ambiguo e sofisticato** — esattamente lo stile del pianismo moderno da **Bill Evans** in poi. La mano sinistra suona accordi a quattro note dense e piene, ma leggere perché prive del raddoppio in basso.

Esistono due posizioni fondamentali per ogni accordo dominante e minore:
- **Posizione A:** la terza è la nota più grave del voicing
- **Posizione B:** la settima è la nota più grave del voicing

Alternare posizione A e B su progressioni II–V–I permette di mantenere le note comuni tra un accordo e l'altro (**common tones**) e di muovere le altre per gradi congiunti. Questo è il **voice leading** dei rootless voicings: il risultato è quella sensazione di flusso armonico continuo tipica delle incisioni di Evans, Red Garland o Herbie Hancock.`,
      esempi: `**Rootless voicings — II–V–I in Do maggiore:**
- \`Dm9\` (posizione A): F–C–E–A (terza–settima–nona–quinta)
- \`G13\` (posizione B): F–B–E–A (settima–terza–tredicesima–nona)
- \`Cmaj9\` (posizione A): E–B–D–G (terza–settima–nona–quinta)

**Nota:** il Fa di Dm9 rimane come settima di G13 → voice leading per comune.

**Posizione B per lo stesso giro:**
- \`Dm9\` posizione B: C–F–A–E
- \`G13\` posizione A: B–F–A–E
- \`Cmaj9\` posizione B: B–E–G–D`,
      esercizi: [
        'Suona il giro II–V–I rootless in tutte e 12 le tonalità, prima tutto in posizione A, poi tutto in posizione B.',
        'Alterna posizione A e B sullo stesso giro: Dm9 pos. A → G13 pos. B → Cmaj9 pos. A.',
        'Accompagna una melodia di standard jazz usando solo rootless voicings nella mano sinistra.',
        'Trascrivi 4 battute di un chorus pianistico di Bill Evans e identifica quale posizione (A o B) usa per ogni accordo.',
        'Ear training: ascolta un rootless voicing e identifica se manca la fondamentale o la quinta.',
        'Scrivi un foglio di voicings rootless per i 12 accordi dominanti (tutti i V7) in posizione A e B.',
      ],
      obiettivo: 'Suonare rootless voicings in posizione A e B su progressioni II–V–I in tutte le tonalità, producendo voice leading elegante e stile maturo da jazz moderno.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Costruisci e ascolta rootless voicings in posizione A e B, con visualizzazione delle common tones tra accordi successivi su progressioni II–V–I' },
      ],
    },
    {
      id: '4.3',
      title: 'Drop 2, Drop 3 e Block Chords',
      topics: ['Disposizione chiusa', 'Disposizione aperta', 'Drop 2', 'Drop 3', 'Harmonized melody'],
      teoria: `La **disposizione chiusa** è un accordo in cui le quattro voci stanno tutte nell'ambito di un'ottava. La disposizione **aperta** sposta alcune voci oltre l'ottava per creare voicings più ampi e suonabili.

**Drop 2** è la tecnica più usata: si prende la seconda voce dall'alto e la si abbassa di un'ottava. Un \`Cmaj7\` chiuso Sol–Mi–Do–Si diventa Mi–Do–Si–Sol (drop 2), dove Sol scende un'ottava. Il risultato è un voicing a quattro voci distribuito su circa una decima, ideale per chitarra jazz, sezione di ottoni e voci.

**Drop 3** abbassa la terza voce dall'alto di un'ottava. **Drop 2&4** combina entrambe le operazioni, producendo voicings ancora più aperti, tipici degli arrangiamenti per big band.

**Harmonized melody (block chords):** ogni nota della melodia viene armonizzata come voce superiore di un accordo a quattro voci in drop 2. Il risultato è una serie di accordi che si muovono all'unisono con la melodia — il suono caratteristico di **Wes Montgomery** alla chitarra e di **Red Garland / George Shearing** al pianoforte.

Questa tecnica trasforma la melodia in armonia completa: non si "suona su" una melodia, si "suona con" la melodia intera. Richiede precisione nel voice leading e scelta consapevole delle tensioni da armonizzare.`,
      esempi: `**Dalla disposizione chiusa al drop 2 su \`Cmaj7\`:**
- Chiuso (dall'alto): Si–Sol–Mi–Do
- Drop 2: Si–Mi–Do–Sol (la seconda nota dall'alto scende di ottava)

**Scala di Do maggiore armonizzata in drop 2:**
- Do → \`Cmaj7\` drop 2
- Re → \`Dm7\` drop 2
- Mi → \`Em7\` drop 2
- (e così via per ogni grado)

**Block chords su una melodia semplice:**
Ogni nota della melodia diventa la voce superiore; le tre voci inferiori completano l'accordo in drop 2, creando movimento armonico parallelo.`,
      esercizi: [
        'Armonizza la scala di Do maggiore in drop 2: costruisci i 7 voicings, uno per nota della scala.',
        'Applica drop 2 a una ballad semplice (es. "Autumn Leaves"): armonizza le prime 8 battute di melodia.',
        'Scrivi un chorus di 12 battute in block chords su un blues jazz in Fa.',
        'Confronta lo stesso voicing in disposizione chiusa, drop 2 e drop 3: suonali al pianoforte e descrivi il colore di ciascuno.',
        'Trascrivi 4 battute di Wes Montgomery e analizza il drop 2 che usa.',
        'Ear training: ascolta un accordo e identifica se è in disposizione chiusa, drop 2 o drop 3.',
      ],
      obiettivo: 'Costruire voicings in drop 2 e drop 3 da qualsiasi accordo chiuso, e armonizzare una melodia semplice in block chords con voice leading corretto.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Genera voicings in drop 2, drop 3 e block chords da qualsiasi accordo, visualizzando la distribuzione delle voci e confrontando le disposizioni' },
        { tabId: 'voiceleading', label: 'Voice Leading Lab', icon: '🎵', desc: 'Analizza il movimento di ogni voce durante una progressione armonizzata in drop 2, evidenziando common tones e movimenti per semitono' },
      ],
    },
    {
      id: '4.4',
      title: 'Upper Structure Triads',
      topics: ['Triadi sopra dominanti', 'Polychord notation'],
      teoria: `Le **upper structure triads** sono triadi (maggiori o minori) suonate sopra un accordo di base — tipicamente un dominante. L'idea è semplice ma potente: invece di pensare alle singole tensioni (♭9, ♯9, ♭13...) come note isolate, le si **raggruppa in una triade** che le contiene tutte insieme.

Il risultato si chiama **polychord**: un accordo composto da due strati, notato con una frazione (es. \`A/G7\` = triade di La sopra G7). Il musicista pensa alla triade superiore come un'unità suonabile, mentre la mano sinistra (o il basso) tiene il contesto dominante.

Su un accordo dominante di \`G7\`, le triadi più usate e i relativi colori sono:

| Triade superiore | Notazione | Tensioni generate | Colore |
|---|---|---|---|
| La♭ maggiore | \`A♭/G7\` | ♭9, 11, ♭13 | alteration scura, flamenco |
| La maggiore | \`A/G7\` | 9, ♯11, 13 | lydian dominant, luminoso |
| Si♭ maggiore | \`B♭/G7\` | ♯9, 5, ♭7 | blues, rock |
| Re♭ maggiore | \`D♭/G7\` | ♭9, ♯11, ♭7 | altered completo |
| Mi♭ maggiore | \`E♭/G7\` | ♭13, root, ♯9 | altered scuro |

Le upper structures funzionano anche su **Maj7♯11** (triade un tono sopra) e su **accordi alterati** di ogni tipo. La notazione polychord divide la pagina in due: triade sopra, accordo di base sotto.`,
      esempi: `**Upper structure triads su \`G7\` — tutte le possibilità principali:**
- \`A♭/G7\`: La♭–Do–Mi♭ sopra G–B–F → tensioni ♭9, 11, ♭13
- \`A/G7\`: Do♯–Mi–La sopra G–B–F → tensioni 9, ♯11, 13 (lydian dominant)
- \`B♭/G7\`: Re–Fa–Si♭ sopra G–B–F → tensioni ♯9, 5, ♭7
- \`D♭/G7\`: Fa–La♭–Re♭ sopra G–B–F → tensioni ♭9, ♯11, ♭7
- \`E♭/G7\`: Sol–Si♭–Mi♭ sopra G–B–F → tensioni ♭13, root, ♯9

**Voicing a due mani per \`A/G7\`:**
- Mano sinistra: G–B–F (shell voicing di G7)
- Mano destra: Do♯–Mi–La (triade di La maggiore)`,
      esercizi: [
        'Costruisci tutte e cinque le upper structures principali sopra G7: suonale una per una al pianoforte con la mano sinistra che tiene G–B–F.',
        'Scegli le due upper structures che preferisci su G7 e scrivile come voicing completo a due mani.',
        'Trasporta \`A/G7\` (lydian dominant) su tutti i dominanti del ciclo delle quinte: A/G7, E/D7, B/A7, F♯/E7...',
        'Crea una linea melodica di 4 battute usando solo le note della triade superiore \`A♭\` sopra G7.',
        'Scrivi un II–V–I con upper structure sulla risoluzione: Dm9 → A♭/G7 → Cmaj9.',
        'Ear training: ascolta un polychord e identifica se il colore è "lydian dominant" (luminoso) o "altered" (scuro/teso).',
      ],
      obiettivo: 'Costruire le cinque upper structure triads principali su qualsiasi accordo dominante, capire quali tensioni contengono e usarle per creare voicings completi a due mani.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Esplora upper structure triads su accordi dominanti e maj7♯11, con visualizzazione delle tensioni generate da ogni polychord e confronto tra i colori alterati e lydian dominant' },
      ],
    },
  ],
};

const level5: Level = {
  id: 5,
  phase: 2,
  title: 'Blues, Rhythm Changes e Forme Jazz',
  subsections: [
    {
      id: '5.1',
      title: 'Blues Jazz',
      topics: ['Jazz blues', 'Quick change', 'Bebop blues', 'Parker blues'],
      teoria: `Il **blues** è la radice di tutta la musica jazz. La forma di 12 battute non è solo una struttura — è una piattaforma su cui si è sviluppata ogni tecnica armonica del jazz moderno: dominanti secondarie, tritone substitution, accordi diminuiti, II-V-I inseriti.

Il **jazz blues** evolve la forma tradizionale aggiungendo accordi di passaggio e sostituzioni. Il \`IV7\` al quarto battuto (quick change), i \`dim7\` cromatici, i II-V-I inseriti al nono battuto trasformano la griglia da 3 accordi a una progressione ricca e articolata.

Il **bebop blues** (Parker blues) spinge ulteriormente: il turnaround finale diventa \`Im7-IV7-bVIImaj7-III7-VI7-II7-V7\`, ogni battuta può contenere un II-V diverso. **Coltrane blues** sostituisce le sezioni con Coltrane changes. Studiare tutte le varianti del blues significa avere in mano un laboratorio armonico completo.`,
      esempi: `**Blues base in Fa (12 battute):**
\`F7 | Bb7 | F7 | F7\`
\`Bb7 | Bb7 | F7 | D7\`
\`Gm7 | C7 | F7 | C7\`

**Versione jazz in Fa:**
\`F7 | Bb7 | F7 | Cm7 F7\`
\`Bb7 | Bdim7 | F7 D7 | —\`
\`Gm7 | C7 | Am7 D7 | Gm7 C7\`

Il \`Bdim7\` al sesto battuto è un leading-tone verso \`F7\`; \`Am7-D7-Gm7-C7\` è una catena di II-V che porta al turnaround.`,
      esercizi: [
        'Memorizza la progressione blues base in Fa e trasponi a Bb, Eb, Ab — le quattro tonalità più comuni nel repertorio.',
        'Scrivi 3 varianti crescenti di complessità: base → jazz → bebop blues. Evidenzia ogni sostituzione aggiunta.',
        'Analizza "Blues for Alice" di Charlie Parker: identifica ogni II-V-I e ogni dominante secondaria.',
        'Inserisci tritone substitutions su tutti i dominanti del blues jazz. Verifica che il basso si muova per semitoni.',
        'Componi un blues minore in Dm: usa il IV minore e il I minore, mantenendo il V7 come dominante.',
        'Ear training: ascolta 5 registrazioni di blues jazz (Parker, Coltrane, Evans) e trascrivi la griglia armonica dei primi 12 battute.',
      ],
      obiettivo: 'Suonare e analizzare il blues jazz in almeno 4 tonalità nelle versioni base, jazz e bebop, riconoscendo ogni sostituzione e la sua funzione armonica.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci e confronta varianti del blues jazz — da quella tradizionale al Parker blues — con ascolto e analisi delle sostituzioni inserite' },
      ],
    },
    {
      id: '5.2',
      title: 'Rhythm Changes',
      topics: ['Forma AABA', 'Bridge a dominanti', 'Sostituzioni bebop'],
      teoria: `**Rhythm Changes** è il secondo grande standard del jazz, secondo solo al blues per importanza. Deriva da "I Got Rhythm" di George Gershwin (1930) ed è la forma su cui il bebop si è costruito.

La struttura è **AABA** di 32 battute (8+8+8+8). Gli **A** sections in Bb maggiore partono con un turnaround accelerato: \`Bbmaj7–G7–Cm7–F7\` che scende al IV grado e poi torna con \`Fm7–Bb7–Ebmaj7–Edim7–Bbmaj7/F–G7–Cm7–F7\`. Il **bridge** è completamente dominante: \`D7–D7–G7–G7–C7–C7–F7–F7\` — un ciclo di quinte che genera tensione massima prima del ritorno agli A.

Il bebop ha trasformato gli A con **turnaround cromatici** (I–VI–II–V in rapida successione), sostituzioni tritone e accordi di passaggio. **Rhythm Changes moderni** (come in "Oleo" di Rollins o "Dexterity" di Parker) spingono l'armonia fino ai limiti della tonalità.`,
      esempi: `**Rhythm Changes in Bb — sezione A (prima metà):**
\`Bbmaj7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Edim7\`
\`Bbmaj7/F G7 | Cm7 F7 | Bbmaj7 — | —\`

**Bridge (cycle of fifths dominants):**
\`D7 | D7 | G7 | G7\`
\`C7 | C7 | F7 | F7\`

**Turnaround bebop classico (ultimi 2 battute dell'A):**
\`Bbmaj7 – G7 – Cm7 – F7\` (una battuta = due accordi)`,
      esercizi: [
        'Memorizza la struttura AABA completa di Rhythm Changes in Bb: scrivi la griglia a memoria.',
        'Scrivi 3 varianti della sezione A con diversi turnaround: diatonico, cromatico, con tritone sub.',
        'Scrivi 2 varianti del bridge: una con dominanti secondarie inserite, una con tritone sub.',
        'Trascrive il tema di "Oleo" di Sonny Rollins o "Dexterity" di Parker: identifica le differenze dalla griglia base.',
        'Improvvisa su Rhythm Changes usando solo arpeggi (nessuna scala): entra dentro ogni accordo del turnaround.',
      ],
      obiettivo: 'Conoscere a memoria la struttura AABA di Rhythm Changes in Bb con le varianti bebop standard del turnaround e del bridge, sapendo trasportare la forma in altre tonalità.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Esplora la griglia di Rhythm Changes e le sue varianti bebop — confronta i turnaround e il bridge nel ciclo delle quinte' },
      ],
    },
    {
      id: '5.3',
      title: 'Standard Jazz',
      topics: ['Autumn Leaves', 'All The Things You Are', 'Giant Steps'],
      teoria: `Studiare uno **standard jazz** non significa impararlo a memoria: significa smontarlo. Ogni standard è un caso di studio armonico che condensa decenni di pratica compositiva.

L'**analisi sistematica** di uno standard richiede di individuare: (1) la **forma** (AABA, ABAC, through-composed); (2) i **centri tonali** e le modulazioni; (3) tutti i **II-V-I** — diatonici e secondari; (4) le **dominanti secondarie**; (5) le **tritone substitutions** implicite; (6) i **punti di tensione** (deceptive cadences, accordi pivot, cromatismi); (7) le possibilità di **reharmonization**.

Ad esempio, **Autumn Leaves** in Sol minore: le prime 8 battute sono puro ciclo di quinte — \`Cm7-F7-Bbmaj7-Ebmaj7-Am7b5-D7-Gm\`. Ogni coppia è un II-V-I che modula di quinta. Il brano attraversa Sol minore e Sib maggiore. La semplicità strutturale lo rende il laboratorio ideale per sperimentare ogni tecnica armonica.`,
      esempi: `**Autumn Leaves — analisi prime 8 battute (Sol minore):**
\`Cm7 – F7 – Bbmaj7 – Ebmaj7\` → II-V-I in Sib maggiore
\`Am7b5 – D7 – Gm\` → II-V-I in Sol minore

**Livello progressivo degli standard:**
- Base: Autumn Leaves, Blue Bossa, Tune Up, Satin Doll
- Intermedio: All The Things You Are, Stella By Starlight, Body and Soul
- Avanzato: Giant Steps, Dolphin Dance, Inner Urge, Nefertiti

**Per ogni brano, analizza:**
forma → modulazioni → II-V-I → dominanti secondarie → tritone sub`,
      esercizi: [
        'Analizza Autumn Leaves: scrivi su foglio ogni accordo con il suo grado romano nella tonalità locale. Evidenzia i II-V-I.',
        'Trova tutte le dominanti secondarie in "All The Things You Are" e indica dove risolvono.',
        'Prendi le prime 8 battute di uno standard di tua scelta e scrivi 2 reharmonization alternative.',
        'Trascrivi il pianoforte di Bill Evans su "Autumn Leaves" (album "Portrait in Jazz"): analizza i voicing usati.',
        'Ear training: ascolta una registrazione di uno standard e identifica a orecchio le modulazioni principali senza guardare la partitura.',
        'Componi un proprio standard di 32 battute AABA ispirandoti alla struttura armonica di Autumn Leaves.',
      ],
      obiettivo: 'Analizzare uno standard jazz identificando forma, modulazioni, tutti i II-V-I, dominanti secondarie e punti di tensione — collegando sistematicamente la teoria al repertorio reale.',
      tools: [
        { tabId: 'analysis', label: 'Harmonic Analysis', icon: '🔬', desc: 'Analizza la struttura armonica di standard jazz — individua II-V-I, modulazioni, dominanti secondarie e punti di tensione in brani reali' },
      ],
    },
  ],
};

const level6: Level = {
  id: 6,
  phase: 2,
  title: 'Armonia Minore Avanzata',
  subsections: [
    {
      id: '6.1',
      title: 'Minore Naturale, Armonico e Melodico',
      topics: ['Accordi da minore armonico', 'Accordi da minore melodico', 'MinMaj7'],
      teoria: `Il **modo minore** non è un colore solo: è tre sistemi armonici distinti con caratteri e funzioni diverse.

Il **minore naturale** (eolio) è il più scuro: nessuna sensibile, il VII grado è \`bVII7\` (accordo dominante "modale"). Il **minore armonico** alza la settima per creare una vera sensibile (VII°→I): il risultato è il \`V7\` con terza maggiore, che genera tensione autentica verso la tonica — ma l'intervallo di seconda aumentata (La♭–Si) suona esotico. Il **minore melodico** risolve questo problema alzando anche la sesta: scala asimmetrica ascendente che produce accordi moderni come \`IVmaj7\`, \`II-7\`, e soprattutto \`ImMaj7\`.

Il \`CmMaj7\` (Do–Mi♭–Sol–Si) è l'accordo cardine del minore melodico: triade minore con settima maggiore, suono inquietante e ambiguo usato da Coltrane, Shorter e tutto il jazz post-bop. Il **colore dorico** (minore con sesta maggiore, tipico di "So What") si distingue dall'eolio per quell'unica nota: La♮ invece di La♭.`,
      esempi: `**Armonizzazione di Do minore melodico:**
\`CmMaj7 – Dm7 – E♭maj7#5 – F7 – G7 – Am7♭5 – Bm7♭5\`

**Confronto tra i tre minori su Do:**
- Naturale (eolio): Do–Re–Mi♭–Fa–Sol–La♭–Si♭ → \`Cm7, Ddim, E♭maj7, Fm7, Gm7, A♭maj7, B♭7\`
- Armonico: Do–Re–Mi♭–Fa–Sol–La♭–Si → \`Cm(maj7), Dm7♭5, E♭maj7#5, Fm7, G7, A♭maj7, Bdim7\`
- Melodico: Do–Re–Mi♭–Fa–Sol–La–Si → \`CmMaj7, Dm7, E♭maj7#5, F7, G7, Am7♭5, Bm7♭5\`

Il \`G7\` appare solo in minore armonico e melodico — non in naturale.`,
      esercizi: [
        'Armonizza Do minore naturale, armonico e melodico: scrivi i 7 accordi di settima per ognuna. Evidenzia le differenze.',
        'Suona e confronta \`Cm6\`, \`Cm7\` e \`CmMaj7\` al pianoforte: descrivi il colore di ciascuno con una parola.',
        'Scrivi una cadenza minore che usa \`Dm7♭5–G7–CmMaj7\` (II-V-I minore melodico) in Do, Sol e Re minore.',
        'Componi una progressione modale minore di 8 battute usando il colore dorico: \`Dm7–G7–Dm7–Am7\`.',
        'Ear training: ascolta 3 brani jazz in tonalità minore e identifica se il colore è eolio, dorico o minore melodico.',
        'Improvvisa sopra \`CmMaj7\` tenuto per 8 battute usando la scala di Do minore melodico. Senti il carattere ambiguo.',
      ],
      obiettivo: 'Distinguere e costruire gli accordi dei tre sistemi minori (naturale, armonico, melodico), riconoscere CmMaj7 e comprendere il colore dorico vs eolio nel jazz moderno.',
      tools: [
        { tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: 'Visualizza l\'armonizzazione delle tre scale minori — naturale, armonica e melodica — e confronta gli accordi generati su ogni grado' },
      ],
    },
    {
      id: '6.2',
      title: 'Accordi Diminuiti',
      topics: ['Passing chord', 'Leading-tone', 'Scala diminuita'],
      teoria: `Il **dim7** è l'accordo più simmetrico dell'armonia: quattro terze minori impilate, ogni nota distante uguale dalle altre. Questo significa che un \`Cdim7\` (Do–Mi♭–Sol♭–La) è identico a \`Ebdim7\`, \`Gbdim7\` e \`Adim7\` — quattro nomi per lo stesso suono. Esistono quindi solo 3 accordi dim7 distinti che coprono tutte e 12 le note.

In armonia funzionale, il dim7 svolge tre ruoli: (1) **passing chord** cromatico — inserito tra due accordi diatonici per movimento di basso semitono (\`Cmaj7–C#dim7–Dm7\`); (2) **leading-tone** — VII°7 come sostituto di V7 senza fondamentale (\`Bdim7\` ≈ \`G7b9\` senza Sol); (3) **dominant dim7** — direttamente sopra una fondamentale di dominante (\`G7b9\` = \`Bdim7/G\`).

La **scala diminuita tono-semitono** si costruisce alternando tono e semitono a partire dalla fondamentale. Su un \`G7b9\` si usa la scala semitono-tono (partendo da Sol: Sol–La♭–Si♭–Si–Do♯–Re–Mi–Fa). Questa simmetria genera quattro dominanti equivalenti ogni 3 semitoni.`,
      esempi: `**Diminished passing chords cromatici:**
\`Cmaj7 – C#dim7 – Dm7\` (basso: Do→Do#→Re)
\`Dm7 – D#dim7 – Em7\` (basso: Re→Re#→Mi)
\`Fmaj7 – F#dim7 – Gm7\`

**Dominant diminished:**
\`G7♭9\` ≈ \`Bdim7/G\` (Si–Re–Fa–La♭ sopra Sol di basso)

**Simmetria: le 3 famiglie di dim7:**
- Famiglia 1: \`Cdim7\` = \`E♭dim7\` = \`F#dim7\` = \`Adim7\`
- Famiglia 2: \`C#dim7\` = \`Edim7\` = \`Gdim7\` = \`B♭dim7\`
- Famiglia 3: \`Ddim7\` = \`Fdim7\` = \`A♭dim7\` = \`Bdim7\``,
      esercizi: [
        'Inserisci passing dim7 cromatici tra ogni coppia di accordi diatonici di Do maggiore (Cmaj7→Dm7, Dm7→Em7, ecc.).',
        'Scrivi le 3 famiglie di dim7: per ogni accordo, elenca i 4 nomi equivalenti.',
        'Usa \`Bdim7/G\` come sostituto di G7b9 in una cadenza II-V-I. Suonali entrambi e confronta il colore.',
        'Costruisci la scala diminuita semitono-tono da ogni dominante b9 delle 12 tonalità.',
        'Componi una progressione di 8 battute che usa almeno 3 passing dim7 cromatici per movimento di basso.',
        'Ear training: ascolta un dim7 isolato e identifica a quale delle 3 famiglie appartiene.',
      ],
      obiettivo: 'Usare il dim7 come passing chord cromatico e come sostituto di dominante b9, sfruttando la simmetria delle 3 famiglie per trasposizioni rapide.',
      tools: [
        { tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: 'Esplora la simmetria degli accordi diminuiti e la scala diminuita su ogni grado — visualizza i passing chords cromatici in contesto diatonico' },
      ],
    },
  ],
};

const level7: Level = {
  id: 7,
  phase: 2,
  title: 'Sostituzioni Armoniche',
  subsections: [
    {
      id: '7.1',
      title: 'Tritone Substitution',
      topics: ['Sub V', 'Movimento cromatico del basso', 'Lydian dominant'],
      teoria: `La **tritone substitution** (Sub V) è la sostituzione armonica più importante del jazz: ogni accordo dominante può essere sostituito dal dominante la cui fondamentale si trova a distanza di **tritono** (6 semitoni). \`G7\` diventa \`Db7\`, \`D7\` diventa \`Ab7\`, e così via.

Il meccanismo funziona perché i due dominanti condividono le stesse **guide-tone**: la terza e la settima si scambiano di ruolo. In \`G7\`: terza = Si, settima = Fa. In \`Db7\`: terza = Fa, settima = Do♭ (enharmonic Si). Si e Fa sono esattamente le due note del tritono — le più tese dell'accordo dominante. La risoluzione rimane identica, ma il **basso si muove per semitono** invece che per quinta, producendo un cromatismo elegante.

Su II-V-I: \`Dm7–G7–Cmaj7\` diventa \`Dm7–Db7–Cmaj7\`. Il basso scende cromaticamente Re→Do♭→Do. Questo movimento è la firma del pianismo jazz moderno. La scala associata a \`Db7\` in questo contesto è la **Lydian dominant** (IV modo della minore melodica): Db–Eb–F–G–Ab–Bb–Cb — il \`G♮\` genera l'attrito caratteristico che vuole risolvere su Do.`,
      esempi: `**Tritone substitution su II-V-I in Do:**
Standard: \`Dm7 – G7 – Cmaj7\`
Con Sub V: \`Dm7 – Db7 – Cmaj7\`

**Perché funziona — guide-tones condivisi:**
- \`G7\`: terza = Si, settima = Fa
- \`Db7\`: terza = Fa, settima = Do♭ (= Si enarmonica)
→ Le stesse note, ruoli invertiti. La risoluzione rimane.

**Basso cromatico nel turnaround:**
\`Cmaj7 – A7 – Dm7 – G7\` → \`Cmaj7 – Eb7 – Dm7 – Db7\`
Basso: Do–Mi♭–Re–Do♭–Do (discesa cromatica quasi totale)`,
      esercizi: [
        'Applica tritone sub a tutti i V7 di Autumn Leaves: scrivi la progressione risultante e suonala.',
        'Confronta \`G7alt\` e \`Db7#11\`: suona entrambi su un vamp e ascolta come risolvono su \`Cmaj7\`.',
        'Crea un turnaround in Do con basso cromatico discendente: \`Cmaj7–Eb7–Dm7–Db7\`.',
        'Prendi 8 battute di blues jazz e sostituisci ogni dominante con il tritone sub. Trascrivi il risultato.',
        'Ear training: ascolta una cadenza II-V-I e identifica se il V7 è standard o tritone sub dal movimento del basso.',
        'Improvvisa su \`Db7\` risolto su \`Cmaj7\`: usa la scala Lydian dominant di Db (= minore melodica di Ab).',
      ],
      obiettivo: 'Applicare la tritone substitution a qualsiasi dominante spiegando la condivisione delle guide-tone, producendo movimenti di basso cromatici in progressioni II-V-I e turnaround.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Sperimenta tritone substitutions su progressioni II-V-I e turnaround — confronta il movimento del basso standard vs cromatico' },
      ],
    },
    {
      id: '7.2',
      title: 'Dominanti Secondarie',
      topics: ['V/V', 'V/ii', 'Backcycling', 'Ciclo delle quinte'],
      teoria: `Una **dominante secondaria** è un accordo dominante che risolve su un accordo diatonico diverso dalla tonica. Ogni accordo della tonalità può avere il proprio V7: \`V/ii\` = A7 (risolve su Dm7), \`V/iii\` = B7 (risolve su Em7), \`V/IV\` = G7 (risolve su Fmaj7), \`V/V\` = D7 (risolve su G7), \`V/vi\` = E7 (risolve su Am7).

Il principio è semplice: qualsiasi accordo diatonico può essere "tematizzato" precedendolo con il suo V7. Questo crea **direzione locale** — ogni accordo diventa temporaneamente una tonica. La tonalità principale non viene abbandonata; viene attraversata con più dinamismo.

Il **backcycling** spinge oltre: si aggiungono II-V-I a catena ritrosa dal bersaglio. \`Cmaj7\` ← \`G7\` ← \`Dm7\` ← \`A7\` ← ... ogni anello prepara il successivo nel ciclo delle quinte. Questa tecnica è alla base del linguaggio bebop: Parker e Dizzy costruivano solos interi su catene di dominanti interpolate.`,
      esempi: `**Dominanti secondarie in Do maggiore:**
\`Cmaj7 – A7 – Dm7 – D7 – G7 – Cmaj7\`
→ A7 = V/ii, D7 = V/V

**Catena di dominanti (backcycling):**
\`Cmaj7 – A7 – D7 – G7 – Cmaj7\`
Ogni accordo è V7 del successivo: A→D→G→C (ciclo di quinte al contrario)

**Bridge di Rhythm Changes (puro backcycling):**
\`D7 | D7 | G7 | G7 | C7 | C7 | F7 | F7\`
→ V/V/V → V/V → V → I in Bb`,
      esercizi: [
        'Aggiungi dominanti secondarie a una progressione diatonica di 8 battute in Do maggiore: ogni accordo bersaglio deve essere preceduto dal suo V7.',
        'Analizza il bridge di Rhythm Changes in Bb: identifica il ciclo di quinte e scrivi i V/X per ogni dominante.',
        'Crea una catena di backcycling di 8 accordi che arrivi su Cmaj7: scrivi e suona.',
        'Confronta \`Cmaj7–Dm7–G7\` con \`Cmaj7–A7–Dm7–G7\`: suona entrambe e descrivi la differenza di tensione.',
        'Trova tutte le dominanti secondarie in "All The Things You Are" e scrivi il loro V/X di riferimento.',
        'Improvvisa su una catena dominante \`E7–A7–D7–G7–C\`: usa scale bebop dominant per ogni accordo.',
      ],
      obiettivo: 'Inserire dominanti secondarie e catene di backcycling in qualsiasi progressione diatonica, aumentando la direzione armonica e il senso di movimento verso ogni accordo bersaglio.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci catene di dominanti secondarie e backcycling su progressioni diatoniche — sperimenta il ciclo delle quinte applicato al jazz' },
      ],
    },
    {
      id: '7.3',
      title: 'Modal Interchange',
      topics: ['Prestito modale', 'bVIImaj7', 'bVImaj7', 'ivm', 'Backdoor'],
      teoria: `Il **modal interchange** (prestito modale) consiste nel prendere accordi da una tonalità parallela — principalmente la minore parallela — e inserirli in un contesto maggiore. Non si modula: si "presta" temporaneamente il colore oscuro del minore, poi si torna.

Gli accordi presi in prestito più comuni dalla minore parallela di Do sono: \`Fm7\` (ivm — sottodominante minore, colore malinconico), \`Bbmaj7\` o \`Bb7\` (bVII — "backdoor dominant"), \`Abmaj7\` (bVI — colore epico/cinematografico), \`Ebmaj7\` (bIII), \`Dbmaj7\` (bII — Neapolitan).

La **backdoor progression** è un II-V-I alternativo: invece di \`Dm7–G7–Cmaj7\`, si usa \`Fm7–Bb7–Cmaj7\`. Il \`Bb7\` risolve su Do per movimento di seconda maggiore (non di quinta), producendo un effetto di sorpresa morbida tipico del gospel e del soul. Questo accordo è anche la base del **colore neo-soul**: accordi in prestito dal minore sovrapposti a progressioni maggiori.`,
      esempi: `**Modal interchange in Do maggiore (dalla minore parallela):**
\`Cmaj7 – Abmaj7 – Dbmaj7 – Cmaj7\` (bVI–bII–I)
\`Cmaj7 – Fm6 – Cmaj7\` (ivm — sottodominante minore)
\`Cmaj7 – Bb7 – Cmaj7\` (backdoor dominant bVII7)

**Confronto cadenze:**
Normale: \`Dm7 – G7 – Cmaj7\`
Backdoor: \`Fm7 – Bb7 – Cmaj7\`
→ stessa risoluzione, colore completamente diverso

**Colori del prestito:**
- \`Fm7\`: malinconia, jazz moderno
- \`Abmaj7\`: cinematografico, epico
- \`Bb7\`: gospel, soul, neo-soul`,
      esercizi: [
        'Scrivi 8 progressioni di 4 accordi in Do maggiore usando almeno un accordo prestato dalla minore parallela.',
        'Riarmonizza una melodia in Do maggiore sostituendo il IVmaj7 con il ivm (Fm7): suona entrambe le versioni.',
        'Crea un bridge di 8 battute che usa bVImaj7 e bVIImaj7 per contrastare con gli A diatonici.',
        'Analizza "Isn\'t She Lovely" di Stevie Wonder: trova tutti gli accordi in prestito dalla minore parallela.',
        'Improvvisa sopra \`Abmaj7\` risolto su \`Cmaj7\`: usa la scala di La♭ lidia. Senti il colore cinematografico.',
        'Ear training: ascolta una progressione e identifica se c\'è un accordo prestato dalla minore — identifica quale.',
      ],
      obiettivo: 'Inserire accordi di prestito modale (ivm, bVII7, bVImaj7, bIImaj7) in progressioni maggiori, riconoscere la backdoor progression e usarla per creare contrasti di colore nel jazz e nel pop.',
      tools: [
        { tabId: 'modal', label: 'Modal Interchange', icon: '🔄', desc: 'Esplora i prestiti modali dalla minore parallela — visualizza ivm, bVI, bVII e backdoor in qualsiasi tonalità maggiore' },
      ],
    },
    {
      id: '7.4',
      title: 'Sostituzioni Funzionali',
      topics: ['Relative minor', 'Medianti cromatiche', 'Side-slipping'],
      teoria: `Le **sostituzioni funzionali** operano sulla funzione armonica: qualsiasi accordo con la stessa funzione (T, SD, D) può sostituire un altro. Il criterio è la condivisione di **due o più note comuni** tra i due accordi.

La **relativa minore** è la sostituzione tonica più naturale: \`Cmaj7\` e \`Am7\` condividono tre note (Do, Mi, Sol) — il primo ha funzione tonica principale, il secondo è tonica "debole" ma interscambiabile. Allo stesso modo, \`Em7\` ha note do, mi, sol, si — tre in comune con \`Cmaj7\`.

Le **medianti cromatiche** portano il concetto oltre la diatonica: \`Cmaj7\` può essere sostituito da \`Ebmaj7\` (mediante bassa) o \`Abmaj7\` (mediante alta) — accordi a distanza di terza con 1 nota in comune. Il suono è sorprendente ma non caotico: la voce conduttrice assicura la continuità.

Il **side-slipping** è una tecnica improvvisativa: si suona brevemente un semitono sopra o sotto l'accordo corrente, poi si risolve. Crea tensione temporanea intenzionale. Usato da Herbie Hancock, McCoy Tyner e tutto il post-bop.`,
      esempi: `**Sostituzioni di tonica per Cmaj7:**
- \`Am7\` (relativa minore, 3 note comuni)
- \`Em7\` (mediante alta diatonica, 3 note comuni)
- \`Ebmaj7\` (mediante cromatica bassa, 1 nota comune)

**Sostituzione di sottodominante:**
\`Dm7\` → \`Fmaj7\` (condividono Fa, La, Do)

**Side-slipping su G7:**
\`G7\` → \`Ab7\` (semitono sopra) → risolve su \`Cmaj7\`

**Approach chords:**
\`Cmaj7\` preceduto da \`Dbmaj7\` (semitono sopra) o \`Bmaj7\` (semitono sotto)`,
      esercizi: [
        'Sostituisci ogni Imaj7 in una progressione di 8 battute con la sua relativa minore (VIm7). Suona entrambe.',
        'Crea una progressione che usa medianti cromatiche: \`Cmaj7–Ebmaj7–Abmaj7–Cmaj7\`.',
        'Pratica side-slipping: su un vamp di \`Cmaj7\`, improvvisa una misura su \`Dbmaj7\` poi torna. Ripeti con \`Bmaj7\`.',
        'Analizza "Maiden Voyage" di Herbie Hancock: identifica le sostituzioni funzionali e le note comuni tra accordi.',
        'Scrivi una progressione turnaround con approach chords cromatici su ogni accordo.',
        'Ear training: ascolta una sostituzione e identifica se è relativa minore, mediante cromatica o side-slip.',
      ],
      obiettivo: 'Scegliere sostituzioni funzionali in base a funzione, note comuni e contesto melodico — applicare relativa minore, medianti cromatiche e side-slipping in improvvisazione e composizione.',
      tools: [
        { tabId: 'landing', label: 'Chord Landing', icon: '🎯', desc: 'Esplora sostituzioni funzionali — testa relativa minore, medianti cromatiche e approach chords in contesti armonici reali' },
      ],
    },
  ],
};

const level8: Level = {
  id: 8,
  phase: 3,
  title: 'Reharmonization',
  subsections: [
    {
      id: '8.1',
      title: 'Reharmonization di Base',
      topics: ['Procedura 7 passi', 'Nota melodica come guida'],
      teoria: `La **reharmonization** è l'arte di raccontare la stessa melodia con un'armonia diversa. La nota melodica rimane invariata; cambiano il basso, la funzione, il colore. Il risultato è lo stesso gesto musicale visto attraverso una prospettiva nuova.

La procedura in **7 passi** è la bussola per ogni reharmonization:
1. **Identifica la nota melodica** — è la vincolo principale
2. **Capisce su quale accordo originale cade** — conosci il contesto
3. **Trova accordi alternativi che la contengano** — può essere fondamentale, terza, quinta, settima o tensione
4. **Scegli un basso interessante** — cromatico, pedal point, movimento contrario alla melodia
5. **Controlla la funzione** — il nuovo accordo svolge la stessa funzione o cambia il discorso?
6. **Controlla il voice leading** — ogni voce si muove fluidamente?
7. **Verifica che la melodia non venga schiacciata** — le tensioni dell'accordo non devono creare dissonanze involontarie

Con queste regole si può costruire qualsiasi reharmonization senza perdere la musicalità della melodia originale.`,
      esempi: `**Reharmonization di "Happy Birthday" (Do maggiore, nota Do sulla prima battuta):**

Versione originale: \`C – C – F – C\`
Versione soft: \`Cmaj7 – Am7 – Fmaj7 – G7sus4\`
Versione jazz: \`Cmaj9 – Eb7#11 – Fmaj7 – Ab7\`
Versione estrema: \`Cmaj7 – Db/C – Fmaj7/C – G7alt\`

**8 battute di Autumn Leaves — versione jazz di base:**
Originale: \`Cm7 – F7 – Bbmaj7 – Ebmaj7 – Am7b5 – D7 – Gm\`
Reharmonized: \`Cm9 – Gb7#11 – Bbmaj9 – Abmaj7 – Am7b5 – Ab7 – Gm9\``,
      esercizi: [
        'Applica i 7 passi a "Happy Birthday": scrivi 3 versioni (soft, medium, extreme) con giustificazione di ogni accordo.',
        'Riarmonizza 8 battute di Autumn Leaves: mantieni tutte le note melodiche, cambia ogni accordo.',
        'Prendi una melodia pop e scrivi 2 reharmonization: una jazz (con II-V inseriti) e una modale (con prestiti).',
        'Analizza le note melodiche su cui cade ogni accordo della tua reharmonization: sono fondamentale, terza o tensione?',
        'Ear training: ascolta una melodia reharmonized e identifica quali note melodiche sono diventate tensioni (7a, 9a, 11a, 13a).',
        'Trascrivi le prime 8 battute di una reharmonization di Bill Evans su "My Favorite Things": analizza ogni scelta.',
      ],
      obiettivo: 'Applicare la procedura in 7 passi per reharmonizzare qualsiasi melodia, mantenendo le note melodiche come vincolo e variando funzione, basso e colore degli accordi.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Sperimenta varianti di progressioni reharmonized — testa come diverse scelte armoniche cambiano il colore di una stessa melodia' },
        { tabId: 'analysis', label: 'Harmonic Analysis', icon: '🔬', desc: 'Analizza le note melodiche in relazione agli accordi — identifica fondamentale, terza, quinta, settima o tensione per ogni nota della melodia' },
      ],
    },
    {
      id: '8.2',
      title: 'Reharmonization Intermedia',
      topics: ['Slash chords', 'Pivot chords', 'II-V concatenati'],
      teoria: `La reharmonization intermedia usa strumenti più sofisticati per creare movimento senza sovraccaricare la melodia. I principi base rimangono (nota melodica come vincolo, voice leading fluido), ma il vocabolario si espande.

I **slash chords** (\`Cmaj7/E\`) separano il basso dall'accordo superiore: la nota al basso crea una linea indipendente dalla struttura armonica, producendo tensioni e colori non diatonici. I **pivot chords** sono accordi che appartengono a due tonalità simultaneamente e permettono modulazioni temporanee senza rottura.

I **II-V concatenati** permettono di "avvicinare" un accordo bersaglio con una preparazione cromatica: \`Cmaj7–Eb7#11–Dm9–Db7#11\` usa un tritone sub per ogni accordo pari, creando un basso discendente cromatico. Le **deceptive resolutions** (cadenze evitate) sorprendono l'ascoltatore risolvendo su un accordo inatteso invece della tonica attesa.

La **reharmonization ritmica** agisce sul ritmo degli accordi: cambia la densità armonica (più accordi per battuta = più tensione) o anticipa/ritarda i cambi rispetto all'originale.`,
      esempi: `**Reharmonization intermedia di 4 battute:**
Originale: \`Cmaj7 – Am7 – Dm7 – G7\`

Versione 1 (tritone sub + slash):
\`Cmaj9 – Eb7#11 – Dm9 – Db7#11\`

Versione 2 (slash chords + dim passing):
\`Cmaj7/E – Ebdim7 – Dm9 – G13b9\`

**Deceptive resolution:**
\`Dm7 – G7 → Am7\` invece di \`→ Cmaj7\` (risolve sulla relativa)

**II-V concatenati (backcycling alla reharmonization):**
\`Cmaj7 ← Dm7-G7 ← Em7-A7 ← F#m7-B7\``,
      esercizi: [
        'Riarmonizza \`Cmaj7–Am7–Dm7–G7\` in 3 modi: tritone sub, slash chords, deceptive resolution.',
        'Crea una linea di basso cromatica discendente su 8 battute usando slash chords: Do–Si–Si♭–La♭–Sol.',
        'Usa un pivot chord per modulare da Do maggiore a Mi♭ maggiore in 2 battute senza rottura.',
        'Scrivi una reharmonization ritmica di Autumn Leaves: aggiungi II-V in ogni battuta dove prima c\'era un singolo accordo.',
        'Analizza le due versioni dell\'esempio sopra: per ogni accordo, identifica la nota melodica e come viene trattata.',
        'Ear training: ascolta una progressione reharmonized e identifica se usa slash chords (basso indipendente) o tritone sub.',
      ],
      obiettivo: 'Costruire reharmonization di livello intermedio usando slash chords, pivot chords, II-V concatenati e deceptive resolutions, producendo movimento armonico ricco senza oscurare la melodia.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Esplora slash chord voicings e configurazioni a due mani per reharmonization intermedia — visualizza il basso indipendente dall\'accordo superiore' },
      ],
    },
    {
      id: '8.3',
      title: 'Reharmonization Avanzata',
      topics: ['Coltrane changes', 'Constant structure', 'Parallel harmony'],
      teoria: `La reharmonization avanzata abbandona parzialmente il territorio tonale per entrare in quello **simmetrico, modale e non funzionale**. La melodia rimane il filo conduttore, ma il tessuto armonico sotto di essa può muoversi per logiche diverse dalla tensione-risoluzione.

I **Coltrane changes** sostituiscono un II-V-I con un ciclo di tre centri tonali a distanza di terza maggiore (ogni 4 semitoni): \`Dm7–G7–Cmaj7\` diventa \`Dm7–G7–Ebmaj7–Ab7–Bmaj7–E7–Cmaj7\`. La melodia "galleggia" sopra una struttura che scende cromaticamente in modo simmetrico.

La **constant structure** (parallel harmony o planing) muove lo stesso tipo di accordo in parallelo: \`Cmaj7–Dbmaj7–Dmaj7\`, tutti maj7 con basso che sale per semitoni. Non c'è funzione tonale: ogni accordo è uguale al precedente, solo trasposto. Il risultato è ambiguo e cinematografico — tipico di Herbie Hancock e Wayne Shorter.

Il **planing** può applicarsi a qualsiasi tipo: accordi minori paralleli, shell voicings paralleli, triadi parallele. La coerenza timbrica è totale; la coerenza tonale è assente.`,
      esempi: `**Coltrane changes applicati a II-V-I in Do:**
Standard: \`Dm7 – G7 – Cmaj7\`
Coltrane: \`Dm7–G7 | Ebmaj7–Ab7 | Bmaj7–E7 | Cmaj7\`

**Constant structure (planing) su una melodia in Do:**
\`Cmaj7 – Dbmaj7 – Dmaj7 – Ebmaj7\` (salita cromatica)
\`Cm7 – Bbm7 – Abm7 – Gbm7\` (discesa per toni)

**Reharmonization modale (colore "So What"):**
Invece di \`Cm7–F7–Bbmaj7\`, usa:
\`Cm11 – Dbm11\` (due accordi sus/quartal che si spostano di semitono)`,
      esercizi: [
        'Applica Coltrane changes a II-V-I in tutte e 12 le tonalità: scrivi la progressione espansa con i tre centri tonali.',
        'Riarmonizza un blues jazz usando constant structure: sostituisci ogni accordo con maj7 paralleli in discesa cromatica.',
        'Crea una versione modale di "Autumn Leaves": trasforma ogni II-V-I in un vamp su accordi sus o quartali.',
        'Crea una versione neo-soul di un giro II-V-I: aggiungi 6/9, 13sus e triadi sovrapposte.',
        'Analizza "Dolphin Dance" di Herbie Hancock: identifica dove usa planing, Coltrane changes o armonia non funzionale.',
        'Ear training: ascolta una reharmonization avanzata e identifica se usa constant structure (parallel) o Coltrane changes (cicli di terze).',
      ],
      obiettivo: 'Applicare Coltrane changes, constant structure e parallel harmony per reharmonizzare progressioni tonali, producendo versioni modali, simmetriche e non funzionali di brani esistenti.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Sperimenta Coltrane changes e constant structure su progressioni standard — visualizza come la melodia si relaziona a strutture armoniche simmetriche' },
      ],
    },
  ],
};

const level9: Level = {
  id: 9,
  phase: 3,
  title: 'Armonia Modale',
  subsections: [
    {
      id: '9.1',
      title: 'Modi della Scala Maggiore',
      topics: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'],
      teoria: `I **modi** della scala maggiore sono sette scale diverse ottenute partendo da ognuno dei sette gradi. Ogni modo ha un **carattere sonoro distinto** determinato dalla posizione del tritono e dalla nota caratteristica — quella che differenzia il modo dall'ionian standard.

- **Ionian** (I): scala maggiore normale. Luminoso, stabile. Nota caratteristica: la 7a maggiore.
- **Dorian** (II): minore con 6a maggiore. Caldo e jazzistico — "So What" di Miles Davis. Nota caratteristica: la 6a.
- **Phrygian** (III): minore con 2a bassa. Scuro, flamenco, metal. Nota caratteristica: la 2a minore.
- **Lydian** (IV): maggiore con 4a aumentata (#11). Sognante, cinematografico. Nota caratteristica: #4.
- **Mixolydian** (V): maggiore con 7a minore. Bluesy, rock, modale-dominante. Nota caratteristica: b7.
- **Aeolian** (VI): minore naturale puro. Malinconico. Nota caratteristica: b6 e b7 insieme.
- **Locrian** (VII): il più instabile — quinta diminuita sulla fondamentale. Raramente usato come centro modale.

Il segreto dell'**armonia modale** è evitare cadenze tonali forti (V-I): si usano vamp, pedali, ostinati e cambio modale per mantenere il centro senza risoluzione funzionale.`,
      esempi: `**Vamp dorico in Re:**
\`Dm7 – G/D – Dm9\` (il Sol naturale caratterizza il Dorian di Re)

**Tema Lydian in Fa:**
\`Fmaj7#11 – G/F – Em/F\` (Sol naturale = 2a; Si naturale = #4 lydian)

**Vamp Mixolydian in Sol:**
\`G7sus – F/G – C/G\` (Fa naturale = b7 mixolydian)

**Analisi modale:**
"So What" (Davis) = D Dorian + Eb Dorian
"Maiden Voyage" (Hancock) = 4 centri modali sus
"Impressions" (Coltrane) = D Dorian + Eb Dorian`,
      esercizi: [
        'Costruisci tutti e 7 i modi partendo da Do: scrivi le note per ognuno e identifica la nota caratteristica.',
        'Componi un vamp di 8 battute in Re Dorian: usa solo accordi diatonici al modo, evita cadenze V-I.',
        'Componi un tema di 8 battute in Fa Lydian: metti in evidenza il #4 (Si naturale) nella melodia e nell\'armonia.',
        'Trascrivi le prime 16 battute di "So What": analizza gli accordi usati e perché mantengono il centro dorico.',
        'Improvvisa 4 minuti su un vamp di 2 accordi in Sol Mixolydian: non usare mai la cadenza V-I.',
        'Ear training: ascolta 7 esempi modali (uno per modo) e identifica il modo dal colore del vamp.',
      ],
      obiettivo: 'Identificare e usare tutti e 7 i modi della scala maggiore, riconoscendo la nota caratteristica di ciascuno e componendo vamp modali che evitano la cadenza tonale V-I.',
      tools: [
        { tabId: 'modal', label: 'Modal Interchange', icon: '🔄', desc: 'Esplora tutti i modi della scala maggiore — visualizza la nota caratteristica, gli accordi diatonici e esempi di vamp per ciascun modo' },
      ],
    },
    {
      id: '9.2',
      title: 'Modi della Minore Melodica',
      topics: ['Altered', 'Lydian dominant', 'Locrian natural 2'],
      teoria: `La **minore melodica** genera sette modi propri, distinti da quelli della scala maggiore. Questi modi sono al cuore del linguaggio jazz post-bop: ogni dominante alterato, ogni tensione cromatica, ogni colore "outside" proviene da qui.

I modi più usati nella pratica:
- **Modo I** (Melodic minor / Do-Re-Mi♭-Fa-Sol-La-Si): suona come \`ImMaj7\`, ambiguo e cinematografico.
- **Modo IV** (Lydian dominant): scala maggiore con #4 e b7 — suona su \`V7#11\` e sui tritone sub. Colore luminoso ma con tensione.
- **Modo V** (Mixolydian b13 / Hindu): maggiore con b6 e b7. Usato su \`V7b13\` — tensione orientale.
- **Modo VI** (Locrian natural 2 / Aeolian b5): come locrian ma con 2a naturale. Suona su \`m7b5\` — meno instabile del locrian.
- **Modo VII** (Altered scale / Super-Locrian): il modo più usato nel jazz. Si costruisce su ogni dominante che risolve: usa tutte le alterazioni disponibili (b9, #9, b5/#11, b13). Suona su \`V7alt\`.

La regola pratica: **dominante che risolve → scala alterata** (modo VII della minore melodica un semitono sopra). \`G7alt\` → scala alterata di Sol = minore melodica di La♭.`,
      esempi: `**Modi della minore melodica più usati:**
- \`C\` melodic minor → \`CmMaj7\` (modo I)
- \`F\` Lydian dominant → \`F7#11\` (modo IV: Do minore melodico da Fa)
- \`B\` altered → \`B7alt\` (modo VII: Do minore melodico da Si)

**Scala alterata di G7:**
Sol–La♭–Si♭–Do♭–Re♭–Mi♭–Fa = modo VII di La♭ melodic minor
Tensioni disponibili: b9, #9, b5(=#11), b13

**Lydian dominant su tritone sub:**
\`Db7#11\` sostituto di \`G7\` → scala Lydian dominant di Re♭`,
      esercizi: [
        'Costruisci la scala alterata di tutti e 12 i dominanti: scrivi la scala e identifica la minore melodica di partenza.',
        'Suona \`G7alt–Cmaj7\` usando la scala alterata su G7: ascolta come b9, #9, b13 creano tensione.',
        'Costruisci voicing \`Emaj7#5\` (accordo dal modo III della minore melodica): scrivi le note Mi–Sol#–Si#–Re#.',
        'Improvvisa su \`V7alt–Imaj7\` in 6 tonalità usando la scala alterata sul dominante.',
        'Usa la Lydian dominant di Re♭ su un tritone sub \`Db7\` risolto su \`Cmaj7\`: suona la progressione.',
        'Analizza "Infant Eyes" di Wayne Shorter: identifica dove usa minore melodica e quale modo su ogni accordo.',
      ],
      obiettivo: 'Costruire e applicare i modi della scala minore melodica — in particolare la scala alterata su V7 e la Lydian dominant sui tritone sub — per creare tensioni cromatiche nel jazz moderno.',
      tools: [
        { tabId: 'scaleadvisor', label: 'Scale Advisor', icon: '🧭', desc: 'Trova la scala alterata e la Lydian dominant per ogni accordo dominante — visualizza le tensioni disponibili e la minore melodica di riferimento' },
      ],
    },
    {
      id: '9.3',
      title: 'Armonia Modale Moderna',
      topics: ['Slash chords', 'Accordi quartali', 'Accordi sus', 'Triadi sovrapposte'],
      teoria: `L'armonia modale moderna evita la logica tensione-risoluzione per creare invece **atmosfere statiche e ambigüe**. Gli strumenti principali sono costruiti sull'ambiguità funzionale: nessun accordo punta chiaramente verso il successivo.

Gli **accordi quartali** (costruiti per quarte invece che per terze) eliminano la terza — l'intervallo che definisce maggiore/minore. Senza terza, l'accordo è aperto, neutro, "sospeso". \`So What chord\` di Bill Evans: Do–Fa–Si♭–Mi♭–Sol. Cinque note, tutte a distanza di quarta. Nessuna terza, nessuna settima classica.

Gli **accordi sus** (\`D13sus\`, \`G7sus\`) sostituiscono la terza con la quarta sospesa — tensione che non vuole risolvere nel jazz moderno, contrariamente alla tradizione classica. Nel neo-soul diventano \`13sus\`, \`9sus4\` con tensioni aggiunte.

Le **triadi sovrapposte** (\`A/C#\`, \`Bbmaj7#11/C\`) creano polychord impliciti: la triade superiore genera tensioni rispetto al basso. Il **pedal point** (nota tenuta al basso mentre l'armonia si muove sopra) è un altro strumento modale fondamentale.`,
      esempi: `**Slash chords e pedal point:**
\`C/D\` — triade di Do su basso Re (crea D13sus implicito)
\`Fmaj7/G\` — Fmaj7 su basso Sol (crea G13sus)
\`Eb/F\` — triade di Mi♭ su basso Fa (colore Dorian/neo-soul)

**So What chord (quartale):**
Do–Fa–Si♭–Mi♭–Sol (cinque quarte impilate)

**Triadi sovrapposte:**
\`A/C#\` — triade di La su basso Do# (ambiguità tonale A/E/C# simultanea)
\`Bbmaj7#11/C\` — Lydian su pedale di Do

**Vamp modale senza V-I:**
\`D13sus | Eb13sus | D13sus | D13sus\``,
      esercizi: [
        'Scrivi un vamp di 4 accordi senza nessuna cadenza V-I: usa slash chords, sus o quartali.',
        'Costruisci 4 accordi quartali partendo da Re, Sol, La, Mi: scrivi le note e suonali in sequenza.',
        'Crea una progressione di 8 battute con pedale di Re al basso mentre l\'armonia superiore si muove: \`Dm9, C/D, Bbmaj7/D, Am7/D\`.',
        'Trascrive le prime 16 battute di "Maiden Voyage" (Hancock): analizza i slash chords e i sus usati.',
        'Componi un brano modale di 16 battute che usa solo accordi quartali e sus. Nessun accordo maggiore o minore tradizionale.',
        'Ear training: ascolta un accordo quartale e uno sus: identifica quale ha la terza (sus) e quale non la ha (quartale).',
      ],
      obiettivo: 'Costruire e usare accordi quartali, sus, slash chords e triadi sovrapposte per creare armonie modali ambigue senza dipendere dalla cadenza classica V-I.',
      tools: [
        { tabId: 'modal', label: 'Modal Interchange', icon: '🔄', desc: 'Visualizza accordi quartali, sus e slash chords in contesto modale — esplora vamp senza cadenze tonali e costruzioni da triadi sovrapposte' },
      ],
    },
  ],
};

const level10: Level = {
  id: 10,
  phase: 3,
  title: 'Armonia Cromatica e Non Funzionale',
  subsections: [
    {
      id: '10.1',
      title: 'Chromatic Mediants',
      topics: ['Accordi a distanza di terza', 'Uso cinematografico', 'Fusion'],
      teoria: `Le **medianti cromatiche** sono accordi a distanza di terza (maggiore o minore) con almeno una nota alterata rispetto alla diatonica. La relazione \`Cmaj7–Ebmaj7\` è una mediante cromatica bassa: Do e Mi♭ distano una terza minore, ma Mi♭ maggiore non appartiene a Do maggiore.

Il meccanismo che le rende funzionali è la presenza di **note comuni** nonostante la distanza tonale. \`Cmaj7\` (Do–Mi–Sol–Si) e \`Ebmaj7\` (Mi♭–Sol–Si♭–Re) condividono Sol — una nota di connessione che "giustifica" il salto cromatico. \`Cmaj7–Abmaj7\` condivide Do e Mi♭ enarmonica. \`Cmaj7–Emaj7\` condivide Mi (terzina = fondamentale).

Nel cinema e nella musica orchestrale, le medianti cromatiche creano il tipico senso di **slittamento tonale improvviso** — come se il cielo cambiasse colore. Nella fusion jazz (Snarky Puppy, Chick Corea, Return to Forever) si usano per transizioni tra tonalità lontane senza bridge preparatori. Nei **bridge** di composizioni pop/jazz moderne sostituiscono le modulazioni classiche per quinta.`,
      esempi: `**Medianti cromatiche da Cmaj7:**
\`Cmaj7 – Ebmaj7\` (terza minore bassa: 1 nota comune, Sol)
\`Cmaj7 – Abmaj7\` (terza maggiore bassa: 2 note comuni, Do–Mi♭)
\`Cmaj7 – Emaj7\` (terza maggiore alta: 1 nota comune, Mi=Mi#)
\`Cmaj7 – Amaj7\` (terza minore alta: 1 nota comune, Mi♮)
\`Cm9 – Em9\` (medianti tra accordi minori)

**Uso in bridge cinematografico:**
\`Cmaj7 – Abmaj7 – Dbmaj7 – Cmaj7\`
Ogni accordo scende di terza maggiore → tre tappe per tornare al punto di partenza`,
      esercizi: [
        'Trova le note comuni tra \`Cmaj7\` e ognuna delle sue medianti cromatiche (Eb, Ab, E, A): elencale per ciascuna.',
        'Componi 8 battute usando solo medianti cromatiche: \`Cmaj7–Abmaj7–Emaj7–Cmaj7\` o variazioni.',
        'Scrivi una melodia di 8 note che "attraversi" due medianti cromatiche: la melodia deve muoversi per gradi congiunti.',
        'Analizza "Spain" di Chick Corea: identifica le medianti cromatiche nel tema e nel bridge.',
        'Componi un bridge di 8 battute che usa medianti cromatiche per modulare da Do a Mi♭ maggiore e tornare.',
        'Ear training: ascolta una progressione con medianti e identifica se il movimento è verso una terza maggiore o minore.',
      ],
      obiettivo: 'Costruire e usare medianti cromatiche riconoscendo le note comuni tra accordi lontani, applicandole a bridge, modulazioni improvvise e sonorità cinematografiche.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Esplora medianti cromatiche — confronta le note comuni tra accordi a distanza di terza e sperimenta transizioni cinematografiche tra tonalità lontane' },
      ],
    },
    {
      id: '10.2',
      title: 'Constant Structure Harmony',
      topics: ['Parallel maj7', 'Parallel m9', 'Planing'],
      teoria: `La **constant structure** (o parallel harmony / planing) è una tecnica dove lo stesso tipo di accordo si muove in parallelo — trasportato cromaticamente, per toni interi o per intervalli simmetrici — senza alcuna logica di tensione-risoluzione tonale. La coerenza non è funzionale ma **timbrica**: il suono rimane sempre lo stesso, solo trasportato.

Il **planing** propriamente detto è il movimento parallelo dove tutte le voci si muovono alla stessa distanza. Debussy lo usò sistematicamente per creare "accordi come colori" — il primo esempio di armonia non funzionale nella storia della musica occidentale. Nel jazz e nella fusion, Herbie Hancock, Chick Corea e i compositori di musica da film l'hanno adottato come linguaggio standard.

Le forme più usate:
- **Parallel maj7** (es. \`Cmaj7–Dbmaj7–Dmaj7\`): movimento cromatico, suono denso e ambiguo
- **Parallel m9** (es. \`Dm9–Fm9–Abm9–Bm9\`): su terze minori (ciclo diminuito) — quattro tonalità equidistanti
- **Parallel sus** (es. \`C7sus–Db7sus–Eb7sus\`): leggero, aperto, neo-soul

La logica è: **il movimento diventa melodia**, non armonia funzionale. Si pensa per forma e direzione, non per risoluzione.`,
      esempi: `**Parallel maj7 (cromatico):**
\`Cmaj7 – Dbmaj7 – Dmaj7 – Ebmaj7\` (ascesa cromatica)

**Parallel m9 (ciclo diminuito):**
\`Dm9 – Fm9 – Abm9 – Bm9\` (terze minori = divisione simmetrica dell'ottava)

**Parallel sus (whole tone):**
\`C7sus – D7sus – E7sus – F#7sus\` (sale per toni interi)

**Herbie Hancock "Maiden Voyage" style:**
\`D13sus – Eb13sus – D13sus\` (semitono oscillante, nessuna risoluzione)`,
      esercizi: [
        'Scegli un voicing di \`Cmaj9\` e muovilo cromaticamente per 8 accordi: scrivi tutte le note di ogni passo.',
        'Costruisci una progressione di 8 accordi \`m9\` su ciclo diminuito: Dm9–Fm9–Abm9–Bm9 ripetuto.',
        'Crea una melodia di 8 battute che giustifichi il movimento parallelo: la melodia deve avere un arco coerente.',
        'Analizza l\'intro di "Watermelon Man" (Hancock, versione Head Hunters): trova gli accordi paralleli.',
        'Componi 16 battute usando constant structure per la prima metà e armonia funzionale per la seconda: confronta il contrasto.',
        'Ear training: ascolta una progressione parallela e identifica se si muove cromaticamente, per toni interi o per terze minori.',
      ],
      obiettivo: 'Costruire progressioni di constant structure e planing, scegliendo il tipo di movimento parallelo (cromatico, per toni, simmetrico) e pensando l\'armonia come forma e colore invece che come funzione.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci progressioni di constant structure — visualizza il planing parallelo cromatico, per toni interi e su ciclo diminuito' },
      ],
    },
    {
      id: '10.3',
      title: 'Polychords e Slash Chords',
      topics: ['Ambiguità tonale', 'Basso indipendente'],
      teoria: `Uno **slash chord** (\`G/A\`) indica una triade superiore su un basso indipendente. Non è semplicemente un accordo in rivolto: la nota al basso può non appartenere alla triade — creando tensioni e colori che nessun accordo convenzionale può produrre.

La classificazione funzionale aiuta a usarli correttamente:
- **Slash chord funzionale**: \`Bb/C\` = C9sus (il Si♭ è la settima di Do, il Fa la quinta) — ha una funzione tonale riconoscibile
- **Slash chord modale**: \`G/A\` = A11sus — il Sol triade su La di basso crea colore modale sospeso
- **Slash chord coloristico**: \`F#/G\` — relazione cromatica senza funzione tonale, effetto atonale/cinematico

Un **polychord** è due accordi sovrapposti simultaneamente, notato con frazione: \`Fmaj7 / Cmaj7\` = entrambi suonati insieme. Il risultato supera le tensioni tradizionali — è armonia bitonale. Nelle upper structure triads (vedi Livello 4) si usava già un caso semplice; qui si estende il concetto a qualsiasi combinazione.

La chiave dell'uso musicale è la **melodia come guida**: un polychord funziona se la melodia ne chiarisce il colore. Usati a caso suonano caotici; usati con intenzione sono tra i colori armonici più potenti del linguaggio moderno.`,
      esempi: `**Slash chords — classificazione:**
\`D/C\` → C13#11 (funzionale: Re su Do crea 9a e #11)
\`G/A\` → A11sus (modale: Sol triade su La)
\`Bb/C\` → C9sus (funzionale: accordo sus con nona)
\`F#/G\` → coloristico/atonale (tritono tra F# e G)

**Polychord bitonale:**
\`Fmaj7 / Cmaj7\`: Do–Mi–Sol–Si + Fa–La–Do–Mi → 7 note su 8 della scala maggiore simultanee

**Uso cinematografico:**
\`Ebmaj7 / Cmaj7\` — colore "stella/eterno", tipico Hans Zimmer`,
      esercizi: [
        'Costruisci 10 slash chords su Do di basso: \`Eb/C, F/C, G/C, A/C, B/C\` e altrettanti con bassi diversi. Classificali.',
        'Usa \`Bb/C\` e \`F/G\` come sostituzioni sus in una progressione. Scrivi e suona il risultato.',
        'Crea un polychord bitonale sovrapponendo \`Fmaj7\` a \`Cmaj7\`: identifica le tensioni risultanti.',
        'Armonizza una melodia di 8 note usando slash chords: ogni nota melodica come voce superiore di un \`X/basso\`.',
        'Analizza "Prelude to a Kiss" di Ellington: trova gli accordi ibridi e classificali.',
        'Ear training: ascolta un slash chord e identifica se il basso è nella triade (rivolto) o è indipendente.',
      ],
      obiettivo: 'Costruire e classificare slash chords (funzionali, modali, coloristici) e polychords bitonali, usando il basso indipendente per creare tensioni e colori non raggiungibili con accordi convenzionali.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Costruisci slash chords e polychords — visualizza la separazione tra basso indipendente e triade superiore, con identificazione delle tensioni generate' },
      ],
    },
    {
      id: '10.4',
      title: 'Armonia Negativa',
      topics: ['Inversione degli intervalli', 'Asse di riflessione', 'Ernst Levy', 'Jacob Collier'],
      teoria: `L'**armonia negativa** è un sistema teorico basato sull'inversione degli intervalli attorno a un asse di riflessione. Sistematizzata da Ernst Levy nel "A Theory of Harmony" (1985) e resa popolare da **Jacob Collier**, inverte la logica costruttiva degli accordi: invece di costruire verso l'alto per terze, si costruisce verso il basso.

Il principio è semplice: dato un asse (di solito la coppia Sol–Re♭, cioè il punto mediano dell'ottava cromatica), ogni nota viene "rispecchiata". Il Do diventa Sol (riflessione verso il basso), il Mi diventa Mi♭, il Sol diventa Re. Risultato: \`Cmaj7\` (Do–Mi–Sol–Si) diventa \`Gm(maj7)\` (Sol–Mi♭–Re–Si♭) — il suo **"negativo"**.

La progressione II-V-I in Do (\`Dm7–G7–Cmaj7\`) riflessa diventa \`Bbmaj7–Dm7–Gm7\` — una cadenza plagale nel minore. Jacob Collier usa questa tecnica per costruire armonie impossibili che "sembrano sbagliate ma suonano giuste": il suono è riconoscibile perché la struttura intervallare è preservata, ma capovolto.

Questo approccio non è solo teorico: permette di generare **progressioni alternative simmetriche** e di comprendere la relazione specchio tra accordi maggiori e minori.`,
      esempi: `**Asse di riflessione Sol–Re♭ (centro cromatico):**
- Do ↔ Sol (a distanza uguale dall'asse)
- Mi ↔ Mi♭
- Si ↔ Si♭
- Re ↔ Fa

**Cmaj7 negativo:**
\`Cmaj7\` (Do–Mi–Sol–Si) → riflessione → \`Gm(maj7)\` (Sol–Mi♭–Re–Si♭)

**II-V-I negativo in Do:**
Originale: \`Dm7 – G7 – Cmaj7\`
Negativo: \`Bbmaj7 – Dm7 – Gm7\` (cadenza plagale minore)

**Jacob Collier "In the Bleak Midwinter":**
usa scambi di polarità armonica che suonano come "modulazioni impossibili"`,
      esercizi: [
        'Calcola il negativo di \`Fmaj7\`, \`Dm7\`, \`G7\` usando l\'asse Sol–Re♭. Scrivi le note riflesse.',
        'Trasforma la progressione \`Cmaj7–Am7–Dm7–G7\` nel suo negativo completo. Suona entrambe.',
        'Ascolta "In the Bleak Midwinter" di Jacob Collier e identifica 2-3 momenti dove usa la polarità negativa.',
        'Componi una progressione di 8 battute che alterna armonia positiva e negativa: usa l\'asse Sol–Re♭.',
        'Trova la progressione negativa di "Autumn Leaves" (le prime 8 battute).',
        'Ear training: ascolta un accordo e il suo negativo in sequenza: descrivi la differenza di colore.',
      ],
      obiettivo: 'Comprendere il sistema di armonia negativa e calcolare la riflessione di accordi e progressioni attorno all\'asse Sol–Re♭, applicando la tecnica per generare progressioni alternative simmetriche.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Esplora progressioni e le loro versioni negative — sperimenta la riflessione attorno all\'asse Sol–Re♭ in stile Jacob Collier' },
      ],
    },
  ],
};

const level11: Level = {
  id: 11,
  phase: 3,
  title: 'Coltrane Changes e Simmetria',
  subsections: [
    {
      id: '11.1',
      title: 'Giant Steps e Cicli Simmetrici',
      topics: ['Tre centri tonali', 'Terze maggiori', 'Countdown'],
      teoria: `I **Coltrane changes** sono una delle innovazioni armoniche più radicali del jazz. John Coltrane, in "Giant Steps" (1960), sostituì le progressioni tonali tradizionali con un ciclo di **tre centri tonali equidistanti** — Si, Sol, Mi♭ — separati da terze maggiori (4 semitoni). L'ottava viene divisa in tre parti uguali.

La logica è simmetrica: partendo da Si maggiore, scendo di una terza maggiore → Sol maggiore, scendo di un'altra terza → Mi♭ maggiore, poi di un'altra terza → Si maggiore (ottava). Tre tonalità, distanza costante, nessuna gerarchia. Ogni centro tonale è raggiunto tramite il suo **V7** locale, rendendo ogni cambio tonale "giustificato" ma sorprendente.

La progressione originale di "Giant Steps": \`Bmaj7–D7–Gmaj7–Bb7–Ebmaj7–Am7–D7–Gmaj7–Bb7–Ebmaj7–F#7–Bmaj7\`.

**Countdown** (Coltrane, 1960) applica gli stessi principi su "Tune Up" di Miles Davis: ogni II-V-I viene espanso inserendo i tre centri tonali. Questo tipo di reharmonization su uno standard tradizionale è la forma più pratica di usare i Coltrane changes. Il pianista o chitarrista deve seguire progressioni rapide (spesso 2 accordi per battuta) rimanendo sul filo del tempo.`,
      esempi: `**Giant Steps — tre centri tonali (Si–Sol–Mi♭):**
\`Bmaj7 – D7 – Gmaj7 – Bb7 – Ebmaj7\`
Ogni cambio: terza maggiore in discesa con V7 preparatorio

**Coltrane changes su II-V-I in Do:**
Standard: \`Dm7 – G7 – Cmaj7\`
Espanso: \`Dm7–G7 | Ebmaj7–Ab7 | Bmaj7–E7 | Cmaj7\`

**Cicli simmetrici a terze maggiori:**
Si (4 semitoni ↓) → Sol (4 semitoni ↓) → Mi♭ (4 semitoni ↓) → Si`,
      esercizi: [
        'Analizza "Giant Steps" di Coltrane: scrivi tutta la progressione (32 battute) con i gradi romani per ciascun centro tonale.',
        'Applica Coltrane changes a II-V-I in Do, Sol, Fa e Re: espandi ogni II-V-I con i tre centri tonali.',
        'Suona solo gli accordi di "Giant Steps" a tempo di metronommo 60 bpm, poi 80. Interiorizza la successione.',
        'Scrivi una reharmonization "leggera" di uno standard: inserisci un solo centro tonale extra nel turnaround.',
        'Scrivi una reharmonization "estrema": applica Coltrane changes a ogni II-V della progressione.',
        'Ear training: ascolta "Giant Steps" e "Countdown": identifica i momenti dove il centro tonale cambia.',
      ],
      obiettivo: 'Comprendere la logica dei tre centri tonali equidistanti dei Coltrane changes, analizzare Giant Steps e applicare la reharmonization coltraniana a progressioni standard.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci Coltrane changes — esplora la divisione dell\'ottava in terze maggiori e il ciclo Bmaj7–Gmaj7–Ebmaj7 con i relativi V7' },
      ],
    },
    {
      id: '11.2',
      title: 'Scale Simmetriche',
      topics: ['Scala diminuita', 'Scala esatonale', 'Triadi aumentate'],
      teoria: `Le **scale simmetriche** dividono l'ottava in parti uguali, generando strutture dove ogni intervallo si ripete identico. Non sono diatoniche — non appartengono a nessuna tonalità — e per questo creano tensioni uniche, impossibili con scale tonali.

La **scala diminuita** alterna tono e semitono (o semitono e tono): Do–Re–Mi♭–Fa–Sol♭–La♭–La–Si. Divisa per 3 (quattro terze minori) = simmetria dim7. Su un \`V7b9\` si usa la versione semitono-tono; su un \`dim7\` passante si usa tono-semitono. La simmetria permette trasposizioni identiche ogni 3 semitoni.

La **scala esatonale** (whole tone) divide l'ottava in 6 toni interi uguali: Do–Re–Mi–Fa#–Sol#–La#. Nessuna quinta giusta, solo quarte aumentate. Su accordi \`+7\` (dominante aumentata): produce il colore sognante/fluttuante di Debussy. Esistono solo 2 scale esatonali distinte (tutti i 12 semitoni sono coperti con Do e Do#).

Le **triadi aumentate** (\`C+\` = Do–Mi–Sol#) dividono l'ottava in tre terze maggiori uguali. Tre triadi aumentate distinte coprono tutte le 12 note. Usate in sequenza parallela creano un effetto di "rotazione" — nessun centro tonale stabile.`,
      esempi: `**Scala diminuita semitono-tono su G7b9:**
Sol–La♭–Si♭–Si–Do#–Re–Mi–Fa (8 note)
Tensioni: b9, #9, #11/b5, 13 — tutte le alterazioni contemporaneamente

**Scala esatonale da Do:**
Do–Re–Mi–Fa#–Sol#–La# (6 note)
Su \`C7+\` o \`C7#5\`: ogni nota è a un tono di distanza

**Triadi aumentate in sequenza:**
\`Caug – Eaug – Abaug\` (le tre uniche triadi aumentate distinte)
Ogni trasposizione di 4 semitoni produce la stessa triade

**Pattern ciclico diminuito:**
\`Cdim7 → E♭dim7 → F#dim7 → Adim7\` = tutte uguali (simmetria)`,
      esercizi: [
        'Costruisci la scala diminuita semitono-tono da Sol e suonala su \`G7b9–Cmaj7\`: ascolta le tensioni.',
        'Costruisci la scala esatonale da Do e da Do#: verifica che coprono tutte e 12 le note cromatiche.',
        'Crea un voicing \`dim7\` da ogni membro della famiglia 1 (Cdim7=Ebdim7=F#dim7=Adim7): suonali uno dopo l\'altro.',
        'Improvvisa su \`C7+\` usando solo la scala esatonale: canta la melodia prima di suonarla.',
        'Componi un bridge di 8 battute usando triadi aumentate in sequenza parallela: \`Caug–Eaug–Abaug–Caug\`.',
        'Scrivi una "linea fuori-dentro" di 4 battute: 2 battute con scala diminuita (outside), 2 battute diatoniche (inside).',
      ],
      obiettivo: 'Costruire e usare scale diminuita, esatonale e triadi aumentate per creare tensioni simmetriche, linee fuori-dentro e pattern ciclici nel jazz moderno.',
      tools: [
        { tabId: 'scaleadvisor', label: 'Scale Advisor', icon: '🧭', desc: 'Esplora scale simmetriche — diminuita, esatonale e aumentata — con visualizzazione degli accordi che le richiedono e delle tensioni che generano' },
      ],
    },
  ],
};

const level12: Level = {
  id: 12,
  phase: 4,
  title: 'Neo-soul, Gospel, Fusion e Contemporary Jazz',
  subsections: [
    {
      id: '12.1',
      title: 'Neo-soul Harmony',
      topics: ['6/9', '13sus', 'Minor plagal cadence', 'Quartal voicings'],
      teoria: `Il **neo-soul** è un linguaggio che prende il vocabolario armonico del jazz moderno e lo porta dentro strutture ritmiche e formali del soul, R&B e funk. Artisti come D'Angelo, Erykah Badu, Musiq Soulchild, e band come Snarky Puppy e Vulfpeck ne sono i rappresentanti. Il risultato è armonia sofisticata senza l'astrazione del jazz puro.

Il vocabolario armonico caratteristico include: \`maj9\`, \`m9\`, \`6/9\` (nona e sesta senza settima, suono aperto e luminoso), \`13sus\` (accordo sus con tredicesima — colore sospeso e moderno), **quartal voicings** (costruiti per quarte, privi di terza). La **minor plagal cadence** (\`IVm-I\`) è uno dei movimenti più tipici: \`Fm-Cmaj7\` in Do, produce il colore soul/gospel oscuro che poi si apre.

I **voicing stretti e cluster** (note a distanza di semitono o tono) sono tipici del gospel pianistico ma filtrati nel neo-soul diventano più minimali. Il **movimento interno** (inner voice movement) è cruciale: mentre la struttura armonica rimane stabile, le voci interne si muovono per semitoni (linee cromatiche interne tra 9a e 13a per esempio), creando il senso di "animazione" tipico di questo genere.`,
      esempi: `**Progressione neo-soul in Do maggiore:**
\`Cmaj9 – E7#9 – Am9 – Gm9 C13\`
(I → III7#9 → VIm → II-V modale)

**Progressione con minor plagal:**
\`Fmaj9 – Fm9 – Em7 – A7alt – Dm9 – G13\`
(il \`Fm9\` al posto di \`Fmaj9\` crea il colore dark soul)

**6/9 chord:**
\`C6/9\` = Do–Mi–Sol–La–Re (nona senza settima)
Suono aperto e moderno — non "jazzistico" ma pop-sofisticato

**13sus:**
\`G13sus\` = Sol–Do–Re–Mi–La (sus con 9a e 13a)
Tensione sospesa che non risolve — tipico neo-soul`,
      esercizi: [
        'Trasforma questa progressione pop (C–Am–F–G) in neo-soul: aggiungi estensioni (9, 13, #11) e sostituisci il IV con il IVm.',
        'Costruisci \`Cmaj9\`, \`C6/9\` e \`C13sus\`: suonali in sequenza e descrivi la differenza di colore.',
        'Crea un inner voice movement su \`Cmaj9\`: mantieni la fondamentale e tieni il La (13a) mentre il Re (9a) scende a Do.',
        'Scrivi un ritornello di 8 battute in stile neo-soul con basso cromatico: la fondamentale si muove per semitoni.',
        'Analizza "Untitled (How Does It Feel)" di D\'Angelo: identifica gli accordi usati e le estensioni.',
        'Componi un vamp di 4 accordi neo-soul: usa quartal voicings per almeno 2 degli accordi.',
      ],
      obiettivo: 'Costruire il vocabolario armonico del neo-soul (6/9, 13sus, minor plagal, quartal voicings) e applicarlo per trasformare progressioni semplici in linguaggio soul-jazz moderno.',
      tools: [
        { tabId: 'voicings', label: 'Piano Voicings', icon: '🎹', desc: 'Costruisci voicing neo-soul — 6/9, 13sus, quartal e cluster — con visualizzazione del movimento interno delle voci e confronto con i voicing jazz tradizionali' },
      ],
    },
    {
      id: '12.2',
      title: 'Gospel Harmony',
      topics: ['Plagal movement', 'Shout chords', 'Walk-up/down'],
      teoria: `Il **gospel** è la fonte primaria dell'armonia soul, R&B e jazz moderno. Molti dei movimenti che oggi consideriamo "jazz" — il IV plagale, il IVm, i passaggi cromatici, le dominanti secondarie dense — vengono dalla tradizione pianistica e corale del gospel afroamericano.

Il movimento **plagale** (IV–I) è il cuore del gospel: "Amen". Ma nella sua forma più sofisticata include il **IVm–I** (es. \`Fm–Cmaj7\`), le **walk-up** (salita cromatica del basso verso la tonica: \`G–Ab–A–Bb–Cmaj7\`) e le **walk-down** (discesa dal IV al I via semitoni). Ogni nota della walkup è solitamente un accordo completo.

I **shout chords** sono accordi forti, densi, suonati a piena voce nella sezione di climax: accordi a 5-6 voci con tensioni piene (9, 13, #11), di solito su dominanti. Creano la "tensione collettiva" tipica del gospel — tutti insieme, massima intensità.

Il **call and response armonico** è il dialogo tra accordo di tonica (risposta stabile) e accordo di dominante o subdominante (chiamata tesa). In gospel si struttura in frasi di 2+2 o 4+4 battute, dove la seconda frase "risponde" alla prima con un cambio di funzione.`,
      esempi: `**Walk-up gospel verso Cmaj7:**
\`G – Ab – A – Bb – Cmaj7\` (basso cromatico ascendente)
Ogni passo è un accordo completo sulla nota di basso

**Cadenza gospel con diminished passing:**
\`Cmaj7 – C#dim7 – Dm7 – G13\` → \`Cmaj7\`

**Shout chord finale:**
\`G13b9\` a 5 voci: Sol–Si–Fa–La–Mi♭ (terza, settima, nona, tredicesima, b9)

**Minor plagal:**
\`Fm9 – Cmaj9\` — il Fa minore su Do maggiore, colore oscuro poi apertura`,
      esercizi: [
        'Armonizza "Amazing Grace" (prime 8 battute) in stile gospel: aggiungi passing dim, walk-up e dominanti secondarie.',
        'Costruisci una walk-up cromatica di 6 accordi verso \`Cmaj7\`: scrivi ogni accordo completo su ogni nota del basso.',
        'Scrivi un finale gospel di 4 battute con shout chord: usa accordi a 5 voci con tensioni piene.',
        'Crea un turnaround gospel con diminished passing chords: \`Cmaj7–Ebdim7–Dm7–G13b9–Cmaj7\`.',
        'Analizza "Take My Hand, Precious Lord" nella versione di Ray Charles: identifica walk-up, walk-down e plagal movement.',
        'Scrivi 8 battute di call and response armonico: 4 battute "domanda" (finisce su V7) + 4 "risposta" (finisce su I).',
      ],
      obiettivo: 'Costruire il linguaggio armonico gospel — movement plagale, minor plagal, walk-up/down, shout chords e call and response — per comprendere la radice del soul, del jazz e del R&B moderno.',
      tools: [
        { tabId: 'cadence', label: 'Cadence Trainer', icon: '🎓', desc: 'Esercitati sul movimento plagale gospel — IV–I, IVm–I, walk-up cromatiche — con ascolto e riconoscimento dei movimenti tipici del gospel armonico' },
      ],
    },
    {
      id: '12.3',
      title: 'Fusion e Contemporary Jazz',
      topics: ['Triadic pairs', 'Armonia modale', 'Tensioni non risolte'],
      teoria: `La **fusion** nasce negli anni '70 dall'incontro di jazz e rock elettrico (Miles Davis "Bitches Brew", Mahavishnu Orchestra, Weather Report) e definisce un linguaggio armonico distinto: modale, ritmicamente asimmetrico, spesso con tensioni **non risolte**.

Il **contemporary jazz** (Snarky Puppy, Tigran Hamasyan, Robert Glasper, Kamasi Washington, Yussef Dayes) evolve la fusion integrando gospel, neo-soul, hip-hop e influenze etniche. L'armonia è caratterizzata da: accordi sus e quartali, slash chords su pedali, progressioni modali, **voicing larghi** (le voci si distribuiscono su due o tre ottave) e **armonia sospesa** (chord non risolto come elemento espressivo).

I **triadic pairs** sono coppie di triadi usate come unità melodica/armonica senza terze: es. \`Dm\` e \`Em\` alternate su un pedale di Re. Il suono è aperto, modale, quasi "fuori" — ma rimane dentro una logica scalare. Herbie Hancock, Wayne Shorter e i pianisti di contemporary jazz usano questa tecnica estensivamente per creare improvvisazioni che sembrano "flottare" sopra l'armonia.

L'**armonia nei metri dispari** (5/4, 7/4, 11/8) cambia la percezione dell'accordo: le tensioni vengono risolte in punti diversi rispetto al 4/4, creando effetti di suspense e sorpresa.`,
      esempi: `**Triadic pairs su Re dorico (Dm + Em):**
\`Dm – Em – Dm – Em\` su pedale di Re
→ Le note di Em (Mi–Sol–Si) aggiungono 9a, 4a, 6a al centro dorico

**Vamp fusion modale:**
\`D13sus | Eb13sus\` (oscillazione semitono, nessuna risoluzione)

**Armonia sospesa contemporary:**
\`Fmaj7#11/G | Ebmaj7/F\` (slash chords con basso che sale di tono)

**Herbie Hancock "Maiden Voyage" style:**
4 centri modali sus: \`D13sus, F#13sus, Bbmaj7sus, Abmaj7sus\``,
      esercizi: [
        'Componi un vamp fusion di 8 battute su Re dorico usando triadic pairs: \`Dm\` e \`Em\` in dialogo.',
        'Scrivi un tema di 16 battute in 7/4: usa accordi non funzionali e nota come la tensione si distribuisce diversamente.',
        'Analizza "Actual Proof" di Herbie Hancock: identifica accordi quartali, sus e triadic pairs.',
        'Analizza un brano di Snarky Puppy (es. "Lingus"): mappa la struttura armonica — dove è modale, dove è funzionale.',
        'Crea una progressione di 8 battute con voicing larghi (distanza di 2+ ottave tra basso e voce superiore).',
        'Improvvisa su un vamp \`Cm13sus\` per 4 minuti usando solo triadic pairs: \`Cm–Dm\`, \`Cm–Eb\`, \`Cm–Fm\` in rotazione.',
      ],
      obiettivo: 'Comprendere il linguaggio armonico della fusion e del contemporary jazz — triadic pairs, armonia modale, tensioni non risolte e voicing larghi — per passare dal jazz tradizionale al linguaggio moderno.',
      tools: [
        { tabId: 'arrangement', label: 'Arrangement Blueprint', icon: '🎼', desc: 'Esplora distribuzione armonica fusion tra strumenti — voicing larghi, pedale di basso, triadic pairs e slash chords in contesto di band contemporanea' },
      ],
    },
  ],
};

const level13: Level = {
  id: 13,
  phase: 4,
  title: 'Armonizzazione Melodica',
  subsections: [
    {
      id: '13.1',
      title: 'Harmonizing a Melody',
      topics: ['Nota come fondamentale', 'Terza', 'Quinta', 'Settima', 'Tensione'],
      teoria: `**Armonizzare una melodia** significa trovare, per ogni nota melodica, uno o più accordi che la contengano. La nota non è un vincolo — è una porta: ogni nota può avere molteplici identità armoniche, e scegliere quale assegnarle è il cuore creativo dell'armonizzazione.

Una singola nota può essere simultaneamente: **fondamentale** (accordo sulla stessa nota), **terza** (accordo una terza sotto), **quinta** (accordo una quinta sotto), **settima** (accordo una settima sopra la fondamentale), **nona** (accordo due gradi sotto nella scala), **tredicesima**, **#11** o **alterazione** (b9, #9, b13).

Esempio con la nota Mi: fondamentale di E, terza di C, quinta di A, settima di Fmaj7, nona di D, tredicesima di G7, #11 di Bbmaj7, b9 di Eb7.

La **scelta del basso** agisce in modo indipendente dalla voce melodica: un basso cromatico o contrario alla melodia crea tensione armonica senza cambiare la nota superiore. La **funzione** determina il colore: assegnare la stessa nota a un accordo di tonica vs un accordo di dominante produce effetti radicalmente diversi. La **densità armonica** (quanti accordi per misura) influenza il senso di movimento: alta densità = agitazione, bassa densità = calma.`,
      esempi: `**La nota Mi armonizzata in 8 modi diversi:**
- \`Emaj7\`: Mi = fondamentale
- \`Cmaj7\`: Mi = terza
- \`Am7\`: Mi = quinta
- \`Fmaj7\`: Mi = settima
- \`D7\`: Mi = nona (Re+9=Mi)
- \`G7\`: Mi = tredicesima
- \`Bbmaj7#11\`: Mi = #11 (enarm. Re#)
- \`Eb7b9\`: Mi = b9 (enarm. Fa♭)

**Stessa melodia, due armonizzazioni:**
Melodia: Do–Mi–Sol–Si (arpegio di Cmaj7)
Jazz: \`Cmaj7–Am7–Dm7–G7\`
Neo-soul: \`Cmaj9–Eb7#9–Dm9–Ab7\``,
      esercizi: [
        'Prendi la nota Sol e trova 8 accordi diversi in cui può apparire: elenca nota, accordo e posizione (fondamentale/terza/ecc.).',
        'Armonizza la scala di Do maggiore (8 note) in 3 modi: ogni nota come fondamentale, poi come terza, poi come settima.',
        'Prendi una melodia di 4 battute e scrivi 3 armonizzazioni diverse: diatonica, jazz (con dominanti secondarie), moderna (con prestiti modali).',
        'Analizza le prime 8 battute di "My Favorite Things": per ogni nota melodica, identifica come viene trattata dall\'armonia originale.',
        'Crea una progressione con basso cromatico contrario alla melodia: melodia ascendente, basso discendente.',
        'Ear training: ascolta una nota suonata sopra diversi accordi consecutivi — identifica come cambia il suo "ruolo" armonico.',
      ],
      obiettivo: 'Armonizzare qualsiasi nota melodica in almeno 5 modi diversi (fondamentale, terza, quinta, settima, tensione), scegliendo la versione più adatta al contesto espressivo e funzionale.',
      tools: [
        { tabId: 'voiceleading', label: 'Voice Leading Lab', icon: '🎵', desc: 'Analizza come una nota melodica si muove attraverso diversi accordi — visualizza le diverse posizioni (fondamentale, terza, tensione) che una singola nota assume in sequenze armoniche diverse' },
      ],
    },
    {
      id: '13.2',
      title: 'Armonizzazione a 4, 5 e 6 Parti',
      topics: ['SATB', 'Drop voicings', 'Line cliché', 'Cluster'],
      teoria: `L'armonizzazione a più parti è la scrittura per ensemble: ogni voce ha un percorso melodico proprio, coerente con l'armonia complessiva. La sfida non è solo trovare gli accordi giusti — è distribuirli in modo **suonabile** e **bello** su strumenti diversi.

Il sistema **SATB** (Soprano, Alto, Tenore, Basso) è il punto di partenza: ogni voce ha un registro, un range, e regole di condotta (no quinte parallele, risoluzione della sensibile, salti limitati). Nel jazz si usano invece sistemi aperti: **close voicing** (tutte le voci entro un'ottava), **open voicing** (spread su due ottave), **drop 2** (seconda voce dall'alto abbassata di ottava) e **spread voicing** (voci distribuite liberamente).

Il **voice leading** in armonizzazione a più parti richiede: movimento per gradi congiunti dove possibile, **contrary motion** (basso e soprano si muovono in direzione opposta — il massimo della complessità armonica con il massimo equilibrio), mantenimento delle **note comuni** tra accordi successivi.

La **line cliché** è una linea cromatica interna che scende (o sale) mentre le altre voci rimangono: es. \`Cmaj7–C7–Cm7–Cm6\` dove il Si scende a Si♭, La♭, La. È uno degli effetti più emozionali nell'arrangiamento jazz e pop.`,
      esempi: `**Armonizzazione in close position di Do–Re–Mi (soprano):**
- Do: \`Cmaj7\` close (Si–Sol–Mi–Do)
- Re: \`Dm7\` close (Do–La–Fa–Re)
- Mi: \`Em7\` close (Re–Si–Sol–Mi)

**Line cliché discendente:**
\`Cmaj7 – C7 – Cm7 – Cm6\`
Voce interna: Si→Si♭→La♭→La (semitoni)

**Contrary motion:**
Soprano: Do→Re→Mi (ascendente)
Basso: Do→Si→La (discendente)
→ Convergenza e divergenza controllata`,
      esercizi: [
        'Armonizza la scala di Do maggiore in close position a 4 voci: scrivi tutte le 4 voci per ogni nota.',
        'Trasforma la stessa armonizzazione in drop 2: abbassa la seconda voce dall\'alto di un\'ottava.',
        'Scrivi una line cliché di 4 accordi dove il basso rimane su Do mentre una voce interna scende cromaticamente.',
        'Armonizza "Joy to the World" (le prime 8 note) a 4 voci con contrary motion tra soprano e basso.',
        'Scrivi un arrangiamento per quartetto jazz (piano, chitarra, basso, voce) delle prime 4 battute di Autumn Leaves.',
        'Ear training: ascolta un accordo a 4 voci e identifica se è in close position, drop 2 o spread.',
      ],
      obiettivo: 'Scrivere armonizzazioni a 4-6 parti in close, drop 2 e spread voicing con voice leading corretto, contrary motion e line cliché, producendo arrangiamenti suonabili per ensemble jazz.',
      tools: [
        { tabId: 'voiceleading', label: 'Voice Leading Lab', icon: '🎵', desc: 'Analizza il voice leading a 4 parti — visualizza il movimento di ogni voce, verifica contrary motion e individua line cliché nelle progressioni armonizzate' },
      ],
    },
  ],
};

const level14: Level = {
  id: 14,
  phase: 4,
  title: 'Analisi Armonica Avanzata',
  subsections: [
    {
      id: '14.1',
      title: 'Analisi di Standard',
      topics: ['Autumn Leaves', 'Giant Steps', 'Dolphin Dance', 'Body and Soul'],
      teoria: `L'analisi di standard jazz è il metodo più diretto per imparare armonia: si studia direttamente ciò che i grandi compositori hanno scritto. Non si impara "la regola" in astratto — si vede come è stata applicata, piegata, trasformata in musica reale.

L'analisi sistematica di uno standard richiede di individuare: **forma** (AABA, ABAC, 32 o 64 battute?), **tonalità principale** e **centri tonali temporanei**, tutti i **II-V-I** espliciti e impliciti, le **dominanti secondarie** e dove risolvono, le **tritone substitutions** (riconoscibili dal movimento cromatico del basso), i **diminished passing chords**, il **modal interchange** (accordi presi dalla minore parallela), gli **accordi ambigui** (pivot, enarmonie) e i **punti di massima tensione** e di **riposo**.

Ogni standard è una lezione diversa: **Autumn Leaves** è un laboratorio di II-V-I concatenati e modulazioni; **Giant Steps** è lo studio dei Coltrane changes; **Dolphin Dance** mostra l'armonia modale di Herbie Hancock; **Body and Soul** è un classico di reharmonization implicita e modulazioni cromatiche. Studiare il repertorio non è diverso dal leggere classici letterari: ogni opera insegna qualcosa di distinto.`,
      esempi: `**Analisi di "Autumn Leaves" (Sol minore) — prime 8 battute:**
\`Cm7–F7\` = II-V in Sib maggiore → \`Bbmaj7\`
\`Ebmaj7–Am7b5–D7\` = IV–II-V in Sol minore → \`Gm\`
Struttura: ciclo di quinte discendente in due tonalità parallele

**Analisi di "Body and Soul" — primo cambio armonico:**
\`Ebm7–Ab7–Dbmaj7\` = II-V-I in Re♭
→ Poi modulazione cromatica verso Do maggiore via \`C7\`

**Punti di analisi per ogni standard:**
Forma → tonalità → II-V-I → dom. secondarie → tritone sub → modal interchange → punti tensione`,
      esercizi: [
        'Analizza tutte le 32 battute di "Autumn Leaves": scrivi ogni accordo con il numero romano nella tonalità locale.',
        'Analizza "Giant Steps": identifica i tre centri tonali (Si, Sol, Mi♭) e i V7 che preparano ogni centro.',
        'Analizza "Dolphin Dance" di Hancock: trova gli accordi modali, i sus e le tensioni non risolte.',
        'Analizza "Body and Soul": identifica tutte le modulazioni cromatiche e scrivi il centro tonale di ogni sezione.',
        'Confronta due versioni di uno stesso standard (es. "Autumn Leaves" di Miles Davis e di Bill Evans): le griglie sono identiche? Ci sono variazioni armoniche?',
        'Ear training: ascolta "Footprints" di Wayne Shorter e identifica a orecchio la forma e i centri tonali principali.',
      ],
      obiettivo: 'Analizzare qualsiasi standard jazz identificando sistematicamente forma, modulazioni, II-V-I, dominanti secondarie, tritone sub, modal interchange e punti di tensione e riposo.',
      tools: [
        { tabId: 'analysis', label: 'Harmonic Analysis', icon: '🔬', desc: 'Analizza standard jazz — identifica II-V-I, modulazioni, dominanti secondarie e tritone sub con visualizzazione della struttura armonica brano per brano' },
      ],
    },
    {
      id: '14.2',
      title: 'Analisi di Brani Moderni',
      topics: ['Wayne Shorter', 'Jacob Collier', 'Snarky Puppy', 'Robert Glasper'],
      teoria: `L'analisi dei brani moderni richiede strumenti diversi da quella degli standard: spesso non c'è una griglia tonale chiara, i centri si moltiplicano o scompaiono, e i principi che governano la progressione sono **timbrici, ritmici e emotivi** oltre che funzionali.

**Wayne Shorter** (post-1964): armonia ambigua, accordi che non risolvono, progressioni circolari dove ogni accordo è ugualmente "a casa". "Nefertiti", "Infant Eyes", "ESP" — studiare questi brani insegna a pensare gli accordi come colori, non come funzioni.

**Herbie Hancock** ("Maiden Voyage", "Dolphin Dance"): armonia modale su centri sus, triadic pairs, accordi quartali. La funzione non sparisce — si dissolve in texture.

**Robert Glasper** e **Jacob Collier** portano il linguaggio contemporaneo: Glasper fonde jazz e hip-hop con accordi ripetuti come loop (armonia statica usata come groove), Collier usa armonia negativa, polychord e modulazioni impossibili.

**Snarky Puppy** e **Yussef Dayes** integrano fusion, neo-soul, musica africana e jazz moderno: accordi modali su groove funk, voicing larghi, triadic pairs su vamp. Analizzarli significa capire come l'armonia jazz vive nel 2020+.`,
      esempi: `**Wayne Shorter "Nefertiti" (tema):**
Melodia circolare su accordi che cambiano sotto di essa
\`Fmaj7–Bbmaj7–Ebmaj7–Abmaj7\` — constant structure (terze)

**Herbie Hancock "Maiden Voyage" (4 centri modali):**
\`D13sus | F#13sus | Bbmaj7sus | Abmaj7sus\`
Ogni accordo è un centro modale sus — nessuna risoluzione

**Robert Glasper "Ah Yeah":**
Vamp di 2 accordi ripetuti all'infinito: \`Dm9–G13sus\`
L'armonia è groove, non progressione

**Jacob Collier — polarità negativa applicata a pop:**
Progressione "impossibile" che usa riflessione armonica attorno all'asse`,
      esercizi: [
        'Analizza "Nefertiti" di Wayne Shorter: identifica la struttura del tema e come gli accordi si muovono indipendentemente dalla melodia.',
        'Analizza "Maiden Voyage" di Hancock: scrivi i 4 centri modali sus e identifica cosa li connette.',
        'Analizza un brano di Snarky Puppy a tua scelta: mappa armonia modale vs funzionale, identifica i vamp.',
        'Analizza "In the Bleak Midwinter" di Jacob Collier (versione armonia negativa): identifica 3 momenti di polarità inversa.',
        'Analizza un brano di Yussef Dayes: identifica come il vamp e la struttura ritmica influenzano la percezione dell\'armonia.',
        'Scrivi un paragrafo che descriva la "personalità armonica" di uno dei compositori analizzati: cosa lo rende riconoscibile?',
      ],
      obiettivo: 'Analizzare brani di compositori moderni (Shorter, Hancock, Glasper, Collier, Snarky Puppy) usando gli strumenti dell\'armonia modale, non funzionale e contemporanea, identificando le tecniche specifiche di ogni stile.',
      tools: [
        { tabId: 'analysis', label: 'Harmonic Analysis', icon: '🔬', desc: 'Porta l\'analisi armonica su brani moderni — identifica armonia modale, constant structure, centri sus e progressioni non funzionali in Wayne Shorter, Hancock e compositori contemporanei' },
      ],
    },
  ],
};

const level15: Level = {
  id: 15,
  phase: 4,
  title: 'Ear Training Armonico',
  subsections: [
    {
      id: '15.1',
      title: 'Riconoscimento Accordi',
      topics: ['Maj7', 'm7', '7', 'm7b5', 'dim7', 'sus', '7alt'],
      teoria: `L'**ear training armonico** è la capacità di identificare accordi e progressioni a orecchio, senza strumento. Non è un talento innato — è un'abilità che si sviluppa con pratica sistematica e consapevole. È forse la competenza più importante per un musicista: tutto il resto (analisi, composizione, improvvisazione) dipende dalla capacità di sentire quello che si suona.

Il percorso di riconoscimento degli accordi procede per gradi: prima si riconoscono le **qualità base** (maggiore vs minore), poi i **tipi di settima** (\`maj7\` vs \`m7\` vs \`7\`), infine le **qualità avanzate** (\`m7b5\`, \`dim7\`, \`7alt\`, \`mMaj7\`). Il segreto è cantare attivamente: la **terza** definisce maggiore/minore, la **settima** definisce il tipo (maggiore, minore, diminuita). Cantare queste due note in ogni accordo è l'esercizio fondamentale.

Le **tensioni** (9, 11, 13 e le loro alterazioni) si riconoscono come colori aggiuntivi sopra la struttura base. Un \`C7alt\` ha la stessa struttura base di \`C7\` — ma la presenza di b9, #9 o b13 crea un "sapore" immediato riconoscibile. Il \`13sus\` non ha la terza: si sente la mancanza di tensione definitoria.`,
      esempi: `**Guida al riconoscimento per qualità:**
- \`Cmaj7\`: settima luminosa, brilla sopra — "caldo"
- \`Cm7\`: terza abbassata, scuro ma stabile
- \`C7\`: tritono Mi–Si♭, vuole risolvere — "teso"
- \`Cm7b5\`: quinta abbassata, instabile e cupo
- \`Cdim7\`: completamente simmetrico, tensione in tutte le direzioni
- \`C7alt\`: \`C7\` con b9/#9/b13 — "teso e acido"
- \`C13sus\`: nessuna terza, sospeso, aperto

**Progressione per confronto:**
\`Cmaj7 – Cm7 – C7 – C7alt\` in sequenza: senti la qualità cambiare`,
      esercizi: [
        'Ascolta 20 accordi isolati (usa un\'app o chiedi a qualcuno di suonarli): identifica la qualità senza vedere la tastiera.',
        'Per ogni accordo ascoltato, canta prima la terza poi la settima: due note ti danno la qualità fondamentale.',
        'Ascolta \`Cmaj7\`, \`Cm7\`, \`C7\`, \`C7alt\` in sequenza: descrivi con una parola il colore di ciascuno.',
        'Esercizio di riconoscimento progressivo: inizia con maj7 vs m7 (2 opzioni), poi aggiungi 7dom (3), poi m7b5 (4), infine dim7 e 7alt.',
        'Trascrivi le prime 4 battute di "Naima" di Coltrane: identifica i tipi di accordo a orecchio prima di controllare.',
        'Ear training attivo: improvvisa sopra un accordo tenuto 8 battute, poi cambia qualità (es. da \`Cmaj7\` a \`C7alt\`): senti come la tua melodia deve adattarsi.',
      ],
      obiettivo: 'Identificare a orecchio tutti i tipi di accordo di settima (maj7, m7, 7, m7b5, dim7, mMaj7, sus, 7alt) cantando terza e settima, e riconoscere le tensioni (9, 13) come colori aggiuntivi.',
      tools: [
        { tabId: 'eartrainingpro', label: 'Ear Training Pro', icon: '👂', desc: 'Allena il riconoscimento di tutti i tipi di accordo — maj7, m7, 7dom, m7b5, dim7, sus, 7alt — con sessioni progressive dalla qualità base alle tensioni avanzate' },
      ],
    },
    {
      id: '15.2',
      title: 'Riconoscimento Progressioni',
      topics: ['II-V-I', 'Blues', 'Rhythm changes', 'Coltrane changes'],
      teoria: `Riconoscere le **progressioni** a orecchio è il passo successivo: non identificare un singolo accordo isolato, ma capire il movimento e la direzione armonica di una sequenza. Il contesto è tutto — un \`G7\` isolato e un \`G7\` che precede \`Cmaj7\` sono fisicamente lo stesso accordo, ma il secondo porta con sé l'intera logica del II-V-I.

Le progressioni si riconoscono prima di tutto dal **movimento del basso**: II-V-I discende per quinta (Re–Sol–Do), blues rimane prevalentemente stabile (Do, con movimenti a Fa e Sol), backdoor si muove per seconda maggiore (Fa–Sol–Do). Il **colore della risoluzione** è altrettanto diagnostico: una risoluzione V-I ha una caduta di tensione molto precisa, diversa da una plagale o da una deceptive cadence.

I **Coltrane changes** si riconoscono dalla velocità dei cambi (due accordi per battuta) e dalla sensazione di "slittamento" su terze — nessun centro si stabilizza. Il **blues** si riconosce dalla struttura ritmica: il quarto battuto ha una qualità speciale (quick change o ritorno al IV). Il **Rhythm Changes** si riconosce dal turnaround rapido e dal bridge tutto dominante.

L'obiettivo finale è **sentire l'armonia prima di nominarla**: il nome viene dopo l'esperienza sonora, non prima.`,
      esempi: `**II-V-I in Do — firma sonora:**
\`Dm7–G7–Cmaj7\`: tensione crescente (Dm), acme (G7), rilascio (Cmaj7)

**Backdoor — firma sonora:**
\`Fm7–Bb7–Cmaj7\`: risoluzione per seconda, sorpresa morbida

**Blues — signature:**
12 battute, IV al 5° battuto, V al 9°, turnaround al 12°

**Coltrane changes — firma:**
Rapidi cambi su terze, nessun centro stabile, "rotatoria"`,
      esercizi: [
        'Ascolta 10 progressioni (II-V-I, blues, backdoor, plagale, Coltrane changes): identifica il tipo prima di guardare la soluzione.',
        'Trascrivi la griglia dei primi 12 battute di un blues jazz a orecchio: identifica I, IV, V e i passaggi cromatici.',
        'Ascolta Rhythm Changes: identifica il turnaround di ogni A e il momento in cui inizia il bridge.',
        'Ascolta "Giant Steps": conta quante volte il centro tonale cambia nelle prime 16 battute.',
        'Esercizio di cantare la progressione: canta le fondamentali di Dm7–G7–Cmaj7 mentre ascolti. Poi il movimento di basso di un blues in Fa.',
        'Ear training finale: ascolta 5 brani sconosciuti e scrivi la forma (AABA, blues, altro) e 2-3 progressioni riconosciute per ciascuno.',
      ],
      obiettivo: 'Riconoscere a orecchio le progressioni fondamentali del jazz (II-V-I, blues, Rhythm changes, backdoor, Coltrane changes) dal movimento del basso, dalla direzione armonica e dal colore della risoluzione.',
      tools: [
        { tabId: 'cadence', label: 'Cadence Trainer', icon: '🎓', desc: 'Allena il riconoscimento di progressioni complete — II-V-I, blues, backdoor, Coltrane changes — con esercizi progressivi dal singolo movimento alla forma completa' },
      ],
    },
  ],
};

const level16: Level = {
  id: 16,
  phase: 4,
  title: 'Composizione e Applicazione Pratica',
  subsections: [
    {
      id: '16.1',
      title: 'Scrittura di Progressioni',
      topics: ['Da diatonica a modale', 'Neo-soul', 'Fusion', 'Outside'],
      teoria: `La **scrittura di progressioni** è l'applicazione pratica di tutto ciò che hai studiato. Non si tratta di applicare regole in sequenza — si tratta di costruire un discorso musicale coerente, dove ogni accordo ha una ragione di esistere in quel punto.

Il percorso compositivo più efficace parte dal **semplice e si espande**: prima una progressione diatonica (solo accordi della scala), poi si aggiungono dominanti secondarie, poi tritone sub, poi modal interchange, poi slash chords, fino a versioni modali, neo-soul, fusion e "outside". Questo percorso a 10 passi (dal programma) non è solo un esercizio — è una mappa del vocabolario armonico completo.

La lezione più importante arriva alla fine: **tornare a una versione semplice ma più bella**. La complessità armonica è uno strumento, non un obiettivo. I più grandi compositori jazz (Shorter, Hancock, Evans) sanno quando usare un accordo semplice e quando spingere oltre — la scelta dipende dall'**espressione** che si vuole raggiungere, non dalla difficoltà tecnica.

Una progressione bella non è quella con più accordi o con le tensioni più rare. È quella che porta l'ascoltatore dove vuoi portarlo, con la forza giusta.`,
      esempi: `**10 passi su "I Love You" (Cm–Fm–G7–Cm):**
1. Diatonica: \`Cm7–Fm7–G7–Cm7\`
2. +dom sec: \`Cm7–C7–Fm7–G7–Cm7\`
3. +tritone sub: \`Cm7–C7–Fm7–Db7–Cm7\`
4. +modal interchange: \`Cm7–Fm7–Bbm7–Eb7–Abmaj7–G7–Cm7\`
5. Modale: \`Cm11–Dbmaj9/C–Cm11\`
6. Neo-soul: \`Cm9–Fm9–Gm11–Db13sus\`
7. Fusion: triadic pairs + vamp
8. Outside: side-slipping su ogni accordo`,
      esercizi: [
        'Applica i 10 passi a una progressione di 4 accordi a tua scelta: scrivi ogni versione su un foglio separato.',
        'Componi una progressione neo-soul di 8 battute con basso cromatico, minor plagal e voicing 6/9.',
        'Componi un vamp fusion di 16 battute su un centro modale: usa triadic pairs e slash chords.',
        'Componi una progressione "outside" di 8 battute: side-slipping, Coltrane changes o constant structure.',
        'Torna al passo 10: prendi la tua progressione più complessa e semplificala. Mantieni solo gli accordi che "devono" esserci.',
        'Registra tutte e 10 le versioni della stessa progressione: ascoltale in sequenza. Quale versione comunica di più?',
      ],
      obiettivo: 'Sviluppare una progressione originale attraverso 10 livelli di complessità crescente (da diatonica a outside) e scegliere la versione più musicale, integrando il vocabolario completo del corso in composizione.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci e ascolta progressioni a diversi livelli di complessità — diatonica, jazz, modale, neo-soul, fusion — e confronta come ogni passo arricchisce o cambia il discorso armonico' },
      ],
    },
    {
      id: '16.2',
      title: 'Riarmonizzare un Brano Proprio',
      topics: ['4 versioni: semplice, jazz, moderna, estrema'],
      teoria: `Il progetto finale di composizione è riarmonizzare un brano proprio. Questo esercizio sintetizza l'intero percorso: non si applica la teoria a un brano altrui — si lavora su qualcosa di personale, dove ogni scelta armonica riflette la tua voce.

La procedura in 5+1 passi: (1) **Scegli una melodia originale** — anche semplice, 8-16 battute; (2) **Armonizzala in modo semplice**, solo accordi diatonici, nessuna sostituzione; (3) **Versione jazz** — aggiungi II-V, dominanti secondarie, tritone sub; (4) **Versione moderna** — modal interchange, neo-soul voicing, slash chords, minor plagal; (5) **Versione estrema** — Coltrane changes, constant structure, armonia negativa, side-slipping; (6) **Scegli la più musicale**, non la più complicata.

Il passo 6 è il più difficile e il più importante. La versione estrema mostra che sai usare gli strumenti; la scelta della versione giusta mostra che sei diventato un musicista. La complessità fine a se stessa non è arte — è tecnica. L'arte è sapere quando usarla e quando no.

Questo processo si applica a qualsiasi melodia tu scriva da ora in poi: avrai 4 versioni armoniche sempre disponibili, e la scelta di quale presentare dipenderà dal contesto, dall'ensemble e dall'intenzione espressiva.`,
      esempi: `**Melodia di 4 note: Do–Mi–Sol–La**

Versione 1 (semplice): \`Cmaj7–Am7–Fmaj7–G7\`
Versione 2 (jazz): \`Cmaj7–Eb7#11–Dm7–Ab7\`
Versione 3 (moderna): \`Cmaj9–Fm9–Em7–A7alt\`
Versione 4 (estrema): \`Cmaj7–Ebmaj7–Abmaj7–Bmaj7\` (Coltrane)

**Domanda chiave per la scelta:**
"Questa progressione *serve* la melodia o la *copre*?"`,
      esercizi: [
        'Scrivi una melodia originale di 8-16 battute. Salva la melodia senza armonia.',
        'Armonizza la melodia in versione semplice (solo diatonica): scrivi gli accordi sotto ogni nota.',
        'Armonizza in versione jazz: aggiungi II-V dove possibile, almeno 2 dominanti secondarie e 1 tritone sub.',
        'Armonizza in versione moderna: usa modal interchange, slash chords e voicing neo-soul. Almeno 1 minor plagal.',
        'Armonizza in versione estrema: Coltrane changes, constant structure o armonia negativa. Vai al limite.',
        'Suona (o registra) tutte e 4 le versioni. Scegli quella più musicale e scrivi 2-3 frasi su perché.',
      ],
      obiettivo: 'Creare 4 versioni armoniche di una melodia originale (semplice, jazz, moderna, estrema) e scegliere quella più efficace — integrando il vocabolario completo del corso in un\'opera musicale personale.',
      tools: [
        { tabId: 'progressions', label: 'Chord Progressions', icon: '🎸', desc: 'Costruisci le 4 versioni armoniche del tuo brano — confronta diatonica, jazz, moderna e estrema, ascolta come cambiano il carattere della melodia originale' },
      ],
    },
  ],
};

const level17: Level = {
  id: 17,
  phase: 4,
  title: 'Arrangiamento Armonico per Band',
  subsections: [
    {
      id: '17.1',
      title: 'Distribuzione Armonica tra Strumenti',
      topics: ['Basso', 'Piano/Rhodes', 'Chitarra', 'Fiati', 'Voce'],
      teoria: `L'**arrangiamento armonico per band** richiede di pensare l'accordo non come un blocco monolitico, ma come una **distribuzione orchestrale**: ogni strumento suona una parte dell'accordo, e la somma produce il tutto. La scelta di chi suona cosa dipende da registro, timbro, funzione ritmica e spazio sonoro.

Il principio fondamentale è la **divisione dei ruoli**: il **basso** suona la fondamentale (o una nota di passaggio), definendo il centro tonale. Il **piano/Rhodes** suona rootless voicings (no fondamentale) — terza, settima, nona, tredicesima — lasciando spazio al basso. La **chitarra** può raddoppiare il piano in registro diverso, aggiungere colore quartale o suonare melody comping. I **fiati** si distribuiscono le tensioni superiori (nona, undicesima, tredicesima) come upper structure. La **voce** porta la melodia e le sue note diventano parte dell'armonia.

Su un accordo pratico come \`Cmaj9\`: basso = Do, Rhodes = Mi–Si–Re (rootless posizione A), chitarra = Sol–Re–Mi (voicing quartale), fiati = La–Re–Fa# se vuoi colore Lydian, voce = melodia. Il risultato è un suono pieno e trasparente allo stesso tempo: ogni strumento si sente, nessuno è coperto.

Evitare le **sovrapposizioni di registro** è essenziale: se il piano e la chitarra suonano le stesse note nello stesso registro, si crea densità senza ricchezza.`,
      esempi: `**Distribuzione di Cmaj9 per quintetto:**
- Basso: Do (fondamentale)
- Rhodes: Mi–Si–Re (rootless pos. A: terza–settima–nona)
- Chitarra: Sol–Re–Mi (voicing quartale/aperto)
- Fiati: La–Re–Fa# (nona–#11–tredicesima = colore Lydian)
- Voce: melodia (qualsiasi nota dell'accordo)

**Regola pratica:**
Piano senza basso → suona fondamentale
Piano con basso → suona rootless (no fondamentale)

**Registro:**
Basso: < Do3 / Chitarra: Do3–Re4 / Piano: Fa3–Fa5 / Fiati: Sol3–Sol6`,
      esercizi: [
        'Prendi un accordo \`Gmaj9\` e distribuiscilo tra basso, piano, chitarra e 3 fiati: scrivi ogni nota per ogni strumento.',
        'Scrivi un arrangiamento di 4 battute (II-V-I in Do) per trio jazz (basso, piano, chitarra): usa rootless per il piano, voicing quartale per la chitarra.',
        'Analizza lo spartito di un brano di Snarky Puppy: identifica come vengono distribuite le note dell\'accordo tra gli strumenti.',
        'Riscrivi la distribuzione di \`Cmaj9\` per tre versioni: duo (basso+piano), trio (+chitarra), quartetto (+fiati).',
        'Ear training: ascolta un arrangiamento per band e identifica quale strumento tiene la fondamentale, quale la terza, quale la nona.',
        'Scrivi le prime 8 battute di Autumn Leaves per quintetto jazz: distribuisci ogni accordo tra tutti gli strumenti.',
      ],
      obiettivo: 'Distribuire qualsiasi accordo tra gli strumenti di una band jazz (basso, piano, chitarra, fiati, voce) sfruttando i registri diversi, usando rootless voicing per il piano quando c\'è il basso, e assegnando le tensioni agli strumenti più acuti.',
      tools: [
        { tabId: 'arrangement', label: 'Arrangement Blueprint', icon: '🎼', desc: 'Visualizza la distribuzione armonica tra strumenti — basso, piano, chitarra, fiati — con suggerimenti di registro e voicing per ogni accordo del percorso' },
      ],
    },
    {
      id: '17.2',
      title: 'Armonia per Sezione Fiati',
      topics: ['Drop 2 per fiati', 'Solis', 'Background figures', 'Shout chorus'],
      teoria: `La **sezione fiati** nell'arrangiamento jazz è il punto dove l'armonia diventa più visibile: ogni nota di ogni accordo viene assegnata a uno strumento preciso, con un timbro e un registro definiti. Non si scrive "un accordo" — si scrivono quattro linee melodiche indipendenti che insieme formano un accordo.

L'armonizzazione a **3 voci** (es. sax alto, sax tenore, trombone) usa sistemi semplici: close position o drop 2. A **4 voci** (+ tromba) si aggiunge più colore: spread voicing, drop 2&4. I **soli** (soli harmonization) armonizzano l'intera linea melodica con la sezione fiati — ogni nota della melodia diventa la voce superiore di un accordo, come nei block chords pianistici ma orchestrato.

Le **background figures** sono frasi armonizzate che suonano "dietro" la melodia principale (portata da voce o solista): devono essere abbastanza presenti da aggiungere colore ma abbastanza discrete da non coprire. Il **shout chorus** è il climax dell'arrangiamento: tutti i fiati all'unisono ritmico, accordi a piena voce, massima densità — la sezione "risponde" al solista con intensità collettiva.

La **tromba** è generalmente la voce più acuta, il **trombone** la più grave. I sax stanno nel mezzo e definiscono il colore (alto più brillante, tenore più caldo).`,
      esempi: `**Drop 2 a 3 fiati su Cmaj7:**
- Tromba: Mi (terza, voce superiore)
- Sax alto: Do (fondamentale, drop 2 dalla seconda posizione)
- Trombone: Si (settima, basso)

**Background figure su II-V-I:**
Risposta a 3 fiati: \`Dm7–G7sus–G13b9\` in crome sincopate
Ogni accordo = 3 note distribuite tra tromba/sax/trombone

**Shout chorus (finale gospel jazz):**
Tutti i fiati sul beat: \`G13b9\` a 5 voci, fortissimo
Poi risoluzione: \`Cmaj9\` aperto, piano

**Soli harmonization:**
Melodia di 4 note Do–Mi–Sol–La → 4 accordi drop 2 paralleli`,
      esercizi: [
        'Armonizza la frase melodica Do–Re–Mi–Fa in drop 2 a 3 fiati: scrivi le 3 voci per ogni nota.',
        'Scrivi una background figure di 4 battute in risposta a una melodia di 4 battute su II-V-I in Do.',
        'Scrivi un soli di 8 battute su Autumn Leaves (prime 8 battute): armonizza ogni nota della melodia in drop 2 a 4 fiati.',
        'Scrivi uno shout chorus di 4 battute: accordi a 5 voci fortissimo, poi risoluzione aperta.',
        'Analizza lo spartito di "Mercy, Mercy, Mercy" di Joe Zawinul (versione big band): identifica i soli, le background figures e lo shout chorus.',
        'Trascrivi le prime 8 battute di un arrangiamento big band di tua scelta: analizza come vengono distribuite le voci tra i fiati.',
      ],
      obiettivo: 'Scrivere arrangiamenti armonici per sezione fiati (3-4 voci) usando drop 2, soli harmonization e background figures, producendo shout chorus e linee di accompagnamento che estendono l\'armonia dell\'ensemble.',
      tools: [
        { tabId: 'arrangement', label: 'Arrangement Blueprint', icon: '🎼', desc: 'Progetta arrangiamenti per sezione fiati — drop 2, solis, background figures e shout chorus — con distribuzione delle voci tra tromba, sax e trombone' },
      ],
    },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const ALL_LEVELS: Level[] = [
  level0, level1, level2, level3, level4, level5, level6,
  level7, level8, level9, level10, level11, level12, level13,
  level14, level15, level16, level17,
];

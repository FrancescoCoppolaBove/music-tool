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
  id: 1, phase: 1, title: 'Armonia Tonale di Base',
  subsections: [
    { id: '1.1', title: 'Funzioni Armoniche', topics: ['Tonica', 'Sottodominante', 'Dominante', 'Cadenze'], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: 'Capire tensione e risoluzione.', tools: [{ tabId: 'cadence', label: 'Cadence Trainer', icon: '🎓', desc: 'Riconosci le cadenze' }] },
    { id: '1.2', title: 'Accordi di Settima', topics: ['Maj7', 'm7', '7 dominante', 'm7b5', 'dim7', 'mMaj7'], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: 'Leggere una sigla jazz senza paura.', tools: [{ tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: 'Vedi gli accordi di settima nei vari modi' }] },
    { id: '1.3', title: 'Armonizzazione della Scala Maggiore', topics: ['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viim7b5'], teoria: '// Contenuto completo nel Piano 2', esempi: '', esercizi: [], obiettivo: 'Vedere la tonalità come sistema di accordi collegati.', tools: [{ tabId: 'harmonization', label: 'Scale Harmony', icon: '🎶', desc: '' }] },
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

import type { Tab } from '@shared/types/navigation.types';

export type ExerciseArea = 'abitudine' | 'reference' | 'arrangiamento' | 'scrittura';

export interface Exercise {
  id: string;
  area: ExerciseArea;
  title: string;
  duration: string;
  goal: string;
  steps: string[];
  /** Da dove arriva l'idea, quando non è nostra. */
  source?: string;
  tool?: { tab: Tab; label: string };
}

export const EXERCISE_AREAS: Record<ExerciseArea, string> = {
  abitudine: 'Abitudine quotidiana',
  reference: 'Usare le reference',
  arrangiamento: 'Arrangiamento',
  scrittura: 'Generare idee',
};

export const EXERCISES: readonly Exercise[] = [
  {
    id: 'object-writing', area: 'abitudine', title: 'Object writing sonoro', duration: '10 min',
    goal: 'Allenare un vocabolario di immagini e sensazioni tuo, che non arriva dai dischi.',
    steps: [
      'Ogni mattina scegli un oggetto o un luogo.',
      'Per 10 minuti scrivi cosa vedi, senti, tocchi, annusi, cosa provi nel corpo e come ti muoveresti lì dentro.',
      'Sottolinea tre dettagli e traducili in scelte musicali: un timbro, un tempo, un registro.',
    ],
    source: 'Adattato dall’object writing di Pat Pattison (Writing Better Lyrics, Berklee).',
  },
  {
    id: 'ten-ideas', area: 'abitudine', title: 'Dieci idee in venti minuti', duration: '20 min',
    goal: 'Separare il momento in cui generi da quello in cui giudichi.',
    steps: [
      'Timer da 20 minuti. Registra dieci idee da 15–30 secondi: riff, giri, groove, melodie.',
      'Vietato riascoltare durante il timer.',
      'Il giorno dopo ascoltale tutte e tienine al massimo due. Archivia le altre con un nome.',
    ],
  },
  {
    id: 'voice-memo-walk', area: 'abitudine', title: 'Passeggiata col registratore', duration: '30 min',
    goal: 'Scrivere melodie che nascono dal corpo e dalla voce, non dalle dita.',
    steps: [
      'Esci senza cuffie e senza musica.',
      'Canta piano quello che ti viene sul ritmo dei passi e registralo sul telefono.',
      'A casa trascrivi solo le due frasi migliori e armonizzale dopo.',
    ],
  },
  {
    id: 'word-ladder', area: 'scrittura', title: 'Scala di parole → titolo → brano', duration: '15 min',
    goal: 'Trovare un punto di partenza che non sia musicale.',
    steps: [
      'Scrivi dieci verbi legati a un mestiere (cuoco, medico, marinaio) e dieci nomi di oggetti che hai davanti.',
      'Unisci verbi e nomi che di solito non stanno insieme e scegli la coppia migliore come titolo.',
      'Decidi tempo, organico e colore armonico che quel titolo suggerisce, poi scrivi otto battute.',
    ],
    source: 'Adattato dalla “word ladder” di Jeff Tweedy (How to Write One Song).',
  },
  {
    id: 'reference-fast', area: 'reference', title: 'Digiuno di reference', duration: '3 giorni',
    goal: 'Svuotare la memoria a breve termine prima di scrivere.',
    steps: [
      'Per 72 ore non ascoltare musica del genere che stai scrivendo. Va bene il silenzio, o generi lontanissimi.',
      'In quei giorni scrivi solo appunti a parole: atmosfera, forma, organico.',
      'Poi componi la bozza. La reference si riascolta solo a bozza finita, per confronto.',
    ],
  },
  {
    id: 'memory-rewrite', area: 'reference', title: 'Riscrittura a memoria', duration: '40 min',
    goal: 'Lasciare che la memoria deformi la reference: le differenze sono già tue.',
    steps: [
      'Ascolta la reference una volta sola, con attenzione, senza strumento.',
      'Aspetta almeno 24 ore.',
      'Scrivi da memoria la sezione che ti aveva colpito. Non controllare l’originale.',
      'Confronta solo alla fine e sviluppa i punti in cui ti sei “sbagliato”.',
    ],
  },
  {
    id: 'three-sources', area: 'reference', title: 'Tre fonti incompatibili', duration: '60 min',
    goal: 'Copiare da una fonte è plagio, combinarne tre è ricerca.',
    steps: [
      'Scegli tre brani di generi lontani tra loro (es. un brano di musica brasiliana, uno di elettronica, uno di musica da camera).',
      'Da ognuno prendi un solo principio, scritto a parole: “basso che anticipa la cassa”, “armonia ferma per 16 battute”, “fiati come percussioni”.',
      'Scrivi un brano che rispetta i tre principi senza riascoltare le fonti.',
    ],
    source: 'Dall’idea di “copiare, trasformare, combinare” di Kirby Ferguson e da Austin Kleon.',
  },
  {
    id: 'describe-not-play', area: 'reference', title: 'Descrivi, non suonare', duration: '25 min',
    goal: 'Passare dalla superficie (le note) al principio (la funzione).',
    steps: [
      'Ascolta la reference e descrivi per iscritto cosa fa ogni strumento, senza nomi di note o accordi.',
      'Esempio: “il basso tiene una nota e risponde alla voce alla fine di ogni frase”.',
      'Chiudi la reference e arrangia un tuo brano partendo solo dalla descrizione.',
    ],
    tool: { tab: 'arrangement', label: 'Arrangement Blueprint' },
  },
  {
    id: 'transcribe-mutate', area: 'reference', title: 'Trascrivi e muta in cinque passaggi', duration: '60 min',
    goal: 'Studiare un brano a fondo e uscirne con qualcosa di diverso.',
    steps: [
      'Trascrivi otto battute della reference (è studio, non da pubblicare).',
      'Passaggio 1: cambia metro. Passaggio 2: cambia modo. Passaggio 3: cambia organico.',
      'Passaggio 4: cambia la forma della frase. Passaggio 5: butta via la melodia originale e scrivine una nuova.',
      'Tieni solo il risultato del quinto passaggio.',
    ],
  },
  {
    id: 'role-swap', area: 'arrangiamento', title: 'Ruoli scambiati', duration: '30 min',
    goal: 'Rompere l’abitudine “basso sotto, accordi in mezzo, melodia sopra”.',
    steps: [
      'Prendi un tuo brano o un’idea di otto battute.',
      'Il basso suona la melodia, le tastiere fanno il ritmo, la batteria tiene un colore armonico (tom intonati, campane, piatti).',
      'Tieni almeno un’idea nata da questo scambio nella versione finale.',
    ],
  },
  {
    id: 'three-voices', area: 'arrangiamento', title: 'Arrangiamento a tre voci', duration: '40 min',
    goal: 'Capire cosa serve davvero togliendo il superfluo.',
    steps: [
      'Riduci l’arrangiamento a tre parti in tutto.',
      'Ogni funzione (melodia, basso, armonia, ritmo) deve essere coperta da una di queste tre.',
      'Solo dopo aggiungi un quarto elemento, e chiediti cosa aggiunge.',
    ],
  },
  {
    id: 'energy-map', area: 'arrangiamento', title: 'Mappa dell’energia prima della DAW', duration: '20 min',
    goal: 'Arrangiare dalla funzione invece che da un arrangiamento ascoltato.',
    steps: [
      'Su carta disegna le sezioni e una curva di energia da 1 a 10.',
      'Per ogni sezione scrivi come ottieni quel livello: registro, densità, ritmo, timbro.',
      'Apri la DAW solo quando la mappa è finita e rispettala.',
    ],
    tool: { tab: 'architect', label: 'Song Architect' },
  },
  {
    id: 'wrong-band', area: 'arrangiamento', title: 'La band sbagliata', duration: '45 min',
    goal: 'Trovare figure d’accompagnamento che il tuo genere non usa.',
    steps: [
      'Arrangia la tua idea per un organico lontanissimo: quartetto d’archi, banda, coro, gamelan.',
      'Scrivi le parti tipiche di quell’organico.',
      'Riportale sui tuoi strumenti e tieni le figure più strane.',
    ],
  },
  {
    id: 'subtraction', area: 'arrangiamento', title: 'Sottrazione progressiva', duration: '30 min',
    goal: 'Scoprire quale parte è essenziale e quale è un’abitudine.',
    steps: [
      'Fai loop di un tuo arrangiamento.',
      'Togli uno strumento alla volta, a partire da quello che sembra meno importante.',
      'Fermati quando il brano perde la sua identità e riparti da lì.',
    ],
  },
  {
    id: 'one-cell', area: 'scrittura', title: 'Un brano da una cellula', duration: '45 min',
    goal: 'Sviluppare invece di accumulare idee prese altrove.',
    steps: [
      'Scegli un motivo di tre note e un ritmo di una battuta.',
      'Costruisci tutto il brano con inversione, aumentazione, retrogrado, sequenze e spostamenti.',
      'Ogni nuova parte deve derivare dalla cellula.',
    ],
    tool: { tab: 'melody', label: 'Melody Architect' },
  },
  {
    id: 'non-musical', area: 'scrittura', title: 'Partitura da un’immagine', duration: '30 min',
    goal: 'Prendere ispirazione da fuori dalla musica: nessuno saprà da dove viene.',
    steps: [
      'Scegli una foto, un quadro o un edificio.',
      'Assegna una regola: linee orizzontali = note lunghe, verticali = accenti, colori = timbri, proporzioni = forma.',
      'Componi 16 battute seguendo la regola alla lettera.',
    ],
  },
  {
    id: 'bad-song', area: 'scrittura', title: 'Il brano volutamente brutto', duration: '20 min',
    goal: 'Abbassare la posta in gioco: il blocco viene spesso dal voler fare subito “bene”.',
    steps: [
      'Scrivi in 20 minuti il brano più banale possibile.',
      'Il giorno dopo cerca dentro una sola cosa interessante.',
      'Fai partire un nuovo brano da quella cosa.',
    ],
  },
  {
    id: 'recipe-ban', area: 'scrittura', title: 'Vieta la tua ricetta', duration: '15 min',
    goal: 'Riconoscere le scelte automatiche, tue o prese dai tuoi ascolti.',
    steps: [
      'Elenca le cinque scelte che fai sempre: tonalità, tempo, primo accordo, groove, suono.',
      'Per il prossimo brano vietane tre.',
      'Nota quali idee arrivano quando la strada solita è chiusa.',
    ],
  },
];

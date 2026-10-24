/**
 * "Dalla reference al tuo brano": per ogni elemento che ti piace di una
 * reference, la domanda che ne estrae il principio (cosa fa, non come suona)
 * e le mosse che lo trasformano quando non è l'elemento che tieni.
 */
export type ElementId = 'groove' | 'armonia' | 'melodia' | 'timbro' | 'organico' | 'forma' | 'energia' | 'spazio';

export interface ReferenceElement {
  id: ElementId;
  label: string;
  /** Domande per tradurre ciò che senti in un principio scritto a parole. */
  principle: string[];
  /** Modi per allontanarsi dalla superficie della reference. */
  moves: string[];
}

export const ELEMENTS: readonly ReferenceElement[] = [
  {
    id: 'groove', label: 'Groove',
    principle: [
      'Dove cade il peso: sul battere, sul levare, in ritardo?',
      'Quale strumento crea davvero la spinta, e quale la lascia respirare?',
      'Che rapporto c’è tra cassa e basso: insieme, alternati, uno anticipa l’altro?',
    ],
    moves: [
      'Tieni la sensazione ma cambia metro (4/4 → 7/8 o 6/8).',
      'Sposta il pattern principale di una semicroma (Rhythmic Displacement).',
      'Affida il groove a strumenti diversi: niente batteria, il pulse lo porta il basso.',
      'Porta il tempo di ±15 BPM e passa in half-time o double-time.',
    ],
  },
  {
    id: 'armonia', label: 'Armonia',
    principle: [
      'L’armonia si muove molto o resta ferma? Quanto dura in media un accordo?',
      'Che colore domina: luminoso, sospeso, scuro, ambiguo?',
      'Dove sta la tensione e come si scioglie?',
    ],
    moves: [
      'Tieni la tonica e cambia modo (dorico → misolidio o eolio): cosa resta del carattere?',
      'Cambia il ritmo armonico: accordi di durate irregolari.',
      'Sostituisci l’accordo più riconoscibile con un prestito modale.',
      'Trasporta in una tonalità lontana e cambia il registro dei voicing.',
    ],
  },
  {
    id: 'melodia', label: 'Melodia / hook',
    principle: [
      'Il contorno sale, scende, gira attorno a una nota?',
      'Quante note usa davvero l’hook e su quali tempi cade?',
      'È cantabile o strumentale? Quanto spazio lascia?',
    ],
    moves: [
      'Non tenere mai l’hook: è l’elemento più riconoscibile. Prendine solo il contorno e inverti la direzione.',
      'Scrivi una melodia nuova cantando, senza riascoltare la reference.',
      'Cambia il punto di partenza ritmico della frase (levare ↔ battere).',
      'Riduci a cinque altezze e sviluppa con la ripetizione.',
    ],
  },
  {
    id: 'timbro', label: 'Timbro / sound',
    principle: [
      'Il suono è scuro o brillante, pulito o sporco, asciutto o ambientale?',
      'Quale suono “firma” il brano e lo rende riconoscibile in due secondi?',
    ],
    moves: [
      'Ottieni lo stesso carattere con uno strumento diverso (Rhodes saturato → chitarra baritona).',
      'Evita il suono firma: è la scorciatoia più rapida verso la copia.',
      'Registra la parte in un ambiente reale invece di usare il preset.',
    ],
  },
  {
    id: 'organico', label: 'Organico',
    principle: [
      'Quanti strumenti suonano insieme nei momenti pieni e in quelli vuoti?',
      'Chi ha il ruolo di melodia, di armonia, di ritmo, di colore?',
    ],
    moves: [
      'Tieni i ruoli e cambia gli strumenti che li occupano.',
      'Togli uno strumento e redistribuisci il suo compito tra gli altri.',
      'Aggiungi un timbro estraneo al genere con un ruolo strutturale.',
    ],
  },
  {
    id: 'forma', label: 'Forma',
    principle: [
      'Quante sezioni ci sono e quanto durano?',
      'Dov’è il punto più intenso e quanto ci mette ad arrivarci?',
    ],
    moves: [
      'Riordina le sezioni: comincia dal climax o termina dove la reference inizia.',
      'Usa lunghezze di frase dispari (5, 7, 9 battute).',
      'Togli il ritornello e sostituiscilo con una sezione che non torna.',
    ],
  },
  {
    id: 'energia', label: 'Energia / dinamica',
    principle: [
      'Disegna la curva di energia del brano da 1 a 10, sezione per sezione.',
      'L’energia cresce aggiungendo strumenti, alzando il registro o cambiando ritmo?',
    ],
    moves: [
      'Tieni la curva ma ottienila con mezzi opposti (togliere invece di aggiungere).',
      'Inverti la curva: parti pieno e svuota.',
      'Metti il picco in un punto diverso del brano.',
    ],
  },
  {
    id: 'spazio', label: 'Spazio / produzione',
    principle: [
      'Cosa sta davanti e cosa dietro? Cosa è largo e cosa centrale?',
      'Quanto riverbero e quanto spazio vuoto c’è tra le parti?',
    ],
    moves: [
      'Scegli un luogo reale e fai vivere lì tutto il brano.',
      'Inverti la profondità: quello che nella reference è lontano, da te è vicino.',
      'Arrangia in mono per un’ora: se regge, la produzione non è più la tua stampella.',
    ],
  },
];

export const KEEP_LIMIT = 2;

/** Prove prima di dire "è mio". Da fare a orecchie fresche, idealmente il giorno dopo. */
export const DISTANCE_CHECKS: readonly string[] = [
  'Chi conosce la reference non la riconosce nei primi dieci secondi.',
  'Hook, riff principale e suono firma sono tuoi.',
  'Hai cambiato almeno tre fra tempo, metro, centro tonale, organico, forma e groove.',
  'Ridotto a piano e voce, o a un solo strumento, il brano regge anche senza produzione.',
  'Sai spiegare a parole cosa hai preso e perché, senza nominare la reference.',
  'Hai preso da più fonti diverse, non da una sola.',
];

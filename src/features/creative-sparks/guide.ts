/**
 * Guida: come scrivere musica tua quando ascolti molto (e arrangi pensando
 * alle reference). Sintesi di libri, forum e interviste: le fonti sono in
 * SOURCES e le affermazioni attribuite sono parafrasi.
 */
export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; text: string };

export interface GuideSection {
  id: string;
  title: string;
  lead: string;
  blocks: GuideBlock[];
}

export const GUIDE: readonly GuideSection[] = [
  {
    id: 'perche', title: 'Perché finisci per “copiare”',
    lead: 'Non è mancanza di talento: è come funzionano memoria e abitudine.',
    blocks: [
      { type: 'p', text: 'Quando ascolti molto un brano, le sue scelte diventano la strada più corta nella tua testa. Nel momento in cui componi, il cervello propone per prime le soluzioni che ha sentito più di recente, e spesso non te ne accorgi: la psicologia lo chiama criptomnesia, credere nuova un’idea che in realtà è un ricordo.' },
      { type: 'p', text: 'Ci sono quattro situazioni in cui succede più spesso:' },
      { type: 'list', items: [
        'Ascolti la reference mentre scrivi, o subito prima.',
        'Hai una sola reference: senza altre fonti con cui mescolarla, la copi.',
        'Parti dalla superficie (il riff, il suono, la parte di batteria) invece che dal principio che la fa funzionare.',
        'Generi e giudichi nello stesso momento: ogni idea nuova sembra “meno bella” dell’originale e torni a quello che conosci.',
      ] },
      { type: 'p', text: 'Nell’arrangiamento l’effetto è ancora più forte, perché l’arrangiamento è la parte più riconoscibile di un brano: due canzoni con accordi simili suonano diverse, due canzoni con lo stesso arrangiamento suonano uguali anche con accordi diversi.' },
    ],
  },
  {
    id: 'linea', title: 'Influenza o copia: dove passa il confine',
    lead: 'Prendere dagli altri è normale. Conta cosa prendi e quanto lo trasformi.',
    blocks: [
      { type: 'p', text: 'Tutta la musica nasce da altra musica. Austin Kleon (Ruba come un artista) distingue tra prendere da uno solo, cioè copiare, e prendere da molti trasformando, cioè fare ricerca. Kirby Ferguson (Everything is a Remix) riassume il processo creativo in tre verbi: copiare, trasformare, combinare. Il problema non è il primo verbo: è fermarsi lì.' },
      { type: 'p', text: 'Una regola pratica, ripresa in molte discussioni tra autori: puoi tenere i principi, devi cambiare la superficie.' },
      { type: 'list', items: [
        'Principio (si può prendere): “il basso anticipa la cassa”, “l’armonia sta ferma e si muove il ritmo”, “i fiati fanno da percussione”, “il ritornello è più vuoto della strofa”.',
        'Superficie (va cambiata): l’hook, il riff principale, il suono che firma il brano, la parte di batteria nota per nota, la sequenza di sezioni con le stesse durate.',
      ] },
      { type: 'p', text: 'Sul forum di TAXI un autore suggerisce di confrontare più reference per trovare cosa hanno in comune (organico, tempo, metro, pulsazione) e di cambiare deliberatamente tutto ciò che non serve. Un altro consiglio ricorrente: si può prendere un singolo elemento, come un fraseggio o il punto in cui si respira, e far suonare comunque il brano come un’altra cosa.' },
      { type: 'tip', text: 'Non controllarti troppo. Guitar World ricorda che cercare di non assomigliare a nessuno può bloccarti, soprattutto all’inizio. La voce personale emerge con la quantità di brani scritti, non con la sorveglianza.' },
    ],
  },
  {
    id: 'metodo', title: 'Il metodo in cinque fasi',
    lead: 'Separa il momento in cui ascolti da quello in cui scrivi.',
    blocks: [
      { type: 'list', items: [
        '1 · Raccogli. Ascolta tanto e da fonti lontane tra loro. Tieni un quaderno in cui scrivi i principi a parole, non le note.',
        '2 · Digiuna. Prima di scrivere, smetti di ascoltare quel genere per un po’. Yngwie Malmsteen racconta di non ascoltare musica quando compone, per non farsi influenzare nemmeno inconsapevolmente: non serve essere così radicali, ma ventiquattro o settantadue ore aiutano.',
        '3 · Genera. Quantità prima della qualità, con un tempo limite e un vincolo (usa il generatore). Non riascoltare e non giudicare.',
        '4 · Allontanati. Lascia passare almeno un giorno. Le idee si giudicano a orecchie fresche.',
        '5 · Confronta e trasforma. Solo ora riascolta la reference e usa il test di distanza della scheda “Dalla reference”. Dove sei troppo vicino, cambia un parametro.',
      ] },
      { type: 'tip', text: 'La reference è uno strumento per l’arrangiamento e il mix finale, non per l’inizio. Usala come prova (“il mio ritornello si apre abbastanza?”), non come modello da ricalcare.' },
    ],
  },
  {
    id: 'reference', title: 'Usare una reference senza farsi usare',
    lead: 'Dalla reference si estraggono relazioni, non parti.',
    blocks: [
      { type: 'p', text: 'Una buona guida al lavoro con le reference propone di trattarle come prove di relazioni, non come modelli: separa quello che senti da quello che pensi che faccia, poi traduci la funzione in un brief per il tuo progetto. Le relazioni da studiare sono chi sta in primo piano, chi accompagna, quanti strumenti, quanto è ampio il registro, come si stratificano le parti e come si passano la melodia.' },
      { type: 'list', items: [
        'Ascolta almeno tre reference, mai una sola.',
        'Descrivi ognuna a parole: “il ritornello si allarga verso l’alto mentre la voce resta al centro”.',
        'Chiudi le reference. Arrangia partendo dalle descrizioni.',
        'Cambia sempre almeno tre parametri tra tempo, metro, centro tonale, organico, forma e groove.',
        'Proteggi l’hook: melodia principale, riff e suono firma devono essere tuoi.',
      ] },
      { type: 'p', text: 'Pete Covington descrive una trappola: ascoltare troppo in modo analitico, cercando sempre suoni da rubare, finché la propria identità sparisce. Il rimedio che propone è ascoltare in modo più immerso e meno da laboratorio.' },
    ],
  },
  {
    id: 'arrangiamento', title: 'Arrangiare in modo personale',
    lead: 'Arrangia dalla funzione, non dalla parte che ricordi.',
    blocks: [
      { type: 'p', text: 'Quando arrangi pensando a un disco, tendi a ricostruire le sue parti. Prova invece a partire dalle funzioni che ogni sezione deve svolgere e a decidere tu chi le copre.' },
      { type: 'list', items: [
        'Prima la mappa: sezioni, durate e curva di energia da 1 a 10, su carta, prima della DAW.',
        'Per ogni sezione rispondi: chi porta la melodia, chi il basso, chi il ritmo, chi il colore? Lo stesso ruolo può passare da uno strumento all’altro.',
        'Gestisci densità e registro: chi sta sotto, in mezzo, sopra. Un ritornello può arrivare aprendo il registro invece di aggiungere strumenti.',
        'Usa gli scambi di ruolo: basso melodico, fiati ritmici, batteria intonata.',
        'Sottrai: se togli un elemento e il brano non perde identità, era un’abitudine.',
        'Prendi in prestito da organici lontani: archi, banda, gamelan, coro. Le loro figure di accompagnamento non suonano come il tuo genere.',
      ] },
      { type: 'tip', text: 'Gli strumenti dell’app ti aiutano a lavorare per funzione: Arrangement Blueprint (cosa suona ogni strumento), Groove Kitchen (pattern di basso e batteria da modificare), Rhythmic Displacement (spostare un pattern che ti sembra troppo familiare).' },
    ],
  },
  {
    id: 'vincoli', title: 'Perché i vincoli funzionano',
    lead: 'Meno possibilità vuol dire meno strade già percorse.',
    blocks: [
      { type: 'p', text: 'Quando puoi fare tutto, il cervello sceglie la strada più battuta, cioè quella che hai ascoltato. Un vincolo la chiude e ti obbliga a cercarne un’altra. Stravinskij, in Poetica della musica, scriveva che più limiti si impongono, più ci si libera.' },
      { type: 'p', text: 'Brian Eno ha fatto dei vincoli un metodo: le Oblique Strategies, scritte con Peter Schmidt nel 1975, sono carte da pescare quando sei bloccato. Racconta anche che, per il suono d’avvio di Windows 95, partì da un brief strettissimo e ne compose 84 versioni. Jorge Variego, in Composing with Constraints, organizza cento esercizi di composizione proprio attorno a vincoli di melodia, ritmo, armonia e texture.' },
      { type: 'list', items: [
        'Vincoli di materiale: poche note, pochi accordi, pochi strumenti, un solo suono.',
        'Vincoli di processo: tempo limite, niente correzioni, niente strumento principale.',
        'Vincoli di fonte: partire da un’immagine, una parola, un luogo, invece che da un brano.',
        'Divieti mirati: vieta le tre scelte che fai sempre.',
      ] },
      { type: 'tip', text: 'Il vincolo serve a far nascere l’idea, non a vincolare il brano finito. Una volta che hai il nucleo, puoi infrangerlo.' },
    ],
  },
  {
    id: 'abitudini', title: 'Abitudini che proteggono la tua voce',
    lead: 'L’originalità è soprattutto una pratica costante.',
    blocks: [
      { type: 'list', items: [
        'Una pratica quotidiana breve. Pat Pattison propone dieci minuti di object writing ogni mattina; Rick Rubin, in L’atto creativo, insiste sull’avere una pratica e sul migliorare il proprio gusto.',
        'Separa generare e giudicare: sessioni diverse, possibilmente giorni diversi.',
        'Un archivio di idee con nomi e date. Riascoltarle dopo mesi è un modo per prendere da te stesso invece che dagli altri.',
        'Ascolta fuori dal tuo genere. Più le fonti sono diverse, meno il risultato somiglia a una di esse.',
        'Cerca stimoli fuori dalla musica: libri, fotografie, architettura, luoghi. Nessuno potrà riconoscerli nel brano.',
        'Scrivi tanto. Jeff Tweedy, in How to Write One Song, insiste sul giocare e sul rendere la scrittura un’abitudine leggera, non un esame.',
      ] },
    ],
  },
  {
    id: 'routine', title: 'Una settimana tipo',
    lead: 'Un esempio da adattare ai tuoi tempi.',
    blocks: [
      { type: 'list', items: [
        'Lunedì · 10 min di object writing + 20 min di “Dieci idee in venti minuti”.',
        'Martedì · Pesca tre carte oblique e lavora su un’idea di lunedì.',
        'Mercoledì · Genera un brief “Media” e scrivi una bozza nel tempo indicato.',
        'Giovedì · Ascolto attivo: tre reference di generi diversi, descritte solo a parole.',
        'Venerdì · Arrangia la bozza di mercoledì partendo dalle descrizioni di giovedì, senza riascoltarle.',
        'Sabato · Test di distanza a orecchie fresche e una sola revisione.',
        'Domenica · Niente musica, o solo musica lontanissima da quella che scrivi.',
      ] },
    ],
  },
];

export interface Source { label: string; url: string; note: string }

export const SOURCES: readonly Source[] = [
  { label: 'Oblique Strategies — Brian Eno e Peter Schmidt', url: 'https://en.wikipedia.org/wiki/Oblique_Strategies', note: 'Il mazzo originale (1975) che ispira le carte di questa pagina.' },
  { label: 'Austin Kleon — Steal Like an Artist', url: 'https://austinkleon.com/steal/', note: 'Libro: combinare molte influenze invece di copiarne una.' },
  { label: 'Soundfly — Austin Kleon says you should rip off other musicians', url: 'https://flypaper.soundfly.com/hustle/austin-kleon-says-you-should-rip-off-other-musicians-and-hes-right/', note: 'Articolo: la differenza tra influenza e plagio per i songwriter.' },
  { label: 'Kirby Ferguson — Everything is a Remix', url: 'https://www.everythingisaremix.info/', note: 'Serie video: copiare, trasformare, combinare.' },
  { label: 'Rick Rubin — The Creative Act: A Way of Being', url: 'https://www.wheatonlibrary.org/posts/creative-act-rick-rubin-0', note: 'Libro (recensione): pratica, gusto, attenzione.' },
  { label: 'Pat Pattison — Object writing', url: 'https://www.masterclass.com/articles/object-writing', note: 'Esercizio sensoriale quotidiano di dieci minuti.' },
  { label: 'Jeff Tweedy — How to Write One Song', url: 'https://getmessier.substack.com/p/word-ladder', note: 'Libro (resoconto): l’esercizio della “word ladder”.' },
  { label: 'Jorge Variego — Composing with Constraints', url: 'https://academic.oup.com/book/41227/chapter/350706315', note: 'Libro: cento esercizi di composizione basati su vincoli.' },
  { label: 'TAXI forum — Writing music based on refs', url: 'https://forums.taxi.com/post613001.html', note: 'Forum: confrontare più reference e cambiare ciò che non serve.' },
  { label: 'Home Recording forum — How do you remain original', url: 'https://homerecording.com/bbs/threads/how-do-you-remain-original.259926/', note: 'Forum: mescolare influenze e riscrivere.' },
  { label: 'Guitar World — Destroy your guitar heroes', url: 'https://www.guitarworld.com/blogs/full-tilt-destroy-your-heroes', note: 'Articolo: non sorvegliarsi troppo, la voce arriva col tempo.' },
  { label: 'Pete Covington — How useful are reference tracks, really?', url: 'https://petecovington.substack.com/p/how-useful-are-reference-tracks-really', note: 'Articolo: il rischio di un ascolto troppo analitico.' },
  { label: 'Righteous Track Builder — Reference track analysis', url: 'https://jackrighteous.com/de/pages/righteous-track-builder-start-from-reference-track', note: 'Guida: la reference come prova di relazioni, non come modello.' },
  { label: 'Blabbermouth — Yngwie Malmsteen non ascolta musica quando scrive', url: 'https://blabbermouth.net/news/yngwie-malmsteen-i-deliberately-dont-listen-to-music-at-all-when-im-writing', note: 'Intervista: il digiuno di ascolti.' },
  { label: 'Jorge Arango — The power of constraints', url: 'https://jarango.com/2017/12/13/the-power-of-constraints/', note: 'Articolo: Eno e il suono d’avvio di Windows 95.' },
];

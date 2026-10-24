/**
 * Mazzo originale ispirato al metodo delle Oblique Strategies di Brian Eno e
 * Peter Schmidt (1975): frasi brevi che spostano il punto di vista quando sei
 * bloccato. I testi sono scritti per tonic (non è una traduzione del mazzo
 * originale, che è un'opera protetta) e ognuno ha un'applicazione concreta.
 */
export type CardArea = 'arrangiamento' | 'armonia' | 'melodia' | 'ritmo' | 'forma' | 'suono' | 'mente';

export interface ObliqueCard {
  id: string;
  area: CardArea;
  text: string;
  how: string;
}

export const AREA_LABELS: Record<CardArea, string> = {
  arrangiamento: 'Arrangiamento',
  armonia: 'Armonia',
  melodia: 'Melodia',
  ritmo: 'Ritmo',
  forma: 'Forma',
  suono: 'Suono',
  mente: 'Processo',
};

const RAW: Record<CardArea, Array<[text: string, how: string]>> = {
  arrangiamento: [
    ['Lo strumento che regge tutto, oggi tace.', 'Togli la parte su cui si appoggia il brano (spesso batteria o pad) e ricostruisci il groove con quello che resta.'],
    ['Scambia i compiti.', 'Il basso suona la melodia, i fiati diventano sezione ritmica, la batteria accompagna con tom intonati.'],
    ['Un solo registro per sezione.', 'Strofa tutta sotto il Do centrale, ritornello tutto sopra. Il contrasto nasce dall’altezza, non dal volume.'],
    ['Tre voci, non una di più.', 'Riduci l’arrangiamento a tre parti. Se manca qualcosa, deve farlo uno dei tre strumenti.'],
    ['Arrangia per la band sbagliata.', 'Scrivi le parti per un quartetto d’archi o una banda di paese, poi riportale sui tuoi strumenti: tieni le stranezze.'],
    ['Il ritornello arriva con meno.', 'Invece del “tutti dentro”, togli due elementi all’ingresso del ritornello e affida l’impatto al vuoto.'],
    ['Passa la palla.', 'Una frase comincia in uno strumento e finisce in un altro. Prova un hocket: ogni nota a uno strumento diverso.'],
    ['Ogni otto battute qualcuno esce.', 'Regola fissa: ogni 8 battute uno strumento smette e un altro entra. Nessuno suona per tutto il brano.'],
    ['Raddoppia nel posto sbagliato.', 'Raddoppia la melodia due ottave sotto, o con uno strumento percussivo, invece che all’unisono.'],
    ['Prima l’energia, poi le note.', 'Disegna una curva da 1 a 10 per ogni sezione. Arrangia solo per rispettare quella curva.'],
    ['L’ospite inatteso.', 'Aggiungi un timbro estraneo al genere (fisarmonica, kalimba, coro registrato col telefono) e dagli un ruolo vero, non decorativo.'],
    ['Il silenzio è una parte.', 'Scrivi per uno strumento una parte fatta quasi solo di pause: entra in tre punti precisi del brano.'],
    ['Tutti sulla stessa linea.', 'Per quattro battute la band suona la stessa frase all’unisono o in ottava. Decidi dove colpisce di più.'],
    ['Vicino e lontano.', 'Immagina ogni strumento a una distanza diversa nella stanza. Arrangia la profondità, non solo le note.'],
    ['Niente accordi tenuti.', 'Pad vietati: l’armonia deve nascere da arpeggi, riff, voci che si muovono.'],
    ['La parte che si sente solo se manca.', 'Scrivi una contro-linea discretissima. Toglila e rimettila: se il brano si svuota, è giusta.'],
    ['Il tempo lo tiene qualcun altro.', 'Niente batteria fino all’ultima sezione: il pulse lo portano basso, chitarra stoppata o clavinet.'],
    ['Il solista accompagna.', 'Lo strumento che di solito fa l’assolo accompagna; chi accompagna prende la scena.'],
    ['Prendi l’organico, lascia le parti.', 'Della tua reference tieni solo la lista degli strumenti. Chiudi l’ascolto e scrivi da zero.'],
    ['Stretto, poi largo.', 'Strofa quasi mono e concentrata, ritornello aperto ai lati. L’evoluzione è nello spazio.'],
  ],
  armonia: [
    ['Un accordo, per tutto il tempo che serve.', 'Scrivi 16 battute su un solo accordo: il movimento lo creano basso, ritmo e voci interne.'],
    ['Il basso evita casa.', 'Per un’intera sezione il basso non suona mai la fondamentale: terze, quinte, pedali, note di passaggio.'],
    ['Togli l’accordo di cui sei più sicuro.', 'Trova l’accordo più prevedibile della progressione e sostituiscilo: sostituto di tritono, prestito modale, accordo di passaggio.'],
    ['Una nota non si muove.', 'Tieni una nota ferma nel basso o in cima ai voicing mentre gli accordi le cambiano attorno.'],
    ['La melodia prima, gli accordi più lontani possibile.', 'Scrivi la melodia, poi cerca gli accordi più distanti che la contengono ancora (Chord Finder aiuta).'],
    ['Solo triadi.', 'Niente settime né tensioni: il colore deve venire da rivolti, registro e voicing.'],
    ['Stessa tonica, altro modo.', 'Il ritornello resta sulla stessa tonica ma cambia modo: ionico → misolidio, dorico → frigio.'],
    ['Una voce scivola.', 'Una voce interna scende o sale per semitoni per tutta la sezione; gli accordi si adattano a lei.'],
    ['Il giro che odi.', 'Prendi la progressione più abusata che conosci e rendila irriconoscibile cambiando solo il ritmo armonico.'],
    ['Accordi di durate dispari.', 'Accordi che durano 3, 5, 2 e 6 movimenti invece di una battuta ciascuno.'],
    ['Senza dominante.', 'Nessun accordo di dominante nel brano: trova altre strade per creare tensione e arrivo.'],
    ['Due centri per quattro battute.', 'Il basso resta in una tonalità mentre la melodia si sposta in un’altra, poi si ritrovano.'],
    ['Lo sbaglio ripetuto è una scelta.', 'Inserisci un accordo “sbagliato” e ripetilo identico più avanti: diventa intenzione.'],
    ['Un buco nel voicing.', 'Lascia un’ottava vuota al centro: basso grave, tensioni acute, niente in mezzo.'],
  ],
  melodia: [
    ['Cinque altezze e basta.', 'Tutta la melodia usa al massimo cinque note diverse. Varia ritmo, registro e durata.'],
    ['Prima parla, poi canta.', 'Pronuncia una frase ad alta voce (anche sillabe inventate) e trascrivi il suo ritmo naturale.'],
    ['Lontano dallo strumento.', 'Componi la melodia camminando e registrala sul telefono. Lo strumento si prende solo dopo.'],
    ['Una cellula, molti vestiti.', 'Parti da tre note: inversione, aumentazione, retrogrado, spostamento ritmico. Niente materiale nuovo.'],
    ['Il punto più alto, una volta sola.', 'Decidi il culmine melodico e raggiungilo una sola volta in tutto il brano.'],
    ['Solo salti.', 'Per otto battute la melodia si muove soltanto per salti di quarta o più.'],
    ['Respira altrove.', 'Sposta le pause della frase: comincia in levare, o dopo il terzo tempo.'],
    ['Il mondo canta già.', 'Trascrivi il contorno di un suono non musicale (sirena, uccello, annuncio in stazione) e usalo come tema.'],
    ['Ripeti finché diventa nuovo.', 'Ripeti la stessa frase quattro volte cambiando ogni volta una sola nota o un solo accento.'],
    ['Il basso sale in cima.', 'Prendi una tua linea di basso, portala in registro acuto come melodia e scrivi un basso nuovo sotto.'],
    ['Domanda senza risposta.', 'Scrivi una frase che non risolve e lasciala così, almeno la prima volta.'],
    ['Disegna, poi suona.', 'Traccia una linea su carta (onde, gradini, zig-zag) e componi seguendo il disegno.'],
    ['Il tuo nome in note.', 'Trasforma le lettere di un nome o di un luogo in note con una regola che inventi tu.'],
  ],
  ritmo: [
    ['Altro metro, stessa sensazione.', 'Riscrivi il groove in 7/8 o 5/4 senza che suoni “difficile”: deve ancora far muovere la testa.'],
    ['Sposta tutto di una semicroma.', 'Anticipa o ritarda il riff principale di un sedicesimo e guarda cosa succede agli accenti.'],
    ['Un solo colpo di cassa.', 'La cassa suona una volta per battuta: la spinta deve arrivare da altro.'],
    ['Il groove di una parola.', 'Scegli una parola di 3–5 sillabe e trasforma i suoi accenti in un pattern.'],
    ['Metà tempo al ritornello.', 'Ritornello in half-time (o double-time) mentre gli accordi restano identici.'],
    ['Un poliritmo sotto la superficie.', 'Uno strumento suona in 3 contro il 4 degli altri, così piano che lo senti solo con attenzione.'],
    ['Ognuno il suo swing.', 'Un elemento dritto, uno con swing leggero, uno molto indietro: la tasca nasce dalla differenza.'],
    ['Una battuta di vuoto.', 'Inserisci una battuta di silenzio totale in un punto che nessuno si aspetta.'],
    ['Il groove nasce in cucina.', 'Registra 30 secondi di suoni di casa e costruisci il pattern solo con quelli.'],
    ['Sezioni sempre più corte.', 'Stesso BPM, ma parti di 16, 8, 4, 2 battute: la forma accelera, il tempo no.'],
    ['Clave obbligata.', 'Scegli una clave (son, rumba, bossa) e fai in modo che ogni parte la rispetti o la contraddica di proposito.'],
    ['Nessun fill.', 'Fill di batteria vietati: le transizioni devono nascere da armonia o arrangiamento.'],
  ],
  forma: [
    ['Comincia dalla fine.', 'Scrivi prima l’ultima sezione, poi chiediti cosa serve per arrivarci.'],
    ['Niente che torna.', 'Forma senza ritornello: A B C D, oppure un’unica sezione che si trasforma.'],
    ['La sezione che passa una volta.', 'Inserisci una parte che compare una sola volta e non viene mai ripresa.'],
    ['Novanta secondi.', 'Comprimi tutto in un minuto e mezzo. Poi decidi se allungarlo davvero.'],
    ['Taglia l’intro.', 'Il brano comincia direttamente dal suo momento migliore.'],
    ['Una forma presa in prestito altrove.', 'Usa la struttura di una poesia, di un film in tre atti o di una ricetta come forma del brano.'],
    ['L’errore fa da ponte.', 'Improvvisa la transizione, registra anche gli errori e costruisci il passaggio attorno a uno di essi.'],
    ['La coda vince.', 'La sezione finale è la più sviluppata: tutto il resto è preparazione.'],
    ['Ogni parte, una casa nuova.', 'Modula a ogni nuova sezione, con un accordo pivot diverso ogni volta.'],
    ['Simmetria rotta.', 'Costruisci una forma simmetrica (A B C B A) e rompila in un solo punto.'],
    ['Frasi dispari.', 'Frasi di 5, 7 o 9 battute invece di 4 e 8.'],
  ],
  suono: [
    ['Un solo suono per tutto.', 'Un unico preset o strumento per tutte le parti: cambiano solo registro e articolazione.'],
    ['Registrato male, messo al centro.', 'Registra una parte col telefono e mettila in primo piano nel mix.'],
    ['Scordato di proposito.', 'Scorda leggermente una corda o un oscillatore e usalo come colore fisso.'],
    ['Il riverbero è un luogo.', 'Scegli un posto reale (chiesa, garage, bagno) e fai vivere lì tutto il brano.'],
    ['L’altra mano.', 'Registra una parte con la mano non dominante o con un dito solo.'],
    ['Tre secondi bastano.', 'Prendi tre secondi di un tuo vecchio provino e costruisci da lì un brano nuovo.'],
    ['Senza alti.', 'Lavora mezz’ora con un passa-basso su tutto il mix: arrangia per peso e densità.'],
    ['Niente quantizzazione.', 'Tieni tutte le parti come sono state suonate.'],
    ['Lo strumento che non sai suonare.', 'Scrivi una parte su uno strumento che non conosci: i tuoi limiti diventano stile.'],
    ['Ascolta dalla porta.', 'Esci dalla stanza e ascolta da dietro la porta: tieni solo quello che arriva ancora.'],
  ],
  mente: [
    ['Dieci idee, nessun giudizio.', 'Dieci idee in dieci minuti, registrate e non riascoltate. Scegli solo il giorno dopo.'],
    ['Cosa non faresti mai?', 'Fai proprio quello, per otto battute.'],
    ['L’idea facile ha un padre.', 'Quando un’idea arriva troppo facile, chiediti da quale brano viene. Poi cambiale un parametro.'],
    ['Scrivi per qualcuno.', 'Componi pensando a una persona precisa che lo ascolterà. Cosa vorrebbe sentire?'],
    ['La versione più semplice.', 'Riduci l’idea alla sua forma più banale. Se regge così, puoi complicarla.'],
    ['Un’altra velocità.', 'Se di solito rifinisci, fai uno sketch in 15 minuti. Se di solito corri, passa un’ora su quattro battute.'],
    ['Cambia l’ordine.', 'Se parti sempre dagli accordi, parti dal groove. Se parti dal groove, parti dal titolo.'],
    ['Qual è la tua ricetta?', 'Elenca le tre scelte che fai sempre. Oggi ne vieti una.'],
    ['Fermati sul più bello.', 'Chiudi la sessione quando sai cosa viene dopo: domani riparti da lì.'],
    ['Il titolo prima del brano.', 'Inventa un titolo, poi scrivi il brano che quel titolo merita.'],
    ['Rifallo a memoria.', 'Chiudi il progetto, aspetta un giorno e riscrivi l’idea da memoria. Tieni le differenze.'],
    ['Il dettaglio che ti imbarazza.', 'Trova il punto che vorresti nascondere e rendilo protagonista.'],
    ['Spiegalo a un bambino.', 'Racconta il brano a voce senza termini tecnici. Quello che dici è la direzione.'],
    ['Carta bianca.', 'Nessuna regola: scrivi ciò che vuoi, ma per non più di 20 minuti.'],
  ],
};

export const CARDS: ObliqueCard[] = (Object.keys(RAW) as CardArea[]).flatMap(area =>
  RAW[area].map(([text, how], i) => ({ id: `${area}-${i + 1}`, area, text, how })),
);

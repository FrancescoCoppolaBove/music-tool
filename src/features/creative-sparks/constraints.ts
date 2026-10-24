/**
 * Dimensioni del generatore di vincoli. Le "base" compaiono sempre (la cornice
 * del brano); le "regole" vengono estratte in numero variabile a seconda
 * dell'intensità scelta.
 */
export type DimId =
  | 'tempo' | 'metro' | 'centro' | 'durata'
  | 'organico' | 'armonia' | 'melodia' | 'ritmo' | 'arrangiamento' | 'forma' | 'divieto' | 'spunto';

export interface Dimension {
  id: DimId;
  label: string;
  kind: 'base' | 'rule';
  options: readonly string[];
}

const TONICS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const MODES = ['ionico', 'dorico', 'frigio', 'lidio', 'misolidio', 'eolio', 'minore melodica', 'minore armonica', 'pentatonica minore', 'lidio dominante'];

export const DIMENSIONS: readonly Dimension[] = [
  { id: 'tempo', label: 'Tempo', kind: 'base', options: ['60–72 BPM, lento e largo', '84–92 BPM, groove a metà tempo', '96–104 BPM', '108–116 BPM', '120–128 BPM', '138–150 BPM', 'Rubato, senza click'] },
  { id: 'metro', label: 'Metro', kind: 'base', options: ['4/4', '3/4', '6/8', '5/4 (3+2)', '7/8 (2+2+3)', '7/4', '9/8 (2+2+2+3)', 'Un metro diverso per ogni sezione'] },
  { id: 'centro', label: 'Centro tonale', kind: 'base', options: TONICS.flatMap(t => MODES.map(m => `${t} ${m}`)) },
  { id: 'durata', label: 'Tempo di lavoro', kind: 'base', options: ['20 minuti, poi ti fermi', '45 minuti', '90 minuti', 'Una sera, poi non lo tocchi per 48 ore'] },
  { id: 'organico', label: 'Organico', kind: 'rule', options: [
    'Solo basso, batteria e una voce',
    'Piano, basso, batteria e un sax',
    'Tre strumenti, nessuno armonico',
    'Synth bass, drum machine e una chitarra',
    'Fiati e percussioni, niente tastiere',
    'Una voce e un solo strumento',
    'Archi più un unico elemento elettronico',
    'Tutta la band, ma mai più di due strumenti insieme',
  ] },
  { id: 'armonia', label: 'Armonia', kind: 'rule', options: [
    'Al massimo due accordi in tutto il brano',
    'Nessun accordo di dominante',
    'Solo triadi, niente estensioni',
    'Pedale di basso per tutta la strofa',
    'Modulazione di terza all’ingresso del ritornello',
    'Ritmo armonico irregolare (3, 5, 2 movimenti)',
    'Una voce interna cromatica obbligatoria',
    'Nessun accordo maggiore',
  ] },
  { id: 'melodia', label: 'Melodia', kind: 'rule', options: [
    'Massimo cinque altezze diverse',
    'Melodia composta cantando, senza strumento',
    'Un solo motivo di tre note, sviluppato',
    'Culmine raggiunto una sola volta',
    'Tutte le frasi cominciano in levare',
    'Contorno preso da una frase parlata',
  ] },
  { id: 'ritmo', label: 'Ritmo', kind: 'rule', options: [
    'Cassa una sola volta per battuta',
    'Ritornello in half-time',
    'Un poliritmo 3:4 nascosto in una parte',
    'Nessun fill di batteria',
    'Riff principale spostato di una semicroma',
    'Clave son 3-2 obbligata',
  ] },
  { id: 'arrangiamento', label: 'Arrangiamento', kind: 'rule', options: [
    'Ogni 8 battute uno strumento esce e uno entra',
    'Il ritornello entra con meno strumenti della strofa',
    'Basso e melodia si scambiano i ruoli a metà brano',
    'Nessun pad o accordo tenuto',
    'Almeno un passaggio della melodia da uno strumento a un altro',
    'Una parte fatta di pause con soli tre interventi',
    'Quattro battute all’unisono in un punto chiave',
  ] },
  { id: 'forma', label: 'Forma', kind: 'rule', options: [
    'Senza ritornello: A B C D',
    'Durata massima due minuti',
    'Niente intro: si comincia dal momento migliore',
    'Frasi di 5 o 7 battute',
    'La coda è la sezione più lunga',
    'Forma in tre atti, come un film',
  ] },
  { id: 'divieto', label: 'Divieto', kind: 'rule', options: [
    'Vietato il tuo strumento principale',
    'Vietato ascoltare reference finché la bozza non è finita',
    'Vietati i preset di fabbrica',
    'Vietato il loop di quattro battute',
    'Vietato il tuo accordo preferito',
    'Vietato correggere: ogni take è definitiva',
  ] },
  { id: 'spunto', label: 'Spunto extra-musicale', kind: 'rule', options: [
    'Una foto che hai scattato oggi',
    'Il rumore della tua strada alle sette del mattino',
    'Un edificio che conosci bene: le sue proporzioni sono la forma',
    'Un ricordo d’infanzia preciso, con luogo e ora',
    'Il ritmo di una conversazione al bar',
    'Un colore e una temperatura',
    'Una notizia letta stamattina',
    'Una ricetta di famiglia: ingredienti = strumenti, passaggi = sezioni',
  ] },
];

export const INTENSITIES = [
  { id: 'light', label: 'Leggera', rules: 2 },
  { id: 'medium', label: 'Media', rules: 4 },
  { id: 'extreme', label: 'Estrema', rules: 6 },
] as const;
export type IntensityId = typeof INTENSITIES[number]['id'];

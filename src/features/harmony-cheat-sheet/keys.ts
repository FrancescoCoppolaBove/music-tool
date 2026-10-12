import { Note, Scale } from 'tonal';
import type { TaggedReference } from './types';
export interface KeyReference extends TaggedReference {
  tonic: string; mode: 'major' | 'minor'; notes: string[]; direction: string; advantage: string; difficulty: string; utility: string; recommended: boolean; progression: string;
}
const ROOTS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const MINOR_ROOTS = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];
const ITALIAN = ['Do','Re bemolle / Do diesis','Re','Mi bemolle','Mi','Fa','Sol bemolle / Fa diesis','Sol','La bemolle / Sol diesis','La','Si bemolle','Si'];
const ADVANTAGES = [
  'Al pianoforte, C maggiore rende visibili i gradi sui tasti bianchi; prova poi il contrasto con il minore parallelo.',
  'Una tessitura in Db/C# può collocare la voce fra C e D; scegli la grafia adatta alla modalità.',
  'D permette un pedale su corda aperta a basso e chitarra; adatto a costruire un tema attorno alla tonica.',
  'In Eb concert, il contralto legge C e gli strumenti in Bb leggono F: un punto di partenza pratico per una sezione fiati.',
  'E può sfruttare la corda grave aperta del basso a quattro corde e della chitarra.',
  'In F concert, contralto in D e strumenti in Bb in G: considera questa combinazione per un tema di fiati.',
  'Gb/F# può adattare il registro della voce e dare un’altra disposizione fisica alle tastiere.',
  'G può sfruttare corde aperte di chitarra e basso per pedali o risposte al tema.',
  'In Ab concert, contralto in F e strumenti in Bb in Bb: valuta il registro del tema prima della complessità di lettura.',
  'A offre una tonica su corda aperta di basso e chitarra e un pedale ben definito.',
  'In Bb concert, contralto in G e strumenti in Bb in C: comodo riferimento di lettura per il tema collettivo.',
  'B permette una fondamentale grave B0 su basso a cinque corde con accordatura standard; valuta se serve davvero quel registro.',
];
const CAUTIONS = [
  'Il minore introduce Eb, Ab e Bb: le posizioni non sono quelle di C maggiore.',
  'Db maggiore e C# minore hanno grafie diverse; evita trascrizioni enarmoniche automatiche delle parti.',
  'La corda D del basso è D2: per una tonica più grave occorre una posizione diversa o un’altra accordatura.',
  'La tonica Eb1 è sotto E1 del basso a quattro corde standard: usa un’ottava più alta o cinque corde.',
  'Un pedale E1 molto grave può impastare con le tastiere: separa i registri.',
  'Sul basso a quattro corde F1 è vicino al limite grave: lascia spazio al movimento della linea.',
  'Gb maggiore e F# minore semplificano letture diverse: scegli la grafia per il contesto.',
  'Le corde aperte non sono sempre ideali per lo staccato: considera articolazione e muting.',
  'Ab maggiore e G# minore sono grafie pratiche diverse; G# minore armonica include Fx.',
  'La comodità delle corde aperte può non coincidere con la tessitura del cantante.',
  'Su un basso standard la tonica Bb0 non è disponibile: Bb1 è un’alternativa; valuta la linea completa.',
  'B0 richiede cinque corde standard; sul quattro corde usa B1. Controlla densità e leggibilità delle parti.',
];
export const KEYS: KeyReference[] = (['major','minor'] as const).flatMap(mode => (mode === 'major' ? ROOTS : MINOR_ROOTS).map((tonic,index) => {
  const recommended = (mode === 'major' ? ['Bb','Eb','F','Ab','Db'] : ['C','F','G','D','Bb']).includes(tonic);
  const notes = Scale.get(`${tonic} ${mode}`).notes;
  const dominant = notes[4];
  const direction = mode === 'major' ? 'Speranza o serenità con melodia aperta e voicing distesi.' : 'Nostalgia o sensualità con fraseggio raccolto e spazio fra le voci.';
  return { id:`key-${tonic}-${mode}`, name:`${tonic} ${mode === 'major' ? 'maggiore' : 'minore'}`, tonic, mode, notes, direction,
    genres: mode === 'major' ? ['Jazz','Funk','Soul','Gospel','R&B','Nu-jazz'] : ['Jazz','Funk','Soul','Gospel','R&B','Nu-jazz'],
    emotions: mode === 'major' ? ['Gioia','Speranza','Serenità'] : ['Nostalgia','Malinconia','Sensualità'],
    aliases:[ITALIAN[index], `${tonic}${mode === 'minor' ? 'm' : ''}`, mode],
    advantage:ADVANTAGES[index],
    difficulty:`${CAUTIONS[index]} Parti scritte: ${Note.transpose(tonic,'2M')} per tromba/tenore, ${Note.transpose(tonic,'6M')} per contralto (qui solo classe di altezza).`,
    utility: recommended ? 'In evidenza per il tuo organico; verifica tessitura e arrangiamento.' : 'Alternativa utile se valorizza la voce, il registro o le posizioni degli strumenti.', recommended,
    progression: mode === 'major' ? `${notes[1]}m7 – ${dominant}7 – ${tonic}maj7` : `${notes[1]}m7b5 – ${dominant}7(b9) – ${tonic}m`,
  };
}));

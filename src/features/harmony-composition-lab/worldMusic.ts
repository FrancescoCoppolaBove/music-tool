export type WorldMusicEntry = {
  id: string;
  name: string;
  tradition: string;
  region: string;
  overview: string;
  practice: string;
  tuning: string;
  sources: { label: string; url: string }[];
};

/** Curated orientation, not a substitute for learning from tradition bearers. */
export const WORLD_MUSIC_ENTRIES: WorldMusicEntry[] = [
  {
    id: 'maqam-hijaz', name: 'Maqam Hijaz', tradition: 'Arabic maqam', region: 'Arabic-speaking musical traditions',
    overview: 'A named maqam in a family organized around the Hijaz jins. A maqam is a melodic system and pathway, not simply a Western scale or chord map.',
    practice: 'Study its constituent ajnas, melodic emphasis, phrase direction and modulation in repertoire. The same label can encompass contextual performance choices.',
    tuning: 'Pitch inflection and the placement of notes are not adequately described by a fixed twelve-note keyboard. This Lab does not synthesize a faithful maqam performance.',
    sources: [{ label: 'MaqamWorld · maqam index', url: 'https://www.maqamworld.com/en/maqam.php' }, { label: 'MaqamWorld · the jins', url: 'https://maqamworld.com/en/jins.php' }],
  },
  {
    id: 'maqam-rast', name: 'Maqam Rast', tradition: 'Arabic maqam', region: 'Arabic-speaking musical traditions',
    overview: 'MaqamWorld describes Rast as a major maqam family whose construction begins with a root jins Rast and continues with an upper jins, with more than one possible route.',
    practice: 'Listen to the cited taqsim and repertoire examples; attend to the relationship between the lower and upper jins and to melodic movement.',
    tuning: 'The root jins Rast uses an intervallic quality not captured by mapping every pitch to the nearest equal-tempered semitone. No 12-TET playback is offered as an authentic rendering.',
    sources: [{ label: 'MaqamWorld · Rast', url: 'https://www.maqamworld.com/en/maqam/rast.php' }, { label: 'MaqamWorld · the jins', url: 'https://maqamworld.com/en/jins.php' }],
  },
  {
    id: 'maqam-bayati', name: 'Maqam Bayati', tradition: 'Arabic maqam', region: 'Arabic-speaking musical traditions',
    overview: 'A widely used maqam family beginning with jins Bayati. Its upper route may use different ajnas, so a single ascending pitch list leaves out important musical behavior.',
    practice: 'Compare the cited Bayati taqsim and repertoire. Follow where the melody rests, emphasizes notes, and moves between lower and upper ajnas.',
    tuning: 'Intonation and melodic context matter; an equal-tempered scale approximation would conceal defining pitch behavior. The Lab does not claim faithful playback.',
    sources: [{ label: 'MaqamWorld · Bayati', url: 'https://worldwww.maqamworld.com/en/maqam/bayati.php' }, { label: 'MaqamWorld · maqam index', url: 'https://www.maqamworld.com/en/maqam.php' }],
  },
  {
    id: 'maqam-nahawand', name: 'Maqam Nahawand', tradition: 'Arabic maqam', region: 'Arabic-speaking musical traditions',
    overview: 'A maqam family whose lower jins Nahawand can lead to different upper ajnas, including Hijaz or Kurd, as documented in the linked reference.',
    practice: 'Compare performances and listen for the selected upper jins and the melodic route rather than treating the name as one fixed scale.',
    tuning: 'A keyboard-only approximation cannot represent the full intonational and melodic practice. Faithful microtonal playback is not available here.',
    sources: [{ label: 'MaqamWorld · Nahawand', url: 'https://www.maqamworld.com/en/maqam/nahawand.php' }],
  },
  {
    id: 'maqam-kurd', name: 'Maqam Kurd', tradition: 'Arabic maqam', region: 'Arabic-speaking musical traditions',
    overview: 'MaqamWorld describes Kurd through a root jins Kurd and an upper jins Nahawand in its principal form.',
    practice: 'Use the linked taqsim and repertoire to hear melodic emphasis and movement between the constituent ajnas.',
    tuning: 'Do not infer that the Western label “Phrygian” fully describes maqam Kurd; the melodic system and intonation extend beyond that comparison.',
    sources: [{ label: 'MaqamWorld · Kurd', url: 'https://oud.maqamworld.com/en/maqam/kurd.php' }],
  },
  {
    id: 'raga-bhairav', name: 'Raga Bhairav', tradition: 'Hindustani raga', region: 'North Indian classical music',
    overview: 'A raga is a melodic framework with characteristic movement and emphasis. A thaat is a classification framework; it is not itself a complete raga.',
    practice: 'Learn aroha (ascending movement), avaroha (descending movement), characteristic phrases, ornament and note emphasis from a teacher and recordings. A note inventory alone is not a performance model.',
    tuning: 'Swaras are taught in relation to Sa and performance practice; pitch realization and ornament are not represented by a static MIDI scale here.',
    sources: [{ label: 'Visva-Bharati · Hindustani music syllabus', url: 'https://www.visvabharati.ac.in/iqac/uploads/syllabus/bhavana_dept_files/7_one_year_course_for_foreign_students_hcm.pdf' }, { label: 'Raag Hindustani · raga concepts', url: 'https://www.raag-hindustani.com/Scales1.html' }],
  },
  {
    id: 'raga-kafi', name: 'Raga Kafi', tradition: 'Hindustani raga', region: 'North Indian classical music',
    overview: 'Kafi is both a thaat name and part of the names of ragas; these labels refer to different levels of classification and musical identity.',
    practice: 'Explore an actual Kafi performance and its characteristic phrases, note emphasis, ornament and movement. Do not harmonize it automatically as a Western minor mode.',
    tuning: 'This interface does not encode raga-specific intonation, ornament, or performance grammar as a 12-tone scale.',
    sources: [{ label: 'Visva-Bharati · Hindustani music syllabus', url: 'https://www.visvabharati.ac.in/iqac/uploads/syllabus/bhavana_dept_files/7_one_year_course_for_foreign_students_hcm.pdf' }, { label: 'Raag Hindustani · raga concepts', url: 'https://www.raag-hindustani.com/Scales1.html' }],
  },
  {
    id: 'japan-hirajoshi', name: 'Hirajōshi tuning', tradition: 'Japanese koto', region: 'Japan',
    overview: 'Hirajōshi is a koto tuning name. Western scale charts use the term in several ways, so the label should not be taken to mean one universal Japanese scale.',
    practice: 'The linked Koto Sound Dictionary describes a D-mode five-pitch tuning and its historical association with koto. Listen on the instrument and study the tuning in its repertoire context.',
    tuning: 'The Lab does not generate a note-set approximation here: spellings and interval patterns under this label vary by source, and a generic preset may not match this koto tuning.',
    sources: [{ label: 'Koto Sound Dictionary · Hirajoshi', url: 'https://koto.sapp.org/dict/hirajoshi/' }, { label: 'Piggott · The Music and Musical Instruments of Japan (1909)', url: 'https://books.google.com/books?id=MAM5AAAAIAAJ' }],
  },
  {
    id: 'japan-in-sen', name: 'In-sen', tradition: 'Japanese tuning / scale label', region: 'Japan',
    overview: 'In-sen and related labels appear in modern descriptions of Japanese pitch collections, but naming and pitch content vary across sources and contexts.',
    practice: 'Treat this as a listening prompt. Compare primary instrument recordings and source-specific tunings before applying the label to a composition.',
    tuning: 'No single reference definition is asserted here; this entry has no generated note set or audio approximation.',
    sources: [{ label: 'Piggott · The Music and Musical Instruments of Japan (1909)', url: 'https://books.google.com/books?id=MAM5AAAAIAAJ' }],
  },
  ...(['Tizita', 'Bati', 'Ambassel', 'Anchihoye'] as const).map(name => ({
    id: `ethiopia-${name.toLowerCase()}`, name: `Kiñit ${name}`, tradition: 'Ethiopian kiñit', region: 'Ethiopia, with regional and repertorial variation',
    overview: `${name} is one of four commonly discussed Ethiopian kiñit categories represented in the cited research dataset. Kiñit operates in musical practice and should not be reduced to a Western scale label.`,
    practice: 'Listen to Ethiopian recordings and attend to melodic contour, instrument, phrasing and local practice. The research dataset combines distinct chant, azmari and secular sources; it is a research sample, not a complete account of the tradition.',
    tuning: 'The Lab does not claim an equal-tempered note list reproduces this kiñit or its performance practice.',
    sources: [{ label: 'PLOS ONE · Kiñit classification research', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0284560' }, { label: 'Smithsonian Folkways · Tizita recording', url: 'https://folkways.si.edu/meklit/tizita' }],
  })),
  {
    id: 'armenia-utjayn', name: 'Ut‘jayn (eight-mode system)', tradition: 'Armenian sacred chant', region: 'Armenian liturgical music',
    overview: 'Ut‘jayn is studied in Armenian sacred chant through modal structures, degrees, characteristic melodic patterns and intonational development. It is not a list of eight Western church modes.',
    practice: 'Begin with sharakans and specialist musicological work on mode, formula and cadence. The linked Armenian research source grounds this entry in the tradition’s own theoretical history.',
    tuning: 'The system and its performance inflections cannot be faithfully represented as a single twelve-tone scale in this Lab; no note-set playback is offered.',
    sources: [{ label: 'Pan-Armenian Digital Library · Ut‘jayn study', url: 'https://arar.sci.am/dlibra/publication/470849/edition/436323?language=hye' }, { label: 'Komitas Museum · Armenian musicology', url: 'https://komitasmuseum.am/en/%D5%AC%D5%AB%D5%AC%D5%AB%D5%A9-%D5%B0%D5%A1%D6%80%D5%B8%D6%82%D5%A9%D5%B5%D5%B8%D6%82%D5%B6%D5%B5%D5%A1%D5%B6/' }],
  },
];

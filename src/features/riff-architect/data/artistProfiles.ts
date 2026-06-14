export interface Artist {
  id: string;
  name: string;
  color: string;
  tagline: string;
  harmonicDNA: string[];
  rhythmicDNA: string[];
  keyTechniques: string[];
  scalePreferences: string[];
  exampleApproach: string;
}

export interface UST {
  label: string;
  triadRoot: string;
  triadType: 'M' | 'm';
  resultingColor: string;
  tensionsAdded: string[];
  character: string;
}

export interface PentaSuper {
  label: string;
  intervalFromRoot: string;
  scaleType: string;
  character: string;
  tonesHighlighted: string[];
}

export const ARTISTS: Artist[] = [
  {
    id: 'snarkyPuppy',
    name: 'Snarky Puppy',
    color: '#f59e0b',
    tagline: 'Complex unison figures, modal harmony, orchestral density',
    harmonicDNA: [
      'Dorian and Mixolydian are home — avoid pure major/minor',
      'Upper structure triads over dominant chords (bVI, II, bII triads)',
      'Chromatic planing: move entire chord structures by half-step',
      'Pedal tones under shifting harmonies create orchestral depth',
    ],
    rhythmicDNA: [
      'Highly syncopated 16th-note lines — accents on upbeats',
      'Unison ensemble figures with exact rhythmic precision',
      'Euclidean rhythms: 7 or 5 beats spread over 16 slots',
      'Cross-rhythm: 3-note groupings inside 4/4 (groups of 3)',
    ],
    keyTechniques: [
      'Write the riff in unison for multiple instruments — the blend IS the sound',
      'Start on an upbeat ("and" of 4), never beat 1',
      'Use the #11 (Lydian dominant) as the characteristic color tone',
      'Build 3-note cells and repeat them displaced by one 16th',
      'End phrases on the b7 or 9th, not the root',
    ],
    scalePreferences: ['dorian', 'mixolydian', 'lydian dominant', 'bebop dorian'],
    exampleApproach: 'Take a 3-note chromatic cluster starting on the 5th. Displace it rhythmically by one 16th note on each repetition. Add a bVI upper structure triad in the 4th bar for harmonic color.',
  },
  {
    id: 'jacobCollier',
    name: 'Jacob Collier',
    color: '#06b6d4',
    tagline: 'Reharmonization, negative harmony, pentatonic superimposition',
    harmonicDNA: [
      'Constant reharmonization — every 2 beats can imply a new key',
      'Negative harmony: mirror a chord/melody around the E–Bb axis',
      'Borrowing from any parallel mode freely and without warning',
      'Sub-V7 (tritone substitute) chains create chromatic bass movement',
    ],
    rhythmicDNA: [
      '"Neapolitan" groove: 12/8 feel inside 4/4',
      'Double-time and half-time superimposition mid-phrase',
      'Rhythmic layering: each voice has its own metric layer',
      'Metric modulation: tempo shifts implied by rhythm, not stated',
    ],
    keyTechniques: [
      'Play a pentatonic scale built from a note a tritone away from the root',
      'Use the II major pentatonic over any minor chord (adds the Dorian 6th)',
      'Negative harmony: I becomes iv, V becomes iv (mirror around axis)',
      'Chain dominant 7ths a half-step apart: Db7 → C7 → Cb7 (parallel chromatic)',
      'Quote a simple tune, then reharmonize it beyond recognition',
    ],
    scalePreferences: ['major', 'minor', 'phrygian', 'lydian', 'whole tone'],
    exampleApproach: 'Take a simple ascending pentatonic figure in C. Harmonize the first half in C major, then suddenly shift to a pentatonic a tritone away (F# minor pentatonic) for the second half. The dissonance creates the signature "Jacob" moment.',
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    color: '#10b981',
    tagline: 'Deep funk, minor pentatonic, rhythmic pocket, blues-adjacent',
    harmonicDNA: [
      'Rooted in minor pentatonic + blues scale — harmonic simplicity is the point',
      'Dominant 7th chords are home — the b7 never resolves',
      'Occasional chromatic approaches to chord tones (half-step below)',
      'ii–V fragments that cut short before resolving — leaving the listener hanging',
    ],
    rhythmicDNA: [
      'The groove IS the composition — rhythmic precision over harmonic complexity',
      '16th-note subdivisions with heavy ghost note presence between main notes',
      'Downbeat accents alternate with syncopated upbeat hits',
      'Ostinato repetition: same 1–2 bar figure looped with micro-variations',
    ],
    keyTechniques: [
      'Write a 1-bar motif with ghost notes (muted/light touches between strong notes)',
      'The riff should feel uncomfortable to count — push against the beat',
      'Use the b5 (tritone) as a chromatic passing tone between 4 and 5',
      'Double the figure at the octave — the octave unison creates the thickness',
      'Play the same motif starting one 16th note later every 4 bars (displacement)',
    ],
    scalePreferences: ['minor pentatonic', 'blues', 'dorian', 'mixolydian'],
    exampleApproach: 'Build a 4-note motif using root, b3, 4, and 5. Notate ghost notes between each strong note. Loop it for 2 bars, then on bar 3 displace it by one 16th note. Keep everything else the same.',
  },
  {
    id: 'ghostNote',
    name: 'Ghost Note',
    color: '#a855f7',
    tagline: 'Drum-led composition, odd meters, complex unison figures',
    harmonicDNA: [
      'Harmony serves rhythm — chords chosen for their rhythmic articulation',
      'Stacked 4ths and 5ths create open, ambiguous harmonic texture',
      'Short chromatic clusters function as rhythmic punctuation, not melody',
      'Modal vamps in 5/4, 7/8, or 7/4 — the meter IS the riff',
    ],
    rhythmicDNA: [
      'Composed from the drum kit outward — every instrument mirrors percussion',
      'Odd meters as default: 5/4, 7/8, 7/4, 11/8',
      'Metric modulation: a bar of 7/8 inside 4/4 implies a tempo shift',
      'Accent patterns that contradict the barline — the pulse is felt, not obvious',
    ],
    keyTechniques: [
      'Choose an odd meter first (5/4 or 7/8), then construct the riff to fill it naturally',
      'In 5/4: think 3+2 or 2+3 groupings — choose which to accent',
      'In 7/8: think 3+2+2 or 2+2+3 — the unequal final group creates the lurch',
      'Short, punchy motifs (2–3 notes) work better in odd meters than long lines',
      'Let rests function as structural beats — the silence is part of the time signature',
    ],
    scalePreferences: ['phrygian', 'locrian', 'dorian', 'minor pentatonic'],
    exampleApproach: 'Choose 7/8 time. Think of it as 3+2+2. Write a 3-note cluster for the first 3 eighth-notes, then 2 staccato notes for each remaining group. The final "2" group should have a rest on the last eighth — creating the forward lurch into the next bar.',
  },
  {
    id: 'vulfpeck',
    name: 'Vulfpeck',
    color: '#f97316',
    tagline: 'Minimal funk, tight pocket, counterpoint bass/melody, subtraction as art',
    harmonicDNA: [
      'Major and Mixolydian are home — harmony is a backdrop, not the story',
      'Progressions rarely go beyond maj7/m7 — no extensions unless deeply intentional',
      'I–IV and I–IV–V are the backbone; ii–V–I occasionally for "jazz lift"',
      'Voicings are open and transparent — leave room for the bass to function melodically',
    ],
    rhythmicDNA: [
      'The tightest pocket in modern funk — every hit is exactly where it should be',
      '16th-note subdivision feel à la Motown, but sparse: most of the grid is empty',
      'Ghost notes as the invisible skeleton — felt but barely heard between main hits',
      '"Dead notes" and palm mutes as rhythmic texture, not decoration',
    ],
    keyTechniques: [
      'Write the bass line first — it is the melody. Everything else fills around it.',
      'Remove one instrument from the arrangement every time it sounds "full enough"',
      'The interplay between bass and keys/voice IS the composition (Woody Goss vs. Joe Dart)',
      'Never fill every beat — long rests create anticipation and make hits land harder',
      'When in doubt, repeat the groove for 4 more bars before moving on',
      'Jack Stratton\'s rule: if it sounds too simple, it\'s probably just right',
    ],
    scalePreferences: ['major', 'mixolydian', 'blues scale (occasional)', 'pentatonic major'],
    exampleApproach: 'Write a 2-bar bass line using only root, 5th, and b7 (one note per beat, 4/4). Add a keyboard chord on beats 2 and 4 only (stab). Add a melody that uses 3 notes maximum over 4 bars. Remove the keyboard from bars 3–4. That space is now the arrangement.',
  },
  {
    id: 'yussefDayes',
    name: 'Yussef Dayes',
    color: '#38bdf8',
    tagline: 'UK jazz modal trio, floating time, drum-first composition, spiritual groove',
    harmonicDNA: [
      'Dorian and Phrygian as emotional centers — modal, not functional harmonic movement',
      'Rhodes/electric piano as harmonic texture, not chord machine — sparse, evocative',
      'Pentatonic minor as primary melodic language, with chromatic passing tones',
      'North African scale colors: augmented 2nds (b2–3, b6–7) create Middle Eastern tension',
    ],
    rhythmicDNA: [
      'Floating, behind-the-beat feel — the groove breathes rather than locks',
      'Drum kit as compositional anchor: the rhythm section writes from percussion outward',
      'Polyrhythmic cross-rhythms between kick and hi-hat (e.g., 3 against 4 feel inside 4/4)',
      'Sudden metric shifts: groove accelerates or doubles mid-phrase without warning',
    ],
    keyTechniques: [
      'Record the drum groove FIRST — let it dictate the tempo feel and phrase lengths',
      'Build bass around a pedal point, then slowly move it once every 4–8 bars',
      'Rhodes comping: play 2–3 note voicings only on strong rhythmic hits, leave silence',
      'Melody as rhythmic event — 4-note theme repeated with micro-variations in timing',
      'Use the b2 (flat 9) as a sustained color tone for Middle Eastern/Phrygian texture',
      'Let the track breathe: a 2-minute track can have 1 minute of just drums + bass',
    ],
    scalePreferences: ['dorian', 'phrygian', 'minor pentatonic', 'phrygian dominant', 'blues scale'],
    exampleApproach: 'Set a 92–108 BPM groove and record drums with a floating, slightly behind-the-beat 16th feel. Add a bass pedal on D for 8 bars. Drop a Rhodes voicing (D minor 9, no 3rd) on beat 2 of every 2nd bar. Sing or play a 4-note phrase starting on the b7 (C). Loop it all for 4 minutes, varying only the Rhodes comping rhythm.',
  },
];

export const UST_FOR_DOMINANT: UST[] = [
  { label: 'II major triad', triadRoot: '2M', triadType: 'M', resultingColor: '9 (#11)', tensionsAdded: ['9', '#11'], character: 'Lydian dominant — bright, open, floating' },
  { label: 'bII major triad', triadRoot: '2m', triadType: 'M', resultingColor: 'b9 (#11)', tensionsAdded: ['b9', '#11'], character: 'Very altered — dark and crunchy' },
  { label: 'bVI major triad', triadRoot: '6m', triadType: 'M', resultingColor: 'b9 b13 (Altered)', tensionsAdded: ['b9', 'b13'], character: 'Classic altered dominant — deep jazz tension' },
  { label: 'bVII major triad', triadRoot: '7m', triadType: 'M', resultingColor: '9sus (no 3rd)', tensionsAdded: ['9', '4'], character: 'Suspended, ambiguous — no major/minor quality' },
  { label: 'III major triad', triadRoot: '3M', triadType: 'M', resultingColor: '#5 (#9)', tensionsAdded: ['#5', '#9'], character: 'Augmented dominant — very tense, chromatic' },
  { label: 'bIII minor triad', triadRoot: '3m', triadType: 'm', resultingColor: 'b9 b13', tensionsAdded: ['b9', 'b13'], character: 'Phrygian dominant — Spanish/flamenco tension' },
];

export const PENTA_SUPERIMPOSITIONS: PentaSuper[] = [
  { label: 'Root pentatonic', intervalFromRoot: '1P', scaleType: 'minor pentatonic', character: 'Safe, inside, direct', tonesHighlighted: ['root', 'b3', '4', '5', 'b7'] },
  { label: 'II pentatonic (Dorian trick)', intervalFromRoot: '2M', scaleType: 'minor pentatonic', character: 'Adds the major 6th — the Dorian characteristic tone. Signature Jacob Collier / Snarky Puppy', tonesHighlighted: ['9', '4', '6', 'b7', 'root'] },
  { label: 'IV pentatonic', intervalFromRoot: '4P', scaleType: 'minor pentatonic', character: 'Close and modal — adds the 4th strongly', tonesHighlighted: ['4', 'b6', 'b7', 'root', '9'] },
  { label: 'bVII pentatonic (tritone trick)', intervalFromRoot: '7m', scaleType: 'major pentatonic', character: 'Outside — creates bitonal tension. Very Collier.', tonesHighlighted: ['b7', 'root', '9', '#4/b5', '6'] },
  { label: 'bII pentatonic (super-outside)', intervalFromRoot: '2m', scaleType: 'major pentatonic', character: 'Maximum outside — pure chromaticism, use sparingly', tonesHighlighted: ['b9', '#9', 'b5', 'b6', 'b7'] },
];

import { Chord, Note } from 'tonal';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScaleInfo {
  name: string;
  intervals: number[];
  chordTones: number[];
  goodExtensions: number[];
  avoidNotes: number[];
  description: string;
  extensionLabel: string;
  trickSemitones?: number;
  trickScaleName?: string;
  trickInterval?: string;
  characteristicNote?: string;
  modalContext?: boolean;
}

export type ChordFamily = 'major' | 'minor' | 'dominant' | 'altered' | 'sus' | 'dim';

export const FAMILY_LABELS: Record<ChordFamily, string> = {
  major: 'Major',
  minor: 'Minor',
  dominant: 'Dominant',
  altered: 'Altered dominant',
  sus: 'Suspended',
  dim: 'Diminished / augmented',
};

export interface ChordScaleEntry {
  quality: string;
  label: string;
  family: ChordFamily;
  /** Extra tonal chord aliases that should resolve to this entry */
  aliases?: string[];
  /** Short note shown under the chord name (e.g. how an extended chord relates to its base) */
  summary?: string;
  chordTones: number[];
  primary: ScaleInfo;
  alternatives: ScaleInfo[];
}

// ─── Scale Intervals ────────────────────────────────────────────────────────

export const SCALES: Record<string, { name: string; intervals: number[] }> = {
  lydian:          { name: 'Lydian',               intervals: [0, 2, 4, 6, 7, 9, 11] },
  ionian:          { name: 'Ionian (Major)',        intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian:          { name: 'Dorian',               intervals: [0, 2, 3, 5, 7, 9, 10] },
  dorianb2:        { name: 'Dorian ♭2',            intervals: [0, 1, 3, 5, 7, 9, 10] },
  aeolian:         { name: 'Aeolian (Nat. Minor)',  intervals: [0, 2, 3, 5, 7, 8, 10] },
  phrygian:        { name: 'Phrygian',              intervals: [0, 1, 3, 5, 7, 8, 10] },
  mixolydian:      { name: 'Mixolydian',            intervals: [0, 2, 4, 5, 7, 9, 10] },
  mixolydianb6:    { name: 'Mixolydian ♭6',        intervals: [0, 2, 4, 5, 7, 8, 10] },
  lydianDom:       { name: 'Lydian Dominant',       intervals: [0, 2, 4, 6, 7, 9, 10] },
  lydianAug:       { name: 'Lydian Augmented',      intervals: [0, 2, 4, 6, 8, 9, 11] },
  phrygianDom:     { name: 'Phrygian Dominant',     intervals: [0, 1, 4, 5, 7, 8, 10] },
  altered:         { name: 'Altered (Super Locrian)', intervals: [0, 1, 3, 4, 6, 8, 10] },
  wholeTone:       { name: 'Whole Tone',            intervals: [0, 2, 4, 6, 8, 10] },
  hwDim:           { name: 'Half-Whole Diminished', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  whDim:           { name: 'Whole-Half Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  locrianSharp2:   { name: 'Locrian ♯2',           intervals: [0, 2, 3, 5, 6, 8, 10] },
  locrian:         { name: 'Locrian',               intervals: [0, 1, 3, 5, 6, 8, 10] },
  melodicMinor:    { name: 'Melodic Minor',         intervals: [0, 2, 3, 5, 7, 9, 11] },
  harmonicMinor:   { name: 'Harmonic Minor',        intervals: [0, 2, 3, 5, 7, 8, 11] },
  ionianSharp5:    { name: 'Ionian ♯5',             intervals: [0, 2, 4, 5, 8, 9, 11] },
  // ── Pentatonics & Blues ───────────────────────────────────────────────────
  minorPenta:      { name: 'Minor Pentatonic',       intervals: [0, 3, 5, 7, 10] },
  majorPenta:      { name: 'Major Pentatonic',       intervals: [0, 2, 4, 7, 9] },
  blues:           { name: 'Blues Scale',            intervals: [0, 3, 5, 6, 7, 10] },
};

// ─── Chord–Scale Data ───────────────────────────────────────────────────────

const BASE_ENTRIES: ChordScaleEntry[] = [
  // ── Maj7 ────────────────────────────────────────────────────────────────
  {
    quality: 'maj7',
    label: 'Major 7th',
    family: 'major',
    chordTones: [0, 4, 7, 11],
    primary: {
      name: SCALES.lydian.name,
      intervals: SCALES.lydian.intervals,
      chordTones: [0, 4, 7, 11],
      goodExtensions: [2, 6, 9],
      avoidNotes: [],
      description: 'The gold standard for maj7 in jazz. The ♯11 adds brightness without creating tension against the chord. The natural 4th (11) is avoided because it clashes with the major 3rd.',
      extensionLabel: 'Extensions: 9, ♯11, 13',
      trickSemitones: 7,
      trickScaleName: 'Major',
      trickInterval: 'P5 above',
      characteristicNote: '♯4 — the Lydian signature',
      modalContext: true,
    },
    alternatives: [
      {
        name: SCALES.ionian.name,
        intervals: SCALES.ionian.intervals,
        chordTones: [0, 4, 7, 11],
        goodExtensions: [2, 9],
        avoidNotes: [5],
        description: 'The diatonic choice — natural major scale. Works well in tonal contexts. Watch out for the P4 (11th), which clashes with the major 3rd and should be treated as an avoid note.',
        extensionLabel: 'Extensions: 9, 13 (avoid 11)',
      },
      {
        name: SCALES.lydianAug.name,
        intervals: SCALES.lydianAug.intervals,
        chordTones: [0, 4, 11],
        goodExtensions: [2, 6, 8, 9],
        avoidNotes: [],
        description: 'Melodic Minor mode 3 — replaces the P5 with a ♯5, creating a dreamy, floating quality. Best on maj7♯5 chords. The ♯11 and ♯5 together give a lush, cinematic sound (think Ennio Morricone, Wayne Shorter).',
        extensionLabel: 'Extensions: 9, ♯11, ♯5, 13',
        trickSemitones: 9,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'maj. 6th above',
      },
      {
        name: SCALES.majorPenta.name,
        intervals: SCALES.majorPenta.intervals,
        chordTones: [0, 4, 7],
        goodExtensions: [2, 9],
        avoidNotes: [],
        description: 'Root major pentatonic: R, 9, 3, 5, 13 — a clean, vocal-friendly palette with zero avoid notes. The △7 is absent, which lets the chord\'s major seventh ring clearly underneath without scale-tone conflict. Great for a bright, singable approach (Wes Montgomery, George Benson, bossa nova).',
        extensionLabel: 'Chord tones: R, 3, 5 · ext: 9, 13',
        trickSemitones: 0,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'same root',
      },
      {
        name: 'Major Pentatonic (II)',
        intervals: [2, 4, 6, 9, 11],
        chordTones: [4, 11],
        goodExtensions: [2, 6, 9],
        avoidNotes: [],
        description: 'II major pentatonic superimposition (e.g., D major penta over Cmaj7): gives 9, 3, ♯11, 13, and △7 — the entire Lydian extension set compressed into 5 notes. The ♯11 is the signature Lydian "floating" tone that makes this unmistakably modern. A signature device of Jacob Collier and Brad Mehldau.',
        extensionLabel: 'Extensions: 9, ♯11, 13, △7 (Lydian palette)',
        trickSemitones: 2,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'M2 above (= II)',
      },
    ],
  },

  // ── m7 ──────────────────────────────────────────────────────────────────
  {
    quality: 'm7',
    label: 'Minor 7th',
    family: 'minor',
    chordTones: [0, 3, 7, 10],
    primary: {
      name: SCALES.dorian.name,
      intervals: SCALES.dorian.intervals,
      chordTones: [0, 3, 7, 10],
      goodExtensions: [2, 9],
      avoidNotes: [],
      description: 'The default jazz choice for m7. The natural 6th (13) is the signature Dorian sound — warm and open, characteristic of jazz-funk (think Miles Davis "So What", Snarky Puppy).',
      extensionLabel: 'Extensions: 9, 11, 13',
      trickSemitones: 10,
      trickScaleName: 'Major',
      trickInterval: 'min. 7th above (= M2 below)',
      characteristicNote: 'nat. 6 — the Dorian signature',
      modalContext: true,
    },
    alternatives: [
      {
        name: SCALES.aeolian.name,
        intervals: SCALES.aeolian.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [2],
        avoidNotes: [8],
        description: 'Natural minor — preferred in rock, pop, and classical contexts. The b6 creates more darkness compared to Dorian. Strong for melodic minor contexts and for tonal cadences.',
        extensionLabel: 'Extensions: 9, 11 (b13 is colouristic)',
        characteristicNote: '♭6 — Aeolian colour; avoid note in tonal cadences',
      },
      {
        name: SCALES.dorianb2.name,
        intervals: SCALES.dorianb2.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5, 9],
        avoidNotes: [1],
        description: 'Melodic Minor mode 2 — Dorian with a b2. Keeps the warm natural 6th but adds a half-step tension at the b2. Sophisticated and modern, used in contemporary jazz (Jacob Collier, Brad Mehldau). The b2 is an avoid note on long durations.',
        extensionLabel: 'Extensions: 11, 13 (b2 is colour)',
        trickSemitones: 10,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 7th above',
      },
      {
        name: SCALES.phrygian.name,
        intervals: SCALES.phrygian.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5],
        avoidNotes: [1, 8],
        description: 'The darkest diatonic minor mode. The ♭2 and ♭6 are both harmonic avoid notes in tonal contexts — use them as chromatic approach tones. Great for film scoring, metal, Middle-Eastern contexts. In a modal Phrygian context, ♭2 is the characteristic note and can be freely voiced.',
        extensionLabel: 'Extensions: T11 · avoid: S♭2, S♭6',
        trickSemitones: 8,
        trickScaleName: 'Major',
        trickInterval: 'min. 6th above',
        characteristicNote: '♭2 — defines Phrygian; freely voice in modal context',
        modalContext: true,
      },
      {
        name: SCALES.minorPenta.name,
        intervals: SCALES.minorPenta.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5],
        avoidNotes: [],
        description: 'Root minor pentatonic: the most direct, blues-adjacent choice on m7. Covers R, ♭3, 11, 5, and ♭7 — all chord tones except the ♭7 is partly missing (no ♭3 is wrong — ♭3 IS in the chord). Zero avoid notes, very safe. The 11 (P4) is not an avoid on m7, unlike on dominant chords.',
        extensionLabel: 'Chord tones: R, ♭3, 5, ♭7 · ext: 11',
        trickSemitones: 0,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'same root',
      },
      {
        name: 'Minor Pentatonic (II) — Dorian trick',
        intervals: [0, 2, 5, 7, 9],
        chordTones: [0, 7],
        goodExtensions: [2, 5, 9],
        avoidNotes: [],
        description: 'II minor pentatonic superimposition (e.g., D minor penta over Cm7): gives R, 9, 11, 5, and 13 — the same notes as F major pentatonic. The natural 13th (major 6th) is Dorian\'s signature tone, making this the pentatonic equivalent of playing Dorian. Used heavily in jazz-funk (Snarky Puppy, Lettuce, Miles Davis "So What").',
        extensionLabel: 'Extensions: 9, 11, 13 (Dorian colour)',
        trickSemitones: 2,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'M2 above (= II)',
      },
      {
        name: SCALES.blues.name,
        intervals: SCALES.blues.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [6],
        avoidNotes: [],
        description: 'The minor blues scale adds the ♭5 chromatic passing note to the minor pentatonic. The ♭5 (♯11/♭13 area) creates a characteristic blues bend sound — use it as a passing tone between P4 and P5, never held. Adds raw, expressive energy to jazz-funk, soul, and rock contexts.',
        extensionLabel: 'Chord tones: R, ♭3, 5, ♭7 · passing: ♭5',
        trickSemitones: 0,
        trickScaleName: 'Blues Scale',
        trickInterval: 'same root',
      },
    ],
  },

  // ── dom7 ────────────────────────────────────────────────────────────────
  {
    quality: '7',
    label: 'Dominant 7th',
    family: 'dominant',
    chordTones: [0, 4, 7, 10],
    primary: {
      name: SCALES.lydianDom.name,
      intervals: SCALES.lydianDom.intervals,
      chordTones: [0, 4, 7, 10],
      goodExtensions: [2, 6, 9],
      avoidNotes: [],
      description: 'Melodic Minor mode 4 — combines the dominant b7 with the Lydian ♯11. Sophisticated tension without the harshness of Altered. The go-to modern jazz dominant sound (think Herbie Hancock, Snarky Puppy). Use on subV7 (tritone sub) — no avoid notes, resolves by half step.',
      extensionLabel: 'Extensions: 9, ♯11, 13',
      trickSemitones: 7,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'P5 above',
      characteristicNote: '♯11 — subV7 & Lydian ♭7 territory; no avoid notes',
    },
    alternatives: [
      {
        name: SCALES.mixolydian.name,
        intervals: SCALES.mixolydian.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [2, 9],
        avoidNotes: [5],
        description: 'The most direct dominant scale — natural major with a b7. Functional and clear. Avoid the 11th (P4) which clashes with the major 3rd. Ideal for V7 resolving to a major tonic (diatonic dominant).',
        extensionLabel: 'Extensions: 9, 13 (avoid 11)',
        trickSemitones: 5,
        trickScaleName: 'Major',
        trickInterval: 'P4 above (= key tonic)',
        characteristicNote: '♭7 — diatonic dominant; V7 → major tonic',
      },
      {
        name: SCALES.mixolydianb6.name,
        intervals: SCALES.mixolydianb6.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [2, 8],
        avoidNotes: [5],
        description: 'Melodic Minor mode 5 — Mixolydian with a b13. The b6 creates a darker dominant sound that resolves naturally to a minor tonic. Use on V7 resolving to a minor tonic (Berklee: Mixolydian ♭9 ♭13).',
        extensionLabel: 'Extensions: 9, b13 (avoid 11)',
        trickSemitones: 5,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'P4 above',
        characteristicNote: '♭13 — V7 → minor tonic; Mixolydian ♭9 ♭13',
      },
      {
        name: SCALES.phrygianDom.name,
        intervals: SCALES.phrygianDom.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [1, 5, 8],
        avoidNotes: [],
        description: 'Harmonic Minor mode 5 — the "Spanish Dominant." The b2/b9 is the defining colour, creating a flamenco or Middle-Eastern tension. Common in Spanish music, metal, and film scoring when resolving to minor.',
        extensionLabel: 'Extensions: b9, 11, b13',
        trickSemitones: 5,
        trickScaleName: 'Harmonic Minor',
        trickInterval: 'P4 above (= key tonic)',
      },
      {
        name: SCALES.majorPenta.name,
        intervals: SCALES.majorPenta.intervals,
        chordTones: [0, 4, 7],
        goodExtensions: [2, 9],
        avoidNotes: [],
        description: 'Root major pentatonic over a dominant: R, 9, 3, 5, 13 — clean and tension-free, but missing the ♭7. Best in non-resolving dominant contexts (modal, static dominants) where you want color without tension. The 13 adds warmth. Widely used in gospel, country, and soul playing.',
        extensionLabel: 'Extensions: 9, 13 (no ♭7 — static dominant)',
        trickSemitones: 0,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'same root',
      },
      {
        name: SCALES.minorPenta.name,
        intervals: SCALES.minorPenta.intervals,
        chordTones: [0, 7, 10],
        goodExtensions: [3],
        avoidNotes: [],
        description: 'Root minor pentatonic over dominant: adds the ♯9 (♭3) — the "blue note" of the blues. Creates a classic blues-dominant sound, essentially treating the dominant chord as a blues tonic. The ♭5 approach (from blues scale) is the traditional blues bend. BB King, SRV, most blues playing.',
        extensionLabel: 'Extensions: ♯9, ♭7 · blues colour (avoid 11 on long notes)',
        trickSemitones: 0,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'same root',
      },
      {
        name: SCALES.blues.name,
        intervals: SCALES.blues.intervals,
        chordTones: [0, 7, 10],
        goodExtensions: [3, 6],
        avoidNotes: [],
        description: 'The blues scale is the quintessential dominant sound: R, ♯9, 11, ♭5, 5, ♭7. The ♭5 chromatic passing note between P4 and P5 is the defining blues gesture. Use the ♭5 as a smeared, bent, or slurred passing tone — never held. The entire foundation of blues-jazz from bebop onwards.',
        extensionLabel: 'R, ♯9, ♭7 · passing: ♭5',
        trickSemitones: 0,
        trickScaleName: 'Blues Scale',
        trickInterval: 'same root',
      },
    ],
  },

  // ── 7alt ────────────────────────────────────────────────────────────────
  {
    quality: '7alt',
    label: 'Dominant Alt.',
    family: 'altered',
    aliases: ['alt7', '7#5b9', '7b9#5', '7#9b13', '7#9#11b13', '7b9b13#11', '7b9#9', '7#5b9#11'],
    chordTones: [0, 4, 10],
    primary: {
      name: SCALES.altered.name,
      intervals: SCALES.altered.intervals,
      chordTones: [0, 4, 10],
      goodExtensions: [1, 3, 6, 8],
      avoidNotes: [],
      description: 'Altered offers b9, #9, b5/#11 and #5/b13 around the dominant 3rd and b7. Choose tensions that lead into the next chord; they need not all sound together. G7alt commonly resolves to C major or C minor. Natural 9, 5 and 13 require a different palette. This is mode 7 of melodic minor.',
      extensionLabel: 'Extensions: b9/♯9, ♯11, b13',
      trickSemitones: 1,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'min. 2nd above',
    },
    alternatives: [
      {
        name: SCALES.hwDim.name,
        intervals: SCALES.hwDim.intervals,
        chordTones: [0, 4, 10],
        goodExtensions: [1, 3, 6, 9],
        avoidNotes: [],
        description: 'The Half-Whole Diminished gives b9, ♯9, ♯11 AND includes the natural 5th and 13. Less fully altered than the Altered scale — a good middle ground between tension and stability.',
        extensionLabel: 'Extensions: b9, ♯9, ♯11, 13',
      },
      {
        name: SCALES.wholeTone.name,
        intervals: SCALES.wholeTone.intervals,
        chordTones: [0, 4, 10],
        goodExtensions: [2, 6, 8],
        avoidNotes: [],
        description: 'Fully symmetrical — every note is a whole step apart. Creates a dreamy, unresolved dominant sound with natural 9, ♯11, b13 but NO b9 or ♯9. Debussy-esque, ethereal. Debussy used it to avoid the clichés of functional harmony.',
        extensionLabel: 'Extensions: 9, ♯11, b13 (no b9/♯9)',
      },
      {
        name: '♯9 Minor Pentatonic (bIII)',
        intervals: [1, 3, 6, 8, 10],
        chordTones: [10],
        goodExtensions: [1, 3, 6, 8],
        avoidNotes: [],
        description: 'The ♯9 minor pentatonic superimposition (e.g., Eb minor penta over C7alt): gives ♭9, ♯9, ♯11, ♭13, and ♭7 — every single altered tension in just 5 notes, with no natural avoid notes. This is the most efficient altered pentatonic choice. The ♭3 of the penta = ♯9 of the chord. A staple of Herbie Hancock, McCoy Tyner, and modern jazz guitarists.',
        extensionLabel: '♭9, ♯9, ♯11, ♭13, ♭7 (full altered palette)',
        trickSemitones: 3,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'min. 3rd above (= ♯9)',
      },
    ],
  },

  // ── m7b5 ────────────────────────────────────────────────────────────────
  {
    quality: 'm7b5',
    label: 'Min. 7♭5 (ø)',
    family: 'dim',
    chordTones: [0, 3, 6, 10],
    primary: {
      name: SCALES.locrianSharp2.name,
      intervals: SCALES.locrianSharp2.intervals,
      chordTones: [0, 3, 6, 10],
      goodExtensions: [2, 5],
      avoidNotes: [],
      description: 'Melodic Minor mode 6 — adds a natural 9th instead of the b9 found in standard Locrian. Much softer and more jazzistic, ideal for minor ii–V–i progressions. The natural 9th is the key difference.',
      extensionLabel: 'Extensions: 9 (natural), 11',
      characteristicNote: 'nat. 9 — distinguishes from Locrian; jazzistic choice',
      trickSemitones: 3,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'min. 3rd above',
    },
    alternatives: [
      {
        name: SCALES.locrian.name,
        intervals: SCALES.locrian.intervals,
        chordTones: [0, 3, 6, 10],
        goodExtensions: [5, 8],
        avoidNotes: [1],
        description: 'Classic Locrian — includes the b9, making it more dissonant. The ♭9 and ♭13 are tense colour notes rather than stable extensions. Harsher sound, reserved for very tense passages or chromatic approach.',
        extensionLabel: 'Extensions: T11, T♭13 · avoid: S♭2',
      },
      {
        name: 'Locrian Natural 6',
        intervals: [0, 1, 3, 5, 6, 9, 10],
        chordTones: [0, 3, 6, 10],
        goodExtensions: [5, 9],
        avoidNotes: [1],
        description: 'Mode 2 of harmonic minor. D Locrian natural 6 over Dm7b5 preserves the notes of C harmonic minor before G7b9 resolves to Cm. The natural 13 is optional colour; the b9 needs careful placement. This is a contextual alternative, not a universal replacement for Locrian.',
        extensionLabel: 'Extensions: 11, 13; contextual tension: b9',
      },
      {
        name: '♭III Minor Pentatonic',
        intervals: [1, 3, 6, 8, 10],
        chordTones: [3, 6, 10],
        goodExtensions: [1, 8],
        avoidNotes: [],
        description: 'bIII minor pentatonic (e.g., Eb minor penta over Cm7♭5): covers ♭3, ♭5, and ♭7 — three of the four chord tones — plus adds ♭9 and ♭13 for tension. The missing root is supplied by the chord itself. Creates a dense, dark colour that suits minor ii–V–i progressions perfectly. Related to the Altered scale from which it is a subset.',
        extensionLabel: 'Chord tones: ♭3, ♭5, ♭7 · tension: ♭9, ♭13',
        trickSemitones: 3,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'min. 3rd above (= bIII)',
      },
    ],
  },

  // ── dim7 ────────────────────────────────────────────────────────────────
  {
    quality: 'dim7',
    label: 'Diminished 7th',
    family: 'dim',
    chordTones: [0, 3, 6, 9],
    primary: {
      name: SCALES.whDim.name,
      intervals: SCALES.whDim.intervals,
      chordTones: [0, 3, 6, 9],
      goodExtensions: [2, 5, 8, 11],
      avoidNotes: [],
      description: 'Whole-half diminished alternates chord tones with notes a whole step above them. The chord is 1, b3, b5, bb7 (C, Eb, Gb, Bbb for Cdim7). Use the destination and melody to choose passing tones; a symmetric collection is not mandatory for every functional diminished chord.',
      extensionLabel: 'Colour tones: 9, 11, b13, maj7',
    },
    alternatives: [
      {
        name: 'Ultralocrian (Harmonic Minor Mode 7)',
        intervals: [0, 1, 3, 4, 6, 8, 9],
        chordTones: [0, 3, 6, 9],
        goodExtensions: [4, 8],
        avoidNotes: [],
        description: 'A functional option for a leading-tone dim7 resolving up a semitone to minor: Bdim7 to Cm uses C harmonic minor, heard from B. It includes all four diminished chord tones. Do not apply this destination-specific choice automatically to common-tone diminished chords.',
        extensionLabel: 'Context: leading-tone dim7 into minor',
      },
    ],
  },

  // ── mMaj7 ───────────────────────────────────────────────────────────────
  {
    quality: 'mMaj7',
    label: 'Min. Maj7',
    family: 'minor',
    chordTones: [0, 3, 7, 11],
    primary: {
      name: SCALES.melodicMinor.name,
      intervals: SCALES.melodicMinor.intervals,
      chordTones: [0, 3, 7, 11],
      goodExtensions: [2, 9],
      avoidNotes: [],
      description: 'The natural home of the mMaj7 chord — melodic minor in its jazz ascending form. Cinematic and mysterious, characteristic of Ennio Morricone, Wayne Shorter, and Jacob Collier. Every note is a good note.',
      extensionLabel: 'Extensions: 9, 11, 13',
      trickSemitones: 0,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'same root',
    },
    alternatives: [
      {
        name: SCALES.harmonicMinor.name,
        intervals: SCALES.harmonicMinor.intervals,
        chordTones: [0, 3, 7, 11],
        goodExtensions: [2],
        avoidNotes: [8],
        description: 'Harmonic Minor adds a b6, creating a more dramatic and classical tension. The augmented 2nd (between b6 and maj7) gives a characteristic Eastern European or classical flavour. Associated with Romantic-era composition and flamenco.',
        extensionLabel: 'Extensions: 9, 11 (b13 is colouristic)',
      },
    ],
  },

  // ── 7sus4 ───────────────────────────────────────────────────────────────
  {
    quality: '7sus4',
    label: 'Dominant Sus4',
    family: 'sus',
    chordTones: [0, 5, 7, 10],
    primary: {
      name: SCALES.mixolydian.name,
      intervals: SCALES.mixolydian.intervals,
      chordTones: [0, 5, 7, 10],
      goodExtensions: [2, 9],
      avoidNotes: [],
      description: 'Mixolydian is the ideal scale for sus4: the P4 is now a chord tone, not an avoid note. The natural 3rd (degree 3) acts as a "resolution tone" implying the upcoming suspension release. The 9 and 13 add smooth colour. Think Herbie Hancock "Maiden Voyage," Chick Corea, neo-soul.',
      extensionLabel: 'Extensions: 9, (3 — resolution tone), 13',
      trickSemitones: 5,
      trickScaleName: 'Major',
      trickInterval: 'P4 above (= key tonic)',
    },
    alternatives: [
      {
        name: SCALES.dorian.name,
        intervals: SCALES.dorian.intervals,
        chordTones: [0, 5, 7, 10],
        goodExtensions: [2, 9],
        avoidNotes: [],
        description: 'Dorian from the sus root adds a ♭3 as a bluesy colour against the 4th, so the sus chord is heard as an open minor 11 (C7sus4 ≈ Cm11 with no 3rd in the voicing). Smooth and floating — standard in jazz-funk and fusion. Note: G7sus4 = Dm7/G, but D Dorian over that chord equals G Mixolydian, not G Dorian.',
        extensionLabel: 'Extensions: 9, ♭3 (colour), 11, 13',
        trickSemitones: 10,
        trickScaleName: 'Major',
        trickInterval: 'min. 7th above (= M2 below)',
      },
      {
        name: '♭VII Major Pentatonic',
        intervals: [0, 2, 5, 7, 10],
        chordTones: [0, 5, 7, 10],
        goodExtensions: [2],
        avoidNotes: [],
        description: 'bVII major pentatonic superimposition (e.g., Bb major penta over C7sus4): gives ♭7, R, 9, 4, and 5 — all four chord tones covered, with only the 9 as an added extension. Zero avoid notes, ultra-smooth. The quintessential sus-chord pentatonic of gospel, neo-soul, and Stevie Wonder.',
        extensionLabel: 'All chord tones: R, 4, 5, ♭7 · ext: 9',
        trickSemitones: 10,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'min. 7th above (= ♭VII)',
      },
      {
        name: SCALES.dorianb2.name,
        intervals: SCALES.dorianb2.intervals,
        chordTones: [0, 5, 7, 10],
        goodExtensions: [5, 9],
        avoidNotes: [1],
        description: 'Dorian ♭2 (Melodic Minor mode 2) on a sus chord: adds a half-step tension at the ♭9, giving the suspension an exotic, Eastern quality. Used in contemporary jazz for sus chords with a darker colour. The ♭9 should be treated as a passing/approach note, not sustained.',
        extensionLabel: 'Extensions: 11, 13 (♭9 as approach)',
        trickSemitones: 10,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 7th above',
      },
    ],
  },

  // ── maj6 ────────────────────────────────────────────────────────────────
  {
    quality: 'maj6',
    label: 'Major 6th',
    family: 'major',
    aliases: ['6'],
    chordTones: [0, 4, 7, 9],
    primary: {
      name: SCALES.majorPenta.name,
      intervals: SCALES.majorPenta.intervals,
      chordTones: [0, 4, 7, 9],
      goodExtensions: [2],
      avoidNotes: [],
      description: 'The major pentatonic is the perfect scale for a major 6th chord — it contains R, 9, 3, 5, and 6, covering all four chord tones and adding only the sweet 9th. No avoid notes, no tension. The quintessential bossa nova, jazz guitar, and smooth jazz scale. Think Jobim, George Benson, Wes Montgomery.',
      extensionLabel: 'All chord tones: R, 3, 5, 6 · ext: 9',
      trickSemitones: 0,
      trickScaleName: 'Major Pentatonic',
      trickInterval: 'same root',
    },
    alternatives: [
      {
        name: SCALES.lydian.name,
        intervals: SCALES.lydian.intervals,
        chordTones: [0, 4, 7, 9],
        goodExtensions: [2, 6, 11],
        avoidNotes: [],
        description: 'Lydian on a major 6th chord: the ♯11 brightens the sound and avoids the P4/major-3rd clash. The △7 from Lydian sits on top of the 6, creating a lush Lydian colour. Great for jazz reharmonization, film scoring, and whenever the 6th chord needs lift and openness.',
        extensionLabel: 'Extensions: 9, ♯11, 13, △7',
        trickSemitones: 7,
        trickScaleName: 'Major',
        trickInterval: 'P5 above',
      },
      {
        name: SCALES.ionian.name,
        intervals: SCALES.ionian.intervals,
        chordTones: [0, 4, 7, 9],
        goodExtensions: [2, 11],
        avoidNotes: [5],
        description: 'Standard major scale — the diatonic choice. The P4 (11th) clashes slightly with the major 3rd; treat it as a passing note. The △7 adds a Cmaj7 implication on top of the 6th, which can be used intentionally. Best in tonal, diatonic contexts where the maj6 is a passing chord.',
        extensionLabel: 'Extensions: 9, △7 (avoid 11)',
      },
      {
        name: 'Major Pentatonic (II)',
        intervals: [2, 4, 6, 9, 11],
        chordTones: [4, 9],
        goodExtensions: [2, 6, 11],
        avoidNotes: [],
        description: 'II major pentatonic over a major 6th chord (e.g., D major penta over C6): gives 9, 3, ♯11, 13, and △7 — the Lydian extension palette. The ♯11 elevates the sound into Lydian territory. Best when the maj6 chord functions as a tonic substitution or needs a floating, open quality.',
        extensionLabel: 'Extensions: 9, ♯11, 13, △7 (Lydian)',
        trickSemitones: 2,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'M2 above (= II)',
      },
    ],
  },

  // ── m6 ──────────────────────────────────────────────────────────────────
  {
    quality: 'm6',
    label: 'Minor 6th',
    family: 'minor',
    chordTones: [0, 3, 7, 9],
    primary: {
      name: SCALES.dorian.name,
      intervals: SCALES.dorian.intervals,
      chordTones: [0, 3, 7, 9],
      goodExtensions: [2, 5],
      avoidNotes: [],
      description: 'Dorian is the natural home of the minor 6th chord — the major 6th (13th) is Dorian\'s defining characteristic tone. A staple of jazz-funk, bossa nova, and neo-soul. "Autumn Leaves" (Cm6), Jobim\'s minor bossa, Nile Rodgers guitar parts. The chord-scale relationship is perfect: no avoid notes, full coverage.',
      extensionLabel: 'Chord tones: R, ♭3, 5, 13 · ext: 9, 11',
      trickSemitones: 10,
      trickScaleName: 'Major',
      trickInterval: 'min. 7th above (= M2 below)',
    },
    alternatives: [
      {
        name: SCALES.melodicMinor.name,
        intervals: SCALES.melodicMinor.intervals,
        chordTones: [0, 3, 7, 9],
        goodExtensions: [2, 5, 11],
        avoidNotes: [],
        description: 'Melodic Minor ascending adds the major 7th alongside the natural 6th, creating a mMaj7 colour layered on the m6 structure. The combination of ♭3, ♮6, and △7 is exotic and cinematic — characteristic of Wayne Shorter, Ennio Morricone, and tango music. A more sophisticated, mysterious alternative.',
        extensionLabel: 'Extensions: 9, 11, △7 (adds mMaj7 colour)',
        trickSemitones: 0,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'same root',
      },
      {
        name: 'Minor Pentatonic (II) — Dorian trick',
        intervals: [0, 2, 5, 7, 9],
        chordTones: [0, 7, 9],
        goodExtensions: [2, 5],
        avoidNotes: [],
        description: 'II minor pentatonic (e.g., D minor penta over Cm6): R, 9, 11, 5, 13 — highlights the major 6th (the chord tone of m6) without needing the full Dorian scale. Lean, melodic, and highly singable. The 13th (the chord\'s defining tone) lands naturally as the pentatonic\'s top note. Perfect for guitar-based m6 improvisation.',
        extensionLabel: 'Chord tones: R, 5, 13 · ext: 9, 11',
        trickSemitones: 2,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'M2 above (= II)',
      },
    ],
  },
];


function fromScale(key: keyof typeof SCALES, info: Omit<ScaleInfo, 'name' | 'intervals'>): ScaleInfo {
  return { name: SCALES[key].name, intervals: SCALES[key].intervals, ...info };
}

// ─── Triads, altered dominants and other non-derived chords ─────────────────

const EXTRA_ENTRIES: ChordScaleEntry[] = [
  // ── Major triad ─────────────────────────────────────────────────────────
  {
    quality: 'maj',
    label: 'Major triad',
    family: 'major',
    summary: 'No 7th is specified, so the scale chooses it: △7 (Ionian, Lydian) or ♭7 (Mixolydian).',
    chordTones: [0, 4, 7],
    primary: fromScale('ionian', {
      chordTones: [0, 4, 7],
      goodExtensions: [2, 9, 11],
      avoidNotes: [5],
      description: 'The diatonic default for a I chord. The △7 is a safe colour; the 4th sits a half step above the 3rd and is the usual avoid note on long values.',
      extensionLabel: 'Extensions: 9, 13, △7 (avoid 11)',
      trickSemitones: 0,
      trickScaleName: 'Major',
      trickInterval: 'same root',
    }),
    alternatives: [
      fromScale('majorPenta', {
        chordTones: [0, 4, 7],
        goodExtensions: [2, 9],
        avoidNotes: [],
        description: 'R, 9, 3, 5, 6 — no 4th and no 7th, so nothing can clash. The safest melodic choice on a major triad: pop, country, gospel, soul.',
        extensionLabel: 'Chord tones: R, 3, 5 · ext: 9, 6',
        trickSemitones: 0,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'same root',
      }),
      fromScale('lydian', {
        chordTones: [0, 4, 7],
        goodExtensions: [2, 6, 9, 11],
        avoidNotes: [],
        description: 'On a IV chord or a static major triad, Lydian removes the 4th clash: the ♯11 brightens without pulling toward resolution. Film-score and modal-pop colour.',
        extensionLabel: 'Extensions: 9, ♯11, 13, △7',
        trickSemitones: 7,
        trickScaleName: 'Major',
        trickInterval: 'P5 above',
        characteristicNote: '♯4 — the Lydian signature',
      }),
      fromScale('mixolydian', {
        chordTones: [0, 4, 7],
        goodExtensions: [2, 9, 10],
        avoidNotes: [5],
        description: 'On a V chord, or in rock and blues where a major triad carries a ♭7 colour (the ♭VII sound). Implies a dominant without stating it.',
        extensionLabel: 'Extensions: 9, 13, ♭7 (avoid 11)',
        trickSemitones: 5,
        trickScaleName: 'Major',
        trickInterval: 'P4 above (= key tonic)',
      }),
    ],
  },

  // ── maj7♯5 ──────────────────────────────────────────────────────────────
  {
    quality: 'maj7#5',
    label: 'Major 7♯5',
    family: 'major',
    chordTones: [0, 4, 8, 11],
    primary: fromScale('lydianAug', {
      chordTones: [0, 4, 8, 11],
      goodExtensions: [2, 6, 9],
      avoidNotes: [],
      description: 'Melodic Minor mode 3 — the common mode that has a major 3rd, ♯5 and △7 together, so it is the native scale of maj7♯5. The ♯11 and ♯5 give the floating, unresolved colour of Wayne Shorter ballads and modern film harmony.',
      extensionLabel: 'Extensions: 9, ♯11, 13',
      trickSemitones: 9,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'maj. 6th above',
      characteristicNote: '♯5 — chord tone; no natural 5 in the scale',
    }),
    alternatives: [
      fromScale('ionianSharp5', {
        chordTones: [0, 4, 8, 11],
        goodExtensions: [2, 9],
        avoidNotes: [5],
        description: 'Harmonic Minor mode 3 — Lydian Augmented with a natural 4th. Darker and more classical: it is the III+ chord of harmonic minor (E♭maj7♯5 in C minor). Treat the 4th as an avoid note against the 3rd.',
        extensionLabel: 'Extensions: 9, 13 (avoid 11)',
        trickSemitones: 9,
        trickScaleName: 'Harmonic Minor',
        trickInterval: 'maj. 6th above',
      }),
      {
        name: 'Major Pentatonic (II)',
        intervals: [2, 4, 6, 9, 11],
        chordTones: [4, 11],
        goodExtensions: [2, 6, 9],
        avoidNotes: [],
        description: 'II major pentatonic (D major penta over Cmaj7♯5): 9, 3, ♯11, 13, △7 — no 5th of either kind, so it sits cleanly over the ♯5 and gives a simple, singable Lydian line.',
        extensionLabel: 'Extensions: 9, ♯11, 13, △7',
        trickSemitones: 2,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'M2 above (= II)',
      },
    ],
  },

  // ── Minor triad ─────────────────────────────────────────────────────────
  {
    quality: 'm',
    label: 'Minor triad',
    family: 'minor',
    summary: 'No 6th or 7th is specified: the scale decides between Dorian (♮6), Aeolian (♭6), Phrygian (♭2) or Melodic Minor (△7).',
    chordTones: [0, 3, 7],
    primary: fromScale('dorian', {
      chordTones: [0, 3, 7],
      goodExtensions: [2, 5, 9, 10],
      avoidNotes: [],
      description: 'The jazz and funk default when the 7th is not given: the natural 6th keeps the chord open and active. Use it on ii chords and minor vamps.',
      extensionLabel: 'Extensions: 9, 11, 13, ♭7',
      trickSemitones: 10,
      trickScaleName: 'Major',
      trickInterval: 'min. 7th above (= M2 below)',
      characteristicNote: 'nat. 6 — the Dorian signature',
      modalContext: true,
    }),
    alternatives: [
      fromScale('aeolian', {
        chordTones: [0, 3, 7],
        goodExtensions: [2, 5, 10],
        avoidNotes: [8],
        description: 'Natural minor — the default for a minor tonic (i, vi) in rock, pop and classical writing. The ♭6 darkens the chord; keep it out of sustained voicings.',
        extensionLabel: 'Extensions: 9, 11, ♭7 (♭13 is colouristic)',
        trickSemitones: 3,
        trickScaleName: 'Major',
        trickInterval: 'min. 3rd above (relative major)',
      }),
      fromScale('phrygian', {
        chordTones: [0, 3, 7],
        goodExtensions: [5, 10],
        avoidNotes: [1, 8],
        description: 'The darkest option and the diatonic scale of a iii chord. The ♭2 gives a Spanish / metal edge — in modal Phrygian it is the characteristic note.',
        extensionLabel: 'Extensions: 11, ♭7 · avoid: ♭2, ♭6',
        trickSemitones: 8,
        trickScaleName: 'Major',
        trickInterval: 'min. 6th above',
        characteristicNote: '♭2 — defines Phrygian; freely voice in modal context',
        modalContext: true,
      }),
      fromScale('melodicMinor', {
        chordTones: [0, 3, 7],
        goodExtensions: [2, 5, 9, 11],
        avoidNotes: [],
        description: 'Natural 6 and major 7 over a minor triad: the minor-tonic sound of jazz (the i of a minor ii–V–i) and of film noir. Implies m6 or mMaj7.',
        extensionLabel: 'Extensions: 9, 11, 13, △7',
        trickSemitones: 0,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'same root',
      }),
      fromScale('minorPenta', {
        chordTones: [0, 3, 7],
        goodExtensions: [5, 10],
        avoidNotes: [],
        description: 'R, ♭3, 4, 5, ♭7 — no 2nd and no 6th, so it fits every minor mode. The safe melodic choice when the mode is unclear.',
        extensionLabel: 'Chord tones: R, ♭3, 5 · ext: 11, ♭7',
        trickSemitones: 0,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'same root',
      }),
    ],
  },

  // ── 7♭13 ────────────────────────────────────────────────────────────────
  {
    quality: '7b13',
    label: 'Dominant 7♭13',
    family: 'dominant',
    chordTones: [0, 4, 8, 10],
    primary: fromScale('mixolydianb6', {
      chordTones: [0, 4, 8, 10],
      goodExtensions: [2],
      avoidNotes: [5],
      description: 'Melodic Minor mode 5 — the ♭13 is written into the chord and Mixolydian ♭6 keeps the natural 9. A typical V7 of a minor key in pop-jazz writing (G7♭13 → Cm) and a lyrical alternative to fully altered.',
      extensionLabel: 'Extensions: 9, ♭13 (avoid 11)',
      trickSemitones: 5,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'P4 above',
      characteristicNote: '♭13 — chord tone; the natural 9 keeps it lyrical',
    }),
    alternatives: [
      fromScale('wholeTone', {
        chordTones: [0, 4, 8, 10],
        goodExtensions: [2, 6],
        avoidNotes: [],
        description: 'Natural 9, ♯11 and the ♭13 heard as a ♯5. Dreamy and symmetric — use it when the ♭13 should sound like an augmented 5th rather than a melodic tension.',
        extensionLabel: 'Extensions: 9, ♯11',
      }),
      fromScale('altered', {
        chordTones: [0, 4, 8, 10],
        goodExtensions: [1, 3, 6],
        avoidNotes: [],
        description: 'Full tension: adds ♭9, ♯9 and ♯11 around the ♭13. Use it when the melody or the next chord wants more pull than Mixolydian ♭6 gives.',
        extensionLabel: 'Extensions: ♭9, ♯9, ♯11',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
    ],
  },

  // ── 7♭9 ─────────────────────────────────────────────────────────────────
  {
    quality: '7b9',
    label: 'Dominant 7♭9',
    family: 'altered',
    aliases: ['7b9#11', '7b5b9', '7b9b5'],
    chordTones: [0, 1, 4, 7, 10],
    primary: fromScale('hwDim', {
      chordTones: [0, 1, 4, 7, 10],
      goodExtensions: [3, 6, 9],
      avoidNotes: [],
      description: 'The standard jazz answer for a 7♭9 with a natural 5th: half-whole diminished keeps the 5 and the 13 and adds ♯9 and ♯11. Symmetric — the same scale works from every minor 3rd (C, E♭, G♭, A). Points toward a major target.',
      extensionLabel: 'Extensions: ♯9, ♯11, 13',
      characteristicNote: '♭9 + natural 13 — the diminished dominant sound',
    }),
    alternatives: [
      fromScale('phrygianDom', {
        chordTones: [0, 1, 4, 7, 10],
        goodExtensions: [8],
        avoidNotes: [5],
        description: 'Harmonic Minor mode 5 — the V7♭9 of a minor key (G7♭9 → Cm). The ♭13 leads to the minor 3rd of the target, where the diminished scale\'s 13 would lead to a major 3rd.',
        extensionLabel: 'Extensions: ♭13 (avoid 11)',
        trickSemitones: 5,
        trickScaleName: 'Harmonic Minor',
        trickInterval: 'P4 above (= key tonic)',
      }),
      fromScale('altered', {
        chordTones: [0, 1, 4, 10],
        goodExtensions: [3, 6, 8],
        avoidNotes: [],
        description: 'When the 5th is free: Altered adds ♯9, ♯11 and ♭13 to the ♭9 — maximum pull into the next chord.',
        extensionLabel: 'Extensions: ♯9, ♯11, ♭13 (no natural 5)',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
    ],
  },

  // ── 7♯9 ─────────────────────────────────────────────────────────────────
  {
    quality: '7#9',
    label: 'Dominant 7♯9',
    family: 'altered',
    aliases: ['13#9', '7#9#11', '7b5#9', '7#9b5', '13#9#11'],
    chordTones: [0, 3, 4, 7, 10],
    primary: fromScale('hwDim', {
      chordTones: [0, 3, 4, 7, 10],
      goodExtensions: [1, 6, 9],
      avoidNotes: [],
      description: 'Half-whole diminished contains both the ♯9 and the natural 5, so it is the jazz choice for a "clean" 7♯9. The ♭9 and ♯11 come with it; the 13 keeps it bright.',
      extensionLabel: 'Extensions: ♭9, ♯11, 13',
    }),
    alternatives: [
      fromScale('blues', {
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5, 6],
        avoidNotes: [],
        description: 'The "Hendrix chord" sound: the chord holds the major 3rd while the blues scale leans on the ♯9 (= ♭3). That rub is the point — rock, funk and blues (Purple Haze, James Brown vamps). Use the ♭5 as a passing tone.',
        extensionLabel: 'R, ♯9, 5, ♭7 · passing: 11, ♭5',
        trickSemitones: 0,
        trickScaleName: 'Blues Scale',
        trickInterval: 'same root',
      }),
      fromScale('minorPenta', {
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5],
        avoidNotes: [],
        description: 'The same idea in five notes: minor pentatonic from the root puts the ♯9 in every phrase. Bend the ♯9 toward the major 3rd for the blues inflection.',
        extensionLabel: 'R, ♯9, 5, ♭7 · ext: 11',
        trickSemitones: 0,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'same root',
      }),
      fromScale('altered', {
        chordTones: [0, 3, 4, 10],
        goodExtensions: [1, 6, 8],
        avoidNotes: [],
        description: 'When the 5th is free (7♯9♭13, 7alt voicings) every tension is altered. Strong pull to the next chord, especially a minor one.',
        extensionLabel: 'Extensions: ♭9, ♯11, ♭13',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
    ],
  },

  // ── 7♭9♭13 ──────────────────────────────────────────────────────────────
  {
    quality: '7b9b13',
    label: 'Dominant 7♭9♭13',
    family: 'altered',
    chordTones: [0, 1, 4, 7, 8, 10],
    primary: fromScale('phrygianDom', {
      chordTones: [0, 1, 4, 7, 8, 10],
      goodExtensions: [],
      avoidNotes: [5],
      description: 'Harmonic Minor mode 5 — every chord tone above the root belongs to the target minor key, so this is the textbook V7 of minor (G7♭9♭13 → Cm). Flamenco and Middle-Eastern colour when held.',
      extensionLabel: '♭9, ♭13 are chord tones · avoid: 11',
      trickSemitones: 5,
      trickScaleName: 'Harmonic Minor',
      trickInterval: 'P4 above (= key tonic)',
      characteristicNote: '♭9 + ♭13 — both resolve into the minor tonic',
    }),
    alternatives: [
      fromScale('altered', {
        chordTones: [0, 1, 4, 8, 10],
        goodExtensions: [3, 6],
        avoidNotes: [],
        description: 'Adds ♯9 and ♯11 to the same ♭9/♭13 frame (no natural 5). More chromatic and more modern.',
        extensionLabel: 'Extensions: ♯9, ♯11',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
      {
        name: '♯9 Minor Pentatonic (bIII)',
        intervals: [1, 3, 6, 8, 10],
        chordTones: [1, 8, 10],
        goodExtensions: [3, 6],
        avoidNotes: [],
        description: 'E♭ minor pentatonic over C7♭9♭13: ♭9, ♯9, ♯11, ♭13, ♭7 — the altered colours in five notes, with no avoid notes.',
        extensionLabel: '♭9, ♯9, ♯11, ♭13, ♭7',
        trickSemitones: 3,
        trickScaleName: 'Minor Pentatonic',
        trickInterval: 'min. 3rd above (= ♯9)',
      },
    ],
  },

  // ── 7♯5 ─────────────────────────────────────────────────────────────────
  {
    quality: '7#5',
    label: 'Augmented 7th',
    family: 'altered',
    aliases: ['9#5', '9+', '9#5#11'],
    chordTones: [0, 4, 8, 10],
    primary: fromScale('wholeTone', {
      chordTones: [0, 4, 8, 10],
      goodExtensions: [2, 6],
      avoidNotes: [],
      description: 'The augmented 7th is built from whole steps, so the whole-tone scale contains it completely and adds 9 and ♯11. Symmetric — only two whole-tone collections exist. Monk, Debussy, Wayne Shorter.',
      extensionLabel: 'Extensions: 9, ♯11',
      characteristicNote: '♯5 — chord tone; no natural 5 anywhere',
    }),
    alternatives: [
      fromScale('altered', {
        chordTones: [0, 4, 8, 10],
        goodExtensions: [1, 3, 6],
        avoidNotes: [],
        description: 'Keeps the ♯5 (= ♭13) and swaps the natural 9 for ♭9/♯9 — darker and more directional. The usual choice when the 7♯5 resolves (V7♯5 → I).',
        extensionLabel: 'Extensions: ♭9, ♯9, ♯11',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
    ],
  },

  // ── 7♭5 ─────────────────────────────────────────────────────────────────
  {
    quality: '7b5',
    label: 'Dominant 7♭5',
    family: 'altered',
    aliases: ['9b5'],
    chordTones: [0, 4, 6, 10],
    primary: fromScale('wholeTone', {
      chordTones: [0, 4, 6, 10],
      goodExtensions: [2, 8],
      avoidNotes: [],
      description: 'Whole tone holds the ♭5 as a chord tone and adds 9 and ♭13. The chord is symmetric at the tritone (C7♭5 = G♭7♭5), and so is the scale — ideal around tritone substitutions.',
      extensionLabel: 'Extensions: 9, ♭13',
    }),
    alternatives: [
      fromScale('lydianDom', {
        chordTones: [0, 4, 6, 10],
        goodExtensions: [2, 9],
        avoidNotes: [],
        description: 'Hears the ♭5 as a ♯11 with the natural 9, 5 and 13 around it. Brighter and more stable than whole tone; the go-to for a subV7♭5.',
        extensionLabel: 'Extensions: 9, 13 (♭5 = ♯11)',
        trickSemitones: 7,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'P5 above',
      }),
      fromScale('altered', {
        chordTones: [0, 4, 6, 10],
        goodExtensions: [1, 3, 8],
        avoidNotes: [],
        description: 'Fully altered: the ♭5 sits among ♭9, ♯9 and ♭13. Maximum tension before resolution.',
        extensionLabel: 'Extensions: ♭9, ♯9, ♭13',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
      fromScale('hwDim', {
        chordTones: [0, 4, 6, 10],
        goodExtensions: [1, 3, 9],
        avoidNotes: [],
        description: 'Keeps ♭9/♯9 but replaces the ♭13 with a natural 13 — the diminished reading of a 7♭5.',
        extensionLabel: 'Extensions: ♭9, ♯9, 13',
      }),
    ],
  },

  // ── sus2 ────────────────────────────────────────────────────────────────
  {
    quality: 'sus2',
    label: 'Suspended 2nd',
    family: 'sus',
    chordTones: [0, 2, 7],
    primary: fromScale('majorPenta', {
      chordTones: [0, 2, 7],
      goodExtensions: [4, 9],
      avoidNotes: [],
      description: 'R, 2, 3, 5, 6 — the 2nd is a chord tone and the 3rd and 6th add colour with no half-step clash. Open, modern pop and worship-guitar sound.',
      extensionLabel: 'Chord tones: R, 2, 5 · colour: 3, 6',
      trickSemitones: 0,
      trickScaleName: 'Major Pentatonic',
      trickInterval: 'same root',
    }),
    alternatives: [
      fromScale('mixolydian', {
        chordTones: [0, 2, 7],
        goodExtensions: [4, 5, 9, 10],
        avoidNotes: [],
        description: 'Adds the ♭7: implies 9sus / 7sus2 — rock and funk vamps.',
        extensionLabel: 'Colour: 3, 4, 6, ♭7',
        trickSemitones: 5,
        trickScaleName: 'Major',
        trickInterval: 'P4 above (= key tonic)',
      }),
      fromScale('dorian', {
        chordTones: [0, 2, 7],
        goodExtensions: [3, 5, 9, 10],
        avoidNotes: [],
        description: 'The minor-leaning option: the ♭3 makes the sus2 sound like an open m(add9) with the 3rd left out of the voicing.',
        extensionLabel: 'Colour: ♭3, 4, 6, ♭7',
        trickSemitones: 10,
        trickScaleName: 'Major',
        trickInterval: 'min. 7th above (= M2 below)',
      }),
      fromScale('lydian', {
        chordTones: [0, 2, 7],
        goodExtensions: [4, 6, 9, 11],
        avoidNotes: [],
        description: 'Bright and floating: the ♯4 replaces the 4th, so no note leans toward resolution. Typical of ambient and film writing.',
        extensionLabel: 'Colour: 3, ♯4, 6, △7',
        trickSemitones: 7,
        trickScaleName: 'Major',
        trickInterval: 'P5 above',
      }),
    ],
  },

  // ── sus4 ────────────────────────────────────────────────────────────────
  {
    quality: 'sus4',
    label: 'Suspended 4th',
    family: 'sus',
    chordTones: [0, 5, 7],
    primary: fromScale('mixolydian', {
      chordTones: [0, 5, 7],
      goodExtensions: [2, 9, 10],
      avoidNotes: [],
      description: 'The 4th is a chord tone, so it is no longer an avoid note; the 3rd is the resolution tone the suspension points to. The usual reading in rock and pop (Vsus4 → V).',
      extensionLabel: 'Extensions: 9, 13, ♭7 · 3 = resolution',
      trickSemitones: 5,
      trickScaleName: 'Major',
      trickInterval: 'P4 above (= key tonic)',
    }),
    alternatives: [
      fromScale('ionian', {
        chordTones: [0, 5, 7],
        goodExtensions: [2, 9, 11],
        avoidNotes: [],
        description: 'On a tonic suspension (Isus4 → I) the △7 belongs to the key. Same resolution tone, brighter top.',
        extensionLabel: 'Extensions: 9, 13, △7 · 3 = resolution',
        trickSemitones: 0,
        trickScaleName: 'Major',
        trickInterval: 'same root',
      }),
      fromScale('dorian', {
        chordTones: [0, 5, 7],
        goodExtensions: [2, 9, 10],
        avoidNotes: [],
        description: 'With a ♭3 instead of the major 3rd the suspension resolves to minor — the folk / modal sound (Dsus4 → Dm).',
        extensionLabel: 'Extensions: 9, 13, ♭7 · ♭3 = resolution',
        trickSemitones: 10,
        trickScaleName: 'Major',
        trickInterval: 'min. 7th above (= M2 below)',
      }),
      {
        name: '♭VII Major Pentatonic',
        intervals: [0, 2, 5, 7, 10],
        chordTones: [0, 5, 7],
        goodExtensions: [2, 10],
        avoidNotes: [],
        description: 'B♭ major pentatonic over Csus4: R, 9, 4, 5, ♭7 — no 3rd at all, so the suspension never resolves. The open, quartal sound of modal jazz and ECM records.',
        extensionLabel: 'Chord tones: R, 4, 5 · ext: 9, ♭7',
        trickSemitones: 10,
        trickScaleName: 'Major Pentatonic',
        trickInterval: 'min. 7th above (= ♭VII)',
      },
    ],
  },

  // ── 7♭9sus ──────────────────────────────────────────────────────────────
  {
    quality: '7b9sus',
    label: 'Sus ♭9 (Phrygian)',
    family: 'sus',
    aliases: ['7sus4b9b13', '7b9b13sus4', '11b9'],
    chordTones: [0, 1, 5, 7, 10],
    primary: fromScale('phrygian', {
      chordTones: [0, 1, 5, 7, 10],
      goodExtensions: [3, 8],
      avoidNotes: [],
      description: 'The chord is Phrygian stacked: R, ♭9, 4, 5, ♭7. Use it for the dark, Spanish / modal reading (McCoy Tyner, Chick Corea "La Fiesta"). In a minor ii–V it is a softer replacement for V7♭9.',
      extensionLabel: 'Extensions: ♯9 (♭3), ♭13',
      trickSemitones: 8,
      trickScaleName: 'Major',
      trickInterval: 'min. 6th above',
      characteristicNote: '♭9 over sus4 — with no 3rd, the ♭9 does not clash',
    }),
    alternatives: [
      fromScale('dorianb2', {
        chordTones: [0, 1, 5, 7, 10],
        goodExtensions: [3, 9],
        avoidNotes: [],
        description: 'Melodic Minor mode 2 — keeps the ♭9 but raises the 13. Brighter and more jazz-oriented: the classic sus♭9 scale of modern players (Herbie Hancock, Kenny Wheeler).',
        extensionLabel: 'Extensions: ♯9 (♭3), 13',
        trickSemitones: 10,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 7th above',
      }),
    ],
  },

  // ── Diminished triad ────────────────────────────────────────────────────
  {
    quality: 'dim',
    label: 'Diminished triad',
    family: 'dim',
    summary: 'Add ♭7 → m7♭5 (Locrian family); add ♭♭7 → dim7 (diminished scale).',
    chordTones: [0, 3, 6],
    primary: fromScale('locrian', {
      chordTones: [0, 3, 6],
      goodExtensions: [5, 8, 10],
      avoidNotes: [1],
      description: 'In a major key the diminished triad is the vii° chord (B° in C) and Locrian is its diatonic scale. The ♭2 is a half step above the root — treat it as a passing note.',
      extensionLabel: 'Extensions: 11, ♭13, ♭7 · avoid: ♭2',
      trickSemitones: 1,
      trickScaleName: 'Major',
      trickInterval: 'min. 2nd above',
    }),
    alternatives: [
      fromScale('locrianSharp2', {
        chordTones: [0, 3, 6],
        goodExtensions: [2, 5, 8, 10],
        avoidNotes: [],
        description: 'Raises the 2nd: no avoid note and a softer, jazzier colour — the diminished triad on the 6th degree of melodic minor.',
        extensionLabel: 'Extensions: 9, 11, ♭13, ♭7',
        trickSemitones: 3,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 3rd above',
      }),
      fromScale('whDim', {
        chordTones: [0, 3, 6],
        goodExtensions: [2, 5, 8, 9, 11],
        avoidNotes: [],
        description: 'Treats the triad as an incomplete dim7: the scale adds the ♭♭7 and a whole step above each chord tone. Best when the triad is a passing diminished chord between two diatonic chords.',
        extensionLabel: 'Colour: 9, 11, ♭13, ♭♭7, △7',
      }),
    ],
  },

  // ── Augmented triad ─────────────────────────────────────────────────────
  {
    quality: 'aug',
    label: 'Augmented triad',
    family: 'dim',
    summary: 'Read as a dominant (V+ → Whole Tone / Altered) or as a major colour (I+ → Lydian Augmented).',
    chordTones: [0, 4, 8],
    primary: fromScale('wholeTone', {
      chordTones: [0, 4, 8],
      goodExtensions: [2, 6, 10],
      avoidNotes: [],
      description: 'All three chord tones are in one whole-tone scale, which adds 9, ♯11 and ♭7 — the full whole-tone sound. Works as V+ (dominant function) or as pure colour (Debussy, Monk).',
      extensionLabel: 'Extensions: 9, ♯11, ♭7',
    }),
    alternatives: [
      fromScale('lydianAug', {
        chordTones: [0, 4, 8],
        goodExtensions: [2, 6, 9, 11],
        avoidNotes: [],
        description: 'The major reading (augmented triad as maj7♯5 without the 7th): adds 9, ♯11, 13 and △7. Use it when the chord is a tonic colour or the I+ of a line cliché (C – C+ – C6).',
        extensionLabel: 'Extensions: 9, ♯11, 13, △7',
        trickSemitones: 9,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'maj. 6th above',
      }),
      fromScale('altered', {
        chordTones: [0, 4, 8],
        goodExtensions: [1, 3, 6, 10],
        avoidNotes: [],
        description: 'The dominant reading (V+ → I) with altered tensions: treats the triad as 7♯5 with ♭9, ♯9 and ♯11.',
        extensionLabel: 'Extensions: ♭9, ♯9, ♯11, ♭7',
        trickSemitones: 1,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 2nd above',
      }),
    ],
  },
];

// ─── Extended chords (derived from their base chord) ────────────────────────

// Alterations of the same tension degree: ♭9/9/♯9, 11/♯11, ♭13/13
const DEGREE_GROUPS = [[1, 2, 3], [5, 6], [8, 9]];

/**
 * An extended chord (maj9, m11, 13…) uses its base chord's scales with the added
 * tensions promoted to chord tones. Scales holding a different alteration of an
 * added tension (e.g. ♭9 on a 9 chord) are dropped; scales that simply omit it
 * (pentatonics) stay, since the chord supplies the note.
 */
function extend(
  base: ChordScaleEntry,
  spec: Pick<ChordScaleEntry, 'quality' | 'label' | 'family' | 'aliases' | 'summary'> & { added: number[]; extra?: ScaleInfo[] },
): ChordScaleEntry {
  const chordTones = [...new Set([...base.chordTones, ...spec.added])].sort((a, b) => a - b);
  const conflicts = (scale: ScaleInfo) => spec.added.some(a => {
    const group = DEGREE_GROUPS.find(g => g.includes(a)) ?? [];
    return scale.intervals.some(i => i !== a && group.includes(i) && !chordTones.includes(i));
  });
  const promote = (scale: ScaleInfo): ScaleInfo => ({
    ...scale,
    chordTones: [...new Set([...scale.chordTones, ...spec.added.filter(a => scale.intervals.includes(a))])],
    goodExtensions: scale.goodExtensions.filter(e => !spec.added.includes(e)),
  });
  const [primary, ...alternatives] = [base.primary, ...base.alternatives].filter(s => !conflicts(s)).map(promote);
  return {
    quality: spec.quality,
    label: spec.label,
    family: spec.family,
    aliases: spec.aliases,
    summary: spec.summary,
    chordTones,
    primary,
    alternatives: [...alternatives, ...(spec.extra ?? [])],
  };
}

const ALL_BASE = [...BASE_ENTRIES, ...EXTRA_ENTRIES];
const base = (quality: string) => ALL_BASE.find(e => e.quality === quality)!;

const DERIVED_ENTRIES: ChordScaleEntry[] = [
  extend(base('maj7'), {
    quality: 'maj9', label: 'Major 9th', family: 'major', added: [2],
    summary: 'maj7 + 9 — same scale family as maj7; the natural 9 is now a chord tone.',
  }),
  extend(base('maj7'), {
    quality: 'maj13', label: 'Major 13th', family: 'major', added: [2, 9],
    summary: 'maj7 + 9 + 13. The 11 is normally omitted (or raised: see maj7♯11).',
  }),
  extend(base('maj7'), {
    quality: 'maj7#11', label: 'Major 7♯11 (Lydian)', family: 'major', added: [6],
    aliases: ['maj9#11', 'maj13#11', 'M13#11'],
    summary: 'The ♯11 is written into the chord, so only scales with a raised 4th remain — Lydian is the natural home. Also covers maj9♯11 and maj13♯11.',
  }),
  extend(base('maj6'), {
    quality: '69', label: '6/9', family: 'major', added: [2],
    summary: 'Major 6th + 9 — exactly the major pentatonic stacked as a chord.',
  }),
  extend(base('maj'), {
    quality: 'add9', label: 'Add 9', family: 'major', added: [2],
    summary: 'Major triad + 9 with no 7th — the scale still chooses △7 or ♭7.',
  }),
  extend(base('m7'), {
    quality: 'm9', label: 'Minor 9th', family: 'minor', added: [2],
    summary: 'm7 + 9 — Phrygian and Dorian ♭2 drop out because their ♭9 clashes with the chord\'s natural 9.',
  }),
  extend(base('m7'), {
    quality: 'm11', label: 'Minor 11th', family: 'minor', added: [2, 5],
    aliases: ['m7add11', 'm7add4'],
    summary: 'm7 + 9 + 11. On minor chords the 11 is a stable tension, not an avoid note.',
  }),
  extend(base('m7'), {
    quality: 'm13', label: 'Minor 13th', family: 'minor', added: [2, 5, 9],
    summary: 'm7 + 9 + 11 + natural 13 — the natural 13 rules out Aeolian and points straight to Dorian.',
  }),
  extend(base('m6'), {
    quality: 'm69', label: 'Minor 6/9', family: 'minor', added: [2],
    summary: 'Minor 6th + 9 — the Dorian / melodic-minor tonic chord.',
  }),
  extend(base('m'), {
    quality: 'madd9', label: 'Minor add 9', family: 'minor', added: [2],
    summary: 'Minor triad + 9 with no 7th; Phrygian drops out (♭9).',
  }),
  extend(base('mMaj7'), {
    quality: 'mMaj9', label: 'Min. Maj9', family: 'minor', added: [2],
    summary: 'mMaj7 + 9 — the melodic-minor tonic chord in full.',
  }),
  extend(base('7'), {
    quality: '9', label: 'Dominant 9th', family: 'dominant', added: [2],
    summary: '7 + natural 9. Phrygian Dominant drops out (♭9); minor pentatonic / blues still work as a deliberate blues rub (♯9 against 9).',
  }),
  extend(base('7'), {
    quality: '13', label: 'Dominant 13th', family: 'dominant', added: [2, 9],
    summary: '7 + 9 + natural 13. The 11 is omitted (or raised: see 7♯11); the natural 13 rules out the ♭13 scales.',
  }),
  extend(base('7'), {
    quality: '7#11', label: 'Dominant 7♯11', family: 'dominant', added: [6],
    aliases: ['9#11', '9+4', '9#4', '13#11', '13+4', '13#4', '7#4'],
    summary: 'The ♯11 is written into the chord: Lydian Dominant is the native scale. Also covers 9♯11 and 13♯11.',
    extra: [
      fromScale('hwDim', {
        chordTones: [0, 4, 6, 7, 10],
        goodExtensions: [1, 3, 9],
        avoidNotes: [],
        description: 'Keeps the ♯11, natural 5 and 13, but swaps the 9 for ♭9/♯9 — use it when the voicing leaves the 9 out (3–♭7–♯11) and you want more bite.',
        extensionLabel: 'Extensions: ♭9, ♯9, 13',
      }),
    ],
  }),
  extend(base('7b13'), {
    quality: '9b13', label: 'Dominant 9♭13', family: 'dominant', added: [2],
    summary: '7♭13 + natural 9 — Mixolydian ♭6 in full.',
  }),
  extend(base('7b9'), {
    quality: '13b9', label: 'Dominant 13♭9', family: 'altered', added: [9],
    aliases: ['13b9#11'],
    summary: '♭9 together with a natural 13: only the half-whole diminished scale holds both.',
  }),
  extend(base('7sus4'), {
    quality: '9sus4', label: 'Dominant 9sus4', family: 'sus', added: [2],
    aliases: ['9sus', '11'],
    summary: '7sus4 + 9 (often written as 11, or as B♭/C over a C bass).',
  }),
  extend(base('7sus4'), {
    quality: '13sus4', label: 'Dominant 13sus4', family: 'sus', added: [2, 9],
    aliases: ['13sus'],
    summary: '7sus4 + 9 + 13 — the full Mixolydian sus sound.',
  }),
  extend(base('m7b5'), {
    quality: 'm9b5', label: 'Half-dim. 9 (ø9)', family: 'dim', added: [2],
    summary: 'm7♭5 + natural 9 — only Locrian ♯2 holds the natural 9.',
  }),
];

const FAMILY_ORDER: ChordFamily[] = ['major', 'minor', 'dominant', 'altered', 'sus', 'dim'];
// Display order inside each family
const QUALITY_ORDER = [
  'maj', 'maj7', 'maj9', 'maj13', 'maj7#11', 'maj6', '69', 'add9', 'maj7#5',
  'm', 'm7', 'm9', 'm11', 'm13', 'm6', 'm69', 'madd9', 'mMaj7', 'mMaj9',
  '7', '9', '13', '7#11', '7b13', '9b13',
  '7alt', '7b9', '13b9', '7#9', '7b9b13', '7#5', '7b5',
  'sus2', 'sus4', '7sus4', '9sus4', '13sus4', '7b9sus',
  'm7b5', 'm9b5', 'dim', 'dim7', 'aug',
];

export const CHORD_SCALE_DATA: ChordScaleEntry[] = [...ALL_BASE, ...DERIVED_ENTRIES].sort(
  (a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family)
    || QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality),
);

export function getChordScaleEntry(quality: string): ChordScaleEntry | undefined {
  return CHORD_SCALE_DATA.find(e => e.quality === quality);
}

// ─── Note Parsing ───────────────────────────────────────────────────────────

export const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Reduces a chord no entry knows by name to the closest family by its 3rd/5th/7th. */
function fallbackQuality(intervals: string[]): string | null {
  const has = (i: string) => intervals.includes(i);
  if (has('3m')) {
    if (has('5d')) return has('7d') ? 'dim7' : has('7m') ? 'm7b5' : 'dim';
    return has('7M') ? 'mMaj7' : has('7m') ? 'm7' : has('6M') ? 'm6' : 'm';
  }
  if (has('3M')) {
    if (has('7m')) return has('5A') ? '7#5' : '7';
    if (has('7M')) return has('5A') ? 'maj7#5' : 'maj7';
    if (has('5A')) return 'aug';
    return has('6M') ? 'maj6' : 'maj';
  }
  if (has('4P')) return has('7m') ? '7sus4' : 'sus4';
  if (has('2M')) return 'sus2';
  return null;
}

export function parseChordSymbol(symbol: string): { root: string; quality: string; displaySymbol: string } | null {
  const trimmed = symbol.trim();
  if (!trimmed) return null;

  const altMatch = trimmed.match(/^([A-G][#b]?)(?:7)?alt$/i);
  if (altMatch) {
    const root = altMatch[1];
    return { root, quality: '7alt', displaySymbol: `${root}7alt` };
  }

  // tonal has no "maj6" alias
  const maj6Match = trimmed.match(/^([A-G][#b]?)maj6$/i);
  if (maj6Match) {
    const root = Note.simplify(maj6Match[1]) || maj6Match[1];
    return { root, quality: 'maj6', displaySymbol: `${root}6` };
  }

  const chord = Chord.get(trimmed);
  if (chord.empty || !chord.tonic) return null;

  const entry = CHORD_SCALE_DATA.find(e =>
    chord.aliases.includes(e.quality) || e.aliases?.some(a => chord.aliases.includes(a)));
  // Fold compound intervals (9, 11, 13) onto the octave so '13M' reads as '6M'
  const simpleIntervals = chord.intervals.map(i => i.replace(/^\d+/, n => String(((+n - 1) % 7) + 1)));
  const quality = entry?.quality ?? fallbackQuality(simpleIntervals);
  if (!quality) return null;

  const root = Note.simplify(chord.tonic) || chord.tonic;
  return { root, quality, displaySymbol: chord.symbol || trimmed };
}

export function parseProgression(text: string): Array<{ root: string; quality: string; symbol: string }> {
  return text
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const parsed = parseChordSymbol(s);
      return parsed ? { root: parsed.root, quality: parsed.quality, symbol: parsed.displaySymbol } : null;
    })
    .filter((x): x is { root: string; quality: string; symbol: string } => x !== null);
}

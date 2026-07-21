import { useState, useMemo } from 'react';
import { Note } from 'tonal';

// ─── Font injection ────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('chord-landing-fonts')) {
  const s = document.createElement('style');
  s.id = 'chord-landing-fonts';
  s.textContent = "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Syne:wght@700;800&display=swap');";
  document.head.appendChild(s);
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ChordStep {
  interval: string;   // Tonal interval from target root going UP (e.g. '5P' for V7)
  quality: string;    // chord quality suffix: '7', 'm7', 'maj7', 'dim7', 'alt', etc.
  role: string;       // functional label: 'V7', 'bII7', 'ii7', etc.
}

interface Approach {
  id: string;
  name: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  steps: ChordStep[];        // chords leading TO the target (not including it)
  moods: string[];
  genres: string[];
  theory: string;
  tip: string;
  worksFor: string[];        // 'major', 'minor', 'dominant', 'any'
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const QUALITIES = [
  // Major
  { value: '',        label: 'Major (triad)', cat: 'major'    },
  { value: 'maj7',    label: 'Maj7',          cat: 'major'    },
  { value: 'maj9',    label: 'Maj9',          cat: 'major'    },
  { value: 'maj7#11', label: 'Maj7#11',       cat: 'major'    },
  { value: '6',       label: '6',             cat: 'major'    },
  { value: '6/9',     label: '6/9',           cat: 'major'    },
  { value: 'add9',    label: 'add9',          cat: 'major'    },
  // Minor
  { value: 'm',       label: 'Minor (triad)', cat: 'minor'    },
  { value: 'm7',      label: 'm7',            cat: 'minor'    },
  { value: 'm9',      label: 'm9',            cat: 'minor'    },
  { value: 'm6',      label: 'm6',            cat: 'minor'    },
  { value: 'm6/9',    label: 'm6/9',          cat: 'minor'    },
  { value: 'mM7',     label: 'mMaj7',         cat: 'minor'    },
  { value: 'm11',     label: 'm11',           cat: 'minor'    },
  // Dominant
  { value: '7',       label: 'Dom7',          cat: 'dominant' },
  { value: '9',       label: '9',             cat: 'dominant' },
  { value: '13',      label: '13',            cat: 'dominant' },
  { value: '7b9',     label: '7b9',           cat: 'dominant' },
  { value: '7#9',     label: '7#9',           cat: 'dominant' },
  { value: '7#11',    label: '7#11',          cat: 'dominant' },
  { value: '7alt',    label: '7alt',          cat: 'dominant' },
  { value: '7sus4',   label: '7sus4',         cat: 'dominant' },
  // Suspended
  { value: 'sus2',    label: 'sus2',          cat: 'suspended' },
  { value: 'sus4',    label: 'sus4',          cat: 'suspended' },
  // Half-diminished / Diminished
  { value: 'm7b5',    label: 'm7b5 (ø)',      cat: 'halfdiminished' },
  { value: 'dim',     label: 'dim (°)',        cat: 'diminished'     },
  { value: 'dim7',    label: 'dim7 (°7)',      cat: 'diminished'     },
  // Augmented
  { value: 'aug',     label: 'Aug (+)',        cat: 'augmented'      },
  { value: 'augM7',   label: 'Aug Maj7',       cat: 'augmented'      },
];

const ALL_MOODS = ['jazz', 'classical', 'gospel', 'chromatic', 'modal', 'cinematic', 'bluesy', 'r&b', 'experimental'];

const COMPLEXITY_COLORS: Record<number, string> = {
  1: '#10b981',
  2: '#06b6d4',
  3: '#7c3aed',
  4: '#f59e0b',
  5: '#ef4444',
};

// ─── Approach database ─────────────────────────────────────────────────────────
// Intervals are measured FROM the target root going UP.
// e.g. For target C: '5P' → G (the V7), '2m' → Db (the bII7), '2M' → D (the ii7)
const APPROACHES: Approach[] = [
  // ── Complexity 1 ─────────────────────────────────────────────────────────────
  {
    id: 'perfect-cadence',
    name: 'Perfect Cadence',
    complexity: 1,
    steps: [{ interval: '5P', quality: '7', role: 'V7' }],
    moods: ['classical', 'jazz'],
    genres: ['Classical', 'Pop', 'Jazz', 'Any style'],
    theory: 'The dominant V7 is built a perfect 5th above the tonic. Its tritone (between the 3rd and 7th) creates the strongest harmonic tension in tonal music. The chord 3rd resolves up a half-step to the tonic root; the 7th resolves down a half-step to the tonic 3rd — two voices closing inward simultaneously.',
    tip: 'Add a 9th, 13th, or #11 to the V7 for more color without changing its function. V13 → I is just as strong, and richer.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'plagal',
    name: 'Plagal Cadence (Amen)',
    complexity: 1,
    steps: [{ interval: '4P', quality: '', role: 'IV' }],
    moods: ['gospel', 'classical', 'bluesy'],
    genres: ['Gospel', 'Hymn', 'Blues', 'Rock', 'Folk'],
    theory: 'The IV chord (a perfect 4th above the tonic) descends to I. Called the "Amen" cadence from its use in hymns. The subdominant creates a sense of peaceful completion without the tension of the dominant.',
    tip: 'Try IVmaj7 → I or IVmaj9 → I for a more sophisticated gospel color. The added 7th softens the cadence beautifully.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'minor-plagal',
    name: 'Minor Plagal (Dark Amen)',
    complexity: 1,
    steps: [{ interval: '4P', quality: 'm', role: 'iv' }],
    moods: ['cinematic', 'modal', 'bluesy'],
    genres: ['Film Score', 'Pop', 'Soul', 'R&B'],
    theory: 'The minor iv chord (borrowed from the parallel minor) resolves to a major tonic. The flattened 6th (Ab in key of C) creates a bittersweet, more intense resolution than the major IV. Famous in "Yesterday" (Beatles) and countless film scores.',
    tip: 'Try ivm7 → I for a smoother, jazz-inflected color. The minor 7th on the iv chord softens the half-step resolution of the b6.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'half-step-chromatic',
    name: 'Chromatic Half-Step (Ghost Chord)',
    complexity: 1,
    steps: [{ interval: '2m', quality: '', role: 'bII (chromatic)' }],
    moods: ['jazz', 'chromatic', 'bluesy'],
    genres: ['Bebop', 'Blues', 'Fusion'],
    theory: 'A chord of the same quality as the target, played a half-step above, then crushed down chromatically. Used as a "grace chord" in bebop — played very briefly, almost like a chromatic grace note applied to an entire chord.',
    tip: 'In performance, make it very short — an eighth note or less. Treat it like a rhythmic emphasis, not a harmonic moment. This is a bebop articulation technique.',
    worksFor: ['any'],
  },
  {
    id: 'pop-IV-V',
    name: 'Diatonic IV–V',
    complexity: 1,
    steps: [
      { interval: '4P', quality: '', role: 'IV' },
      { interval: '5P', quality: '', role: 'V' },
    ],
    moods: ['classical', 'gospel', 'bluesy'],
    genres: ['Pop', 'Rock', 'Folk', 'Country', 'Gospel'],
    theory: 'The simplest and most universal progression in Western music. IV and V are the two primary tonal satellites of I. Moving IV→V→I gathers momentum stepwise in the bass and creates an unmistakable sense of arrival.',
    tip: 'Add a sus4 to the V for extra suspension before landing: IV → Vsus4 → V → I. The sus4 creates a moment of "held breath" before resolution.',
    worksFor: ['major', 'any'],
  },
  // ── Complexity 2 ─────────────────────────────────────────────────────────────
  {
    id: 'tritone-sub',
    name: 'Tritone Substitution',
    complexity: 2,
    steps: [{ interval: '2m', quality: '7', role: 'bII7 (SubV)' }],
    moods: ['jazz', 'chromatic'],
    genres: ['Jazz', 'Bebop', 'Bossa Nova', 'Fusion'],
    theory: 'The bII7 shares the same tritone as V7 — its 3rd and 7th are the same two notes as V7\'s 7th and 3rd, just swapped. Since the tritone is symmetrical, both chords contain identical harmonic tension. The bII7 resolves by a smooth half-step descent instead of a leaping 5th.',
    tip: 'Voice leading is extremely smooth: in key of C, the Ab (b13 of Db7) resolves down to G (5th of C), and F (3rd of Db7) resolves down to E (3rd of C). All voices move by step.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'backdoor',
    name: 'Backdoor Dominant',
    complexity: 2,
    steps: [{ interval: '7m', quality: '7', role: 'bVII7' }],
    moods: ['bluesy', 'modal', 'jazz'],
    genres: ['Jazz', 'Funk', 'Soul', 'Blues', 'R&B'],
    theory: 'The bVII7 (Bb7 → C) resolves by a whole-step ascent instead of a descending 5th. It\'s the dominant of IV — arriving at I from a different "door". Characteristic of blues, soul, and modal jazz. The term was coined by Barry Harris.',
    tip: 'Works especially well over minor tonic chords. Bb7 → Cm is even more idiomatic than over major. Think Herbie Hancock, Stevie Wonder, and classic Motown.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'dim-leading',
    name: 'Diminished Leading Tone',
    complexity: 2,
    steps: [{ interval: '7M', quality: 'dim7', role: 'vii°7' }],
    moods: ['classical', 'cinematic', 'gospel'],
    genres: ['Classical', 'Jazz', 'Film', 'Gospel'],
    theory: 'The vii°7 is built a half-step below the tonic root and contains two tritones — maximum harmonic instability. All four voices can resolve by half-step or whole-step to the tonic chord. The dim7 chord is symmetrical: Bdim7 = Ddim7 = Fdim7 = Abdim7.',
    tip: 'Because of its symmetry, you can approach the same dim7 from four different directions. A Bdim7 can resolve to C, Eb, Gb, or A — giving you four free chromatic resolutions from one chord.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'basic-ii-V',
    name: 'ii–V (Jazz Standard)',
    complexity: 2,
    steps: [
      { interval: '2M', quality: 'm7', role: 'ii7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['jazz', 'classical'],
    genres: ['Jazz', 'Bossa Nova', 'Swing', 'Bebop'],
    theory: 'The most important two-chord cadence in jazz. The ii7 provides subdominant preparation; V7 provides dominant tension. They share three common tones — the motion between them is smooth, and the final resolution to I feels inevitable.',
    tip: 'The ii7 (Dm7) and V7 (G7) contain the same tritone — F and B — just in different roles. The ii7 "hints" at the tension that V7 then fully reveals before resolving.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'ii-dim-V-minor',
    name: 'iiø–V7 (Minor Target)',
    complexity: 2,
    steps: [
      { interval: '2M', quality: 'm7b5', role: 'iiø7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['jazz', 'cinematic', 'classical'],
    genres: ['Jazz', 'Latin Jazz', 'Film Noir', 'Classical'],
    theory: 'For minor tonic chords, the ii chord is half-diminished (m7b5, marked ø). The V7 often uses b9 and/or b13 for a Phrygian dominant sound that intensifies the minor landing. The half-diminished chord has a darker, more ambiguous quality than a regular m7.',
    tip: 'Try V7b9 for a "Spanish" tension (G7b9 → Cm), or V7alt for maximum jazz drama. The b9 on V7 comes from the harmonic minor scale.',
    worksFor: ['minor', 'any'],
  },
  {
    id: 'ragtime-VI-ii-V',
    name: 'VI7–ii–V (Turnaround Tail)',
    complexity: 2,
    steps: [
      { interval: '6M', quality: '7', role: 'VI7' },
      { interval: '2M', quality: 'm7', role: 'ii7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['jazz', 'bluesy'],
    genres: ['Jazz', 'Swing', 'Blues', 'Ragtime', 'Standards'],
    theory: 'The VI7 (A7 in key of C) is a secondary dominant to the ii chord, pulling it toward V7→I. Each chord is a 5th apart in a chain: VI7→ii→V→I. This is the final three chords of the classic "I–VI–ii–V" turnaround.',
    tip: 'This is the ending of virtually every jazz standard, looped as a turnaround. The VI7 is the "jazz-ifying" chord — without it, it\'s just ii–V. With it, it swings.',
    worksFor: ['major', 'any'],
  },
  // ── Complexity 3 ─────────────────────────────────────────────────────────────
  {
    id: 'backdoor-ii-V',
    name: 'Backdoor ii–V',
    complexity: 3,
    steps: [
      { interval: '4P', quality: 'm7', role: 'IVm7' },
      { interval: '7m', quality: '7', role: 'bVII7' },
    ],
    moods: ['jazz', 'modal', 'bluesy'],
    genres: ['Jazz', 'Funk', 'Soul', 'R&B', 'Fusion'],
    theory: 'IVm7 and bVII7 form a ii–V relationship in the key of bVII. The IVm7 (Fm7 in key of C) provides minor subdominant color borrowed from the parallel minor; the bVII7 (Bb7) resolves upward by a whole step. This avoids the major 3rd of V7, giving a modal, floating quality.',
    tip: 'Characteristic of Herbie Hancock\'s "Maiden Voyage" era and countless Stevie Wonder songs. The Fm7 is the chord that gives this cadence its color — don\'t rush past it.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'tritone-ii-V',
    name: 'Tritone ii–V (Sub ii–V)',
    complexity: 3,
    steps: [
      { interval: '3m', quality: 'm7b5', role: 'bIIIm7b5' },
      { interval: '2m', quality: '7', role: 'bII7' },
    ],
    moods: ['jazz', 'chromatic'],
    genres: ['Bebop', 'Post-Bop', 'Modern Jazz', 'Fusion'],
    theory: 'The tritone-substituted ii–V. Instead of Dm7→G7→C, you use Ebm7b5→Db7→C. The bII7 (Db7) is the tritone sub of V7 (G7); its ii chord is bIIIm7b5 (Ebm7b5). Every voice moves by step — the smoothest voice leading possible.',
    tip: 'Also called the "Tadd Dameron turnaround". The bass descends chromatically: Eb→Db→C. This chromatic bass line is the signature — make it smooth and connected.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'altered-ii-V',
    name: 'Altered ii–V (Maximum Tension)',
    complexity: 3,
    steps: [
      { interval: '2M', quality: 'm7', role: 'ii7' },
      { interval: '5P', quality: '7alt', role: 'V7alt' },
    ],
    moods: ['jazz', 'chromatic', 'experimental'],
    genres: ['Modern Jazz', 'Post-Bop', 'Fusion', 'Contemporary'],
    theory: 'The V7alt uses all four altered tensions simultaneously: b9, #9, b13 (#5), and #11. These come from the altered scale (7th mode of melodic minor). This is the maximum tension achievable before resolving to the tonic.',
    tip: 'The b13 of V7alt is enharmonically the same as the #5 — in key of C, the Eb is the b13 of G7alt, and it resolves to E (3rd of Cmaj7). Voice leading is built in.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'bVI-V7',
    name: 'bVImaj7 → V7 (Cinematic)',
    complexity: 3,
    steps: [
      { interval: '6m', quality: 'maj7', role: 'bVImaj7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['cinematic', 'jazz', 'classical'],
    genres: ['Film Score', 'Jazz Ballad', 'Pop Ballad', 'Classical'],
    theory: 'The bVImaj7 (Abmaj7 in key of C) is borrowed from the parallel minor. It has an expansive, dramatic quality — a major chord in a "wrong" place. Moving to V7 then I creates a sense of yearning followed by inevitable release.',
    tip: 'The bVI → V motion is sometimes called the "film score plagal". Abmaj7 → G7 → Cmaj7 at a slow tempo is one of the most powerful gestures in tonal music.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'gospel-dim',
    name: 'Gospel Passing Dim (IV–#iv°–V)',
    complexity: 3,
    steps: [
      { interval: '4P', quality: '', role: 'IV' },
      { interval: '4A', quality: 'dim7', role: '#iv°7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['gospel', 'classical', 'jazz'],
    genres: ['Gospel', 'Soul', 'R&B', 'Jazz', 'Blues'],
    theory: 'The passing diminished (#iv°7 = F#dim7 in key of C) connects IV to V via chromatic voice leading. The #iv°7 is enharmonically identical to V7b9 without the root — it\'s a rootless dominant with b9. Inner voices move by half-steps in a chain.',
    tip: 'The characteristic gospel sound: F → F#dim7 → G7 → C. Without the dim7 it\'s ordinary; with it, it\'s gospel. The F#dim7 can also be spelled as Adim7, Cdim7, or Ebdim7 — all the same chord.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'phrygian',
    name: 'Neapolitan + V7 (Phrygian Approach)',
    complexity: 3,
    steps: [
      { interval: '2m', quality: 'maj7', role: 'bIImaj7 (Neapolitan)' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['classical', 'cinematic', 'experimental'],
    genres: ['Flamenco', 'Latin Jazz', 'Classical', 'Film Score'],
    theory: 'The Neapolitan chord (bIImaj, built on the flattened second degree) comes from the Phrygian mode and has a Spanish/Andalusian character. Resolving to V7 then I creates intense, exotic tension. A cornerstone of Baroque and Classical minor-key writing.',
    tip: 'Add b9 to the V7 (V7b9) for maximum Phrygian color. In key of C: Dbmaj7 → G7b9 → Cm. The Ab on Dbmaj7 directly becomes the b9 on G7b9.',
    worksFor: ['minor', 'major', 'any'],
  },
  {
    id: 'full-chain-of-5ths',
    name: 'iii–VI–ii–V (Chain of 5ths)',
    complexity: 3,
    steps: [
      { interval: '3M', quality: 'm7', role: 'iii7' },
      { interval: '6M', quality: '7', role: 'VI7' },
      { interval: '2M', quality: 'm7', role: 'ii7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['jazz', 'classical'],
    genres: ['Jazz Standards', 'Bossa Nova', 'Swing'],
    theory: 'Each chord is a perfect 5th apart from the next, cascading around the circle of 5ths toward I. The iii7 acts as a tonic substitute (shares two notes with I); VI7 and ii7 build subdominant momentum; V7 delivers the final push. The backbone of "Autumn Leaves" and hundreds of standards.',
    tip: 'The iii7 at the start creates ambiguity — it sounds like the I chord, masking where "home" is until the final resolution. That deception is what makes the landing feel so satisfying.',
    worksFor: ['major', 'any'],
  },
  // ── Complexity 4 ─────────────────────────────────────────────────────────────
  {
    id: 'coltrane-fragment',
    name: 'Coltrane Changes Fragment',
    complexity: 4,
    steps: [
      { interval: '3M', quality: '7', role: 'III7' },
      { interval: '6m', quality: '7', role: 'bVI7' },
      { interval: '2m', quality: '7', role: 'bII7' },
    ],
    moods: ['jazz', 'experimental', 'chromatic'],
    genres: ['Post-Bop', 'Modern Jazz', 'Fusion'],
    theory: 'John Coltrane divided the octave into three equal parts (augmented triad: C, E, Ab) and substituted the standard ii–V–I with a cycle of major-3rd-related dominants. Each dominant acts as a local V7 to the next, with the last (bII7) resolving via tritone sub to I. From "Giant Steps" and "Countdown".',
    tip: 'The roots form an augmented triad: in key of C → E, Ab, Db (→C). Memorize this cycle in one key and you know all three — the pattern repeats every major 3rd.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'secondary-dom-chain',
    name: 'V/V/V → V/V → V (Secondary Dom Chain)',
    complexity: 4,
    steps: [
      { interval: '6M', quality: '7', role: 'V/V/V' },
      { interval: '2M', quality: '7', role: 'V/V' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['classical', 'gospel', 'jazz'],
    genres: ['Classical', 'Gospel', 'Ragtime', 'Jazz'],
    theory: 'A chain of secondary dominants, each resolving a perfect 5th down to the next. In key of C: A7 → D7 → G7 → C. Each chord is the dominant of the next, creating a long chain of 5th-based tension releases like a row of falling dominoes.',
    tip: 'The bass traces the circle of 5ths backwards: A → D → G → C. This creates enormous momentum. If you add a 7th to every chord in the chain, the tension compounds with each step.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'chromatic-descent',
    name: 'Chromatic Dominant Chain',
    complexity: 4,
    steps: [
      { interval: '3m', quality: '7', role: 'bIII7' },
      { interval: '2m', quality: '7', role: 'bII7' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['cinematic', 'chromatic', 'jazz', 'experimental'],
    genres: ['Bebop', 'Film Score', 'Modern Jazz', 'Fusion'],
    theory: 'A chain of dominant chords descending chromatically. The bIII7 and bII7 act as tritone substitutes and chromatic approach dominants; the V7 is the final "authentic" dominant before resolution. Creates a sense of falling or inevitable arrival.',
    tip: 'In key of C: Eb7 → Db7 → G7 → C. The bass leaps from Db to G (tritone) before resolving to C — that angular jump is the signature of this cadence. Use it in ballads for dramatic effect.',
    worksFor: ['major', 'any'],
  },
  // ── Complexity 5 ─────────────────────────────────────────────────────────────
  {
    id: 'negative-harmony',
    name: 'Negative Harmony (Inverted V)',
    complexity: 5,
    steps: [
      { interval: '4P', quality: 'm7', role: 'iv7 (mirror of V7)' },
    ],
    moods: ['experimental', 'modal', 'jazz'],
    genres: ['Contemporary Jazz', 'Art Music', 'Experimental', 'Modern Pop'],
    theory: 'In negative harmony (mirroring around the E–Bb axis in C major), V7 (G7) maps to iv (Fm). The iv chord carries the same structural "pull" toward I as V7, but approaching from below rather than above. Coined by Ernst Levy, popularized by Jacob Collier.',
    tip: 'Try Fm → Cmaj7 or Fm7 → C. The resolution feels surprising yet completely logical. Layer over a C pedal tone for maximum tension — the Fm above a C bass creates an implied C7sus4 that resolves beautifully.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'tritone-oscillation',
    name: 'Tritone Oscillation (V ↔ SubV)',
    complexity: 5,
    steps: [
      { interval: '5P', quality: '7', role: 'V7' },
      { interval: '2m', quality: '7', role: 'bII7 (SubV)' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['experimental', 'jazz', 'chromatic'],
    genres: ['Free Jazz', 'Post-Bop', 'Avant-Garde', 'Fusion'],
    theory: 'Alternating between V7 and its tritone substitute bII7 creates a chromatic oscillation that intensifies harmonic ambiguity before final resolution. Each iteration "redoubles" the dominant tension. The listener cannot tell when resolution will come, making the final landing dramatic.',
    tip: 'Use this as an extended vamp for improvisation. The harmonic ambiguity is the feature, not a bug. Resolving suddenly and cleanly after several oscillations creates maximum impact.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'superimposed-chain',
    name: 'Extended Dominant Loop (4 chords)',
    complexity: 5,
    steps: [
      { interval: '7m', quality: '7', role: 'bVII7' },
      { interval: '3M', quality: '7', role: 'III7' },
      { interval: '5P', quality: '7', role: 'V7' },
      { interval: '2m', quality: '7', role: 'bII7' },
    ],
    moods: ['experimental', 'jazz', 'cinematic', 'chromatic'],
    genres: ['Advanced Fusion', 'Free Jazz', 'Experimental', 'Contemporary'],
    theory: 'Combines backdoor dominant (bVII7), Coltrane major-3rd movement (III7), authentic V7, and tritone sub (bII7) into a four-chord approach. Each chord connects to the next by a recognizable device, creating a labyrinthine approach that suddenly snaps into focus.',
    tip: 'Only use this with musicians who can hear through the complexity. The final resolution to I should feel like arriving home after a very long journey. Maximum harmonic drama — use sparingly.',
    worksFor: ['major', 'any'],
  },

  // ── Sus-based approaches (from Andrea Saffirio lesson) ────────────────────────
  {
    id: 'vsus4-alone',
    name: 'V7sus4 (Ambiguous Dominant)',
    complexity: 1,
    steps: [{ interval: '5P', quality: '7sus4', role: 'V7sus4' }],
    moods: ['modal', 'jazz', 'gospel', 'cinematic'],
    genres: ['Modal Jazz', 'Gospel', 'Soul', 'Film Score', 'Fusion'],
    theory: 'The 7sus4 chord omits the 3rd and replaces it with the 4th. Because there is no 3rd, the chord is neither major nor minor — it\'s harmonically ambiguous. The "magic rule": G7sus4 = Dm7/G (the ii7 chord with the V in the bass). This fusion of ii and V functions in one chord creates a floating, unresolved tension.',
    tip: 'The ambiguity of sus4 means you can resolve to major OR minor — or even sidestep to an unrelated chord entirely. Use it as a "gateway" before deciding where to go. A sus chord at the end of a phrase opens a door; the next chord walks through it.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'vsus4-then-V7',
    name: 'V7sus4 → V7 (Suspension Resolution)',
    complexity: 2,
    steps: [
      { interval: '5P', quality: '7sus4', role: 'V7sus4' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['jazz', 'gospel', 'modal', 'classical'],
    genres: ['Jazz', 'Gospel', 'Soul', 'Classical', 'Bossa Nova'],
    theory: 'The suspended 4th delays the tritone of the dominant, creating a "held breath" effect. The sus4 then moves down by a half-step to the major 3rd of V7, releasing the suspension before the final resolution to I. This two-stage dominant is one of the most elegant cadential gestures in jazz.',
    tip: 'Rhythm matters here: give the sus4 the first half of the bar (or phrase), and resolve to V7 on the last beat. Then land on I on beat 1 of the next bar. G7sus4 | G7 → C is the classic gospel/jazz pattern. Use rootless voicings: Dm7 voicing / G bass → G7 shell.',
    worksFor: ['major', 'minor', 'any'],
  },
  {
    id: 'vsusb9-then-V7alt',
    name: 'V7sus4(b9) → V7alt (Colored Sus)',
    complexity: 3,
    steps: [
      { interval: '5P', quality: '7sus4', role: 'V7sus4(b9)' },
      { interval: '5P', quality: '7alt', role: 'V7alt' },
    ],
    moods: ['jazz', 'chromatic', 'experimental'],
    genres: ['Modern Jazz', 'Post-Bop', 'Fusion', 'Contemporary'],
    theory: 'The sus4 chord is colored with a b9 (the note a half-step above the root), turning G7sus4 into a chord that contains G, Ab, C, F — essentially a Db/G (Db major triad over G bass). This generates maximum ambiguity: the ear hears both the suspension AND the altered tension before the V7alt then resolves to I.',
    tip: 'One of the "4 colors of the ii-V" from advanced jazz pedagogy. The sus4(b9) can be voiced as: bass on V, upper structure = bII major triad. G7sus4(b9) = G in bass + Db major triad (Db, F, Ab). Resolves to G7alt (#9, b13) → I.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'relative-ii-of-subv',
    name: 'Relative ii of SubV (Abm7–Db7)',
    complexity: 3,
    steps: [
      { interval: '6m', quality: 'm7', role: 'ii of SubV' },
      { interval: '2m', quality: '7', role: 'SubV (bII7)' },
    ],
    moods: ['jazz', 'chromatic'],
    genres: ['Jazz', 'Bebop', 'Fusion', 'Bossa Nova'],
    theory: 'The SubV (bII7 = Db7 for target C) can be preceded by its own ii chord — the minor 7th a perfect 4th below it (Abm7). This creates a proper ii–V cadence that resolves via tritone sub rather than a 5th. Compared to the tritone ii-V (Ebm7b5 → Db7), this version uses a regular m7 chord, giving a smoother, less dissonant color.',
    tip: 'The bass moves: Ab → Db → C (a descending minor 3rd then a half-step). This is less angular than the tritone ii-V version. Use when you want the chromatic bass motion but without the "outside" half-diminished color.',
    worksFor: ['major', 'any'],
  },
  // ── Jeff Schneider concepts ───────────────────────────────────────────────────
  {
    id: 'float-chord',
    name: 'Float Chord (IVmaj7/V)',
    complexity: 2,
    steps: [{ interval: '5P', quality: '13sus', role: 'V13sus (IVmaj7/V)' }],
    moods: ['jazz', 'r&b', 'modal'],
    genres: ['R&B', 'Neo-Soul', 'Jazz Fusion', 'Contemporary', 'Funk'],
    theory: 'The float chord is a IVmaj7 chord voiced over the V bass note. In key of C: Fmaj7 with G in the bass = G13sus (G–C–E–A). The chord has no 3rd — just stacked perfect intervals — creating an open, suspended quality. It replaces the heavier V7 with a lighter, more ambiguous dominant texture. Formula: float chord = IV chord of the destination key, played over the V bass.',
    tip: 'Think Fmaj7/G before landing on Cmaj7. Alter it for color: add Ab (G13b9sus) or swap E for Eb (G13b9b13sus). For soloing, use G mixolydian or alternate between F major and G major triads. The float chord also works as a vamp for distant modulation — hold it and slip to a new key.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'float-chord-altered',
    name: 'Float Chord Altered (bIVmaj7/V)',
    complexity: 3,
    steps: [{ interval: '5P', quality: '7sus4', role: 'V13b9sus (altered float)' }],
    moods: ['jazz', 'r&b', 'chromatic', 'experimental'],
    genres: ['Contemporary Jazz', 'Fusion', 'Neo-Soul'],
    theory: 'Altering the float chord (G13sus) by lowering the 13th (E→Eb) or adding a b9 (Ab) turns it from a cool suspension into a tense altered dominant. G13b9b13sus contains G–Ab–C–Eb–A — overlapping with the altered scale. The chord still has the characteristic "floated" IVmaj7 structure but now with chromatic tension.',
    tip: 'Use this when you want more tension before landing. The b9 (Ab over G bass) is the key color note — it creates a direct half-step voice-lead to the major 3rd (E) of the target Cmaj7. Works beautifully at medium-slow tempos in a jazz-R&B ballad context.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'minor-to-major',
    name: 'Minor-to-Major Trick (vi→VI7→dim)',
    complexity: 3,
    steps: [
      { interval: '5P', quality: 'm7',  role: 'vim7' },
      { interval: '5P', quality: '7',   role: 'VI7 (borrowed dom.)' },
      { interval: '7M', quality: 'dim7', role: '#vii°7 (passing dim)' },
    ],
    moods: ['jazz', 'r&b', 'gospel'],
    genres: ['R&B', 'Gospel', 'Soul', 'Neo-Soul', 'Jazz Ballad'],
    theory: 'The vi minor chord is "majorized" to VI7 — raising its minor 3rd to create a secondary dominant. This chromatic shift is the moment of surprise. A passing diminished chord (built a half-step below the target root) then connects with voice-leading tension. In key of C targeting Dm7: Am7 → A7 → C#dim7 → Dm7. The C#dim7 is the "money chord" — maximum chromatic tension before resolution.',
    tip: 'Let the A7 ring — the shift from Am7 to A7 is the magic moment. Insert a G/B (V chord, first inversion) between A7 and C#dim7 for a bass walkup: Am7 → A7 → G/B → C#dim7 → Dm7. Works best approaching minor chords (like ii minor or iv). For extra drama, add a Bdim7 for one more step of tension before the final landing.',
    worksFor: ['minor', 'any'],
  },
  {
    id: 'secondary-subdominant',
    name: 'Secondary Subdominant (IV of destination)',
    complexity: 2,
    steps: [{ interval: '4P', quality: 'm7', role: 'ivm7 (IV of target)' }],
    moods: ['jazz', 'r&b', 'gospel', 'modal'],
    genres: ['R&B', 'Gospel', 'Soul', 'Jazz', 'Funk'],
    theory: 'Any chord can be prepared by its own IV chord — not the IV of the home key, but the IV of the specific chord you\'re landing on. Going to Dm7? Use Gm7 (IV of D minor). Going to G7? Use Cm7 (IV of G). This is the secondary subdominant: the subdominant function applies to any destination chord, not just the tonic. It creates a gentle, almost inevitable pull toward the target.',
    tip: 'Think of this as "IV of wherever you\'re going." The motion Gm7 → Dm7 is essentially the same gravitational pull as Fm → C — a minor plagal cadence applied to any chord in the progression. Works especially beautifully in gospel and R&B when the destination is a major chord: Am7 → Emaj7 has the same amen quality as Fm → C.',
    worksFor: ['any'],
  },
  {
    id: 'ii-V-of-iii-surprise',
    name: 'ii–V of III → I (Surprise Major)',
    complexity: 4,
    steps: [
      { interval: '4A', quality: 'm7b5', role: '#ivø7 (ii of III)' },
      { interval: '7M', quality: '7',    role: 'VII7 (V of III)' },
    ],
    moods: ['jazz', 'cinematic', 'experimental'],
    genres: ['Post-Bop', 'Modern Jazz', 'Fusion', 'Contemporary'],
    theory: 'F#ø7 → B7 is a ii–V cadence that normally resolves to Em (the III of C major). But Em shares three notes with Cmaj7 (E, G, B), so landing on Cmaj instead of Em creates a beautiful "false resolution" — the ear expects minor but gets major. A dramatic deceptive cadence with a happy ending.',
    tip: 'The surprise works best when you really commit to the "minor arrival" feeling on the B7 (use b9, b13 — Phrygian dominant color), then suddenly land on a bright Cmaj7 or C6/9. The contrast is the whole point. Used in jazz reharmonization to turn "sad" passages into unexpected moments of light.',
    worksFor: ['major', 'any'],
  },
];

// ─── Helper functions ──────────────────────────────────────────────────────────
function getTargetCategory(quality: string): string {
  const major = ['', 'maj7', 'maj9', 'maj7#11', '6', '6/9', 'add9'];
  const minor = ['m', 'm7', 'm9', 'm6', 'm6/9', 'mM7', 'm11'];
  const dominant = ['7', '9', '13', '7b9', '7#9', '7#11', '7alt', '7sus4'];
  const suspended = ['sus2', 'sus4'];
  if (major.includes(quality)) return 'major';
  if (minor.includes(quality)) return 'minor';
  if (dominant.includes(quality)) return 'dominant';
  if (suspended.includes(quality)) return 'suspended';
  if (quality === 'm7b5') return 'halfdiminished';
  if (quality === 'dim' || quality === 'dim7') return 'diminished';
  if (quality === 'aug' || quality === 'augM7') return 'augmented';
  return 'major';
}

function approachMatchesTarget(approach: Approach, targetQuality: string): boolean {
  if (approach.worksFor.includes('any')) return true;
  const cat = getTargetCategory(targetQuality);
  // suspended targets are neither major nor minor — show 'any' approaches only
  if (cat === 'suspended') return approach.worksFor.includes('any');
  return approach.worksFor.some(w =>
    w === cat ||
    (w === 'major' && cat === 'dominant') ||
    (w === 'major' && (cat === 'halfdiminished' || cat === 'diminished' || cat === 'augmented'))
  );
}

function getChain(approach: Approach, targetRoot: string, targetQuality: string): { chord: string; role: string; isTarget: boolean }[] {
  const steps = approach.steps.map(step => {
    const root = Note.transpose(targetRoot, step.interval) || targetRoot;
    return { chord: root + step.quality, role: step.role, isTarget: false };
  });
  steps.push({ chord: targetRoot + (targetQuality || ''), role: 'Target', isTarget: true });
  return steps;
}

function complexityDots(n: number, color: string): JSX.Element {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: i <= n ? color : '#2d333b',
          }}
        />
      ))}
    </span>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function ChordChainViz({ chain, accentColor }: {
  chain: { chord: string; role: string; isTarget: boolean }[];
  accentColor: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {chain.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: item.isTarget ? accentColor : '#1c2128',
              border: `1px solid ${item.isTarget ? accentColor : '#30363d'}`,
              fontFamily: "'DM Mono', monospace",
              fontSize: 15,
              fontWeight: 500,
              color: item.isTarget ? '#fff' : '#e6edf3',
              letterSpacing: '-0.3px',
              boxShadow: item.isTarget ? `0 0 12px ${accentColor}55` : 'none',
              minWidth: 52,
              textAlign: 'center',
            }}>
              {item.chord}
            </div>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: item.isTarget ? accentColor : '#6b7280',
              letterSpacing: '0.5px',
            }}>
              {item.role}
            </span>
          </div>
          {i < chain.length - 1 && (
            <span style={{ color: '#4b5563', fontSize: 16, marginBottom: 14 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ApproachCard({ approach, targetRoot, targetQuality, isExpanded, onToggle }: {
  approach: Approach;
  targetRoot: string;
  targetQuality: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const chain = getChain(approach, targetRoot, targetQuality);
  const color = COMPLEXITY_COLORS[approach.complexity];

  return (
    <div style={{
      background: '#161b22',
      border: `1px solid ${isExpanded ? color + '55' : '#21262d'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: '16px 18px',
      cursor: 'pointer',
      transition: 'border-color 0.15s, background 0.15s',
    }}
      onClick={onToggle}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {approach.name}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#6b7280',
              background: '#1c2128',
              border: '1px solid #30363d',
              borderRadius: 4,
              padding: '2px 7px',
            }}>
              {approach.steps.length} {approach.steps.length === 1 ? 'step' : 'steps'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {complexityDots(approach.complexity, color)}
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#4b5563' }}>
              complexity {approach.complexity}/5
            </span>
            {approach.moods.map(m => (
              <span key={m} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: color,
                background: color + '18',
                borderRadius: 4,
                padding: '1px 6px',
                border: `1px solid ${color}30`,
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>
        <span style={{ color: '#6b7280', fontSize: 13, flexShrink: 0, paddingTop: 2 }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Chord chain */}
      <ChordChainViz chain={chain} accentColor={color} />

      {/* Genres */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {approach.genres.map(g => (
          <span key={g} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: '#8b949e',
            background: '#1c2128',
            border: '1px solid #30363d',
            borderRadius: 4,
            padding: '2px 7px',
          }}>
            {g}
          </span>
        ))}
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{ marginTop: 16, borderTop: '1px solid #21262d', paddingTop: 16 }} onClick={e => e.stopPropagation()}>
          <div style={{
            background: '#0d1117',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 12,
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: color,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Theory
            </div>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#c9d1d9',
              lineHeight: 1.7,
              margin: 0,
            }}>
              {approach.theory}
            </p>
          </div>
          <div style={{
            background: color + '10',
            border: `1px solid ${color}30`,
            borderRadius: 8,
            padding: '14px 16px',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: color,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Performance tip
            </div>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#c9d1d9',
              lineHeight: 1.7,
              margin: 0,
              fontStyle: 'italic',
            }}>
              {approach.tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ChordLandingFeature() {
  const [targetRoot, setTargetRoot] = useState('G');
  const [targetQuality, setTargetQuality] = useState('maj7');
  const [maxSteps, setMaxSteps] = useState(5);
  const [maxComplexity, setMaxComplexity] = useState(5);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return APPROACHES
      .filter(a => a.steps.length <= maxSteps)
      .filter(a => a.complexity <= maxComplexity)
      .filter(a => !activeMood || a.moods.includes(activeMood))
      .filter(a => approachMatchesTarget(a, targetQuality))
      .sort((a, b) => a.complexity - b.complexity || a.steps.length - b.steps.length);
  }, [maxSteps, maxComplexity, activeMood, targetQuality]);

  const targetChord = targetRoot + targetQuality;
  const targetCat = getTargetCategory(targetQuality);

  const btnStyle = (active: boolean, color = '#7c3aed') => ({
    padding: '6px 14px',
    borderRadius: 6,
    border: `1px solid ${active ? color : '#30363d'}`,
    background: active ? color + '22' : 'transparent',
    color: active ? color : '#8b949e',
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.12s',
    fontWeight: active ? 500 : 400,
  } as React.CSSProperties);

  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      background: '#0d1117',
      minHeight: '100vh',
      color: '#e6edf3',
    }}>
      {/* Header */}
      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          color: '#e6edf3',
          margin: '0 0 6px',
        }}>
          Chord Landing Planner
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
          Choose a target chord and discover how to approach it — from a single dominant to advanced chromatic sequences.
        </p>
      </div>

      {/* Target chord selector */}
      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: '#8b949e',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          Target Chord
        </div>

        {/* Preview */}
        <div style={{
          display: 'inline-block',
          background: '#7c3aed',
          borderRadius: 8,
          padding: '8px 20px',
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.5px',
          marginBottom: 18,
          boxShadow: '0 0 20px #7c3aed55',
        }}>
          {targetChord || targetRoot}
        </div>

        {/* Root selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>ROOT</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {NOTES.map(n => (
              <button
                key={n}
                onClick={() => setTargetRoot(n)}
                style={{
                  ...btnStyle(targetRoot === n),
                  minWidth: 40,
                  textAlign: 'center',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Quality selector */}
        <div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>QUALITY</div>
          {(['major', 'minor', 'dominant', 'suspended', 'halfdiminished', 'diminished', 'augmented'] as const).map(cat => {
            const catQualities = QUALITIES.filter(q => q.cat === cat);
            if (!catQualities.length) return null;
            const catColor =
              cat === 'major' ? '#10b981' :
              cat === 'minor' ? '#06b6d4' :
              cat === 'dominant' ? '#f59e0b' :
              cat === 'suspended' ? '#a78bfa' :
              '#ef4444';
            return (
              <div key={cat} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: catColor, minWidth: 80, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {cat}
                </span>
                {catQualities.map(q => (
                  <button
                    key={q.value}
                    onClick={() => setTargetQuality(q.value)}
                    style={btnStyle(targetQuality === q.value, catColor)}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 10,
        padding: '18px 24px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        alignItems: 'flex-start',
      }}>
        {/* Max steps */}
        <div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>MAX APPROACH STEPS</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setMaxSteps(n)}
                style={btnStyle(maxSteps === n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Max complexity */}
        <div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>MAX COMPLEXITY</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setMaxComplexity(n)}
                style={btnStyle(maxComplexity === n, COMPLEXITY_COLORS[n])}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Mood filter */}
        <div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>MOOD / STYLE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => setActiveMood(null)}
              style={btnStyle(activeMood === null)}
            >
              All
            </button>
            {ALL_MOODS.map(m => (
              <button
                key={m}
                onClick={() => setActiveMood(activeMood === m ? null : m)}
                style={btnStyle(activeMood === m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#6b7280' }}>
          {filtered.length} approach{filtered.length !== 1 ? 'es' : ''} to{' '}
          <span style={{ color: '#7c3aed', fontWeight: 500 }}>{targetChord || targetRoot}</span>
        </span>
        {targetCat !== 'major' && targetCat !== 'any' && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: '#f59e0b',
            background: '#f59e0b18',
            border: '1px solid #f59e0b30',
            borderRadius: 4,
            padding: '2px 7px',
          }}>
            {targetCat} target — some approaches filtered
          </span>
        )}
      </div>

      {/* Approach legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 16, background: COMPLEXITY_COLORS[n], borderRadius: 2 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280' }}>
              {n === 1 ? 'Beginner' : n === 2 ? 'Intermediate' : n === 3 ? 'Advanced' : n === 4 ? 'Expert' : 'Virtuoso'}
            </span>
          </div>
        ))}
      </div>

      {/* Approach cards */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 10,
          padding: '40px 24px',
          textAlign: 'center',
          color: '#4b5563',
          fontFamily: "'DM Mono', monospace",
          fontSize: 14,
        }}>
          No approaches match the current filters. Try increasing the max steps or complexity.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(approach => (
            <ApproachCard
              key={approach.id}
              approach={approach}
              targetRoot={targetRoot}
              targetQuality={targetQuality}
              isExpanded={expandedId === approach.id}
              onToggle={() => setExpandedId(expandedId === approach.id ? null : approach.id)}
            />
          ))}
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 32,
        padding: '16px 20px',
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 10,
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        color: '#4b5563',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: '#6b7280' }}>How to read the chord chains:</strong>{' '}
        All chords left of the arrow are approach chords; the{' '}
        <span style={{ color: '#7c3aed' }}>highlighted chord</span> on the right is your target.
        Steps shown are the maximum — you can also use the final 1 or 2 chords of any sequence as a shorter approach.
        Expand any card for the theory explanation and a performance tip.
      </div>
    </div>
  );
}

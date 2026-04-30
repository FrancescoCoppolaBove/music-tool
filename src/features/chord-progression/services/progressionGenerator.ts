import {
  noteToSemitone,
  semitoneToNote,
  notePreferFlat,
  getChordNotes,
  DEGREE_SEMITONE,
  MAJOR_DIATONIC_QUALITY,
} from '@shared/utils/musicTheory';
import type {
  ProgressionTemplate,
  ProgressionChord,
  GeneratedProgression,
  ResolvedChord,
  HarmonyStyle,
  Technique,
} from '../types/progression.types';

// ─── Progression Template Library ────────────────────────────────────────────
// Each template uses Roman numeral degrees + quality overrides.
// 'diatonic' quality means use the natural major key quality.

const TEMPLATES: ProgressionTemplate[] = [
  // ── CLASSIC / TONAL ──────────────────────────────────────────────────────
  {
    id: 'ii-V-I',
    name: 'ii–V–I',
    chords: [
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'The most fundamental jazz cadence. ii–V–I in major key.',
    artists: ['Charlie Parker', 'Bill Evans', 'Coltrane', 'Earth Wind & Fire'],
    feel: 'Jazz resolution',
    lengths: [3],
  },
  {
    id: 'ii-V-I-IV',
    name: 'ii–V–I–IV',
    chords: [
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Expanded ii–V–I with added IV — common in jazz and neo-soul.',
    artists: ['Tom Misch', 'Yellow Jackets', 'Pat Metheny'],
    feel: 'Neo-soul jazz groove',
    lengths: [4],
  },
  {
    id: 'I-vi-IV-V',
    name: 'I–vi–IV–V (50s)',
    chords: [
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Classic 50s pop / doo-wop progression. Universally singable.',
    artists: ['Earth Wind & Fire', 'Tom Misch'],
    feel: 'Timeless pop',
    lengths: [4],
  },
  {
    id: 'I-IV-V',
    name: 'I–IV–V',
    chords: [
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Tonic–Subdominant–Dominant. The bedrock of Western tonality.',
    artists: ['Lettuce', 'Earth Wind & Fire'],
    feel: 'Funky tonal',
    lengths: [3],
  },
  {
    id: 'iii-VI-ii-V',
    name: 'iii–VI–ii–V (Turnaround)',
    chords: [
      { degree: 'III', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'II',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Classic jazz turnaround — descending cycle of 5ths leading back to I.',
    artists: ['Charlie Parker', 'Bill Evans', 'Weather Report'],
    feel: 'Jazz turnaround',
    lengths: [4],
  },
  {
    id: 'I-V-vi-IV',
    name: 'I–V–vi–IV',
    chords: [
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Modern pop axis. Extremely versatile — works with jazz extensions.',
    artists: ['Tom Misch', 'Radiohead', 'Lettuce'],
    feel: 'Modern anthemic',
    lengths: [4],
  },
  {
    id: 'iii-vi-ii-V-I',
    name: 'iii–VI–ii–V–I (Full Turnaround)',
    chords: [
      { degree: 'III', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'II',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Full descending 5ths turnaround resolving to tonic. Standard jazz vocabulary.',
    artists: ['Yellow Jackets', 'Weather Report', 'Bill Evans'],
    feel: 'Full jazz cycle',
    lengths: [5],
  },
  {
    id: 'I-vi-ii-V',
    name: 'I–vi–ii–V',
    chords: [
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'I–vi–ii–V loop. Foundation of jazz standards and bop heads.',
    artists: ['Coltrane', 'Miles Davis', 'Yellow Jackets'],
    feel: 'Jazz standard loop',
    lengths: [4],
  },
  {
    id: 'I-IV-I-V',
    name: 'I–IV–I–V',
    chords: [
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Blues-adjacent tonal movement. Very groovy with extensions.',
    artists: ['Lettuce', 'Nate Smith', 'Ghost Notes'],
    feel: 'Groove-oriented tonal',
    lengths: [4],
  },
  {
    id: 'ii-V-I-VI-ii-V',
    name: 'ii–V–I–VI–ii–V (Rhythm Changes A)',
    chords: [
      { degree: 'II',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: '7',        function: 'Dominant',    technique: 'secondary_dominant', annotation: 'V/ii', techniqueLabel: 'Secondary Dominant' },
      { degree: 'II',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic', 'secondary_dominant'],
    description: 'Rhythm Changes A section — Gershwin "I Got Rhythm". Foundation of bebop.',
    artists: ['Charlie Parker', 'Dizzy Gillespie', 'Yellow Jackets'],
    feel: 'Bebop / Rhythm changes',
    lengths: [6],
  },

  // ── MODERN / JAZZ ADVANCED ────────────────────────────────────────────────
  {
    id: 'modal-interchange-iv',
    name: 'I–IV–iv–I (Modal Interchange)',
    chords: [
      { degree: 'I',  quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV', quality: 'm7',   function: 'Color',       technique: 'modal_interchange', annotation: 'iv from parallel minor', techniqueLabel: 'Modal Interchange' },
      { degree: 'I',  quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Borrow iv minor from parallel minor — creates beautiful dark → light motion.',
    artists: ['Radiohead', 'Tom Misch', 'Jacob Collier', 'Bill Evans'],
    feel: 'Modal color shift',
    lengths: [4],
  },
  {
    id: 'backdoor',
    name: 'I–bVII–IV–I (Backdoor)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'backdoor', annotation: '♭VII7 Backdoor Dominant', techniqueLabel: 'Backdoor Dominant' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['backdoor'],
    description: '♭VII7 is the "backdoor dominant" — approaches tonic from a half-step above bass. Rock/jazz fusion staple.',
    artists: ['Snarky Puppy', 'Ghost Notes', 'Lettuce', 'Tom Misch'],
    feel: 'Funky backdoor',
    lengths: [4],
  },
  {
    id: 'tritone-sub-cadence',
    name: 'ii–SubV–I (Tritone Sub)',
    chords: [
      { degree: 'II',  quality: 'm7',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bII', quality: '7',   function: 'Dominant',    technique: 'tritone_sub', annotation: '♭II7 = SubV (tritone sub for V)', techniqueLabel: 'Tritone Substitution' },
      { degree: 'I',   quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['tritone_sub'],
    description: 'Replace V7 with ♭II7 (tritone away). The bass moves chromatically: ♭2 → 1. Classic jazz reharmonization.',
    artists: ['Charlie Parker', 'Herbie Hancock', 'Brad Mehldau', 'Jacob Collier'],
    feel: 'Sophisticated jazz reharmonization',
    lengths: [3],
  },
  {
    id: 'ii-subV-I-IV',
    name: 'ii–SubV–I–IV',
    chords: [
      { degree: 'II',  quality: 'm7',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bII', quality: '13',  function: 'Dominant',    technique: 'tritone_sub', annotation: '♭II13 SubV', techniqueLabel: 'Tritone Substitution' },
      { degree: 'I',   quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',  quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['tritone_sub', 'diatonic'],
    description: 'Extended SubV cadence with jazzy chord qualities.',
    artists: ['Herbie Hancock', 'Snarky Puppy', 'Yellow Jackets'],
    feel: 'Modern jazz sophistication',
    lengths: [4],
  },
  {
    id: 'secondary-dominants-chain',
    name: 'V/V–V–I (Secondary Dominant Chain)',
    chords: [
      { degree: 'II',  quality: '7',   function: 'Dominant',    technique: 'secondary_dominant', annotation: 'V/V = II7', techniqueLabel: 'Secondary Dominant' },
      { degree: 'V',   quality: '7',   function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['secondary_dominant'],
    description: 'II7 is V of V — each chord pulls strongly to the next. Creates forward momentum.',
    artists: ['Earth Wind & Fire', 'Yellow Jackets', 'Lettuce'],
    feel: 'Pulling chain resolution',
    lengths: [3],
  },
  {
    id: 'modal-dorian-vamp',
    name: 'i–IV (Dorian Vamp)',
    chords: [
      { degree: 'I',  quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: '7',    function: 'Subdominant', technique: 'modal_interchange', annotation: 'IV7 from Dorian — raised 6th', techniqueLabel: 'Modal (Dorian)' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Classic Dorian vamp: im7–IV7. The IV7 chord comes from Dorian mode (raised 6th creates major IV). Miles Davis "So What" style.',
    artists: ['Miles Davis', 'Snarky Puppy', 'Yussef Dayes', 'Ghost Notes'],
    feel: 'Modal jazz vamp',
    lengths: [2],
  },
  {
    id: 'quartal-vamp',
    name: 'Quartal Vamp (Modal)',
    chords: [
      { degree: 'I',  quality: 'quartal', function: 'Tonic', technique: 'quartal', annotation: 'Quartal chord — stacked 4ths', techniqueLabel: 'Quartal Harmony' },
      { degree: 'II', quality: 'quartal', function: 'Color',  technique: 'quartal', annotation: 'Quartal chord on II', techniqueLabel: 'Quartal Harmony' },
    ],
    style: 'modern', techniques: ['quartal'],
    description: 'Quartal harmony vamp — ambiguous, modal, open. McCoy Tyner, Herbie Hancock, Bill Evans.',
    artists: ['McCoy Tyner', 'Herbie Hancock', 'Yussef Dayes', 'Snarky Puppy'],
    feel: 'Open modal ambiguity',
    lengths: [2],
  },
  {
    id: 'sus-resolution',
    name: 'Vsus4–V–I (SUS Resolution)',
    chords: [
      { degree: 'V', quality: '7sus4', function: 'Dominant',  technique: 'sus', annotation: 'Sus4 creates tension without leading tone', techniqueLabel: 'Suspended Chord' },
      { degree: 'V', quality: '7',     function: 'Dominant',  technique: 'diatonic' },
      { degree: 'I', quality: 'maj7',  function: 'Tonic',     technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['sus'],
    description: 'Sus4 chord delays resolution — feels like Herbie Hancock, ECM jazz, or gospel-influenced jazz.',
    artists: ['Herbie Hancock', 'Snarky Puppy', 'Jacob Collier', 'Tom Misch'],
    feel: 'Suspended anticipation',
    lengths: [3],
  },
  {
    id: 'snarky-groove',
    name: 'I–bIII–IV–bVII (Snarky Puppy Style)',
    chords: [
      { degree: 'I',    quality: 'maj9',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bIII', quality: 'maj7',  function: 'Color',       technique: 'modal_interchange', annotation: '♭III borrowed from parallel minor', techniqueLabel: 'Modal Interchange' },
      { degree: 'IV',   quality: 'maj7',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: '7sus4', function: 'Color',       technique: 'backdoor', annotation: '♭VII7sus4 Backdoor + Sus', techniqueLabel: 'Backdoor + Sus' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'backdoor', 'sus'],
    description: 'Signature Snarky Puppy/Ghost Notes sound: major ninth tonic, borrowed ♭III, Lydian IV, backdoor sus dominant.',
    artists: ['Snarky Puppy', 'Ghost Notes', 'Lettuce'],
    feel: 'Contemporary jazz-funk groove',
    lengths: [4],
  },
  {
    id: 'radiohead-chromatic',
    name: 'I–bVII–bVI–V (Chromatic Descent)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',    technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj7', function: 'Color',    technique: 'modal_interchange', annotation: '♭VII from Mixolydian/Aeolian', techniqueLabel: 'Modal Interchange' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',    technique: 'modal_interchange', annotation: '♭VI borrowed from parallel minor', techniqueLabel: 'Modal Interchange' },
      { degree: 'V',    quality: '7',    function: 'Dominant', technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'chromatic'],
    description: 'Chromatic descending sequence borrowing ♭VII and ♭VI from Aeolian. Very Radiohead, David Bowie, or modern ambient.',
    artists: ['Radiohead', 'Thom Yorke', 'Tom Misch'],
    feel: 'Cinematic chromatic descent',
    lengths: [4],
  },
  {
    id: 'jacob-collier-cluster',
    name: 'I–♭VI–♭III–♭VII (Chromatic Mediant)',
    chords: [
      { degree: 'I',    quality: 'maj9',  function: 'Tonic', technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7',  function: 'Color', technique: 'chromatic', annotation: 'Chromatic mediant — third-relationship', techniqueLabel: 'Chromatic Mediant' },
      { degree: 'bIII', quality: 'maj9',  function: 'Color', technique: 'chromatic', annotation: 'Chromatic mediant chain', techniqueLabel: 'Chromatic Mediant' },
      { degree: 'bVII', quality: 'maj7',  function: 'Color', technique: 'chromatic', annotation: 'Chromatic mediant chain', techniqueLabel: 'Chromatic Mediant' },
    ],
    style: 'modern', techniques: ['chromatic', 'modal_interchange'],
    description: 'Chromatic mediant movement — chords related by major/minor thirds with chromatic shift. Jacob Collier, Wayne Shorter, late-Coltrane.',
    artists: ['Jacob Collier', 'Wayne Shorter', 'Radiohead'],
    feel: 'Hyper-chromatic color cascade',
    lengths: [4],
  },
  {
    id: 'weather-report-modal',
    name: 'Imaj7–IVmaj7–♭VIImaj7–♭IIImaj7 (Major 3rd Cycle)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic', technique: 'chromatic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color', technique: 'chromatic', annotation: 'Major third below', techniqueLabel: 'Chromatic Mediant' },
      { degree: 'bIII', quality: 'maj7', function: 'Color', technique: 'chromatic', annotation: 'Major third below', techniqueLabel: 'Chromatic Mediant' },
      { degree: 'bVII', quality: 'maj7', function: 'Color', technique: 'chromatic', annotation: 'Major third below', techniqueLabel: 'Chromatic Mediant' },
    ],
    style: 'modern', techniques: ['chromatic'],
    description: 'Cycling through all maj7 chords a major 3rd apart — Wayne Shorter, Weather Report, ECM jazz. Ambiguous tonal center.',
    artists: ['Weather Report', 'Wayne Shorter', 'Joe Zawinul', 'Jacob Collier'],
    feel: 'Ambient modal floating',
    lengths: [4],
  },
  {
    id: 'yussef-dayes-groove',
    name: 'im7–IV7–im7–♭VII7 (UK Jazz Dorian)',
    chords: [
      { degree: 'I',    quality: 'm9',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',   quality: '7',    function: 'Subdominant', technique: 'modal_interchange', annotation: 'IV7 from Dorian mode', techniqueLabel: 'Modal (Dorian)' },
      { degree: 'I',    quality: 'm9',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'backdoor', annotation: '♭VII7 Backdoor', techniqueLabel: 'Backdoor' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'backdoor'],
    description: 'Yussef Dayes / UK Jazz style: Dorian groove with backdoor dominant. Hypnotic modal vamp.',
    artists: ['Yussef Dayes', 'Tom Misch', 'Nate Smith', 'Snarky Puppy'],
    feel: 'UK jazz broken-beat groove',
    lengths: [4],
  },
  {
    id: 'earth-wind-funk',
    name: 'Imaj9–IIm11–V13–I (EWF Extended)',
    chords: [
      { degree: 'I',  quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II', quality: 'm11',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: '13',   function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',  quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic'],
    description: 'Earth Wind & Fire / R&B jazz style: lush extensions on every chord (maj9, m11, 13). Sophisticated but funky.',
    artists: ['Earth Wind & Fire', 'Lettuce', 'Yellow Jackets'],
    feel: 'Lush funk-soul with extensions',
    lengths: [4],
  },
  {
    id: 'coltrane-changes-inspired',
    name: 'I–♭VI–IV–♭II (Coltrane-Inspired)',
    chords: [
      { degree: 'I',   quality: 'maj7', function: 'Tonic', technique: 'diatonic' },
      { degree: 'bVI', quality: 'maj7', function: 'Color', technique: 'chromatic', annotation: 'Major 3rd down — Coltrane movement', techniqueLabel: 'Coltrane Changes' },
      { degree: 'IV',  quality: 'maj7', function: 'Color', technique: 'chromatic', annotation: 'Major 3rd down', techniqueLabel: 'Coltrane Changes' },
      { degree: 'bII', quality: 'maj7', function: 'Color', technique: 'chromatic', annotation: 'Major 3rd down — completes tritone', techniqueLabel: 'Coltrane Changes' },
    ],
    style: 'modern', techniques: ['chromatic'],
    description: 'Inspired by Coltrane Changes (Giant Steps) — three tonal centers a major third apart, each with its own ii–V.',
    artists: ['John Coltrane', 'Wayne Shorter', 'Yellow Jackets', 'Jacob Collier'],
    feel: 'Rapid tonal center cycling',
    lengths: [4],
  },
  {
    id: 'sus-jazz-modern',
    name: 'IIsus2–Vsus4–I–IVmaj7#11 (Modern SUS)',
    chords: [
      { degree: 'II', quality: 'sus2',   function: 'Subdominant', technique: 'sus', annotation: 'Sus2 — open, ambiguous sound', techniqueLabel: 'Suspended' },
      { degree: 'V',  quality: '7sus4',  function: 'Dominant',    technique: 'sus', annotation: '7sus4 — dominant without leading tone', techniqueLabel: 'Suspended' },
      { degree: 'I',  quality: 'maj9',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'maj7#11', function: 'Subdominant', technique: 'diatonic', annotation: 'Lydian color (#11)', techniqueLabel: 'Lydian' },
    ],
    style: 'modern', techniques: ['sus', 'diatonic'],
    description: 'Modern jazz with sus chords and Lydian color. Herbie Hancock, Snarky Puppy, ECM Records style.',
    artists: ['Herbie Hancock', 'Snarky Puppy', 'Tom Misch', 'Jacob Collier'],
    feel: 'Contemporary floating harmony',
    lengths: [4],
  },
  {
    id: 'nate-smith-groove',
    name: 'im7–♭III maj7–♭VII7–IV7 (Minor Groove)',
    chords: [
      { degree: 'I',    quality: 'm9',   function: 'Tonic',  technique: 'diatonic' },
      { degree: 'bIII', quality: 'maj7', function: 'Color',  technique: 'modal_interchange', annotation: '♭III from parallel major', techniqueLabel: 'Modal Interchange' },
      { degree: 'bVII', quality: '7',    function: 'Color',  technique: 'backdoor', annotation: '♭VII7 Backdoor', techniqueLabel: 'Backdoor' },
      { degree: 'IV',   quality: '7',    function: 'Subdominant', technique: 'modal_interchange', annotation: 'IV7 from Dorian', techniqueLabel: 'Modal (Dorian)' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'backdoor'],
    description: 'Minor groove with borrowed colors — ♭III, backdoor dominant, Dorian IV7. Nate Smith / Ghost Notes style.',
    artists: ['Nate Smith', 'Ghost Notes', 'Snarky Puppy', 'Lettuce'],
    feel: 'Funk-infused minor groove',
    lengths: [4],
  },
  {
    id: 'long-jazz-form',
    name: 'Imaj7–VIm7–IIm7–V7–IIIm7–VI7–IIm7–V7 (8-bar Jazz)',
    chords: [
      { degree: 'I',   quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II',  quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: '7',    function: 'Dominant',    technique: 'diatonic' },
      { degree: 'III', quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', annotation: 'V/ii', techniqueLabel: 'Secondary Dominant' },
      { degree: 'II',  quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: '7',    function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic', 'secondary_dominant'],
    description: 'Full 8-bar jazz form with turnaround. Jazz standard structure with a secondary dominant VI7 (V/ii).',
    artists: ['Bill Evans', 'Charlie Parker', 'Yellow Jackets'],
    feel: 'Full jazz standard form',
    lengths: [8],
  },
  {
    id: 'modal-interchange-extended',
    name: 'I–♭VII–♭III–IV–im–♭VI–♭VII–I (Full Modal Interchange)',
    chords: [
      { degree: 'I',    quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VII from Mixolydian', techniqueLabel: 'Modal Interchange' },
      { degree: 'bIII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭III from Aeolian', techniqueLabel: 'Modal Interchange' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',    quality: 'm7',   function: 'Color',       technique: 'modal_interchange', annotation: 'im borrowed — dramatic shift', techniqueLabel: 'Modal Interchange' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VI from Aeolian', techniqueLabel: 'Modal Interchange' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'backdoor', annotation: '♭VII7 Backdoor Dominant', techniqueLabel: 'Backdoor' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange', 'backdoor'],
    description: 'Extended modal interchange chain exploring multiple borrowed chords from parallel minor + Mixolydian. Very Jacob Collier.',
    artists: ['Jacob Collier', 'Radiohead', 'Snarky Puppy'],
    feel: 'Epic modal journey',
    lengths: [8],
  },
];

// ─── Resolution ──────────────────────────────────────────────────────────────

function resolveDegree(key: string, degree: string, qualityKey: string): { root: string; quality: string; symbol: string; notes: string[] } {
  const keySemitone = noteToSemitone(key);
  const degreeSemitones = DEGREE_SEMITONE[degree];
  if (degreeSemitones === undefined) {
    return { root: key, quality: 'maj7', symbol: `${key}maj7`, notes: [] };
  }

  const resolvedSemitone = (keySemitone + degreeSemitones + 12) % 12;
  const preferFlat = notePreferFlat(key) || [1, 3, 6, 8, 10].includes(resolvedSemitone);
  const root = semitoneToNote(resolvedSemitone, preferFlat);

  // Resolve 'diatonic' quality
  let quality = qualityKey;
  if (qualityKey === 'diatonic') {
    quality = MAJOR_DIATONIC_QUALITY[degree] ?? 'maj7';
  }

  const qualitySuffix = quality === 'maj' ? '' : quality;
  const symbol = `${root}${qualitySuffix}`;
  const notes = getChordNotes(root, quality);

  return { root, quality, symbol, notes };
}

function resolveChord(key: string, chord: ProgressionChord): ResolvedChord {
  const { root, quality, symbol, notes } = resolveDegree(key, chord.degree, chord.quality);
  return {
    degree: chord.degree,
    symbol,
    root,
    quality,
    notes,
    technique: chord.technique,
    techniqueLabel: chord.techniqueLabel,
    function: chord.function,
    annotation: chord.annotation,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ProgressionFilter {
  key: string;
  length: number;
  style: HarmonyStyle | 'both';
  techniques: Technique[];
}

export function getAvailableTechniques(): { id: Technique; label: string; description: string }[] {
  return [
    { id: 'diatonic',          label: 'Diatonic',            description: 'Chords native to the major key — no borrowed notes.' },
    { id: 'modal_interchange', label: 'Modal Interchange',   description: 'Borrow chords from parallel modes (especially natural minor / Dorian).' },
    { id: 'secondary_dominant',label: 'Secondary Dominant',  description: 'V7 of a non-tonic chord (e.g. II7 = V/V, VI7 = V/ii).' },
    { id: 'tritone_sub',       label: 'Tritone Substitution',description: 'Replace V7 with ♭II7 — tritone sub. Chromatic bass approach.' },
    { id: 'backdoor',          label: 'Backdoor Dominant',   description: '♭VII7 approaching tonic. From Mixolydian — smoky, funky sound.' },
    { id: 'chromatic',         label: 'Chromatic Mediant',   description: 'Chord movement by major/minor thirds — colorful, non-functional.' },
    { id: 'quartal',           label: 'Quartal Harmony',     description: 'Chords built in stacked 4ths — ambiguous, open, modal.' },
    { id: 'sus',               label: 'SUS Chords',          description: 'Suspended 2nd and 4th chords — avoids the 3rd, creates tension.' },
    { id: 'modulation',        label: 'Modulation',          description: 'Temporary or permanent key change within the progression.' },
  ];
}

export function generateProgressions(filter: ProgressionFilter): GeneratedProgression[] {
  const { key, length, style, techniques } = filter;

  if (noteToSemitone(key) < 0) return [];

  const results: GeneratedProgression[] = [];
  let id = 0;

  for (const template of TEMPLATES) {
    // Length filter: allow if template supports this length
    if (!template.lengths.includes(length)) continue;

    // Style filter
    if (style !== 'both' && template.style !== style) continue;

    // Technique filter: template must use at least one selected technique
    if (techniques.length > 0) {
      const hasOverlap = template.techniques.some(t => techniques.includes(t));
      if (!hasOverlap) continue;
    }

    const chords = template.chords.map(c => resolveChord(key, c));

    results.push({
      id: String(id++),
      template,
      key,
      chords,
      description: template.description,
    });
  }

  return results;
}

export function getAllLengths(): number[] {
  const lengths = new Set<number>();
  TEMPLATES.forEach(t => t.lengths.forEach(l => lengths.add(l)));
  return Array.from(lengths).sort((a, b) => a - b);
}

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

  // ── DIATONIC — NON-I STARTING ────────────────────────────────────────────
  {
    id: 'vi-IV-I-V',
    name: 'vi–IV–I–V (Axis)',
    chords: [
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'The Axis progression — same four chords as I–V–vi–IV but starting from vi. Dark, introspective feel. Used in thousands of modern songs.',
    artists: ['Frank Ocean', 'Anderson .Paak', 'Radiohead', 'The Beatles'],
    feel: 'Introspective modern pop',
    lengths: [4],
  },
  {
    id: 'IV-I-V-vi',
    name: 'IV–I–V–vi',
    chords: [
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Axis rotation starting from IV — opens with the subdominant for a lifted, hopeful feel before landing on vi.',
    artists: ['D\'Angelo', 'Erykah Badu', 'Stevie Wonder'],
    feel: 'Lifted soul groove',
    lengths: [4],
  },
  {
    id: 'IV-V-vi-I',
    name: 'IV–V–vi–I (Ascending)',
    chords: [
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Ascending diatonic sequence from IV. Creates forward momentum and a sense of arrival. Common in neo-soul and gospel.',
    artists: ['Stevie Wonder', 'Lalah Hathaway', 'Ledisi'],
    feel: 'Gospel-soul ascent',
    lengths: [4],
  },
  {
    id: 'vi-V-IV-I',
    name: 'vi–V–IV–I (Descending)',
    chords: [
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Descending diatonic sequence from vi to I. Very common in R&B ballads and singer-songwriter music.',
    artists: ['John Mayer', 'H.E.R.', 'Jhené Aiko'],
    feel: 'R&B ballad descent',
    lengths: [4],
  },
  {
    id: 'ii-IV-V-I',
    name: 'ii–IV–V–I (Funk Ascent)',
    chords: [
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Ascending through subdominant territory before resolving. Very funky and satisfying groove.',
    artists: ['Lettuce', 'Nile Rodgers', 'Chic', 'Thundercat'],
    feel: 'Funky ascending resolve',
    lengths: [4],
  },
  {
    id: 'iii-vi-IV-I',
    name: 'iii–vi–IV–I (Descending Thirds)',
    chords: [
      { degree: 'III', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',   quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Descending through the mediant — iii moves down by thirds through vi to IV then I. Very smooth and sophisticated.',
    artists: ['Steely Dan', 'Pat Metheny', 'Yellow Jackets'],
    feel: 'Smooth mediant descent',
    lengths: [4],
  },
  {
    id: 'iii-IV-V-I',
    name: 'iii–IV–V–I (Stepwise Ascent)',
    chords: [
      { degree: 'III', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Ascending stepwise resolution from iii to I. Clean and satisfying — used in everything from gospel to jazz.',
    artists: ['Earth Wind & Fire', 'Stevie Wonder', 'Herbie Hancock'],
    feel: 'Gospel stepwise resolution',
    lengths: [4],
  },
  {
    id: 'ii-IV-I',
    name: 'ii–IV–I (Neo-Soul Minimal)',
    chords: [
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Minimalist neo-soul — skips the dominant entirely for a relaxed, unresolved floating feel. Very D\'Angelo.',
    artists: ['D\'Angelo', 'Erykah Badu', 'Robert Glasper', 'Bilal'],
    feel: 'Neo-soul floating',
    lengths: [3],
  },
  {
    id: 'vi-IV-V',
    name: 'vi–IV–V (Minor-Start Cadence)',
    chords: [
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Starting from the relative minor — creates a darker, more emotional opening before the dominant pull.',
    artists: ['Adele', 'Sam Smith', 'H.E.R.', 'Jazmine Sullivan'],
    feel: 'Soulful minor-start',
    lengths: [3],
  },
  {
    id: 'IV-I-ii-V',
    name: 'IV–I–ii–V (Jazz-Soul Loop)',
    chords: [
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Opens on IV for a warm immediate feel — then loops ii–V back around. Great for jazz-soul grooves.',
    artists: ['Tom Misch', 'Thundercat', 'Knower', 'Cory Henry'],
    feel: 'Jazz-soul loop groove',
    lengths: [4],
  },
  {
    id: 'IV-iii-ii-I',
    name: 'IV–iii–ii–I (Descending Diatonic)',
    chords: [
      { degree: 'IV',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'III', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',   quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Full stepwise descent from IV through iii, ii, I. Very smooth and lyrical — popular in jazz ballads and singer-songwriter.',
    artists: ['Bill Evans', 'Brad Mehldau', 'Keith Jarrett'],
    feel: 'Lyrical stepwise descent',
    lengths: [4],
  },
  {
    id: 'ii-iii-IV-V',
    name: 'ii–iii–IV–V (Ascending Walk)',
    chords: [
      { degree: 'II',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'III', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',  quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',   quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Stepwise ascending walk through the middle of the scale — creates irresistible forward momentum without resolving.',
    artists: ['Nate Smith', 'Ghost Notes', 'Mark Guiliana'],
    feel: 'Rhythmic ascending momentum',
    lengths: [4],
  },
  {
    id: 'vi-IV-I-V-ii-V',
    name: 'vi–IV–I–V–ii–V (Extended Axis)',
    chords: [
      { degree: 'VI', quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'diatonic', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
      { degree: 'II', quality: 'diatonic', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: 'diatonic', function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'classic', techniques: ['diatonic'],
    description: 'Extended Axis starting from vi — then a ii–V turnaround appended for a jazz-pop feel.',
    artists: ['Frank Ocean', 'Daniel Caesar', 'Jordan Rakei'],
    feel: 'Jazz-pop extended axis',
    lengths: [6],
  },
  {
    id: 'ii-IV-bVII-I',
    name: 'ii–IV–♭VII–I (Neo-Soul Non-I)',
    chords: [
      { degree: 'II',   quality: 'm9',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'backdoor', annotation: '♭VII7 Backdoor — approaches I from above', techniqueLabel: 'Backdoor Dominant' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic', 'backdoor'],
    description: 'Opens on ii minor — pushes through IV, then uses the backdoor ♭VII dominant to resolve to I. Very UK jazz / neo-soul.',
    artists: ['Yussef Dayes', 'Tom Misch', 'Jordan Rakei', 'Alfa Mist'],
    feel: 'UK jazz-soul flow',
    lengths: [4],
  },
  {
    id: 'vim-IV-bVII-I',
    name: 'vim–IV–♭VII–I (Modal Minor Start)',
    chords: [
      { degree: 'VI',   quality: 'm9',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'backdoor', annotation: '♭VII Mixolydian/Backdoor', techniqueLabel: 'Backdoor' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic', 'backdoor'],
    description: 'Minor vi opening with modal flavor — ♭VII7 creates a smoky backdoor approach to the tonic.',
    artists: ['Snarky Puppy', 'Cory Henry', 'Knower', 'Lettuce'],
    feel: 'Smoky minor modal groove',
    lengths: [4],
  },
  {
    id: 'IV-iv-I-V',
    name: 'IV–iv–I–V (Modal Interchange from IV)',
    chords: [
      { degree: 'IV', quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV', quality: 'm7',   function: 'Color',       technique: 'modal_interchange', annotation: 'iv borrowed from parallel minor', techniqueLabel: 'Modal Interchange' },
      { degree: 'I',  quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',  quality: '7',    function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Opens on IV then immediately borrows iv from parallel minor — the contrast creates a bittersweet emotional shift before resolving.',
    artists: ['Radiohead', 'Thom Yorke', 'Tom Misch', 'Jacob Collier'],
    feel: 'Bittersweet modal color from IV',
    lengths: [4],
  },
  {
    id: 'vim-IVmaj7-IIm7-V13',
    name: 'vim9–IVmaj7–IIm11–V13 (Lush Extensions Non-I)',
    chords: [
      { degree: 'VI', quality: 'm9',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV', quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'II', quality: 'm11', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',  quality: '13',  function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic'],
    description: 'Full jazz extensions (m9, maj7, m11, 13) on a vi-start loop — rich harmonic color without ever hitting the tonic chord.',
    artists: ['Thundercat', 'Robert Glasper', 'Kamasi Washington', 'Flying Lotus'],
    feel: 'Lush jazz-soul floating loop',
    lengths: [4],
  },
  {
    id: 'IVmaj7-IIIm7-IIm7-Imaj7',
    name: 'IVmaj7–IIIm7–IIm7–Imaj7 (Descending Jazz)',
    chords: [
      { degree: 'IV',  quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'III', quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II',  quality: 'm7',   function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',   quality: 'maj7', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic'],
    description: 'Silky stepwise descent from IV through iii and ii to the tonic. All chord-tones move smoothly — classic jazz piano voicing territory.',
    artists: ['Bill Evans', 'Keith Jarrett', 'Brad Mehldau', 'Chick Corea'],
    feel: 'Silky jazz piano descent',
    lengths: [4],
  },
  {
    id: 'vi-bVII-I-IV',
    name: 'vi–♭VII–I–IV (Modal Riff)',
    chords: [
      { degree: 'VI',   quality: 'm7',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VII from Mixolydian/Aeolian', techniqueLabel: 'Modal Interchange' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'vi opens the phrase, then ♭VII (borrowed Mixolydian) creates a modal lift into I. Very cinematic and modern.',
    artists: ['Hans Zimmer', 'Radiohead', 'Bon Iver', 'Frank Ocean'],
    feel: 'Cinematic modal lift',
    lengths: [4],
  },
  {
    id: 'ii-bVII-I-bVI',
    name: 'II–♭VII–I–♭VI (Neo-Soul Modal)',
    chords: [
      { degree: 'II',   quality: 'm9',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: '7',   function: 'Color',       technique: 'backdoor', annotation: '♭VII7 Backdoor', techniqueLabel: 'Backdoor' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VI borrowed from Aeolian', techniqueLabel: 'Modal Interchange' },
    ],
    style: 'modern', techniques: ['backdoor', 'modal_interchange'],
    description: 'Starts on ii minor, uses backdoor ♭VII to resolve, then dips to ♭VI (borrowed) for color. Anderson .Paak / neo-soul.',
    artists: ['Anderson .Paak', 'Kendrick Lamar', 'SiR', 'Ari Lennox'],
    feel: 'Kendrick / neo-soul borrowed harmony',
    lengths: [4],
  },
  {
    id: 'IVmaj7-V-vim-bVIImaj7',
    name: 'IVmaj7–V–vim–♭VIImaj7 (Modern Pop-Jazz)',
    chords: [
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',    quality: '7',    function: 'Dominant',    technique: 'diatonic' },
      { degree: 'VI',   quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VII borrowed Mixolydian', techniqueLabel: 'Modal Interchange' },
    ],
    style: 'modern', techniques: ['diatonic', 'modal_interchange'],
    description: 'A modern pop-jazz sequence starting from IV — the ♭VII at the end adds a Mixolydian twist before looping back.',
    artists: ['Childish Gambino', 'Chance the Rapper', 'Lucky Daye'],
    feel: 'Contemporary R&B-pop',
    lengths: [4],
  },
  {
    id: 'ii-V-IVmaj7-bVII',
    name: 'II–V–IVmaj7–♭VII (Jazz Reharmonized Non-I)',
    chords: [
      { degree: 'II',   quality: 'm9',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'V',    quality: '13',  function: 'Dominant',    technique: 'diatonic' },
      { degree: 'IV',   quality: 'maj9', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: '7',   function: 'Color',       technique: 'backdoor', annotation: '♭VII Backdoor replaces tonic', techniqueLabel: 'Backdoor' },
    ],
    style: 'modern', techniques: ['diatonic', 'backdoor'],
    description: 'Classic ii–V setup but instead of resolving to I, it detours to IV then ♭VII — deliberately avoids the tonic for a floating, open feel.',
    artists: ['Snarky Puppy', 'Pat Metheny', 'Yellowjackets'],
    feel: 'Deceptive non-resolution float',
    lengths: [4],
  },
  {
    id: 'iv-I-bVII-bVI',
    name: 'iv–I–♭VII–♭VI (Minor Borrowed Chain)',
    chords: [
      { degree: 'IV',   quality: 'm7',  function: 'Color',    technique: 'modal_interchange', annotation: 'iv from parallel minor', techniqueLabel: 'Modal Interchange' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',    technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj7', function: 'Color',    technique: 'modal_interchange', annotation: '♭VII from Aeolian', techniqueLabel: 'Modal Interchange' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',    technique: 'modal_interchange', annotation: '♭VI from Aeolian', techniqueLabel: 'Modal Interchange' },
    ],
    style: 'modern', techniques: ['modal_interchange'],
    description: 'Opens on borrowed iv minor — gives an immediate melancholic color before the tonic, then descends through borrowed ♭VII and ♭VI.',
    artists: ['Radiohead', 'Coldplay', 'Jacob Collier', 'Bon Iver'],
    feel: 'Melancholic borrowed descent',
    lengths: [4],
  },
  {
    id: 'vi-II7-V-I',
    name: 'vi–II7–V–I (Secondary Dom from vi)',
    chords: [
      { degree: 'VI', quality: 'm7', function: 'Tonic',    technique: 'diatonic' },
      { degree: 'II', quality: '7',  function: 'Dominant', technique: 'secondary_dominant', annotation: 'II7 = V/V (secondary dominant)', techniqueLabel: 'Secondary Dominant' },
      { degree: 'V',  quality: '7',  function: 'Dominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'maj7', function: 'Tonic',  technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic', 'secondary_dominant'],
    description: 'Starts on vi minor then uses II7 (V of V) to create a chain of dominants — pulls powerfully toward I through a double dominant resolution.',
    artists: ['George Duke', 'Herbie Hancock', 'Weather Report'],
    feel: 'Double dominant pull from vi',
    lengths: [4],
  },
  {
    id: 'IV-I-vi-II7-V',
    name: 'IV–I–vi–II7–V (Neo-Soul 5-chord)',
    chords: [
      { degree: 'IV', quality: 'maj9', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'I',  quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'VI', quality: 'm9',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II', quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', annotation: 'II7 = V/V', techniqueLabel: 'Secondary Dominant' },
      { degree: 'V',  quality: '13',   function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic', 'secondary_dominant'],
    description: 'A lush 5-chord neo-soul form starting from IV — meanders through the tonic and vi before building tension with II7–V.',
    artists: ['Maxwell', 'D\'Angelo', 'Musiq Soulchild', 'Anthony Hamilton'],
    feel: 'Lush neo-soul form',
    lengths: [5],
  },
  {
    id: 'vi-IV-bVII-bVI-I',
    name: 'vi–IV–♭VII–♭VI–I (Cinematic Borrowed)',
    chords: [
      { degree: 'VI',   quality: 'm7',  function: 'Tonic',       technique: 'diatonic' },
      { degree: 'IV',   quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'bVII', quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VII from Mixolydian', techniqueLabel: 'Modal Interchange' },
      { degree: 'bVI',  quality: 'maj7', function: 'Color',       technique: 'modal_interchange', annotation: '♭VI from Aeolian', techniqueLabel: 'Modal Interchange' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic', 'modal_interchange'],
    description: 'Cinematic 5-chord progression from vi — borrows ♭VII and ♭VI from Aeolian for a powerful film-score feeling before resolving to I.',
    artists: ['Hans Zimmer', 'Radiohead', 'Jonny Greenwood', 'Max Richter'],
    feel: 'Epic cinematic resolve',
    lengths: [5],
  },
  {
    id: 'ii-IV-vim-V-I',
    name: 'II–IV–vi–V–I (Funky Full Circle)',
    chords: [
      { degree: 'II',  quality: 'm9',  function: 'Subdominant', technique: 'diatonic' },
      { degree: 'IV',  quality: 'maj7', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'VI',  quality: 'm7',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'V',   quality: '13',   function: 'Dominant',    technique: 'diatonic' },
      { degree: 'I',   quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic'],
    description: 'Five diatonic chords tracing a full emotional arc — starts away from tonic and visits every harmonic area before landing.',
    artists: ['Lettuce', 'Snarky Puppy', 'Nate Smith', 'Ghost Notes'],
    feel: 'Full-circle groove resolution',
    lengths: [5],
  },
  {
    id: 'IV-vim-bVII-I-II7-V',
    name: 'IV–vi–♭VII–I–II7–V (Modern Jazz Form)',
    chords: [
      { degree: 'IV',   quality: 'maj9', function: 'Subdominant', technique: 'diatonic' },
      { degree: 'VI',   quality: 'm9',   function: 'Tonic',       technique: 'diatonic' },
      { degree: 'bVII', quality: '7',    function: 'Color',       technique: 'backdoor', annotation: '♭VII Backdoor', techniqueLabel: 'Backdoor' },
      { degree: 'I',    quality: 'maj9', function: 'Tonic',       technique: 'diatonic' },
      { degree: 'II',   quality: '7',    function: 'Dominant',    technique: 'secondary_dominant', annotation: 'V/V', techniqueLabel: 'Secondary Dominant' },
      { degree: 'V',    quality: '13',   function: 'Dominant',    technique: 'diatonic' },
    ],
    style: 'modern', techniques: ['diatonic', 'backdoor', 'secondary_dominant'],
    description: 'A complete 6-chord modern jazz form: opens on IV, visits vi, uses backdoor ♭VII to reach tonic, then builds a II7–V turnaround.',
    artists: ['Snarky Puppy', 'Tom Misch', 'Knower', 'Cory Henry'],
    feel: 'Complete modern jazz form',
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

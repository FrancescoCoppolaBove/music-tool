import { useState, useMemo } from 'react';
import { Note, Scale } from 'tonal';

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artist {
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

interface UST {
  label: string;
  triadRoot: string;
  triadType: 'M' | 'm';
  resultingColor: string;
  tensionsAdded: string[];
  character: string;
}

interface PentaSuper {
  label: string;
  intervalFromRoot: string;
  scaleType: string;
  character: string;
  tonesHighlighted: string[];
}

interface EuclidPreset {
  n: number;
  k: number;
  label: string;
  name: string;
  description: string;
}

interface Polyrhythm {
  against: number;
  over: number;
  label: string;
  description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ARTISTS: Artist[] = [
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
];

const UST_FOR_DOMINANT: UST[] = [
  { label: 'II major triad', triadRoot: '2M', triadType: 'M', resultingColor: '9 (#11)', tensionsAdded: ['9', '#11'], character: 'Lydian dominant — bright, open, floating' },
  { label: 'bII major triad', triadRoot: '2m', triadType: 'M', resultingColor: 'b9 (#11)', tensionsAdded: ['b9', '#11'], character: 'Very altered — dark and crunchy' },
  { label: 'bVI major triad', triadRoot: '6m', triadType: 'M', resultingColor: 'b9 b13 (Altered)', tensionsAdded: ['b9', 'b13'], character: 'Classic altered dominant — deep jazz tension' },
  { label: 'bVII major triad', triadRoot: '7m', triadType: 'M', resultingColor: '9sus (no 3rd)', tensionsAdded: ['9', '4'], character: 'Suspended, ambiguous — no major/minor quality' },
  { label: 'III major triad', triadRoot: '3M', triadType: 'M', resultingColor: '#5 (#9)', tensionsAdded: ['#5', '#9'], character: 'Augmented dominant — very tense, chromatic' },
  { label: 'bIII minor triad', triadRoot: '3m', triadType: 'm', resultingColor: 'b9 b13', tensionsAdded: ['b9', 'b13'], character: 'Phrygian dominant — Spanish/flamenco tension' },
];

const PENTA_SUPERIMPOSITIONS: PentaSuper[] = [
  { label: 'Root pentatonic', intervalFromRoot: '1P', scaleType: 'minor pentatonic', character: 'Safe, inside, direct', tonesHighlighted: ['root', 'b3', '4', '5', 'b7'] },
  { label: 'II pentatonic (Dorian trick)', intervalFromRoot: '2M', scaleType: 'minor pentatonic', character: 'Adds the major 6th — the Dorian characteristic tone. Signature Jacob Collier / Snarky Puppy', tonesHighlighted: ['9', '4', '6', 'b7', 'root'] },
  { label: 'IV pentatonic', intervalFromRoot: '4P', scaleType: 'minor pentatonic', character: 'Close and modal — adds the 4th strongly', tonesHighlighted: ['4', 'b6', 'b7', 'root', '9'] },
  { label: 'bVII pentatonic (tritone trick)', intervalFromRoot: '7m', scaleType: 'major pentatonic', character: 'Outside — creates bitonal tension. Very Collier.', tonesHighlighted: ['b7', 'root', '9', '#4/b5', '6'] },
  { label: 'bII pentatonic (super-outside)', intervalFromRoot: '2m', scaleType: 'major pentatonic', character: 'Maximum outside — pure chromaticism, use sparingly', tonesHighlighted: ['b9', '#9', 'b5', 'b6', 'b7'] },
];

const EUCLIDEAN_PRESETS: EuclidPreset[] = [
  { n: 3, k: 8,  label: 'E(3,8)',  name: 'Bossa Nova',      description: '3 beats in 8 slots — the classic tresillo' },
  { n: 5, k: 8,  label: 'E(5,8)',  name: 'Cuban / Cascara', description: '5 in 8 — dense, flowing Cuban feel' },
  { n: 5, k: 16, label: 'E(5,16)', name: 'Sparse Funk',     description: '5 in 16 — open, pocket-oriented' },
  { n: 7, k: 16, label: 'E(7,16)', name: 'Snarky Pocket',   description: '7 in 16 — the Snarky Puppy groove engine' },
  { n: 9, k: 16, label: 'E(9,16)', name: 'Dense Fusion',    description: '9 in 16 — complex, interlocking' },
  { n: 5, k: 12, label: 'E(5,12)', name: '12/8 Overlay',    description: '5 in 12 — bossa inside compound meter' },
];

const POLYRHYTHMS: Polyrhythm[] = [
  { against: 3, over: 4, label: '3 against 4', description: 'Play 3 evenly-spaced notes in the space of 4 beats. Each note = 1⅓ beats apart. Creates the classic "3:4" pull.' },
  { against: 4, over: 3, label: '4 against 3', description: 'Play 4 notes in the space of 3 beats. Common in 6/8 hemiola.' },
  { against: 5, over: 4, label: '5 against 4', description: 'Play 5 evenly-spaced notes in 4 beats. Each note = 4/5 of a beat. Disorienting and modern.' },
  { against: 3, over: 2, label: '3 against 2', description: 'The most fundamental polyrhythm. Play triplets against duplets. Base of all African/Cuban feel.' },
  { against: 7, over: 4, label: '7 against 4', description: 'Play 7 notes in 4 beats. Advanced — used by Collier and fusion drummers.' },
];

const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ─── Bjorklund euclidean algorithm ───────────────────────────────────────────

function euclidean(beats: number, slots: number): number[] {
  if (beats >= slots) return Array(slots).fill(1);
  if (beats <= 0)    return Array(slots).fill(0);
  let pattern: number[][] = [
    ...Array(beats).fill(null).map(() => [1]),
    ...Array(slots - beats).fill(null).map(() => [0]),
  ];
  let b = beats;
  let remainder = slots - beats;
  while (remainder > 1) {
    const iterations = Math.min(b, remainder);
    const newPattern: number[][] = [];
    for (let i = 0; i < iterations; i++) {
      newPattern.push([...pattern[i], ...pattern[pattern.length - 1 - i]]);
    }
    if (b > remainder) {
      for (let i = iterations; i < b; i++) newPattern.push(pattern[i]);
      b = b - remainder;
    } else {
      for (let i = iterations; i < remainder; i++) newPattern.push(pattern[b + i]);
      remainder = remainder - b;
      b = iterations;
    }
    pattern = newPattern;
  }
  return pattern.flat();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RhythmGrid({ pattern, color, offset = 0 }: { pattern: number[]; color: string; offset?: number }) {
  const beatSize = pattern.length <= 8 ? 28 : 22;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {pattern.map((beat, i) => {
        const isOn = beat === 1;
        const isFaded = isOn && i < offset;
        return (
          <div key={i} style={{
            width: beatSize,
            height: beatSize,
            borderRadius: 4,
            background: isOn ? (isFaded ? `${color}44` : color) : '#1c2128',
            border: `1px solid ${isOn ? color : '#30363d'}`,
            boxShadow: isOn && !isFaded ? `0 0 8px ${color}44` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {i === 0 && (
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: isOn ? 'rgba(255,255,255,0.7)' : '#4b5563',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BeatLabels({ slots }: { slots: number }) {
  const beatSize = slots <= 8 ? 28 : 22;
  const labels = Array.from({ length: slots }, (_, i) => {
    if (slots === 8)  return ['1','e','+','a','2','e','+','a'][i] ?? '';
    if (slots === 16) return i % 4 === 0 ? String(Math.floor(i / 4) + 1) : i % 2 === 0 ? '+' : '';
    if (slots === 12) return i % 3 === 0 ? String(Math.floor(i / 3) + 1) : '';
    return i % 2 === 0 ? String(Math.floor(i / 2) + 1) : '';
  });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
      {labels.map((lbl, i) => (
        <div key={i} style={{
          width: beatSize, textAlign: 'center',
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          color: lbl && ['1','2','3','4'].includes(lbl) ? '#6b7280' : '#30363d',
        }}>
          {lbl}
        </div>
      ))}
    </div>
  );
}

function NoteChip({ note, color }: { note: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: `${color}18`, border: `1px solid ${color}44`,
      fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
      color, letterSpacing: '0.04em',
    }}>
      {note}
    </span>
  );
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280',
      }}>
        {text}
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
function lcm(a: number, b: number): number { return (a * b) / gcd(a, b); }

// ─── Main component ───────────────────────────────────────────────────────────

export default function RiffArchitectFeature() {
  const [activeArtistId, setActiveArtistId] = useState('snarkyPuppy');
  const [rhythmMode, setRhythmMode] = useState<'euclidean' | 'polyrhythm' | 'displacement'>('euclidean');
  const [selectedEuclid, setSelectedEuclid] = useState(3);
  const [selectedPoly, setSelectedPoly] = useState(0);
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [expandedUST, setExpandedUST] = useState<number | null>(null);
  const [expandedPenta, setExpandedPenta] = useState<number | null>(null);

  const artist = ARTISTS.find(a => a.id === activeArtistId)!;
  const color = artist.color;

  const euclidPreset = EUCLIDEAN_PRESETS[selectedEuclid];
  const euclidPattern = useMemo(() => euclidean(euclidPreset.n, euclidPreset.k), [euclidPreset.n, euclidPreset.k]);

  const dispBase = useMemo(() => euclidean(7, 16), []);
  const disp1    = useMemo(() => [...dispBase.slice(1),  ...dispBase.slice(0, 1)],  [dispBase]);
  const disp2    = useMemo(() => [...dispBase.slice(2),  ...dispBase.slice(0, 2)],  [dispBase]);

  const ustNotes = useMemo(() => UST_FOR_DOMINANT.map(ust => {
    const r = Note.transpose(selectedRoot, ust.triadRoot) ?? selectedRoot;
    const scaleName = ust.triadType === 'M' ? 'major' : 'minor';
    return Scale.get(`${r} ${scaleName}`).notes.slice(0, 3);
  }), [selectedRoot]);

  const pentaNotes = useMemo(() => PENTA_SUPERIMPOSITIONS.map(ps => {
    const r = Note.transpose(selectedRoot, ps.intervalFromRoot) ?? selectedRoot;
    return Scale.get(`${r} ${ps.scaleType}`).notes;
  }), [selectedRoot]);

  const polyPreset = POLYRHYTHMS[selectedPoly];
  const polyWidth = lcm(polyPreset.against, polyPreset.over);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <style>{FONTS}</style>

      {/* Page header */}
      <div style={{ padding: '28px 0 20px', borderBottom: '1px solid #21262d', marginBottom: 28 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', color: '#4b5563', textTransform: 'uppercase',
            }}>
              Music Theory · Composition
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26,
            letterSpacing: '-0.5px', color: '#e6edf3', margin: '0 0 18px',
          }}>
            Complex Riff Architect
          </h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ARTISTS.map(a => (
              <button key={a.id} onClick={() => setActiveArtistId(a.id)} style={{
                padding: '7px 16px', borderRadius: 6,
                border: `1px solid ${activeArtistId === a.id ? a.color : '#30363d'}`,
                background: activeArtistId === a.id ? `${a.color}18` : 'transparent',
                color: activeArtistId === a.id ? a.color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* ── Artist DNA ───────────────────────────────────────────────── */}
        <div style={{
          border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
          borderRadius: 10, background: '#161b22', padding: '22px 26px', marginBottom: 28,
        }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 21, color, marginBottom: 3 }}>
              {artist.name}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#8b949e', letterSpacing: '0.02em' }}>
              {artist.tagline}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 20 }}>
            {[
              { label: 'Harmonic DNA', items: artist.harmonicDNA },
              { label: 'Rhythmic DNA', items: artist.rhythmicDNA },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 8 }}>
                  {col.label}
                </div>
                {col.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <span style={{ color: `${color}88`, fontFamily: "'DM Mono', monospace", fontSize: 10, flexShrink: 0, marginTop: 3 }}>○</span>
                    <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 8 }}>
              Key Techniques
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px' }}>
              {artist.keyTechniques.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: `${color}66`, flexShrink: 0, minWidth: 18, marginTop: 3 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.55 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 7 }}>
              Scale Preferences
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {artist.scalePreferences.map(s => (
                <span key={s} style={{
                  padding: '2px 9px', borderRadius: 4,
                  background: `${color}12`, border: `1px solid ${color}30`,
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: `${color}bb`,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 18px', borderRadius: 8, background: `${color}0c`, border: `1px solid ${color}20` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${color}77`, marginBottom: 6 }}>
              Construction Approach
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.75, color: '#c9d1d9', margin: 0 }}>
              {artist.exampleApproach}
            </p>
          </div>
        </div>

        {/* ── Harmonic Palette ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel text="Harmonic Palette" color={color} />

          {/* Root selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
              Root
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {CHROMATIC_ROOTS.map(r => (
                <button key={r} onClick={() => setSelectedRoot(r)} style={{
                  width: 37, height: 33, borderRadius: 5,
                  border: `1px solid ${selectedRoot === r ? color : '#30363d'}`,
                  background: selectedRoot === r ? `${color}18` : '#161b22',
                  color: selectedRoot === r ? color : '#6b7280',
                  fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Upper Structure Triads */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 10 }}>
              Upper Structure Triads — over {selectedRoot}7
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {UST_FOR_DOMINANT.map((ust, i) => {
                const notes = ustNotes[i];
                const open = expandedUST === i;
                return (
                  <button key={i} onClick={() => setExpandedUST(open ? null : i)} style={{
                    background: open ? `${color}12` : '#161b22',
                    border: `1px solid ${open ? color + '50' : '#30363d'}`,
                    borderRadius: 8, padding: '13px 14px',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: open ? color : '#6b7280', fontWeight: 500, marginBottom: 6 }}>
                      {ust.label}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                      {notes.map(n => <NoteChip key={n} note={n} color={color} />)}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                      → {ust.resultingColor}
                    </div>
                    {open && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${color}20` }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e', lineHeight: 1.55, marginBottom: 6 }}>
                          {ust.character}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {ust.tensionsAdded.map(t => (
                            <span key={t} style={{ padding: '1px 6px', borderRadius: 3, background: `${color}20`, fontSize: 10, color: `${color}bb`, fontFamily: "'DM Mono', monospace" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pentatonic Superimpositions */}
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 10 }}>
              Pentatonic Superimpositions — over {selectedRoot}m7
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PENTA_SUPERIMPOSITIONS.map((ps, i) => {
                const notes = pentaNotes[i];
                const open = expandedPenta === i;
                return (
                  <button key={i} onClick={() => setExpandedPenta(open ? null : i)} style={{
                    background: open ? `${color}0c` : '#161b22',
                    border: `1px solid ${open ? color + '44' : '#30363d'}`,
                    borderRadius: 8, padding: '12px 16px',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: open ? color : '#8b949e', fontWeight: 500, marginBottom: 6 }}>
                        {ps.label}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        {notes.map(n => <NoteChip key={n} note={n} color={color} />)}
                      </div>
                      {open && (
                        <div style={{ marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.65 }}>
                          {ps.character}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                            {ps.tonesHighlighted.map(t => (
                              <span key={t} style={{ padding: '1px 6px', borderRadius: 3, background: `${color}18`, fontSize: 10, color: `${color}bb`, fontFamily: "'DM Mono', monospace" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', flexShrink: 0, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {ps.scaleType}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Rhythmic Architecture ────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel text="Rhythmic Architecture" color={color} />

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 22, borderBottom: '1px solid #21262d' }}>
            {(['euclidean', 'polyrhythm', 'displacement'] as const).map(mode => (
              <button key={mode} onClick={() => setRhythmMode(mode)} style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: rhythmMode === mode ? `2px solid ${color}` : '2px solid transparent',
                background: rhythmMode === mode ? `${color}12` : 'transparent',
                color: rhythmMode === mode ? color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'all 0.15s', marginBottom: -1, borderRadius: '5px 5px 0 0',
              }}>
                {mode}
              </button>
            ))}
          </div>

          {/* Euclidean */}
          {rhythmMode === 'euclidean' && (
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {EUCLIDEAN_PRESETS.map((ep, i) => (
                  <button key={ep.label} onClick={() => setSelectedEuclid(i)} style={{
                    padding: '7px 13px', borderRadius: 6,
                    border: `1px solid ${selectedEuclid === i ? color : '#30363d'}`,
                    background: selectedEuclid === i ? `${color}18` : '#161b22',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: selectedEuclid === i ? color : '#8b949e' }}>
                      {ep.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                      {ep.name}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color }}>{euclidPreset.label}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#6b7280', marginLeft: 10 }}>{euclidPreset.name}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                    {euclidPreset.n} hits / {euclidPreset.k} slots
                  </span>
                </div>
                <BeatLabels slots={euclidPreset.k} />
                <RhythmGrid pattern={euclidPattern} color={color} />
                <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                  {euclidPreset.description}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>Binary:</span>
                  {euclidPattern.map((b, i) => (
                    <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: b === 1 ? color : '#30363d', fontWeight: b === 1 ? 500 : 400 }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Polyrhythm */}
          {rhythmMode === 'polyrhythm' && (
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {POLYRHYTHMS.map((pr, i) => (
                  <button key={pr.label} onClick={() => setSelectedPoly(i)} style={{
                    padding: '7px 14px', borderRadius: 6,
                    border: `1px solid ${selectedPoly === i ? color : '#30363d'}`,
                    background: selectedPoly === i ? `${color}18` : '#161b22',
                    color: selectedPoly === i ? color : '#6b7280',
                    fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {pr.label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '22px 24px' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color, marginBottom: 4 }}>
                  {polyPreset.label}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#6b7280', marginBottom: 24, lineHeight: 1.65 }}>
                  {polyPreset.description}
                </div>

                {(['against', 'over'] as const).map(role => {
                  const count = role === 'against' ? polyPreset.against : polyPreset.over;
                  const stepSize = polyWidth / count;
                  return (
                    <div key={role} style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                        {count} notes ({role})
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {Array.from({ length: polyWidth }).map((_, i) => {
                          const isHit = Math.abs(i - Math.round(i / stepSize) * stepSize) < 0.5;
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                              <div style={{
                                width: isHit ? 14 : 6, height: isHit ? 14 : 6, borderRadius: '50%',
                                background: isHit ? (role === 'against' ? color : '#6b7280') : '#1c2128',
                                border: `1px solid ${isHit ? (role === 'against' ? color : '#6b7280') : '#30363d'}`,
                                boxShadow: isHit && role === 'against' ? `0 0 8px ${color}55` : 'none',
                              }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 6, background: `${color}0c`, border: `1px solid ${color}20`, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e' }}>
                  <span style={{ color }}>LCM = {polyWidth}</span>
                  <span style={{ color: '#30363d', margin: '0 10px' }}>|</span>
                  Ratio {polyPreset.against}:{polyPreset.over}
                  <span style={{ color: '#30363d', margin: '0 10px' }}>|</span>
                  "{polyPreset.against}" hits every {(polyWidth / polyPreset.against).toFixed(1)} grid units
                </div>
              </div>
            </div>
          )}

          {/* Displacement */}
          {rhythmMode === 'displacement' && (
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', marginBottom: 18, lineHeight: 1.65 }}>
                Base pattern: E(7,16) — the Snarky Pocket. Shift it forward by 1 or 2 sixteenth-notes
                to create rhythmic instability while preserving groove density.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Original', pattern: dispBase, shift: 0 },
                  { label: '+1 sixteenth', pattern: disp1, shift: 1 },
                  { label: '+2 sixteenths', pattern: disp2, shift: 2 },
                ].map(({ label, pattern, shift }) => (
                  <div key={shift} style={{
                    background: '#161b22',
                    border: `1px solid ${shift === 0 ? color + '44' : '#30363d'}`,
                    borderRadius: 8, padding: '16px',
                  }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: shift === 0 ? color : '#6b7280', fontWeight: shift === 0 ? 500 : 400, marginBottom: 10, letterSpacing: '0.04em' }}>
                      {label}
                    </div>
                    <BeatLabels slots={16} />
                    <RhythmGrid pattern={pattern} color={color} offset={shift} />
                    <div style={{ marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                      {pattern.filter(b => b === 1).length} hits / 16 slots
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 8, background: `${color}0c`, border: `1px solid ${color}20`, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e', lineHeight: 1.7 }}>
                <span style={{ color, fontWeight: 500 }}>Technique:</span> Play the Original for 4 bars.
                Switch to +1 sixteenth for 4 bars. Then +2 for 2 bars. Snap back to Original — the return creates a powerful sense of arrival.
              </div>
            </div>
          )}
        </div>

        {/* ── Construction Blueprint ───────────────────────────────────── */}
        <div>
          <SectionLabel text="Construction Blueprint" color={color} />
          <div style={{ background: '#161b22', border: `1px solid ${color}20`, borderRadius: 10, padding: '22px 26px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color, marginBottom: 18 }}>
              Building a {artist.name}-style Riff — Step by Step
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  n: '01', title: 'Choose Your Scale',
                  body: `Start with one of the preferred scales: ${artist.scalePreferences.join(', ')}. Pick a root and commit — the scale is the constraint that forces creativity.`,
                },
                {
                  n: '02', title: 'Define the Rhythmic Skeleton',
                  body: artist.id === 'ghostNote'
                    ? 'Choose an odd meter (5/4 or 7/8). Decide the sub-grouping (3+2 or 2+3 for 5/4). Every note must fall naturally inside a group — no note should feel like it doesn\'t belong to a group.'
                    : artist.id === 'lettuce'
                    ? 'Mark 4–6 strong 16th-note slots in a 1-bar pattern, then add ghost notes (parenthetical/light touches) between each strong note. The ghost notes are what make it Lettuce.'
                    : `Use the ${artist.id === 'jacobCollier' ? 'E(5,8) or E(3,8)' : 'E(7,16)'} euclidean rhythm as a skeleton. The mathematically-even distribution of accents is what gives it that natural, inevitable feel.`,
                },
                {
                  n: '03', title: 'Build the 3-Note Melodic Cell',
                  body: artist.id === 'jacobCollier'
                    ? 'Choose 3 adjacent scale tones and play them through the rhythmic pattern. This cell becomes your superimposition material — you\'ll harmonize it two different ways.'
                    : 'Identify a 3-note cell with a clear contour (up-down or down-up). Avoid starting on the root — begin on the 3rd, 5th, or 7th for immediate harmonic interest.',
                },
                {
                  n: '04', title: 'Apply the Core Technique',
                  body: artist.exampleApproach,
                },
                {
                  n: '05', title: 'Add Harmonic Color',
                  body: artist.id === 'snarkyPuppy'
                    ? `In bar 4, place a ${UST_FOR_DOMINANT[2].label} over the root dom7 chord. This "${UST_FOR_DOMINANT[2].character}" moment is the payoff after 3 bars of modal groove.`
                    : artist.id === 'jacobCollier'
                    ? 'Reharmonize the riff\'s second half by implying a key a tritone away. Try the bVII pentatonic superimposition — the outside notes resolve beautifully when you return to the tonic.'
                    : artist.id === 'lettuce'
                    ? 'Keep the riff on one dominant 7th chord. Add color with a chromatic b5 passing tone between beat 4 and beat 1 of the next bar. Nothing else — restraint is the statement.'
                    : 'Stack perfect 4ths above your lowest note for every punchy hit. The open quartal harmony reinforces the rhythmic force without defining a specific tonal center.',
                },
                {
                  n: '06', title: 'Loop, Displace, Resolve',
                  body: 'Loop the 2-bar riff 4 times. On repetition 5, displace the entire figure by +1 sixteenth. Run for 2 bars. Then snap back to the original downbeat position. The return is the most powerful moment in the riff.',
                },
              ].map(({ n, title, body }) => (
                <div key={n} style={{ display: 'flex', gap: 18 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: `${color}44`, flexShrink: 0, minWidth: 24, paddingTop: 2 }}>
                    {n}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color, marginBottom: 4, letterSpacing: '0.04em' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.7 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22, padding: '13px 16px', borderRadius: 8, background: `${color}0a`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 3, height: 38, background: color, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
                <span style={{ color, fontWeight: 500 }}>Remember: </span>
                {artist.id === 'snarkyPuppy' && 'In Snarky Puppy\'s world, the unison IS the texture. Every instrument plays the same riff with identical rhythm and articulation. The blend creates the orchestral depth.'}
                {artist.id === 'jacobCollier' && 'Collier\'s magic is harmonic surprise. Any moment of stability should feel like it could shift at any time. Build trust with the listener, then violate it — lovingly.'}
                {artist.id === 'lettuce' && 'Lettuce never "resolves" — the dominant 7th IS home. The groove must feel so good that harmonic movement becomes unnecessary. Resist the urge to add complexity.'}
                {artist.id === 'ghostNote' && 'Ghost Note\'s riffs live and die by the meter choice. The odd-meter lurch IS the groove — the instability is intentional and structural. Never "fix" it by adding a bar of 4/4.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Note } from 'tonal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MotionType {
  id: string;
  label: string;
  semitones: number;
  description: string;
  theory: string;
  examples: string[];
  famousUses: { name: string; motion: string }[];
}

interface QualityPattern {
  id: string;
  label: string;
  desc: string;
  qualities: string[]; // cycling pattern of chord qualities
}

// ─── Motion types ─────────────────────────────────────────────────────────────

const MOTION_TYPES: MotionType[] = [
  {
    id: 'p4_up',
    label: '↑ Ascending P4 (circle of 4ths)',
    semitones: 5,
    description: 'Each chord root rises by a perfect fourth (= descending fifth).',
    theory: 'The circle of fourths is the backbone of tonal harmony. Every ii–V–I moves by ascending P4 at each step. Chaining dominants: G7→C7→F7→Bb7 is the blues cycle. Moving by P4 with minor chords (as in the photo) gives a dark, revolving quality — common in vamps and modal sections.',
    examples: ['Cm → Fm → Bbm → Ebm → Abm → Dbm'],
    famousUses: [
      { name: 'Autumn Leaves (bars 1–8)', motion: 'ii–V–I pairs, each P4 up' },
      { name: 'Blues cycle (I7→IV7→I7)', motion: 'P4 up from I to IV' },
      { name: 'Snarky Puppy – What About Me?', motion: 'Dominant chain by P4' },
    ],
  },
  {
    id: 'p5_up',
    label: '↑ Ascending P5 (circle of 5ths)',
    semitones: 7,
    description: 'Each chord root rises by a perfect fifth (= descending fourth).',
    theory: 'Ascending fifths create an upward, brightening motion. Less common than the P4 cycle but found in modal vamps and pedal-point sections. The bass ascends by step while the harmony opens up. Creates an "expanding" tension.',
    examples: ['Cm → Gm → Dm → Am → Em → Bm'],
    famousUses: [
      { name: 'Pachelbel Canon bass', motion: 'Descending P4 = ascending P5 reversed' },
      { name: 'Giant Steps (tonic axis)', motion: 'P5 motion within each key' },
    ],
  },
  {
    id: 'm3_down',
    label: '↓ Descending m3 (dim axis)',
    semitones: -3,
    description: 'Each chord root falls by a minor third (3 semitones).',
    theory: 'Descending minor thirds divide the octave symmetrically into 4 equal parts — the diminished axis. Any dim7 chord outlines exactly these 4 roots. Commonly used in gospel ("Lift Every Voice"), bebop reharmonisations, and Coltrane\'s "Countdown". Creates a tense, spiralling descent.',
    examples: ['Cmaj7 → Amaj7 → F#maj7 → Ebmaj7 → (back to C)'],
    famousUses: [
      { name: 'Coltrane – Countdown', motion: 'ii–V–I in m3 cycle (dim axis)' },
      { name: 'Gospel turnarounds', motion: 'I → VI → #IV° → IV via m3' },
      { name: 'Wayne Shorter – Infant Eyes', motion: 'Inner voice m3 motion' },
    ],
  },
  {
    id: 'M3_down',
    label: '↓ Descending M3 (Giant Steps axis)',
    semitones: -4,
    description: 'Each chord root falls by a major third (4 semitones). The Coltrane cycle.',
    theory: 'Descending major thirds divide the octave into 3 equal parts — the "Coltrane changes" or augmented axis. The three tonal centres are a M3 apart (e.g. C, Ab, E). Each can be approached with a ii–V, giving extremely fast harmonic rhythm. This is the most challenging of all motion types for improvisation.',
    examples: ['Bmaj7 → Gmaj7 → Ebmaj7 → Bmaj7', 'With ii-V: Dm7 G7 | Bmaj7 | Bbm7 Eb7 | Gbmaj7'],
    famousUses: [
      { name: 'Coltrane – Giant Steps', motion: 'M3 descending axis with ii–V pairs' },
      { name: 'Coltrane – Countdown', motion: 'Giant Steps substitution over Cherokee' },
      { name: 'Freddie Hubbard – Up Jumped Spring', motion: 'M3 tonal centres' },
    ],
  },
  {
    id: 'm3_up',
    label: '↑ Ascending m3',
    semitones: 3,
    description: 'Each chord root rises by a minor third (3 semitones).',
    theory: 'Ascending minor thirds create the same symmetrical dim axis as descending m3, but with an upward, tightening feel. Very effective in neo-soul and R&B for building intensity. Often combined with the same chord quality throughout for a hypnotic, chromatic mediant effect.',
    examples: ['Cm → Ebm → F#m → Am → (back to C)'],
    famousUses: [
      { name: 'D\'Angelo – Brown Sugar', motion: 'Ascending m3 chord loop' },
      { name: 'Stevie Wonder – You Are The Sunshine', motion: 'm3 colour modulations' },
    ],
  },
  {
    id: 'M3_up',
    label: '↑ Ascending M3',
    semitones: 4,
    description: 'Each chord root rises by a major third (4 semitones).',
    theory: 'Ascending major thirds create the augmented axis from below. Used to build anticipation before resolution. Less common than descending M3 but found in film scoring and neo-classical jazz. Three repetitions return to the starting pitch class.',
    examples: ['Cm → Em → G#m → (back to C)'],
    famousUses: [
      { name: 'Film scoring — tension builds', motion: 'Ascending M3 for escalation' },
      { name: 'McCoy Tyner voicings', motion: 'Augmented axis quartal harmony' },
    ],
  },
  {
    id: 'M2_down',
    label: '↓ Descending M2 (whole step)',
    semitones: -2,
    description: 'Each chord root falls by a whole step (2 semitones).',
    theory: 'Whole-step descent creates a smooth, stepwise bass line — one of the most satisfying harmonic motions in pop and R&B. Over major chords it sounds like a chain of Lydian/Mixolydian colours. Over dominants it creates backdoor resolution chains. Vulfpeck, Snarky Puppy and neo-soul producers use this constantly.',
    examples: ['Dmaj7 → Cmaj7 → Bbmaj7 → Abmaj7'],
    famousUses: [
      { name: 'Vulfpeck – 1612', motion: 'Whole-step descent over groove' },
      { name: 'Snarky Puppy – Lingus', motion: 'M2 descent in B section' },
      { name: 'Jeff Schneider "backdoor" chain', motion: '♭VII7 → ♭VI7 → ♭V7 → I' },
    ],
  },
  {
    id: 'M2_up',
    label: '↑ Ascending M2 (whole step)',
    semitones: 2,
    description: 'Each chord root rises by a whole step (2 semitones).',
    theory: 'Ascending whole steps create the whole-tone scale as a harmonic sequence. Associated with dreamy, unresolved suspended motion. Common in bridge sections. Over dominants, it sounds like surfing the whole-tone scale (Messiaen mode 1).',
    examples: ['Cm7 → Dm7 → Em7 → F#m7'],
    famousUses: [
      { name: 'Modal jazz vamps', motion: 'Ascending M2 over pedal' },
      { name: 'Herbie Hancock – Maiden Voyage', motion: 'Whole-tone harmonic motion' },
    ],
  },
  {
    id: 'm2_down',
    label: '↓ Descending m2 (chromatic / half step)',
    semitones: -1,
    description: 'Each chord root falls by a half step (1 semitone). Maximum chromatic tension.',
    theory: 'Chromatic descent is the most dramatic stepwise motion — creates the "omnibus" and chromatic approach effect. Every chord acts as a tritone sub of the previous one. Found in bebop endings, the Omnibus progression (inner voice chromatic), and chromatic bass descents in blues. The Berklee "Chromatic Approach" reharmonisation technique.',
    examples: ['G7 → F#7 → F7 → E7 → Eb7 → D7 → Db7 → C'],
    famousUses: [
      { name: 'Bebop turnaround endings', motion: 'Chromatic dominant chain' },
      { name: 'Omnibus progression', motion: 'Inner voice semitone descent' },
      { name: 'James Brown horn hits', motion: 'Chromatic dominant cluster' },
    ],
  },
  {
    id: 'tt',
    label: '⟷ Tritone (TT / subV)',
    semitones: 6,
    description: 'Each chord root moves by a tritone (6 semitones). Tritone substitution cycle.',
    theory: 'The tritone cycle divides the octave into 2 equal parts — so after 2 moves you return to the start. This is the basis of tritone substitution: every dominant can be replaced by the dominant a tritone away. Chaining tritones: G7 → Db7 → G7... creates a two-chord shimmer. Over 4 different tritone pairs you cover all 12 keys.',
    examples: ['G7 → Db7 → G7 (shimmer)', 'Dm7 → Ab7 → Db → Gm7 → Db7 → Gb'],
    famousUses: [
      { name: 'Tritone Sub chains (Berklee)', motion: 'V7 ↔ subV7 alternation' },
      { name: 'John Coltrane – Body and Soul', motion: 'Tritone pivot modulations' },
      { name: 'Jobim – Wave bridge', motion: 'TT substitution descent' },
    ],
  },
];

// ─── Quality patterns ─────────────────────────────────────────────────────────

const QUALITY_PATTERNS: QualityPattern[] = [
  { id: 'same_m7',    label: 'All Minor 7th',    desc: 'Same dark quality throughout — pure motion, no quality change.',         qualities: ['m7'] },
  { id: 'same_maj7',  label: 'All Major 7th',    desc: 'Bright Lydian shimmer on each step.',                                    qualities: ['maj7'] },
  { id: 'same_7',     label: 'All Dominant 7th', desc: 'Unresolved dominant chain — maximum tension throughout.',                qualities: ['7'] },
  { id: 'same_m',     label: 'All Minor (triad)', desc: 'Like the photo: pure minor triads moving by the chosen interval.',      qualities: ['m'] },
  { id: 'same_maj',   label: 'All Major (triad)', desc: 'Pure major triads — bright chromatic mediant motion.',                  qualities: [''] },
  { id: 'alt_maj_min', label: 'Alternating Maj/Min', desc: 'Quality alternates: Major → minor → Major → minor…',              qualities: ['maj7', 'm7'] },
  { id: 'ii_v',       label: 'ii–V pairs',       desc: 'Each step is a ii–V pair. Turns motion into ii–V–I approach chords.',   qualities: ['m7', '7'] },
  { id: 'diatonic',   label: 'Diatonic to key',  desc: 'Quality follows the major scale: I=maj7, II=m7, III=m7, IV=maj7…',    qualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'] },
  { id: 'giant_steps', label: 'Giant Steps pattern', desc: 'maj7 → dom7 alternating (Coltrane axis).',                        qualities: ['maj7', '7'] },
];

const DIATONIC_QUALITY_FOR_DEGREE: Record<number, string> = {
  0: 'maj7', 2: 'm7', 4: 'm7', 5: 'maj7', 7: '7', 9: 'm7', 11: 'm7b5',
};

// ─── Note helpers ─────────────────────────────────────────────────────────────

const NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const ROOT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function transposeByChroma(note: string, semitones: number): string {
  const chroma = Note.chroma(note) ?? 0;
  const newChroma = ((chroma + semitones) % 12 + 12) % 12;
  // prefer flats for Db, Eb, Gb, Ab, Bb contexts
  const preferFlat = [1, 3, 6, 8, 10].includes(newChroma);
  return preferFlat
    ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][newChroma] ?? note
    : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][newChroma] ?? note;
}

function getQualityForStep(pattern: QualityPattern, stepIndex: number, root: string, homeRoot: string): string {
  if (pattern.id === 'diatonic') {
    const homeSemitone = Note.chroma(homeRoot) ?? 0;
    const rootSemitone = Note.chroma(root) ?? 0;
    const interval = ((rootSemitone - homeSemitone) + 12) % 12;
    return DIATONIC_QUALITY_FOR_DEGREE[interval] ?? 'm7';
  }
  const qs = pattern.qualities;
  return qs[stepIndex % qs.length];
}

function buildChordSymbol(root: string, quality: string): string {
  if (quality === '') return root;
  return `${root}${quality}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HarmonicCyclesFeature() {
  const [rootNote, setRootNote] = useState('C');
  const [motionId, setMotionId] = useState('p4_up');
  const [qualityId, setQualityId] = useState('same_m7');
  const [steps, setSteps] = useState(4);

  const motion = MOTION_TYPES.find(m => m.id === motionId)!;
  const qualityPattern = QUALITY_PATTERNS.find(q => q.id === qualityId)!;

  const chords = useMemo(() => {
    const result: { root: string; quality: string; symbol: string }[] = [];
    let current = rootNote;
    for (let i = 0; i < steps; i++) {
      const quality = getQualityForStep(qualityPattern, i, current, rootNote);
      result.push({ root: current, quality, symbol: buildChordSymbol(current, quality) });
      current = transposeByChroma(current, motion.semitones);
    }
    return result;
  }, [rootNote, motion, qualityPattern, steps]);

  // detect if the cycle closes back to start
  const cycleLength = useMemo(() => {
    let note = rootNote;
    for (let i = 1; i <= 12; i++) {
      note = transposeByChroma(note, motion.semitones);
      if (Note.chroma(note) === Note.chroma(rootNote)) return i;
    }
    return 12;
  }, [rootNote, motion]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontWeight: 700 }}>
          🔁 Harmonic Cycles
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
          Generate chord progressions that move by a fixed interval — ascending fourths, descending thirds, Giant Steps axis, and more. Each motion type has a distinct harmonic colour and theoretical basis.
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Root note */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Root note</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ROOT_NOTES.map(n => (
              <button key={n} onClick={() => setRootNote(n)} style={{
                padding: '4px 12px', borderRadius: 6, border: `1px solid ${n === rootNote ? '#7c3aed' : '#30363d'}`,
                background: n === rootNote ? '#7c3aed20' : '#0d1117',
                color: n === rootNote ? '#c4b5fd' : '#8b949e',
                fontSize: 13, fontWeight: n === rootNote ? 700 : 400, cursor: 'pointer',
                fontFamily: 'monospace',
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Motion type */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Interval motion</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MOTION_TYPES.map(m => (
              <button key={m.id} onClick={() => setMotionId(m.id)} style={{
                padding: '8px 12px', borderRadius: 6, border: `1px solid ${m.id === motionId ? '#3b82f6' : '#30363d'}`,
                background: m.id === motionId ? '#3b82f620' : '#0d1117',
                color: m.id === motionId ? '#93c5fd' : '#8b949e',
                fontSize: 13, cursor: 'pointer', textAlign: 'left',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, minWidth: 200 }}>{m.label}</span>
                <span style={{ fontSize: 11, color: m.id === motionId ? '#6b7280' : '#4b5563' }}>{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality + steps row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Chord quality</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {QUALITY_PATTERNS.map(q => (
                <button key={q.id} onClick={() => setQualityId(q.id)} style={{
                  padding: '6px 10px', borderRadius: 6, border: `1px solid ${q.id === qualityId ? '#10b981' : '#30363d'}`,
                  background: q.id === qualityId ? '#10b98120' : '#0d1117',
                  color: q.id === qualityId ? '#6ee7b7' : '#8b949e',
                  fontSize: 12, cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontWeight: q.id === qualityId ? 700 : 400 }}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <button key={n} onClick={() => setSteps(n)} style={{
                  padding: '5px 10px', borderRadius: 6, border: `1px solid ${n === steps ? '#f59e0b' : '#30363d'}`,
                  background: n === steps ? '#f59e0b20' : '#0d1117',
                  color: n === steps ? '#fbbf24' : '#8b949e',
                  fontSize: 12, cursor: 'pointer', textAlign: 'center', fontWeight: n === steps ? 700 : 400,
                }}>{n} chords</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated progression */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Generated progression
          <span style={{ marginLeft: 8, color: '#374151', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>
            (cycle closes after {cycleLength} steps)
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {chords.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                padding: '10px 16px', borderRadius: 8,
                background: i === 0 ? '#7c3aed20' : '#1c2128',
                border: `1px solid ${i === 0 ? '#7c3aed' : '#3b82f640'}`,
                textAlign: 'center', minWidth: 64,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#c4b5fd' : '#e6edf3', fontFamily: 'monospace', lineHeight: 1.1 }}>
                  {c.symbol}
                </div>
                <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3 }}>
                  {i === 0 ? 'start' : `+${Math.abs(motion.semitones) * i} st`}
                </div>
              </div>
              {i < chords.length - 1 && (
                <span style={{ fontSize: 16, color: '#374151' }}>→</span>
              )}
            </div>
          ))}
          {cycleLength === steps && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: '#374151' }}>→</span>
              <div style={{ padding: '10px 16px', borderRadius: 8, border: '1px dashed #7c3aed50', textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontSize: 14, color: '#7c3aed80', fontFamily: 'monospace' }}>({chords[0].symbol})</div>
                <div style={{ fontSize: 10, color: '#374151', marginTop: 3 }}>cycle</div>
              </div>
            </div>
          )}
        </div>

        {/* String representation */}
        <div style={{ marginTop: 14, padding: '8px 12px', background: '#0d1117', borderRadius: 6, fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>
          {chords.map(c => c.symbol).join(' → ')}
          {cycleLength === steps ? ` → (${chords[0].symbol})` : ''}
        </div>

        {/* Quality pattern note */}
        <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563' }}>
          {qualityPattern.desc}
        </div>
      </div>

      {/* Theory panel */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Theory — {motion.label}</div>

        <p style={{ margin: 0, fontSize: 13, color: '#8b949e', lineHeight: 1.7 }}>{motion.theory}</p>

        {motion.examples.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6, fontWeight: 600 }}>Example sequences</div>
            {motion.examples.map((ex, i) => (
              <div key={i} style={{ fontFamily: 'monospace', fontSize: 13, color: '#c4b5fd', padding: '4px 10px', background: '#0d1117', borderRadius: 5, marginBottom: 4 }}>{ex}</div>
            ))}
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6, fontWeight: 600 }}>Famous uses</div>
          {motion.famousUses.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#e6edf3', fontWeight: 600, flexShrink: 0 }}>{u.name}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{u.motion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips for composition */}
      <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '12px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Composition tips</div>
        <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.8 }}>
          <strong style={{ color: '#6b7280' }}>Section B / Bridge:</strong> Use a cycle of {cycleLength} chords to visit all roots before returning to I. Each full revolution = one phrase.<br />
          <strong style={{ color: '#6b7280' }}>Vamp / groove:</strong> Pick {steps <= 4 ? `${steps}` : '2–4'} chords and loop them. The motion creates forward momentum without needing a V→I resolution.<br />
          <strong style={{ color: '#6b7280' }}>Combine with quality change:</strong> Start with "All {qualityPattern.label}" then switch to "ii–V pairs" for the last chord to land on a tonic.
        </div>
      </div>
    </div>
  );
}

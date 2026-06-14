import { useState, useMemo } from 'react';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DrumPattern {
  kick: boolean[];
  snare: boolean[];
  ghost: boolean[];
  hat: boolean[];
}

interface DisplacedPattern {
  offset: number;
  label: string;
  description: string;
}

interface ArtistGroove {
  id: string;
  name: string;
  color: string;
  tagline: string;
  feel: string;
  meter: string;
  meterExplainer: string;
  pattern: DrumPattern;
  patternSlots: number;
  basslineIdea: string;
  basslineNotes: string;
  displacements?: DisplacedPattern[];
  notes: string[];
  songRef: string;
}

// ─── Legend ─────────────────────────────────────────────────────────────────────

const PARTS = [
  { key: 'kick'  as const, symbol: 'K', color: '#ef4444', desc: 'Kick drum' },
  { key: 'snare' as const, symbol: 'S', color: '#f59e0b', desc: 'Snare' },
  { key: 'ghost' as const, symbol: 'G', color: '#8b949e', desc: 'Ghost note (soft)' },
  { key: 'hat'   as const, symbol: 'H', color: '#06b6d4', desc: 'Hi-hat' },
];

// shorthand
const T = true, F = false;

// ─── Groove Data ───────────────────────────────────────────────────────────────

const ARTIST_GROOVES: ArtistGroove[] = [
  {
    id: 'snarky-grown-folks',
    name: 'Snarky Puppy',
    color: '#f59e0b',
    tagline: '"Grown Folks" displaced 16th pocket',
    feel: 'Syncopated 4/4 — E(7,16) Euclidean',
    meter: '4/4',
    meterExplainer: '16 sixteenth-note slots. Feel is Euclidean: 7 hits spread across 16 positions.',
    patternSlots: 16,
    pattern: {
      //     1     e     +     a     2     e     +     a     3     e     +     a     4     e     +     a
      kick:  [T,    F,    F,    T,    F,    F,    T,    F,    T,    F,    T,    F,    F,    F,    T,    F],
      snare: [F,    F,    F,    F,    T,    F,    F,    F,    F,    F,    F,    F,    T,    F,    F,    F],
      ghost: [F,    F,    F,    F,    F,    F,    F,    T,    F,    F,    F,    T,    F,    F,    F,    T],
      hat:   [T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F],
    },
    basslineIdea: 'Root on beat 1, b7 on beat "3+", 5th on beat 3 — Lydian dominant color.',
    basslineNotes: 'C – Bb – G – Bb (in Lydian Dominant = C Lydian Dom)',
    displacements: [
      { offset: 1, label: '+1 sixteenth', description: 'Shift whole pattern right by 1 sixteenth. The snare lands on "e" of 2 — feels behind the beat, more hypnotic.' },
      { offset: 2, label: '+2 sixteenths', description: 'Shift by 2. Snare hits on the "+" of 2. Even more displaced — floating, dreamlike pocket.' },
    ],
    notes: [
      'The Euclidean pattern E(7,16) spaces 7 hits across 16 slots — mathematically even but rhythmically syncopated',
      'Snare stays on beats 2 and 4 for groove anchor, everything else is polyrhythmic around it',
      'Hi-hats on straight 8ths provide the reference point against which the kick syncopation feels complex',
      'Ghost notes on "a" of 2 and "a" of 3 add the feel without cluttering the fundamental pattern',
    ],
    songRef: '"Grown Folks", "Lingus", "What About Me?"',
  },
  {
    id: 'ghost-note-7-8',
    name: 'Ghost Note',
    color: '#a855f7',
    tagline: 'Odd meter in 7/8 — 3+2+2 grouping',
    feel: '7/8 — grouped as 3+2+2 with lurch into bar 2',
    meter: '7/8',
    meterExplainer: '14 eighth-note slots (7 per bar × 2 bars). Grouped 3+2+2. The final "2" creates the lurch into the next bar.',
    patternSlots: 14,
    pattern: {
      //     1     2     3   | 1     2   | 1     2   | 1     2     3   | 1     2   | 1     2
      kick:  [T,    F,    F,    F,    T,    F,    F,    T,    F,    F,    F,    T,    F,    F],
      snare: [F,    F,    T,    F,    F,    T,    F,    F,    F,    T,    F,    F,    T,    F],
      ghost: [F,    T,    F,    F,    F,    F,    T,    F,    T,    F,    F,    F,    F,    T],
      hat:   [T,    T,    T,    T,    T,    T,    T,    T,    T,    T,    T,    T,    T,    T],
    },
    basslineIdea: 'Pedal bass on root for 3+2, then movement on the final "2" to b5 — maximum tension before next bar.',
    basslineNotes: 'D – D – D – D – D – Ab – D (pedal with tritone approach)',
    notes: [
      '7/8 in 3+2+2: beats are NOT equal. Group 1 = 3 eighth-notes, Groups 2+3 = 2 eighth-notes each',
      'The accent pattern tells the ear where groups start: beat 1 of each group gets the accent',
      'The final "2" group is the shortest — it creates the "stumble" that propels into the next bar',
      'Think of it as walking: 3-step + 2-step + 2-step. The "2-2" at the end feels like a quick double-step',
    ],
    songRef: '"Cold Sweats", "Hyenas", "1+1=5"',
  },
  {
    id: 'vulfpeck-wait',
    name: 'Vulfpeck',
    color: '#f97316',
    tagline: '"Wait for the Moment" — 16th-note tight Motown',
    feel: 'Straight 4/4 — Motown-tight 16th feel. Minimum notes, maximum pocket.',
    meter: '4/4',
    meterExplainer: '16 sixteenth-note slots. Every hit is exactly where it should be. Ghost notes between main accents.',
    patternSlots: 16,
    pattern: {
      //     1     e     +     a     2     e     +     a     3     e     +     a     4     e     +     a
      kick:  [T,    F,    F,    F,    F,    F,    F,    F,    T,    F,    F,    F,    F,    F,    F,    F],
      snare: [F,    F,    F,    F,    T,    F,    F,    F,    F,    F,    F,    F,    T,    F,    F,    F],
      ghost: [F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T],
      hat:   [T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F],
    },
    basslineIdea: '"Dean Town"-style: root on 1, then a melodic descent. The bass IS the melody here.',
    basslineNotes: 'F – F – Eb – Db – C – Bb – Ab – F (Dean Town descending)',
    notes: [
      'The groove is TIGHT — every 16th is in exactly the right place, none extra',
      'Ghost notes between main hits are extremely soft — they\'re felt, not heard consciously',
      'Kick is deliberately simple (1 and 3 only) to leave the low-end focused and punchy',
      'Space is the technique: what Vulfpeck does NOT play is as important as what they do',
      'The bass functions melodically — Joe Dart\'s lines are compositions, not just chord tones',
    ],
    songRef: '"Wait for the Moment", "Dean Town", "Back Pocket", "Disco Ulysses"',
  },
  {
    id: 'yussef-floating',
    name: 'Yussef Dayes',
    color: '#38bdf8',
    tagline: 'Floating triplet feel — cross-rhythm kick/hat',
    feel: '4/4 with triplet subdivision — kick and hat in 3:2 cross-rhythm',
    meter: '4/4 (triplet feel)',
    meterExplainer: '12 triplet-eighth slots per bar (4/4 with triplet subdivision). The kick follows a 3-against-4 pattern against the hat.',
    patternSlots: 12,
    pattern: {
      //     1    trip trip   2    trip trip   3    trip trip   4    trip trip
      kick:  [T,    F,    F,    F,    F,    T,    F,    F,    T,    F,    F,    F],
      snare: [F,    F,    F,    T,    F,    F,    F,    F,    F,    T,    F,    F],
      ghost: [F,    T,    F,    F,    T,    F,    F,    T,    F,    F,    T,    F],
      hat:   [T,    F,    T,    F,    T,    F,    T,    F,    T,    F,    T,    F],
    },
    basslineIdea: 'Pedal root for 8 bars, then slowly rise by whole step. Let the drum dictate the rhythm.',
    basslineNotes: 'D (pedal 8 bars) → E (4 bars) → D (return)',
    notes: [
      'The "floating" feel comes from the kick following a triplet cross-rhythm against a 4/4 framework',
      'Hi-hat plays quarter-note triplets — creates ambiguity between compound and simple meter',
      'Snare lands on 2 and 4 within the triplet grid (triplet beat 1 of the 2nd and 4th groups)',
      'Ghost notes on triplet subdivisions add texture without disturbing the floating quality',
      'Tempo is loose — Yussef Dayes deliberately plays slightly behind the grid for expressiveness',
    ],
    songRef: '"Love Is Everywhere", "Tioga Pass", "Something", "The Light"',
  },
];

// ─── StepGrid Component ─────────────────────────────────────────────────────────

function StepGrid({
  pattern,
  patternSlots,
  color,
  offset = 0,
}: {
  pattern: DrumPattern;
  patternSlots: number;
  color: string;
  offset?: number;
}) {
  const cellSize = patternSlots <= 12 ? 34 : 26;

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Beat labels */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 4, paddingLeft: 28 }}>
        {Array.from({ length: patternSlots }, (_, i) => {
          const isBeat = patternSlots === 12
            ? i % 3 === 0
            : patternSlots === 14
            ? [0, 3, 5, 7, 10, 12].includes(i)
            : i % 4 === 0;
          const beatNum = patternSlots === 12
            ? Math.floor(i / 3) + 1
            : patternSlots === 14
            ? ['1', '', '', '1', '', '1', '', '1', '', '', '1', '', '1', ''][i]
            : Math.floor(i / 4) + 1;
          return (
            <div key={i} style={{
              width: cellSize, height: 12, textAlign: 'center',
              fontFamily: "'DM Mono', monospace", fontSize: 8,
              color: isBeat ? '#6b7280' : '#21262d',
            }}>
              {isBeat ? beatNum : (patternSlots === 16 && i % 2 === 0 ? '+' : '')}
            </div>
          );
        })}
      </div>

      {PARTS.map(({ key, symbol, color: partColor }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
          <span style={{
            width: 24,
            fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
            color: partColor, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {symbol}
          </span>
          {Array.from({ length: patternSlots }, (_, i) => {
            const effectiveI = (i - offset + patternSlots) % patternSlots;
            const isOn = pattern[key][effectiveI] ?? false;
            const isGroupStart = patternSlots === 16
              ? i % 4 === 0
              : patternSlots === 12
              ? i % 3 === 0
              : [0, 3, 5, 7, 10, 12].includes(i);
            return (
              <div key={i} style={{
                width: cellSize, height: cellSize, borderRadius: 4,
                background: isOn
                  ? (key === 'ghost' ? `${partColor}66` : partColor)
                  : '#1c2128',
                border: `1px solid ${isOn ? partColor : isGroupStart ? '#30363d' : '#21262d'}`,
                boxShadow: isOn && key !== 'ghost' ? `0 0 6px ${partColor}44` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.1s',
              }}>
                {isOn && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: key === 'ghost' ? 7 : 9, fontWeight: 700,
                    color: key === 'ghost' ? `${partColor}cc` : 'rgba(255,255,255,0.9)',
                  }}>
                    {symbol}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Displacement Panel ─────────────────────────────────────────────────────────

function DisplacementPanel({ groove }: { groove: ArtistGroove }) {
  const [activeOffset, setActiveOffset] = useState(0);
  const displacements = groove.displacements ?? [];
  const color = groove.color;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 10,
      }}>
        Displacement Variations
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {[{ offset: 0, label: 'Original', description: 'Unshifted pattern — the base groove.' }, ...displacements].map(d => (
          <button
            key={d.offset}
            onClick={() => setActiveOffset(d.offset)}
            style={{
              padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${activeOffset === d.offset ? color : '#30363d'}`,
              background: activeOffset === d.offset ? `${color}18` : 'transparent',
              color: activeOffset === d.offset ? color : '#6b7280',
              fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
      {activeOffset > 0 && (
        <div style={{
          padding: '8px 12px', background: '#0d1117', borderRadius: 6,
          borderLeft: `2px solid ${color}66`,
          fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280',
          marginBottom: 10, lineHeight: 1.5,
        }}>
          {displacements.find(d => d.offset === activeOffset)?.description}
        </div>
      )}
      <StepGrid
        pattern={groove.pattern}
        patternSlots={groove.patternSlots}
        color={color}
        offset={activeOffset}
      />
      {activeOffset > 0 && (
        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
          Pattern shifted {activeOffset} sixteenth{activeOffset > 1 ? 's' : ''} to the right
        </div>
      )}
    </div>
  );
}

// ─── Composition Tips ───────────────────────────────────────────────────────────

const COMPOSITION_TIPS: Record<string, { label: string; desc: string }[]> = {
  'snarky-grown-folks': [
    { label: 'Start on the "and"', desc: 'Snarky Puppy almost never starts a figure on beat 1. Start on the "+" of 4 and let it spill into the bar.' },
    { label: 'Displace every 4 bars', desc: 'Take the core motif and shift it by one 16th note every 4 bars. The groove evolves without changing harmony.' },
    { label: 'Euclidean math', desc: 'E(7,16): spread 7 kick hits across 16 slots as evenly as possible. The result is mathematically balanced but rhythmically surprising.' },
  ],
  'ghost-note-7-8': [
    { label: 'Choose the grouping first', desc: '3+2+2 or 2+2+3? This determines where the gravity sits. 3+2+2 feels urgent, 2+2+3 settles at the end.' },
    { label: 'Short motifs work better', desc: 'In odd meters, 2–3 note cells work better than long lines. The unequal bar length eats long phrases.' },
    { label: 'Rests as structure', desc: 'In Ghost Note\'s 7/8, rests are structural beats. The silence in the final "2" group creates the lurch into bar 2.' },
  ],
  'vulfpeck-wait': [
    { label: 'Write the bass first', desc: 'Joe Dart\'s bass line IS the composition. Everything else exists to support and respond to the bass melody.' },
    { label: 'Subtract until it hurts', desc: 'Jack Stratton\'s rule: if the track sounds full, remove something. Keep removing until removing something would make it worse.' },
    { label: 'Ghost notes = the soul', desc: 'Those very soft touches between main hits are what creates the "bounce" in the groove. Feel, not content.' },
  ],
  'yussef-floating': [
    { label: 'Record drums first', desc: 'Yussef Dayes builds tracks from the drums out. The rhythm dictates everything — harmony and melody fill the rhythmic spaces.' },
    { label: 'Float behind the beat', desc: 'The floating feel comes from playing slightly behind the grid. Don\'t try to be exactly on time — the looseness IS the expression.' },
    { label: 'Triplets against 4', desc: 'Hat plays quarter-note triplets against the 4/4 framework. This creates the 3:2 polyrhythm that defines the ambiguous meter feel.' },
  ],
};

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function GrooveKitchenFeature() {
  const [activeGrooveId, setActiveGrooveId] = useState('snarky-grown-folks');

  const groove = useMemo(
    () => ARTIST_GROOVES.find(g => g.id === activeGrooveId) ?? ARTIST_GROOVES[0],
    [activeGrooveId]
  );

  const color = groove.color;
  const tips = COMPOSITION_TIPS[groove.id] ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{ padding: '28px 0 20px', borderBottom: '1px solid #21262d', marginBottom: 28 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', color: '#4b5563', textTransform: 'uppercase',
            }}>
              Composition · Rhythm
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26,
            letterSpacing: '-0.5px', color: '#e6edf3', margin: '0 0 6px',
          }}>
            Groove Kitchen
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            Study the exact drum + bass patterns that define each artist's sound.
            Ghost Note and Yussef Dayes compose <em>from the rhythm outward</em> — start here.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
            {ARTIST_GROOVES.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveGrooveId(g.id)}
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  border: `1px solid ${activeGrooveId === g.id ? g.color : '#30363d'}`,
                  background: activeGrooveId === g.id ? `${g.color}18` : 'transparent',
                  color: activeGrooveId === g.id ? g.color : '#6b7280',
                  fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Groove header */}
        <div style={{
          border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
          borderRadius: 10, background: '#161b22', padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color, marginBottom: 2 }}>
            {groove.name}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#8b949e', marginBottom: 14 }}>
            {groove.tagline}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 4,
              background: `${color}18`, border: `1px solid ${color}30`,
              fontFamily: "'DM Mono', monospace", fontSize: 11, color: `${color}bb`,
            }}>
              {groove.meter}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 4,
              background: '#1c2128', border: '1px solid #30363d',
              fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e',
            }}>
              {groove.feel}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, borderLeft: `2px solid ${color}44`, paddingLeft: 12 }}>
            {groove.meterExplainer}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20,
          padding: '10px 14px', background: '#161b22', border: '1px solid #21262d', borderRadius: 8,
        }}>
          {PARTS.map(p => (
            <div key={p.symbol} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 4,
                background: p.color + '33', border: `1px solid ${p.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, color: p.color,
              }}>
                {p.symbol}
              </div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{p.desc}</span>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{
          background: '#161b22', border: '1px solid #21262d',
          borderRadius: 10, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#4b5563', marginBottom: 14,
          }}>
            Drum Pattern
          </div>
          <StepGrid pattern={groove.pattern} patternSlots={groove.patternSlots} color={color} />
          {groove.displacements && groove.displacements.length > 0 && (
            <DisplacementPanel groove={groove} />
          )}
        </div>

        {/* Bass line */}
        <div style={{
          background: '#161b22', border: '1px solid #21262d',
          borderRadius: 10, padding: '18px 22px', marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#4b5563', marginBottom: 10,
          }}>
            Bass Line Companion
          </div>
          <div style={{ fontSize: 13, color: '#c9d1d9', marginBottom: 10, lineHeight: 1.6 }}>
            {groove.basslineIdea}
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color,
            padding: '8px 14px', background: '#0d1117', border: `1px solid ${color}22`, borderRadius: 6,
            letterSpacing: '0.04em',
          }}>
            {groove.basslineNotes}
          </div>
        </div>

        {/* Notes */}
        <div style={{
          background: '#161b22', border: '1px solid #21262d',
          borderRadius: 10, padding: '18px 22px', marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#4b5563', marginBottom: 12,
          }}>
            How to play this groove
          </div>
          {groove.notes.map((note, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: `${color}66`, flexShrink: 0, minWidth: 18, marginTop: 3,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.6 }}>{note}</span>
            </div>
          ))}
        </div>

        {/* Song reference */}
        <div style={{
          padding: '10px 14px', background: '#161b22', border: '1px solid #21262d',
          borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
        }}>
          <span style={{ fontSize: 12, color: '#4b5563', fontFamily: "'DM Mono', monospace" }}>
            Reference tracks:
          </span>
          <span style={{ fontSize: 12, color, fontFamily: "'DM Mono', monospace" }}>
            {groove.songRef}
          </span>
        </div>

        {/* Composition tips */}
        {tips.length > 0 && (
          <div style={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: 10, padding: '18px 22px',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#4b5563', marginBottom: 12,
            }}>
              Composition Approach — {groove.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {tips.map(tip => (
                <div key={tip.label} style={{
                  background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 4 }}>{tip.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

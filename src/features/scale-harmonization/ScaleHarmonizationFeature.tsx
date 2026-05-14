import { useState, useMemo } from 'react';
import { SCALE_FORMULAS, noteToSemitone, semitoneToNote, notePreferFlat, getScaleNotes } from '@shared/utils/musicTheory';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Emoji + mood for harmonizable scales
const SCALE_VIBE: Record<string, { emoji: string; mood: string }> = {
  // Major modes
  major:            { emoji: '☀️', mood: 'Bright & happy' },
  dorian:           { emoji: '🎷', mood: 'Jazzy & soulful' },
  phrygian:         { emoji: '🌊', mood: 'Spanish & intense' },
  lydian:           { emoji: '✨', mood: 'Dreamy & floating' },
  mixolydian:       { emoji: '🎸', mood: 'Bluesy & earthy' },
  aeolian:          { emoji: '🌙', mood: 'Melancholic & dark' },
  locrian:          { emoji: '😈', mood: 'Tense & unstable' },
  // Harmonic minor modes
  harmonicMinor:    { emoji: '🎻', mood: 'Dramatic & Eastern' },
  locrianNat6:      { emoji: '⚠️', mood: 'Edgy, raised 6th' },
  ionianSharp5:     { emoji: '☁️', mood: 'Augmented & cloudy' },
  dorianSharp4:     { emoji: '🎪', mood: 'Romanian / exotic' },
  phrygianDominant: { emoji: '🔥', mood: 'Flamenco & intense' },
  lydianSharp2:     { emoji: '⭐', mood: 'Bright exotic Lydian' },
  superLocrianBb7:  { emoji: '⚡', mood: 'Maximum dissonance' },
  // Melodic minor modes
  melodicMinor:     { emoji: '🎺', mood: 'Sophisticated jazz' },
  dorianb2:         { emoji: '🌐', mood: 'Phrygian ♯6 — exotic' },
  lydianAug:        { emoji: '🌈', mood: 'Ethereal & augmented' },
  lydianDom:        { emoji: '🎯', mood: 'Bartók / Lydian jazz' },
  mixolydianb6:     { emoji: '🖼️', mood: 'Aeolian dominant' },
  locrianNat2:      { emoji: '🎭', mood: 'Half-dim, raised 2nd' },
  altered:          { emoji: '💥', mood: 'Max tension — jazz' },
  // Other
  harmonicMajor:    { emoji: '🏛️', mood: 'Classical & rich' },
  bebopDom:         { emoji: '🎙️', mood: 'Classic bebop' },
  bebopMaj:         { emoji: '🎩', mood: 'Swing era classic' },
  bebopDorian:      { emoji: '🎵', mood: 'Minor bebop' },
  hungarianMinor:   { emoji: '🏰', mood: 'Mysterious & exotic' },
  doubleHarmonic:   { emoji: '🕌', mood: 'Byzantine & mystical' },
  neapolitanMaj:    { emoji: '🇮🇹', mood: 'Romantic & lyrical' },
  neapolitanMin:    { emoji: '🌹', mood: 'Neapolitan minor' },
  enigmatic:        { emoji: '🔮', mood: "Verdi's enigma" },
  persian:          { emoji: '🌙', mood: 'Middle-Eastern' },
};

// Category grouping — 3 modal families + extras
const SCALE_CATEGORIES: { label: string; keys: string[] }[] = [
  {
    label: 'Major Scale Modes',
    keys: ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'],
  },
  {
    label: 'Harmonic Minor Modes',
    keys: ['harmonicMinor', 'locrianNat6', 'ionianSharp5', 'dorianSharp4', 'phrygianDominant', 'lydianSharp2', 'superLocrianBb7'],
  },
  {
    label: 'Melodic Minor Modes',
    keys: ['melodicMinor', 'dorianb2', 'lydianAug', 'lydianDom', 'mixolydianb6', 'locrianNat2', 'altered'],
  },
  {
    label: 'Other Scales',
    keys: ['harmonicMajor', 'bebopDom', 'bebopMaj', 'bebopDorian', 'hungarianMinor', 'doubleHarmonic', 'neapolitanMaj', 'neapolitanMin', 'enigmatic', 'persian'],
  },
];

// Only 7-note scales
const HARMONIZABLE_SCALES = Object.entries(SCALE_FORMULAS).filter(([, f]) => f.intervals.length === 7);

const HARMONIZABLE_KEYS = new Set(HARMONIZABLE_SCALES.map(([k]) => k));

type ChordSize = 'triad' | '7th';

interface DiatonicChord {
  degreeNum: number;
  romanNumeral: string;
  root: string;
  quality: string;
  symbol: string;
  notes: string[];
  intervals: number[];
  fn: 'Tonic' | 'Subdominant' | 'Dominant' | 'Color';
}

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

function detectTriadQuality(t3: number, t5: number): { quality: string; isMinor: boolean } {
  if (t3 === 4 && t5 === 7) return { quality: 'maj', isMinor: false };
  if (t3 === 3 && t5 === 7) return { quality: 'm', isMinor: true };
  if (t3 === 3 && t5 === 6) return { quality: 'dim', isMinor: true };
  if (t3 === 4 && t5 === 8) return { quality: 'aug', isMinor: false };
  if (t3 === 2 && t5 === 7) return { quality: 'sus2', isMinor: false };
  if (t3 === 5 && t5 === 7) return { quality: 'sus4', isMinor: false };
  return { quality: 'maj', isMinor: false };
}

function detect7thQuality(t3: number, t5: number, t7: number): { quality: string; isMinor: boolean } {
  if (t3 === 4 && t5 === 7 && t7 === 11) return { quality: 'maj7', isMinor: false };
  if (t3 === 4 && t5 === 7 && t7 === 10) return { quality: '7', isMinor: false };
  if (t3 === 3 && t5 === 7 && t7 === 10) return { quality: 'm7', isMinor: true };
  if (t3 === 3 && t5 === 7 && t7 === 11) return { quality: 'mMaj7', isMinor: true };
  if (t3 === 3 && t5 === 6 && t7 === 10) return { quality: 'm7b5', isMinor: true };
  if (t3 === 3 && t5 === 6 && t7 === 9) return { quality: 'dim7', isMinor: true };
  if (t3 === 4 && t5 === 8 && t7 === 11) return { quality: 'augMaj7', isMinor: false };
  if (t3 === 4 && t5 === 8 && t7 === 10) return { quality: '7#5', isMinor: false };
  return { quality: 'maj7', isMinor: false };
}

function harmonize(key: string, scaleKey: string, size: ChordSize): DiatonicChord[] {
  const formula = SCALE_FORMULAS[scaleKey];
  if (!formula || formula.intervals.length !== 7) return [];
  const intervals = formula.intervals;
  const n = intervals.length;
  const rootSemitone = noteToSemitone(key);
  const preferFlat = notePreferFlat(key);

  return intervals.map((degInt, di) => {
    const degRoot = semitoneToNote((rootSemitone + degInt) % 12, preferFlat);
    const third = intervals[(di + 2) % n];
    const fifth = intervals[(di + 4) % n];
    const seventh = intervals[(di + 6) % n];
    const t3 = (third - degInt + 120) % 12;
    const t5 = (fifth - degInt + 120) % 12;
    const t7 = (seventh - degInt + 120) % 12;

    let quality: string;
    let isMinor: boolean;
    if (size === 'triad') {
      const det = detectTriadQuality(t3, t5);
      quality = det.quality;
      isMinor = det.isMinor;
    } else {
      const det = detect7thQuality(t3, t5, t7);
      quality = det.quality;
      isMinor = det.isMinor;
    }

    const symbol = `${degRoot}${quality === 'maj' ? '' : quality}`;
    const roman = isMinor ? ROMAN_LOWER[di] : ROMAN_UPPER[di];
    const romanNumeral =
      quality === 'dim' || quality === 'm7b5' || quality === 'dim7'
        ? `${roman}°`
        : quality === 'aug' || quality === 'augMaj7'
          ? `${roman}+`
          : roman;

    const noteIntervals = size === 'triad' ? [0, t3, t5] : [0, t3, t5, t7];
    const degRootSemitone = (rootSemitone + degInt) % 12;
    const notes = noteIntervals.map((i) => semitoneToNote((degRootSemitone + i) % 12, preferFlat));

    let fn: DiatonicChord['fn'] = 'Color';
    if (di === 0 || di === 2 || di === 5) fn = 'Tonic';
    else if (di === 1 || di === 3) fn = 'Subdominant';
    else if (di === 4 || di === 6) fn = 'Dominant';

    return { degreeNum: di + 1, romanNumeral, root: degRoot, quality, symbol, notes, intervals: noteIntervals, fn };
  });
}

const FN_COLORS = {
  Tonic: '#10b981',
  Subdominant: '#3b82f6',
  Dominant: '#ef4444',
  Color: '#8b5cf6',
};

export default function ScaleHarmonizationFeature() {
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [chordSize, setChordSize] = useState<ChordSize>('7th');
  const [selectedDegree, setSelectedDegree] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Major Modes');

  const chords = useMemo(() => harmonize(selectedKey, selectedScale, chordSize), [selectedKey, selectedScale, chordSize]);
  const scaleNotes = useMemo(() => getScaleNotes(selectedKey, selectedScale), [selectedKey, selectedScale]);
  const scaleName = SCALE_FORMULAS[selectedScale]?.name ?? selectedScale;
  const selectedChord = selectedDegree !== null ? chords[selectedDegree] : null;

  // Scales in the active category that are harmonizable
  const categoryScales = useMemo(() => {
    const cat = SCALE_CATEGORIES.find((c) => c.label === activeCategory);
    if (!cat) return [];
    return cat.keys
      .filter((k) => HARMONIZABLE_KEYS.has(k))
      .map((k) => ({
        key: k,
        formula: SCALE_FORMULAS[k],
        vibe: SCALE_VIBE[k] ?? { emoji: '🎵', mood: '' },
      }));
  }, [activeCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Scale Harmonization</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Generate diatonic chords from any scale. Stack thirds to see triads or seventh chords on each degree.
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 10,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Key selector */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Key</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setSelectedKey(k)}
                style={{
                  padding: '5px 10px',
                  background: selectedKey === k ? '#1d4ed820' : '#0d1117',
                  border: `1px solid ${selectedKey === k ? '#3b82f6' : '#30363d'}`,
                  borderRadius: 6,
                  color: selectedKey === k ? '#93c5fd' : '#6b7280',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: selectedKey === k ? 700 : 400,
                  fontFamily: 'monospace',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Scale selector — category tabs + card grid */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 8 }}>Scale</label>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {SCALE_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                style={{
                  padding: '4px 12px',
                  background: activeCategory === cat.label ? '#7c3aed20' : 'none',
                  border: `1px solid ${activeCategory === cat.label ? '#7c3aed' : '#30363d'}`,
                  borderRadius: 20,
                  color: activeCategory === cat.label ? '#a78bfa' : '#6b7280',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: activeCategory === cat.label ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scale cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
            {categoryScales.map(({ key, formula, vibe }) => {
              const isActive = selectedScale === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedScale(key);
                    setSelectedDegree(null);
                  }}
                  style={{
                    padding: '10px 12px',
                    background: isActive ? '#7c3aed18' : '#0d1117',
                    border: `1px solid ${isActive ? '#7c3aed' : '#21262d'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? '0 0 10px #7c3aed30' : 'none',
                  }}
                >
                  <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>{vibe.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#c4b5fd' : '#e6edf3', lineHeight: 1.2, marginBottom: 2 }}>
                    {formula?.name ?? key}
                  </div>
                  {vibe.mood && <div style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.2 }}>{vibe.mood}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chord size */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#8b949e', marginRight: 4 }}>Chord type:</label>
          {(['triad', '7th'] as ChordSize[]).map((sz) => (
            <button
              key={sz}
              onClick={() => setChordSize(sz)}
              style={{
                padding: '6px 16px',
                background: chordSize === sz ? '#1d4ed820' : 'none',
                border: `1px solid ${chordSize === sz ? '#3b82f6' : '#30363d'}`,
                borderRadius: 6,
                color: chordSize === sz ? '#93c5fd' : '#6b7280',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: chordSize === sz ? 600 : 400,
              }}
            >
              {sz === 'triad' ? 'Triads' : '7th Chords'}
            </button>
          ))}
        </div>
      </div>

      {/* Selected scale info */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{SCALE_VIBE[selectedScale]?.emoji ?? '🎵'}</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>
              {selectedKey} {scaleName}
            </span>
            {SCALE_VIBE[selectedScale]?.mood && (
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>— {SCALE_VIBE[selectedScale].mood}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {scaleNotes.map((n, i) => (
            <span
              key={i}
              style={{
                padding: '3px 10px',
                borderRadius: 5,
                background: i === 0 ? '#f9731620' : '#1c2128',
                border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
                fontSize: 13,
                fontFamily: 'monospace',
                color: i === 0 ? '#fb923c' : '#e6edf3',
                fontWeight: i === 0 ? 700 : 400,
              }}
            >
              {i + 1}. {n}
            </span>
          ))}
        </div>
      </div>

      {/* Chord grid */}
      {chords.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
            {chords.map((chord, i) => {
              const fnColor = FN_COLORS[chord.fn];
              const isSelected = selectedDegree === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDegree(isSelected ? null : i)}
                  style={{
                    background: isSelected ? '#161b22' : '#0d1117',
                    border: `1px solid ${isSelected ? fnColor : '#21262d'}`,
                    borderRadius: 10,
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.1s',
                    boxShadow: isSelected ? `0 0 12px ${fnColor}30` : 'none',
                  }}
                >
                  <div style={{ fontSize: 11, color: fnColor, fontWeight: 600, marginBottom: 4 }}>{chord.romanNumeral}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace', lineHeight: 1 }}>
                    {chord.symbol}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      color: fnColor,
                      padding: '1px 5px',
                      background: `${fnColor}20`,
                      borderRadius: 3,
                      display: 'inline-block',
                    }}
                  >
                    {chord.fn}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {chord.notes.map((n, j) => (
                      <span
                        key={j}
                        style={{
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: j === 0 ? '#fb923c' : '#6b7280',
                        }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Function legend */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(FN_COLORS).map(([fn, color]) => (
              <div key={fn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{fn}</span>
              </div>
            ))}
          </div>

          {/* Selected chord detail */}
          {selectedChord && (
            <div
              style={{
                background: '#161b22',
                border: `1px solid ${FN_COLORS[selectedChord.fn]}40`,
                borderRadius: 10,
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: FN_COLORS[selectedChord.fn], fontWeight: 600, marginBottom: 2 }}>
                    Degree {selectedChord.degreeNum} — {selectedChord.fn}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace' }}>
                    {selectedChord.romanNumeral} {selectedChord.symbol}
                  </div>
                  <div style={{ fontSize: 13, color: '#8b949e', marginTop: 2 }}>
                    Quality: {selectedChord.quality} · Root: {selectedChord.root}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedChord.notes.map((n, i) => {
                  const labels = ['Root', '3rd', '5th', '7th', '9th'][i] ?? '';
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontFamily: 'monospace',
                          fontSize: 16,
                          fontWeight: 700,
                          background: i === 0 ? '#f9731620' : '#1c2128',
                          border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
                          color: i === 0 ? '#fb923c' : '#e6edf3',
                        }}
                      >
                        {n}
                      </div>
                      <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3 }}>{labels}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#4b5563' }}>Select a 7-note scale to see harmonization.</div>
      )}
    </div>
  );
}

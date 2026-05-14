import { useState, useMemo } from 'react';
import {
  SCALE_FORMULAS, noteToSemitone, semitoneToNote, notePreferFlat, getScaleNotes,
} from '@shared/utils/musicTheory';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Only 7-note scales are harmonizable with stacked thirds
const HARMONIZABLE_SCALES = Object.entries(SCALE_FORMULAS)
  .filter(([, f]) => f.intervals.length === 7)
  .sort(([, a], [, b]) => a.name.localeCompare(b.name));

type ChordSize = 'triad' | '7th';

interface DiatonicChord {
  degreeNum: number;      // 1-7
  romanNumeral: string;
  root: string;
  quality: string;        // maj, m, dim, aug, maj7, m7, etc.
  symbol: string;
  notes: string[];
  intervals: number[];
  fn: 'Tonic' | 'Subdominant' | 'Dominant' | 'Color';
}

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

function detectTriadQuality(t3: number, t5: number): { quality: string; isMinor: boolean } {
  if (t3 === 4 && t5 === 7)  return { quality: 'maj', isMinor: false };
  if (t3 === 3 && t5 === 7)  return { quality: 'm', isMinor: true };
  if (t3 === 3 && t5 === 6)  return { quality: 'dim', isMinor: true };
  if (t3 === 4 && t5 === 8)  return { quality: 'aug', isMinor: false };
  if (t3 === 2 && t5 === 7)  return { quality: 'sus2', isMinor: false };
  if (t3 === 5 && t5 === 7)  return { quality: 'sus4', isMinor: false };
  return { quality: 'maj', isMinor: false };
}

function detect7thQuality(t3: number, t5: number, t7: number): { quality: string; isMinor: boolean } {
  if (t3 === 4 && t5 === 7 && t7 === 11) return { quality: 'maj7', isMinor: false };
  if (t3 === 4 && t5 === 7 && t7 === 10) return { quality: '7', isMinor: false };
  if (t3 === 3 && t5 === 7 && t7 === 10) return { quality: 'm7', isMinor: true };
  if (t3 === 3 && t5 === 7 && t7 === 11) return { quality: 'mMaj7', isMinor: true };
  if (t3 === 3 && t5 === 6 && t7 === 10) return { quality: 'm7b5', isMinor: true };
  if (t3 === 3 && t5 === 6 && t7 === 9)  return { quality: 'dim7', isMinor: true };
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

    // Build chord tones by stacking thirds from the scale
    const third = intervals[(di + 2) % n];
    const fifth = intervals[(di + 4) % n];
    const seventh = intervals[(di + 6) % n];

    const t3 = ((third - degInt) + 120) % 12;
    const t5 = ((fifth - degInt) + 120) % 12;
    const t7 = ((seventh - degInt) + 120) % 12;

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
    const romanNumeral = quality === 'dim' || quality === 'm7b5' || quality === 'dim7'
      ? `${roman}°` : quality === 'aug' || quality === 'augMaj7' ? `${roman}+` : roman;

    const noteIntervals = size === 'triad' ? [0, t3, t5] : [0, t3, t5, t7];
    const degRootSemitone = (rootSemitone + degInt) % 12;
    const notes = noteIntervals.map(i => semitoneToNote((degRootSemitone + i) % 12, preferFlat));

    // Harmonic function
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

  const chords = useMemo(
    () => harmonize(selectedKey, selectedScale, chordSize),
    [selectedKey, selectedScale, chordSize]
  );

  const scaleNotes = useMemo(() => getScaleNotes(selectedKey, selectedScale), [selectedKey, selectedScale]);
  const scaleName = SCALE_FORMULAS[selectedScale]?.name ?? selectedScale;
  const selectedChord = selectedDegree !== null ? chords[selectedDegree] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Scale Harmonization</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Generate diatonic chords from any scale. Stack thirds to see triads or seventh chords built on each degree.
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Key selector */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Key</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {KEYS.map(k => (
              <button key={k} onClick={() => setSelectedKey(k)} style={{
                padding: '5px 10px',
                background: selectedKey === k ? '#1d4ed820' : '#0d1117',
                border: `1px solid ${selectedKey === k ? '#3b82f6' : '#30363d'}`,
                borderRadius: 6, color: selectedKey === k ? '#93c5fd' : '#6b7280',
                fontSize: 12, cursor: 'pointer', fontWeight: selectedKey === k ? 700 : 400, fontFamily: 'monospace',
              }}>{k}</button>
            ))}
          </div>
        </div>

        {/* Scale selector */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Scale</label>
          <select
            value={selectedScale}
            onChange={e => { setSelectedScale(e.target.value); setSelectedDegree(null); }}
            style={{
              padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none', width: '100%', maxWidth: 400,
            }}
          >
            {HARMONIZABLE_SCALES.map(([key, f]) => (
              <option key={key} value={key}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Chord size */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['triad', '7th'] as ChordSize[]).map(sz => (
            <button key={sz} onClick={() => setChordSize(sz)} style={{
              padding: '6px 16px',
              background: chordSize === sz ? '#1d4ed820' : 'none',
              border: `1px solid ${chordSize === sz ? '#3b82f6' : '#30363d'}`,
              borderRadius: 6, color: chordSize === sz ? '#93c5fd' : '#6b7280',
              fontSize: 13, cursor: 'pointer', fontWeight: chordSize === sz ? 600 : 400,
            }}>
              {sz === 'triad' ? 'Triads' : '7th Chords'}
            </button>
          ))}
        </div>
      </div>

      {/* Scale notes */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
          {selectedKey} {scaleName} — scale notes:
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {scaleNotes.map((n, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 5,
              background: i === 0 ? '#f9731620' : '#1c2128',
              border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
              fontSize: 13, fontFamily: 'monospace',
              color: i === 0 ? '#fb923c' : '#e6edf3',
              fontWeight: i === 0 ? 700 : 400,
            }}>{i + 1}. {n}</span>
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
                    borderRadius: 10, padding: '12px 10px', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.1s',
                    boxShadow: isSelected ? `0 0 12px ${fnColor}30` : 'none',
                  }}
                >
                  <div style={{ fontSize: 11, color: fnColor, fontWeight: 600, marginBottom: 4 }}>
                    {chord.romanNumeral}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace', lineHeight: 1 }}>
                    {chord.symbol}
                  </div>
                  <div style={{
                    marginTop: 6, fontSize: 10, fontWeight: 600,
                    color: fnColor, padding: '1px 5px', background: `${fnColor}20`,
                    borderRadius: 3, display: 'inline-block',
                  }}>
                    {chord.fn}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {chord.notes.map((n, j) => (
                      <span key={j} style={{
                        fontSize: 10, fontFamily: 'monospace',
                        color: j === 0 ? '#fb923c' : '#6b7280',
                      }}>{n}</span>
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
            <div style={{ background: '#161b22', border: `1px solid ${FN_COLORS[selectedChord.fn]}40`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: FN_COLORS[selectedChord.fn], fontWeight: 600, marginBottom: 2 }}>
                    Degree {selectedChord.degreeNum} — {selectedChord.fn}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace' }}>
                    {selectedChord.romanNumeral}  {selectedChord.symbol}
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
                      <div style={{
                        padding: '6px 14px', borderRadius: 6, fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                        background: i === 0 ? '#f9731620' : '#1c2128',
                        border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
                        color: i === 0 ? '#fb923c' : '#e6edf3',
                      }}>
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
        <div style={{ textAlign: 'center', padding: 40, color: '#4b5563' }}>
          Select a 7-note scale to see harmonization.
        </div>
      )}
    </div>
  );
}

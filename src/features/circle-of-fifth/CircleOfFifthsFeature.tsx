import { useState, useMemo } from 'react';
import {
  noteToSemitone, semitoneToNote, getScaleNotes,
  MAJOR_DIATONIC_QUALITY, DEGREE_SEMITONE,
} from '@shared/utils/musicTheory';

// Clock-wise from C (0 = top, going CW by 5ths)
const FIFTHS_ORDER = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const RELATIVE_MINORS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
const SHARPS_FLATS = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];

const KEY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const DIATONIC_DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
const DIATONIC_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

function getDiatonicChords(key: string) {
  const ks = noteToSemitone(key);
  return DIATONIC_DEGREES.map((deg, i) => {
    const rootSemitone = (ks + DIATONIC_SEMITONES[i]) % 12;
    const root = semitoneToNote(rootSemitone, ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(key));
    const quality = MAJOR_DIATONIC_QUALITY[deg] ?? 'maj';
    return { degree: deg, root, quality, symbol: `${root}${quality === 'maj' ? '' : quality}` };
  });
}

export default function CircleOfFifthsFeature() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [showMinors, setShowMinors] = useState(true);
  const [highlightRelated, setHighlightRelated] = useState(true);

  const selectedKey = selectedIdx !== null ? FIFTHS_ORDER[selectedIdx] : null;

  // Keys related to selected: I(self), IV(-1 step), V(+1 step)
  const relatedIndices = useMemo(() => {
    if (selectedIdx === null) return new Set<number>();
    const iv = (selectedIdx - 1 + 12) % 12;
    const v = (selectedIdx + 1) % 12;
    return new Set([selectedIdx, iv, v]);
  }, [selectedIdx]);

  const diatonicChords = useMemo(() => {
    if (!selectedKey) return [];
    return getDiatonicChords(selectedKey);
  }, [selectedKey]);

  const SIZE = 320;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const OUTER_R = 128;
  const INNER_R = 80;
  const CENTER_R = 40;
  const SLICE_ANGLE = (2 * Math.PI) / 12;

  function sectorPath(r1: number, r2: number, idx: number, gap = 0.04) {
    const start = idx * SLICE_ANGLE - Math.PI / 2 - SLICE_ANGLE / 2 + gap;
    const end = start + SLICE_ANGLE - gap * 2;
    const x1 = cx + r1 * Math.cos(start);
    const y1 = cy + r1 * Math.sin(start);
    const x2 = cx + r2 * Math.cos(start);
    const y2 = cy + r2 * Math.sin(start);
    const x3 = cx + r2 * Math.cos(end);
    const y3 = cy + r2 * Math.sin(end);
    const x4 = cx + r1 * Math.cos(end);
    const y4 = cy + r1 * Math.sin(end);
    return `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
  }

  function textPos(r: number, idx: number) {
    const angle = idx * SLICE_ANGLE - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Circle of Fifths</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Interactive circle of fifths. Click any key to see its diatonic chords, relative minor, and key signature. Adjacent keys share 6 common notes.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Circle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowMinors(!showMinors)}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: showMinors ? '#1c2128' : 'none',
                border: `1px solid ${showMinors ? '#58a6ff' : '#30363d'}`,
                color: showMinors ? '#58a6ff' : '#6b7280', fontSize: 12, cursor: 'pointer',
              }}
            >
              {showMinors ? '✓' : ''} Relative minors
            </button>
            <button
              onClick={() => setHighlightRelated(!highlightRelated)}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: highlightRelated ? '#1c2128' : 'none',
                border: `1px solid ${highlightRelated ? '#f59e0b' : '#30363d'}`,
                color: highlightRelated ? '#f59e0b' : '#6b7280', fontSize: 12, cursor: 'pointer',
              }}
            >
              {highlightRelated ? '✓' : ''} Highlight I/IV/V
            </button>
          </div>

          <svg width={SIZE} height={SIZE} style={{ cursor: 'pointer' }}>
            {/* Outer ring (major keys) */}
            {FIFTHS_ORDER.map((key, i) => {
              const color = KEY_COLORS[i];
              const isSelected = i === selectedIdx;
              const isRelated = highlightRelated && relatedIndices.has(i) && selectedIdx !== null;
              const opacity = selectedIdx === null ? 1 : isRelated ? 1 : 0.3;
              return (
                <g key={key} onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}>
                  <path
                    d={sectorPath(INNER_R + 4, OUTER_R, i)}
                    fill={isSelected ? color : `${color}60`}
                    stroke={isSelected ? '#fff' : color}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={opacity}
                  />
                  <text
                    {...textPos((INNER_R + OUTER_R) / 2 + 2, i)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={isSelected ? 15 : 13}
                    fontWeight={isSelected ? 800 : 600}
                    fill={isSelected ? '#fff' : '#e6edf3'}
                    opacity={opacity}
                    style={{ userSelect: 'none' }}
                  >
                    {key}
                  </text>
                </g>
              );
            })}

            {/* Inner ring (relative minors) */}
            {showMinors && RELATIVE_MINORS.map((rmin, i) => {
              const color = KEY_COLORS[i];
              const isRelated = highlightRelated && relatedIndices.has(i) && selectedIdx !== null;
              const isSelected = i === selectedIdx;
              const opacity = selectedIdx === null ? 1 : isRelated ? 1 : 0.25;
              return (
                <g key={rmin} onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}>
                  <path
                    d={sectorPath(CENTER_R + 2, INNER_R, i, 0.05)}
                    fill={`${color}30`}
                    stroke={`${color}80`}
                    strokeWidth={1}
                    opacity={opacity}
                  />
                  <text
                    {...textPos((CENTER_R + INNER_R) / 2 + 1, i)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill="#8b949e" opacity={opacity}
                    style={{ userSelect: 'none' }}
                  >
                    {rmin}
                  </text>
                </g>
              );
            })}

            {/* Center */}
            <circle cx={cx} cy={cy} r={CENTER_R - 1} fill="#161b22" stroke="#30363d" strokeWidth={1} />
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#8b949e">
              {selectedKey ?? 'Click'}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="#4b5563">
              {selectedIdx !== null ? SHARPS_FLATS[selectedIdx] : 'a key'}
            </text>
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b7280' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: '#f97316' }} />
              Major key (outer)
            </div>
            {showMinors && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#f9731630', border: '1px solid #f97316' }} />
                Relative minor
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedKey ? (
            <>
              {/* Key info */}
              <div style={{ background: '#161b22', border: `1px solid ${KEY_COLORS[selectedIdx!]}40`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: KEY_COLORS[selectedIdx!], opacity: 0.8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: '#fff',
                  }}>
                    {selectedKey[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>{selectedKey} Major</div>
                    <div style={{ fontSize: 13, color: '#8b949e' }}>
                      Relative minor: <span style={{ color: '#a78bfa' }}>{RELATIVE_MINORS[selectedIdx!]}</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Key signature</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{SHARPS_FLATS[selectedIdx!]}</div>
                  </div>
                </div>

                {/* Scale notes */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Scale notes</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {getScaleNotes(selectedKey, 'major').map((n, i) => (
                      <span key={i} style={{
                        padding: '3px 9px', borderRadius: 5,
                        background: i === 0 ? '#f9731620' : '#1c2128',
                        border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
                        fontSize: 13, fontFamily: 'monospace',
                        color: i === 0 ? '#fb923c' : '#e6edf3',
                        fontWeight: i === 0 ? 700 : 400,
                      }}>
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Related keys */}
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Closely related keys</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'IV (subdominant)', key: FIFTHS_ORDER[(selectedIdx! - 1 + 12) % 12] },
                    { label: 'V (dominant)', key: FIFTHS_ORDER[(selectedIdx! + 1) % 12] },
                    { label: 'Relative minor', key: RELATIVE_MINORS[selectedIdx!] },
                  ].map(({ label, key }) => (
                    <div key={key} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px' }}>
                      <div style={{ fontSize: 10, color: '#4b5563' }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace' }}>{key}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diatonic chords */}
              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
                  Diatonic Chords in {selectedKey} Major
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {diatonicChords.map(({ degree, symbol, quality }) => {
                    const fnColor = ({ I: '#10b981', IV: '#3b82f6', V: '#ef4444' } as Record<string, string>)[degree] ?? '#6b7280';
                    return (
                      <div key={degree} style={{
                        background: '#0d1117', border: `1px solid ${fnColor}30`,
                        borderRadius: 8, padding: '8px 10px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 11, color: fnColor, fontWeight: 600 }}>{degree}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace', margin: '2px 0' }}>
                          {symbol}
                        </div>
                        <div style={{ fontSize: 10, color: '#4b5563' }}>{quality}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
              padding: 40, textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔵</div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>
                Click any key on the circle to see its details, diatonic chords, and related keys.
              </div>
            </div>
          )}

          {/* Theory tip */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>💡 Circle of Fifths Theory</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              Moving clockwise adds 1 sharp (or removes 1 flat). Adjacent keys differ by only one note — making modulation smooth.
              The IV (left) and V (right) of any key are its closest harmonic neighbors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useRef } from 'react';
import type { GeneratedProgression, ResolvedChord, Technique } from '../types/progression.types';
import { audioPlayer } from '../../ear-training/utils/audio-player';

// ─── iReal Pro export ─────────────────────────────────────────────────────────

function toIRealChord(sym: string): string {
  if (!sym.trim()) return 'n';
  const m = sym.trim().match(/^([A-G][b#]?)(.*)/);
  if (!m) return sym;
  const root = m[1];
  let q = m[2] ?? '';
  q = q.replace(/m7b5|min7b5|-7b5|ø7?/g, 'h7');
  q = q.replace(/maj7|Maj7|M7/g, '^7');
  q = q.replace(/maj9|Maj9/g, '^9');
  q = q.replace(/maj|Maj/g, '^');
  q = q.replace(/min7|m7/g, '-7');
  q = q.replace(/min9|m9/g, '-9');
  q = q.replace(/minor|min/g, '-');
  if (q === 'm') q = '-';
  q = q.replace(/dim7|°7/g, 'o7');
  q = q.replace(/dim|°/g, 'o');
  q = q.replace(/aug/g, '+');
  q = q.replace(/sus4/g, 'sus');
  q = q.replace(/sus2/g, '2');
  q = q.replace(/alt/g, 'alt');
  return root + q;
}

function buildProgressionIRealURL(prog: GeneratedProgression): string {
  const style = prog.template.style === 'classic' ? 'Jazz Swing' : 'Pop';
  const title = encodeURIComponent(prog.template.name);
  const composer = encodeURIComponent('Tonic');
  // One chord per bar; all chords in a single *A section
  const bars = prog.chords.map((c, i) =>
    i === prog.chords.length - 1
      ? toIRealChord(c.symbol) + ' Z'
      : toIRealChord(c.symbol) + ' |'
  ).join('');
  const chart = `[*AT44${bars}]`;
  return `irealbook://${title}=${composer}=${style}=${prog.key}=n=${chart}`;
}

// ─── Scale recommendations ────────────────────────────────────────────────────

interface ScaleSuggestion {
  name: string;
  isPrimary: boolean;
}

/**
 * Maps chord quality → ordered list of applicable scales.
 * Based on jazz chord-scale theory (Berklee / George Russell Lydian Chromatic Concept)
 * enriched with modern jazz / fusion practice.
 *
 * Order: primary (most idiomatic) first, then alternatives from inside-out.
 */
const QUALITY_SCALES: Record<string, ScaleSuggestion[]> = {
  // ── Major family ──────────────────────────────────────────────────────────
  'maj':     [
    { name: 'Lydian',             isPrimary: true  },
    { name: 'Ionian (Major)',     isPrimary: false },
    { name: 'Lydian Augmented',  isPrimary: false },
  ],
  'maj7':    [
    { name: 'Lydian',             isPrimary: true  },
    { name: 'Ionian (Major)',     isPrimary: false },
    { name: 'Lydian Augmented',  isPrimary: false },
  ],
  'maj9':    [
    { name: 'Lydian',             isPrimary: true  },
    { name: 'Ionian (Major)',     isPrimary: false },
    { name: 'Lydian Augmented',  isPrimary: false },
  ],
  'maj7#11': [
    { name: 'Lydian',             isPrimary: true  },
    { name: 'Lydian Augmented',  isPrimary: false },
  ],

  // ── Minor family ──────────────────────────────────────────────────────────
  'm7':  [
    { name: 'Dorian',        isPrimary: true  },
    { name: 'Aeolian',       isPrimary: false },
    { name: 'Dorian ♭2',    isPrimary: false },
    { name: 'Phrygian',      isPrimary: false },
  ],
  'm9':  [
    { name: 'Dorian',        isPrimary: true  },
    { name: 'Dorian ♭2',    isPrimary: false },
    { name: 'Aeolian',       isPrimary: false },
  ],
  'm11': [
    { name: 'Dorian',        isPrimary: true  },
    { name: 'Dorian ♭2',    isPrimary: false },
    { name: 'Aeolian',       isPrimary: false },
  ],

  // ── Dominant family ───────────────────────────────────────────────────────
  '7':  [
    { name: 'Lydian Dominant',    isPrimary: true  },
    { name: 'Mixolydian',         isPrimary: false },
    { name: 'Mixolydian ♭6',     isPrimary: false },
    { name: 'Phryg. Dominant',   isPrimary: false },
  ],
  '9':  [
    { name: 'Mixolydian',         isPrimary: true  },
    { name: 'Lydian Dominant',    isPrimary: false },
    { name: 'Mixolydian ♭6',     isPrimary: false },
  ],
  '13': [
    { name: 'Mixolydian',         isPrimary: true  },
    { name: 'Lydian Dominant',    isPrimary: false },
    { name: 'Mixolydian ♭6',     isPrimary: false },
  ],

  // ── Altered dominant ──────────────────────────────────────────────────────
  '7alt': [
    { name: 'Altered',          isPrimary: true  },
    { name: 'HW Diminished',    isPrimary: false },
    { name: 'Whole Tone',       isPrimary: false },
  ],
  '7b9': [
    { name: 'HW Diminished',    isPrimary: true  },
    { name: 'Phryg. Dominant',  isPrimary: false },
    { name: 'Altered',          isPrimary: false },
  ],

  // ── Suspended ────────────────────────────────────────────────────────────
  '7sus4': [
    { name: 'Mixolydian',     isPrimary: true  },
    { name: 'Dorian',         isPrimary: false },
    { name: 'Aeolian',        isPrimary: false },
  ],
  'sus2': [
    { name: 'Mixolydian',     isPrimary: true  },
    { name: 'Lydian',         isPrimary: false },
    { name: 'Ionian (Major)', isPrimary: false },
  ],

  // ── Diminished & Half-dim ─────────────────────────────────────────────────
  'dim7': [
    { name: 'HW Diminished',    isPrimary: true  },
    { name: 'WH Diminished',    isPrimary: false },
  ],
  'm7b5': [
    { name: 'Locrian ♯2',      isPrimary: true  },
    { name: 'Locrian',          isPrimary: false },
    { name: 'HW Diminished',    isPrimary: false },
  ],

  // ── Quartal & other colours ───────────────────────────────────────────────
  'quartal': [
    { name: 'Dorian',        isPrimary: true  },
    { name: 'Mixolydian',    isPrimary: false },
    { name: 'Phrygian',      isPrimary: false },
  ],
};

function getScalesForQuality(quality: string): ScaleSuggestion[] {
  return QUALITY_SCALES[quality] ?? [{ name: 'Dorian / Mixolydian', isPrimary: true }];
}

// ─── Colour maps ─────────────────────────────────────────────────────────────

const TECHNIQUE_COLORS: Record<Technique, string> = {
  diatonic: '#3b82f6',
  modal_interchange: '#8b5cf6',
  secondary_dominant: '#f59e0b',
  tritone_sub: '#ef4444',
  backdoor: '#f97316',
  chromatic: '#ec4899',
  quartal: '#06b6d4',
  sus: '#10b981',
  modulation: '#6366f1',
  altered_dominant: '#dc2626',
  dim_pedal: '#7c3aed',
};

const FUNCTION_COLORS: Record<string, string> = {
  Tonic: '#10b981',
  Subdominant: '#3b82f6',
  Dominant: '#ef4444',
  Color: '#8b5cf6',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProgressionDisplayProps {
  results: GeneratedProgression[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressionDisplay({ results, selectedId, onSelect }: ProgressionDisplayProps) {
  if (results.length === 0) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#4b5563' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🎵</div>
      No progressions match the current filters. Try different length or techniques.
    </div>
  );

  const selected = results.find(r => r.id === selectedId) ?? results[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selected progression — detail view */}
      {selected && <ProgressionDetail progression={selected} />}

      {/* List of all results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
          All matching progressions — click to select:
        </div>
        {results.map(r => {
          const isActive = r.id === (selectedId ?? results[0]?.id);
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', textAlign: 'left',
                background: isActive ? '#1c2128' : '#0d1117',
                border: `1px solid ${isActive ? '#7c3aed' : '#30363d'}`,
                borderRadius: 8, cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {r.chords.map((c, i) => (
                  <span key={i} style={{
                    fontFamily: 'monospace', fontSize: 14,
                    color: isActive ? '#e6edf3' : '#8b949e', fontWeight: isActive ? 600 : 400,
                  }}>
                    {c.symbol}
                    {i < r.chords.length - 1 && (
                      <span style={{ color: '#30363d', margin: '0 4px' }}>→</span>
                    )}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span style={{
                  fontSize: 10, padding: '1px 6px',
                  background: r.template.style === 'classic' ? '#1d4ed820' : '#7c3aed20',
                  border: `1px solid ${r.template.style === 'classic' ? '#3b82f6' : '#7c3aed'}`,
                  borderRadius: 3, color: r.template.style === 'classic' ? '#93c5fd' : '#c4b5fd',
                }}>
                  {r.template.style}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#4b5563', flexShrink: 0, maxWidth: 180, textAlign: 'right' }}>
                {r.template.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ProgressionDetail({ progression }: { progression: GeneratedProgression }) {
  const { template, chords, key } = progression;
  const [copied, setCopied] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const stopRef = useRef(false);

  const uniqueTechniques = Array.from(new Set(
    chords.flatMap(c => c.techniqueLabel ? [c.techniqueLabel] : [])
  ));

  function handleIRealExport() {
    const url = buildProgressionIRealURL(progression);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      window.open(url, '_blank');
    });
  }

  const playProgression = useCallback(async () => {
    if (playingIdx !== null) { stopRef.current = true; return; }
    stopRef.current = false;
    await audioPlayer.preloadAllNotes();
    for (let i = 0; i < chords.length; i++) {
      if (stopRef.current) break;
      setPlayingIdx(i);
      const notes = chords[i].notes.map(n => `${n}3`);
      await audioPlayer.playChord(notes);
      await audioPlayer.delay(1200);
    }
    setPlayingIdx(null);
  }, [chords, playingIdx]);

  return (
    <div style={{
      background: '#161b22', border: '1px solid #7c3aed40',
      borderRadius: 12, padding: '20px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Key of {key} · {template.lengths[0]} chords · {template.style}</div>
          <h3 style={{ margin: 0, fontSize: 20, color: '#e6edf3' }}>{template.name}</h3>
          <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>{template.description}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Inspired by</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {template.artists.slice(0, 4).map(a => (
                <span key={a} style={{
                  padding: '1px 7px', background: '#1c2128', border: '1px solid #30363d',
                  borderRadius: 12, fontSize: 11, color: '#8b949e',
                }}>{a}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Play progression */}
            <button
              onClick={playProgression}
              title={playingIdx !== null ? 'Stop playback' : 'Play progression (one chord per bar)'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px',
                background: playingIdx !== null ? '#1a2e1a' : '#0d1117',
                border: `1px solid ${playingIdx !== null ? '#22c55e60' : '#30363d'}`,
                borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                color: playingIdx !== null ? '#86efac' : '#8b949e',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {playingIdx !== null ? '⏹' : '▶'} {playingIdx !== null ? `${playingIdx + 1}/${chords.length}` : 'Play'}
            </button>

            {/* iReal Pro export */}
            <button
              onClick={handleIRealExport}
              title="Copy iReal Pro URL — paste in iReal Pro via File > Open URL"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: copied ? '#166534' : '#0d1117',
                border: `1px solid ${copied ? '#22c55e' : '#30363d'}`,
                borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                color: copied ? '#86efac' : '#8b949e',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {copied ? '✓ Copied!' : '⎘ iReal Pro'}
            </button>
          </div>
        </div>
      </div>

      {/* Feel tag */}
      <div style={{ marginBottom: 16 }}>
        <span style={{
          padding: '3px 10px', background: '#7c3aed20', border: '1px solid #7c3aed',
          borderRadius: 6, fontSize: 12, color: '#c4b5fd', fontStyle: 'italic',
        }}>
          🎭 {template.feel}
        </span>
      </div>

      {/* Chord blocks */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {chords.map((chord, i) => (
          <ChordBlock key={i} chord={chord} index={i + 1} total={chords.length} isPlaying={playingIdx === i} />
        ))}
      </div>

      {/* Techniques used */}
      {uniqueTechniques.length > 0 && (
        <div style={{ borderTop: '1px solid #30363d', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Techniques used in this progression:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {uniqueTechniques.map(t => (
              <span key={t} style={{
                padding: '3px 10px', background: '#1c2128', border: '1px solid #30363d',
                borderRadius: 5, fontSize: 12, color: '#8b949e',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Scale suggestions ──────────────────────────────────────────────── */}
      <ScaleMap chords={chords} />

      {/* Chord tones */}
      <div style={{ borderTop: '1px solid #30363d', paddingTop: 12, marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Chord tones:</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {chords.map((chord, i) => (
            <div key={i} style={{ minWidth: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', fontFamily: 'monospace', marginBottom: 4 }}>
                {chord.symbol}
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {chord.notes.slice(0, 6).map((n, j) => (
                  <span key={j} style={{
                    padding: '1px 5px', background: '#1c2128', borderRadius: 3,
                    fontSize: 10, color: '#8b949e', fontFamily: 'monospace',
                  }}>{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scale map ────────────────────────────────────────────────────────────────

function ScaleMap({ chords }: { chords: ResolvedChord[] }) {
  return (
    <div style={{ borderTop: '1px solid #30363d', paddingTop: 14, marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8b949e' }}>🎹 Scale suggestions</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: '#c4b5fd',
          }}>
            <span style={{ fontSize: 10 }}>★</span> primary
          </span>
          <span style={{ fontSize: 10, color: '#6b7280' }}>· alternatives</span>
        </div>
      </div>

      {/* Per-chord columns */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {chords.map((chord, i) => {
          const scales = getScalesForQuality(chord.quality);
          const primary = scales.find(s => s.isPrimary);
          const alts = scales.filter(s => !s.isPrimary);

          return (
            <div key={i} style={{
              flex: '1 1 110px', minWidth: 100, maxWidth: 180,
              background: '#0d1117', border: '1px solid #21262d',
              borderRadius: 8, padding: '10px 10px 8px',
            }}>
              {/* Chord symbol */}
              <div style={{
                fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                color: '#e6edf3', marginBottom: 8,
                paddingBottom: 6, borderBottom: '1px solid #21262d',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{chord.symbol}</span>
                <span style={{
                  fontSize: 9, fontFamily: 'sans-serif', fontWeight: 600,
                  color: '#4b5563', background: '#1c2128',
                  border: '1px solid #30363d', borderRadius: 10,
                  padding: '1px 5px',
                }}>
                  {scales.length} scale{scales.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Primary scale */}
              {primary && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 7px', borderRadius: 5, marginBottom: 4,
                  background: '#7c3aed18', border: '1px solid #7c3aed33',
                }}>
                  <span style={{ fontSize: 9, color: '#a78bfa' }}>★</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#c4b5fd', lineHeight: 1.3 }}>
                    {primary.name}
                  </span>
                </div>
              )}

              {/* Alternatives */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {alts.map((scale, j) => (
                  <div key={j} style={{
                    padding: '3px 7px', borderRadius: 5,
                    background: '#1c2128', border: '1px solid #30363d',
                  }}>
                    <span style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.3 }}>
                      {scale.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chord block ──────────────────────────────────────────────────────────────

function ChordBlock({ chord, index, total, isPlaying }: {
  chord: ResolvedChord; index: number; total: number; isPlaying?: boolean;
}) {
  const techniqueColor = chord.technique ? TECHNIQUE_COLORS[chord.technique] : undefined;
  const functionColor = FUNCTION_COLORS[chord.function] ?? '#6b7280';
  const scales = getScalesForQuality(chord.quality);
  const primaryScale = scales.find(s => s.isPrimary);

  async function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    await audioPlayer.preloadAllNotes();
    await audioPlayer.playChord(chord.notes.map(n => `${n}3`));
  }

  return (
    <div style={{
      flex: '1 1 100px', minWidth: 90, maxWidth: 160,
      background: isPlaying ? '#1a1040' : '#0d1117',
      border: `1px solid ${isPlaying ? '#7c3aed' : (techniqueColor ?? '#30363d')}`,
      borderRadius: 10, padding: '12px 12px 10px',
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: isPlaying ? '0 0 16px #7c3aed40' : 'none',
      transition: 'all 0.15s',
    }}>
      {/* Index */}
      <div style={{ position: 'absolute', top: 6, left: 9, fontSize: 10, color: '#4b5563' }}>
        {index}/{total}
      </div>

      {/* Degree */}
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>{chord.degree}</div>

      {/* Chord symbol + play button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace', lineHeight: 1 }}>
          {chord.symbol}
        </div>
        <button
          onClick={handlePlay}
          title={`Play ${chord.symbol}`}
          style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#1c2128', border: '1px solid #30363d',
            cursor: 'pointer', fontSize: 10, color: '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
            transition: 'all 0.12s',
          }}
        >
          ▶
        </button>
      </div>

      {/* Harmonic function badge */}
      <div style={{
        fontSize: 10, fontWeight: 600, color: functionColor,
        padding: '1px 5px', background: `${functionColor}20`, borderRadius: 3,
        display: 'inline-block', width: 'fit-content',
      }}>
        {chord.function}
      </div>

      {/* Technique annotation */}
      {chord.annotation && (
        <div style={{ fontSize: 10, color: techniqueColor ?? '#6b7280', lineHeight: 1.4, marginTop: 2 }}>
          {chord.annotation}
        </div>
      )}

      {/* ── Scale hint ── */}
      <div style={{
        marginTop: 4, paddingTop: 6, borderTop: '1px solid #21262d',
      }}>
        <div style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.06em', marginBottom: 2, textTransform: 'uppercase' }}>
          Scale
        </div>
        {primaryScale && (
          <div style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', lineHeight: 1.3, marginBottom: 2 }}>
            ★ {primaryScale.name}
          </div>
        )}
        {scales.length > 1 && (
          <div style={{
            display: 'inline-block', fontSize: 9, color: '#4b5563',
            background: '#1c2128', border: '1px solid #30363d',
            borderRadius: 8, padding: '1px 5px',
          }}>
            +{scales.length - 1} more
          </div>
        )}
      </div>

      {/* Arrow to next */}
      {index < total && (
        <div style={{
          position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: '#30363d', zIndex: 2,
        }}>→</div>
      )}
    </div>
  );
}

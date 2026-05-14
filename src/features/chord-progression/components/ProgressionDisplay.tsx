import type { GeneratedProgression, ResolvedChord, Technique } from '../types/progression.types';

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
};

const FUNCTION_COLORS: Record<string, string> = {
  Tonic: '#10b981',
  Subdominant: '#3b82f6',
  Dominant: '#ef4444',
  Color: '#8b5cf6',
};

interface ProgressionDisplayProps {
  results: GeneratedProgression[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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
              {/* Chord symbols */}
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
              {/* Tags */}
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
              {/* Name */}
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

function ProgressionDetail({ progression }: { progression: GeneratedProgression }) {
  const { template, chords, key } = progression;

  const uniqueTechniques = Array.from(new Set(
    chords.flatMap(c => c.techniqueLabel ? [c.techniqueLabel] : [])
  ));

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
        <div style={{ textAlign: 'right' }}>
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
          <ChordBlock key={i} chord={chord} index={i + 1} total={chords.length} />
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

      {/* Notes (per chord) */}
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

function ChordBlock({ chord, index, total }: { chord: ResolvedChord; index: number; total: number }) {
  const techniqueColor = chord.technique ? TECHNIQUE_COLORS[chord.technique] : undefined;
  const functionColor = FUNCTION_COLORS[chord.function] ?? '#6b7280';

  return (
    <div style={{
      flex: '1 1 100px', minWidth: 90, maxWidth: 160,
      background: '#0d1117', border: `1px solid ${techniqueColor ?? '#30363d'}`,
      borderRadius: 10, padding: '12px 12px 10px',
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Index */}
      <div style={{ position: 'absolute', top: 6, left: 9, fontSize: 10, color: '#4b5563' }}>
        {index}/{total}
      </div>

      {/* Degree */}
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>{chord.degree}</div>

      {/* Chord symbol */}
      <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace', lineHeight: 1 }}>
        {chord.symbol}
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

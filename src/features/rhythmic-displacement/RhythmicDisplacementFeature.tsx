import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PolyMode = '3:2' | '4:3' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displacePattern(original: boolean[], offset: number): boolean[] {
  const len = original.length;
  return original.map((_, i) => original[((i - offset) % len + len) % len]);
}

function patternToString(pattern: boolean[]): string {
  return pattern.map(b => b ? '●' : '·').join(' ');
}

// ─── Polyrhythm patterns ─────────────────────────────────────────────────────

function buildPolyRows(mode: PolyMode): { label: string; cells: { active: boolean; accent?: boolean }[] }[] {
  if (mode === '3:2') {
    return [
      {
        label: '2 (duplets)',
        cells: [0, 1, 2, 3, 4, 5].map(i => ({ active: i % 2 === 0, accent: i % 2 === 0 })),
      },
      {
        label: '3 (triplets)',
        cells: [0, 1, 2, 3, 4, 5].map(i => ({ active: i % 3 === 0, accent: i % 3 === 0 })),
      },
    ];
  }
  if (mode === '4:3') {
    return [
      {
        label: '4 (quadruplets)',
        cells: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => ({ active: i % 3 === 0, accent: i % 3 === 0 })),
      },
      {
        label: '3 (triplets)',
        cells: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => ({ active: i % 4 === 0, accent: i % 4 === 0 })),
      },
    ];
  }
  return [];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PatternGrid({
  cells,
  onClick,
  accent,
  color = '#7c3aed',
}: {
  cells: boolean[];
  onClick?: (i: number) => void;
  accent?: boolean[];
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {cells.map((active, i) => (
        <div
          key={i}
          onClick={() => onClick?.(i)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: active ? color : '#0d1117',
            border: `1px solid ${active ? color : '#30363d'}`,
            cursor: onClick ? 'pointer' : 'default',
            opacity: accent && !accent[i] ? 0.4 : 1,
            transition: 'background 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: active ? '#fff' : '#6b7280',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

const DISPLACEMENT_OPTIONS = [
  { label: '+1/16', value: 1 },
  { label: '+1/8',  value: 2 },
  { label: '+3/16', value: 3 },
  { label: '+1/4',  value: 4 },
];

const POLY_TIPS: Record<string, string> = {
  '3:2': 'Yussef Dayes / Ghost Note: 3 contro 2 crea una tensione poliritmia fondamentale nel funk africano. Il punto di coincidenza (beat 1) è il centro gravitazionale.',
  '4:3': 'Snarky Puppy / Coltrane: 4 contro 3 genera 12 micro-posizioni. Usato nei cicli Giant Steps e nelle modulazioni metriche di "The Chicken" (Jaco Pastorius).',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function RhythmicDisplacementFeature() {
  const [pattern, setPattern] = useState<boolean[]>(Array(16).fill(false));
  const [activeDisplacements, setActiveDisplacements] = useState<Set<number>>(new Set());
  const [polyMode, setPolyMode] = useState<PolyMode>(null);

  function toggleCell(i: number) {
    setPattern(prev => { const next = [...prev]; next[i] = !next[i]; return next; });
  }

  function toggleDisplacement(value: number) {
    setActiveDisplacements(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function togglePoly(mode: '3:2' | '4:3') {
    setPolyMode(prev => prev === mode ? null : mode);
  }

  const polyRows = buildPolyRows(polyMode);
  const hasAnyHit = pattern.some(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Rhythmic Displacement</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Costruisci un pattern ritmico su 1 battuta (16 celle = 1/16 ciascuna), poi spostalo di varie suddivisioni
          per esplorare effetti di behind-the-beat e poliritmia.
        </p>
      </div>

      {/* Pattern builder */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 10 }}>
          Pattern (clicca per attivare/disattivare — 1 battuta in 4/4)
        </div>
        <PatternGrid cells={pattern} onClick={toggleCell} color="#7c3aed" />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setPattern(Array(16).fill(false))}
            style={{
              padding: '5px 14px', background: 'none', border: '1px solid #30363d',
              borderRadius: 8, cursor: 'pointer', color: '#6b7280', fontSize: 12,
            }}
          >Reset</button>
          {[
            { label: 'Son Clave', p: [true,false,false,true,false,false,true,false,false,false,true,false,false,true,false,false] },
            { label: 'Funk 16th', p: [true,false,false,false,true,false,true,false,false,true,false,false,true,false,false,false] },
            { label: 'Ghost Note', p: [true,true,false,true,false,false,true,false,true,true,false,false,false,true,false,false] },
          ].map(({ label, p }) => (
            <button key={label} onClick={() => setPattern(p)}
              style={{
                padding: '5px 14px', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, cursor: 'pointer', color: '#8b949e', fontSize: 12,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Displacement controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 10 }}>
          Displacement — attiva uno o più offset
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DISPLACEMENT_OPTIONS.map(({ label, value }) => {
            const active = activeDisplacements.has(value);
            return (
              <button key={value} onClick={() => toggleDisplacement(value)} style={{
                padding: '7px 18px',
                background: active ? '#7c3aed20' : '#0d1117',
                border: `1px solid ${active ? '#7c3aed' : '#30363d'}`,
                borderRadius: 8, cursor: 'pointer',
                color: active ? '#c4b5fd' : '#6b7280',
                fontSize: 13, fontWeight: active ? 700 : 400,
              }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* Displaced patterns display */}
      {(hasAnyHit || activeDisplacements.size > 0) && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
          <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 12 }}>
            Pattern e displacement
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Originale</div>
              <PatternGrid cells={pattern} color="#7c3aed" />
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontFamily: 'monospace', letterSpacing: 2 }}>
                {patternToString(pattern)}
              </div>
            </div>
            {[...activeDisplacements].sort((a, b) => a - b).map(offset => {
              const displaced = displacePattern(pattern, offset);
              const optLabel = DISPLACEMENT_OPTIONS.find(o => o.value === offset)?.label ?? `+${offset}`;
              return (
                <div key={offset}>
                  <div style={{ fontSize: 11, color: '#c4b5fd', marginBottom: 6, fontWeight: 600 }}>
                    {optLabel}
                  </div>
                  <PatternGrid cells={displaced} color="#06b6d4" />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontFamily: 'monospace', letterSpacing: 2 }}>
                    {patternToString(displaced)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Polyrhythm mode */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 10 }}>
          Polyrhythm visualizer
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['3:2', '4:3'] as const).map(mode => (
            <button key={mode} onClick={() => togglePoly(mode)} style={{
              padding: '7px 18px',
              background: polyMode === mode ? '#06b6d420' : '#0d1117',
              border: `1px solid ${polyMode === mode ? '#06b6d4' : '#30363d'}`,
              borderRadius: 8, cursor: 'pointer',
              color: polyMode === mode ? '#67e8f9' : '#6b7280',
              fontSize: 13, fontWeight: polyMode === mode ? 700 : 400,
            }}>{mode}</button>
          ))}
        </div>

        {polyMode && (
          <div>
            {polyRows.map((row, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#67e8f9', marginBottom: 6, fontWeight: 600 }}>
                  {row.label}
                </div>
                <PatternGrid
                  cells={row.cells.map(c => c.active)}
                  accent={row.cells.map(c => c.accent ?? c.active)}
                  color="#06b6d4"
                />
              </div>
            ))}
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              💡 {POLY_TIPS[polyMode]}
            </p>
          </div>
        )}

        {!polyMode && (
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            Seleziona 3:2 o 4:3 per visualizzare la griglia poliritmia.
          </p>
        )}
      </div>
    </div>
  );
}

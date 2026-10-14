// src/features/secondary-dominants/SecondaryDominantsFeature.tsx
import { useState } from 'react';
import { useGlobalKey, CHROMATIC_KEYS } from '@shared/context/GlobalKeyContext';
import { getSecondaryDominants } from './utils/secondaryDominants';
import { DegreeCard } from './components/DegreeCard';

export default function SecondaryDominantsFeature() {
  const { globalKey, setGlobalKey } = useGlobalKey();
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [keyOpen, setKeyOpen] = useState(false);

  const degrees = getSecondaryDominants(globalKey, mode);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        padding: '12px 16px',
        background: '#12122a',
        borderRadius: 10,
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#777', fontSize: 13 }}>Tonalità:</span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setKeyOpen(o => !o)}
            style={{
              background: '#7c6af7',
              color: 'white',
              padding: '4px 14px',
              borderRadius: 20,
              fontWeight: 'bold',
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {globalKey} ▾
          </button>
          {keyOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} onClick={() => setKeyOpen(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 301,
                background: '#1c2128', border: '1px solid #30363d', borderRadius: 12,
                padding: 10, minWidth: 180,
                boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                  {CHROMATIC_KEYS.map(k => (
                    <button
                      key={k}
                      onClick={() => { setGlobalKey(k); setKeyOpen(false); }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: 7,
                        border: `1px solid ${globalKey === k ? '#7c6af7' : '#30363d'}`,
                        background: globalKey === k ? '#7c6af722' : 'none',
                        color: globalKey === k ? '#c4b5fd' : '#e6edf3',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: globalKey === k ? 700 : 400,
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {(['major', 'minor'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 14px',
                borderRadius: 20,
                border: `1px solid ${mode === m ? '#7c6af7' : '#333'}`,
                background: mode === m ? '#2a2050' : 'transparent',
                color: mode === m ? '#c4b5fd' : '#666',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: mode === m ? 'bold' : 'normal',
              }}
            >
              {m === 'major' ? 'Maggiore' : 'Minore'}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', color: '#666', fontSize: 11 }}>
          {degrees.length} dominanti secondarie
        </span>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {degrees.map(d => (
          <DegreeCard key={d.degree} data={d} playingId={playingId} setPlayingId={setPlayingId} />
        ))}
      </div>

      {degrees.length === 0 && (
        <p style={{ color: '#555', textAlign: 'center', marginTop: 40 }}>
          Nessuna dominante secondaria per questa tonalità.
        </p>
      )}
    </div>
  );
}

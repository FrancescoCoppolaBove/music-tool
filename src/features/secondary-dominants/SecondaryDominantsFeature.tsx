// src/features/secondary-dominants/SecondaryDominantsFeature.tsx
import { useState } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { getSecondaryDominants } from './utils/secondaryDominants';
import { DegreeCard } from './components/DegreeCard';

export default function SecondaryDominantsFeature() {
  const { globalKey } = useGlobalKey();
  const [mode, setMode] = useState<'major' | 'minor'>('major');

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
        <span style={{
          background: '#7c6af7',
          color: 'white',
          padding: '4px 14px',
          borderRadius: 20,
          fontWeight: 'bold',
          fontSize: 15,
        }}>
          {globalKey}
        </span>

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
          <DegreeCard key={d.degree} data={d} />
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

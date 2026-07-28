import { useState, useMemo } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { parseDegrees, computeCushionVariants } from '../services/phrygianCushion';
import type { CushionChord } from '../services/phrygianCushion';

const PRESETS = ['I IV V I', 'II V I', 'I V VI IV', 'I VI IV V'];

export default function PhrygianCushionExplorer() {
  const { globalKey } = useGlobalKey();
  const [input, setInput] = useState('I IV V I');

  const degrees = useMemo(() => parseDegrees(input), [input]);

  const result = useMemo(
    () => (degrees.length > 0 ? computeCushionVariants(degrees, globalKey) : null),
    [degrees, globalKey]
  );

  const columns = result
    ? [
        { label: 'Originale', sublabel: `${globalKey} maggiore`, color: '#10b981', chords: result.original },
        ...result.variants.map(v => ({
          label: v.label.split(' ')[0],
          sublabel: v.label,
          color: v.color,
          chords: v.chords,
        })),
      ]
    : [];

  const showError = input.trim() !== '' && degrees.length === 0;

  return (
    <div style={{
      background: '#161b22', border: '1px solid #30363d',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header */}
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#e6edf3' }}>
          🎹 Phrygian Cushion Explorer
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          Digita una progressione in gradi romani e vedi le tre varianti cushion affiancate.
          Usa la chiave globale selezionata in cima.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setInput(p)}
            style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 5, cursor: 'pointer',
              background: input === p ? '#1d4ed820' : 'none',
              border: `1px solid ${input === p ? '#3b82f6' : '#30363d'}`,
              color: input === p ? '#93c5fd' : '#6b7280',
              fontFamily: 'monospace',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="es. I IV V I   oppure   II V I"
          style={{
            flex: 1, padding: '8px 12px', fontSize: 14, fontFamily: 'monospace',
            background: '#0d1117', border: `1px solid ${showError ? '#ef4444' : '#30363d'}`,
            borderRadius: 6, color: '#e6edf3', outline: 'none',
          }}
        />
        {showError && (
          <span style={{ fontSize: 12, color: '#ef4444', whiteSpace: 'nowrap' }}>
            Gradi non riconosciuti
          </span>
        )}
      </div>

      {/* Grid */}
      {result && columns.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns.length}, minmax(110px, 1fr))`,
            gap: 8,
            minWidth: 380,
          }}>
            {/* Header row */}
            {columns.map((col, ci) => (
              <div key={`h-${ci}`} style={{
                textAlign: 'center', padding: '6px 4px',
                borderBottom: `2px solid ${col.color}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: col.color }}>
                  {col.label}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {col.sublabel}
                </div>
              </div>
            ))}

            {/* Chord cells — flatMap gives row-major order that CSS grid fills left→right */}
            {degrees.flatMap((degree, rowIdx) =>
              columns.map((col, colIdx) => {
                const chord: CushionChord = col.chords[rowIdx];
                const isAnchor = degree === 'I';
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    style={{
                      padding: '8px 6px', borderRadius: 8, textAlign: 'center',
                      background: chord.isBorrowed ? `${col.color}12` : '#0d1117',
                      border: `1px solid ${isAnchor ? '#10b981' : chord.isBorrowed ? col.color : '#21262d'}`,
                      boxShadow: chord.isBorrowed ? `0 0 7px ${col.color}20` : 'none',
                    }}
                  >
                    <div style={{
                      fontSize: 10, marginBottom: 2,
                      color: isAnchor ? '#10b981' : chord.isBorrowed ? col.color : '#4b5563',
                    }}>
                      {degree}
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#e6edf3',
                    }}>
                      {chord.symbol}
                    </div>
                    {chord.isBorrowed && (
                      <div style={{ fontSize: 9, color: col.color, marginTop: 2 }}>
                        da {chord.sourceKey}
                      </div>
                    )}
                    {isAnchor && colIdx === 0 && (
                      <div style={{ fontSize: 9, color: '#10b981', marginTop: 2 }}>
                        ancora
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Theory note */}
      {result && (
        <div style={{
          fontSize: 12, color: '#6b7280', padding: '10px 12px',
          background: '#0d1117', borderRadius: 8, lineHeight: 1.6,
        }}>
          <strong style={{ color: '#8b949e' }}>Come funziona:</strong>{' '}
          Il grado <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>I</strong> resta
          ancorato a <strong style={{ color: '#10b981' }}>{globalKey} maggiore</strong>.
          Gli altri gradi vengono prelevati dalla stessa posizione diatonica nella chiave sorgente
          (Dorico −2 semitoni, Eolico −9 semitoni, Frigio −4 semitoni).
          Il colore scuro–chiaro nasce dall'abbassamento progressivo delle note rispetto alla tonalità di partenza.
        </div>
      )}
    </div>
  );
}

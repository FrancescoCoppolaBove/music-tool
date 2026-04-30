import { useState } from 'react';
import { COMMON_CHORDS } from '../services/chordParser';

interface ChordInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error?: string;
}

export default function ChordInput({ value, onChange, onSubmit, error }: ChordInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onSubmit();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="e.g. Cmaj7, Dm7b5, G7#9, Bb13..."
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#0d1117',
              border: `1px solid ${error ? '#ef4444' : '#30363d'}`,
              borderRadius: 8,
              color: '#e6edf3',
              fontSize: 16,
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ position: 'absolute', top: '100%', left: 0, color: '#ef4444', fontSize: 12, marginTop: 4 }}>
              {error}
            </div>
          )}
          {showSuggestions && value.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
              marginTop: 4, maxHeight: 200, overflowY: 'auto',
            }}>
              {COMMON_CHORDS.map(c => (
                <button key={c.symbol}
                  onMouseDown={() => { onChange(c.symbol); onSubmit(); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 14px', background: 'none', border: 'none',
                    color: '#e6edf3', cursor: 'pointer', fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onSubmit}
          style={{
            padding: '10px 20px', background: '#1d4ed8', border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Generate Voicings
        </button>
      </div>

      {/* Quick picks */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>Quick:</span>
        {COMMON_CHORDS.slice(0, 10).map(c => (
          <button
            key={c.symbol}
            onClick={() => { onChange(c.symbol); onSubmit(); }}
            style={{
              padding: '4px 10px', background: '#1c2128', border: '1px solid #30363d',
              borderRadius: 6, color: '#8b949e', fontSize: 12, cursor: 'pointer',
              fontFamily: 'monospace',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#58a6ff')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363d')}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

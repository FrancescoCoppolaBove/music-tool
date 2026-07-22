import { useState } from 'react';
import { Progression } from 'tonal';
import ProgressionSettings from './components/ProgressionSettings';
import ProgressionDisplay from './components/ProgressionDisplay';
import { useChordProgression } from './hooks/useChordProgression';

export default function ChordProgressionFeature() {
  const {
    key, setKey,
    mode, setMode,
    length, setLength,
    style, setStyle,
    techniques, toggleTechnique,
    results, selectedId, setSelectedId,
    generate,
    availableTechniques,
  } = useChordProgression();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Chord Progression Generator</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Build inspired harmonic sequences in any key. Choose a length, style, and advanced techniques
          inspired by Snarky Puppy, Radiohead, Jacob Collier, Yussef Dayes, Earth Wind &amp; Fire, Weather Report, and more.
        </p>
      </div>

      {/* Technique Legend */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
        padding: '14px 16px',
      }}>
        <ProgressionSettings
          keyNote={key}
          setKey={setKey}
          mode={mode}
          setMode={setMode}
          length={length}
          setLength={setLength}
          style={style}
          setStyle={setStyle}
          techniques={techniques}
          toggleTechnique={toggleTechnique}
          availableTechniques={availableTechniques}
          onGenerate={generate}
          resultCount={results.length}
        />
      </div>

      {/* Results */}
      <ProgressionDisplay
        results={results}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Custom Roman Numeral input */}
      <CustomRomanInput currentKey={key} />

      {/* Technique glossary */}
      <TechniqueGlossary techniques={availableTechniques} />
    </div>
  );
}

// ─── Custom Roman Numeral Resolver ───────────────────────────────────────────

function CustomRomanInput({ currentKey }: { currentKey: string }) {
  const [input, setInput] = useState('');
  const [resolved, setResolved] = useState<string[]>([]);
  const [degrees, setDegrees] = useState<string[]>([]);
  const [error, setError] = useState('');

  function resolve() {
    const tokens = input.trim().split(/[\s,]+/).filter(Boolean);
    if (tokens.length === 0) return;
    try {
      const chords = Progression.fromRomanNumerals(currentKey, tokens);
      setResolved(chords);
      setDegrees(tokens);
      setError('');
    } catch {
      setError('Numerali non riconosciuti. Usa formato: IIm7 V7 Imaj7 bVII7');
    }
  }

  return (
    <details style={{
      background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
      padding: '14px 16px',
    }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
        🎹 Risolvi Numerali Romani Personalizzati
      </summary>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
          Digita una progressione in numerali romani (es. <code style={{ color: '#c4b5fd' }}>IIm7 V7 Imaj7</code> oppure <code style={{ color: '#c4b5fd' }}>Im7 IVm7 bVII7 I7</code>). Verrà risolta nella tonalità selezionata sopra: <strong style={{ color: '#e6edf3' }}>{currentKey}</strong>.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && resolve()}
            placeholder="es. IIm7 V7 Imaj7 o Im7 IVm7 bVII7 I7"
            style={{
              flex: '1 1 260px', padding: '8px 12px',
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 6, color: '#e6edf3', fontSize: 14,
              fontFamily: 'monospace', outline: 'none',
            }}
          />
          <button
            onClick={resolve}
            style={{
              padding: '8px 18px',
              background: '#7c3aed', border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            → Risolvi
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{error}</div>
        )}

        {resolved.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Risolto in <strong style={{ color: '#e6edf3' }}>{currentKey}</strong>:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {resolved.map((chord, i) => (
                <div key={i} style={{
                  background: '#0d1117', border: '1px solid #7c3aed40',
                  borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 64,
                }}>
                  <div style={{ fontSize: 10, color: '#7c3aed', fontFamily: 'monospace', marginBottom: 4 }}>
                    {degrees[i]}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace' }}>
                    {chord || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function TechniqueGlossary(
  { techniques }: { techniques: Array<{ id: string; label: string; description: string }> }
) {
  return (
    <details style={{
      background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
      padding: '14px 16px',
    }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
        📖 Harmony Techniques Glossary
      </summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginTop: 14 }}>
        {techniques.map(t => (
          <div key={t.id} style={{
            background: '#0d1117', border: '1px solid #30363d', borderRadius: 8,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>{t.label}</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{t.description}</div>
          </div>
        ))}
        {/* Extra theory context */}
        <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>Diatonic Degrees (Major)</div>
          <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', lineHeight: 1.8 }}>
            I = Imaj7 · II = IIm7 · III = IIIm7<br />
            IV = IVmaj7 · V = V7 · VI = VIm7<br />
            VII = VIIm7♭5
          </div>
        </div>
        <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>Voice Leading Tip</div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            The 3rd and 7th of each chord are the "guide tones." Keep them close to the same notes in adjacent chords for smooth voice leading.
          </div>
        </div>
      </div>
    </details>
  );
}

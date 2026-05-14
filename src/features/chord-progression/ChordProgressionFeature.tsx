import ProgressionSettings from './components/ProgressionSettings';
import ProgressionDisplay from './components/ProgressionDisplay';
import { useChordProgression } from './hooks/useChordProgression';

export default function ChordProgressionFeature() {
  const {
    key, setKey,
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

      {/* Technique glossary */}
      <TechniqueGlossary techniques={availableTechniques} />
    </div>
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

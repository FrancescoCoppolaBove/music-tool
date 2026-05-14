import type { HarmonyStyle, Technique } from '../types/progression.types';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const LENGTHS = [2, 3, 4, 5, 6, 7, 8];

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

interface Props {
  keyNote: string;
  setKey: (k: string) => void;
  length: number;
  setLength: (l: number) => void;
  style: HarmonyStyle | 'both';
  setStyle: (s: HarmonyStyle | 'both') => void;
  techniques: Technique[];
  toggleTechnique: (t: Technique) => void;
  availableTechniques: Array<{ id: Technique; label: string; description: string }>;
  onGenerate: () => void;
  resultCount: number;
}

export default function ProgressionSettings({
  keyNote, setKey, length, setLength, style, setStyle,
  techniques, toggleTechnique, availableTechniques, onGenerate, resultCount,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Row 1: Key + Length + Style */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Key selector */}
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Key</label>
          <select
            value={keyNote}
            onChange={e => setKey(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 8, color: '#e6edf3', fontSize: 15, outline: 'none',
            }}
          >
            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Length selector */}
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
            Chords ({length})
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {LENGTHS.map(l => (
              <button
                key={l}
                onClick={() => setLength(l)}
                style={{
                  flex: 1, padding: '8px 0',
                  background: length === l ? '#1d4ed8' : '#0d1117',
                  border: `1px solid ${length === l ? '#3b82f6' : '#30363d'}`,
                  borderRadius: 6, color: length === l ? '#fff' : '#8b949e',
                  fontSize: 13, cursor: 'pointer', fontWeight: length === l ? 700 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Style selector */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Harmony Style</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['both', 'classic', 'modern'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                style={{
                  flex: 1, padding: '8px 0',
                  background: style === s ? '#1d4ed820' : '#0d1117',
                  border: `1px solid ${style === s ? '#3b82f6' : '#30363d'}`,
                  borderRadius: 6, color: style === s ? '#93c5fd' : '#6b7280',
                  fontSize: 12, cursor: 'pointer', fontWeight: style === s ? 600 : 400,
                }}
              >
                {s === 'both' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Technique filters */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#8b949e' }}>
            Harmony Techniques <span style={{ color: '#4b5563' }}>(select to filter; none = show all)</span>
          </label>
          {techniques.length > 0 && (
            <button
              onClick={() => techniques.forEach(t => toggleTechnique(t))}
              style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {availableTechniques.map(t => {
            const isOn = techniques.includes(t.id);
            const color = TECHNIQUE_COLORS[t.id];
            return (
              <button
                key={t.id}
                onClick={() => toggleTechnique(t.id)}
                title={t.description}
                style={{
                  padding: '5px 12px',
                  background: isOn ? `${color}20` : 'none',
                  border: `1px solid ${isOn ? color : '#30363d'}`,
                  borderRadius: 6,
                  color: isOn ? color : '#6b7280',
                  fontSize: 12, cursor: 'pointer',
                  fontWeight: isOn ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={onGenerate}
          style={{
            padding: '10px 28px', background: '#7c3aed', border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Generate Progressions
        </button>
        {resultCount > 0 && (
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {resultCount} progression{resultCount !== 1 ? 's' : ''} found
          </span>
        )}
      </div>
    </div>
  );
}

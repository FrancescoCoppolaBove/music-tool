import { useState, useMemo } from 'react';
import { SCALE_FORMULAS, getScaleNotes, noteToSemitone } from '@shared/utils/musicTheory';

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const CATEGORY_COLORS: Record<string, string> = {
  Diatonic: '#3b82f6',
  Modal: '#8b5cf6',
  Minor: '#06b6d4',
  Major: '#10b981',
  Jazz: '#f59e0b',
  Bebop: '#f97316',
  Symmetric: '#ec4899',
  Pentatonic: '#84cc16',
  Blues: '#6366f1',
  Exotic: '#ef4444',
};

function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? '#6b7280';
}

// Build interval name from semitone step
function intervalNames(intervals: number[]): string[] {
  const names: Record<number, string> = {
    0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4',
    6: '♯4/♭5', 7: '5', 8: '♯5/♭6', 9: '6', 10: '♭7', 11: '7',
  };
  return intervals.map(i => names[((i % 12) + 12) % 12] ?? String(i));
}

// Build step pattern (W = whole, H = half, A = augmented, etc.)
function stepPattern(intervals: number[]): string {
  const stepNames: Record<number, string> = {
    1: 'H', 2: 'W', 3: 'W+H', 4: '2W',
  };
  const steps: string[] = [];
  for (let i = 1; i <= intervals.length; i++) {
    const diff = (intervals[i % intervals.length] - intervals[i - 1] + 12) % 12;
    steps.push(stepNames[diff] ?? String(diff));
  }
  return steps.join(' – ');
}

interface ScaleEntry {
  key: string;
  name: string;
  category: string;
  intervals: number[];
  notes: string[];
  noteCount: number;
}

export default function ScaleDictionaryFeature() {
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showIntervals, setShowIntervals] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [selectedScale, setSelectedScale] = useState<ScaleEntry | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(Object.values(SCALE_FORMULAS).map(f => f.category));
    return ['all', ...Array.from(cats).sort()];
  }, []);

  const scales: ScaleEntry[] = useMemo(() => {
    return Object.entries(SCALE_FORMULAS)
      .filter(([, f]) => selectedCategory === 'all' || f.category === selectedCategory)
      .filter(([, f]) => f.name.toLowerCase().includes(search.toLowerCase()))
      .map(([key, formula]) => ({
        key,
        name: formula.name,
        category: formula.category,
        intervals: formula.intervals,
        notes: getScaleNotes(selectedKey, key),
        noteCount: formula.intervals.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedKey, selectedCategory, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Scale Dictionary</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Browse {Object.keys(SCALE_FORMULAS).length}+ scales in any key. Filter by category, search by name, and explore interval structures.
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Row 1: Key + Search */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Root Key</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => setSelectedKey(k)}
                  style={{
                    padding: '5px 10px',
                    background: selectedKey === k ? '#1d4ed820' : '#0d1117',
                    border: `1px solid ${selectedKey === k ? '#3b82f6' : '#30363d'}`,
                    borderRadius: 6, color: selectedKey === k ? '#93c5fd' : '#6b7280',
                    fontSize: 12, cursor: 'pointer', fontWeight: selectedKey === k ? 700 : 400,
                    fontFamily: 'monospace',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Search by name</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="e.g. dorian, bebop, pentatonic..."
              style={{
                width: '100%', padding: '8px 12px',
                background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Row 2: Category filter + display options */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Category</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {categories.map(cat => {
                const color = cat === 'all' ? '#6b7280' : catColor(cat);
                const isOn = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      background: isOn ? `${color}20` : 'none',
                      border: `1px solid ${isOn ? color : '#30363d'}`,
                      borderRadius: 5, color: isOn ? color : '#6b7280',
                      fontSize: 12, cursor: 'pointer', fontWeight: isOn ? 600 : 400,
                    }}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setShowIntervals(!showIntervals)}
              style={{
                padding: '6px 12px', background: showIntervals ? '#1d4ed820' : 'none',
                border: `1px solid ${showIntervals ? '#3b82f6' : '#30363d'}`,
                borderRadius: 6, color: showIntervals ? '#93c5fd' : '#6b7280',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              Show intervals
            </button>
            <button
              onClick={() => setShowSteps(!showSteps)}
              style={{
                padding: '6px 12px', background: showSteps ? '#1d4ed820' : 'none',
                border: `1px solid ${showSteps ? '#3b82f6' : '#30363d'}`,
                borderRadius: 6, color: showSteps ? '#93c5fd' : '#6b7280',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              Show steps
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#4b5563' }}>
          {scales.length} scale{scales.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Detail panel for selected scale */}
      {selectedScale && (
        <div style={{ background: '#161b22', border: `1px solid ${catColor(selectedScale.category)}40`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{
                  padding: '2px 8px', background: `${catColor(selectedScale.category)}20`,
                  border: `1px solid ${catColor(selectedScale.category)}`,
                  borderRadius: 4, fontSize: 11, color: catColor(selectedScale.category), fontWeight: 600,
                }}>{selectedScale.category}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{selectedScale.noteCount} notes</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 20, color: '#e6edf3' }}>
                {selectedKey} {selectedScale.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedScale(null)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, padding: 4 }}
            >
              ✕
            </button>
          </div>
          {/* Notes */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {selectedScale.notes.map((n, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  padding: '6px 12px', background: i === 0 ? '#f9731620' : '#1c2128',
                  border: `1px solid ${i === 0 ? '#f97316' : catColor(selectedScale.category)}40`,
                  borderRadius: 6, fontSize: 15, fontFamily: 'monospace', fontWeight: 600,
                  color: i === 0 ? '#fb923c' : '#e6edf3',
                }}>
                  {n}
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 3 }}>
                  {intervalNames(selectedScale.intervals)[i]}
                </div>
              </div>
            ))}
          </div>
          {/* Step pattern */}
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            <span style={{ color: '#8b949e', fontWeight: 600 }}>Step pattern: </span>
            <span style={{ fontFamily: 'monospace', color: '#8b949e' }}>{stepPattern(selectedScale.intervals)}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
            <span style={{ color: '#8b949e', fontWeight: 600 }}>Intervals: </span>
            <span style={{ fontFamily: 'monospace', color: '#8b949e' }}>{intervalNames(selectedScale.intervals).join(' – ')}</span>
          </div>
        </div>
      )}

      {/* Scale grid */}
      <div style={{ display: 'grid', gap: 6 }}>
        {scales.map(scale => {
          const color = catColor(scale.category);
          const isSelected = selectedScale?.key === scale.key;
          return (
            <button
              key={scale.key}
              onClick={() => setSelectedScale(isSelected ? null : scale)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', textAlign: 'left',
                background: isSelected ? '#161b22' : '#0d1117',
                border: `1px solid ${isSelected ? color : '#21262d'}`,
                borderRadius: 8, cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {/* Category badge */}
              <span style={{
                padding: '2px 7px', background: `${color}20`, border: `1px solid ${color}`,
                borderRadius: 4, fontSize: 10, color, fontWeight: 600,
                minWidth: 70, textAlign: 'center', flexShrink: 0,
              }}>
                {scale.category}
              </span>

              {/* Scale name */}
              <div style={{ width: 200, flexShrink: 0, textAlign: 'left' }}>
                <span style={{ fontSize: 13, color: '#e6edf3', fontWeight: 600 }}>
                  <span style={{ color: '#f97316' }}>{selectedKey}</span> {scale.name}
                </span>
                <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 8 }}>{scale.noteCount} notes</span>
              </div>

              {/* Notes */}
              <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {scale.notes.map((n, i) => (
                  <span key={i} style={{
                    fontFamily: 'monospace', fontSize: 12,
                    color: i === 0 ? '#fb923c' : '#8b949e',
                    fontWeight: i === 0 ? 700 : 400,
                  }}>
                    {n}
                    {showIntervals && (
                      <span style={{ fontSize: 9, color: color, marginLeft: 2 }}>
                        {intervalNames(scale.intervals)[i]}
                      </span>
                    )}
                    {i < scale.notes.length - 1 && <span style={{ color: '#30363d' }}> ·</span>}
                  </span>
                ))}
              </div>

              {/* Step pattern */}
              {showSteps && (
                <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace', flexShrink: 0, maxWidth: 200, textAlign: 'right' }}>
                  {stepPattern(scale.intervals)}
                </div>
              )}
            </button>
          );
        })}

        {scales.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b5563', fontSize: 14 }}>
            No scales found for this search / category combination.
          </div>
        )}
      </div>
    </div>
  );
}

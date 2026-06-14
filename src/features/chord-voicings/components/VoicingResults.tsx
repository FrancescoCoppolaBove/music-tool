import { useState } from 'react';
import type { Voicing, VoicingNote, VoicingStyle } from '../types/chord.types';
import PianoKeyboard from './PianoKeyboard';

interface VoicingResultsProps {
  voicings: Voicing[];
  activeStyles: VoicingStyle[];
  chordDisplay: string;
  chordNotes: string[];
}

const STYLE_COLORS: Record<VoicingStyle, string> = {
  closed: '#6366f1',
  drop2: '#3b82f6',
  drop3: '#06b6d4',
  shell: '#10b981',
  rootless: '#84cc16',
  open: '#f59e0b',
  quartal: '#ec4899',
  spread: '#ef4444',
  upperStructure: '#a855f7',
};

export default function VoicingResults({ voicings, activeStyles, chordDisplay, chordNotes }: VoicingResultsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = voicings.filter(v => activeStyles.includes(v.style));

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        No voicings match the selected styles.
      </div>
    );
  }

  const selected = filtered.find(v => v.id === selectedId) ?? filtered[0];

  return (
    <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
      {/* Chord summary */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
        padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Chord</span>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace' }}>{chordDisplay}</div>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Notes</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {chordNotes.map((n, i) => (
              <span key={i} style={{
                padding: '2px 10px', background: i === 0 ? '#f9731620' : '#1c2128',
                border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
                borderRadius: 20, fontSize: 13, color: i === 0 ? '#fb923c' : '#e6edf3',
                fontFamily: 'monospace', fontWeight: i === 0 ? 700 : 400,
              }}>
                {n}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {filtered.length} voicing{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Selected voicing — piano view */}
      {selected && (
        <div style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 8px',
                  background: `${STYLE_COLORS[selected.style]}20`,
                  border: `1px solid ${STYLE_COLORS[selected.style]}`,
                  borderRadius: 4, fontSize: 11, color: STYLE_COLORS[selected.style], fontWeight: 600,
                }}>{selected.styleLabel}</span>
              </div>
              <div style={{ marginTop: 6, color: '#8b949e', fontSize: 13 }}>{selected.description}</div>
              {selected.tip && (
                <div style={{ marginTop: 6, color: '#fbbf24', fontSize: 12, display: 'flex', gap: 6 }}>
                  <span>💡</span>
                  <span>{selected.tip}</span>
                </div>
              )}
            </div>
            <NoteStack notes={selected.notes} />
          </div>
          <PianoKeyboard highlightedNotes={selected.notes} octaveStart={2} octaveEnd={5} width={680} />
        </div>
      )}

      {/* Voicing list */}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(v => {
          const isActive = v.id === (selectedId ?? filtered[0]?.id);
          return (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: isActive ? '#1c2128' : '#0d1117',
                border: `1px solid ${isActive ? STYLE_COLORS[v.style] : '#30363d'}`,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.1s',
              }}
            >
              <span style={{
                padding: '2px 8px', background: `${STYLE_COLORS[v.style]}20`,
                border: `1px solid ${STYLE_COLORS[v.style]}`, borderRadius: 4,
                fontSize: 11, color: STYLE_COLORS[v.style], fontWeight: 600,
                minWidth: 90, textAlign: 'center',
              }}>
                {v.style === 'upperStructure' ? 'UST' : v.style.charAt(0).toUpperCase() + v.style.slice(1)}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: '#c9d1d9' }}>{v.styleLabel}</span>
              <span style={{ fontSize: 12, color: '#8b949e', fontFamily: 'monospace' }}>
                {v.notes.map(n => `${n.note}${n.octave}`).join(' – ')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NoteStack({ notes }: { notes: VoicingNote[] }) {
  const sorted = [...notes].sort((a, b) => b.midi - a.midi);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
      {sorted.map((n, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{n.interval}</span>
          <span style={{
            padding: '1px 8px', background: '#1c2128', borderRadius: 4,
            fontSize: 13, color: '#e6edf3', fontFamily: 'monospace',
            borderLeft: `3px solid ${n.isRoot ? '#f97316' : '#3b82f6'}`,
          }}>
            {n.note}<span style={{ fontSize: 10, color: '#6b7280' }}>{n.octave}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

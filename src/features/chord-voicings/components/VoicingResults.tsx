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
        padding: '12px 16px',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Chord</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace', lineHeight: 1.1 }}>
            {chordDisplay}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Notes</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {chordNotes.map((n, i) => (
              <span key={i} style={{
                padding: '2px 10px',
                background: i === 0 ? '#f9731620' : '#1c2128',
                border: `1px solid ${i === 0 ? '#f97316' : '#30363d'}`,
                borderRadius: 20, fontSize: 13,
                color: i === 0 ? '#fb923c' : '#e6edf3',
                fontFamily: 'monospace', fontWeight: i === 0 ? 700 : 400,
              }}>
                {n}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
          {filtered.length} voicing{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Selected voicing — piano view */}
      {selected && (
        <div style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
          padding: '16px',
        }}>
          {/* Header: style label + note stack — stack on mobile */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px',
                  background: `${STYLE_COLORS[selected.style]}20`,
                  border: `1px solid ${STYLE_COLORS[selected.style]}`,
                  borderRadius: 4, fontSize: 12, color: STYLE_COLORS[selected.style], fontWeight: 600,
                }}>{selected.styleLabel}</span>
              </div>
              <div style={{ marginTop: 6, color: '#8b949e', fontSize: 13, lineHeight: 1.4 }}>{selected.description}</div>
              {selected.tip && (
                <div style={{ marginTop: 6, color: '#fbbf24', fontSize: 12, display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span>💡</span>
                  <span>{selected.tip}</span>
                </div>
              )}
            </div>
            <NoteStack notes={selected.notes} />
          </div>

          {/* Responsive piano keyboard */}
          <PianoKeyboard highlightedNotes={selected.notes} octaveStart={2} octaveEnd={5} />
        </div>
      )}

      {/* Voicing list */}
      <div style={{ display: 'grid', gap: 6 }}>
        {filtered.map(v => {
          const isActive = v.id === (selectedId ?? filtered[0]?.id);
          const sortedByMidi = [...v.notes].sort((a, b) => a.midi - b.midi);
          const hasMinorNinth = sortedByMidi.some((n, i) =>
            i + 1 < sortedByMidi.length && (sortedByMidi[i + 1].midi - n.midi) === 13
          );
          const intervals = v.notes.map(n => n.interval);
          const hasMaj3 = intervals.includes('3');
          const hasMin7 = intervals.includes('♭7');
          const isDomVoicing = hasMin7;
          const tritoneOk = hasMaj3 && hasMin7;
          return (
            <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => setSelectedId(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: isActive ? '#1c2128' : '#0d1117',
                  border: `1px solid ${isActive ? STYLE_COLORS[v.style] : '#30363d'}`,
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.1s',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{
                  padding: '2px 8px',
                  background: `${STYLE_COLORS[v.style]}20`,
                  border: `1px solid ${STYLE_COLORS[v.style]}`,
                  borderRadius: 4, fontSize: 11, color: STYLE_COLORS[v.style], fontWeight: 600,
                  minWidth: 82, textAlign: 'center', flexShrink: 0,
                }}>
                  {v.style === 'upperStructure' ? 'UST' : v.style.charAt(0).toUpperCase() + v.style.slice(1)}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: '#c9d1d9', minWidth: 80 }}>{v.styleLabel}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {isDomVoicing && (
                    <span style={{ fontSize: 10, color: tritoneOk ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>
                      {tritoneOk ? '✓ tritone' : '⚠ tritone?'}
                    </span>
                  )}
                  {hasMinorNinth && (
                    <span style={{ fontSize: 10, color: '#ef4444' }}>⚠ m9</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace', flexShrink: 0 }}>
                  {v.notes.map(n => `${n.note}${n.octave}`).join(' – ')}
                </span>
              </button>
              {hasMinorNinth && isActive && (
                <div style={{ fontSize: 10, color: '#ef4444', padding: '4px 10px', background: '#7f1d1d22', border: '1px solid #ef444440', borderRadius: 6 }}>
                  ⚠️ Minor 9th interval between adjacent voices — avoid in tonal voicings (Modern Jazz Voicings rule)
                </div>
              )}
              {isDomVoicing && !tritoneOk && isActive && (
                <div style={{ fontSize: 10, color: '#f59e0b', padding: '4px 10px', background: '#78350f22', border: '1px solid #f59e0b40', borderRadius: 6 }}>
                  ⚠️ Missing {!hasMaj3 ? 'major 3rd' : 'minor 7th (♭7)'} — tritone incomplete. Dominant function weakened.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* UST Theory Panel */}
      {activeStyles.includes('upperStructure') && (
        <div style={{ background: '#161b22', border: '1px solid #a855f740', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Upper Structure Triad — construction rules
          </div>
          <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.7 }}>
            <strong style={{ color: '#e6edf3' }}>Lower structure:</strong> Root, 3rd, 7th — the shell voicing that defines chord quality<br />
            <strong style={{ color: '#e6edf3' }}>Upper structure:</strong> Close-position major or minor triad — must contain at least one tension (9, ♯11, 13…)<br />
            <strong style={{ color: '#e6edf3' }}>Separation rule:</strong> Upper triad must sit at least a major 3rd above the top note of the lower structure<br />
            <strong style={{ color: '#e6edf3' }}>Common USTs on G7:</strong> A major (9, ♯11, 13) · B major (3, ♯5, 7) · F♯ minor (♯11, 13, 7) · B♭ minor (♭9, ♭13, ♭7)
          </div>
        </div>
      )}
    </div>
  );
}

function NoteStack({ notes }: { notes: VoicingNote[] }) {
  const sorted = [...notes].sort((a, b) => b.midi - a.midi);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
      {sorted.map((n, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{n.interval}</span>
          <span style={{
            padding: '2px 8px', background: '#1c2128', borderRadius: 4,
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

import { useState, useMemo } from 'react';
import { Note, Scale } from 'tonal';
import { UST_FOR_DOMINANT, PENTA_SUPERIMPOSITIONS } from '../data/artistProfiles';
import { CHROMATIC_ROOTS } from '../data/rhythmicPatterns';
import { NoteChip, SectionLabel } from './shared';

export function HarmonicPalettePanel({ color, selectedRoot, onRootChange }: {
  color: string;
  selectedRoot: string;
  onRootChange: (r: string) => void;
}) {
  const [expandedUST, setExpandedUST] = useState<number | null>(null);
  const [expandedPenta, setExpandedPenta] = useState<number | null>(null);

  const ustNotes = useMemo(() => UST_FOR_DOMINANT.map(ust => {
    const r = Note.transpose(selectedRoot, ust.triadRoot) ?? selectedRoot;
    return Scale.get(`${r} ${ust.triadType === 'M' ? 'major' : 'minor'}`).notes.slice(0, 3);
  }), [selectedRoot]);

  const pentaNotes = useMemo(() => PENTA_SUPERIMPOSITIONS.map(ps => {
    const r = Note.transpose(selectedRoot, ps.intervalFromRoot) ?? selectedRoot;
    return Scale.get(`${r} ${ps.scaleType}`).notes;
  }), [selectedRoot]);

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel text="Harmonic Palette" color={color} />

      {/* Root selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
          Root
        </span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CHROMATIC_ROOTS.map(r => (
            <button key={r} onClick={() => onRootChange(r)} style={{
              width: 37, height: 33, borderRadius: 5,
              border: `1px solid ${selectedRoot === r ? color : '#30363d'}`,
              background: selectedRoot === r ? `${color}18` : '#161b22',
              color: selectedRoot === r ? color : '#6b7280',
              fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Upper Structure Triads */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 10 }}>
          Upper Structure Triads — over {selectedRoot}7
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {UST_FOR_DOMINANT.map((ust, i) => {
            const notes = ustNotes[i];
            const open = expandedUST === i;
            return (
              <button key={i} onClick={() => setExpandedUST(open ? null : i)} style={{
                background: open ? `${color}12` : '#161b22',
                border: `1px solid ${open ? color + '50' : '#30363d'}`,
                borderRadius: 8, padding: '13px 14px',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: open ? color : '#6b7280', fontWeight: 500, marginBottom: 6 }}>
                  {ust.label}
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                  {notes.map(n => <NoteChip key={n} note={n} color={color} />)}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                  → {ust.resultingColor}
                </div>
                {open && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${color}20` }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e', lineHeight: 1.55, marginBottom: 6 }}>
                      {ust.character}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {ust.tensionsAdded.map(t => (
                        <span key={t} style={{ padding: '1px 6px', borderRadius: 3, background: `${color}20`, fontSize: 10, color: `${color}bb`, fontFamily: "'DM Mono', monospace" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pentatonic Superimpositions */}
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 10 }}>
          Pentatonic Superimpositions — over {selectedRoot}m7
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PENTA_SUPERIMPOSITIONS.map((ps, i) => {
            const notes = pentaNotes[i];
            const open = expandedPenta === i;
            return (
              <button key={i} onClick={() => setExpandedPenta(open ? null : i)} style={{
                background: open ? `${color}0c` : '#161b22',
                border: `1px solid ${open ? color + '44' : '#30363d'}`,
                borderRadius: 8, padding: '12px 16px',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: open ? color : '#8b949e', fontWeight: 500, marginBottom: 6 }}>
                    {ps.label}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                    {notes.map(n => <NoteChip key={n} note={n} color={color} />)}
                  </div>
                  {open && (
                    <div style={{ marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.65 }}>
                      {ps.character}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                        {ps.tonesHighlighted.map(t => (
                          <span key={t} style={{ padding: '1px 6px', borderRadius: 3, background: `${color}18`, fontSize: 10, color: `${color}bb`, fontFamily: "'DM Mono', monospace" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', flexShrink: 0, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {ps.scaleType}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

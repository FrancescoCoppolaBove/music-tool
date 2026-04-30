import { useRef, useCallback, useState } from 'react';
import { noteToSemitone } from '@shared/utils/musicTheory';
import type { ScaleMatch } from '../types/scale.types';

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

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? '#6b7280';
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 4, background: '#1c2128', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: '#6b7280', minWidth: 28 }}>{value}%</span>
    </div>
  );
}

interface ScaleResultsProps {
  results: ScaleMatch[];
  parsedNotes: string[];
  rootNote: string;
}

const BATCH_SIZE = 30;

export default function ScaleResults({ results, parsedNotes, rootNote }: ScaleResultsProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount(prev => Math.min(prev + BATCH_SIZE, results.length));
    }
  }, [results.length]);

  if (results.length === 0) return null;

  const visible = results.slice(0, visibleCount);
  const perfect = results.filter(r => r.matchScore === 100 && r.extraNotes.length === 0);
  const allMatch = results.filter(r => r.matchScore === 100 && r.extraNotes.length > 0);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Build a semitone set of parsed notes for highlighting in reference scale
  const parsedSemitones = new Set(parsedNotes.map(n => {
    const s = noteToSemitone(n);
    return s >= 0 ? ((s % 12) + 12) % 12 : -1;
  }).filter(s => s >= 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
        padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Total matches</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>{results.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Perfect (100% + no extras)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{perfect.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>All notes match</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{allMatch.length}</div>
        </div>
        {!rootNote && (
          <div style={{ alignSelf: 'center', fontSize: 12, color: '#6b7280', maxWidth: 260 }}>
            💡 No root note specified — all 12 roots explored. Specify a root to narrow down.
          </div>
        )}
      </div>

      {/* Results */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}
      >
        {visible.map((result, idx) => {
          const color = categoryColor(result.category);
          const isOpen = expanded.has(result.id);
          const isPerfect = result.matchScore === 100 && result.extraNotes.length === 0;

          return (
            <div
              key={result.id}
              style={{
                background: isPerfect ? '#161b22' : '#0d1117',
                border: `1px solid ${isPerfect ? '#10b981' : '#30363d'}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => toggleExpand(result.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ width: 28, fontSize: 11, color: '#4b5563', flexShrink: 0 }}>#{idx + 1}</span>
                <ScoreBar value={result.matchScore} color={color} />
                <span style={{
                  padding: '1px 7px', background: `${color}20`, border: `1px solid ${color}`,
                  borderRadius: 4, fontSize: 10, color, fontWeight: 600,
                  minWidth: 72, textAlign: 'center', flexShrink: 0,
                }}>
                  {result.category}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: '#e6edf3', fontWeight: 600 }}>
                  <span style={{ color: '#f97316', marginRight: 4 }}>{result.root}</span>
                  {result.scaleName}
                </span>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 48 }}>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>covers</div>
                  <div style={{ fontSize: 12, color: '#8b949e' }}>{result.completeness}%</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, minWidth: 40, justifyContent: 'flex-end' }}>
                  {result.missingNotes.length > 0 && (
                    <span style={{ fontSize: 11, color: '#6b7280' }}>-{result.missingNotes.length}</span>
                  )}
                  {result.extraNotes.length > 0 && (
                    <span style={{ fontSize: 11, color: '#ef4444' }}>+{result.extraNotes.length}</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#4b5563' }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1c2128', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {/* Reference scale */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                        Reference: {result.root} {result.scaleName}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {result.referenceScale.map((n, i) => {
                          const nSemitone = noteToSemitone(n);
                          const nNorm = nSemitone >= 0 ? ((nSemitone % 12) + 12) % 12 : -1;
                          const inInput = parsedSemitones.has(nNorm);
                          return (
                            <span key={i} style={{
                              padding: '3px 8px',
                              background: inInput ? `${color}20` : '#1c2128',
                              border: `1px solid ${inInput ? color : '#30363d'}`,
                              borderRadius: 4, fontSize: 12,
                              color: inInput ? color : '#4b5563',
                              fontFamily: 'monospace',
                              fontWeight: inInput ? 700 : 400,
                            }}>
                              {n}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Matched */}
                    <div style={{ minWidth: 130 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                        ✅ Matched ({result.matchedNotes.length})
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {result.matchedNotes.map((n, i) => (
                          <span key={i} style={{
                            padding: '2px 7px', background: '#10b98120', border: '1px solid #10b981',
                            borderRadius: 4, fontSize: 12, color: '#10b981', fontFamily: 'monospace',
                          }}>{n}</span>
                        ))}
                      </div>
                    </div>

                    {/* Missing */}
                    {result.missingNotes.length > 0 && (
                      <div style={{ minWidth: 120 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                          ⬜ Missing ({result.missingNotes.length})
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {result.missingNotes.map((n, i) => (
                            <span key={i} style={{
                              padding: '2px 7px', background: '#1c2128', border: '1px solid #30363d',
                              borderRadius: 4, fontSize: 12, color: '#6b7280', fontFamily: 'monospace',
                            }}>{n}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extra */}
                    {result.extraNotes.length > 0 && (
                      <div style={{ minWidth: 120 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                          ⚠️ Outside scale ({result.extraNotes.length})
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {result.extraNotes.map((n, i) => (
                            <span key={i} style={{
                              padding: '2px 7px', background: '#ef444420', border: '1px solid #ef4444',
                              borderRadius: 4, fontSize: 12, color: '#ef4444', fontFamily: 'monospace',
                            }}>{n}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visibleCount < results.length && (
          <div style={{ textAlign: 'center', padding: 12, color: '#6b7280', fontSize: 13 }}>
            ↓ Scroll to load more ({visibleCount} / {results.length})
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef, useCallback, useState } from 'react';
import { Note } from 'tonal';
import type { ScaleMatch } from '../types/scale.types';

const CATEGORY_COLORS: Record<string, string> = {
  Diatonic:   '#3b82f6',
  Modal:      '#8b5cf6',
  Minor:      '#06b6d4',
  Major:      '#10b981',
  Jazz:       '#f59e0b',
  Bebop:      '#f97316',
  Symmetric:  '#ec4899',
  Pentatonic: '#84cc16',
  Blues:      '#6366f1',
  Exotic:     '#ef4444',
  Other:      '#6b7280',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? '#6b7280';
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div style={{
        width: 80,
        height: 8,
        background: '#21262d',
        borderRadius: 4,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 12,
        color: '#8b949e',
        minWidth: 32,
        fontFamily: 'monospace',
      }}>
        {value}%
      </span>
    </div>
  );
}

function NotePill({
  note,
  variant,
}: {
  note: string;
  variant: 'match' | 'missing' | 'extra' | 'inactive' | 'highlight';
}) {
  const styles: Record<string, React.CSSProperties> = {
    match:     { background: '#10b98120', border: '1px solid #10b981', color: '#10b981' },
    missing:   { background: '#1c2128',   border: '1px solid #30363d', color: '#6b7280' },
    extra:     { background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444' },
    inactive:  { background: '#1c2128',   border: '1px solid #21262d', color: '#4b5563' },
    highlight: { background: '#7c3aed20', border: '1px solid #7c3aed', color: '#c4b5fd', fontWeight: 600 },
  };
  return (
    <span style={{
      padding: '3px 9px',
      borderRadius: 5,
      fontSize: 12,
      fontFamily: 'monospace',
      letterSpacing: '0.02em',
      ...styles[variant],
    }}>
      {note}
    </span>
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
  const perfect  = results.filter(r => r.matchScore === 100 && r.extraNotes.length === 0);
  const allMatch = results.filter(r => r.matchScore === 100 && r.extraNotes.length > 0);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const parsedPcs = new Set<number>(
    parsedNotes
      .map(n => Note.get(n).chroma ?? -1)
      .filter((pc): pc is number => pc >= 0),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>

      {/* ── Summary bar ── */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Total matches</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', lineHeight: 1 }}>{results.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Perfect (100% + no extras)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', lineHeight: 1 }}>{perfect.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>All notes match</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>{allMatch.length}</div>
        </div>
        {!rootNote && (
          <div style={{ fontSize: 12, color: '#6b7280', maxWidth: 260 }}>
            💡 No root note — all 12 roots explored. Specify a root to narrow down.
          </div>
        )}
      </div>

      {/* ── Results list ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ maxHeight: 640, overflowY: 'auto' }}
      >
        {visible.map((result, idx) => {
          const color     = categoryColor(result.category);
          const isOpen    = expanded.has(result.id);
          const isPerfect = result.matchScore === 100 && result.extraNotes.length === 0;

          return (
            <div
              key={result.id}
              style={{
                background: isPerfect ? '#161b22' : '#0d1117',
                border: `1px solid ${isPerfect ? color + '60' : '#21262d'}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 4,
                flexShrink: 0,   /* guard if parent ever becomes flex */
              }}
            >
              {/* ── Collapsed row ── */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(result.id)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleExpand(result.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  minHeight: 48,
                  boxSizing: 'border-box',
                }}
              >
                {/* Rank */}
                <span style={{
                  width: 26,
                  fontSize: 11,
                  color: '#4b5563',
                  flexShrink: 0,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                }}>
                  #{idx + 1}
                </span>

                {/* Score bar */}
                <ScoreBar value={result.matchScore} color={color} />

                {/* Category chip */}
                <span style={{
                  padding: '2px 8px',
                  background: `${color}20`,
                  border: `1px solid ${color}60`,
                  borderRadius: 4,
                  fontSize: 10,
                  color,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  letterSpacing: '0.03em',
                }}>
                  {result.category}
                </span>

                {/* Scale name */}
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: '#e6edf3',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}>
                  <span style={{ color: '#f97316', marginRight: 5 }}>{result.root}</span>
                  {result.scaleName}
                </span>

                {/* Covers % */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: '#4b5563' }}>covers</div>
                  <div style={{ fontSize: 12, color: '#8b949e', fontFamily: 'monospace' }}>
                    {result.completeness}%
                  </div>
                </div>

                {/* Missing / extra counts */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, width: 44, justifyContent: 'flex-end' }}>
                  {result.missingNotes.length > 0 && (
                    <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
                      -{result.missingNotes.length}
                    </span>
                  )}
                  {result.extraNotes.length > 0 && (
                    <span style={{ fontSize: 11, color: '#ef4444', fontFamily: 'monospace' }}>
                      +{result.extraNotes.length}
                    </span>
                  )}
                </div>

                {/* Chevron */}
                <span style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, width: 12 }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>

              {/* ── Expanded panel ── */}
              {isOpen && (
                <div style={{
                  padding: '12px 16px 16px',
                  borderTop: '1px solid #21262d',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}>

                  {/* Interval pattern + accidentals */}
                  {result.intervalPattern && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>Intervals:</span>
                        <code style={{
                          fontSize: 12,
                          color: '#c9d1d9',
                          background: '#1c2128',
                          padding: '2px 10px',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                          letterSpacing: '0.06em',
                          border: '1px solid #30363d',
                        }}>
                          {result.intervalPattern}
                        </code>
                      </div>
                      {(result.sharps > 0 || result.flats > 0) && (
                        <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                          {result.sharps > 0 && (
                            <span style={{ color: '#f59e0b' }}>{result.sharps}♯</span>
                          )}
                          {result.flats > 0 && (
                            <span style={{ color: '#60a5fa' }}>{result.flats}♭</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Note details grid */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

                    {/* Reference scale */}
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                        {result.root} {result.scaleName} — full scale
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {result.referenceScale.map((n, i) => {
                          const pc = Note.get(n).chroma;
                          const inInput = pc !== undefined && pc !== null && parsedPcs.has(pc);
                          return (
                            <NotePill
                              key={i}
                              note={n}
                              variant={inInput ? 'highlight' : 'inactive'}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Matched */}
                    {result.matchedNotes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                          ✅ Matched ({result.matchedNotes.length})
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {result.matchedNotes.map((n, i) => (
                            <NotePill key={i} note={n} variant="match" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing */}
                    {result.missingNotes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                          ⬜ Missing ({result.missingNotes.length})
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {result.missingNotes.map((n, i) => (
                            <NotePill key={i} note={n} variant="missing" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extra */}
                    {result.extraNotes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                          ⚠️ Outside scale ({result.extraNotes.length})
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {result.extraNotes.map((n, i) => (
                            <NotePill key={i} note={n} variant="extra" />
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
          <div style={{
            textAlign: 'center',
            padding: '14px',
            color: '#6b7280',
            fontSize: 13,
            borderTop: '1px solid #21262d',
          }}>
            ↓ Scroll to load more ({visibleCount} / {results.length})
          </div>
        )}
      </div>
    </div>
  );
}

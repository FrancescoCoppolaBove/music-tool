import { useState, useEffect } from 'react';
import type { Level } from './data/types';
import { PHASE_META, getCompletedLessons } from './data/types';
import { ALL_LEVELS } from './data/levels';

interface Props {
  onSelectLesson: (level: Level, subsectionIdx: number) => void;
}

function LevelCard({ level, onSelect, completedIds }: {
  level: Level;
  onSelect: (subsectionIdx: number) => void;
  completedIds: Set<string>;
}) {
  const totalSubs = level.subsections.length;
  const completedCount = level.subsections.filter(s => completedIds.has(s.id)).length;
  const isFullyDone = completedCount === totalSubs && totalSubs > 0;
  const isPartial = completedCount > 0 && !isFullyDone;

  const toolTabs = [...new Set(
    level.subsections.flatMap(s => s.tools.map(t => ({ icon: t.icon, label: t.label })))
  )].slice(0, 3);

  return (
    <div
      onClick={() => onSelect(0)}
      style={{
        background: '#1c2128',
        border: `1px solid ${isFullyDone ? 'rgba(16,185,129,.4)' : '#30363d'}`,
        borderRadius: 12, padding: '14px', cursor: 'pointer',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = isFullyDone ? 'rgba(16,185,129,.4)' : '#30363d')}
    >
      <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 700, marginBottom: 4 }}>
        Livello {level.id}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#e6edf3',
        lineHeight: 1.4, marginBottom: 6,
      }}>
        {level.title}
      </div>
      <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>
        {level.subsections.slice(0, 3).map(s => s.title).join(' · ')}
        {level.subsections.length > 3 ? ' …' : ''}
      </div>
      {toolTabs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {toolTabs.map((t, i) => (
            <span key={i} style={{
              background: 'rgba(124,58,237,.1)', color: '#c4b5fd',
              fontSize: 9, padding: '2px 6px', borderRadius: 8,
            }}>{t.icon} {t.label}</span>
          ))}
        </div>
      )}
      {/* Progress bar */}
      <div style={{ background: '#21262d', borderRadius: 2, height: 3 }}>
        <div style={{
          height: 3, borderRadius: 2,
          background: isFullyDone ? '#10b981' : isPartial ? '#7c3aed' : 'transparent',
          width: `${totalSubs > 0 ? (completedCount / totalSubs) * 100 : 0}%`,
          transition: 'width .3s',
        }} />
      </div>
    </div>
  );
}

export default function HarmoniaDashboard({ onSelectLesson }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompletedIds(getCompletedLessons());
    const handler = () => setCompletedIds(getCompletedLessons());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const phases = ([1, 2, 3, 4] as const);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#e6edf3',
          fontFamily: "'Syne', sans-serif", margin: '0 0 8px',
        }}>
          Corso di Armonia Jazz Moderna
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
          Percorso progressivo in 18 livelli — dal solfeggio di base ai Coltrane changes,<br />
          armonia modale, neo-soul, reharmonization e arrangiamento per band.
        </p>
      </div>

      {/* Phases */}
      {phases.map(phase => {
        const meta = PHASE_META[phase];
        const levels = ALL_LEVELS.filter(l => l.phase === phase);
        const totalSubs = levels.flatMap(l => l.subsections).length;
        const completedSubs = levels.flatMap(l => l.subsections).filter(s => completedIds.has(s.id)).length;

        return (
          <div key={phase} style={{ marginBottom: 36 }}>
            {/* Phase header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              marginBottom: 14,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#7c3aed',
                letterSpacing: '.1em', textTransform: 'uppercase',
              }}>
                ◆ Fase {phase} — {meta.title}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>
                {meta.levelRange} · {meta.duration}
              </div>
              {completedSubs > 0 && (
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>
                  {completedSubs}/{totalSubs} sezioni completate
                </div>
              )}
            </div>

            {/* Level cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(levels.length, 4)}, 1fr)`,
              gap: 10,
            }}>
              {levels.map(level => (
                <LevelCard
                  key={level.id}
                  level={level}
                  completedIds={completedIds}
                  onSelect={idx => onSelectLesson(level, idx)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Resources footer */}
      <div style={{
        marginTop: 16, padding: '16px 20px',
        background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
        fontSize: 12, color: '#4b5563', lineHeight: 1.8,
      }}>
        <strong style={{ color: '#6b7280' }}>Libri di riferimento:</strong>{' '}
        Mark Levine — The Jazz Theory Book · Barrie Nettles / Richard Graf — The Chord Scale Theory &amp; Jazz Harmony · David Berkman — The Jazz Harmony Book · Randy Felts — Reharmonization Techniques
      </div>
    </div>
  );
}

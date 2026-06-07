import React, { useState } from 'react';
import { Flame, Trophy, BarChart3, Calendar, Music2, GitCompare, Music, Scale3d, List, Target, Music4, GitMerge, Music3, Activity } from 'lucide-react';
import { getPracticeLog, getPracticeStreak, type PracticeLog } from '../../shared/hooks/useExerciseScore';
import { storageGet } from '../../shared/utils/storage';

interface StoredStats { bestStreak: number }
type ScoreRecord = { correct: number; total: number };
type DayRecord = Record<string, ScoreRecord>;

const EXERCISE_META: Record<string, { name: string; icon: React.ReactNode }> = {
  'perfect-pitch':      { name: 'Perfect Pitch',         icon: <Music2 size={18} /> },
  'intervals':          { name: 'Intervals',              icon: <GitCompare size={18} /> },
  'chords':             { name: 'Chords',                 icon: <Music size={18} /> },
  'scales':             { name: 'Scales',                 icon: <Scale3d size={18} /> },
  'progressions':       { name: 'Progressions',           icon: <List size={18} /> },
  'degrees':            { name: 'Scale Degrees',          icon: <Target size={18} /> },
  'melodic':            { name: 'Melodic Dictation',      icon: <Music4 size={18} /> },
  'intervals-context':  { name: 'Intervals in Context',   icon: <GitMerge size={18} /> },
  'rhythm':             { name: 'Rhythm Recognition',     icon: <Music3 size={18} /> },
  'bpm':                { name: 'BPM Recognition',        icon: <Activity size={18} /> },
};

const ALL_EXERCISE_IDS = Object.keys(EXERCISE_META);

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayHasActivity(log: PracticeLog, date: string): boolean {
  const day = log[date] as DayRecord | undefined;
  if (!day) return false;
  return (Object.values(day) as ScoreRecord[]).some(s => s.total > 0);
}

function dayTotalQuestions(log: PracticeLog, date: string): number {
  const day = log[date] as DayRecord | undefined;
  if (!day) return 0;
  return (Object.values(day) as ScoreRecord[]).reduce((sum, s) => sum + s.total, 0);
}

export default function PracticeJournalFeature() {
  const [log] = useState<PracticeLog>(() => getPracticeLog());
  const [streak] = useState(() => getPracticeStreak());
  const last30 = getLast30Days();
  const today = todayKey();

  // Per-exercise all-time best streaks
  const exerciseStats = ALL_EXERCISE_IDS.map(id => {
    const saved = storageGet<StoredStats>(`exercise_${id}`, { bestStreak: 0 });

    // Compute all-time totals from log
    let allTimeCorrect = 0;
    let allTimeTotal = 0;
    (Object.values(log) as DayRecord[]).forEach(day => {
      const entry = day[id] as ScoreRecord | undefined;
      if (entry) {
        allTimeCorrect += entry.correct;
        allTimeTotal += entry.total;
      }
    });

    // Days practiced this exercise
    const daysPracticed = Object.keys(log).filter(date => {
      const day = log[date] as DayRecord | undefined;
      const entry = day?.[id] as ScoreRecord | undefined;
      return (entry?.total ?? 0) > 0;
    }).length;

    return {
      id,
      bestStreak: saved.bestStreak,
      allTimeCorrect,
      allTimeTotal,
      accuracy: allTimeTotal > 0 ? Math.round((allTimeCorrect / allTimeTotal) * 100) : null,
      daysPracticed,
      meta: EXERCISE_META[id],
    };
  }).filter(s => s.allTimeTotal > 0 || s.bestStreak > 0);

  // Today's activity
  const todayLog = (log[today] as DayRecord | undefined) ?? {};
  const todayTotal = dayTotalQuestions(log, today);
  const todayCorrect = (Object.values(todayLog) as ScoreRecord[]).reduce((sum, s) => sum + s.correct, 0);

  // All-time totals
  const allEntries = (Object.values(log) as DayRecord[]).flatMap(day => Object.values(day) as ScoreRecord[]);
  const allTimeTotal = allEntries.reduce((sum, s) => sum + s.total, 0);
  const allTimeCorrect = allEntries.reduce((sum, s) => sum + s.correct, 0);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <style>{`
        .pj-card {
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .pj-section-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4b5563;
          margin-bottom: 16px;
        }
        .pj-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }
        .pj-stat-box {
          background: #1c2128;
          border: 1px solid #30363d;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
        }
        .pj-stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #e6edf3;
          line-height: 1;
          margin-bottom: 4px;
        }
        .pj-stat-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }
        .pj-calendar {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .pj-day-dot {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          flex-shrink: 0;
          position: relative;
        }
        .pj-exercise-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #21262d;
        }
        .pj-exercise-row:last-child {
          border-bottom: none;
        }
        .pj-exercise-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #1c2128;
          border: 1px solid #30363d;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          flex-shrink: 0;
        }
        .pj-exercise-name {
          font-size: 14px;
          font-weight: 600;
          color: #e6edf3;
        }
        .pj-exercise-meta {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }
        .pj-exercise-stats {
          margin-left: auto;
          text-align: right;
          flex-shrink: 0;
        }
        .pj-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .pj-empty {
          text-align: center;
          padding: 40px 20px;
          color: #4b5563;
        }
        .pj-empty-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }
        .pj-empty-text {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', margin: 0 }}>Practice Journal</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Track your ear training progress over time</p>
      </div>

      {/* Streak + Summary */}
      <div className="pj-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: streak > 0 ? 'linear-gradient(135deg, #f97316, #dc2626)' : '#1c2128',
            border: `2px solid ${streak > 0 ? '#f97316' : '#30363d'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={24} color={streak > 0 ? '#fff' : '#4b5563'} />
            <span style={{ fontSize: 18, fontWeight: 800, color: streak > 0 ? '#fff' : '#4b5563', lineHeight: 1.2 }}>
              {streak}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>
              {streak === 0 ? 'No streak yet' : streak === 1 ? '1 day streak' : `${streak} day streak`}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              {streak === 0
                ? 'Complete any ear training exercise to start your streak'
                : 'Keep practicing daily to maintain your streak'}
            </div>
          </div>
        </div>

        <div className="pj-stat-grid">
          <div className="pj-stat-box">
            <div className="pj-stat-value" style={{ color: todayTotal > 0 ? '#7c3aed' : '#4b5563' }}>
              {todayTotal}
            </div>
            <div className="pj-stat-label">Questions today</div>
          </div>
          <div className="pj-stat-box">
            <div className="pj-stat-value">
              {todayTotal > 0 ? `${Math.round((todayCorrect / todayTotal) * 100)}%` : '—'}
            </div>
            <div className="pj-stat-label">Today's accuracy</div>
          </div>
          <div className="pj-stat-box">
            <div className="pj-stat-value">{allTimeTotal}</div>
            <div className="pj-stat-label">All-time questions</div>
          </div>
          <div className="pj-stat-box">
            <div className="pj-stat-value">
              {allTimeTotal > 0 ? `${Math.round((allTimeCorrect / allTimeTotal) * 100)}%` : '—'}
            </div>
            <div className="pj-stat-label">All-time accuracy</div>
          </div>
        </div>
      </div>

      {/* 30-day calendar */}
      <div className="pj-card">
        <div className="pj-section-title">
          <Calendar size={12} style={{ display: 'inline', marginRight: 6 }} />
          Last 30 days
        </div>
        <div className="pj-calendar">
          {last30.map(date => {
            const active = dayHasActivity(log, date);
            const isToday = date === today;
            const count = dayTotalQuestions(log, date);
            const intensity = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : 3;
            const colors = ['#1c2128', '#4c1d95', '#6d28d9', '#7c3aed'];
            return (
              <div
                key={date}
                className="pj-day-dot"
                title={`${formatDate(date)}: ${count} questions`}
                style={{
                  background: colors[intensity],
                  border: isToday ? '1px solid #7c3aed' : '1px solid transparent',
                  boxShadow: isToday ? '0 0 0 1px #7c3aed40' : 'none',
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 11, color: '#4b5563' }}>
          <span>Less</span>
          {['#1c2128', '#4c1d95', '#6d28d9', '#7c3aed'].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c, border: '1px solid #30363d' }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Per-exercise breakdown */}
      <div className="pj-card">
        <div className="pj-section-title">
          <BarChart3 size={12} style={{ display: 'inline', marginRight: 6 }} />
          Exercise breakdown
        </div>

        {exerciseStats.length === 0 ? (
          <div className="pj-empty">
            <div className="pj-empty-icon">👂</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>No data yet</div>
            <div className="pj-empty-text">Complete some ear training exercises and your stats will appear here</div>
          </div>
        ) : (
          exerciseStats.map(s => (
            <div key={s.id} className="pj-exercise-row">
              <div className="pj-exercise-icon">{s.meta.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="pj-exercise-name">{s.meta.name}</div>
                <div className="pj-exercise-meta">
                  {s.allTimeTotal > 0
                    ? `${s.allTimeTotal} questions · ${s.daysPracticed} day${s.daysPracticed !== 1 ? 's' : ''} practiced`
                    : `${s.daysPracticed} day${s.daysPracticed !== 1 ? 's' : ''} practiced`}
                </div>
              </div>
              <div className="pj-exercise-stats">
                {s.accuracy !== null && (
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.accuracy >= 70 ? '#22c55e' : s.accuracy >= 50 ? '#f59e0b' : '#ef4444', marginBottom: 4 }}>
                    {s.accuracy}%
                  </div>
                )}
                {s.bestStreak > 0 && (
                  <div className="pj-badge" style={{ background: '#f9731620', color: '#f97316' }}>
                    <Flame size={11} />
                    Best: {s.bestStreak}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
